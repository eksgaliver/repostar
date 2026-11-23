/**
 * One-off migration for signature requests: a `pending` status, the requested
 * signer, and the timestamps that record the request and the signing.
 * Safe to run twice.
 */
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL ?? Bun.env.DATABASE_URL);

// Enum values cannot be added inside a transaction block, so keep it separate.
await sql.unsafe(`ALTER TYPE document_status ADD VALUE IF NOT EXISTS 'pending'`);

await sql.unsafe(`
ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS signer_user_id uuid REFERENCES users(id) ON DELETE SET NULL
`);

await sql.unsafe(`
ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS signature_requested_at timestamptz
`);

await sql.unsafe(`
ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS signed_at timestamptz
`);

const [check] = await sql.unsafe(`
select count(*)::int as pending from documents where status = 'pending'
`);
console.log("signature request columns ready, pending rows:", check?.pending ?? 0);
await sql.end();