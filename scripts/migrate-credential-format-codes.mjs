/**
 * One-off migration: legacy vcFormat / credentialFormats strings -> canonical snake_case codes.
 * Run from repo root: node scripts/migrate-credential-format-codes.mjs
 */
import fs from "fs";
import path from "path";

const OLD_TO_NEW = {
  "SD-JWT": "sd_jwt_vc",
  "SD-JWT-VC": "sd_jwt_vc",
  "mDL/mDoc": "mdoc",
  "JWT-VC": "jwt_vc",
  "JSON-LD VC": "vcdm_2_0",
  "AnonCreds": "anoncreds",
  "Idemix": "idemix",
  "Apple Wallet Pass": "apple_wallet_pass",
  "Google Wallet Pass": "google_wallet_pass",
  "CBOR-LD": "vcdm_2_0",
};

function migrateFormats(arr) {
  if (!Array.isArray(arr)) return arr;
  const next = arr.map((x) => OLD_TO_NEW[x] ?? x);
  return [...new Set(next)];
}

function migrateWalletCatalog(data) {
  let touched = false;
  for (const w of data.wallets || []) {
    if (!w.vcFormat?.length) continue;
    const n = migrateFormats(w.vcFormat);
    if (JSON.stringify(n) !== JSON.stringify(w.vcFormat)) touched = true;
    w.vcFormat = n;
  }
  return touched;
}

function migrateRpCatalog(data) {
  let touched = false;
  for (const rp of data.relyingParties || []) {
    if (!rp.vcFormat?.length) continue;
    const n = migrateFormats(rp.vcFormat);
    if (JSON.stringify(n) !== JSON.stringify(rp.vcFormat)) touched = true;
    rp.vcFormat = n;
  }
  return touched;
}

function walkJsonFiles(root, filename) {
  const out = [];
  function walk(dir) {
    for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, name.name);
      if (name.isDirectory()) walk(p);
      else if (name.isFile() && name.name === filename) out.push(p);
    }
  }
  walk(root);
  return out;
}

function processRepo(repoRoot, kind) {
  const sub = path.join(repoRoot, "community-catalogs");
  if (!fs.existsSync(sub)) {
    console.warn("Skip (no community-catalogs):", repoRoot);
    return;
  }
  const files =
    kind === "wallet"
      ? walkJsonFiles(sub, "wallet-catalog.json")
      : walkJsonFiles(sub, "rp-catalog.json");
  let n = 0;
  for (const file of files) {
    const raw = fs.readFileSync(file, "utf8");
    const data = JSON.parse(raw);
    const touched =
      kind === "wallet" ? migrateWalletCatalog(data) : migrateRpCatalog(data);
    if (touched) {
      fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n", "utf8");
      n++;
      console.log("Updated", path.relative(repoRoot, file));
    }
  }
  console.log(kind, repoRoot, "files changed:", n);
}

const root = process.cwd();
const arg = process.argv[2];
if (arg === "rp") {
  processRepo(root, "rp");
} else if (arg === "wallet") {
  processRepo(root, "wallet");
} else {
  console.error("Usage: node scripts/migrate-credential-format-codes.mjs <wallet|rp>");
  process.exit(1);
}
