// src/components/TraceProduct.js
import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { getContract } from "../utils/web3";

export default function TraceProduct({ crops, selectedCrop }) {
  const [cropId, setCropId] = useState("");
  const [crop, setCrop] = useState(null);
  const [showTimeline, setShowTimeline] = useState(false);

  // autofill from selected crop
  useEffect(() => {
    if (selectedCrop && selectedCrop.id) {
      setCropId(selectedCrop.id);
    }
  }, [selectedCrop]);

  // Component refresh - handles crop tracing functionality

  // =========================
  // TRACE FROM BLOCKCHAIN
  // =========================
  const handleTrace = async () => {
    if (!cropId) {
      alert("Please enter Crop ID");
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

      // read mappings from blockchain
      const cropData = await contract.crops(cropID);
      const supplyData = await contract.supplies(cropID);
      const batchData = await contract.batches(cropID);
      const retailData = await contract.retails(cropID);
      const purchaseData = await contract.purchases(cropID);

      // build timeline with proper holder verification
      console.log("Trace Product Debug - Building timeline from blockchain data");

      // Determine actual holders from each mapping
      let farmerHolder = cropData.currentHolder;
      let supplierHolder = supplyData.currentHolder && supplyData.currentHolder !== "0x0000000000000000000000000000000000000000"
        ? supplyData.currentHolder
        : null;
      let aggregatorHolder = batchData.currentHolder && batchData.currentHolder !== "0x0000000000000000000000000000000000000000"
        ? batchData.currentHolder
        : null;
      let retailerHolder = retailData.holder && retailData.holder !== "0x0000000000000000000000000000000000000000"
        ? retailData.holder
        : null;
      let customerBuyer = purchaseData.buyer && purchaseData.buyer !== "0x0000000000000000000000000000000000000000"
        ? purchaseData.buyer
        : null;

      console.log("Trace Product Debug - Determined holders:", {
        farmer: farmerHolder,
        supplier: supplierHolder,
        aggregator: aggregatorHolder,
        retailer: retailerHolder,
        customer: customerBuyer
      });

      // Build timeline based on actual data availability
      const history = [];

      // Always include farmer (crop creation)
      history.push({
        role: "Farmer",
        date: cropData.date || "N/A",
        cost: Number(cropData.price) || 0,
        sender: farmerHolder || "N/A",
        receiver: supplierHolder || "N/A",
        note: "Crop harvested & registered",
        active: true
      });

      // Include supplier if data exists
      if (supplierHolder) {
        history.push({
          role: "Supplier",
          date: supplyData.receivedDate || "N/A",
          cost: Number(supplyData.transportCost) || 0,
          sender: farmerHolder || "N/A",
          receiver: aggregatorHolder || "N/A",
          note: "Transported to aggregator",
          active: true
        });
      }

      // Include aggregator if data exists
      if (aggregatorHolder) {
        history.push({
          role: "Aggregator",
          date: batchData.receivedDate || "N/A",
          cost: Number(batchData.processingCost) || 0,
          sender: supplierHolder || farmerHolder || "N/A",
          receiver: aggregatorHolder || "N/A",
          note: "Processed & sent to retailer",
          active: true
        });
      }

      // Include retailer if data exists
      if (retailerHolder) {
        // Only show retail price if product hasn't been sold to customer yet
        const isSoldToCustomer = customerBuyer && purchaseData.purchased;
        history.push({
          role: "Retailer",
          date: retailData.receivedDate || "N/A",
          cost: isSoldToCustomer ? 0 : Number(retailData.retailPrice) || 0,
          sender: aggregatorHolder || supplierHolder || farmerHolder || "N/A",
          receiver: customerBuyer || "Awaiting customer purchase",
          note: isSoldToCustomer ? "Sold to customer" : "Available for purchase",
          active: true
        });
      }

      // Include customer if data exists
      if (customerBuyer && purchaseData.purchased) {
        history.push({
          role: "Customer",
          date: purchaseData.purchaseDate || "N/A",
          cost: Number(purchaseData.purchasePrice) || 0,
          sender: retailerHolder || "N/A",
          receiver: customerBuyer || "N/A",
          note: "Purchased successfully",
          active: true
        });
      }

      // Debug logging to see what data we're getting
      console.log("Trace Data Debug:", {
        cropData: {
          price: cropData.price,
          date: cropData.date,
          currentHolder: cropData.currentHolder
        },
        supplyData: {
          transportCost: supplyData.transportCost,
          receivedDate: supplyData.receivedDate,
          transferDate: supplyData.transferDate,     // 
          currentHolder: supplyData.currentHolder
        },
        batchData: {
          receivedDate: batchData.receivedDate,
          currentHolder: batchData.currentHolder,
          processingCost: batchData.processingCost,  // 
          exists: batchData.exists
        },
        retailData: {
          retailPrice: retailData.retailPrice,
          receivedDate: retailData.receivedDate,
          holder: retailData.holder,
          exists: retailData.exists
        },
        purchaseData: {
          purchasePrice: purchaseData.purchasePrice,
          purchaseDate: purchaseData.purchaseDate,
          buyer: purchaseData.buyer
        }
      });

      console.log("Retailer Cost Debug:", {
        retailPriceRaw: retailData.retailPrice,
        retailPriceType: typeof retailData.retailPrice,
        retailPriceNumber: Number(retailData.retailPrice),
        finalCost: Number(retailData.retailPrice) || 0
      });

      setCrop({
        cropId,
        cropType: cropData.cropType,
        origin: cropData.origin,
        history,
      });

      setShowTimeline(true);
      return;

    } catch (err) {
      console.error("Blockchain trace failed, using fallback", err);
    }

    // fallback to local data
    const found = crops.find((c) => c.id === cropId);
    if (!found) {
      alert("Invalid Crop ID");
      return;
    }

    // Check if local data has retailer price and customer purchase
    console.log("Fallback data debug:", {
      foundCrop: found,
      hasHistory: found.history,
      retailerStage: found.history?.find(h => h.role === "Retailer"),
      customerStage: found.history?.find(h => h.role === "Customer")
    });

    // If local data has retailer price and customer purchase, remove retailer cost
    if (found.history) {
      const retailerStage = found.history.find(h => h.role === "Retailer");
      const customerStage = found.history.find(h => h.role === "Customer");

      if (retailerStage && customerStage) {
        retailerStage.cost = 0; // Remove retailer price when customer purchase exists
        console.log("Removed retailer cost from fallback data");
      }
    }

    setCrop({
      cropId,
      cropType: found.cropType,
      origin: found.origin,
      history: found.history,
    });

    setShowTimeline(true);
  };

  // =========================
  // TOTAL PRICE
  // =========================
  const finalPrice = crop?.history ? (() => {
    const customerStage = crop.history.find(h => h.role === "Customer");
    if (customerStage && customerStage.cost > 0) {
      // If customer purchase exists, show only the purchase price
      return Number(customerStage.cost);
    } else {
      // Otherwise show cumulative costs
      return crop.history.reduce((sum, h) => sum + Number(h.cost || 0), 0);
    }
  })() : 0;

  // =========================
  // ADDRESS FORMAT
  // =========================
  const formatAddress = (address) => {
    if (!address || address === "0x0000000000000000000000000000000000000000") {
      return "N/A";
    }
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getPreviousRole = (index, history) => {
    if (index === 0) return "Origin";
    return history[index - 1].role;
  };

  return (
    <div className="container">

      <div className="dashboard-section" style={{ maxWidth: "520px" }}>
        <div className="section-title">Trace Product</div>

        <input
          className="detail-input"
          placeholder="Enter Crop ID"
          value={cropId}
          onChange={(e) => setCropId(e.target.value)}
        />

        <button className="action-btn" onClick={handleTrace}>
          Trace Product
        </button>
      </div>

      {showTimeline && crop && (
        <div className="timeline-overlay">
          <div className="timeline-modal" style={{
            maxWidth: "1400px",
            width: "98vw",
            maxHeight: "none",
            overflow: "visible",
            padding: "20px"
          }}>
            <button className="close-btn" onClick={() => setShowTimeline(false)}>
              ✕
            </button>

            <h2 style={{ textAlign: "center", marginBottom: "16px" }}>
              Supply Chain Timeline
            </h2>

            <div className="timeline-grid" style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "25px",
              marginBottom: "20px"
            }}>
              {crop.history.map((stage, index) => (
                <div key={index} className="timeline-card" style={{
                  padding: "20px",
                  minHeight: "200px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between"
                }}>
                  <div>
                    <h4>{index + 1}. {stage.role}</h4>
                    <p><b>Date:</b> {stage.date}</p>
                    <p><b>Cost:</b> ₹{stage.cost}</p>
                    <p><b>From:</b> {formatAddress(stage.sender)}</p>
                    <p><b>To:</b> {formatAddress(stage.receiver)}</p>
                  </div>
                  <p className="timeline-note" style={{ marginTop: "10px", fontStyle: "italic" }}>{stage.note}</p>
                </div>
              ))}
            </div>

            <div className="total-box">
              Total Amount to Pay: ₹{finalPrice}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}