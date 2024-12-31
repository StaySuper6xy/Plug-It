import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
  TextField,
  Grid,
  Paper,
} from '@mui/material';
import { MyLocation as MyLocationIcon } from '@mui/icons-material';
import { MapContainer, TileLayer, Marker, Circle, Polygon, useMap, useMapEvents } from 'react-leaflet';
import { Icon } from 'leaflet';

const customIcon = new Icon({
  iconUrl: 'https://cdn0.iconfinder.com/data/icons/small-n-flat/24/678111-map-marker-512.png',
  iconSize: [38, 38],
  iconAnchor: [19, 38],
  popupAnchor: [0, -38]
});

const FulfillmentOptions = ({
  shopDetails,
  fulfillmentOption,
  setFulfillmentOption,
  location,
  setLocation,
  availabilityArea,
  mapCenter,
  handleGetLocation,
  isWithinAvailabilityArea,
  onBack,
  onCheckout,
}) => {
  const [address, setAddress] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
  });
  const [warning, setWarning] = useState('');
  const [showCurrentLocation] = useState(false);
  const [locationMethod, setLocationMethod] = useState('address');

  const handleFulfillmentOptionChange = (event) => {
    setFulfillmentOption(event.target.value);
    setLocation(null);
    setWarning('');
  };

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setAddress(prev => ({ ...prev, [name]: value }));
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    const fullAddress = `${address.street}, ${address.city}, ${address.state} ${address.zipCode}`;
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}&limit=1`);
      const data = await response.json();
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        const newLocation = { lat: parseFloat(lat), lng: parseFloat(lon) };
        setLocation(newLocation);
        if (!isWithinAvailabilityArea(newLocation)) {
          setWarning('Selected location is outside the shop\'s availability area. The order is more likely to be refused.');
        } else {
          setWarning('');
        }
      } else {
        setWarning('Unable to find the address. Please check the address and try again.');
      }
    } catch (error) {
      console.error('Error geocoding address:', error);
      setWarning('Error finding the address. Please try again later.');
    }
  };

  const handleLocationMethodChange = (method) => {
    setLocationMethod(method);
    setLocation(null);
    setWarning('');
  };

  const LocationMarker = () => {
    const map = useMap();

    useEffect(() => {
      if (location) {
        map.flyTo(location, map.getZoom());
      }
    }, [map]);

    useMapEvents({
      click(e) {
        const newLocation = e.latlng;
        setLocation(newLocation);
        if (!isWithinAvailabilityArea(newLocation)) {
          setWarning('Selected location is outside the shop\'s availability area. The order is more likely to be refused.');
        } else {
          setWarning('');
        }
      },
    });

    return location ? <Marker position={location} icon={customIcon} /> : null;
  };

  const CurrentLocationMarker = () => {
    const [currentLocation, setCurrentLocation] = useState(null);

    useEffect(() => {
      if (showCurrentLocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setCurrentLocation({ lat: latitude, lng: longitude });
          },
          (error) => {
            console.error('Error getting current location:', error);
            setWarning('Unable to get current location. Please try again or use another method.');
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      }
    }, []);

    return currentLocation ? (
      <Marker 
        position={currentLocation} 
        icon={new Icon({
          iconUrl: 'https://cdn0.iconfinder.com/data/icons/small-n-flat/24/678111-map-marker-512.png',
          iconSize: [25, 25],
          iconAnchor: [12, 25],
        })}
      />
    ) : null;
  };

  return (
    <>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Typography variant="h6" gutterBottom>Fulfillment Options</Typography>
          {shopDetails && shopDetails.fulfillmentOptions ? (
            <RadioGroup value={fulfillmentOption} onChange={handleFulfillmentOptionChange}>
              {Object.entries(shopDetails.fulfillmentOptions).map(([option, isAvailable]) =>
                isAvailable && (
                  <FormControlLabel
                    key={option}
                    value={option}
                    control={<Radio />}
                    label={option.charAt(0).toUpperCase() + option.slice(1)}
                  />
                )
              )}
            </RadioGroup>
          ) : (
            <Typography color="error">No fulfillment options available</Typography>
          )}
        </Grid>

        {(fulfillmentOption === 'delivery' || fulfillmentOption === 'meetup') && (
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>Set Your Location</Typography>
            <RadioGroup value={locationMethod} onChange={(e) => handleLocationMethodChange(e.target.value)}>
              <FormControlLabel value="address" control={<Radio />} label="Enter Address" />
              <FormControlLabel value="current" control={<Radio />} label="Use Current Location" />
              <FormControlLabel value="map" control={<Radio />} label="Select on Map" />
            </RadioGroup>
          </Grid>
        )}
      </Grid>

      {(fulfillmentOption === 'delivery' || fulfillmentOption === 'meetup') && (
        <Box mt={2}>
          <Box mt={2}>
            {locationMethod === 'address' && (
              <Paper elevation={3} sx={{ p: 2 }}>
                <Typography variant="subtitle1" gutterBottom>Enter Your Address</Typography>
                <Box component="form" onSubmit={handleAddressSubmit}>
                  <TextField
                    fullWidth
                    label="Street Address"
                    name="street"
                    value={address.street}
                    onChange={handleAddressChange}
                    margin="normal"
                    required
                  />
                  <TextField
                    fullWidth
                    label="City"
                    name="city"
                    value={address.city}
                    onChange={handleAddressChange}
                    margin="normal"
                    required
                  />
                  <TextField
                    fullWidth
                    label="State"
                    name="state"
                    value={address.state}
                    onChange={handleAddressChange}
                    margin="normal"
                    required
                  />
                  <TextField
                    fullWidth
                    label="Zip Code"
                    name="zipCode"
                    value={address.zipCode}
                    onChange={handleAddressChange}
                    margin="normal"
                    required
                  />
                  <Button type="submit" variant="contained" sx={{ mt: 2 }}>
                    Set Address
                  </Button>
                </Box>
              </Paper>
            )}

            {locationMethod === 'current' && (
              <Paper elevation={3} sx={{ p: 2 }}>
                <Typography variant="subtitle1" gutterBottom>Use Current Location</Typography>
                <Button
                  variant="contained"
                  startIcon={<MyLocationIcon />}
                  onClick={handleGetLocation}
                >
                  Get My Location
                </Button>
              </Paper>
            )}

            {locationMethod === 'map' && (
              <Paper elevation={3} sx={{ p: 2 }}>
                <Typography variant="subtitle1" gutterBottom>Select Location on Map</Typography>
                <Typography variant="body2">Click on the map to set your location</Typography>
              </Paper>
            )}
          </Box>
          <Typography variant="body2" gutterBottom>
            Tip: You can always click on the map to adjust your location, regardless of the method chosen above.
          </Typography>
          <Box mt={2} height={400}>
            <MapContainer
              center={mapCenter}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <LocationMarker />
              <CurrentLocationMarker />
              {availabilityArea && availabilityArea.type === 'Circle' && (
                <Circle
                  center={availabilityArea.center}
                  radius={availabilityArea.radius}
                  pathOptions={{ color: 'blue' }}
                />
              )}
              {availabilityArea && availabilityArea.type === 'Polygon' && (
                <Polygon
                  positions={availabilityArea.coordinates[0]}
                  pathOptions={{ color: 'blue' }}
                />
              )}
            </MapContainer>
          </Box>
          {location && (
            <Typography variant="body1" mt={2}>
              Selected Location: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
            </Typography>
          )}
          {warning && (
            <Typography variant="body2" color="error" mt={2}>
              {warning}
            </Typography>
          )}
        </Box>
      )}

      <Box mt={3} display="flex" justifyContent="space-between">
        <Button onClick={onBack} variant="outlined">
          Back to Cart
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={onCheckout}
          disabled={!fulfillmentOption || ((fulfillmentOption === 'delivery' || fulfillmentOption === 'meetup') && !location)}
        >
          Send Request
        </Button>
      </Box>
    </>
  );
};

export default FulfillmentOptions;