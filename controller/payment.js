const paymentData = require("../data/payment");
const CryptoJS = require("crypto-js");
const axios = require("axios");

const savePayments = async (req, res) => {
  const newPayment = new paymentData(req.body);
  try {
    const savedPayment = await newPayment.save();
    res.json(savedPayment);
  } catch (err) {
    res.status(500).send(err);
  }
};

const paymentStatusupdate = async (req, res) => {
  const { rrr } = req.params;
  const merchantId = "2547916";
  const apiKey = "1946";
  const apiHash = CryptoJS.SHA512(rrr + apiKey + merchantId).toString(
    CryptoJS.enc.Hex
  );

  try {
    const response = await axios.get(
      `https://demo.remita.net/remita/exapp/api/v1/send/api/echannelsvc/${merchantId}/${rrr}/${apiHash}/status.reg`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `remitaConsumerKey=${merchantId},remitaConsumerToken=${apiHash}`,
        },
      }
    );

    const status = response.data;

    if (status.message === "Pending") {
      // Update payment status in the database
      await Payment.findOneAndUpdate({ rrr }, { paymentStatus: "Pending" });

      // Send notification to another system
      const notificationEndpoint = "https://webhook.site/74c54274-6cc8-49af-8d85-fbd39aa4c513"; // Replace with your target system's endpoint
      const paymentDetails = await Payment.findOne({ rrr });
      const notificationRequestBody = {
        name: paymentDetails.name, 
        email: paymentDetails.email, 
        phone: paymentDetails.phone, 
        amount: paymentDetails.amount,
        remita_transaction_id: paymentDetails.rrr,
        description: paymentDetails.description,
        status:paymentDetails.paymentStatus
      };
      const notificationHeaders = {
        Authorization: "Bearer YOUR_API_KEY", // If authentication is required
        "Content-Type": "application/json",
      };

      try {
        const notificationResponse = await axios.post(
          notificationEndpoint,
          notificationRequestBody,
          { headers: notificationHeaders }
        );
        if (notificationResponse.status === 200) {
          console.log("Payment notification sent successfully!");
        } else {
          console.log(
            "Error sending payment notification:",
            notificationResponse.data
          );
        }
      } catch (notificationError) {
        console.error("Error sending payment notification:", notificationError);
      }
    }

    res.json(status);
  } catch (error) {
    res.status(500).send(error.message);
  }
};

// const PaymentUpdate = async (req, res) => {
//     const { rrr } = req.params;
//     const { paymentStatus } = req.body;

//     try {
//       const updatedPayment = await paymentData.findOneAndUpdate({ rrr }, { paymentStatus }, { new: true });
//       res.json(updatedPayment);
//     } catch (error) {
//       res.status(500).send(error.message);
//     }
//   }

module.exports = { savePayments, paymentStatusupdate};
