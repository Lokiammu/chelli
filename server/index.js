// /server/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Web3 = require('web3');
const contractJson = require('../build/contracts/TrackSupplyChain.json');

const app = express();
app.use(cors());
app.use(express.json());

// RPC URL and contract address from .env or defaults
const RPC = process.env.RPC_URL || "http://127.0.0.1:7545";
const web3 = new Web3(new Web3.providers.HttpProvider(RPC));

// Dynamically get contract address from deployment
const networkIds = Object.keys(contractJson.networks);
if (networkIds.length === 0) {
  console.error("No networks found in ABI. Run truffle migrate --reset.");
  process.exit(1);
}
const networkId = networkIds[networkIds.length - 1];
const contractAddress = process.env.CONTRACT_ADDRESS || contractJson.networks[networkId]?.address;

if (!contractAddress) {
  console.error("Contract not deployed on this network. Run truffle migrate.");
  process.exit(1);
}

const contract = new web3.eth.Contract(contractJson.abi, contractAddress);

// Ensure the contract method exists
const fnExists = contractJson.abi.some(f => f.name === "updateFreshness" && f.type === "function");
if (!fnExists) {
  console.error("Contract method updateFreshness not found in ABI.");
  process.exit(1);
}

console.log("✅ Server ready. Contract address:", contractAddress);

// API route to receive data from ESP and update the contract
app.post('/api/data', async (req, res) => {
  try {
    const { productId, gasValue, temperature, humidity } = req.body;

    // Get accounts from Ganache
    const accounts = await web3.eth.getAccounts();
    if (accounts.length === 0) throw new Error("No accounts found in Ganache");
    const from = process.env.FROM_ADDRESS || accounts[0];

    console.log(`📥 Updating product ${productId}: gas=${gasValue}, temp=${temperature}, humidity=${humidity}, from ${from}`);

    const receipt = await contract.methods
      .updateFreshness(productId, gasValue, temperature, humidity)
      .send({ from, gas: 3000000 });

    console.log("📤 Transaction successful:", receipt.transactionHash);
    res.json({ success: true, txHash: receipt.transactionHash });
  } catch (err) {
    console.error("❌ Error updating freshness:", err);
    res.status(500).json({ error: err.toString() });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://0.0.0.0:${PORT}`));
