import express from 'express'
import Invitation from '../models/Invitation.js'
import User from '../models/User.js'
import Shop from '../models/Shop.js'
import auth from '../middleware/auth.js'

const router = express.Router()

// Get all invitations for the authenticated user
router.get('/', auth, async (req, res) => {
  try {
    const invitations = await Invitation.find({ sender: req.user.id }).populate('shop', 'name')
    res.json(invitations)
  } catch (err) {
    console.error(err.message)
    res.status(500).send('Server Error')
  }
})

// Create a new invitation
router.post('/', auth, async (req, res) => {
  try {
    const { email, shop } = req.body
    const newInvitation = new Invitation({
      email,
      shop,
      sender: req.user.id
    })
    const invitation = await newInvitation.save()
    res.json(invitation)
  } catch (err) {
    console.error(err.message)
    res.status(500).send('Server Error')
  }
})

// Redeem an invitation
router.post('/redeem', auth, async (req, res) => {
  try {
    const { inviteCode } = req.body
    
    const invitation = await Invitation.findOne({ inviteCode, isUsed: false }).populate('shop')
    if (!invitation) {
      return res.status(400).json({ message: 'Invalid or used invitation code' })
    }

    const seller = await User.findById(invitation.sender)
    if (!seller) {
      return res.status(400).json({ message: 'Seller not found' })
    }

    const user = await User.findById(req.user.id)
    user.connectedSellers.push(seller._id)
    await user.save()

    invitation.isUsed = true
    await invitation.save()

    res.json({ message: 'Invitation code redeemed successfully', shopName: invitation.shop.name })
  } catch (err) {
    console.error(err.message)
    res.status(500).send('Server error')
  }
})

export default router