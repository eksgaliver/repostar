#!/usr/bin/env node
/**
 * Installs third-party Agent Skills into .qoder/skills.
 *
 *   node scripts/sync-skills.mjs                    # all sources
 *   node scripts/sync-skills.mjs --only=taste
 *   node scripts/sync-skills.mjs --skip=pptx,template
 *   node scripts/sync-skills.mjs --no-assets        # skip taste-skill photo library (~33 MB)
 *   node scripts/sync-skills.mjs --clean            # remove managed skills first
 *
 * Sources
 *   anthropics/skills          every skills/<name> folder
 *   leonxlnx/taste-skill       skills/taste-skill      -> design-taste-frontend
 *   deerwork-ai/deer-workflow  skills/workflow-creator -> workflow-creator
 *
 * Files are fetched from raw.githubusercontent.com, so no git clone and no API quota burn.
 */
import { mkdir, writeFile, readFile, rm, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SKILLS_DIR = path.join(ROOT, ".qoder/skills");
const API = "https://api.github.com";

const flags = new Map(
  process.argv.slice(2).map((arg) => {
    const [k, v] = arg.replace(/^--/, "").split("=");
    return [k, v ?? true];
  })
);
const only = flags.get("only") ? String(flags.get("only")).split(",").map((s) => s.trim()) : null;
const skip = new Set(flags.get("skip") ? String(flags.get("skip")).split(",").map((s) => s.trim()) : []);
const withAssets = !flags.get("no-assets");

const SOURCES = [
  {
    id: "anthropic",
    label: "Anthropic Skills",
    repo: "anthropics/skills",
    branch: "main",
    // every top-level skill folder, never the repo scaffolding or template
    include: /^skills\/([^/]+)\//,
    dest: (rel) => rel.replace(/^skills\//, ""),
    skipPath: (rel) => /^template\//.test(rel) || skip.has(rel.split("/")[1]),
  },
  {
    id: "taste",
    label: "Taste Skill",
    repo: "leonxlnx/taste-skill",
    branch: "main",
    include: /^skills\/taste-skill\//,
    dest: (rel) => rel.replace(/^skills\/taste-skill/, "design-taste-frontend"),
    skipPath: (rel) => !withAssets && /assets\/(photos|scenes)\//.test(rel),
    stripHooks: true,
  },
  {
    id: "deer",
    label: "deer workflow",
    repo: "deerwork-ai/deer-workflow",
    branch: "main",
    include: /^skills\/workflow-creator\//,
    dest: (rel) => rel.replace(/^skills\//, ""),
  },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url, attempt = 0, as = "json") {
  try {
    const res = await fetch(url, { headers: { "user-agent": "stars-skill-sync" } });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText} ${url}`);
    return as === "json" ? await res.json() : Buffer.from(await res.arrayBuffer());
  } catch (err) {
    if (attempt >= 3) throw err;
    await sleep(500 * (attempt + 1));
    return get(url, attempt + 1, as);
  }
}

/** Drops Claude-Code-only `hooks:` from the frontmatter; Qoder would try to run a bash hook we cannot honour. */
function stripHooks(text) {
  const lines = text.split("\n");
  if (lines[0]?.trim() !== "---") return text;
  const end = lines.findIndex((line, index) => index > 0 && line.trim() === "---");
  if (end < 0) return text;

  const body = lines.slice(1, end);
  const kept = [];
  let dropping = false;
  for (const line of body) {
    if (/^hooks:\s*$/.test(line) || /^hooks:\s*\S/.test(line)) {
      dropping = true;
      continue;
    }
    if (dropping) {
      // hooks block ends at the first line that starts at column 0
      if (line.trim() === "" || /^\s/.test(line)) continue;
      dropping = false;
    }
    kept.push(line);
  }
  return [lines[0], ...kept, ...lines.slice(end)].join("\n");
}

async function syncSource(source) {
  console.log(`\n${source.label} (${source.repo})`);
  const tree = await get(`${API}/repos/${source.repo}/git/trees/${source.branch}?recursive=1`);
  const blobs = (tree.tree || []).filter((entry) => entry.type === "blob");

  const files = blobs.filter((entry) => {
    if (!source.include.test(entry.path)) return false;
    if (source.skipPath?.(entry.path)) return false;
    return true;
  });

  console.log(`  ${files.length} files`);

  const written = [];
  let cursor = 0;
  async function worker() {
    while (cursor < files.length) {
      const entry = files[cursor++];
      const rel = source.dest(entry.path);
      const dest = path.join(SKILLS_DIR, rel);
      let buffer = await get(
        `https://raw.githubusercontent.com/${source.repo}/${source.branch}/${entry.path}`,
        0,
        "buffer"
      );
      if (source.stripHooks && entry.path.endsWith("SKILL.md")) {
        buffer = Buffer.from(stripHooks(buffer.toString("utf8")), "utf8");
      }
      await mkdir(path.dirname(dest), { recursive: true });
      await writeFile(dest, buffer);
      written.push({ rel, bytes: buffer.length });
      if (written.length % 100 === 0) process.stdout.write(`\r  ${written.length}/${files.length}`);
    }
  }
  await Promise.all(Array.from({ length: 6 }, worker));
  console.log(`\r  ${written.length}/${files.length} written`);

  // group per skill folder for the manifest
  const perSkill = new Map();
  for (const file of written) {
    const name = file.rel.split("/")[0];
    const entry = perSkill.get(name) ?? { files: 0, bytes: 0 };
    entry.files += 1;
    entry.bytes += file.bytes;
    perSkill.set(name, entry);
  }

  const commit = await get(`${API}/repos/${source.repo}/commits/${source.branch}`).catch(() => null);

  return {
    id: source.id,
    label: source.label,
    repo: source.repo,
    sha: commit?.sha?.slice(0, 7) ?? "unknown",
    skills: [...perSkill.entries()]
      .map(([name, info]) => ({ name, ...info }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  };
}

async function main() {
  await mkdir(SKILLS_DIR, { recursive: true });
  const selected = SOURCES.filter((source) => !only || only.includes(source.id));
  if (selected.length === 0) throw new Error(`No source matched --only=${only.join(",")}`);

  if (flags.get("clean")) {
    for (const source of selected) {
      const tree = await get(`${API}/repos/${source.repo}/git/trees/${source.branch}?recursive=1`);
      const names = new Set(
        (tree.tree || [])
          .filter((entry) => entry.type === "blob" && source.include.test(entry.path))
          .filter((entry) => !source.skipPath?.(entry.path))
          .map((entry) => source.dest(entry.path).split("/")[0])
      );
      for (const name of names) await rm(path.join(SKILLS_DIR, name), { recursive: true, force: true });
      console.log(`cleaned ${names.size} skill folders from ${source.repo}`);
    }
  }

  const results = [];
  for (const source of selected) results.push(await syncSource(source));

  const installed = await readdir(SKILLS_DIR).catch(() => []);

  // a partial run (--only) must not drop the rows of the sources it did not touch
  const syncedLabels = new Set(results.map((result) => result.label));
  const previousRows = await readFile(path.join(SKILLS_DIR, "INSTALLED.md"), "utf8")
    .then((text) =>
      text
        .split("\n")
        .filter((line) => /^\| `[^`]+` \| [^|]+ \| [^|]+@[^|]+ \|/.test(line))
        .filter((line) => !syncedLabels.has(line.split("|")[2].trim()))
    )
    .catch(() => []);

  const rows = [
    ...results.flatMap((result) =>
      result.skills.map((skill) => {
        const notes = [];
        if (result.id === "taste" && !withAssets) notes.push("photo library skipped (--no-assets)");
        if (result.id === "taste") notes.push("frontmatter hooks removed (Claude Code only)");
        if (skip.has(skill.name)) notes.push("skipped by --skip");
        return `| \`${skill.name}\` | ${result.label} | ${result.repo}@${result.sha} | ${skill.files} | ${Math.round(
          skill.bytes / 1024
        )} KB | ${notes.join("; ") || "-"} |`;
      })
    ),
    ...previousRows,
  ].sort((a, b) => a.slice(3).localeCompare(b.slice(3)));

  const manifest = `# Installed skills

Generated by \`npm run skills:sync\` (scripts/sync-skills.mjs) on ${new Date().toISOString()}.
Each folder under \`.qoder/skills/\` is a Qoder skill: \`SKILL.md\` plus whatever it references.

Do not hand-edit a vendored skill - rerun the sync instead. Local tweaks belong in project
skills you own, or in \`AGENTS.md\`.

\`\`\`
npm run skills:sync                  # everything
npm run skills:sync -- --only=taste
npm run skills:sync -- --no-assets   # skip the taste-skill photo library
npm run skills:sync -- --clean       # reinstall managed skills from scratch
\`\`\`

| Skill | Source | Pinned | Files | Size | Notes |
| --- | --- | --- | --- | --- | --- |
${rows.join("\n")}

## Also installed from the Arc registry

| Skill | Source | Notes |
| --- | --- | --- |
| \`arc\` | uiarc.dev registry | pulled by \`npm run arc:sync\` |

Folders currently on disk: ${installed.map((name) => `\`${name}\``).join(", ")}
`;
  await writeFile(path.join(SKILLS_DIR, "INSTALLED.md"), manifest, "utf8");

  const totalFiles = results.reduce((sum, r) => sum + r.skills.reduce((s, k) => s + k.files, 0), 0);
  console.log(`\nDone. ${rows.length} skills, ${totalFiles} files -> .qoder/skills`);
  console.log("Manifest: .qoder/skills/INSTALLED.md");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});