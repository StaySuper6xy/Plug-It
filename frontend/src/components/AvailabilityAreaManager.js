import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Circle, Polygon } from 'react-leaflet';
import { encryptData, decryptData } from '../utils/encryption';

const AvailabilityAreaManager = ({ shop, onSave }) => {
  const [areaType, setAreaType] = useState(shop.availabilityArea?.type || 'Circle');
  const [center, setCenter] = useState(shop.availabilityArea?.center || [0, 0]);
  const [radius, setRadius] = useState(shop.availabilityArea?.radius || 1000);
  const [polygon, setPolygon] = useState(shop.availabilityArea?.coordinates || []);

  const handleSave = () => {
    const availabilityArea = areaType === 'Circle'
      ? { type: 'Circle', center, radius }
      : { type: 'Polygon', coordinates: polygon };

    const encryptedArea = encryptData(availabilityArea, shop.publicKey);
    onSave(encryptedArea);
  };

  return (
    <div>
      {/* Add UI components for managing availability area */}
      <MapContainer center={center} zoom={13} style={{ height: '400px', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {areaType === 'Circle' && (
          <Circle center={center} radius={radius} />
        )}
        {areaType === 'Polygon' && (
          <Polygon positions={polygon} />
        )}
      </MapContainer>
      <button onClick={handleSave}>Save Availability Area</button>
    </div>
  );
};

export default AvailabilityAreaManager;