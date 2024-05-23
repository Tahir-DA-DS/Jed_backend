const express = require('express');
const connectDB = require("./db/connect")
const bodyParser = require('body-parser');
const cors = require('cors');
const paymentRouter = require('./routes/payment')

require("dotenv").config()
const app = express();
const PORT = process.env.PORT || 5000;


// Middleware
app.use(cors());
app.use(bodyParser.json());



app.use('/', paymentRouter)

const start = async ()=> {
    try {
        await connectDB(process.env.URI)
        app.listen(PORT, ()=>{
            console.log(`connected to the db sucessfully`);
            console.log(`app is listening on port ${PORT}`);
        })
    } catch (error) {
        console.log("error starting app", error)
    }
    
}

start()
