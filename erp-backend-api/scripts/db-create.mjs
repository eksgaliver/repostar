#!/usr/bin/env node
/**
 * Buat database baru memakai kredensial DATABASE_URL di .env.
 * Nama disimpan apa adanya (huruf besar), jadi CREATE DATABASE memakai tanda kutip.
 *
 *   node scripts/db-create.mjs DEMO_STARS
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import postgres from "postgres";

const target = process.argv[2] ?? "DEMO_STARS";

function loadEnv(file) {
  const env = {};
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (match) env[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
  return env;
}

const envFile = path.join(process.cwd(), ".env");
const env = loadEnv(envFile);
if (!env.DATABASE_URL) {
  console.error("DATABASE_URL tidak ditemukan di .env");
  process.exit(1);
}

const adminUrl = new URL(env.DATABASE_URL);
adminUrl.pathname = "/postgres";

const sql = postgres(adminUrl.toString(), { max: 1, connect_timeout: 8, onnotice: () => {} });

try {
  const [row] = await sql`select current_user as username, version() as version`;
  console.log(`terhubung sebagai ${row.username}`);

  const [{ exists }] = await sql`select exists(select 1 from pg_database where datname = ${target}) as exists`;
  if (exists) {
    console.log(`database "${target}" sudah ada`);
  } else {
    const quoted = `"${target.replace(/"/g, '""')}"`;
    await sql.unsafe(`CREATE DATABASE ${quoted}`);
    console.log(`database "${target}" dibuat`);
  }

  const [{ datname }] = await sql`select datname from pg_database where datname = ${target}`;
  console.log(`terverifikasi: ${datname}`);
} catch (error) {
  console.error(`GAGAL: ${error.code ?? ""} ${error.message}`);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 2 }).catch(() => {});
}