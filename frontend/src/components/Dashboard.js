// src/pages/Dashboard.js
import React from "react";

import FarmerDashboard from "../components/FarmerDashboard";
import SupplierDashboard from "../components/SupplierDashboard";
import AggregatorDashboard from "../components/AggregatorDashboard";
import RetailerDashboard from "../components/RetailerDashboard";
import CustomerDashboard from "../components/CustomerDashboard";
import CropStatusTable from "../components/CropStatusTable"; // ✅ ADD THIS

export default function Dashboard({ userAddress, crops, setCrops, role, activeRole, setActiveRole, showCropStatus, setShowCropStatus }) {

  // Role-based background images
  const getBackgroundImage = () => {
    switch (role) {
      case "farmer":
        return "url('/images/farmer.png')";
      case "supplier":
        return "url('/images/supplier.png')";
      case "aggregator":
        return "url('/images/aggregator.png')";
      case "retailer":
        return "url('/images/retailer.png')";
      case "customer":
        return "url('/images/customer.png')";
      default:
        return "url('/images/farmer.png')";
    }
  };

  const renderRole = () => {
    // Only allow access to user's own role
    if (activeRole !== role) {
      return (
        <div className="dashboard-section">
          <div className="section-title">Access Denied</div>
          <p>You can only access your own role dashboard ({role}).</p>
        </div>
      );
    }

    switch (activeRole) {
      case "farmer":
        return (
          <FarmerDashboard
            userAddress={userAddress}
            crops={crops}
            setCrops={setCrops}
          />
        );
      case "supplier":
        return (
          <SupplierDashboard
            userAddress={userAddress}
            crops={crops}
            setCrops={setCrops}
          />
        );
      case "aggregator":
        return (
          <AggregatorDashboard
            userAddress={userAddress}
            crops={crops}
            setCrops={setCrops}
          />
        );
      case "retailer":
        return (
          <RetailerDashboard
            userAddress={userAddress}
            crops={crops}
            setCrops={setCrops}
          />
        );
      case "customer":
        return <CustomerDashboard crops={crops} setCrops={setCrops} />;
      default:
        return null;
    }
  };

  return (
    <div className="dashboard-page">
      {/* Background Layer */}
      <div
        className="background-layer"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          backgroundImage: getBackgroundImage(),
          backgroundSize: "cover",
          backgroundPosition: "left center",
          backgroundRepeat: "no-repeat",
          zIndex: -1,
        }}
      />

      {/* UI Layer */}
      <div className="ui-layer">
        {/* Main Content */}
        <div className="dashboard-content">
          {showCropStatus ? (
            <CropStatusTable />
          ) : (
            renderRole()
          )}
        </div>
      </div>
    </div>
  );
}
