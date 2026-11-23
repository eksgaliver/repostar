/**
 * One-off migration for the positions feature: the table, the employee column,
 * and the unique index. Safe to run twice.
 */
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL ?? Bun.env.DATABASE_URL);

await sql.unsafe(`
CREATE TABLE IF NOT EXISTS positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id uuid NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  name varchar(120) NOT NULL,
  is_active boolean NOT NULL DEFAULT true
)`);

await sql.unsafe(`
ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS position_id uuid REFERENCES positions(id) ON DELETE SET NULL
`);

await sql.unsafe(`
CREATE UNIQUE INDEX IF NOT EXISTS positions_department_name_idx
  ON positions(department_id, name)
`);

const [check] = await sql.unsafe(
  "select count(*)::int as positions from positions"
);
console.log("positions table ready, rows:", check?.positions ?? 0);
await sql.end();