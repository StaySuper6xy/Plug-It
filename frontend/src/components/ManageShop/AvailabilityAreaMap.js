import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Paper, Typography, FormControl, InputLabel, Select, MenuItem, TextField, Box } from '@mui/material';
import { MapContainer, TileLayer, FeatureGroup, useMap } from 'react-leaflet';
import { EditControl } from "react-leaflet-draw";
import { Circle as LCircle, Polygon as LPolygon } from 'leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';

const DEFAULT_CENTER = [0, 0];
const DEFAULT_ZOOM = 13;
const DEFAULT_RADIUS = 1000;

const MapUpdater = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center && Array.isArray(center) && center.length === 2 && 
        center.every(coord => typeof coord === 'number' && !isNaN(coord))) {
      map.setView(center, zoom, { animate: false });
    }
  }, [center, zoom, map]);
  return null;
};

const AvailabilityAreaMap = ({ shop, onUpdate }) => {
  const [availabilityAreaType, setAvailabilityAreaType] = useState('Circle');
  const [availabilityRadius, setAvailabilityRadius] = useState(DEFAULT_RADIUS);
  const [availabilityPolygon, setAvailabilityPolygon] = useState([]);
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
  const [mapZoom, setMapZoom] = useState(DEFAULT_ZOOM);
  const mapRef = useRef(null);
  const featureGroupRef = useRef(null);

  useEffect(() => {
    if (shop.availabilityArea) {
      setAvailabilityAreaType(shop.availabilityArea.type);
      if (shop.availabilityArea.type === 'Circle') {
        setAvailabilityRadius(shop.availabilityArea.radius || DEFAULT_RADIUS);
        setMapCenter(shop.availabilityArea.center || DEFAULT_CENTER);
      } else if (shop.availabilityArea.type === 'Polygon') {
        setAvailabilityPolygon(shop.availabilityArea.coordinates[0] || []);
        setMapCenter(calculatePolygonCenter(shop.availabilityArea.coordinates[0]) || DEFAULT_CENTER);
      }
    } else if (shop.location && shop.location.coordinates) {
      setAvailabilityAreaType('Circle');
      setMapCenter(shop.location.coordinates.slice().reverse());
    } else {
      setAvailabilityAreaType('Circle');
      setMapCenter(DEFAULT_CENTER);
    }
    setMapZoom(DEFAULT_ZOOM);
  }, [shop]);

  useEffect(() => {
    if (featureGroupRef.current) {
      featureGroupRef.current.clearLayers();
      if (availabilityAreaType === 'Circle' && availabilityRadius > 0) {
        const circle = L.circle(mapCenter, { radius: availabilityRadius });
        featureGroupRef.current.addLayer(circle);
      } else if (availabilityAreaType === 'Polygon' && availabilityPolygon.length > 0) {
        const polygon = L.polygon(availabilityPolygon);
        featureGroupRef.current.addLayer(polygon);
      }
    }
  }, [availabilityAreaType, availabilityRadius, availabilityPolygon, mapCenter]);

  const calculatePolygonCenter = (coordinates) => {
    if (!coordinates || coordinates.length === 0) return DEFAULT_CENTER;
    const bounds = coordinates.reduce((bounds, coord) => {
      return [
        [Math.min(bounds[0][0], coord[0]), Math.min(bounds[0][1], coord[1])],
        [Math.max(bounds[1][0], coord[0]), Math.max(bounds[1][1], coord[1])]
      ];
    }, [[Infinity, Infinity], [-Infinity, -Infinity]]);
    return [(bounds[0][0] + bounds[1][0]) / 2, (bounds[0][1] + bounds[1][1]) / 2];
  };

  const handleAvailabilityAreaTypeChange = (event) => {
    const newType = event.target.value;
    setAvailabilityAreaType(newType);
    
    if (newType === 'Circle' && availabilityRadius === 0) {
      const newRadius = DEFAULT_RADIUS;
      setAvailabilityRadius(newRadius);
      onUpdate({
        type: 'Circle',
        center: mapCenter,
        radius: newRadius
      });
      if (featureGroupRef.current) {
        featureGroupRef.current.clearLayers();
        const circle = L.circle(mapCenter, { radius: newRadius });
        featureGroupRef.current.addLayer(circle);
      }
    } else if (newType === 'Polygon' && availabilityPolygon.length === 0) {
      setAvailabilityPolygon([]);
      onUpdate({
        type: 'Polygon',
        coordinates: [[]]
      });
      if (featureGroupRef.current) {
        featureGroupRef.current.clearLayers();
      }
    }
  };

  const handleMapCreated = useCallback((e) => {
    const { layerType, layer } = e;
    if (layerType === 'circle') {
      setAvailabilityAreaType('Circle');
      const radius = Math.round(layer.getRadius());
      setAvailabilityRadius(radius);
      const center = [
        layer.getLatLng().lat,
        layer.getLatLng().lng
      ];
      setMapCenter(center);
      onUpdate({
        type: 'Circle',
        center: center,
        radius: radius
      });
    } else if (layerType === 'polygon') {
      setAvailabilityAreaType('Polygon');
      const coords = layer.getLatLngs()[0].map(latLng => [latLng.lat, latLng.lng]);
      setAvailabilityPolygon(coords);
      onUpdate({
        type: 'Polygon',
        coordinates: [coords]
      });
    }
  }, [onUpdate]);

  const handleMapEdited = useCallback((e) => {
    const { layers } = e;
    layers.eachLayer((layer) => {
      if (layer instanceof LCircle) {
        const radius = Math.round(layer.getRadius());
        setAvailabilityRadius(radius);
        const center = [
          layer.getLatLng().lat,
          layer.getLatLng().lng
        ];
        setMapCenter(center);
        onUpdate({
          type: 'Circle',
          center: center,
          radius: radius
        });
      } else if (layer instanceof LPolygon) {
        const coords = layer.getLatLngs()[0].map(latLng => [latLng.lat, latLng.lng]);
        setAvailabilityPolygon(coords);
        onUpdate({
          type: 'Polygon',
          coordinates: [coords]
        });
      }
    });
  }, [onUpdate]);

  const handleMapDeleted = useCallback((e) => {
    const { layers } = e;
    layers.eachLayer(() => {
      setAvailabilityAreaType('');
      setAvailabilityRadius(0);
      setAvailabilityPolygon([]);
      onUpdate({
        type: '',
        center: null,
        radius: 0
      });
    });
  }, [onUpdate]);

  useEffect(() => {
    if (mapRef.current) {
      const map = mapRef.current;
      map.on('draw:created', handleMapCreated);
      map.on('draw:edited', handleMapEdited);
      map.on('draw:deleted', handleMapDeleted);

      return () => {
        map.off('draw:created', handleMapCreated);
        map.off('draw:edited', handleMapEdited);
        map.off('draw:deleted', handleMapDeleted);
      };
    }
  }, [handleMapCreated, handleMapEdited, handleMapDeleted]);

  return (
    <Paper elevation={3} sx={{ p: 2, mt: 2 }}>
      <Typography variant="h6" gutterBottom>Availability Area</Typography>
      <FormControl fullWidth margin="normal">
        <InputLabel>Availability Area Type</InputLabel>
        <Select
          value={availabilityAreaType}
          onChange={handleAvailabilityAreaTypeChange}
        >
          <MenuItem value="Circle">Circle</MenuItem>
          <MenuItem value="Polygon">Polygon</MenuItem>
        </Select>
      </FormControl>

      {availabilityAreaType === 'Circle' && (
        <TextField
          margin="dense"
          label="Availability Radius (meters)"
          fullWidth
          type="number"
          value={availabilityRadius}
          onChange={(e) => {
            const newRadius = Math.max(1, parseInt(e.target.value, 10) || DEFAULT_RADIUS);
            setAvailabilityRadius(newRadius);
            onUpdate({
              type: 'Circle',
              center: mapCenter,
              radius: newRadius
            });
          }}
        />
      )}

      <Box mt={2} height={400}>
        <MapContainer 
          center={mapCenter} 
          zoom={mapZoom} 
          style={{ height: '100%', width: '100%' }}
          ref={mapRef}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapUpdater center={mapCenter} zoom={mapZoom} />
          <FeatureGroup ref={featureGroupRef}>
            <EditControl
              position="topright"
              onCreated={handleMapCreated}
              onEdited={handleMapEdited}
              onDeleted={handleMapDeleted}
              draw={{
                rectangle: false,
                marker: false,
                circlemarker: false,
                polyline: false,
                circle: availabilityAreaType === 'Circle',
                polygon: availabilityAreaType === 'Polygon',
              }}
              edit={{
                edit: true,
                remove: true,
                featureGroup: featureGroupRef.current,
              }}
            />
          </FeatureGroup>
        </MapContainer>
      </Box>
    </Paper>
  );
};

export default AvailabilityAreaMap;