// =====================================================
// Imports & Config
// =====================================================
require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const Web3 = require("web3");
const { graphqlHTTP } = require("express-graphql");
const { spawn } = require("child_process");

const freshnessRoutes = require("./routes/freshness");
const createSensorRoutes = require("./routes/sensorRoutes");
const createCropRoutes = require("./routes/cropRoutes");
const createGraphqlSchema = require("./schema");
const createMemoryStore = require("./store/memoryStore");
const cropSupplyChainJson = require("./TrackSupplyChain.json");

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

// =====================================================
// Blockchain + In-Memory Setup
// =====================================================
const web3 = new Web3(process.env.RPC_URL || "http://127.0.0.1:7545");

if (!process.env.PRIVATE_KEY) {
  console.error("❌ PRIVATE_KEY not set in .env file. See .env.example");
  process.exit(1);
}

const account = web3.eth.accounts.privateKeyToAccount(process.env.PRIVATE_KEY);
web3.eth.accounts.wallet.add(account);

// Resolve contract address: ABI artifact networks > env var
// (ABI is more reliable since it's auto-updated by deploy script)
const isValidAddress = (addr) => /^0x[0-9a-fA-F]{40}$/.test(addr);

let contractAddress = null;

// 1. Try ABI artifact networks field (auto-populated by truffle deploy + copy-abi)
if (cropSupplyChainJson.networks) {
  const networkKeys = Object.keys(cropSupplyChainJson.networks);
  if (networkKeys.length > 0) {
    const lastNet = cropSupplyChainJson.networks[networkKeys[networkKeys.length - 1]];
    if (lastNet?.address) {
      contractAddress = lastNet.address;
      console.log(`📋 Contract address auto-detected from ABI: ${contractAddress}`);
    }
  }
}

// 2. Fallback: env var (only if it's a valid Ethereum address)
if (!contractAddress && isValidAddress(process.env.CROP_SUPPLY_CHAIN_ADDRESS)) {
  contractAddress = process.env.CROP_SUPPLY_CHAIN_ADDRESS;
  console.log(`📋 Contract address from .env: ${contractAddress}`);
}

if (!contractAddress) {
  console.error("");
  console.error("❌ Contract address not found!");
  console.error("");
  console.error("   To fix this, run these steps:");
  console.error("   1. Make sure Ganache is running on port 7545");
  console.error("   2. Run: npm run deploy");
  console.error("      (this deploys contracts AND copies ABI with address)");
  console.error("   3. Then run: npm start");
  console.error("");
  process.exit(1);
}

const cropSupplyChain = new web3.eth.Contract(
  cropSupplyChainJson.abi,
  contractAddress
);

const store = createMemoryStore();

console.log("🔗 Blockchain connected");
console.log("   Account:", account.address);
console.log("   Contract:", contractAddress);

const deps = { cropSupplyChain, account, store, spawn };

// =====================================================
// Routes
// =====================================================
app.use("/", freshnessRoutes);
app.use("/", createSensorRoutes(deps));
app.use("/api", createCropRoutes(deps));

app.use(
  "/graphql",
  graphqlHTTP({
    schema: createGraphqlSchema({ cropSupplyChain, store }),
    graphiql: true,
  })
);

// =====================================================
// Health Check
// =====================================================
app.get("/", (req, res) => {
  res.send("✅ Blockchain + IoT + ML backend running (MongoDB removed)");
});

// =====================================================
// Start Server
// =====================================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});
