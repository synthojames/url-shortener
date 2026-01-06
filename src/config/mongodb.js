if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}
const {MongoClient} = require('mongodb');
const mongoURI = process.env.MONGODB_URI;

const client = new MongoClient(mongoURI);

async function connectDB() {
    try {
        await client.connect()
        console.log("Connected to MongoDB!")
        return client.db('urlshortener')
    } catch (error) {
        console.log(error)
        process.exit(1)
    }
}

module.exports = connectDB;