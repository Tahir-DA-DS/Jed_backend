const express = require("express");
const router = express.Router()
const {savePayments, checkPaymentStatus} = require('../controller/payment')

router.post('/api/payments', savePayments);

router.get('/api/check-transaction-status/:rrr', checkPaymentStatus)

// router.put('/api/payments/:rrr', PaymentUpdate)


module.exports = router