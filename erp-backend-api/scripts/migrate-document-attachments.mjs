/**
 * One-off migration for letter attachments: a single JSON column holding
 * `{ name, type, size, dataUrl }` rows. Safe to run twice.
 */
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL ?? Bun.env.DATABASE_URL);

await sql.unsafe(`ALTER TABLE documents ADD COLUMN IF NOT EXISTS attachments text`);

const [check] = await sql.unsafe(`
select count(*)::int as with_attachments from documents where attachments is not null
`);
console.log("attachments column ready, letters with files:", check?.with_attachments ?? 0);
await sql.end();