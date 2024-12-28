import CryptoJS from 'crypto-js';

const ENCRYPTION_SECRET = 'your-secret-key'; // Replace with a secure secret key

export const generateKey = () => {
  return CryptoJS.lib.WordArray.random(32).toString();
};

export const encryptData = (data, key) => {
  try {
    const stringifiedData = JSON.stringify(data);
    console.log('Encrypting data:', stringifiedData);
    console.log('Using key:', key);
    
    const encrypted = CryptoJS.AES.encrypt(stringifiedData, ENCRYPTION_SECRET + key).toString();
    console.log('Encrypted data:', encrypted);
    return encrypted;
  } catch (error) {
    console.error('Error in encryptData:', error);
    throw error;
  }
};

export const decryptData = (encryptedData, key) => {
  try {
    console.log('Attempting to decrypt data:', encryptedData);
    console.log('Using key:', key);
    
    const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_SECRET + key);
    const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
    
    if (!decryptedString) {
      console.error('Decryption resulted in empty string');
      return null;
    }
    
    console.log('Decrypted string:', decryptedString);
    
    try {
      const decryptedData = JSON.parse(decryptedString);
      console.log('Successfully decrypted and parsed data:', decryptedData);
      return decryptedData;
    } catch (parseError) {
      console.error('Error parsing decrypted string:', parseError);
      return decryptedString; // Return the raw string if parsing fails
    }
  } catch (error) {
    console.error('Error in decryptData:', error);
    return null;
  }
};

export const encryptAvailabilityArea = (availabilityArea, key) => {
  console.log('Encrypting availability area:', availabilityArea);
  console.log('Using key for encryption:', key);
  return encryptData(availabilityArea, key);
};

export const decryptAvailabilityArea = (encryptedArea, key) => {
  console.log('Decrypting availability area');
  console.log('Using key for decryption:', key);
  const decryptedData = decryptData(encryptedArea, key);
  
  if (decryptedData === null) {
    console.error('Failed to decrypt availability area');
    return null;
  }
  
  if (typeof decryptedData === 'string') {
    try {
      const parsedData = JSON.parse(decryptedData);
      console.log('Successfully parsed decrypted availability area:', parsedData);
      return parsedData;
    } catch (error) {
      console.error('Failed to parse decrypted availability area:', error);
      return null;
    }
  }
  
  return decryptedData;
};