#![cfg_attr(not(feature = "std"), no_std)]
use concordium_cis2::*;
use concordium_std::*;

use std::{fmt, num::ParseIntError};

pub fn decode_hex(s: &str) -> Result<Vec<u8>, DecodeHexError> {
    if s.len() % 2 != 0 {
        Err(DecodeHexError::OddLength)
    } else {
        (0..s.len())
            .step_by(2)
            .map(|i| u8::from_str_radix(&s[i..i + 2], 16).map_err(|e| e.into()))
            .collect()
    }
}

const HEX_BYTES: &str = "000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f\
                         202122232425262728292a2b2c2d2e2f303132333435363738393a3b3c3d3e3f\
                         404142434445464748494a4b4c4d4e4f505152535455565758595a5b5c5d5e5f\
                         606162636465666768696a6b6c6d6e6f707172737475767778797a7b7c7d7e7f\
                         808182838485868788898a8b8c8d8e8f909192939495969798999a9b9c9d9e9f\
                         a0a1a2a3a4a5a6a7a8a9aaabacadaeafb0b1b2b3b4b5b6b7b8b9babbbcbdbebf\
                         c0c1c2c3c4c5c6c7c8c9cacbcccdcecfd0d1d2d3d4d5d6d7d8d9dadbdcdddedf\
                         e0e1e2e3e4e5e6e7e8e9eaebecedeeeff0f1f2f3f4f5f6f7f8f9fafbfcfdfeff";

pub fn encode_hex(bytes: &[u8]) -> String {
    bytes
        .iter()
        .map(|&b| unsafe {
            let i = 2 * b as usize;
            HEX_BYTES.get_unchecked(i..i + 2)
        })
        .collect()
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum DecodeHexError {
    OddLength,
    ParseInt(ParseIntError),
}

impl From<ParseIntError> for DecodeHexError {
    fn from(e: ParseIntError) -> Self {
        DecodeHexError::ParseInt(e)
    }
}


impl fmt::Display for DecodeHexError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            DecodeHexError::OddLength => "input string has an odd number of bytes".fmt(f),
            DecodeHexError::ParseInt(e) => e.fmt(f),
        }
    }
}

impl std::error::Error for DecodeHexError {}

// _-------

#[derive(Debug, PartialOrd, Ord, PartialEq, Eq, Hash, Copy, Clone)]
pub struct TokenId(pub [u8; 8]);

impl IsTokenId for TokenId {}

impl schema::SchemaType for TokenId {
    fn get_type() -> schema::Type { schema::Type::ByteList(schema::SizeLength::U8) }
}

/// The `TokenIdU32` is serialized with one byte with the value 4 followed by 4
/// bytes to encode a u32 in little endian.
impl Serial for TokenId {
    fn serial<W: Write>(&self, out: &mut W) -> Result<(), W::Err> {
        out.write_u8(self.0.len() as u8);
        out.write(self.0.as_ref().to_owned().as_slice());
        Ok(())
    }
}

/// The `TokenId` will deserialize one byte ensuring this contains the value
/// 32 and then deserialize a u32 as little endian. It will result in an error if
/// the first byte is not 32.
impl Deserial for TokenId {
    fn deserial<R: Read>(source: &mut R) -> ParseResult<Self> {
        let byte_length = source.read_u8()?;
        if byte_length > 0 {
            let mut bytes: [u8; 8] = [0u8; 8]; 
            source.read(bytes.as_mut());
            Ok(TokenId(bytes))
        } else {    
            Err(ParseError::default())
        }
    }
}

/// Display the token ID as a uppercase hex string
impl fmt::Display for TokenId {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        for byte in self.0 {
            write!(f, "{:02X}", byte)?;
        }
        Ok(())
    }
}

fn str_to_token_id(s: &str) -> Result<[u8; 8], &str> {
    ensure!(s.len() == 8, "Error string is not 8 characters long");
    let mut arr = [0; 8];
    let bytes = s.as_bytes();
    let len = bytes.len().min(8);
    arr[..len].copy_from_slice(&bytes[..len]);
    Ok(arr)
}

fn str_to_challenge(s: &str) -> Result<[u8; 32], &str> {
    ensure!(s.len() == 32, "error string is not 32 characters long");
    let mut arr = [0; 32];
    let bytes = s.as_bytes();
    let len = bytes.len().min(32);
    arr[..len].copy_from_slice(&bytes[..len]);
    Ok(arr)
}

// Convert the hex string to a byte vector
/*fn hexstr_to_token_id(hex_string: &str) -> Result<TokenId, DecodeHexError> {
    let token_id = TokenId(decode_hex(hex_string).unwrap().as_slice().try_into().unwrap());
    
    Ok(token_id)
}*/

/// -----

/// The baseurl for the token metadata, gets appended with the token ID as hex
/// encoding before emitted in the TokenMetadata event.
const TOKEN_METADATA_BASE_URL: &str = "https://api.mysomeid.dev/v1/proof/meta/";

/// List of supported standards by this contract address.
const SUPPORTS_STANDARDS: [StandardIdentifier<'static>; 2] =
    [CIS0_STANDARD_IDENTIFIER, CIS2_STANDARD_IDENTIFIER];

// Types

/// Contract token ID type.
type ContractTokenId = TokenId;

/// Contract token amount.
/// Since the tokens are non-fungible the total supply of any token will be at
/// most 1 and it is fine to use a small type for representing token amounts.
type ContractTokenAmount = TokenAmountU8;

#[derive(Debug, Serialize, Clone, SchemaType)]
pub struct OnChainTokenMetadata {
    #[concordium(size_length = 2)]
    pub platform: String,
    pub revoked: bool,
    pub credential: Credential,
    pub challenge: Challenge,
    pub proofs: Vec<Proof>,
    pub first_name: String,
    pub last_name: String,
    pub user_data: String,
    pub owner: Address,
}

#[derive(Debug, Clone, Copy)]
pub struct Credential(pub [u8; 48]);

impl schema::SchemaType for Credential {
    fn get_type() -> concordium_std::schema::Type { schema::Type::ByteArray(48) }    
}

impl Serial for Credential {
    fn serial<W: Write>(&self, out: &mut W) -> Result<(), W::Err> {
        out.write_u8(self.0.len() as u8);
        out.write(self.0.as_ref().to_owned().as_slice());
        Ok(())
    }
}

impl Deserial for Credential {
    fn deserial<R: Read>(source: &mut R) -> ParseResult<Self> {
        let byte_length = source.read_u8()?;
        if byte_length > 0 {
            let mut bytes: [u8; 48] = [0u8; 48]; 
            source.read(bytes.as_mut());
            Ok(Credential(bytes))
        } else {    
            Err(ParseError::default())
        }
    }
}


#[derive(Debug, Clone, Copy)]
pub struct Challenge(pub [u8; 32]);

impl schema::SchemaType for Challenge {
    fn get_type() -> concordium_std::schema::Type { schema::Type::ByteArray(32) }    
}

impl Serial for Challenge {
    fn serial<W: Write>(&self, out: &mut W) -> Result<(), W::Err> {
        out.write_u8(self.0.len() as u8);
        out.write(self.0.as_ref().to_owned().as_slice());
        Ok(())
    }
}

impl Deserial for Challenge {
    fn deserial<R: Read>(source: &mut R) -> ParseResult<Self> {
        let byte_length = source.read_u8()?;
        if byte_length > 0 {
            let mut bytes: [u8; 32] = [0u8; 32]; 
            source.read(bytes.as_mut());
            Ok(Challenge(bytes))
        } else {    
            Err(ParseError::default())
        }
    }
}

// -----
// Test
// -----

#[derive(Debug, Clone)]
pub struct Proof(pub (u8, Vec<u8>));

impl schema::SchemaType for Proof {
    fn get_type() -> concordium_std::schema::Type { schema::Type::Pair(Box::new(schema::Type::U8), Box::new(schema::Type::ByteList(schema::SizeLength::U16))) }
}

impl Serial for Proof {
    fn serial<W: Write>(&self, out: &mut W) -> Result<(), W::Err> {
        out.write_u8(self.0.0);
        out.write_u8(self.0.1.len() as u8);
        out.write(self.0.1.as_slice());
        Ok(())
    }
}

impl Deserial for Proof {
    fn deserial<R: Read>(source: &mut R) -> ParseResult<Self> {
        let proofAttr: u8 = source.read_u8()?.into();
        let byte_length: usize = source.read_u8()?.into();
        if byte_length > 0 {
            let mut arr = vec![0u8; byte_length];
            let mut bytes = arr.as_mut_slice();
            source.read(bytes);
            Ok(Proof((proofAttr, bytes.to_vec())))
        } else {    
            Err(ParseError::default())
        }
    }
}

/// The parameter for the contract function `mint` which mints a number of
/// tokens to a given address.
#[derive(Serial, Deserial, SchemaType)]
struct MintParams {
    owner: Address, // Owner of the newly minted tokens.
    token: String, // id of the token to mint.
    platform: String, // Can be 1, l, linked-in, needed to display the platform on the nft image. ( nothing else )
    credential: String,
    challenge: String,
    proofs: Vec<(u8, String)>,
    first_name: String,
    last_name: String,
    user_data: String,
    // No need to store the challenge since it can be reconstructed.
}

/// The parameter for the contract function `burn` 
#[derive(Serial, Deserial, SchemaType)]
struct BurnParams {
    token: String,
}

/// The state for each address.
#[derive(Serial, DeserialWithState, Deletable, StateClone)]
#[concordium(state_parameter = "S")]
struct AddressState<S> {
    /// The tokens owned by this address.
    owned_tokens: StateSet<ContractTokenId, S>,
    /// The address which are currently enabled as operators for this address.
    operators:    StateSet<Address, S>,
}

impl<S: HasStateApi> AddressState<S> {
    fn empty(state_builder: &mut StateBuilder<S>) -> Self {
        AddressState {
            owned_tokens: state_builder.new_set(),
            operators:    state_builder.new_set(),
        }
    }
}

/// The contract state.
// Note: The specification does not specify how to structure the contract state
// and this could be structured in a more space efficient way depending on the use case.
#[derive(Serial, DeserialWithState, StateClone)]
#[concordium(state_parameter = "S")]
struct State<S> {
    /// The state for each address.
    state:        StateMap<Address, AddressState<S>, S>,
    /// All of the token IDs
    all_tokens:   StateSet<ContractTokenId, S>,
    onchain_metadata: StateMap<ContractTokenId, OnChainTokenMetadata, S>,
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
    id:           StandardIdentifierOwned,
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
    
    /// 
    TokenDoesNotExist,

    MintInvalidInput,

    NotAccount,
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
    fn from(_cce: CallContractError<T>) -> Self { Self::InvokeContractError }
}

/// Mapping CustomContractError to ContractError
impl From<CustomContractError> for ContractError {
    fn from(c: CustomContractError) -> Self { Cis2Error::Custom(c) }
}

// Functions for creating, updating and querying the contract state.
impl<S: HasStateApi> State<S> {
    /// Creates a new state with no tokens.
    fn empty(state_builder: &mut StateBuilder<S>) -> Self {
        State {
            state:        state_builder.new_map(),
            all_tokens:   state_builder.new_set(),
            onchain_metadata: state_builder.new_map(),
            implementors: state_builder.new_map(),
        }
    }

    /// Mint a new token with a given address as the owner
    fn mint(
        &mut self,
        token: ContractTokenId,
        owner: &Address,
        platform: &String,
        first_name: &String,
        last_name: &String,
        user_data: &String,
        proofs: &Vec<Proof>,
        credential: Credential,
        challenge: Challenge,
        state_builder: &mut StateBuilder<S>,
    ) -> ContractResult<()> {
        ensure!(self.all_tokens.insert(token), CustomContractError::TokenIdAlreadyExists.into());

        ensure!(platform.len() == 2, CustomContractError::MintInvalidInput.into());
        ensure!(first_name.len() <= 32, CustomContractError::MintInvalidInput.into());
        ensure!(last_name.len() <= 32, CustomContractError::MintInvalidInput.into());
        ensure!(user_data.len() <= 64, CustomContractError::MintInvalidInput.into());

        let mut owner_state =
            self.state.entry(*owner).or_insert_with(|| AddressState::empty(state_builder));

        self.onchain_metadata.insert(token, OnChainTokenMetadata {
            platform: platform.to_string(),
            revoked: false,
            first_name: first_name.to_string(),
            last_name: last_name.to_string(),
            user_data: user_data.to_string(),
            challenge,
            credential,
            proofs: proofs.clone(),
            owner: owner.clone(),
        });

        owner_state.owned_tokens.insert(token);
        Ok(())
    }

    /// Check that the token ID currently exists in this contract.
    #[inline(always)]
    fn contains_token(&self, token_id: &ContractTokenId) -> bool {
        self.all_tokens.contains(token_id)
    }

    fn token_onchain_metadata(&self, token_id: &ContractTokenId) -> ContractResult<OnChainTokenMetadata> {
        ensure!(self.contains_token(token_id), CustomContractError::TokenDoesNotExist.into());
        let meta = self.onchain_metadata.get(token_id).unwrap().clone();
        Ok( meta )
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
        let balance = self
            .state
            .get(address)
            .map(|address_state| u8::from(address_state.owned_tokens.contains(token_id)))
            .unwrap_or(0);
        Ok(balance.into())
    }

    /// Check if a given address is an operator of a given owner address.
    fn is_operator(&self, address: &Address, owner: &Address) -> bool {
        self.state
            .get(owner)
            .map(|address_state| address_state.operators.contains(address))
            .unwrap_or(false)
    }

    /// Update the state with a transfer of some token.
    /// Results in an error if the token ID does not exist in the state or if
    /// the from address have insufficient tokens to do the transfer.
    fn transfer(
        &mut self,
        token_id: &ContractTokenId,
        amount: ContractTokenAmount,
        from: &Address,
        to: &Address,
        state_builder: &mut StateBuilder<S>,
    ) -> ContractResult<()> {
        ensure!(self.contains_token(token_id), ContractError::InvalidTokenId);
        // A zero transfer does not modify the state.
        if amount == 0.into() {
            return Ok(());
        }
        // Since this contract only contains NFTs, no one will have an amount greater
        // than 1. And since the amount cannot be the zero at this point, the
        // address must have insufficient funds for any amount other than 1.
        ensure_eq!(amount, 1.into(), ContractError::InsufficientFunds);

        {
            let mut from_address_state =
                self.state.get_mut(from).ok_or(ContractError::InsufficientFunds)?;
            // Find and remove the token from the owner, if nothing is removed, we know the
            // address did not own the token..
            let from_had_the_token = from_address_state.owned_tokens.remove(token_id);
            ensure!(from_had_the_token, ContractError::InsufficientFunds);
        }

        // Add the token to the new owner.
        let mut to_address_state =
            self.state.entry(*to).or_insert_with(|| AddressState::empty(state_builder));
        to_address_state.owned_tokens.insert(*token_id);
        Ok(())
    }

    fn burn(
        &mut self,
        token_id: &ContractTokenId,
        owner: &Address,
    ) -> ContractResult<()> {
        // ensure_eq!(self.contains_token(token_id), ContractError::InvalidTokenId);
          
        let mut owner_address_state = self.state.get_mut(owner).ok_or(ContractError::InsufficientFunds)?;

        let owner_had_the_token = owner_address_state.owned_tokens.remove(token_id);
        ensure!(owner_had_the_token, ContractError::InsufficientFunds);

        let mut meta = self.onchain_metadata.get_mut(token_id).unwrap().clone();
        meta.revoked = true;
        self.onchain_metadata.insert(*token_id, meta);
        // self.onchain_metadata.insert(key, value)

        Ok(())
    }    

    /// Update the state adding a new operator for a given address.
    /// Succeeds even if the `operator` is already an operator for the
    /// `address`.
    fn add_operator(
        &mut self,
        owner: &Address,
        operator: &Address,
        state_builder: &mut StateBuilder<S>,
    ) {
        let mut owner_state =
            self.state.entry(*owner).or_insert_with(|| AddressState::empty(state_builder));
        owner_state.operators.insert(*operator);
    }

    /// Update the state removing an operator for a given address.
    /// Succeeds even if the `operator` is _not_ an operator for the `address`.
    fn remove_operator(&mut self, owner: &Address, operator: &Address) {
        self.state.entry(*owner).and_modify(|address_state| {
            address_state.operators.remove(operator);
        });
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
fn build_token_metadata_url(token_id: &ContractTokenId, meta: &OnChainTokenMetadata) -> String {
    let mut token_metadata_url = String::from(TOKEN_METADATA_BASE_URL);
    let token_id_str = token_id_to_ascii_string(&token_id.0);
    token_metadata_url.push_str( &token_id_str );
    token_metadata_url.push_str( "?p=" ); 
    token_metadata_url.push_str( &meta.platform );
    if meta.revoked {
        token_metadata_url.push_str( "&r=1" );
    } else {
        token_metadata_url.push_str( "&r=0" );
    }
    token_metadata_url
}

// token_platform
// Contract functions

/// Initialize contract instance with no token types initially.
#[init(contract = "mysomeid", event = "Cis2Event<ContractTokenId, ContractTokenAmount>")]
fn contract_init<S: HasStateApi>(
    _ctx: &impl HasInitContext,
    state_builder: &mut StateBuilder<S>,
) -> InitResult<State<S>> {
    // Construct the initial contract state.
    Ok(State::empty(state_builder))
}

#[derive(Serialize, SchemaType)]
struct ViewAddressState {
    owned_tokens: Vec<ContractTokenId>,
    operators:    Vec<Address>,
}

#[derive(Serialize, SchemaType)]
struct ViewState {
    state:      Vec<(Address, ViewAddressState)>,
    all_tokens: Vec<(String, String)>
    // meta: Vec<(ContractTokenId, OnChainTokenMetadata)>, // Proof data
}

fn token_id_to_ascii_string(slice: &[u8]) -> String {
    let tmp = std::str::from_utf8(slice).unwrap();
    tmp.to_string()
}

/// View function that returns the entire contents of the state. Meant for
/// testing.
#[receive(contract = "mysomeid", name = "view", return_value = "ViewState")]
fn contract_view<S: HasStateApi>(
    _ctx: &impl HasReceiveContext,
    host: &impl HasHost<State<S>, StateApiType = S>,
) -> ReceiveResult<ViewState> {
    let state = host.state();

    let mut inner_state: Vec<(Address, ViewAddressState)> = Vec::new();
    for (k, a_state) in state.state.iter() {
        let owned_tokens = a_state.owned_tokens.iter().map(|x| *x).collect();
        let operators = a_state.operators.iter().map(|x| *x).collect();
        inner_state.push((*k, ViewAddressState {
            owned_tokens,
            operators,
        }));
    }
    let all_tokens = state
                                .all_tokens
                                .iter()
                                .map(|x| {
                                    let data = state.onchain_metadata.get(&x).unwrap();
                                    (token_id_to_ascii_string(&x.0), build_token_metadata_url(&x, &data))
                                })
                                .collect();

    /* let meta: Vec<(ContractTokenId, OnChainTokenMetadata)> = state
            .onchain_metadata
            .iter()
            .map(|(key, value)| {
                
                (*key, value.clone())
            })
            .collect(); */

    Ok(ViewState {
        state: inner_state,
        all_tokens,
        // meta,
    })
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
    // let owner = ctx.owner();
    // Get the sender of the transaction
    let sender = ctx.sender();

    // let invoker = ctx.invoker();

    ensure!(sender.is_account(), ContractError::Unauthorized);

    //ensure!(sender.matches_account(&owner), ContractError::Unauthorized);

    // Parse the parameter.
    // println!("asdsad");
    let params: MintParams = ctx.parameter_cursor().get()?;

    let (state, builder) = host.state_and_builder();
    // println!("QQQQ2222");

    // Store the token in the state.
    ensure!(params.token.as_bytes().len() == 8, ContractError::Unauthorized);
    let token_id = TokenId(str_to_token_id(params.token.as_str()).unwrap());
    // println!("QQQQ3333");
    
    let proofs: Vec<Proof> = params.proofs.into_iter().map(|s| Proof((s.0, decode_hex(s.1.as_str()).unwrap()))).collect();
    let credential = Credential(decode_hex(params.credential.as_str()).unwrap().as_slice().try_into().unwrap());

    let challenge = Challenge(decode_hex(params.challenge.as_str()).unwrap().as_slice().try_into().unwrap());

    // println!("QQQQ4444");
    state.mint(token_id, &sender, &params.platform, &params.first_name, &params.last_name, &params.user_data, proofs.as_ref(), credential, challenge, builder)?;

    // Event for minted NFT.
    logger.log(&Cis2Event::Mint(MintEvent {
        token_id,
        amount: ContractTokenAmount::from(1),
        owner: sender,
    }))?;

    // println!("QQQQ6666");
    // Metadata URL for the NFT.
    let url = build_token_metadata_url(&token_id, &OnChainTokenMetadata {
        platform: params.platform,
        proofs,
        first_name: params.first_name,
        last_name: params.last_name,
        user_data: params.user_data,
        credential,
        challenge,
        revoked: false,
        owner: sender,
    });
    println!("QQQQ888 {}", url);

    // println!("Event with url {}", url);
    let metadata_url = MetadataUrl {
        url,
        hash: None
    };
    let event = Cis2Event::TokenMetadata::<_, ContractTokenAmount>(TokenMetadataEvent {
        token_id,
        metadata_url,
    });
    logger.log(&event)?;
    println!("QQQQ999");

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
    error = "ContractError",
    enable_logger,
    mutable
)]
fn contract_transfer<S: HasStateApi>(
    ctx: &impl HasReceiveContext,
    host: &mut impl HasHost<State<S>, StateApiType = S>,
    logger: &mut impl HasLogger,
) -> ContractResult<()> {
    // Parse the parameter.
    let TransferParams(transfers): TransferParameter = ctx.parameter_cursor().get()?;
    // Get the sender who invoked this contract function.
    let sender = ctx.sender();

    for Transfer {
        token_id,
        amount,
        from,
        to,
        data,
    } in transfers
    {
        let (state, builder) = host.state_and_builder();
        // Authenticate the sender for this transfer
        ensure!(from == sender || state.is_operator(&sender, &from), ContractError::Unauthorized);
        // ensure!(false, ContractError::Unauthorized); // Its soulbound

        let to_address = to.address();
        // Update the contract state
        state.transfer(&token_id, amount, &from, &to_address, builder)?;

        // Log transfer event
        let event = Cis2Event::Transfer(TransferEvent {
            token_id,
            amount,
            from,
            to: to_address,
        });
        logger.log(&event)?;

        // If the receiver is a contract: invoke the receive hook function.
        if let Receiver::Contract(address, function) = to {
            let parameter = OnReceivingCis2Params {
                token_id,
                amount,
                from,
                data,
            };
            host.invoke_contract(
                &address,
                &parameter,
                function.as_entrypoint_name(),
                Amount::zero(),
            )?;
        }
    }
    Ok(())
}

#[receive(
    contract = "mysomeid",
    name = "burn",
    parameter = "BurnParams",
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
    let params: BurnParams = ctx.parameter_cursor().get()?;

    let (state, builder) = host.state_and_builder();

    // Mint the token in the state.
    // println!("qqq - burn 4 {}", params.token);
    ensure!(params.token.as_bytes().len() == 8, CustomContractError::ParseParams.into());

    // println!("qqq - burn 4 - ok");

    let token_id = TokenId(str_to_token_id(params.token.as_str()).unwrap());
    state.burn(&token_id, &sender)?;

    Ok(())
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
    error = "ContractError",
    enable_logger,
    mutable
)]
fn contract_update_operator<S: HasStateApi>(
    ctx: &impl HasReceiveContext,
    host: &mut impl HasHost<State<S>, StateApiType = S>,
    logger: &mut impl HasLogger,
) -> ContractResult<()> {
    // Parse the parameter.
    let UpdateOperatorParams(params) = ctx.parameter_cursor().get()?;
    // Get the sender who invoked this contract function.
    let sender = ctx.sender();
    let (state, builder) = host.state_and_builder();
    for param in params {
        // Update the operator in the state.
        match param.update {
            OperatorUpdate::Add => state.add_operator(&sender, &param.operator, builder),
            OperatorUpdate::Remove => state.remove_operator(&sender, &param.operator),
        }

        // Log the appropriate event
        logger.log(&Cis2Event::<ContractTokenId, ContractTokenAmount>::UpdateOperator(
            UpdateOperatorEvent {
                owner:    sender,
                operator: param.operator,
                update:   param.update,
            },
        ))?;
    }

    Ok(())
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
    host: &impl HasHost<State<S>, StateApiType = S>,
) -> ContractResult<OperatorOfQueryResponse> {
    // Parse the parameter.
    let params: OperatorOfQueryParams = ctx.parameter_cursor().get()?;
    // Build the response.
    let mut response = Vec::with_capacity(params.queries.len());
    for query in params.queries {
        let is_operator = host.state().is_operator(&query.address, &query.owner);
        response.push(is_operator);
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
    let params: ContractBalanceOfQueryParams = ctx.parameter_cursor().get()?;
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
    let params: ContractTokenMetadataQueryParams = ctx.parameter_cursor().get()?;
    let mut response = Vec::with_capacity(params.queries.len());
    for token_id in params.queries {
        // Check the token exists.
        ensure!(host.state().contains_token(&token_id), ContractError::InvalidTokenId);
        let platform = host.state().token_onchain_metadata(&token_id).unwrap();
        let metadata_url = MetadataUrl {
            url:  build_token_metadata_url(&token_id, &platform),
            hash: None,
        };
        response.push(metadata_url);
    }
    let result = TokenMetadataQueryResponse::from(response);
    Ok(result)
}


// --------------------
//  Token Proof getter
// --------------------

#[derive(Debug, Serialize)]
pub struct TokenProofQueryParams(pub String);

impl schema::SchemaType for TokenProofQueryParams {
    fn get_type() -> schema::Type {
        String::get_type()
    }
}

#[derive(Debug, Serialize, SchemaType)]
pub struct TokenProofQueryResponse {
    #[concordium(size_length = 2)]
    pub token_id: String,
    #[concordium(size_length = 2)]
    pub platform: String,
    #[concordium(size_length = 2)]
    pub challenge: String,
    #[concordium(size_length = 2)]
    pub credential: String,
    #[concordium(size_length = 2)]
    pub first_name: String,
    #[concordium(size_length = 2)]
    pub last_name: String,
    #[concordium(size_length = 2)]
    pub user_data: String,
    #[concordium(size_length = 2)]
    pub proofs: Vec<(u8, String)>,
    pub owner: Address,
    pub revoked: bool,
}

type ContractProofQueryParams = TokenProofQueryParams;

#[receive(
    contract = "mysomeid",
    name = "proof",
    parameter = "ContractProofQueryParams",
    return_value = "TokenProofQueryResponse",
    error = "ContractError"
)]
fn contract_token_proof<S: HasStateApi>(
    ctx: &impl HasReceiveContext,
    host: &impl HasHost<State<S>, StateApiType = S>,
) -> ContractResult<TokenProofQueryResponse> {
    let params: ContractProofQueryParams = ctx.parameter_cursor().get()?;

    let token_id = TokenId(str_to_token_id(&params.0).unwrap());
   
    let state = host.state();
    ensure!(state.contains_token(&token_id), ContractError::InvalidTokenId);
    
    let metadata = state.token_onchain_metadata(&token_id).unwrap();
    let proofs = metadata.proofs.iter().map(|p| {
        (p.0.0, encode_hex(p.0.1.as_slice()))
    }).collect();

    let result = TokenProofQueryResponse {
        token_id: token_id_to_ascii_string(&token_id.0),
        platform: metadata.platform,
        credential: encode_hex(&metadata.credential.0),
        challenge: encode_hex(&metadata.challenge.0),
        proofs: proofs,
        first_name: metadata.first_name,
        last_name: metadata.last_name,
        user_data: metadata.user_data,
        owner: metadata.owner,
        revoked: metadata.revoked,
    };

    Ok(result)
}

#[derive(Debug, Serialize, SchemaType)]
pub struct OwnTokensResponseTokens {
    #[concordium(size_length = 2)]
    pub token_id: String,
    #[concordium(size_length = 2)]
    pub challenge: String,
    #[concordium(size_length = 2)]
    pub credential: String,
    #[concordium(size_length = 2)]
    pub proofs: Vec<(u8, String)>,
    pub revoked: bool,
}

#[derive(Serialize, SchemaType)]
struct OwnTokensResponse {
    tokens: Vec<(String, OwnTokensResponseTokens)>,
}

#[derive(Serial, Deserial, SchemaType)]
struct OwnTokensParams {
    owner: AccountAddress,
}

#[receive(
    contract = "mysomeid",
    name = "ownTokens",
    parameter = "OwnTokensParams",
    return_value = "OwnTokensResponse"
)]
fn contract_own_tokens<S: HasStateApi>(
    ctx: &impl HasReceiveContext,
    host: &impl HasHost<State<S>, StateApiType = S>,
) -> ReceiveResult<OwnTokensResponse> { 
    let state = host.state();
    let params: OwnTokensParams = ctx.parameter_cursor().get()?;
    let mut result: Vec<(String, OwnTokensResponseTokens)> = Vec::new();

    for (address, address_state) in state.state.iter() {
        if address.matches_account(&params.owner) {
            for (token_id) in address_state.owned_tokens.iter() {
                let metadata = state.onchain_metadata.get(&token_id).unwrap();
                let proofs = metadata.proofs.iter().map(|p| {
                    (p.0.0, encode_hex(p.0.1.as_slice()))
                }).collect();
                result.push((token_id_to_ascii_string(&token_id.0), OwnTokensResponseTokens {
                    token_id: token_id_to_ascii_string(&token_id.0),
                    credential: encode_hex(&metadata.credential.0),
                    challenge: encode_hex(&metadata.challenge.0),
                    proofs,
                    revoked: metadata.revoked,
                }));
            }
        }
    }

    Ok(OwnTokensResponse {
        tokens: result,
    })
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
    ensure!(ctx.sender().matches_account(&ctx.owner()), ContractError::Unauthorized);
    // Parse the parameter.
    let params: SetImplementorsParams = ctx.parameter_cursor().get()?;
    // Update the implementors in the state
    host.state_mut().set_implementors(params.id, params.implementors);
    Ok(())
}

// Tests

#[concordium_cfg_test]
mod tests {
    use super::*;
    // use alloc::vec;
    use test_infrastructure::*;

    const ACCOUNT_0: AccountAddress = AccountAddress([0u8; 32]);
    const ADDRESS_0: Address = Address::Account(ACCOUNT_0);
    const ACCOUNT_1: AccountAddress = AccountAddress([1u8; 32]);
    const ADDRESS_1: Address = Address::Account(ACCOUNT_1);

    const TOKEN_1: ContractTokenId = TokenId([0,0,0,0,0,0,0,2]);
    const TOKEN_2: ContractTokenId = TokenId([0,0,0,0,0,0,0,3]);

    /// Test helper function which creates a contract state with two tokens with
    /// id `TOKEN_0` and id `TOKEN_1` owned by `ADDRESS_0`
    fn initial_state<S: HasStateApi>(state_builder: &mut StateBuilder<S>) -> State<S> {
        let mut state = State::empty(state_builder);

        let token_0 = TokenId(str_to_token_id("a869aef6").unwrap());

        let credential_bytes = decode_hex("97c2491a18d8316a0f73dfd82c5c012d942c91c8f3f8190804297b35458cba170920a35f98add6b27c420dd9d2f63745").unwrap();
        println!("credentialBytes len {}", credential_bytes.len());
        let test_credential = Credential(credential_bytes.as_slice().try_into().unwrap());

        let first_name_proof = Proof(( 1, decode_hex("8b7392977eee55bcba1887579ea372a7254b9150b6fdc1959122d5ee174d1e8a557bcf5dec403c340fe1741fff49944f038e9aa17197a2a53d52dcb483235541").unwrap() ));
        let sur_name_proof = Proof((2,decode_hex("872bce6bec774e86dcc72abbfae211195cc7786e9a851f9f851d1eb5bf197d522bc0c3f364ac6eaf424a296f20ed65f6212d56e7ac274eddfdbe9dcc8f4924c5").unwrap()));
        let country_residense = Proof((3,decode_hex("c38b4f40cf43d4aa9280cee5abe6ff52f0c4e2b72abd655bec54d4349ce352613e3230043cbd65a05d136f0b41aadc159a57beca49b0adb8cb4ed614d439d5d1").unwrap()));

        let mut test_proofs: Vec<Proof> = Vec::new();
        test_proofs.push(first_name_proof);
        test_proofs.push(sur_name_proof);
        test_proofs.push(country_residense);

        let test_challenge_bytes = decode_hex("ae94a1bedd3ad7a4bbb338ffb6f15d3aec7865a2506a2efe2a6bf93956e1a93f").unwrap();
        let test_challenge = Challenge(test_challenge_bytes.as_slice().try_into().unwrap());

        let first_name = "ben".to_string();
        let last_name = "kanobi".to_string();
        let user_data = "1234".to_string();

        state.mint(token_0, &ADDRESS_0, &"li".to_string(), &first_name, &last_name, &user_data, &test_proofs, test_credential, test_challenge, state_builder).expect_report("Failed to mint TOKEN_0");
        state.mint(TOKEN_1, &ADDRESS_0, &"li".to_string(), &first_name, &last_name, &user_data, &test_proofs, test_credential, test_challenge, state_builder).expect_report("Failed to mint TOKEN_1");
        state
    }

    /// Test initialization succeeds.
    #[concordium_test]
    fn test_bytearray_as_token_id() {
        let bytes4: [u8; 8] = [0,0,0,0,0,0,0,3];
        let t = TokenId(bytes4);
    }

    /// Test initialization succeeds.
    #[concordium_test]
    fn test_init() {
        // Setup the context
        let ctx = TestInitContext::empty();
        let mut builder = TestStateBuilder::new();

        // Call the contract function.
        let result = contract_init(&ctx, &mut builder);

        // Check the result
        let state = result.expect_report("Contract initialization failed");

        // Check the state
        // Note. This is rather expensive as an iterator is created and then traversed -
        // should be avoided when writing smart contracts.
        claim_eq!(state.all_tokens.iter().count(), 0, "No token should be initialized");
    }

    /// Test minting, ensuring the new tokens are owned by the given address and
    /// the appropriate events are logged.
    #[concordium_test]
    fn test_mint() {
        // Setup the context
        let mut ctx = TestReceiveContext::empty();
        ctx.set_sender(ADDRESS_0);
        ctx.set_owner(ACCOUNT_0);
        // ctx.set_invoker(ADDRESS_0);
        // let invoker = ctx.sender();

        let TOKEN_0 = TokenId(str_to_token_id("a869aef6").unwrap());
        
        let credential = "97c2491a18d8316a0f73dfd82c5c012d942c91c8f3f8190804297b35458cba170920a35f98add6b27c420dd9d2f63745";

        let mut test_proofs: Vec<(u8, String)> = Vec::new();
        test_proofs.push((1,"8b7392977eee55bcba1887579ea372a7254b9150b6fdc1959122d5ee174d1e8a557bcf5dec403c340fe1741fff49944f038e9aa17197a2a53d52dcb483235541".to_string()));
        test_proofs.push((2,"872bce6bec774e86dcc72abbfae211195cc7786e9a851f9f851d1eb5bf197d522bc0c3f364ac6eaf424a296f20ed65f6212d56e7ac274eddfdbe9dcc8f4924c5".to_string()));
        test_proofs.push((3,"c38b4f40cf43d4aa9280cee5abe6ff52f0c4e2b72abd655bec54d4349ce352613e3230043cbd65a05d136f0b41aadc159a57beca49b0adb8cb4ed614d439d5d1".to_string()));

        // and parameter.
        let parameter = MintParams {
            token: "a869aef6".to_string(),
            owner: ADDRESS_0,
            platform: "li".to_string(),
            first_name: "first".to_string(),
            last_name: "last".to_string(),
            user_data: "user".to_string(),
            credential: credential.to_string(),
            challenge: "ae94a1bedd3ad7a4bbb338ffb6f15d3aec7865a2506a2efe2a6bf93956e1a93f".to_string(),
            proofs: test_proofs,
        };

        let parameter_bytes = to_bytes(&parameter);
        ctx.set_parameter(&parameter_bytes);

        let mut logger = TestLogger::init();
        let mut state_builder = TestStateBuilder::new();
        let state = State::empty(&mut state_builder);
        let mut host = TestHost::new(state, state_builder);

        // Call the contract function.
        let result: ContractResult<()> = contract_mint(&ctx, &mut host, &mut logger);

        // Check the result
        claim!(result.is_ok(), "Results in rejection");

        let own_tokens_params = to_bytes(&OwnTokensParams {
            owner: ACCOUNT_0,
        });
        ctx.set_parameter(&own_tokens_params);

        let own_tokens = contract_own_tokens(&ctx, &mut host);
        let tokens = own_tokens.unwrap().tokens;
        claim_eq!(tokens.len(), 1, "couldnt insert element.");
        
        // let invoker = ctx.invoker();

        // Check the state
        // Note. This is rather expensive as an iterator is created and then traversed -
        // should be avoided when writing smart contracts.
        println!("TOKEN !!{}", host.state().all_tokens.iter().count());
        claim_eq!(host.state().all_tokens.iter().count(), 1, "Expected 1 token in the state.");

        let balance0 =
            host.state().balance(&TOKEN_0, &ADDRESS_0).expect_report("Token is expected to exist");
        claim_eq!(balance0, 1.into(), "Tokens should be owned by the given address 0");

        /*let balance1 =
            host.state().balance(&TOKEN_1, &ADDRESS_0).expect_err("Token is not expected to exist");
        claim_eq!(balance1, 0.into(), "Tokens should be owned by the given address 0");

        let balance2 =
            host.state().balance(&TOKEN_2, &ADDRESS_0).expect_err("InvalidTokenId");
        claim_eq!(balance2, 0.into(), "Tokens should be owned by the given address 0");*/

        // Check the logs
        claim!(
            logger.logs.contains(&to_bytes(&Cis2Event::Mint(MintEvent {
                owner:    ADDRESS_0,
                token_id: TOKEN_0,
                amount:   ContractTokenAmount::from(1),
            }))),
            "Expected an event for minting TOKEN_0"
        );
        /*claim!(
            logger.logs.contains(&to_bytes(&Cis2Event::Mint(MintEvent {
                owner:    ADDRESS_0,
                token_id: TOKEN_1,
                amount:   ContractTokenAmount::from(1),
            }))),
            "Expected an event for minting TOKEN_1"
        );*/

        // Needed to define these again since they are moved before.
        let mut testProofs2: Vec<Proof> = Vec::new();
        let first_name_proof2 = Proof((1, decode_hex("8b7392977eee55bcba1887579ea372a7254b9150b6fdc1959122d5ee174d1e8a557bcf5dec403c340fe1741fff49944f038e9aa17197a2a53d52dcb483235541").unwrap()));
        let sur_name_proof2 = Proof((2, decode_hex("872bce6bec774e86dcc72abbfae211195cc7786e9a851f9f851d1eb5bf197d522bc0c3f364ac6eaf424a296f20ed65f6212d56e7ac274eddfdbe9dcc8f4924c5").unwrap()));
        let country_residense2 = Proof((3,decode_hex("c38b4f40cf43d4aa9280cee5abe6ff52f0c4e2b72abd655bec54d4349ce352613e3230043cbd65a05d136f0b41aadc159a57beca49b0adb8cb4ed614d439d5d1").unwrap()));
        testProofs2.push(first_name_proof2);
        testProofs2.push(sur_name_proof2);
        testProofs2.push(country_residense2);   

        let test_credential = Credential(decode_hex(credential).unwrap().as_slice().try_into().unwrap());

        let test_challenge_bytes = decode_hex("ae94a1bedd3ad7a4bbb338ffb6f15d3aec7865a2506a2efe2a6bf93956e1a93f").unwrap();
        let test_challenge = Challenge(test_challenge_bytes.as_slice().try_into().unwrap());

        let first_name = "ben".to_string();
        let last_name = "kanobi".to_string();
        let user_data = "1234".to_string();

        let metadata = OnChainTokenMetadata {
            platform: "li".to_string(),
            revoked: false,
            first_name,
            last_name,
            user_data,
            credential: test_credential,
            challenge: test_challenge,
            proofs: testProofs2,
            owner: ACCOUNT_0.try_into().unwrap(),
        };
        let url = build_token_metadata_url( &TOKEN_0, &metadata );
        // println!("Logs len {}", logger.logs.len());
        // println!("Logs len {}", logger.logs.get(1).unwrap().to_vec() );
        claim!(
            logger.logs.contains(&to_bytes(&Cis2Event::TokenMetadata::<_, ContractTokenAmount>(
                TokenMetadataEvent {
                    token_id:     TOKEN_0,
                    metadata_url:  MetadataUrl {
                        url,
                        hash: None,
                    },
                }
            ))),
            "Expected an event for token metadata for TOKEN_0"
        );


        let proofQueryParams = to_bytes(&TokenProofQueryParams("a869aef6".to_string()));
        ctx.set_parameter(&proofQueryParams);

        println!("Before getting proof!!!!");

        let token_proof_result = contract_token_proof(&ctx, &mut host);
        claim_eq!(token_proof_result.is_err(), false, "Expected successful token");

        let token_proof = token_proof_result.unwrap();
        println!("ID  {}", token_proof.token_id);
        println!("CHALLENGE {}", token_proof.challenge);
        println!("CREDENTIAL {}", token_proof.credential);
        claim_eq!(token_proof.token_id.len(), 8, "Expected a token id of 8 bytes.");

        claim_eq!(token_proof.challenge.len(), 64, "Expected a challenge of certain length in the state.");
        claim_eq!(token_proof.credential.len(), 96, "Expected credential of 48 bytes");
        // claim_eq!(token_proof.proofs.len(), 0, "Expected 0 proof in list");
        claim_eq!(token_proof.proofs.len(), 3, "Expected 3 proof in list");
        
        /*claim
            logger.logs.contains(&to_bytes(&Cis2Event::TokenMetadata::<_, ContractTokenAmount>(
                TokenMetadataEvent {
                    token_id:     TOKEN_1,
                    metadata_url: MetadataUrl {
                        url:  TOKEN_METADATA_BASE_URL.to_string(),
                        hash: None,
                    },
                }
            ))),
            "Expected an event for token metadata for TOKEN_1"
        );*/
    }

    #[concordium_test]
    fn test_burn() {
        // Setup the context
        let mut ctx = TestReceiveContext::empty();
        ctx.set_sender(ADDRESS_0);
        ctx.set_owner(ACCOUNT_0);

        let token_0_str = "aaaaaaaa";
        let TOKEN_0 = TokenId(str_to_token_id(token_0_str).unwrap());

        let mut test_proofs: Vec<(u8, String)> = Vec::new();
        test_proofs.push((1, "8b7392977eee55bcba1887579ea372a7254b9150b6fdc1959122d5ee174d1e8a557bcf5dec403c340fe1741fff49944f038e9aa17197a2a53d52dcb483235541".to_string()));
        test_proofs.push((2, "872bce6bec774e86dcc72abbfae211195cc7786e9a851f9f851d1eb5bf197d522bc0c3f364ac6eaf424a296f20ed65f6212d56e7ac274eddfdbe9dcc8f4924c5".to_string()));
        test_proofs.push((3, "c38b4f40cf43d4aa9280cee5abe6ff52f0c4e2b72abd655bec54d4349ce352613e3230043cbd65a05d136f0b41aadc159a57beca49b0adb8cb4ed614d439d5d1".to_string()));

        // and parameter.
        let parameter = MintParams {
            token: token_0_str.to_string(),
            owner: ADDRESS_0,
            platform: "li".to_string(),
            first_name: "first".to_string(),
            last_name: "last".to_string(),
            user_data: "123".to_string(),
            credential: "97c2491a18d8316a0f73dfd82c5c012d942c91c8f3f8190804297b35458cba170920a35f98add6b27c420dd9d2f63745".to_string(),
            challenge: "ae94a1bedd3ad7a4bbb338ffb6f15d3aec7865a2506a2efe2a6bf93956e1a93f".to_string(),
            proofs: test_proofs,
        };

        let parameter_bytes = to_bytes(&parameter);
        ctx.set_parameter(&parameter_bytes);

        let mut logger = TestLogger::init();
        let mut state_builder = TestStateBuilder::new();
        let state = State::empty(&mut state_builder);
        let mut host = TestHost::new(state, state_builder);

        // Call the contract function.
        let result: ContractResult<()> = contract_mint(&ctx, &mut host, &mut logger);

        // Check the result
        claim!(result.is_ok(), "Mint failed");

        let meta = host.state().token_onchain_metadata(&TOKEN_0);
        claim!( !meta.is_err(), "Metadata is supposed to exist after mint" );
        claim_eq!(meta.unwrap().revoked, false, "revoked is supposed to be false after minting" );

        let balance0 =
            host.state().balance(&TOKEN_0, &ADDRESS_0).expect_report("Token is expected to exist");
        claim_eq!(balance0, 1.into(), "Token should be owned by the given address after minting.");

        let burn_params = to_bytes(&BurnParams {
            token: token_0_str.to_string(),
        });
        ctx.set_parameter(&burn_params);

        let burn_result: ContractResult<()> = contract_burn(&ctx, &mut host, &mut logger);

        claim!(burn_result.is_ok(), "Burn failed");

        let balance0_after = host.state().balance(&TOKEN_0, &ADDRESS_0).expect_report("Token is expected to exist");
        claim_eq!(balance0_after, 0.into(), "Token balance should be ZERO after burn.");

        let ownTokens_params = to_bytes(&OwnTokensParams { owner: ACCOUNT_0, });
        ctx.set_parameter(&ownTokens_params);
        let ownTokens = contract_own_tokens(&ctx, &mut host);
        let tokens = ownTokens.unwrap().tokens;
        claim_eq!(tokens.len(), 0, "Token are supposed to be 'not owned' after burn.");

        let meta_after = host.state().token_onchain_metadata(&TOKEN_0);
        claim!( !meta_after.is_err(), "Metadata is supposed to exist after burn" );

        claim_eq!(meta_after.unwrap().revoked, true, "revoked is supposed to be true after" );
        
    

        // claim_eq!(host.state().all_tokens.iter().count(), 1, "Expected one token in the state.");
    }


    /// Test transfer succeeds, when `from` is the sender.
    #[concordium_test]
    fn test_transfer_account() {
        let TOKEN_0 = TokenId(str_to_token_id("667376b9").unwrap());

        // Setup the context
        let mut ctx = TestReceiveContext::empty();
        ctx.set_sender(ADDRESS_0);

        // and parameter.
        let transfer = Transfer {
            token_id: TOKEN_0,
            amount:   ContractTokenAmount::from(1),
            from:     ADDRESS_0,
            to:       Receiver::from_account(ACCOUNT_1),
            data:     AdditionalData::empty(),
        };
        let parameter = TransferParams::from(vec![transfer]);
        let parameter_bytes = to_bytes(&parameter);
        ctx.set_parameter(&parameter_bytes);

        let mut logger = TestLogger::init();
        let mut state_builder = TestStateBuilder::new();
        let state = initial_state(&mut state_builder);
        let mut host = TestHost::new(state, state_builder);

        // Call the contract function.
        let result: ContractResult<()> = contract_transfer(&ctx, &mut host, &mut logger);
        // Check the result.
        claim!(result.is_err(), "Results in rejection");

        // Check the state.
        let balance0 = host.state().balance(&TOKEN_0, &ADDRESS_0); // .expect_report("Token is expected to exist");
        claim!(balance0.is_err(), "Expected not to have a balance (1)");

        let balance1 = host.state().balance(&TOKEN_0, &ADDRESS_1); // .expect_report("Token is expected to exist");
        claim!(balance1.is_err(), "Expected not to have a balance (2)");

        let balance2 = host.state().balance(&TOKEN_1, &ADDRESS_0).expect_report("Token is expected to exist");
        // claim!(balance2.is_err(), "Expected not to have a balance (3)");

        /*claim_eq!(
            balance0.unwrap(),
            0.into(),
            "Token owner balance should be decreased by the transferred amount"
        );
        claim_eq!(
            balance1.unwrap(),
            1.into(),
            "Token receiver balance should be increased by the transferred amount"
        );
        claim_eq!(
            balance2.unwrap(),
            1.into(),
            "Token receiver balance for token 1 should be the same as before"
        );*/

        // Check the logs.
        /*claim_eq!(logger.logs.len(), 1, "Only one event should be logged");
        claim_eq!(
            logger.logs[0],
            to_bytes(&Cis2Event::Transfer(TransferEvent {
                from:     ADDRESS_0,
                to:       ADDRESS_1,
                token_id: TOKEN_0,
                amount:   ContractTokenAmount::from(1),
            })),
            "Incorrect event emitted"
        )*/
    }

    /// Test transfer token fails, when sender is neither the owner or an
    /// operator of the owner.
    #[concordium_test]
    fn test_transfer_not_authorized() {
        let TOKEN_0 = TokenId(str_to_token_id("11111111").unwrap());

        // Setup the context
        let mut ctx = TestReceiveContext::empty();
        ctx.set_sender(ADDRESS_1);

        // and parameter.
        let transfer = Transfer {
            from:     ADDRESS_0,
            to:       Receiver::from_account(ACCOUNT_1),
            token_id: TOKEN_0,
            amount:   ContractTokenAmount::from(1),
            data:     AdditionalData::empty(),
        };
        let parameter = TransferParams::from(vec![transfer]);
        let parameter_bytes = to_bytes(&parameter);
        ctx.set_parameter(&parameter_bytes);

        let mut logger = TestLogger::init();
        let mut state_builder = TestStateBuilder::new();
        let state = initial_state(&mut state_builder);
        let mut host = TestHost::new(state, state_builder);

        // Call the contract function.
        let result: ContractResult<()> = contract_transfer(&ctx, &mut host, &mut logger);
        // Check the result.
        let err = result.expect_err_report("Expected to fail");
        claim_eq!(err, ContractError::Unauthorized, "Error is expected to be Unauthorized")
    }

    /// Test transfer succeeds when sender is not the owner, but is an operator
    /// of the owner.
    #[concordium_test]
    fn test_operator_transfer() { // Its soulbound so this should fail.
        let token_0 = "11223344";
        let TOKEN_0 = TokenId(str_to_token_id(token_0).unwrap());

        // Setup the context
        let mut ctx = TestReceiveContext::empty();
        ctx.set_sender(ADDRESS_1);

        // and parameter.
        let transfer = Transfer {
            from:     ADDRESS_0,
            to:       Receiver::from_account(ACCOUNT_1),
            token_id: TOKEN_0,
            amount:   ContractTokenAmount::from(1),
            data:     AdditionalData::empty(),
        };
        let parameter = TransferParams::from(vec![transfer]);
        let parameter_bytes = to_bytes(&parameter);
        ctx.set_parameter(&parameter_bytes);

        let mut logger = TestLogger::init();

        let mut state_builder = TestStateBuilder::new();
        let mut state = initial_state(&mut state_builder);
        state.add_operator(&ADDRESS_0, &ADDRESS_1, &mut state_builder);
        let mut host = TestHost::new(state, state_builder);

        // Call the contract function.
        let result: ContractResult<()> = contract_transfer(&ctx, &mut host, &mut logger);

        // Check the result.
        claim!(result.is_err(), "Results in rejection");

        // Check the state.
       /* let balance0 = host.state().balance(&TOKEN_0, &ADDRESS_0).expect_report("Token is expected to exist");
        let balance1 = host
            .state_mut()
            .balance(&TOKEN_0, &ADDRESS_1)
            .expect_report("Token is expected to exist");
        claim_eq!(
            balance0,
            0.into(),
            "Token owner balance should be decreased by the transferred amount"
        );
        claim_eq!(
            balance1,
            1.into(),
            "Token receiver balance should be increased by the transferred amount"
        );

        // Check the logs.
        claim_eq!(logger.logs.len(), 1, "Only one event should be logged");
        claim_eq!(
            logger.logs[0],
            to_bytes(&Cis2Event::Transfer(TransferEvent {
                from:     ADDRESS_0,
                to:       ADDRESS_1,
                token_id: TOKEN_0,
                amount:   ContractTokenAmount::from(1),
            })),
            "Incorrect event emitted"
        ) */
    }

    /// Test adding an operator succeeds and the appropriate event is logged.
    #[concordium_test]
    fn test_add_operator() {
        let token_0 = "FFAADDEE"; // Hex string
        let TOKEN_0 = TokenId(str_to_token_id(token_0).unwrap());

        // Setup the context
        let mut ctx = TestReceiveContext::empty();
        ctx.set_sender(ADDRESS_0);

        // and parameter.
        let update = UpdateOperator {
            update:   OperatorUpdate::Add,
            operator: ADDRESS_1,
        };
        let parameter = UpdateOperatorParams(vec![update]);
        let parameter_bytes = to_bytes(&parameter);
        ctx.set_parameter(&parameter_bytes);

        let mut logger = TestLogger::init();
        let mut state_builder = TestStateBuilder::new();
        let state = initial_state(&mut state_builder);
        let mut host = TestHost::new(state, state_builder);

        // Call the contract function.
        let result: ContractResult<()> = contract_update_operator(&ctx, &mut host, &mut logger);

        // Check the result.
        claim!(result.is_ok(), "Results in rejection");

        // Check the state.
        let is_operator = host.state().is_operator(&ADDRESS_1, &ADDRESS_0);
        claim!(is_operator, "Account should be an operator");

        // Checking that `ADDRESS_1` is an operator in the query response of the
        // `contract_operator_of` function as well.
        // Setup parameter.
        let operator_of_query = OperatorOfQuery {
            address: ADDRESS_1,
            owner:   ADDRESS_0,
        };

        let operator_of_query_vector = OperatorOfQueryParams {
            queries: vec![operator_of_query],
        };
        let parameter_bytes = to_bytes(&operator_of_query_vector);

        ctx.set_parameter(&parameter_bytes);

        // Checking the return value of the `contract_operator_of` function
        let result: ContractResult<OperatorOfQueryResponse> = contract_operator_of(&ctx, &host);

        claim_eq!(
            result.expect_report("Failed getting result value").0,
            [true],
            "Account should be an operator in the query response"
        );

        // Check the logs.
        claim_eq!(logger.logs.len(), 1, "One event should be logged");
        claim_eq!(
            logger.logs[0],
            to_bytes(&Cis2Event::<ContractTokenId, ContractTokenAmount>::UpdateOperator(
                UpdateOperatorEvent {
                    owner:    ADDRESS_0,
                    operator: ADDRESS_1,
                    update:   OperatorUpdate::Add,
                }
            )),
            "Incorrect event emitted"
        )
    }
}
