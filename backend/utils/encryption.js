const crypto = require('crypto');

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

module.exports = {
  generateKey,
  encryptData,
  decryptData,
  encryptShopData,
  decryptShopData
};

