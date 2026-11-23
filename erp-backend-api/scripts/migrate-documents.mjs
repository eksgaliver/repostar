/**
 * One-off migration for the documents feature: two enums, the table, and the
 * company/status index. Safe to run twice.
 */
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL ?? Bun.env.DATABASE_URL);

await sql.unsafe(`
DO $$ BEGIN
  CREATE TYPE document_type AS ENUM (
    'internal_memo', 'announcement', 'circular', 'decree', 'warning', 'policy'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
`);

await sql.unsafe(`
DO $$ BEGIN
  CREATE TYPE document_status AS ENUM ('draft', 'sent', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
`);

await sql.unsafe(`
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  author_id uuid REFERENCES users(id) ON DELETE SET NULL,
  type document_type NOT NULL DEFAULT 'internal_memo',
  number varchar(80) NOT NULL,
  title varchar(200) NOT NULL,
  body text NOT NULL,
  signature text,
  signer_name varchar(160),
  signer_title varchar(160),
  audience_type varchar(20) NOT NULL DEFAULT 'all',
  audience_department_id uuid REFERENCES departments(id) ON DELETE SET NULL,
  status document_status NOT NULL DEFAULT 'draft',
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
)
`);

await sql.unsafe(`
CREATE INDEX IF NOT EXISTS documents_company_status_idx
  ON documents(company_id, status)
`);

const [check] = await sql.unsafe("select count(*)::int as documents from documents");
console.log("documents table ready, rows:", check?.documents ?? 0);
await sql.end();