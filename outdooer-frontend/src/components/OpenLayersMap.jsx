// src/components/OpenLayersMap.jsx
import React, { useEffect, useRef } from 'react';

const OpenLayersMap = ({ expeditionId, defaultLat, defaultLon, defaultZoom }) => {
  const mapRef = useRef(null);
  
  useEffect(() => {
    // This would eventually initialize an OpenLayers map
    console.log("Map would be initialized here with:", {
      expeditionId,
      defaultLat,
      defaultLon,
      defaultZoom
    });
    
    // Clean up function
    return () => {
      // Cleanup map resources if needed
    };
  }, [expeditionId, defaultLat, defaultLon, defaultZoom]);
  
  return (
    <div 
      ref={mapRef} 
      className="map-container" 
      style={{ 
        height: '100%', 
        width: '100%',
        backgroundColor: '#e8f4f5',
        position: 'relative'
      }}
    >
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center'
      }}>
        <p>Map would display location at:</p>
        <p><strong>Lat:</strong> {defaultLat}, <strong>Lon:</strong> {defaultLon}</p>
        {expeditionId && <p><strong>Showing expedition ID:</strong> {expeditionId}</p>}
      </div>
    </div>
  );
};

export default OpenLayersMap;