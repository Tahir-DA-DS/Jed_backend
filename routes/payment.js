const express = require("express");
const router = express.Router()
const {savePayments, paymentStatusupdate} = require('../controller/payment')

router.post('/api/payments', savePayments);

router.get('/api/check-transaction-status/:rrr', paymentStatusupdate)

// router.put('/api/payments/:rrr', PaymentUpdate)


module.exports = router