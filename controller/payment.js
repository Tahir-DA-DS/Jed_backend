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

const paymentStatusUpdate = async (req, res) => {
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

    const { data: status } = response;
    

    if (status.message === "Transaction Pending") {
      // Update payment status in the database
      const updatedPayment = await Payment.findOneAndUpdate(
        { rrr },
        { paymentStatus: "Pending" },
        { new: true }
      );

      if (!updatedPayment) {
        throw new Error(`Payment with RRR ${rrr} not found`);
      }

      // Send notification to another system
      const notificationEndpoint = "https://webhook.site/74c54274-6cc8-49af-8d85-fbd39aa4c513"; // Replace with your target system's endpoint
      const notificationRequestBody = {
        name: updatedPayment.name,
        email: updatedPayment.email,
        phone: updatedPayment.phone,
        amount: updatedPayment.amount,
        remita_transaction_id: updatedPayment.rrr,
        description: updatedPayment.description,
        status: updatedPayment.paymentStatus,
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
          console.log("Error sending payment notification:", notificationResponse.data);
        }
      } catch (notificationError) {
        console.error("Error sending payment notification:", notificationError);
      }
    }

    res.json(status);
  } catch (error) {
    console.error("Error updating payment status:", error.message);
    res.status(500).send({ error: error.message });
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

module.exports = { savePayments, paymentStatusUpdate};
