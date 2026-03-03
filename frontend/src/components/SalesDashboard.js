import React from "react";

function SalesDashboard({ crops, onTrackProduce, onPay, onContact, currentUser }) {
  // Fake shopping site data
  const fakeProducts = [
    {
      id: "CROP-b6293c87",
      name: "Tomatoes",
      price: 89,
      originalPrice: 129,
      discount: 29,
      rating: 4.5,
      reviews: 234,
      image: "🍅",
      category: "Vegetables",
      inStock: true,
      description: "Premium vine-ripened tomatoes, perfect for salads and sandwiches",
      shelfLife: "3 days",
      farmerName: "Green Valley Farms",
      farmerContact: "+91-98765-43210",
      vqi: 85,
      quantity: "500g",
      nutrition: {
        calories: 18,
        protein: "0.9g",
        carbs: "3.9g",
        fat: "0.2g",
        fiber: "1.2g"
      }
    },
    {
      id: "CROP-a1f4d2e9",
      name: "Lettuce",
      price: 45,
      originalPrice: 65,
      discount: 30,
      rating: 4.8,
      reviews: 189,
      image: "🥬",
      category: "Leafy Greens",
      inStock: true,
      description: "Fresh organic lettuce mix with romaine, iceberg, and butter lettuce",
      shelfLife: "2 days",
      farmerName: "Sunshine Organic Farm",
      farmerContact: "+91-87654-32109",
      vqi: 92,
      quantity: "250g",
      nutrition: {
        calories: 15,
        protein: "1.4g",
        carbs: "2.8g",
        fat: "0.1g",
        fiber: "2.6g"
      }
    },
    {
      id: "CROP-c8b7e5f3",
      name: "Strawberries",
      price: 95,
      originalPrice: 119,
      discount: 20,
      rating: 4.9,
      reviews: 512,
      image: "🍓",
      category: "Fruits",
      inStock: true,
      description: "Hand-picked sweet strawberries, bursting with flavor",
      shelfLife: "4 days",
      farmerName: "Berry Fields",
      farmerContact: "+91-76543-21098",
      vqi: 78,
      quantity: "300g",
      nutrition: {
        calories: 32,
        protein: "0.7g",
        carbs: "7.7g",
        fat: "0.3g",
        fiber: "2.0g"
      }
    },
    {
      id: "CROP-d2a9f1c6",
      name: "Carrots",
      price: 35,
      originalPrice: 49,
      discount: 25,
      rating: 4.6,
      reviews: 98,
      image: "🥕",
      category: "Root Vegetables",
      inStock: true,
      description: "Sweet and crunchy baby carrots, perfect for snacking",
      shelfLife: "5 days",
      farmerName: "Root Vegetable Co",
      farmerContact: "+91-65432-10987",
      vqi: 88,
      quantity: "400g",
      nutrition: {
        calories: 41,
        protein: "0.9g",
        carbs: "9.6g",
        fat: "0.2g",
        fiber: "2.8g"
      }
    },
    {
      id: "CROP-e4c8b7a2",
      name: "Apples",
      price: 79,
      originalPrice: 95,
      discount: 15,
      rating: 4.7,
      reviews: 156,
      image: "🍎",
      category: "Fruits",
      inStock: true,
      description: "Crisp and juicy apples from Mountain Orchard",
      shelfLife: "7 days",
      farmerName: "Mountain Orchard",
      farmerContact: "+91-54321-09876",
      vqi: 95,
      quantity: "1kg",
      nutrition: {
        calories: 52,
        protein: "0.3g",
        carbs: "14g",
        fat: "0.2g",
        fiber: "2.4g"
      }
    },
    {
      id: "CROP-f9d3e5c1",
      name: "Avocado",
      price: 119,
      originalPrice: 149,
      discount: 30,
      rating: 4.4,
      reviews: 89,
      image: "🥑",
      category: "Fruits",
      inStock: true,
      description: "Ripe avocados perfect for toast and salads",
      shelfLife: "4 days",
      farmerName: "Tropical Farms",
      farmerContact: "+91-43210-98765",
      vqi: 73,
      quantity: "400g",
      nutrition: {
        calories: 160,
        protein: "2g",
        carbs: "8.5g",
        fat: "14.7g",
        fiber: "6.7g"
      }
    },
    {
      id: "CROP-g7a2f8d4",
      name: "Herbs",
      price: 55,
      originalPrice: 69,
      discount: 20,
      rating: 4.3,
      reviews: 67,
      image: "🌿",
      category: "Herbs",
      inStock: true,
      description: "Fresh herbs including basil, rosemary, and thyme",
      shelfLife: "6 days",
      farmerName: "Herb Garden",
      farmerContact: "+91-32109-87654",
      vqi: 81,
      quantity: "100g",
      nutrition: {
        calories: 8,
        protein: "0.6g",
        carbs: "1.8g",
        fat: "0.3g",
        fiber: "2.1g"
      }
    },
    {
      id: "CROP-h5e9c2b6",
      name: "Potatoes",
      price: 65,
      originalPrice: 89,
      discount: 30,
      rating: 4.2,
      reviews: 145,
      image: "🥔",
      category: "Vegetables",
      inStock: true,
      description: "Assorted potatoes including russet, red, and sweet potatoes",
      shelfLife: "10 days",
      farmerName: "Root Vegetable Co",
      farmerContact: "+91-21098-76543",
      vqi: 67,
      quantity: "1kg",
      nutrition: {
        calories: 77,
        protein: "2g",
        carbs: "17g",
        fat: "0.1g",
        fiber: "2.2g"
      }
    }
  ];

  const renderRating = (rating) => {
    const fullStars = 5;
    const filledStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    return (
      <div className="rating">
        {[...Array(fullStars)].map((_, i) => (
          <span key={i} className="star">
            {i < filledStars ? "★" : i === filledStars && hasHalfStar ? "☆" : "☆"}
          </span>
        ))}
      </div>
    );
  };

  const renderPrice = (price, originalPrice, discount) => {
    const hasDiscount = discount > 0;
    
    return (
      <div className="price-container">
        <span className="current-price">₹{price}</span>
        {hasDiscount && (
          <React.Fragment>
            <span className="original-price">₹{originalPrice}</span>
            <span className="discount-badge">-{discount}% OFF</span>
          </React.Fragment>
        )}
      </div>
    );
  };

  return (
    <div className="shopping-site">
      <div className="shopping-header">
        <div className="search-bar">
          <input 
            type="text" 
            placeholder="🔍 Search for fresh produce..." 
            className="search-input"
          />
          <button className="search-btn">Search</button>
        </div>
        
        <div className="header-actions">
          <button className="cart-btn">
            🛒 Cart (3)
          </button>
          <button className="user-btn">
            👤 {currentUser?.name || 'Guest'}
          </button>
        </div>
      </div>

      <div className="products-grid">
        {fakeProducts.map((product) => (
          <div key={product.id} className="product-card">
            <div className="product-image">
              <span className="product-emoji">{product.image}</span>
              {product.inStock && <span className="stock-badge">In Stock</span>}
            </div>
            
            <div className="product-info">
              <div className="product-header">
                <span className="product-category">{product.category}</span>
                <h3 className="product-name">{product.name}</h3>
                {renderPrice(product.price, product.originalPrice, product.discount)}
              </div>
              
              <div className="product-rating">
                {renderRating(product.rating)}
                <span className="review-count">({product.reviews} reviews)</span>
                <span className="crop-id">ID: {product.id}</span>
              </div>
              
              <p className="product-description">{product.description}</p>
              
              <div className="product-meta">
                <div className="meta-item">
                  <span className="meta-label">⏰ Shelf Life:</span>
                  <span className="meta-value">{product.shelfLife}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">⚖️ Quantity:</span>
                  <span className="meta-value">{product.quantity}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">📊 VQI:</span>
                  <span className="meta-value">{product.vqi}/100</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">📦 In Stock:</span>
                  <span className="meta-value">{product.inStock ? "Yes" : "No"}</span>
                  <button 
                    className="contact-btn-small"
                    onClick={() => {
                      if (onContact) {
                        onContact(product);
                      } else {
                        alert(`Contact Farmer:\n\nFarmer: ${product.farmerName}\nContact: ${product.farmerContact}\nProduct: ${product.name}\n\nPlease refresh the page to enable chat functionality.`);
                      }
                    }}
                    title="Contact Farmer"
                  >
                    📞
                  </button>
                </div>
              </div>
            </div>

            <div className="product-actions">
              <button className="add-to-cart-btn">
                🛒 Add to Cart
              </button>
              <button 
                className="track-btn"
                onClick={() => onTrackProduce(product)}
              >
                📍 Track Produce
              </button>
              <button 
                className="pay-btn"
                onClick={() => onPay(product)}
              >
                💳 Quick Buy
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="shopping-footer">
        <div className="footer-section">
          <h3>🌾 Why Shop With Us?</h3>
          <div className="footer-features">
            <div className="feature">
              <h4>🚜 Farm Fresh</h4>
              <p>Direct from local farms within 24 hours</p>
            </div>
            <div className="feature">
              <h4>💰 Best Prices</h4>
              <p>Competitive pricing with daily deals</p>
            </div>
            <div className="feature">
              <h4>🛡️ Quality Guaranteed</h4>
              <p>All produce inspected for freshness and quality</p>
            </div>
            <div className="feature">
              <h4>🚚 Fast Delivery</h4>
              <p>Same-day delivery on orders over $25</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SalesDashboard;