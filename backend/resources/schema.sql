-- Schema for the database maintained by the backend.
-- This is intended to work with PostgreSQL only.

-- Create datatypes for enums to provide type safety.
-- Since this is run on every start of the service
-- we handle the case where the types already exist.
-- This is done by catching the duplicate_object exception, since
-- Postgres does not provide `CREATE TYPE IF NOT EXISTS` like it does
-- for creating tables.

-- Status of a concordium transaction we have submitted.
DO $$ BEGIN
CREATE TYPE concordium_transaction_status AS ENUM (
   'pending',
   'failed',
   'finalized',
   'missing'
   );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Type of a concordium event we keep track of.
DO $$ BEGIN
CREATE TYPE concordium_event_type AS ENUM (
    'mint',
    'burn'
   );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- List of concordium transactions we have submitted.
CREATE TABLE IF NOT EXISTS concordium_transactions (
       id SERIAL8 PRIMARY KEY UNIQUE,
       -- Hash of the transaction we have submitted. This is for indexing,
       -- even though it can be derived from the `tx` field.
       tx_hash BYTEA NOT NULL,
       -- Who this transaction was sent for. This is used for rate limiting. We
       -- use the account index so that it is per account and not per account
       -- address, to account for aliases.
       account_index INT8 NOT NULL,
       -- The transaction serialized as a BlockItem, exactly as it can be
       -- submitted to the chain.
       tx BYTEA NOT NULL,
       -- Timestamp when the transaction was inserted.
       insert_time timestamp with time zone NOT NULL,
       -- Status. Starts as 'pending'.
       status concordium_transaction_status NOT NULL,
       CONSTRAINT concordium_transactions_tx_hash_unique UNIQUE (tx_hash)
       );

-- |Events recorded from the bridge manager contract on Concordium.
CREATE TABLE IF NOT EXISTS concordium_events (
       id INT8 PRIMARY KEY UNIQUE,
       -- Hash of the transaction that logged the event. In principle
       -- a transaction can emit multiple events so this is not unique.
       tx_hash BYTEA NOT NULL,
       -- The type of event.
       event_type concordium_event_type NOT NULL,
       -- Owner of the token that was minted or burned.
       owner BYTEA NOT NULL,
       -- ID of the token that was minted or burned.
       token_id INT8 NOT NULL,
       -- Timestamp of the block in which the transaction resides.
       block_time timestamp with time zone NOT NULL
       );

-- Index for the benefit of the history endpoint.
CREATE INDEX IF NOT EXISTS concordium_events_account_timestamp ON concordium_events (owner, block_time);

-- A type with exactly one value used to make sure there can only be one row in
-- the checkpoints table.
DO $$ BEGIN
CREATE TYPE unit AS ENUM (
   ''
   );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Checkpoints so we know where to continue when restarting.
CREATE TABLE IF NOT EXISTS checkpoints (
       tag unit NOT NULL DEFAULT ('') UNIQUE,
       last_processed_height INT8 NOT NULL
);
