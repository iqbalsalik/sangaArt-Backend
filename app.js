const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const Razorpay = require("razorpay");
require('dotenv').config();
const mockData = require('./mockData');
const nodemailer = require('nodemailer');
// const twilio = require('twilio');
const crypto = require('crypto');

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(express.json());
// const path = require("path")
// app.use(express.static("Public"))


// // const sharp = require('sharp');

// const fs = require('fs');

// const imagePath = path.join(__dirname)+'/assets/products/img1.1.jpg';
// const imgP = '/'

// const binaryImageData = fs.readFileSync(imagePath);

// // Convert binary data to base64 (optional)
// const base64ImageData = binaryImageData.toString('base64');

// console.log(binaryImageData);
// console.log(base64ImageData);




const sendEmail = async (product, amount) => {
  let transporter = nodemailer.createTransport({
    service: 'gmail', // Or any other service you are using
    auth: {
      user: process.env.EMAIL_USER, // Your email
      pass: process.env.EMAIL_PASSWORD // Your password
    }
  });

  let mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.OWNER_EMAIL, // Owner's email
    subject: `New Payment for Product`,
    text: `A new payment has been made for ${product.name}. Amount: ₹${amount / 100}.`
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
};

// const client = new twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// const accountSid = 'AC5a713329c95ad51b5218a03450d3bf17';
// const authToken = '446437623d1c508eb34f62600aa8c14e';
// const client = require('twilio')(accountSid, authToken);

 





    


let amount;
let product;
let userDetails;
app.post('/buyProduct',async(req,res)=>{
    try{
            const rzp = new Razorpay({
            key_id:process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET
        })
        product = req.body.cartItems;
        let total = 0;
          product.map(item=>{
            price = Number(item.price)
            total+=price
          return total
         })
         amount = total * 100
         userDetails = req.body.userDetails
        rzp.orders.create({amount,currency:"INR"},async (err,order)=>{
            if(err){
                throw new Error(JSON.stringify(err))
            }
            return res.status(200).json({order,key_id:rzp.key_id})
        })
    } catch(err){
        res.status(400).json("Something Went Wrong!!")
    }
})

const sendWhatsAppMessage = async (product, amount) => {
  const productsList = product.map((item) => `${item.name} - ₹${item.price}`).join('\n');
  const customerDetails = `Phone: ${userDetails.phone}\nCountry: ${userDetails.country}\nState: ${userDetails.state}\nDistrict: ${userDetails.district}\nAddress1: ${userDetails.address1}\nAddress2: ${userDetails.address2}\nPin code: ${userDetails.pin}`;

    client.messages.create({
      body: `A new payment has been made for ${productsList}\n. Amount: ₹${amount / 100}\n. Customer Details: ${customerDetails}`,
      from: 'whatsapp:+14155238886', // Twilio's sandbox WhatsApp number
      to: 'whatsapp:+918946914346' // Owner's WhatsApp number
    }).then(message => console.log(message.sid))
      .catch(err => console.log(err));
 };

app.post("/paymentVerification", async (req, res) => {
    const { order_id,payment_id,signature } = req.body;
  
    const shasum = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
    shasum.update(order_id + "|" + payment_id);
    const digest = shasum.digest("hex");
  
    if (digest === signature) {
      // Payment is successful
      // Send Email and WhatsApp here
    //   await sendEmail(product, amount);
      await sendWhatsAppMessage(product, amount);
  
      res.status(200).json({ success: true, message: "Payment verified" });
    } else {
      res.status(400).json({ success: false, message: "Invalid signature" });
    }
  });

app.post("/updateFailureTransactionStatus", async(req,res)=>{
    try {
        const {payment_id,order_id}= req.body;
        res.status(200).json({message:"Transaction Successfull",success:true})
          }catch(err){
            res.status(500).json({message:"Transaction Failed!",success:false})
          }
})

app.listen(3000)