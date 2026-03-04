// src/components/AggregatorDashboard.js
import React, { useState } from "react";
import CropStatusTable from "./CropStatusTable";
import { ethers } from "ethers";
import { getContract } from "../utils/web3";

export default function AggregatorDashboard({ userAddress, crops, setCrops }) {

  const [cropId, setCropId] = useState("");
  const [cost, setCost] = useState("");
  const [date, setDate] = useState("");
  const [retailer, setRetailer] = useState("");

  const [receiveCropId, setReceiveCropId] = useState("");
  const [receiveDate, setReceiveDate] = useState("");
  const [receiveCost, setReceiveCost] = useState("");

  const [isReceiving, setIsReceiving] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // =========================
  // RECEIVE FROM SUPPLIER (BLOCKCHAIN)
  // =========================
  const receiveFromSupplier = async () => {
    if (isReceiving) {
      alert("Receive transaction in progress. Please wait...");
      return;
    }

    if (!receiveCropId || !receiveDate || !receiveCost) {
      alert("Enter Crop ID, Receive Date, and Processing Cost");
      return;
    }

    const existingCrop = crops.find((c) => c.id === receiveCropId);
    if (!existingCrop) {
      alert("Invalid Crop ID!");
      return;
    }

    try {
      setIsReceiving(true);
      const contract = await getContract();

      // Use crop ID directly as bytes32 (no string encoding needed)
      let cropID;
      if (receiveCropId.startsWith('0x')) {
        // If it's already a hex string, use it directly
        cropID = receiveCropId;
      } else {
        // If it's not hex, try to encode as bytes32 string
        try {
          cropID = ethers.encodeBytes32String(receiveCropId);
        } catch (err) {
          alert("Invalid crop ID format. Please copy the full crop ID from the Crop Status table.");
          return;
        }
      }

      console.log("Aggregator Receive Debug - Sending to blockchain:", {
        cropID: cropID,
        receiveCost: receiveCost,
        receiveDate: receiveDate,
        functionName: "aggregatorReceiveFromSupplier",
        callerAddress: userAddress
      });

      const tx = await contract.aggregatorReceiveFromSupplier(
        cropID,
        receiveCost,
        receiveDate
      );

      console.log("Aggregator Receive Debug - Transaction hash:", tx.hash);
      console.log("Aggregator Receive Debug - Transaction details:", {
        to: tx.to,
        from: tx.from,
        gasLimit: tx.gasLimit,
        gasPrice: tx.gasPrice
      });

      const receipt = await tx.wait();
      console.log("Aggregator Receive Debug - Transaction receipt:", {
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed,
        status: receipt.status, // 1 = success, 0 = failed
        logs: receipt.logs
      });

      if (receipt.status === 1) {
        console.log("Aggregator Receive Debug - Transaction SUCCESSFUL");

        // Verify the data was actually stored
        const batchData = await contract.batches(cropID);
        console.log("Aggregator Receive Debug - Stored data verification:", {
          cropID: cropID,
          received: batchData.received,
          receivedDate: batchData.receivedDate,
          currentHolder: batchData.currentHolder,
          exists: batchData.exists
        });
      } else {
        console.error("Aggregator Receive Debug - Transaction FAILED!");
      }

      const updated = crops.map((c) =>
        c.id === receiveCropId
          ? {
            ...c,
            stage: "Received by Aggregator",
            holder: userAddress,
            transferDate: receiveDate,
            history: [
              ...(c.history || []),
              {
                role: "Aggregator",
                sender: c.holder,
                receiver: userAddress,
                date: receiveDate,
                cost: 0,
                note: "Received from Supplier",
              },
            ],
          }
          : c
      );

      setCrops(updated);

      alert("Crop received from Supplier on blockchain ✅");

      setReceiveCropId("");
      setReceiveDate("");
      setReceiveCost("");

    } catch (err) {
      console.error(err);
      alert("Blockchain receive failed");
    } finally {
      setIsReceiving(false);
    }
  };

  // =========================
  // PROCESS & SEND TO RETAILER (BLOCKCHAIN)
  // =========================
  const processAndSendCrop = async () => {
    if (isProcessing) {
      alert("Processing transaction in progress. Please wait...");
      return;
    }

    if (!cropId || !date || !retailer) {
      alert("Enter Crop ID, Date & Retailer Address");
      return;
    }

    const existingCrop = crops.find((c) => c.id === cropId);
    if (!existingCrop) {
      alert("Invalid Crop ID!");
      return;
    }

    // Read current holder directly from blockchain instead of using local state
    try {
      setIsProcessing(true);
      const contract = await getContract();

      // Use crop ID directly as bytes32 (no string encoding needed)
      let cropID = cropId;

      // Read from all mappings to find current holder
      const cropData = await contract.crops(cropID);
      const supplyData = await contract.supplies(cropID);
      const batchData = await contract.batches(cropID);
      const retailData = await contract.retails(cropID);

      // Determine current holder based on which mapping has data
      let currentHolder = cropData.currentHolder;
      if (supplyData.currentHolder && supplyData.currentHolder !== "0x0000000000000000000000000000000000000000") {
        currentHolder = supplyData.currentHolder;
      }
      if (batchData.currentHolder && batchData.currentHolder !== "0x0000000000000000000000000000000000000000") {
        currentHolder = batchData.currentHolder;
      }
      if (retailData.holder && retailData.holder !== "0x0000000000000000000000000000000000000000") {
        currentHolder = retailData.holder;
      }

      // Normalize addresses for comparison (Ethereum addresses are case-insensitive)
      const normalizedHolder = currentHolder.toLowerCase();
      const normalizedUserAddress = userAddress.toLowerCase();

      console.log("Aggregator address comparison:", {
        cropId: cropId,
        currentHolder: normalizedHolder,
        userAddress: normalizedUserAddress,
        matches: normalizedHolder === normalizedUserAddress
      });

      if (normalizedHolder !== normalizedUserAddress) {
        alert(`You are not the current holder of this crop\nYour address: ${userAddress}\nCurrent holder: ${currentHolder}`);
        return;
      }

    } catch (err) {
      console.error("Error reading current holder from blockchain:", err);
      alert("Failed to verify crop ownership. Please try again.");
      return;
    }

    try {
      const contract = await getContract();

      // Use crop ID directly as bytes32 (no string encoding needed)
      let cropID;
      if (cropId.startsWith('0x')) {
        // If it's already a hex string, use it directly
        cropID = cropId;
      } else {
        // If it's not hex, try to encode as bytes32 string
        try {
          cropID = ethers.encodeBytes32String(cropId);
        } catch (err) {
          alert("Invalid crop ID format. Please copy the full crop ID from the Crop Status table.");
          return;
        }
      }

      // optional: call divide batch (if you want to record processing step)
      await contract.aggregatorDivideBatch(cropID, date);

      const tx = await contract.aggregatorTransferToRetailer(
        cropID,
        retailer,
        date
      );

      await tx.wait();

      // Read the processing cost from blockchain
      const batchData = await contract.batches(cropID);
      const processingCost = Number(batchData.processingCost) || 0;

      const updated = crops.map((c) =>
        c.id === cropId
          ? {
            ...c,
            stage: "Processed by Aggregator",
            holder: retailer,
            transferDate: date,
            history: [
              ...(c.history || []),
              {
                role: "Aggregator",
                sender: userAddress,
                receiver: retailer,
                date,
                cost: processingCost,  // USE BLOCKCHAIN COST
                note: "Processed, graded & sent to retailer",
              },
            ],
          }
          : c
      );

      setCrops(updated);

      alert("Crop processed & sent to Retailer on blockchain ✅");

      setCropId("");
      setDate("");
      setRetailer("");

    } catch (err) {
      console.error(err);
      alert("Blockchain transfer failed");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="aggregator-root">
      <div
        className="background-layer"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          backgroundImage: "url('/images/aggregator.png')",
          backgroundSize: "cover",
          backgroundPosition: "left center",
          backgroundRepeat: "no-repeat",
          zIndex: -1
        }}
      />

      <div className="ui-layer" style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        height: "100vh",
        paddingLeft: "40px",
        paddingRight: "40px",
        paddingTop: "20px"
      }}>
        <div className="container">
          <div className="dashboard-grid" style={{ gap: "60px" }}>

            {/* RECEIVE */}
            <div className="dashboard-section" style={{ width: "130%", marginLeft: "-20px" }}>
              <div className="section-title">Receive from Supplier</div>

              <input className="detail-input" placeholder="Crop ID" value={receiveCropId} onChange={(e) => setReceiveCropId(e.target.value)} />
              <input className="detail-input" type="number" placeholder="Processing Cost (₹)" value={receiveCost} onChange={(e) => setReceiveCost(e.target.value)} />
              <input className="detail-input" type="date" value={receiveDate} onChange={(e) => setReceiveDate(e.target.value)} />

              <button className="action-btn" onClick={receiveFromSupplier} disabled={isReceiving}>
                {isReceiving ? "Receiving..." : "Receive Crop"}
              </button>
            </div>

            {/* PROCESS & SEND */}
            <div className="dashboard-section" style={{ width: "130%" }}>
              <div className="section-title">Process & Send Crop</div>

              <input className="detail-input" placeholder="Crop ID" value={cropId} onChange={(e) => setCropId(e.target.value)} />
              <input className="detail-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              <input className="detail-input" placeholder="Retailer Wallet Address (0x...)" value={retailer} onChange={(e) => setRetailer(e.target.value)} />

              <button className="action-btn" onClick={processAndSendCrop} disabled={isProcessing}>
                {isProcessing ? "Processing..." : "Process & Send to Retailer"}
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}