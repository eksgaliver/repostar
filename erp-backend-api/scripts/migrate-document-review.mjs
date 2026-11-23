/**
 * One-off migration for the review invite: who reviews, the state of that
 * review, and the note that comes back. Safe to run twice.
 */
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL ?? Bun.env.DATABASE_URL);

await sql.unsafe(`
ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS reviewer_user_id uuid REFERENCES users(id) ON DELETE SET NULL
`);
await sql.unsafe(`
ALTER TABLE documents ADD COLUMN IF NOT EXISTS review_status varchar(20)
`);
await sql.unsafe(`
ALTER TABLE documents ADD COLUMN IF NOT EXISTS review_requested_at timestamptz
`);
await sql.unsafe(`
ALTER TABLE documents ADD COLUMN IF NOT EXISTS reviewed_at timestamptz
`);
await sql.unsafe(`
ALTER TABLE documents ADD COLUMN IF NOT EXISTS review_note text
`);

const [check] = await sql.unsafe(`
select count(*)::int as invited from documents where review_status = 'invited'
`);
console.log("review columns ready, invited rows:", check?.invited ?? 0);
await sql.end();