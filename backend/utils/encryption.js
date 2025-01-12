const crypto = require('crypto');
const forge = require('node-forge');

const ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET || 'your-secret-key'; // Use environment variable in production

const generateKey = () => {
  return crypto.randomBytes(32).toString('hex');
};

const encryptData = (data, key) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key, 'hex'), iv);
  let encrypted = cipher.update(JSON.stringify(data));
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
};

const decryptData = (encryptedData, key) => {
  const textParts = encryptedData.split(':');
  const iv = Buffer.from(textParts.shift(), 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key, 'hex'), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return JSON.parse(decrypted.toString());
};

const encryptShopData = (shopData, key) => {
  if (!shopData.isPrivate) return shopData;

  const dataToEncrypt = {
    name: shopData.name,
    description: shopData.description,
    address: shopData.address,
    location: shopData.location,
    availabilityArea: shopData.availabilityArea,
    products: shopData.products,
    fulfillmentOptions: shopData.fulfillmentOptions,
    estimatedResponseTime: shopData.estimatedResponseTime,
    motd: shopData.motd
  };

  return {
    ...shopData,
    encryptedData: encryptData(dataToEncrypt, key)
  };
};

const decryptShopData = (shopData, key) => {
  if (!shopData.isPrivate || !shopData.encryptedData) return shopData;

  const decryptedData = decryptData(shopData.encryptedData, key);
  return {
    ...shopData,
    ...decryptedData
  };
};

const generateKeyPair = () => {
  const keypair = forge.pki.rsa.generateKeyPair({ bits: 2048, e: 0x10001 });
  const publicKey = forge.pki.publicKeyToPem(keypair.publicKey);
  const privateKey = forge.pki.privateKeyToPem(keypair.privateKey);

  // Convert the public key PEM to a format that can be easily transmitted and stored
  const publicKeyDer = forge.pki.publicKeyToAsn1(keypair.publicKey);
  const publicKeyBuffer = forge.asn1.toDer(publicKeyDer).getBytes();
  const publicKeyHex = forge.util.bytesToHex(publicKeyBuffer);

  return { publicKey: publicKeyHex, privateKey };
};

const encryptMessage = (message, publicKeyHex) => {
  try {
    const publicKeyBytes = forge.util.hexToBytes(publicKeyHex);
    const asn1 = forge.asn1.fromDer(publicKeyBytes);
    const publicKey = forge.pki.publicKeyFromAsn1(asn1);

    const encrypted = publicKey.encrypt(forge.util.encodeUtf8(message), 'RSA-OAEP', {
      md: forge.md.sha256.create(),
      mgf1: {
        md: forge.md.sha256.create()
      }
    });

    return forge.util.encode64(encrypted);
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt message: ' + error.message);
  }
};

const decryptMessage = (encryptedMessage, privateKeyPem) => {
  try {
    const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);
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

module.exports = {
  generateKey,
  encryptData,
  decryptData,
  encryptShopData,
  decryptShopData,
  generateKeyPair,
  encryptMessage,
  decryptMessage
};
