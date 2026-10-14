const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  plan: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', required: true, index: true },
  description: { type: String, required: true, trim: true, maxlength: 120 },
  category: { type: String, enum: ['food', 'travel', 'tickets', 'stay', 'shopping', 'other'], default: 'other' },
  amount: { type: Number, required: true, min: 0.01, max: 10000000 },
  paidBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
}, { versionKey: false });

module.exports = mongoose.model('Expense', expenseSchema);
