const isValidCoordinates = (coords) => {
  return Array.isArray(coords) && 
         coords.length === 2 &&
         typeof coords[0] === 'number' && 
         typeof coords[1] === 'number' &&
         !isNaN(coords[0]) && !isNaN(coords[1]) &&
         coords[0] >= -180 && coords[0] <= 180 &&
         coords[1] >= -90 && coords[1] <= 90;
};

const isValidPolygon = (coordinates) => {
  return Array.isArray(coordinates) && 
         coordinates.length === 1 && 
         Array.isArray(coordinates[0]) &&
         coordinates[0].length >= 4 && 
         coordinates[0].every(isValidCoordinates) &&
         coordinates[0][0][0] === coordinates[0][coordinates[0].length - 1][0] &&
         coordinates[0][0][1] === coordinates[0][coordinates[0].length - 1][1];
};

const isValidCircle = (center, radius) => {
  return isValidCoordinates(center) && typeof radius === 'number' && radius > 0;
};

module.exports = { isValidCoordinates, isValidPolygon, isValidCircle };