import React, { useState } from "react";
import { ethers } from "ethers";
import QRCode from "qrcode";
import CONTRACT_JSON from "../abi/TrackSupplyChain.json";

const ABI = CONTRACT_JSON.abi;
const CONTRACT_ADDRESS = "0x6934948aa57D9909f90b06905559ddf0851BE29F";

export default function FarmerDashboard({ userAddress, crops, setCrops }) {

  const [isGenerating, setIsGenerating] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [qrImage, setQrImage] = useState("");
  const [qrPayload, setQrPayload] = useState(null);

  const [freshness, setFreshness] = useState({
    voc: null,
    temperature: null,
    humidity: null,
    timestamp: null,
  });

  const [capturePreview, setCapturePreview] = useState(null);

  // 🔗 CONNECT CONTRACT
  const getContract = async () => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    return new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
  };

  const uploadToPinata = async (metadata) => {
    const apiBase = process.env.REACT_APP_BACKEND_URL || "http://localhost:3000";
    const response = await fetch(`${apiBase}/storeFreshness`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(metadata),
    });

    if (!response.ok) {
      throw new Error(`IPFS upload failed (HTTP ${response.status})`);
    }

    const result = await response.json();
    return result.cid || result.ipfsHash || null;
  };

  // =========================
  // META MASK SIGNATURE REQUEST
  // =========================
  const requestSignature = async (message) => {
    if (!window.ethereum) {
      alert("MetaMask not detected!");
      throw new Error("MetaMask not detected");
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const signature = await signer.signMessage(message);
    return signature;
  };

  // =========================
  // CREATE CROP ON BLOCKCHAIN
  // =========================
  const generateCrop = async () => {
    if (isGenerating) {
      alert("Generation in progress. Please wait...");
      return;
    }

    const type = document.getElementById("cropType").value;
    const origin = document.getElementById("cropOrigin").value;
    const date = document.getElementById("cropDate").value;
    const price = document.getElementById("cropPrice").value;

    if (!type || !origin || !date || !price) {
      alert("Fill all crop details");
      return;
    }

    try {
      setIsGenerating(true);
      const contract = await getContract();

      // Generate unique crop ID on blockchain
      const seed = Math.floor(Math.random() * 100000);
      const tx1 = await contract.createUniqueCropID(seed);
      await tx1.wait();

      // Get created crop ID - convert BigInt to number
      const count = await contract.cropCount();
      const cropID = await contract.cropIDs(Number(count) - 1);

      // Store crop data on blockchain
      const tx2 = await contract.farmerCollectCrop(
        cropID,
        type,
        origin,
        date,
        Number(price)
      );
      const receipt = await tx2.wait();

      const provider = new ethers.BrowserProvider(window.ethereum);
      const networkInfo = await provider.getNetwork();
      const txHash = receipt?.hash || receipt?.transactionHash || "";

      const metadata = {
        cropId: cropID,
        cropType: type,
        origin,
        harvestDate: date,
        price: Number(price),
        farmer: userAddress,
        timestamp: Date.now(),
      };

      let cid = null;
      try {
        cid = await uploadToPinata(metadata);
      } catch (ipfsErr) {
        console.warn("IPFS upload skipped:", ipfsErr.message);
      }

      const payload = {
        cropId: cropID,
        txHash,
        cid,
        contract: CONTRACT_ADDRESS,
        network: networkInfo?.chainId ? `chain-${networkInfo.chainId}` : "unknown",
        verifyUrl: `${window.location.origin}/trace?cropId=${cropID}&tx=${txHash}${cid ? `&cid=${cid}` : ""}`,
      };

      const qrUrl = await QRCode.toDataURL(JSON.stringify(payload));
      setQrPayload(payload);
      setQrImage(qrUrl);

      alert("Crop created and stored on blockchain! ✅");
    } catch (err) {
      console.error(err);
      alert("Failed to create crop on blockchain");
    } finally {
      setIsGenerating(false);
    }
  };

  // =========================
  // TRANSFER TO SUPPLIER ON BLOCKCHAIN
  // =========================
  const transferCrop = async () => {
    if (isTransferring) {
      alert("Transfer in progress. Please wait...");
      return;
    }

    const cropIdInput = document.getElementById("cropId").value;
    const supplier = document.getElementById("supplierAddress").value;
    const tdate = document.getElementById("transferDate").value;

    if (!cropIdInput || !supplier || !tdate) {
      alert("Enter all fields");
      return;
    }

    try {
      setIsTransferring(true);
      const contract = await getContract();

      // Use crop ID directly as bytes32 (no string encoding needed)
      let cropID;
      if (cropIdInput.startsWith('0x')) {
        // If it's already a hex string, use it directly
        cropID = cropIdInput;
      } else {
        // If it's not hex, try to encode as bytes32 string
        try {
          cropID = ethers.encodeBytes32String(cropIdInput);
        } catch (err) {
          alert("Invalid crop ID format. Please copy the full crop ID from the Crop Status table.");
          return;
        }
      }

      // Store transfer on blockchain
      const tx = await contract.farmerTransferToSupplier(
        cropID,
        supplier,
        tdate
      );
      await tx.wait();

      alert("Transferred to supplier on blockchain ✅");
    } catch (err) {
      console.error(err);
      if (err.message.includes("Crop does not exist")) {
        alert("Crop not found. Make sure you copied the exact crop ID from the Crop Status table.");
      } else {
        alert("Transfer failed on blockchain");
      }
    } finally {
      setIsTransferring(false);
    }
  };

  // =========================
  // SIMULATED SENSOR
  // =========================
  const senseVOC = () => {
    setFreshness((f) => ({
      ...f,
      voc: Math.floor(Math.random() * 100),
      timestamp: Date.now(),
    }));
  };

  const senseTempHum = () => {
    setFreshness((f) => ({
      ...f,
      temperature: 25 + Math.floor(Math.random() * 10),
      humidity: 50 + Math.floor(Math.random() * 20),
      timestamp: Date.now(),
    }));
  };

  // =========================
  // STORE FRESHNESS ON BLOCKCHAIN
  // =========================
  const storeAll = async () => {
    try {
      const contract = await getContract();

      const count = await contract.cropCount();
      const productId = Number(count) - 1;

      const tx = await contract.updateFreshness(
        productId,
        freshness.voc || 0,
        freshness.temperature || 0,
        freshness.humidity || 0
      );

      await tx.wait();

      alert("Freshness stored on blockchain 🌱");
    } catch (err) {
      console.error(err);
      alert("Failed storing freshness");
    }
  };

  return (
    <div className="farmer-root">
      <div className="dashboard-grid">

        {/* CREATE */}
        <div className="dashboard-section">
          <h3>Create Crop</h3>
          <input id="cropType" placeholder="Crop Type" />
          <input id="cropOrigin" placeholder="Origin" />
          <input id="cropDate" type="date" />
          <input id="cropPrice" type="number" placeholder="Price" />
          <button onClick={generateCrop} disabled={isGenerating}>
            {isGenerating ? "Generating..." : "Generate Crop"}
          </button>

          {qrImage && (
            <div style={{ marginTop: "14px" }}>
              <h4>Latest Crop QR</h4>
              <img src={qrImage} alt="Crop QR Code" width="180" />
              <p style={{ wordBreak: "break-all", fontSize: "12px", marginTop: "8px" }}>
                {JSON.stringify(qrPayload)}
              </p>
            </div>
          )}
        </div>

        {/* TRANSFER */}
        <div className="dashboard-section">
          <h3>Transfer Crop</h3>
          <input id="cropId" placeholder="Crop ID (string)" />
          <input id="supplierAddress" placeholder="Supplier Address" />
          <input id="transferDate" type="date" />
          <button onClick={transferCrop} disabled={isTransferring}>
            {isTransferring ? "Transferring..." : "Transfer"}
          </button>
        </div>

        {/* FRESHNESS */}
        <div className="dashboard-section">
          <h3>Freshness Sensing</h3>

          <div>VOC: {freshness.voc ?? "--"}</div>
          <button onClick={senseVOC}>Sense VOC</button>

          <div>Temp: {freshness.temperature ?? "--"} °C</div>
          <div>Humidity: {freshness.humidity ?? "--"} %</div>
          <button onClick={senseTempHum}>Sense Temp/Humidity</button>

          <input type="file" onChange={(e)=> {
            const reader = new FileReader();
            reader.onload = () => setCapturePreview(reader.result);
            reader.readAsDataURL(e.target.files[0]);
          }} />

          {capturePreview && <img src={capturePreview} alt="preview" width="100" />}

          <button onClick={storeAll}>
            Store Freshness On Blockchain
          </button>
        </div>

      </div>
    </div>
  );
}
