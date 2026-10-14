const mongoose = require('mongoose');
const { createInviteCode } = require('../utils/inviteCode');

const voteOptionSchema = new mongoose.Schema({
  value: { type: String, required: true, trim: true, maxlength: 160 },
  voters: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { _id: true });

const memberSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['owner', 'member'], default: 'member' },
  joinedAt: { type: Date, default: Date.now }
}, { _id: false });

const itinerarySchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 100 },
  location: { type: String, trim: true, maxlength: 180, default: '' },
  startsAt: { type: Date, required: true },
  note: { type: String, trim: true, maxlength: 500, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: false });

const planSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, minlength: 3, maxlength: 100 },
  description: { type: String, trim: true, maxlength: 700, default: '' },
  eventType: { type: String, enum: ['hangout', 'birthday', 'food', 'movie', 'trip', 'game', 'study', 'other'], default: 'hangout' },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: { type: [memberSchema], default: [] },
  dateOptions: { type: [voteOptionSchema], default: [] },
  placeOptions: { type: [voteOptionSchema], default: [] },
  budget: { type: Number, min: 0, max: 100000000, default: 0 },
  currency: { type: String, enum: ['INR', 'USD', 'GBP', 'EUR'], default: 'INR' },
  status: { type: String, enum: ['planning', 'confirmed', 'completed'], default: 'planning' },
  itinerary: { type: [itinerarySchema], default: [] },
  inviteCode: { type: String, unique: true, default: createInviteCode },
  inviteExpiresAt: { type: Date, default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { versionKey: false });

planSchema.index({ 'members.user': 1, updatedAt: -1 });
planSchema.pre('save', function updateTimestamp(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Plan', planSchema);
