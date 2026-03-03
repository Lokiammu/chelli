import React from "react";

function AboutUs() {
  return (
    <div className="about-us-root">
      {/* Background layer */}
      <div 
        className="background-layer"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          backgroundImage: "url('/images/farmer.png')",
          backgroundSize: "cover",
          backgroundPosition: "left center",
          backgroundRepeat: "no-repeat",
          zIndex: -1
        }}
      />
      
      {/* Content layer - fits screen like background */}
      <div 
        className="content-layer"
        style={{
          position: "fixed",
          top: "60px",
          left: 0,
          width: "100vw",
          height: "calc(100vh - 60px)",
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          padding: '40px',
          overflow: 'hidden',
          zIndex: 1
        }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          height: '100%',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <h1 style={{ textAlign: 'center', marginBottom: '20px', color: '#2c3e50', fontSize: '28px' }}>
            About AgriChain Track
          </h1>
          
          <div style={{ marginBottom: '20px', flex: 1 }}>
            <h2 style={{ color: '#27ae60', marginBottom: '10px', fontSize: '20px' }}>Our Mission</h2>
            <p style={{ lineHeight: '1.5', fontSize: '15px', color: '#34495e' }}>
              Revolutionizing agriculture with blockchain and IoT technology. We connect farmers, suppliers, 
              aggregators, retailers, and customers in a secure digital ecosystem ensuring complete 
              traceability from farm to table.
            </p>
          </div>

          <div style={{ marginBottom: '20px', flex: 1 }}>
            <h2 style={{ color: '#27ae60', marginBottom: '10px', fontSize: '20px' }}>Key Features</h2>
            <ul style={{ lineHeight: '1.6', fontSize: '15px', color: '#34495e', columns: 2, columnGap: '30px' }}>
              <li><strong>Blockchain Security:</strong> Immutable transaction records</li>
              <li><strong>IoT Monitoring:</strong> Real-time temperature & humidity tracking</li>
              <li><strong>Freshness Detection:</strong> ML-powered quality assessment</li>
              <li><strong>Complete Traceability:</strong> Farm-to-consumer tracking</li>
              <li><strong>Multi-Role Access:</strong> Tailored interfaces for all participants</li>
              <li><strong>Quality Assurance:</strong> Automated quality deviation alerts</li>
            </ul>
          </div>

          <div style={{ marginBottom: '20px', flex: 1 }}>
            <h2 style={{ color: '#27ae60', marginBottom: '10px', fontSize: '20px' }}>Technology</h2>
            <p style={{ lineHeight: '1.5', fontSize: '15px', color: '#34495e' }}>
              Built on Ethereum blockchain, React.js, Node.js, IPFS (Pinata), and integrated IoT sensors 
              with machine learning for accurate freshness prediction.
            </p>
          </div>
          <div style={{ textAlign: 'center', marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '10px' }}>
            <p style={{ fontSize: '16px', color: '#2c3e50', fontWeight: '500' }}>
              🌱 Building trust in agriculture, one block at a time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AboutUs;
