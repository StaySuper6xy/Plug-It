const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const User = require('../models/User');
const auth = require('../middleware/auth');
const crypto = require('crypto');

// Encryption key (in a real-world scenario, this should be stored securely, not in the code)
const ENCRYPTION_KEY = global.ENCRYPTION_KEY;

// Encrypt function
function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return { iv: iv.toString('hex'), encryptedData: encrypted.toString('hex') };
}

// Decrypt function
function decrypt(text, iv) {
  try {
    const encryptedText = Buffer.from(text, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), Buffer.from(iv, 'hex'));
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (error) {
    console.error('Decryption error:', error);
    return null;
  }
}

// Get all chats for a user
router.get('/', auth, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [{ sender: req.user.id }, { receiver: req.user.id }]
    }).sort({ timestamp: 1 });

    const chatPartners = [...new Set(messages.map(m => 
      m.sender.toString() === req.user.id ? m.receiver.toString() : m.sender.toString()
    ))];

    const chats = await Promise.all(chatPartners.map(async (partnerId) => {
      const partner = await User.findById(partnerId).select('username');
      const lastMessage = messages.filter(m => 
        m.sender.toString() === partnerId || m.receiver.toString() === partnerId
      ).pop();

      const decryptedContent = decrypt(lastMessage.content, lastMessage.encryptionIV);
      if (decryptedContent === null) {
        console.error('Failed to decrypt message:', lastMessage);
        return null;
      }

      return {
        partnerId,
        partnerName: partner.username,
        lastMessage: decryptedContent
      };
    }));

    res.json(chats.filter(chat => chat !== null));
  } catch (err) {
    console.error('Error in GET /:', err);
    res.status(500).send('Server Error');
  }
});

// Get messages for a specific chat
router.get('/:partnerId', auth, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user.id, receiver: req.params.partnerId },
        { sender: req.params.partnerId, receiver: req.user.id }
      ]
    }).sort({ timestamp: 1 });

    const decryptedMessages = messages.map(m => ({
      ...m._doc,
      content: decrypt(m.content, m.encryptionIV)
    }));

    res.json(decryptedMessages);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Send a message
router.post('/:partnerId', auth, async (req, res) => {
  try {
    const { content } = req.body;
    const { iv, encryptedData } = encrypt(content);

    const newMessage = new Message({
      sender: req.user.id,
      receiver: req.params.partnerId,
      content: encryptedData,
      encryptionIV: iv
    });

    const message = await newMessage.save();
    res.json(message);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
