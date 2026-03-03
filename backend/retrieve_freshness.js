require("dotenv").config();
const Web3 = require("web3");

// ✅ Use TrackSupplyChain ABI
const contractJson = require("./TrackSupplyChain.json");

const web3 = new Web3(process.env.RPC_URL);

const contract = new web3.eth.Contract(
  contractJson.abi,
  process.env.CONTRACT_ADDRESS   // TrackSupplyChain address
);

async function retrieve() {
  try {
    console.log("🔍 Retrieving freshness from blockchain...");

    const cropId = "CROP-52d55039";
    const cropIdBytes = web3.utils.keccak256(cropId);

    console.log("Crop ID:", cropId);
    console.log("Hashed ID:", cropIdBytes);

    const data = await contract.methods
      .getFreshness(cropIdBytes)
      .call();

    console.log("\n📊 RETRIEVED FROM BLOCKCHAIN");
    console.log("VOC:", data.gasValue);
    console.log("Temperature:", data.temperature);
    console.log("Humidity:", data.humidity);
    console.log(
      "Timestamp:",
      new Date(Number(data.timestamp) * 1000).toLocaleString()
    );

    console.log("✅ Data retrieved successfully");
  } catch (err) {
    console.error("❌ Retrieval failed:", err.message);
  }
}

retrieve();
