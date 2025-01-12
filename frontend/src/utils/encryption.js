import forge from 'node-forge';
import CryptoJS from 'crypto-js';

const SYMMETRIC_ENCRYPTION_SECRET = 'your-secret-key'; // Replace with a secure secret key

export const generateKeyPair = () => {
  const keypair = forge.pki.rsa.generateKeyPair({ bits: 2048, e: 0x10001 });
  const publicKey = forge.pki.publicKeyToPem(keypair.publicKey);
  const privateKey = forge.pki.privateKeyToPem(keypair.privateKey);
  return { publicKey, privateKey };
};

export const encryptMessage = (message, publicKeyHex) => {
  try {
    console.log('Received public key (hex):', publicKeyHex);

    // Convert hex string to bytes
    const publicKeyBytes = forge.util.hexToBytes(publicKeyHex);
    console.log('Converted public key to bytes:', forge.util.bytesToHex(publicKeyBytes));

    // Create a forge public key from the bytes
    const publicKey = forge.pki.publicKeyFromAsn1(forge.asn1.fromDer(publicKeyBytes));

    // Convert the message to UTF-8 encoded bytes
    const messageBytes = forge.util.encodeUtf8(message);

    // Encrypt the message
    const encrypted = publicKey.encrypt(messageBytes, 'RSA-OAEP', {
      md: forge.md.sha256.create(),
      mgf1: {
        md: forge.md.sha256.create()
      }
    });

    // Return the base64 encoded encrypted message
    return forge.util.encode64(encrypted);
  } catch (error) {
    console.error('Encryption error:', error);
    if (error.message.includes('Too few bytes to parse DER')) {
      console.error('The public key may not be in the correct format. Received:', publicKeyHex);
    }
    throw new Error('Failed to encrypt message: ' + error.message);
  }
};

export const decryptMessage = (encryptedMessage, privateKeyPem) => {
  try {
    // Ensure the private key is properly formatted
    const formattedPrivateKey = privateKeyPem.includes('-----BEGIN PRIVATE KEY-----')
      ? privateKeyPem
      : `-----BEGIN PRIVATE KEY-----\n${privateKeyPem}\n-----END PRIVATE KEY-----`;

    const privateKey = forge.pki.privateKeyFromPem(formattedPrivateKey);
    const decoded = forge.util.decode64(encryptedMessage);
    const decrypted = privateKey.decrypt(decoded, 'RSA-OAEP', {
      md: forge.md.sha256.create(),
      mgf1: {
        md: forge.md.sha256.create()
      }
    });
    return forge.util.decodeUtf8(decrypted);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt message: ' + error.message);
  }
};

// Symmetric encryption functions for availability area
export const generateKey = () => {
  return CryptoJS.lib.WordArray.random(32).toString();
};

export const encryptData = (data, key) => {
  try {
    const stringifiedData = JSON.stringify(data);
    console.log('Encrypting data:', stringifiedData);
    console.log('Using key:', key);
    
    const encrypted = CryptoJS.AES.encrypt(stringifiedData, SYMMETRIC_ENCRYPTION_SECRET + key).toString();
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
    
    const bytes = CryptoJS.AES.decrypt(encryptedData, SYMMETRIC_ENCRYPTION_SECRET + key);
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
