if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}
const express = require('express')
const app = express()
const port = process.env.PORT;
const connectDB = require ('./config/mongodb');
const connectRedis = require('./config/redis');
const urlRoutes = require('./routes/urls');

//establish db variables
let db;
let redisClient;


//parse json via express
app.use(express.json());
app.use(express.static('public'));

//setup the server, listen on port from .env
app.listen(port,async() => {
    console.log(`Listening on port ${port}`)

    //connect to db
    db = await connectDB();
    redisClient = await connectRedis();

    //calls urlRoutes with parameters db and redis client, assign to apiRouter and redirectRouter
    const {apiRouter, redirectRouter} = urlRoutes(db, redisClient);

    app.use('/api', apiRouter);
    app.use('/', redirectRouter);
});