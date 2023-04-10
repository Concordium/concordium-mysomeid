// TODO:
// - add a role that can mint instead of "owner"
// - add upgrade of the contract.
// - reinstate tests
// - any view functions?
// - allow anybody to mint for themselves.

#![cfg_attr(not(feature = "std"), no_std)]

use core::fmt::Display;

use concordium_cis2::*;
use concordium_std::*;

/// The baseurl for the token metadata, gets appended with the token ID as hex
/// encoding before emitted in the TokenMetadata event.
const TOKEN_METADATA_BASE_URL: &str = "https://api.mysomeid.dev/v1/proof/meta/";

/// List of supported standards by this contract address.
const SUPPORTS_STANDARDS: [StandardIdentifier<'static>; 2] =
    [CIS0_STANDARD_IDENTIFIER, CIS2_STANDARD_IDENTIFIER];

// Types

/// Contract token ID type.
/// To save bytes we use a token ID type limited to a `u32`.
#[derive(Ord, PartialOrd, Eq, PartialEq, Serialize, Clone)]
#[repr(transparent)]
struct ContractTokenId(#[concordium(size_length = 1)] String);

impl schema::SchemaType for ContractTokenId {
    fn get_type() -> crate::schema::Type {
        TokenIdVec::get_type()
    }
}

impl IsTokenId for ContractTokenId {}

impl Display for ContractTokenId {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(&self.0)
    }
}

/// Contract token amount.
/// Since the tokens are non-fungible the total supply of any token will be at
/// most 1 and it is fine to use a small type for representing token amounts.
type ContractTokenAmount = TokenAmountU8;

/// The parameter for the contract function `mint` which mints a number of
/// tokens to a given address.
#[derive(Serial, Deserial, SchemaType)]
struct MintParams {
    /// Owner of the newly minted token.
    owner: AccountAddress,
    token: ContractTokenId,
    #[concordium(size_length = 1)] // i.e., "li"
    platform: String,
    // The data, which includes the proof, challenge, name, linkedin URL.
    #[concordium(size_length = 2)]
    data: Vec<u8>,
}

/// The state for each address.
#[derive(Serial, DeserialWithState, Deletable, StateClone)]
#[concordium(state_parameter = "S")]
struct AddressState<S> {
    /// The tokens owned by this address.
    owned_tokens: StateSet<ContractTokenId, S>,
}

impl<S: HasStateApi> AddressState<S> {
    fn empty(state_builder: &mut StateBuilder<S>) -> Self {
        AddressState {
            owned_tokens: state_builder.new_set(),
        }
    }
}

#[derive(Serial, DeserialWithState, StateClone)]
#[concordium(state_parameter = "S")]
struct TokenState<S: HasStateApi> {
    revoked: bool,
    #[concordium(size_length = 1)]
    platform: String,
    data: StateBox<Vec<u8>, S>,
}

/// The contract state.
// Note: The specification does not specify how to structure the contract state
// and this could be structured in a more space efficient way depending on the use case.
#[derive(Serial, DeserialWithState, StateClone)]
#[concordium(state_parameter = "S")]
struct State<S: HasStateApi> {
    /// The state for each address.
    state: StateMap<AccountAddress, AddressState<S>, S>,
    /// All of the token IDs
    all_tokens: StateMap<ContractTokenId, TokenState<S>, S>,
    /// Map with contract addresses providing implementations of additional
    /// standards.
    implementors: StateMap<StandardIdentifierOwned, Vec<ContractAddress>, S>,
}

/// The parameter type for the contract function `setImplementors`.
/// Takes a standard identifier and list of contract addresses providing
/// implementations of this standard.
#[derive(Debug, Serialize, SchemaType)]
struct SetImplementorsParams {
    /// The identifier for the standard.
    id: StandardIdentifierOwned,
    /// The addresses of the implementors of the standard.
    implementors: Vec<ContractAddress>,
}

/// The custom errors the contract can produce.
#[derive(Serialize, Debug, PartialEq, Eq, Reject, SchemaType)]
enum CustomContractError {
    /// Failed parsing the parameter.
    #[from(ParseError)]
    ParseParams,
    /// Failed logging: Log is full.
    LogFull,
    /// Failed logging: Log is malformed.
    LogMalformed,
    /// Failing to mint new tokens because one of the token IDs already exists
    /// in this contract.
    TokenIdAlreadyExists,
    /// Failed to invoke a contract.
    InvokeContractError,
}

/// Wrapping the custom errors in a type with CIS2 errors.
type ContractError = Cis2Error<CustomContractError>;

type ContractResult<A> = Result<A, ContractError>;

/// Mapping the logging errors to CustomContractError.
impl From<LogError> for CustomContractError {
    fn from(le: LogError) -> Self {
        match le {
            LogError::Full => Self::LogFull,
            LogError::Malformed => Self::LogMalformed,
        }
    }
}

/// Mapping errors related to contract invocations to CustomContractError.
impl<T> From<CallContractError<T>> for CustomContractError {
    fn from(_cce: CallContractError<T>) -> Self {
        Self::InvokeContractError
    }
}

/// Mapping CustomContractError to ContractError
impl From<CustomContractError> for ContractError {
    fn from(c: CustomContractError) -> Self {
        Cis2Error::Custom(c)
    }
}

// Functions for creating, updating and querying the contract state.
impl<S: HasStateApi> State<S> {
    /// Creates a new state with no tokens.
    fn empty(state_builder: &mut StateBuilder<S>) -> Self {
        State {
            state: state_builder.new_map(),
            all_tokens: state_builder.new_map(),
            implementors: state_builder.new_map(),
        }
    }

    /// Mint a new token with a given address as the owner
    fn mint(
        &mut self,
        token: ContractTokenId,
        owner: AccountAddress,
        platform: String,
        data: Vec<u8>,
        state_builder: &mut StateBuilder<S>,
    ) -> ContractResult<()> {
        let entry = self
            .all_tokens
            .entry(token.clone())
            .vacant_or(CustomContractError::TokenIdAlreadyExists)?;
        let token_state = TokenState {
            data: state_builder.new_box(data),
            revoked: false,
            platform,
        };
        entry.insert(token_state);
        let mut owner_state = self
            .state
            .entry(owner)
            .or_insert_with(|| AddressState::empty(state_builder));
        owner_state.owned_tokens.insert(token);
        Ok(())
    }

    fn burn(&mut self, token_id: &ContractTokenId, owner: &Address) -> ContractResult<()> {
        let owner = match owner {
            Address::Account(owner) => owner,
            Address::Contract(_) => {
                return Err(ContractError::InsufficientFunds);
            }
        };
        let mut owner_address_state = self
            .state
            .get_mut(owner)
            .ok_or(ContractError::InsufficientFunds)?;

        let owner_had_the_token = owner_address_state.owned_tokens.remove(token_id);
        ensure!(owner_had_the_token, ContractError::InsufficientFunds);

        if let Some(mut r) = self.all_tokens.get_mut(token_id) {
            r.revoked = true;
            Ok(())
        } else {
            Err(ContractError::InvalidTokenId)
        }
    }

    /// Check that the token ID currently exists in this contract (which means it has not been revoked/burned).
    #[inline(always)]
    fn contains_token(&self, token_id: &ContractTokenId) -> bool {
        self.all_tokens.get(token_id).map_or(false, |t| !t.revoked)
    }

    /// Get the current balance of a given token ID for a given address.
    /// Results in an error if the token ID does not exist in the state.
    /// Since this contract only contains NFTs, the balance will always be
    /// either 1 or 0.
    fn balance(
        &self,
        token_id: &ContractTokenId,
        address: &Address,
    ) -> ContractResult<ContractTokenAmount> {
        ensure!(self.contains_token(token_id), ContractError::InvalidTokenId);
        match address {
            Address::Account(address) => {
                let balance = self
                    .state
                    .get(address)
                    .map(|address_state| u8::from(address_state.owned_tokens.contains(token_id)))
                    .unwrap_or(0);
                Ok(balance.into())
            }
            Address::Contract(_) => Ok(0.into()),
        }
    }

    /// Check if state contains any implementors for a given standard.
    fn have_implementors(&self, std_id: &StandardIdentifierOwned) -> SupportResult {
        if let Some(addresses) = self.implementors.get(std_id) {
            SupportResult::SupportBy(addresses.to_vec())
        } else {
            SupportResult::NoSupport
        }
    }

    /// Set implementors for a given standard.
    fn set_implementors(
        &mut self,
        std_id: StandardIdentifierOwned,
        implementors: Vec<ContractAddress>,
    ) {
        self.implementors.insert(std_id, implementors);
    }
}

/// Build a string from TOKEN_METADATA_BASE_URL appended with the token ID
/// encoded as hex.
fn build_token_metadata_url(token_id: &ContractTokenId, platform: &str, revoked: bool) -> String {
    let mut token_metadata_url = String::from(TOKEN_METADATA_BASE_URL);
    token_metadata_url.push_str(&format!(
        "{}?p={}&r={}",
        token_id,
        platform,
        u8::from(revoked)
    ));
    token_metadata_url
}

// Contract functions

/// Initialize contract instance with no token types initially.
#[init(
    contract = "mysomeid",
    event = "Cis2Event<ContractTokenId, ContractTokenAmount>"
)]
fn contract_init<S: HasStateApi>(
    _ctx: &impl HasInitContext,
    state_builder: &mut StateBuilder<S>,
) -> InitResult<State<S>> {
    // Construct the initial contract state.
    Ok(State::empty(state_builder))
}

#[derive(Serial, SchemaType)]
struct ViewData {
    pub token: ContractTokenId,
    #[concordium(size_length = 1)] // i.e., "li"
    pub platform: String,
    // The data, which includes the proof, challenge, name, linkedin URL.
    #[concordium(size_length = 2)]
    pub data: Vec<u8>,
}

/// View the token data.
#[receive(
    contract = "mysomeid",
    name = "view_data",
    return_value = "Option<ViewData>",
    parameter = "ContractTokenId",
    error = "ContractError"
)]
fn contract_view_data<S: HasStateApi>(
    ctx: &impl HasReceiveContext,
    host: &impl HasHost<State<S>, StateApiType = S>,
) -> ContractResult<Option<ViewData>> {
    let param: ContractTokenId = ctx.parameter_cursor().get()?;
    let token = host.state().all_tokens.get(&param);
    if let Some(token) = token {
        let data = ViewData {
            token: param,
            platform: token.platform.clone(),
            data: token.data.clone(),
        };
        Ok(Some(data))
    } else {
        Ok(None)
    }
}

#[derive(Serial, SchemaType)]
struct ListTokens {
    #[concordium(size_length = 2)]
    pub tokens: Vec<ContractTokenId>,
}

/// View the token data.
#[receive(
    contract = "mysomeid",
    name = "list_owned_tokens",
    return_value = "ListTokens",
    parameter = "AccountAddress",
    error = "ContractError"
)]
fn contract_list_owned_tokens<S: HasStateApi>(
    ctx: &impl HasReceiveContext,
    host: &impl HasHost<State<S>, StateApiType = S>,
) -> ContractResult<ListTokens> {
    let param: AccountAddress = ctx.parameter_cursor().get()?;
    let tokens = host.state().state.get(&param);
    let mut ret = Vec::new();
    if let Some(tokens) = tokens {
        for token in tokens.owned_tokens.iter() {
            ret.push(token.clone());
        }
        Ok(ListTokens { tokens: ret })
    } else {
        Ok(ListTokens { tokens: Vec::new() })
    }
}

/// Mint new tokens with a given address as the owner of these tokens.
/// Can only be called by the contract owner.
/// Logs a `Mint` and a `TokenMetadata` event for each token.
/// The url for the token metadata is the token ID encoded in hex, appended on
/// the `TOKEN_METADATA_BASE_URL`.
///
/// It rejects if:
/// - The sender is not the contract instance owner.
/// - Fails to parse parameter.
/// - Any of the tokens fails to be minted, which could be if:
///     - The minted token ID already exists.
///     - Fails to log Mint event
///     - Fails to log TokenMetadata event
///
/// Note: Can at most mint 32 token types in one call due to the limit on the
/// number of logs a smart contract can produce on each function call.
#[receive(
    contract = "mysomeid",
    name = "mint",
    parameter = "MintParams",
    error = "ContractError",
    enable_logger,
    mutable
)]
fn contract_mint<S: HasStateApi>(
    ctx: &impl HasReceiveContext,
    host: &mut impl HasHost<State<S>, StateApiType = S>,
    logger: &mut impl HasLogger,
) -> ContractResult<()> {
    // Get the contract owner
    let owner = ctx.owner();
    // Get the sender of the transaction
    let sender = ctx.sender();

    ensure!(sender.matches_account(&owner), ContractError::Unauthorized);

    // Parse the parameter.
    let params: MintParams = ctx.parameter_cursor().get()?;

    let (state, builder) = host.state_and_builder();

    // Mint the token in the state.
    state.mint(
        params.token.clone(),
        params.owner,
        params.platform.clone(),
        params.data,
        builder,
    )?;

    // Event for minted NFT.
    logger.log(&Cis2Event::Mint(MintEvent {
        token_id: params.token.clone(),
        amount: ContractTokenAmount::from(1),
        owner: params.owner.into(),
    }))?;

    // Metadata URL for the NFT.
    logger.log(&Cis2Event::TokenMetadata::<_, ContractTokenAmount>(
        TokenMetadataEvent {
            token_id: params.token.clone(),
            metadata_url: MetadataUrl {
                url: build_token_metadata_url(&params.token, &params.platform, false),
                hash: None,
            },
        },
    ))?;
    Ok(())
}

#[receive(
    contract = "mysomeid",
    name = "burn",
    parameter = "ContractTokenId",
    error = "ContractError",
    enable_logger,
    mutable
)]
fn contract_burn<S: HasStateApi>(
    ctx: &impl HasReceiveContext,
    host: &mut impl HasHost<State<S>, StateApiType = S>,
    logger: &mut impl HasLogger,
) -> ContractResult<()> {
    let sender = ctx.sender();

    ensure!(sender.is_account(), ContractError::Unauthorized);

    // Parse the parameter.
    let token_id: ContractTokenId = ctx.parameter_cursor().get()?;

    let state = host.state_mut();

    state.burn(&token_id, &sender)?;

    // Event for minted NFT.
    logger.log(&Cis2Event::Burn(BurnEvent {
        token_id,
        amount: ContractTokenAmount::from(1),
        owner: sender,
    }))?;

    Ok(())
}

type TransferParameter = TransferParams<ContractTokenId, ContractTokenAmount>;

/// Execute a list of token transfers, in the order of the list.
///
/// Logs a `Transfer` event and invokes a receive hook function for every
/// transfer in the list.
///
/// It rejects if:
/// - It fails to parse the parameter.
/// - Any of the transfers fail to be executed, which could be if:
///     - The `token_id` does not exist.
///     - The sender is not the owner of the token, or an operator for this
///       specific `token_id` and `from` address.
///     - The token is not owned by the `from`.
/// - Fails to log event.
/// - Any of the receive hook function calls rejects.
#[receive(
    contract = "mysomeid",
    name = "transfer",
    parameter = "TransferParameter",
    error = "ContractError"
)]
fn contract_transfer<S: HasStateApi>(
    _ctx: &impl HasReceiveContext,
    _host: &impl HasHost<State<S>, StateApiType = S>,
) -> ContractResult<()> {
    Err(ContractError::Unauthorized)
}

/// Enable or disable addresses as operators of the sender address.
/// Logs an `UpdateOperator` event.
///
/// It rejects if:
/// - It fails to parse the parameter.
/// - Fails to log event.
#[receive(
    contract = "mysomeid",
    name = "updateOperator",
    parameter = "UpdateOperatorParams",
    error = "ContractError"
)]
fn contract_update_operator<S: HasStateApi>(
    _ctx: &impl HasReceiveContext,
    _host: &impl HasHost<State<S>, StateApiType = S>,
) -> ContractResult<()> {
    Err(ContractError::Unauthorized)
}

/// Takes a list of queries. Each query is an owner address and some address to
/// check as an operator of the owner address.
///
/// It rejects if:
/// - It fails to parse the parameter.
#[receive(
    contract = "mysomeid",
    name = "operatorOf",
    parameter = "OperatorOfQueryParams",
    return_value = "OperatorOfQueryResponse",
    error = "ContractError"
)]
fn contract_operator_of<S: HasStateApi>(
    ctx: &impl HasReceiveContext,
    _host: &impl HasHost<State<S>, StateApiType = S>,
) -> ContractResult<OperatorOfQueryResponse> {
    // Parse the parameter.
    let params: OperatorOfQueryParams = ctx.parameter_cursor().get()?;
    // Build the response.
    let mut response = Vec::with_capacity(params.queries.len());
    for _ in params.queries {
        response.push(false);
    }
    let result = OperatorOfQueryResponse::from(response);
    Ok(result)
}

/// Parameter type for the CIS-2 function `balanceOf` specialized to the subset
/// of TokenIDs used by this contract.
type ContractBalanceOfQueryParams = BalanceOfQueryParams<ContractTokenId>;
/// Response type for the CIS-2 function `balanceOf` specialized to the subset
/// of TokenAmounts used by this contract.
type ContractBalanceOfQueryResponse = BalanceOfQueryResponse<ContractTokenAmount>;

/// Get the balance of given token IDs and addresses.
///
/// It rejects if:
/// - It fails to parse the parameter.
/// - Any of the queried `token_id` does not exist.
#[receive(
    contract = "mysomeid",
    name = "balanceOf",
    parameter = "ContractBalanceOfQueryParams",
    return_value = "ContractBalanceOfQueryResponse",
    error = "ContractError"
)]
fn contract_balance_of<S: HasStateApi>(
    ctx: &impl HasReceiveContext,
    host: &impl HasHost<State<S>, StateApiType = S>,
) -> ContractResult<ContractBalanceOfQueryResponse> {
    // Parse the parameter.
    let params: ContractBalanceOfQueryParams = ctx.parameter_cursor().get()?;
    // Build the response.
    let mut response = Vec::with_capacity(params.queries.len());
    for query in params.queries {
        // Query the state for balance.
        let amount = host.state().balance(&query.token_id, &query.address)?;
        response.push(amount);
    }
    let result = ContractBalanceOfQueryResponse::from(response);
    Ok(result)
}

/// Parameter type for the CIS-2 function `tokenMetadata` specialized to the
/// subset of TokenIDs used by this contract.
type ContractTokenMetadataQueryParams = TokenMetadataQueryParams<ContractTokenId>;

/// Get the token metadata URLs and checksums given a list of token IDs.
///
/// It rejects if:
/// - It fails to parse the parameter.
/// - Any of the queried `token_id` does not exist.
#[receive(
    contract = "mysomeid",
    name = "tokenMetadata",
    parameter = "ContractTokenMetadataQueryParams",
    return_value = "TokenMetadataQueryResponse",
    error = "ContractError"
)]
fn contract_token_metadata<S: HasStateApi>(
    ctx: &impl HasReceiveContext,
    host: &impl HasHost<State<S>, StateApiType = S>,
) -> ContractResult<TokenMetadataQueryResponse> {
    // Parse the parameter.
    let params: ContractTokenMetadataQueryParams = ctx.parameter_cursor().get()?;
    // Build the response.
    let mut response = Vec::with_capacity(params.queries.len());
    for token_id in params.queries {
        // Check the token exists.
        if let Some(v) = host.state().all_tokens.get(&token_id) {
            let metadata_url = MetadataUrl {
                url: build_token_metadata_url(&token_id, &v.platform, v.revoked),
                hash: None,
            };
            response.push(metadata_url);
        } else {
            return Err(ContractError::InvalidTokenId);
        };
    }
    let result = TokenMetadataQueryResponse::from(response);
    Ok(result)
}

/// Get the supported standards or addresses for a implementation given list of
/// standard identifiers.
///
/// It rejects if:
/// - It fails to parse the parameter.
#[receive(
    contract = "mysomeid",
    name = "supports",
    parameter = "SupportsQueryParams",
    return_value = "SupportsQueryResponse",
    error = "ContractError"
)]
fn contract_supports<S: HasStateApi>(
    ctx: &impl HasReceiveContext,
    host: &impl HasHost<State<S>, StateApiType = S>,
) -> ContractResult<SupportsQueryResponse> {
    // Parse the parameter.
    let params: SupportsQueryParams = ctx.parameter_cursor().get()?;

    // Build the response.
    let mut response = Vec::with_capacity(params.queries.len());
    for std_id in params.queries {
        if SUPPORTS_STANDARDS.contains(&std_id.as_standard_identifier()) {
            response.push(SupportResult::Support);
        } else {
            response.push(host.state().have_implementors(&std_id));
        }
    }
    let result = SupportsQueryResponse::from(response);
    Ok(result)
}

/// Set the addresses for an implementation given a standard identifier and a
/// list of contract addresses.
///
/// It rejects if:
/// - Sender is not the owner of the contract instance.
/// - It fails to parse the parameter.
#[receive(
    contract = "mysomeid",
    name = "setImplementors",
    parameter = "SetImplementorsParams",
    error = "ContractError",
    mutable
)]
fn contract_set_implementor<S: HasStateApi>(
    ctx: &impl HasReceiveContext,
    host: &mut impl HasHost<State<S>, StateApiType = S>,
) -> ContractResult<()> {
    // Authorize the sender.
    ensure!(
        ctx.sender().matches_account(&ctx.owner()),
        ContractError::Unauthorized
    );
    // Parse the parameter.
    let params: SetImplementorsParams = ctx.parameter_cursor().get()?;
    // Update the implementors in the state
    host.state_mut()
        .set_implementors(params.id, params.implementors);
    Ok(())
}

// Tests

// #[concordium_cfg_test]
// mod tests {
//     use super::*;
//     use test_infrastructure::*;

//     const ACCOUNT_0: AccountAddress = AccountAddress([0u8; 32]);
//     const ADDRESS_0: Address = Address::Account(ACCOUNT_0);
//     const ACCOUNT_1: AccountAddress = AccountAddress([1u8; 32]);
//     const ADDRESS_1: Address = Address::Account(ACCOUNT_1);
//     const TOKEN_0: ContractTokenId = TokenIdU32(0);
//     const TOKEN_1: ContractTokenId = TokenIdU32(42);
//     const TOKEN_2: ContractTokenId = TokenIdU32(43);

//     /// Test helper function which creates a contract state with two tokens with
//     /// id `TOKEN_0` and id `TOKEN_1` owned by `ADDRESS_0`
//     fn initial_state<S: HasStateApi>(state_builder: &mut StateBuilder<S>) -> State<S> {
//         let mut state = State::empty(state_builder);
//         state
//             .mint(TOKEN_0, &ADDRESS_0, state_builder)
//             .expect_report("Failed to mint TOKEN_0");
//         state
//             .mint(TOKEN_1, &ADDRESS_0, state_builder)
//             .expect_report("Failed to mint TOKEN_1");
//         state
//     }

//     /// Test initialization succeeds.
//     #[concordium_test]
//     fn test_init() {
//         // Setup the context
//         let ctx = TestInitContext::empty();
//         let mut builder = TestStateBuilder::new();

//         // Call the contract function.
//         let result = contract_init(&ctx, &mut builder);

//         // Check the result
//         let state = result.expect_report("Contract initialization failed");

//         // Check the state
//         // Note. This is rather expensive as an iterator is created and then traversed -
//         // should be avoided when writing smart contracts.
//         claim_eq!(
//             state.all_tokens.iter().count(),
//             0,
//             "No token should be initialized"
//         );
//     }

//     /// Test minting, ensuring the new tokens are owned by the given address and
//     /// the appropriate events are logged.
//     #[concordium_test]
//     fn test_mint() {
//         // Setup the context
//         let mut ctx = TestReceiveContext::empty();
//         ctx.set_sender(ADDRESS_0);
//         ctx.set_owner(ACCOUNT_0);

//         // and parameter.
//         let mut tokens = collections::BTreeSet::new();
//         tokens.insert(TOKEN_0);
//         tokens.insert(TOKEN_1);
//         tokens.insert(TOKEN_2);
//         let parameter = MintParams {
//             tokens,
//             owner: ADDRESS_0,
//         };

//         let parameter_bytes = to_bytes(&parameter);
//         ctx.set_parameter(&parameter_bytes);

//         let mut logger = TestLogger::init();
//         let mut state_builder = TestStateBuilder::new();
//         let state = State::empty(&mut state_builder);
//         let mut host = TestHost::new(state, state_builder);

//         // Call the contract function.
//         let result: ContractResult<()> = contract_mint(&ctx, &mut host, &mut logger);

//         // Check the result
//         claim!(result.is_ok(), "Results in rejection");

//         // Check the state
//         // Note. This is rather expensive as an iterator is created and then traversed -
//         // should be avoided when writing smart contracts.
//         claim_eq!(
//             host.state().all_tokens.iter().count(),
//             3,
//             "Expected three tokens in the state."
//         );

//         let balance0 = host
//             .state()
//             .balance(&TOKEN_0, &ADDRESS_0)
//             .expect_report("Token is expected to exist");
//         claim_eq!(
//             balance0,
//             1.into(),
//             "Tokens should be owned by the given address 0"
//         );

//         let balance1 = host
//             .state()
//             .balance(&TOKEN_1, &ADDRESS_0)
//             .expect_report("Token is expected to exist");
//         claim_eq!(
//             balance1,
//             1.into(),
//             "Tokens should be owned by the given address 0"
//         );

//         let balance2 = host
//             .state()
//             .balance(&TOKEN_2, &ADDRESS_0)
//             .expect_report("Token is expected to exist");
//         claim_eq!(
//             balance2,
//             1.into(),
//             "Tokens should be owned by the given address 0"
//         );

//         // Check the logs
//         claim!(
//             logger.logs.contains(&to_bytes(&Cis2Event::Mint(MintEvent {
//                 owner: ADDRESS_0,
//                 token_id: TOKEN_0,
//                 amount: ContractTokenAmount::from(1),
//             }))),
//             "Expected an event for minting TOKEN_0"
//         );
//         claim!(
//             logger.logs.contains(&to_bytes(&Cis2Event::Mint(MintEvent {
//                 owner: ADDRESS_0,
//                 token_id: TOKEN_1,
//                 amount: ContractTokenAmount::from(1),
//             }))),
//             "Expected an event for minting TOKEN_1"
//         );
//         claim!(
//             logger.logs.contains(&to_bytes(
//                 &Cis2Event::TokenMetadata::<_, ContractTokenAmount>(TokenMetadataEvent {
//                     token_id: TOKEN_0,
//                     metadata_url: MetadataUrl {
//                         url: format!("{}00000000", TOKEN_METADATA_BASE_URL),
//                         hash: None,
//                     },
//                 })
//             )),
//             "Expected an event for token metadata for TOKEN_0"
//         );
//         claim!(
//             logger.logs.contains(&to_bytes(
//                 &Cis2Event::TokenMetadata::<_, ContractTokenAmount>(TokenMetadataEvent {
//                     token_id: TOKEN_1,
//                     metadata_url: MetadataUrl {
//                         url: format!("{}2A000000", TOKEN_METADATA_BASE_URL),
//                         hash: None,
//                     },
//                 })
//             )),
//             "Expected an event for token metadata for TOKEN_1"
//         );
//     }

//     /// Test transfer succeeds, when `from` is the sender.
//     #[concordium_test]
//     fn test_transfer_account() {
//         // Setup the context
//         let mut ctx = TestReceiveContext::empty();
//         ctx.set_sender(ADDRESS_0);

//         // and parameter.
//         let transfer = Transfer {
//             token_id: TOKEN_0,
//             amount: ContractTokenAmount::from(1),
//             from: ADDRESS_0,
//             to: Receiver::from_account(ACCOUNT_1),
//             data: AdditionalData::empty(),
//         };
//         let parameter = TransferParams::from(vec![transfer]);
//         let parameter_bytes = to_bytes(&parameter);
//         ctx.set_parameter(&parameter_bytes);

//         let mut logger = TestLogger::init();
//         let mut state_builder = TestStateBuilder::new();
//         let state = initial_state(&mut state_builder);
//         let mut host = TestHost::new(state, state_builder);

//         // Call the contract function.
//         let result: ContractResult<()> = contract_transfer(&ctx, &mut host, &mut logger);
//         // Check the result.
//         claim!(result.is_ok(), "Results in rejection");

//         // Check the state.
//         let balance0 = host
//             .state()
//             .balance(&TOKEN_0, &ADDRESS_0)
//             .expect_report("Token is expected to exist");
//         let balance1 = host
//             .state()
//             .balance(&TOKEN_0, &ADDRESS_1)
//             .expect_report("Token is expected to exist");
//         let balance2 = host
//             .state()
//             .balance(&TOKEN_1, &ADDRESS_0)
//             .expect_report("Token is expected to exist");
//         claim_eq!(
//             balance0,
//             0.into(),
//             "Token owner balance should be decreased by the transferred amount"
//         );
//         claim_eq!(
//             balance1,
//             1.into(),
//             "Token receiver balance should be increased by the transferred amount"
//         );
//         claim_eq!(
//             balance2,
//             1.into(),
//             "Token receiver balance for token 1 should be the same as before"
//         );

//         // Check the logs.
//         claim_eq!(logger.logs.len(), 1, "Only one event should be logged");
//         claim_eq!(
//             logger.logs[0],
//             to_bytes(&Cis2Event::Transfer(TransferEvent {
//                 from: ADDRESS_0,
//                 to: ADDRESS_1,
//                 token_id: TOKEN_0,
//                 amount: ContractTokenAmount::from(1),
//             })),
//             "Incorrect event emitted"
//         )
//     }

//     /// Test transfer token fails, when sender is neither the owner or an
//     /// operator of the owner.
//     #[concordium_test]
//     fn test_transfer_not_authorized() {
//         // Setup the context
//         let mut ctx = TestReceiveContext::empty();
//         ctx.set_sender(ADDRESS_1);

//         // and parameter.
//         let transfer = Transfer {
//             from: ADDRESS_0,
//             to: Receiver::from_account(ACCOUNT_1),
//             token_id: TOKEN_0,
//             amount: ContractTokenAmount::from(1),
//             data: AdditionalData::empty(),
//         };
//         let parameter = TransferParams::from(vec![transfer]);
//         let parameter_bytes = to_bytes(&parameter);
//         ctx.set_parameter(&parameter_bytes);

//         let mut logger = TestLogger::init();
//         let mut state_builder = TestStateBuilder::new();
//         let state = initial_state(&mut state_builder);
//         let mut host = TestHost::new(state, state_builder);

//         // Call the contract function.
//         let result: ContractResult<()> = contract_transfer(&ctx, &mut host, &mut logger);
//         // Check the result.
//         let err = result.expect_err_report("Expected to fail");
//         claim_eq!(
//             err,
//             ContractError::Unauthorized,
//             "Error is expected to be Unauthorized"
//         )
//     }

//     /// Test transfer succeeds when sender is not the owner, but is an operator
//     /// of the owner.
//     #[concordium_test]
//     fn test_operator_transfer() {
//         // Setup the context
//         let mut ctx = TestReceiveContext::empty();
//         ctx.set_sender(ADDRESS_1);

//         // and parameter.
//         let transfer = Transfer {
//             from: ADDRESS_0,
//             to: Receiver::from_account(ACCOUNT_1),
//             token_id: TOKEN_0,
//             amount: ContractTokenAmount::from(1),
//             data: AdditionalData::empty(),
//         };
//         let parameter = TransferParams::from(vec![transfer]);
//         let parameter_bytes = to_bytes(&parameter);
//         ctx.set_parameter(&parameter_bytes);

//         let mut logger = TestLogger::init();

//         let mut state_builder = TestStateBuilder::new();
//         let mut state = initial_state(&mut state_builder);
//         state.add_operator(&ADDRESS_0, &ADDRESS_1, &mut state_builder);
//         let mut host = TestHost::new(state, state_builder);

//         // Call the contract function.
//         let result: ContractResult<()> = contract_transfer(&ctx, &mut host, &mut logger);

//         // Check the result.
//         claim!(result.is_ok(), "Results in rejection");

//         // Check the state.
//         let balance0 = host
//             .state()
//             .balance(&TOKEN_0, &ADDRESS_0)
//             .expect_report("Token is expected to exist");
//         let balance1 = host
//             .state_mut()
//             .balance(&TOKEN_0, &ADDRESS_1)
//             .expect_report("Token is expected to exist");
//         claim_eq!(
//             balance0,
//             0.into(),
//             "Token owner balance should be decreased by the transferred amount"
//         );
//         claim_eq!(
//             balance1,
//             1.into(),
//             "Token receiver balance should be increased by the transferred amount"
//         );

//         // Check the logs.
//         claim_eq!(logger.logs.len(), 1, "Only one event should be logged");
//         claim_eq!(
//             logger.logs[0],
//             to_bytes(&Cis2Event::Transfer(TransferEvent {
//                 from: ADDRESS_0,
//                 to: ADDRESS_1,
//                 token_id: TOKEN_0,
//                 amount: ContractTokenAmount::from(1),
//             })),
//             "Incorrect event emitted"
//         )
//     }

//     /// Test adding an operator succeeds and the appropriate event is logged.
//     #[concordium_test]
//     fn test_add_operator() {
//         // Setup the context
//         let mut ctx = TestReceiveContext::empty();
//         ctx.set_sender(ADDRESS_0);

//         // and parameter.
//         let update = UpdateOperator {
//             update: OperatorUpdate::Add,
//             operator: ADDRESS_1,
//         };
//         let parameter = UpdateOperatorParams(vec![update]);
//         let parameter_bytes = to_bytes(&parameter);
//         ctx.set_parameter(&parameter_bytes);

//         let mut logger = TestLogger::init();
//         let mut state_builder = TestStateBuilder::new();
//         let state = initial_state(&mut state_builder);
//         let mut host = TestHost::new(state, state_builder);

//         // Call the contract function.
//         let result: ContractResult<()> = contract_update_operator(&ctx, &mut host, &mut logger);

//         // Check the result.
//         claim!(result.is_ok(), "Results in rejection");

//         // Check the state.
//         let is_operator = host.state().is_operator(&ADDRESS_1, &ADDRESS_0);
//         claim!(is_operator, "Account should be an operator");

//         // Checking that `ADDRESS_1` is an operator in the query response of the
//         // `contract_operator_of` function as well.
//         // Setup parameter.
//         let operator_of_query = OperatorOfQuery {
//             address: ADDRESS_1,
//             owner: ADDRESS_0,
//         };

//         let operator_of_query_vector = OperatorOfQueryParams {
//             queries: vec![operator_of_query],
//         };
//         let parameter_bytes = to_bytes(&operator_of_query_vector);

//         ctx.set_parameter(&parameter_bytes);

//         // Checking the return value of the `contract_operator_of` function
//         let result: ContractResult<OperatorOfQueryResponse> = contract_operator_of(&ctx, &host);

//         claim_eq!(
//             result.expect_report("Failed getting result value").0,
//             [true],
//             "Account should be an operator in the query response"
//         );

//         // Check the logs.
//         claim_eq!(logger.logs.len(), 1, "One event should be logged");
//         claim_eq!(
//             logger.logs[0],
//             to_bytes(
//                 &Cis2Event::<ContractTokenId, ContractTokenAmount>::UpdateOperator(
//                     UpdateOperatorEvent {
//                         owner: ADDRESS_0,
//                         operator: ADDRESS_1,
//                         update: OperatorUpdate::Add,
//                     }
//                 )
//             ),
//             "Incorrect event emitted"
//         )
//     }
// }
