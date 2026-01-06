if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}
const express = require('express')
const app = express()
const port = process.env.PORT;
const connectDB = require ('./config/mongodb');
const connectRedis = require('./config/redis');
const urlRoutes = require('./routes/urls');

//call my DB
let db;
let redisClient;


//intercepts the json from the user
app.use(express.json());
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.send("Test")
})

app.listen(port,async() => {
    console.log(`Listening on port ${port}`)

    //connect to db
    db = await connectDB();
    redisClient = await connectRedis();

    const {apiRouter, redirectRouter} = urlRoutes(db, redisClient);

    app.use('/api', apiRouter);
    app.use('/', redirectRouter);
});