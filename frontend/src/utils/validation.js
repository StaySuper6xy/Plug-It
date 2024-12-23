export const isValidCoordinates = (coords) => {
  return Array.isArray(coords) && 
         coords.length === 2 &&
         typeof coords[0] === 'number' && 
         typeof coords[1] === 'number' &&
         !isNaN(coords[0]) && !isNaN(coords[1]) &&
         coords[0] >= -180 && coords[0] <= 180 &&
         coords[1] >= -90 && coords[1] <= 90;
};

export const isValidPolygon = (coordinates) => {
  return Array.isArray(coordinates) && 
         coordinates.length === 1 && 
         Array.isArray(coordinates[0]) &&
         coordinates[0].length >= 4 && 
         coordinates[0].every(isValidCoordinates) &&
         coordinates[0][0][0] === coordinates[0][coordinates[0].length - 1][0] &&
         coordinates[0][0][1] === coordinates[0][coordinates[0].length - 1][1];
};

export const isValidCircle = (center, radius) => {
  return isValidCoordinates(center) && typeof radius === 'number' && radius > 0;
};

export const validateShopData = (shopData) => {
  const errors = [];

  if (!shopData.name || shopData.name.trim() === '') {
    errors.push('Shop name is required');
  }

  if (!shopData.description || shopData.description.trim() === '') {
    errors.push('Shop description is required');
  }

  if (shopData.location && (!isValidCoordinates(shopData.location.coordinates))) {
    errors.push('Invalid shop location coordinates');
  }

  if (shopData.availabilityArea) {
    if (shopData.availabilityArea.type === 'Circle') {
      if (!isValidCircle(shopData.availabilityArea.center, shopData.availabilityArea.radius)) {
        errors.push('Invalid circle format for availability area');
      }
    } else if (shopData.availabilityArea.type === 'Polygon') {
      if (!isValidPolygon(shopData.availabilityArea.coordinates)) {
        errors.push('Invalid polygon format for availability area');
      }
    } else {
      errors.push('Invalid availability area type');
    }
  }

  return errors;
};