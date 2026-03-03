// src/components/SupplierDashboard.js
import React, { useState } from "react";
import CropStatusTable from "./CropStatusTable";
import { ethers } from "ethers";
import CONTRACT_JSON from "../abi/TrackSupplyChain.json";

const CONTRACT_ADDRESS = "0x6934948aa57D9909f90b06905559ddf0851BE29F";
const ABI = CONTRACT_JSON.abi;

export default function SupplierDashboard({ userAddress, crops, setCrops }) {

  const [cropIdReceive, setCropIdReceive] = useState("");
  const [transportCost, setTransportCost] = useState("");
  const [receiveDate, setReceiveDate] = useState("");

  const [cropIdTransfer, setCropIdTransfer] = useState("");
  const [aggregator, setAggregator] = useState("");
  const [transferDate, setTransferDate] = useState("");

  const [isReceiving, setIsReceiving] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);

  // CONNECT CONTRACT
  const getContract = async () => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    return new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
  };

  // =========================
  // RECEIVE FROM FARMER (BLOCKCHAIN)
  // =========================
  const handleReceiveFromFarmer = async () => {
    if (isReceiving) {
      alert("Receive transaction in progress. Please wait...");
      return;
    }

    if (!cropIdReceive || !transportCost || !receiveDate) {
      alert("Enter Crop ID, Transport Cost & Received Date");
      return;
    }

    try {
      setIsReceiving(true);
      const contract = await getContract();

      // Use crop ID directly as bytes32 (no string encoding needed)
      let cropID;
      if (cropIdReceive.startsWith('0x')) {
        cropID = cropIdReceive;
      } else {
        cropID = ethers.encodeBytes32String(cropIdReceive);
      }

      const tx = await contract.supplierReceiveFromFarmer(
        cropID,
        Number(transportCost),
        receiveDate
      );

      await tx.wait();

      const updated = crops.map((c) =>
        c.id === cropIdReceive
          ? {
              ...c,
              stage: "Supplier Received",
              holder: userAddress,
              history: [
                ...(c.history || []),
                {
                  role: "Supplier",
                  date: receiveDate,
                  cost: Number(transportCost),
                  sender: c.holder,
                  receiver: userAddress,
                  note: "Received from farmer",
                },
              ],
            }
          : c
      );

      setCrops(updated);

      alert("Received crop from Farmer on blockchain ");

      setCropIdReceive("");
      setTransportCost("");
      setReceiveDate("");

    } catch (err) {
      console.error(err);
      alert("Blockchain transaction failed");
    } finally {
      setIsReceiving(false);
    }
  };

  // =========================
  // TRANSFER TO AGGREGATOR (BLOCKCHAIN)
  // =========================
  const handleTransferToAggregator = async () => {
    if (isTransferring) {
      alert("Transfer transaction in progress. Please wait...");
      return;
    }

    if (!cropIdTransfer || !aggregator || !transferDate) {
      alert("Enter Crop ID, Aggregator Address & Transfer Date");
      return;
    }

    try {
      setIsTransferring(true);
      const contract = await getContract();

      // Use crop ID directly as bytes32 (no string encoding needed)
      let cropID = cropIdTransfer;

      const tx = await contract.supplierTransferToAggregator(
        cropID,
        aggregator,
        transferDate
      );

      await tx.wait();

      const updated = crops.map((c) =>
        c.id === cropIdTransfer
          ? {
              ...c,
              stage: "Transferred to Aggregator",
              holder: aggregator,
              transferDate,
              history: [
                ...(c.history || []),
                {
                  role: "Supplier",
                  date: transferDate,
                  sender: userAddress,
                  receiver: aggregator,
                  note: "Transferred to aggregator",
                },
              ],
            }
          : c
      );

      setCrops(updated);

      alert("Transferred crop to Aggregator on blockchain ");

      setCropIdTransfer("");
      setAggregator("");
      setTransferDate("");

    } catch (err) {
      console.error(err);
      alert("Transfer failed on blockchain");
    } finally {
      setIsTransferring(false);
    }
  };

  return (
    <div className="supplier-root">
      <div 
        className="background-layer"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          backgroundImage: "url('/images/supplier.png')",
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
        paddingLeft: "220px",
        paddingRight: "10px",
        paddingTop: "20px"
      }}>
        <div className="container supplier-dashboard watermark-container">
          <div className="dashboard-grid" style={{ gap: "60px" }}>

            {/* RECEIVE FROM FARMER */}
            <div className="dashboard-section" style={{ width: "130%", marginLeft: "-20px" }}>
              <div className="section-title">Receive Crop from Farmer</div>

              <input className="detail-input" placeholder="Crop ID" value={cropIdReceive} onChange={(e) => setCropIdReceive(e.target.value)} />
              <input className="detail-input" type="number" placeholder="Transport Cost" value={transportCost} onChange={(e) => setTransportCost(e.target.value)} />
              <input className="detail-input" type="date" value={receiveDate} onChange={(e) => setReceiveDate(e.target.value)} />

              <button className="action-btn" onClick={handleReceiveFromFarmer} disabled={isReceiving}>
                {isReceiving ? "Receiving..." : "Receive Crop"}
              </button>
            </div>

            {/* TRANSFER TO AGGREGATOR */}
            <div className="dashboard-section" style={{ width: "130%" }}>
              <div className="section-title">Transfer Crop to Aggregator</div>

              <input className="detail-input" placeholder="Crop ID" value={cropIdTransfer} onChange={(e) => setCropIdTransfer(e.target.value)} />
              <input className="detail-input" placeholder="Aggregator Address (0x...)" value={aggregator} onChange={(e) => setAggregator(e.target.value)} />
              <input className="detail-input" type="date" value={transferDate} onChange={(e) => setTransferDate(e.target.value)} />

              <button className="action-btn" onClick={handleTransferToAggregator} disabled={isTransferring}>
                {isTransferring ? "Transferring..." : "Transfer Crop"}
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}