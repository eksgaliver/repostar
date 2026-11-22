#!/usr/bin/env node
/**
 * One-terminal dev runner for S.T.A.R.S.
 *
 *   npm run api:web:mobile   -> API + Web + Mobile
 *   npm run api:web          -> API + Web
 *   npm run api:mobile       -> API + Mobile
 *
 * No .cmd wrapper and no extra dependency: it spawns `bun run <script>` inside
 * each project, prefixes the output, and kills the whole tree on Ctrl+C.
 */
import { spawn, spawnSync } from "node:child_process";
import { copyFileSync, existsSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import readline from "node:readline";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const RESET = "\x1b[0m";
const DIM = "\x1b[2m";
const BOLD = "\x1b[1m";
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";

const TARGETS = {
  api: { dir: "erp-backend-api", script: "dev", label: "api   ", color: "\x1b[36m", url: "http://localhost:4000" },
  web: { dir: "erp-web-dashboard", script: "dev", label: "web   ", color: "\x1b[35m", url: "http://localhost:3000" },
  mobile: {
    dir: "erp-mobile-app",
    script: "start",
    label: "mobile",
    color: "\x1b[33m",
    url: "http://localhost:8081",
    interactive: true,
  },
};

const argv = process.argv.slice(2);
const dryRun = argv.includes("--dry-run");
const requested = argv.filter((arg) => !arg.startsWith("-"));

if (argv.includes("--help") || argv.includes("-h")) {
  console.log(`Pakai: node scripts/dev.mjs <api|web|mobile|all> [--dry-run]

  api web mobile   jalankan API + Web + Mobile
  api web          jalankan API + Web
  api mobile       jalankan API + Mobile
  all              alias untuk ketiganya`);
  process.exit(0);
}

const names = requested.length === 0 || requested.includes("all") ? ["api", "web", "mobile"] : requested;
const unique = [...new Set(names)];

for (const name of unique) {
  if (!TARGETS[name]) {
    console.error(`${RED}✖ Target "${name}" tidak dikenal. Pilih: api, web, mobile, all.${RESET}`);
    process.exit(1);
  }
}

function ensureDeps(name) {
  const project = TARGETS[name];
  const dir = path.join(ROOT, project.dir);

  if (!existsSync(dir)) {
    console.error(`${RED}✖ Folder ${project.dir} tidak ditemukan di ${ROOT}${RESET}`);
    process.exit(1);
  }

  if (!existsSync(path.join(dir, "node_modules"))) {
    console.log(`${DIM}• install dependency ${project.dir} (sekali saja)…${RESET}`);
    if (dryRun) return dir;
    const result = spawnSync("bun", ["install"], { cwd: dir, stdio: "inherit", shell: process.platform === "win32" });
    if (result.status !== 0) {
      console.error(`${RED}✖ bun install gagal di ${project.dir}${RESET}`);
      process.exit(1);
    }
  }

  if (name === "api") {
    const envFile = path.join(dir, ".env");
    const example = path.join(dir, ".env.example");
    if (!existsSync(envFile) && existsSync(example)) {
      if (!dryRun) copyFileSync(example, envFile);
      console.log(`${DIM}• .env dibuat dari .env.example — cek DATABASE_URL${RESET}`);
    }
  }

  return dir;
}

const children = [];
let shuttingDown = false;

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;

  for (const child of children) {
    if (child.exitCode !== null || !child.pid) continue;
    if (process.platform === "win32") {
      spawnSync("taskkill", ["/pid", String(child.pid), "/T", "/F"], { stdio: "ignore" });
    } else {
      child.kill("SIGTERM");
    }
  }
  process.exit(code);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

function prefixStream(stream, label, color) {
  if (!stream) return;
  readline.createInterface({ input: stream }).on("line", (line) => {
    process.stdout.write(`${color}${label}${RESET} ${DIM}│${RESET} ${line}\n`);
  });
}

function launch(name) {
  const project = TARGETS[name];
  const dir = ensureDeps(name);
  const command = process.platform === "win32" ? "bun.exe" : "bun";
  const args = ["run", project.script];

  console.log(`${project.color}${BOLD}▶ ${project.label.trim()}${RESET} ${DIM}${project.dir} · bun run ${project.script}${RESET}`);
  if (dryRun) return;

  const child = spawn(command, args, {
    cwd: dir,
    env: { ...process.env, FORCE_COLOR: "1", NO_COLOR: undefined },
    // Expo keeps the raw TTY so its "a / i / w" shortcuts and QR keep working.
    stdio: project.interactive ? "inherit" : ["ignore", "pipe", "pipe"],
  });

  children.push(child);

  if (!project.interactive) {
    prefixStream(child.stdout, project.label, project.color);
    prefixStream(child.stderr, project.label, project.color);
  }

  child.on("error", (error) => {
    console.error(`${RED}✖ ${project.label.trim()} gagal start: ${error.message}${RESET}`);
    console.error(`${DIM}  pastikan bun ada di PATH (bun --version)${RESET}`);
    shutdown(1);
  });

  child.on("exit", (code, signal) => {
    if (shuttingDown) return;
    const reason = signal ? `signal ${signal}` : `kode ${code}`;
    console.log(`${project.color}${project.label}${RESET} ${DIM}berhenti (${reason})${RESET}`);
    shutdown(code ?? 0);
  });
}

console.log(`${BOLD}S.T.A.R.S${RESET} ${DIM}· ${unique.join(" + ")}${dryRun ? " · dry-run" : ""}${RESET}`);

unique.forEach((name, index) => {
  // Small stagger so the API wins the port race and logs stay readable.
  if (dryRun || index === 0) launch(name);
  else setTimeout(() => launch(name), index * 700);
});

if (dryRun) {
  for (const name of unique) {
    const project = TARGETS[name];
    console.log(`${DIM}  ${project.label.trim()} -> ${project.dir} (${project.url})${RESET}`);
  }
  console.log(`${DIM}  tidak ada proses yang dijalankan.${RESET}`);
  process.exit(0);
}

setTimeout(() => {
  console.log("");
  for (const name of unique) {
    const project = TARGETS[name];
    console.log(`${GREEN}✓${RESET} ${project.label.trim()} ${DIM}${project.url}${RESET}`);
  }
  console.log(`${DIM}  Ctrl+C untuk mematikan semuanya.${RESET}\n`);
}, 1800);