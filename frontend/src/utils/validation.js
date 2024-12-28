export const isValidCoordinates = (coords) => {
  console.log('Validating coordinates:', coords);
  if (!Array.isArray(coords) || coords.length !== 2) {
    console.log('Invalid coordinates format');
    return false;
  }
  
  const [lat, lng] = coords;
  
  if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
    console.log('Invalid latitude or longitude type');
    return false;
  }
  
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    console.log('Latitude or longitude out of range');
    return false;
  }
  
  console.log('Coordinates are valid');
  return true;
};

export const isValidCircle = (center, radius) => {
  console.log('Validating circle:', { center, radius });
  
  if (!isValidCoordinates(center)) {
    console.log('Invalid center format');
    return false;
  }
  
  if (typeof radius !== 'number' || isNaN(radius) || radius <= 0) {
    console.log('Invalid radius');
    return false;
  }
  
  console.log('Circle is valid');
  return true;
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