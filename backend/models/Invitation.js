import mongoose from 'mongoose'
import crypto from 'crypto'

const invitationSchema = new mongoose.Schema({
  inviteCode: { type: String, unique: true, required: true },
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isUsed: { type: Boolean, default: false },
  expiresAt: { type: Date, required: true },
  revoked: { type: Boolean, default: false },
}, { timestamps: true })

invitationSchema.pre('save', function(next) {
  if (!this.inviteCode) {
    this.inviteCode = crypto.randomBytes(6).toString('hex')
  }
  if (!this.expiresAt) {
    this.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
  }
  next()
})

const Invitation = mongoose.model('Invitation', invitationSchema)

export default Invitation