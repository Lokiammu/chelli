/**
 * Post-Deploy ABI Copy Script
 * ────────────────────────────
 * Copies the Truffle build artifact (with networks field) to:
 *   - backend/TrackSupplyChain.json   (for the Node.js server)
 *   - frontend/src/abi/TrackSupplyChain.json (for the React app)
 *
 * Usage: node scripts/copy-abi.js   (run from backend/)
 */

const fs = require("fs");
const path = require("path");

// __dirname = backend/scripts/
const BACKEND_DIR = path.join(__dirname, "..");
const ROOT_DIR = path.join(BACKEND_DIR, "..");

const SOURCE = path.join(BACKEND_DIR, "build", "contracts", "TrackSupplyChain.json");
const TARGETS = [
    path.join(BACKEND_DIR, "TrackSupplyChain.json"),
    path.join(ROOT_DIR, "frontend", "src", "abi", "TrackSupplyChain.json"),
];

if (!fs.existsSync(SOURCE)) {
    console.error("❌ Build artifact not found at:", SOURCE);
    console.error("   Run 'npx truffle migrate --reset' from backend/ first.");
    process.exit(1);
}

const artifact = fs.readFileSync(SOURCE, "utf8");
const parsed = JSON.parse(artifact);

// Verify the artifact has networks info
const networkKeys = Object.keys(parsed.networks || {});
if (networkKeys.length === 0) {
    console.warn("⚠️  Warning: Artifact has no deployed networks. Did migration succeed?");
} else {
    const lastNet = parsed.networks[networkKeys[networkKeys.length - 1]];
    console.log(`✅ Contract deployed at: ${lastNet.address}`);
    console.log(`   Network ID: ${networkKeys[networkKeys.length - 1]}`);
}

let copied = 0;
for (const target of TARGETS) {
    try {
        const dir = path.dirname(target);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.copyFileSync(SOURCE, target);
        console.log(`📋 Copied to: ${path.relative(ROOT_DIR, target)}`);
        copied++;
    } catch (err) {
        console.error(`❌ Failed to copy to ${target}:`, err.message);
    }
}

console.log(`\n${copied}/${TARGETS.length} targets updated.`);
