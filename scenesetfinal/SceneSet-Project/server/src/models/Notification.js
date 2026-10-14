const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['invite_joined', 'vote_cast', 'itinerary_added', 'plan_updated', 'system'], default: 'system' },
  title: { type: String, required: true, maxlength: 120 },
  message: { type: String, required: true, maxlength: 300 },
  plan: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', default: null },
  readAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now }
}, { versionKey: false });

notificationSchema.index({ user: 1, createdAt: -1 });
module.exports = mongoose.model('Notification', notificationSchema);
