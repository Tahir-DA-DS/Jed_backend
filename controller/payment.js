require('dotenv').config()
const paymentData = require('../data/payment');
const CryptoJS = require('crypto-js');
const axios = require('axios');

const savePayments = async (req, res) => {
  const newPayment = new paymentData(req.body);
  try {
    const savedPayment = await newPayment.save();
    res.json(savedPayment);
  } catch (err) {
    res.status(500).send(err);
  }
};

const checkPaymentStatus = async (payment) => {
  const { rrr } = payment;
  const merchantId = process.env.MERCHANT_ID;
  const apiKey = process.env.API_KEY;


  const apiHash = CryptoJS.SHA512(rrr + apiKey + merchantId).toString(CryptoJS.enc.Hex);
  const authorizationHeader = `remitaConsumerKey=${merchantId},remitaConsumerToken=${apiHash}`;

  const config = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': authorizationHeader
    }
  };

  try {

    const response = await axios.get(
      `https://demo.remita.net/remita/exapp/api/v1/send/api/echannelsvc/${merchantId}/${rrr}/${apiHash}/status.reg`,
      config
    );

    const status = response.data;

    if (status.status === '021') { // Handle Transaction Pending
      const updatedPayment = await paymentData.findOneAndUpdate(
        { rrr },
        { paymentStatus: 'Pending' },
        { new: true }
      );

      if (!updatedPayment) {
        throw new Error(`Payment with RRR ${rrr} not found`);
      }

      return updatedPayment;
    } else if (status.status === '00') { // Handle Transaction Successful
      const updatedPayment = await paymentData.findOneAndUpdate(
        { rrr },
        { paymentStatus: 'Successful' },
        { new: true }
      );

      if (!updatedPayment) {
        throw new Error(`Payment with RRR ${rrr} not found`);
      }

      return updatedPayment;
    } else {
      console.log('Unexpected status:', status);
      return null;
    }
  } catch (error) {
    if (error.response) {
      console.error('Error checking payment status:', {
        responseData: error.response.data,
        responseCode: error.response.status,
        responseMsg: error.response.statusText
      });
    } else {
      console.error('Error checking payment status:', error.message);
    }
    return null;
  }
};

const sendBatchNotifications = async () => {
  const successfulPayments = await paymentData.find({ paymentStatus: 'Successful', notificationSent: false });
  if (successfulPayments.length === 0) return;

  const batch = successfulPayments.slice(0, 2);
  const notificationEndpoint = process.env.WEBHOOK_ENDPOINT; // Replace with your target system's endpoint

  const notificationRequests = batch.map(payment => {
    const notificationRequestBody = {
      name: payment.name,
      email: payment.email,
      phone: payment.phone,
      amount: payment.amount,
      remita_transaction_id: payment.rrr,
      description: payment.description,
      status: payment.paymentStatus,
    };
    const notificationHeaders = {
      Authorization: 'Bearer YOUR_API_KEY', // If authentication is required
      'Content-Type': 'application/json',
    };

    return axios.post(notificationEndpoint, notificationRequestBody, { headers: notificationHeaders })
      .then(response => {
        if (response.status === 200) {
          console.log('Payment notification sent successfully!', payment._id);
          payment.notificationSent = true;
          return payment.save();
        } else {
          console.log('Error sending payment notification:', response.data);
        }
      })
      .catch(notificationError => {
        console.error('Error sending payment notification:', notificationError);
      });
  });

  await Promise.all(notificationRequests);
};

// Schedule regular payment status checks
setInterval(async () => {
  console.log('Checking payment statuses...');
  const pendingPayments = await paymentData.find({ paymentStatus: 'Pending' });
  for (const payment of pendingPayments) {
    await checkPaymentStatus(payment);
  }
}, 60000); // Check every 60 seconds

// Schedule batch notification sending
setInterval(async () => {
  console.log('Sending batch notifications...');
  await sendBatchNotifications();
}, 300000); // Send notifications every 5 minutes

module.exports = { savePayments, checkPaymentStatus };
