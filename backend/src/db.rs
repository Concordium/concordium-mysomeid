use anyhow::Context;
use concordium_rust_sdk::{
    cis2,
    common::to_bytes,
    smart_contracts::common::AccountAddress,
    types::{
        hashes::TransactionHash,
        queries::BlockInfo,
        transactions::{BlockItem, EncodedPayload},
        AbsoluteBlockHeight, AccountIndex, Address, ContractAddress,
    },
};
use postgres_types::FromSql;
use tokio::task::JoinHandle;
use tokio_postgres::NoTls;

use crate::ProofId;

const SCHEMA: &str = include_str!("../resources/schema.sql");

#[derive(Debug, Copy, Clone, tokio_postgres::types::ToSql, tokio_postgres::types::FromSql)]
#[postgres(name = "concordium_transaction_status")]
#[derive(serde::Serialize, serde::Deserialize)]
pub enum TransactionStatus {
    /// Transaction was added to the database and not yet finalized.
    #[postgres(name = "pending")]
    #[serde(rename = "pending")]
    Pending,
    /// Transaction was finalized.
    #[postgres(name = "failed")]
    #[serde(rename = "failed")]
    Failed,
    /// Transaction was finalized.
    #[postgres(name = "finalized")]
    #[serde(rename = "finalized")]
    Finalized,
    #[postgres(name = "missing")]
    #[serde(rename = "missing")]
    Missing,
}

#[derive(
    Debug,
    tokio_postgres::types::ToSql,
    tokio_postgres::types::FromSql,
    serde::Serialize,
    serde::Deserialize,
)]
#[postgres(name = "concordium_event_type")]
pub enum EventType {
    #[postgres(name = "mint")]
    #[serde(rename = "mint")]
    Mint,
    #[postgres(name = "burn")]
    #[serde(rename = "burn")]
    Burn,
}

pub struct Database {
    pub client:        tokio_postgres::Client,
    connection_handle: JoinHandle<Result<(), tokio_postgres::Error>>,
    insert_tx:         tokio_postgres::Statement,
    insert_event:      tokio_postgres::Statement,
    update_checkpoint: tokio_postgres::Statement,
    mark_transaction:  tokio_postgres::Statement,
}

impl Database {
    pub async fn new(
        config: &tokio_postgres::Config,
    ) -> anyhow::Result<(Option<AbsoluteBlockHeight>, i64, Self)> {
        let (client, connection) = config.connect(NoTls).await?;
        let connection_handle = tokio::spawn(connection);
        client.batch_execute(SCHEMA).await?;
        let insert_tx = client
            .prepare(
                "INSERT INTO concordium_transactions (tx_hash, account_index, tx, insert_time, \
                 status) VALUES ($1, $2, $3, $4, $5) RETURNING id",
            )
            .await?;
        let insert_event = client
            .prepare(
                "INSERT INTO concordium_events (id, tx_hash, event_type, owner, token_id, \
                 block_time) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
            )
            .await?;
        let update_checkpoint = client
            .prepare(
                "INSERT INTO checkpoints (last_processed_height) VALUES ($1) ON CONFLICT (tag) DO \
                 UPDATE SET last_processed_height = $1;",
            )
            .await?;

        let mark_transaction = client
            .prepare("UPDATE concordium_transactions SET status = $2 WHERE tx_hash = $1")
            .await?;

        let starting_height = if let Some(row) = client
            .query_opt("SELECT last_processed_height FROM checkpoints LIMIT 1", &[])
            .await?
        {
            Some(row.try_get::<_, i64>("last_processed_height")? + 1)
        } else {
            None
        };

        let next_id = client
            .query_one("SELECT MAX(id) FROM concordium_events", &[])
            .await?;
        let id = next_id.try_get::<_, Option<i64>>(0)?.map_or(0, |x| x + 1);
        let db = Database {
            client,
            connection_handle,
            insert_tx,
            insert_event,
            update_checkpoint,
            mark_transaction,
        };
        Ok((starting_height.map(|x| (x as u64).into()), id, db))
    }

    pub async fn insert_tx(
        &self,
        sponsoree: AccountIndex,
        tx_hash: TransactionHash,
        tx: &BlockItem<EncodedPayload>,
    ) -> anyhow::Result<()> {
        let tx_data = to_bytes(tx);
        let _ = self
            .client
            .query_opt(&self.insert_tx, &[
                &tx_hash.as_ref(),
                &(sponsoree.index as i64),
                &&tx_data[..],
                &chrono::Utc::now(),
                &TransactionStatus::Pending,
            ])
            .await?;
        Ok(())
    }

    pub async fn mark_transaction(
        &self,
        tx_hash: TransactionHash,
        status: TransactionStatus,
    ) -> anyhow::Result<()> {
        let _ = self
            .client
            .query_opt(&self.mark_transaction, &[&tx_hash.as_ref(), &status])
            .await?;
        Ok(())
    }

    /// Stop the database connection, including killing the background workers.
    pub(crate) async fn stop(self) {
        self.connection_handle.abort();
        match self.connection_handle.await {
            Ok(v) => {
                if let Err(e) = v {
                    log::error!("Database connection task terminated with an error {e:#}.");
                }
            }
            Err(e) => {
                if !e.is_cancelled() {
                    log::error!("Error {e:#} shutting down database connection task.");
                }
            }
        }
    }
}

pub async fn update_checkpoint(
    db_tx: &tokio_postgres::Transaction<'_>,
    statement: &tokio_postgres::Statement,
    processed_height: AbsoluteBlockHeight,
) -> anyhow::Result<()> {
    db_tx
        .query_opt(statement, &[&(processed_height.height as i64)])
        .await?;
    Ok(())
}

#[allow(clippy::too_many_arguments)]
async fn insert_event(
    db_tx: &tokio_postgres::Transaction<'_>,
    statement: &tokio_postgres::Statement,
    id: &mut i64,
    tx_hash: TransactionHash,
    event_type: EventType,
    owner: AccountAddress,
    token_id: ProofId,
    block_time: chrono::DateTime<chrono::Utc>,
) -> anyhow::Result<i64> {
    let assigned_id = db_tx
        .query_one(statement, &[
            &*id,
            &tx_hash.as_ref(),
            &event_type,
            &&owner.0[..],
            &(token_id as i64),
            &block_time,
        ])
        .await?;
    *id += 1;
    Ok(assigned_id.try_get::<_, i64>("id")?)
}

/// Check whether the summary contains any CIS2 events, and if so,
/// parse them and insert them into the `cis2_tokens` table.
pub async fn insert_events(
    db_tx: &tokio_postgres::Transaction<'_>,
    id: &mut i64,
    insert_statement: &tokio_postgres::Statement,
    target_contract: ContractAddress,
    block_time: chrono::DateTime<chrono::Utc>,
    tx_hash: TransactionHash,
    effects: &[(ContractAddress, Vec<cis2::Event>)],
) -> anyhow::Result<()> {
    for (ca, events) in effects {
        if ca != &target_contract {
            continue;
        }
        for event in events {
            match event {
                cis2::Event::Mint {
                    token_id,
                    owner: Address::Account(owner),
                    ..
                } => {
                    let token_id = u64::from_le_bytes(
                        token_id.as_ref()[..]
                            .try_into()
                            .ok()
                            .context("Unexpected token id.")?,
                    );
                    insert_event(
                        db_tx,
                        insert_statement,
                        id,
                        tx_hash,
                        EventType::Mint,
                        *owner,
                        token_id,
                        block_time,
                    )
                    .await?;
                }
                cis2::Event::Burn {
                    token_id,
                    owner: Address::Account(owner),
                    ..
                } => {
                    let token_id = u64::from_le_bytes(
                        token_id.as_ref()[..]
                            .try_into()
                            .ok()
                            .context("Unexpected token id.")?,
                    );
                    insert_event(
                        db_tx,
                        insert_statement,
                        id,
                        tx_hash,
                        EventType::Burn,
                        *owner,
                        token_id,
                        block_time,
                    )
                    .await?;
                }
                cis2::Event::TokenMetadata { .. } => {
                    // do nothing, updating token metadata does not
                    // change token supply.
                }
                _ => {
                    // do nothing. No other events are emitted.
                }
            }
        }
    }
    Ok(())
}

/// Events generated by a smart contract update transaction with the given hash.
pub type TransactionContractEvents = (TransactionHash, Vec<(ContractAddress, Vec<cis2::Event>)>);

pub enum DatabaseOperation {
    InsertBlock {
        block: Box<BlockInfo>,
        txs:   Vec<TransactionContractEvents>,
    },
    InsertTransaction {
        sponsoree: AccountIndex,
        tx_hash:   TransactionHash,
        tx:        BlockItem<EncodedPayload>,
        response:  tokio::sync::oneshot::Sender<()>,
    },
    MarkConcordiumTransaction {
        tx_hash: TransactionHash,
        // If true then the transaction is finalized and failed. If false then it is just
        // finalized.
        status:  TransactionStatus,
    },
}

#[tracing::instrument(level = "debug", skip(action, db))]
async fn insert_into_db(
    db: &mut Database,
    id: &mut i64,
    target_contract: ContractAddress,
    action: DatabaseOperation,
) -> Result<bool, DatabaseOperation> {
    match action {
        DatabaseOperation::InsertBlock { block, txs } => {
            let Ok(db_tx) = db.client.transaction().await else {
                return Err(DatabaseOperation::InsertBlock { block, txs })
            };
            for (tx_hash, effects) in &txs {
                match insert_events(
                    &db_tx,
                    id,
                    &db.insert_event,
                    target_contract,
                    block.block_slot_time,
                    *tx_hash,
                    effects,
                )
                .await
                {
                    Ok(_) => (),
                    Err(e) => {
                        tracing::warn!("Failed database insertion: {e:#}");
                        return Err(DatabaseOperation::InsertBlock { block, txs });
                    }
                }
            }
            if let Err(e) =
                update_checkpoint(&db_tx, &db.update_checkpoint, block.block_height).await
            {
                tracing::warn!("Failed database insertion: {e:#}");
                return Err(DatabaseOperation::InsertBlock { block, txs });
            }
            if let Err(e) = db_tx.commit().await {
                tracing::warn!("Failed database commit: {e:#}");
                return Err(DatabaseOperation::InsertBlock { block, txs });
            }
        }
        DatabaseOperation::InsertTransaction {
            sponsoree,
            tx_hash,
            tx,
            response,
        } => {
            if let Err(e) = db.insert_tx(sponsoree, tx_hash, &tx).await {
                tracing::warn!("Failed database insertion: {e:#}");
                return Err(DatabaseOperation::InsertTransaction {
                    sponsoree,
                    tx_hash,
                    tx,
                    response,
                });
            } else if response.send(()).is_err() {
                return Ok(false);
            }
        }
        DatabaseOperation::MarkConcordiumTransaction { tx_hash, status } => {
            if let Err(e) = db.mark_transaction(tx_hash, status).await {
                tracing::warn!("Failed database insertion: {e:#}");
                return Err(action);
            }
        }
    }
    Ok(true)
}

const MAX_CONNECT_ATTEMPTS: u32 = 5;

async fn try_reconnect(
    config: &tokio_postgres::Config,
    stop_flag: &tokio::sync::watch::Receiver<()>,
) -> anyhow::Result<(Option<AbsoluteBlockHeight>, i64, Database)> {
    let mut i = 1;
    while !stop_flag.has_changed().unwrap_or(true) {
        match Database::new(config).await {
            Ok(db) => return Ok(db),
            Err(e) if i < MAX_CONNECT_ATTEMPTS => {
                let delay = std::time::Duration::from_millis(500 * (1 << i));
                log::warn!(
                    "Could not connect to the database due to {:#}. Reconnecting in {}ms.",
                    e,
                    delay.as_millis()
                );
                tokio::time::sleep(delay).await;
                i += 1;
            }
            Err(e) => {
                log::error!(
                    "Could not connect to the database in {} attempts. Last attempt failed with \
                     reason {:#}.",
                    MAX_CONNECT_ATTEMPTS,
                    e
                );
                return Err(e);
            }
        }
    }
    anyhow::bail!("The service was asked to stop.");
}

#[tracing::instrument(level = "debug", skip(config, db, ops, stop_flag))]
pub async fn handle_database(
    config: tokio_postgres::Config,
    mut db: Database,
    mut id: i64,
    target_contract: ContractAddress,
    mut ops: tokio::sync::mpsc::Receiver<DatabaseOperation>,
    mut stop_flag: tokio::sync::watch::Receiver<()>,
) -> anyhow::Result<()> {
    let mut retry = None;

    let current_id = &mut id;

    // Loop until told to stop. If the stop sender has been dropped
    // treat that as if we need to stop as well.
    loop {
        let next_item = if let Some(v) = retry.take() {
            Some(v)
        } else {
            tokio::select! {
                // Make sure to process all events that are in the queue before shutting down.
                // Thus prioritize getting things from the channel.
                // This only works in combination with the fact that we shut down senders
                // upon receving a kill signal, so the receiver will be drained eventually.
                biased;
                x = ops.recv() => x,
                _ = stop_flag.changed() => None,
            }
        };
        let id_checkpoint = *current_id;
        let Some(action) = next_item else {break};
        match insert_into_db(&mut db, current_id, target_contract, action).await {
            Ok(success) => {
                if success {
                    tracing::trace!("Processed database operation.");
                } else {
                    tracing::warn!("Could not respond to the insert transaction action.");
                }
            }
            Err(action) => {
                *current_id = id_checkpoint;
                let delay = std::time::Duration::from_millis(5000);
                tracing::warn!(
                    "Could not insert into the database. Reconnecting in {}ms.",
                    delay.as_millis()
                );
                tokio::time::sleep(delay).await;
                let new_db = match try_reconnect(&config, &stop_flag).await {
                    Ok(db) => db.2,
                    Err(e) => {
                        ops.close();
                        return Err(e);
                    }
                };
                let old_db = std::mem::replace(&mut db, new_db);
                old_db.connection_handle.abort();
                match old_db.connection_handle.await {
                    Ok(v) => {
                        if let Err(e) = v {
                            tracing::warn!(
                                "Could not correctly stop the old database connection due to: {}.",
                                e
                            );
                        }
                    }
                    Err(e) => {
                        if e.is_panic() {
                            tracing::warn!(
                                "Could not correctly stop the old database connection. The \
                                 connection thread panicked: {e:#}."
                            );
                        } else if !e.is_cancelled() {
                            tracing::warn!("Could not correctly stop the old database connection.");
                        }
                    }
                }
                retry = Some(action);
            }
        }
    }
    ops.close();
    db.stop().await;
    Ok(())
}

#[derive(serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DBEvent {
    id:         i64,
    tx_hash:    TransactionHash,
    event_type: EventType,
    token_id:   ProofId,
    owner:      AccountAddress,
    event_time: chrono::DateTime<chrono::Utc>,
    // The event_time as a unix timestamp in milliseconds.
    timestamp:  u64,
}

#[derive(Debug, thiserror::Error)]
#[error("Unexpected data size.")]
struct IncorrectLength;

/// A helper to parse fixed length byte arrays from the database.
struct Fixed<const N: usize>(pub [u8; N]);

impl<'a, const N: usize> FromSql<'a> for Fixed<N> {
    fn from_sql(
        ty: &postgres_types::Type,
        raw: &'a [u8],
    ) -> Result<Self, Box<dyn std::error::Error + Sync + Send>> {
        let v = <&[u8] as FromSql>::from_sql(ty, raw)?;
        Ok(Fixed(v.try_into().map_err(|_| Box::new(IncorrectLength))?))
    }

    fn accepts(ty: &postgres_types::Type) -> bool { <&[u8] as FromSql>::accepts(ty) }
}

#[derive(Clone, Debug)]
pub struct ReadDatabase {
    pool:                   deadpool_postgres::Pool,
    get_events:             &'static str,
    num_submitted_last_day: &'static str,
}

impl ReadDatabase {
    pub async fn new(config: tokio_postgres::Config, pool_size: usize) -> anyhow::Result<Self> {
        let manager_config = deadpool_postgres::ManagerConfig {
            recycling_method: deadpool_postgres::RecyclingMethod::Verified,
        };
        let manager = deadpool_postgres::Manager::from_config(config, NoTls, manager_config);
        let pool = deadpool_postgres::Pool::builder(manager)
            .create_timeout(Some(std::time::Duration::from_secs(5)))
            .recycle_timeout(Some(std::time::Duration::from_secs(5)))
            .wait_timeout(Some(std::time::Duration::from_secs(5)))
            .max_size(pool_size)
            .runtime(deadpool_postgres::Runtime::Tokio1)
            .build()?;

        let get_events = "SELECT id, tx_hash, event_type, owner, token_id, block_time FROM \
                          concordium_events WHERE owner = $1 AND id <= $2
                 ORDER BY id DESC LIMIT $3;";

        let num_submitted_last_day = "SELECT COUNT(id) FROM concordium_transactions WHERE \
                                      account_index = $1 AND insert_time >= (now() - interval '1 \
                                      day')";

        Ok(Self {
            pool,
            get_events,
            num_submitted_last_day,
        })
    }

    /// Retrieve a list of events for the given owner starting at the given `id`
    /// and returning at most `limit` events. The response is ordered by
    /// decresing `id`.
    pub async fn get_events(
        &self,
        owner: AccountAddress,
        starting_id: Option<i64>,
        limit: u32,
    ) -> anyhow::Result<Vec<DBEvent>> {
        let start = starting_id.unwrap_or(i64::MAX);
        let client = self.pool.get().await?;
        let statement = client.prepare(self.get_events).await?;
        let rows = client
            .query(&statement, &[&&owner.0[..], &start, &(limit as i64)])
            .await?;
        let mut events = Vec::with_capacity(rows.len());
        for row in rows {
            let id = row.try_get("id")?;
            let tx_hash = row.try_get::<_, Fixed<32>>("tx_hash")?.0.into();
            let event_type = row.try_get("event_type")?;
            let owner = AccountAddress(row.try_get::<_, Fixed<32>>("owner")?.0);
            let token_id = row.try_get::<_, i64>("token_id")? as u64;
            let event_time = row.try_get("block_time")?;
            events.push(DBEvent {
                id,
                tx_hash,
                event_type,
                token_id,
                event_time,
                owner,
                timestamp: event_time.timestamp() as u64,
            });
        }
        Ok(events)
    }

    pub async fn get_num_submitted_last_day(&self, owner: AccountIndex) -> anyhow::Result<i64> {
        let client = self.pool.get().await?;
        let statement = client.prepare(self.num_submitted_last_day).await?;
        let row = client
            .query_one(&statement, &[&(owner.index as i64)])
            .await?;
        let num = row.try_get(0)?;
        Ok(num)
    }
}
