require('dotenv').config()
const paymentData = require('../data/payment');
const CryptoJS = require('crypto-js');
const axios = require('axios');

const checkPaymentStatus = async (rrr) => {
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

    if ((status.message === 'Transaction Successful' || status.message === 'Successful') && status.status === "00") {
      console.log(`Transaction status for RRR ${rrr}: Successful`);
      return 'Successful';
    } else {
      console.log(`Transaction status for RRR ${rrr}: ${status.message}`);
      return status.message;
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


// const savePayments = async (req, res) => {
//   const newPayment = new paymentData(req.body);
//   try {
//     const savedPayment = await newPayment.save();
//     res.json(savedPayment);
//   } catch (err) {
//     res.status(500).send(err);
//   }
// };

const savePayments = async (req, res) => {
  const paymentDetails = req.body;
  const paymentStatus = await checkPaymentStatus(paymentDetails.rrr);

  if (paymentStatus === 'Successful') {
    const newPayment = new paymentData(paymentDetails);
    try {
      const savedPayment = await newPayment.save();
      res.json(savedPayment);
    } catch (err) {
      console.error('Error saving payment:', err);
      res.status(500).send(err);
    }
  } else {
    res.status(400).send(`Payment status is not successful: ${paymentStatus}`);
  }
};


const updatePaymentStatus = async (req, res) => {
  const { rrr } = req.params
  const { paymentStatus } = req.body; 

  try {
    const updatedPayment = await paymentData.findOneAndUpdate(
      { rrr },
      { paymentStatus },
      { new: true }
    );

    if (!updatedPayment) {
      return res.status(404).send('Payment not found');
    }

    res.json(updatedPayment);
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).send('Internal server error');
  }
};


module.exports = { savePayments, checkPaymentStatus, updatePaymentStatus};


// const sendBatchNotifications = async () => {
//   const successfulPayments = await paymentData.find({ paymentStatus: 'Successful', notificationSent: false });
//   if (successfulPayments.length === 0) return;

//   const batch = successfulPayments.slice(0, 2);
//   const notificationEndpoint = process.env.WEBHOOK_ENDPOINT; // Replace with your target system's endpoint

//   const notificationRequests = batch.map(payment => {
//     const notificationRequestBody = {
//       name: payment.name,
//       email: payment.email,
//       phone: payment.phone,
//       amount: payment.amount,
//       remita_transaction_id: payment.rrr,
//       description: payment.description,
//       status: payment.paymentStatus,
//     };
//     const notificationHeaders = {
//       Authorization: 'Bearer YOUR_API_KEY', // If authentication is required
//       'Content-Type': 'application/json',
//     };

//     return axios.post(notificationEndpoint, notificationRequestBody, { headers: notificationHeaders })
//       .then(response => {
//         if (response.status === 200) {
//           console.log('Payment notification sent successfully!', payment._id);
//           payment.notificationSent = true;
//           return payment.save();
//         } else {
//           console.log('Error sending payment notification:', response.data);
//         }
//       })
//       .catch(notificationError => {
//         console.error('Error sending payment notification:', notificationError);
//       });
//   });

//   await Promise.all(notificationRequests);
// };

// // Schedule regular payment status checks
// setInterval(async () => {
//   console.log('Checking payment statuses...');
//   const pendingPayments = await paymentData.find({ paymentStatus: 'Pending' });
//   for (const payment of pendingPayments) {
//     await checkPaymentStatus(payment);
//   }
// }, 60000); // Check every 60 seconds

// // Schedule batch notification sending
// setInterval(async () => {
//   console.log('Sending batch notifications...');
//   await sendBatchNotifications();
// }, 300000); // Send notifications every 5 minutes

