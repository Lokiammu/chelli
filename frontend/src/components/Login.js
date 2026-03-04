import React, { useState } from "react";
import { getContract, getEthereumProvider, checkNetwork } from "../utils/web3";

function Login({ onLogin, account }) {
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
      alert("Connect MetaMask first!");
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

      // Check on-chain registration for the selected role
      let isValid = false;

      if (role === "Farmer") {
        isValid = await contract.farmers(account);
      } else if (role === "Supplier") {
        isValid = await contract.suppliers(account);
      } else if (role === "Aggregator") {
        isValid = await contract.aggregators(account);
      } else if (role === "Retailer") {
        isValid = await contract.retailers(account);
      } else if (role === "Customer") {
        isValid = await contract.customers(account);
      }

      if (!isValid) {
        alert(`This wallet is not registered as ${role}. Please register first.`);
        return;
      }

      // Sign message to prove wallet ownership
      const message = `Login as ${role}`;
      await eth.request({
        method: "personal_sign",
        params: [message, account],
      });

      onLogin({
        address: account,
        role,
      });

      alert(`Login successful as ${role}`);
    } catch (err) {
      console.error("Login error:", err);
      if (err.message.includes("Contract address not found")) {
        alert(err.message);
      } else {
        alert("Login failed. Check console for details.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h2>Login</h2>

        <form onSubmit={handleSubmit}>
          <p>
            <b>Wallet:</b> {account || "Not Connected"}
          </p>

          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="Farmer">Farmer</option>
            <option value="Supplier">Supplier</option>
            <option value="Aggregator">Aggregator</option>
            <option value="Retailer">Retailer</option>
            <option value="Customer">Customer</option>
          </select>

          <button type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
