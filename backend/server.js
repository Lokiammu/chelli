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
const cropSupplyChainJson = require("./contracts/CropSupplyChain.json");

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

// =====================================================
// Blockchain + In-Memory Setup
// =====================================================
const web3 = new Web3(process.env.RPC_URL);
const account = web3.eth.accounts.privateKeyToAccount(process.env.PRIVATE_KEY);
web3.eth.accounts.wallet.add(account);

const cropSupplyChain = new web3.eth.Contract(
  cropSupplyChainJson.abi,
  process.env.CROP_SUPPLY_CHAIN_ADDRESS
);

const store = createMemoryStore();

console.log("🔗 Blockchain connected");
console.log("Using account:", account.address);

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
