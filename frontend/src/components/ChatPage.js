import React, { useState } from "react";

function ChatPage({ farmer, farmerContact, product, currentUser }) {
  const [message, setMessage] = useState("");
  const [chatMessages, setChatMessages] = useState([
    {
      sender: "farmer",
      text: `Hello! I'm here to help you with inquiries about ${product.name}. How can I assist you today?`,
      time: new Date().toLocaleTimeString()
    }
  ]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    const newMessage = {
      sender: "user",
      text: message,
      time: new Date().toLocaleTimeString()
    };

    setChatMessages([...chatMessages, newMessage]);
    setMessage("");

    // Simulate farmer response
    setTimeout(() => {
      const farmerResponse = {
        sender: "farmer",
        text: `Thank you for your message about ${product.name}. I'll get back to you shortly with more details!`,
        time: new Date().toLocaleTimeString()
      };
      setChatMessages(prev => [...prev, farmerResponse]);
    }, 1000);
  };

  return (
    <div className="chat-page">
      <div className="dashboard-section">
        <div className="section-title">💬 Chat with Farmer</div>
        
        <div className="chat-header">
          <div className="farmer-info">
            <h3>{farmer}</h3>
            <p>📞 {farmerContact}</p>
            <p>🌱 Product: {product.name}</p>
          </div>
          <div className="chat-status">
            <span className="status-dot online"></span>
            <span>Online</span>
          </div>
        </div>

        <div className="chat-messages">
          {chatMessages.map((msg, index) => (
            <div key={index} className={`message ${msg.sender}`}>
              <div className="message-content">
                <p>{msg.text}</p>
                <span className="message-time">{msg.time}</span>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSendMessage} className="chat-input">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            className="message-input"
          />
          <button type="submit" className="send-btn">
            📤 Send
          </button>
        </form>
      </div>
    </div>
  );
}

export default ChatPage;
