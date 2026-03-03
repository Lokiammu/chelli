import React, { useState } from "react";

function PaymentPage({ product, currentUser }) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);

    // Simulate payment processing
    setTimeout(() => {
      alert(`Payment of ₹${product.price} for ${product.name} successful!`);
      setIsProcessing(false);
      // Navigate back to sales dashboard
      window.history.back();
    }, 2000);
  };

  return (
    <div className="payment-page">
      <div className="dashboard-section">
        <div className="section-title">💳 Payment</div>
        
        <div className="payment-content">
          {/* Product Summary */}
          <div className="product-summary">
            <h3>Order Summary</h3>
            <div className="summary-item">
              <span className="label">Product:</span>
              <span className="value">{product.name}</span>
            </div>
            <div className="summary-item">
              <span className="label">Price:</span>
              <span className="value">₹{product.price}</span>
            </div>
            <div className="summary-item">
              <span className="label">Farm:</span>
              <span className="value">{product.farm}</span>
            </div>
          </div>

          {/* Simple Payment Form */}
          <form onSubmit={handleSubmit} className="payment-form">
            <div className="form-section">
              <h4>Payment Information</h4>
              <div className="form-row">
                <input
                  type="text"
                  placeholder="Card Number"
                  required
                />
              </div>
              <div className="form-row">
                <input
                  type="text"
                  placeholder="Name on Card"
                  required
                />
              </div>
              <div className="form-row">
                <input
                  type="text"
                  placeholder="MM/YY"
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="submit-btn"
              disabled={isProcessing}
            >
              {isProcessing ? "Processing..." : `Pay ₹${product.price}`}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default PaymentPage;
