const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  amount: String,
  description: String,
  rrr: String,
  paymentStatus: { type: String, default: 'Pending' },
  notificationSent: { type: Boolean, default: false },
  date: { type: Date, default: Date.now }
})

module.exports = mongoose.model('Payment', paymentSchema);