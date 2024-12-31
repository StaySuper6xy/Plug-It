import React from 'react';
import { Tabs, Tab, Box } from '@mui/material';

const ShopList = ({ shops, selectedShop, onSelectShop }) => {
  const handleTabChange = (event, newValue) => {
    onSelectShop(shops[newValue]);
  };

  return (
    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
      <Tabs
        value={shops.findIndex(shop => shop._id === selectedShop?._id)}
        onChange={handleTabChange}
        aria-label="shop tabs"
      >
        {shops.map((shop) => (
          <Tab label={shop.name} key={shop._id} />
        ))}
      </Tabs>
    </Box>
  );
};

export default ShopList;