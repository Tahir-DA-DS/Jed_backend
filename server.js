require('dotenv').config()
const express = require('express');
const connectDB = require("./db/connect")
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet')
const paymentRouter = require('./routes/payment')
const logger = require('./logger')

require("dotenv").config()
const app = express();
const PORT = process.env.PORT || 5000;


// Middleware
app.use(cors());
app.use(helmet())
app.use(bodyParser.json());

app.use((req, res, next) => {
    logger.info(`${req.method} ${req.url}`);
    next();
  });
  
  app.use((err, req, res, next) => {
    logger.error(err.stack);
    res.status(500).send('Something broke!');
  });



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
