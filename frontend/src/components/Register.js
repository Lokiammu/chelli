import React, { useState } from "react";
import { getContract, getEthereumProvider, checkNetwork } from "../utils/web3";

function Register({ account, onSwitchToLogin }) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("Farmer");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const eth = getEthereumProvider();
    if (!eth) {
      alert("MetaMask not detected!");
      return;
    }

    if (!account) {
      alert("Please connect MetaMask wallet first");
      return;
    }

    try {
      setLoading(true);

      // Validate network
      const net = await checkNetwork();
      if (!net.ok) {
        alert(net.error);
        return;
      }

      const contract = await getContract();
      let tx;

      if (role === "Farmer") {
        tx = await contract.registerFarmer(name, "Unknown", "NA");
      } else if (role === "Supplier") {
        tx = await contract.registerSupplier(name, "Unknown", "NA");
      } else if (role === "Aggregator") {
        tx = await contract.registerAggregator(name, "Unknown", "NA");
      } else if (role === "Retailer") {
        tx = await contract.registerRetailer(name, "Unknown", "NA");
      } else if (role === "Customer") {
        tx = await contract.registerCustomer(name, "Unknown", "NA");
      }

      await tx.wait();

      alert(`Successfully registered as ${role} on blockchain`);
      onSwitchToLogin();
    } catch (err) {
      console.error("Registration error:", err);
      if (err.message.includes("Account already registered")) {
        alert("This wallet is already registered. Please login instead.");
      } else if (err.message.includes("Contract address not found")) {
        alert(err.message);
      } else {
        alert("Blockchain transaction failed or rejected. Check console for details.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h2>Register</h2>

        <form onSubmit={handleSubmit}>
          <p>
            <b>Wallet:</b> {account || "Not Connected"}
          </p>

          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="Farmer">Farmer</option>
            <option value="Supplier">Supplier</option>
            <option value="Aggregator">Aggregator</option>
            <option value="Retailer">Retailer</option>
            <option value="Customer">Customer</option>
          </select>

          <button type="submit" disabled={loading}>
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        <p style={{ marginTop: "12px", fontSize: "14px" }}>
          Already registered?{" "}
          <span
            style={{ color: "#f28c6f", cursor: "pointer", fontWeight: "bold" }}
            onClick={onSwitchToLogin}
          >
            Login
          </span>
        </p>
      </div>
    </div>
  );
}

export default Register;
