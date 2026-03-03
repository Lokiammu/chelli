// src/components/RetailerDashboard.js
import React, { useState } from "react";
import CropStatusTable from "./CropStatusTable";
import { ethers } from "ethers";
import CONTRACT_JSON from "../abi/TrackSupplyChain.json";

const CONTRACT_ADDRESS = "0x6934948aa57D9909f90b06905559ddf0851BE29F";
const ABI = CONTRACT_JSON.abi;

export default function RetailerDashboard({ userAddress, crops, setCrops }) {

  const [cropIdAccept, setCropIdAccept] = useState("");
  const [acceptDate, setAcceptDate] = useState("");
  const [retailPrice, setRetailPrice] = useState("");  // ADD RETAIL PRICE STATE

  const [cropIdSell, setCropIdSell] = useState("");
  const [margin, setMargin] = useState("");
  const [sellDate, setSellDate] = useState("");
  const [customer, setCustomer] = useState("");

  const [isLoading, setIsLoading] = useState(false);

  // CONNECT CONTRACT
  const getContract = async () => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    return new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
  };

  // =========================
  // ACCEPT FROM AGGREGATOR (BLOCKCHAIN)
  // =========================
  const acceptFromAggregator = async () => {
    if (isLoading) {
      alert("Transaction in progress. Please wait...");
      return;
    }

    if (!cropIdAccept || !acceptDate || !retailPrice) {
      alert("Enter Crop ID, Accept Date & Retail Price");
      return;
    }

    const existingCrop = crops.find((c) => c.id === cropIdAccept);
    if (!existingCrop) {
      alert("Invalid Crop ID!");
      return;
    }

    // Read current holder directly from blockchain instead of using local state
    try {
      setIsLoading(true);
      const contract = await getContract();

      // Use crop ID directly as bytes32 (no string encoding needed)
      let cropID;
      if (cropIdAccept.startsWith('0x')) {
        // If it's already a hex string, use it directly
        cropID = cropIdAccept;
      } else {
        // If it's not hex, try to encode as bytes32 string
        try {
          cropID = ethers.encodeBytes32String(cropIdAccept);
        } catch (err) {
          alert("Invalid crop ID format. Please copy the full crop ID from the Crop Status table.");
          setIsLoading(false);
          return;
        }
      }

      // Read from all mappings to find current holder
      const cropData = await contract.crops(cropID);
      const supplyData = await contract.supplies(cropID);
      const batchData = await contract.batches(cropID);
      const retailData = await contract.retails(cropID);

      console.log("Retailer Debug - Raw mapping data:", {
        cropId: cropIdAccept,
        cropMapping: {
          currentHolder: cropData.currentHolder,
          transferDate: cropData.transferDate
        },
        supplyMapping: {
          currentHolder: supplyData.currentHolder,
          receivedDate: supplyData.receivedDate,
          transportCost: supplyData.transportCost
        },
        batchMapping: {
          currentHolder: batchData.currentHolder,
          receivedDate: batchData.receivedDate,
          exists: batchData.exists
        },
        retailMapping: {
          holder: retailData.holder,
          receivedDate: retailData.receivedDate,
          retailPrice: retailData.retailPrice,
          exists: retailData.exists
        }
      });

      // Determine current holder based on which mapping has data
      let currentHolder = cropData.currentHolder;
      
      console.log("Retailer Debug - Holder selection logic:", {
        initialHolder: currentHolder,
        supplyHolder: supplyData.currentHolder,
        batchHolder: batchData.currentHolder,
        retailHolder: retailData.holder
      });

      // Check if supplier has received this crop
      if (supplyData.currentHolder && supplyData.currentHolder !== "0x0000000000000000000000000000000000000") {
        currentHolder = supplyData.currentHolder;
        console.log("Retailer Debug - Selected supplier as holder:", currentHolder);
      }
      
      // Check if aggregator has received this crop
      if (batchData.currentHolder && batchData.currentHolder !== "0x0000000000000000000000000000000000000") {
        currentHolder = batchData.currentHolder;
        console.log("Retailer Debug - Selected aggregator as holder:", currentHolder);
      }
      
      // Check if retailer has received this crop
      if (retailData.holder && retailData.holder !== "0x0000000000000000000000000000000000000") {
        currentHolder = retailData.holder;
        console.log("Retailer Debug - Selected retailer as holder:", currentHolder);
      }

      // Normalize addresses for comparison (Ethereum addresses are case-insensitive)
      const normalizedHolder = currentHolder.toLowerCase();
      const normalizedUserAddress = userAddress.toLowerCase();

      console.log("Retailer address comparison:", {
        cropId: cropIdAccept,
        currentHolder: normalizedHolder,
        userAddress: normalizedUserAddress,
        matches: normalizedHolder === normalizedUserAddress
      });

      if (normalizedHolder !== normalizedUserAddress) {
        alert(`You are not the intended recipient of this crop\nYour address: ${userAddress}\nCurrent holder: ${currentHolder}`);
        setIsLoading(false);
        return;
      }

    } catch (err) {
      console.error("Error reading current holder from blockchain:", err);
      alert("Failed to verify crop ownership. Please try again.");
      setIsLoading(false);
      return;
    }

    try {
      const contract = await getContract();

      // Use crop ID directly as bytes32 (no string encoding needed)
      let cropID;
      if (cropIdAccept.startsWith('0x')) {
        // If it's already a hex string, use it directly
        cropID = cropIdAccept;
      } else {
        // If it's not hex, try to encode as bytes32 string
        try {
          cropID = ethers.encodeBytes32String(cropIdAccept);
        } catch (err) {
          alert("Invalid crop ID format. Please copy the full crop ID from the Crop Status table.");
          setIsLoading(false);
          return;
        }
      }

      console.log("Retailer Accept Debug - Sending to blockchain:", {
        cropID: cropID,
        retailPrice: retailPrice,  // USE STATE VARIABLE
        acceptDate: acceptDate,
        functionName: "retailerReceiveFromAggregator"
      });

      const tx = await contract.retailerReceiveFromAggregator(
        cropID,
        retailPrice,    // USE STATE VARIABLE
        acceptDate
      );

      console.log("Retailer Accept Debug - Transaction hash:", tx.hash);
      await tx.wait();
      console.log("Retailer Accept Debug - Transaction confirmed");

      const updated = crops.map((c) =>
        c.id === cropIdAccept
          ? {
              ...c,
              stage: "Retailer Accepted",
              holder: userAddress,
              transferDate: acceptDate,
            }
          : c
      );

      setCrops(updated);

      alert("Crop accepted from Aggregator on blockchain ");

      setCropIdAccept("");
      setAcceptDate("");
      setRetailPrice("");  // CLEAR RETAIL PRICE

    } catch (err) {
      console.error(err);
      alert("Blockchain accept failed");
    } finally {
      setIsLoading(false);
    }
  };

  // =========================
  // SELL TO CUSTOMER (BLOCKCHAIN)
  // =========================
  const finalize = async () => {
    if (isLoading) {
      alert("Transaction in progress. Please wait...");
      return;
    }

    if (!cropIdSell || !margin || !sellDate || !customer) {
      alert("Enter all selling details");
      return;
    }

    const existingCrop = crops.find((c) => c.id === cropIdSell);
    if (!existingCrop) {
      alert("Invalid Crop ID!");
      return;
    }

    // Read from all mappings to find current holder (same logic as acceptFromAggregator)
    try {
      const contract = await getContract();

      // Use crop ID directly as bytes32 (no string encoding needed)
      let cropID;
      if (cropIdSell.startsWith('0x')) {
        // If it's already a hex string, use it directly
        cropID = cropIdSell;
      } else {
        // If it's not hex, try to encode as bytes32 string
        try {
          cropID = ethers.encodeBytes32String(cropIdSell);
        } catch (err) {
          alert("Invalid crop ID format. Please copy the full crop ID from the Crop Status table.");
          setIsLoading(false);
          return;
        }
      }

      // Read from all mappings to find current holder
      const cropData = await contract.crops(cropID);
      const supplyData = await contract.supplies(cropID);
      const batchData = await contract.batches(cropID);
      const retailData = await contract.retails(cropID);

      console.log("Retailer Sell Debug - Raw mapping data:", {
        cropId: cropIdSell,
        cropMapping: {
          currentHolder: cropData.currentHolder,
          transferDate: cropData.transferDate
        },
        supplyMapping: {
          currentHolder: supplyData.currentHolder,
          receivedDate: supplyData.receivedDate,
          transportCost: supplyData.transportCost
        },
        batchMapping: {
          currentHolder: batchData.currentHolder,
          receivedDate: batchData.receivedDate,
          exists: batchData.exists
        },
        retailMapping: {
          holder: retailData.holder,
          receivedDate: retailData.receivedDate,
          retailPrice: retailData.retailPrice,
          exists: retailData.exists
        }
      });

      // For retailerTransferToConsumer, we only need to check retails mapping
      // since the smart contract specifically checks retails[cropID].holder
      let currentHolder = retailData.holder;
      
      console.log("Retailer Sell Debug - Holder selection logic:", {
        retailHolder: retailData.holder,
        selectedHolder: currentHolder
      });

      // Normalize addresses for comparison (Ethereum addresses are case-insensitive)
      const normalizedHolder = currentHolder.toLowerCase();
      const normalizedUserAddress = userAddress.toLowerCase();

      console.log("Retailer Sell address comparison:", {
        cropId: cropIdSell,
        currentHolder: normalizedHolder,
        userAddress: normalizedUserAddress,
        matches: normalizedHolder === normalizedUserAddress
      });

      if (normalizedHolder !== normalizedUserAddress) {
        alert(`You are not the current holder of this crop\nYour address: ${userAddress}\nCurrent holder: ${currentHolder}`);
        setIsLoading(false);
        return;
      }

    } catch (err) {
      console.error("Error reading current holder from blockchain:", err);
      alert("Failed to verify crop ownership. Please try again.");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const contract = await getContract();
      // Use crop ID directly as bytes32 (no string encoding needed)
      let cropID;
      if (cropIdSell.startsWith('0x')) {
        // If it's already a hex string, use it directly
        cropID = cropIdSell;
      } else {
        // If it's not hex, try to encode as bytes32 string
        try {
          cropID = ethers.encodeBytes32String(cropIdSell);
        } catch (err) {
          alert("Invalid crop ID format. Please copy the full crop ID from the Crop Status table.");
          setIsLoading(false);
          return;
        }
      }

      const tx = await contract.retailerTransferToConsumer(
        cropID,
        customer,
        sellDate
      );

      await tx.wait();

      const updated = crops.map((c) =>
        c.id === cropIdSell
          ? {
              ...c,
              stage: "Sold to Customer",
              holder: customer,
              transferDate: sellDate
            }
          : c
      );

      setCrops(updated);

      alert("Product sold to Customer on blockchain ");

      setCropIdSell("");
      setMargin("");
      setSellDate("");
      setCustomer("");

    } catch (err) {
      console.error(err);
      alert("Blockchain sell failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="retailer-root">
      <div 
        className="background-layer"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          backgroundImage: "url('/images/retailer.png')",
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

            {/* ACCEPT */}
            <div className="dashboard-section" style={{ width: "130%", marginLeft: "-20px" }}>
              <div className="section-title">Accept Crop from Aggregator</div>

              <input className="detail-input" placeholder="Crop ID" value={cropIdAccept} onChange={(e) => setCropIdAccept(e.target.value)} />
              <input className="detail-input" type="number" placeholder="Retail Price (₹)" value={retailPrice} onChange={(e) => setRetailPrice(e.target.value)} />
              <input className="detail-input" type="date" value={acceptDate} onChange={(e) => setAcceptDate(e.target.value)} />

              <button className="action-btn" onClick={acceptFromAggregator} disabled={isLoading}>
                {isLoading ? "Processing..." : "Accept Crop"}
              </button>
            </div>

            {/* SELL */}
            <div className="dashboard-section" style={{ width: "130%" }}>
              <div className="section-title">Sell Crop to Customer</div>

              <input className="detail-input" placeholder="Crop ID" value={cropIdSell} onChange={(e) => setCropIdSell(e.target.value)} />
              <input className="detail-input" type="date" value={sellDate} onChange={(e) => setSellDate(e.target.value)} />
              <input className="detail-input" placeholder="Customer Wallet Address (0x...)" value={customer} onChange={(e) => setCustomer(e.target.value)} />

              <button className="action-btn" onClick={finalize} disabled={isLoading}>
                {isLoading ? "Processing..." : "Sell to Customer"}
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}