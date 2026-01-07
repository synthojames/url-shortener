const express = require('express');
const generateShortCode = require('../utils/shortCodeGenerator');

module.exports = function(db, redisClient) {
    //creates the two express routers
    const apiRouter = express.Router();
    const redirectRouter = express.Router();

    //Shorten URL API
    apiRouter.post('/shorten', async (req, res) => {
        //print the received site into the log
        console.log(req.body);
        try{
            //retrieve the url from the request
            const {url} = req.body;
            //validate url
            if(!url) {
                return res.status(400).json({error: 'Invalid URL'});
            }

            //gen shortcode
            let shortCode = generateShortCode();

            //check if exisitng
            let existingUrl = await db.collection('urls').findOne({shortCode});
            while(existingUrl){
                //if existing, regenerate
                shortCode = generateShortCode();
                existingUrl = await db.collection('urls').findOne({shortCode});
            }
            //prepare for db add
            const urlDocument = {
                shortCode,
                originalUrl: url,
                createdAt: new Date(),
                clickCount: 0
            };
            //insert in db
            await db.collection('urls').insertOne(urlDocument);

            //cache for 1 hour in redis for speed
            await redisClient.set(`url:${shortCode}`, url, {
                EX: 3600
            })
            //create the shortened URL
            const shortUrl = `${process.env.BASE_URL}/${shortCode}`;

            //send json back with the new URL, the shortCOde, and the original URL
            res.status(201).json({
                shortUrl,
                shortCode,
                originalUrl: url
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Server Error'});
        }
    });
    //Statistics API
    apiRouter.get('/stats/:shortCode', async (req, res) => {
        try{
            const {shortCode} = req.params;
            //look for the entry in the db
            const urlDoc = await db.collection('urls').findOne({shortCode})
            //if null, return 404
            if(!urlDoc){
                return res.status(404).json({error: 'URL not found'});
            }
            //two variables for tracking recent and total clicks via redis
            const redisClicks = await redisClient.get(`clicks:${shortCode}`);
            const totalClicks = redisClicks ? parseInt(redisClicks) : urlDoc.clickCount;

            //get the last 10 clicked sites via the db
            const recentClicks = await db.collection('clicks')
                .find({shortCode})
                .sort({timestamp: -1})
                .limit(10)
                .toArray();

            //get the user browser statstics 
            const browserStats = await db.collection('clicks').aggregate([
                { $match: {shortCode } },
                { $group: {
                    _id: '$userAgent',
                    count: { $sum: 1 }
                }},
                { $sort: { count: -1 } }
            ]).toArray();
            //Send back the statistics including the shortCOde, URL, when it was created, total clicks, recent clicks and browser stats
            res.json({
                shortCode: urlDoc.shortCode,
                originalUrl: urlDoc.originalUrl,
                createdAt: urlDoc.createdAt,
                totalClicks,
                recentClicks,
                browserStats
            });


        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Server Error'});
        }
    });

    //List all URLS API
    apiRouter.get('/urls', async (req, res) => {
        try{
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;

            //count number of urls in db
            const totalUrls = await db.collection('urls').countDocuments();

            //collect the urls
            const urls = await db.collection('urls')
                .find({})
                .sort({ createdAt: -1 }) //newest first
                .skip(skip)
                .limit(limit)
                .toArray();

            const totalPages = Math.ceil(totalUrls / limit);
            const hasNextPage = page < totalPages;
            const hasPrevPage = page > 1;

            //list the urls
            res.json({
                urls,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalUrls,
                    limit,
                    hasNextPage,
                    hasPrevPage
                }
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Server error'});
        }
    });

    apiRouter.delete('/urls/:shortCode', async (req, res) => {
        try{
            const { shortCode } = req.params;

            //delete the shortcode from the mongodb
            const result = await db.collection('urls').deleteOne({shortCode});
            //if does not exist, return 404
            if(result.deletedCount === 0) {
                return res.status(404).json({ error: 'URL not found'});
            }

            //delete statistics from mongodb
            await db.collection('clicks').deleteMany({shortCode});

            //clean up redis
            await redisClient.del(`url:${shortCode}`);
            await redisClient.del(`clicks:${shortCode}`);

            res.json({
                message: 'URL deleted successfully', shortCode
            });

        } catch (error) {
            console.error(error)
            res.status(500).json({ error: 'Server Error'});
        }
    });

    //Redirect API
    redirectRouter.get('/:shortCode', async (req, res) => {
        try{
            const {shortCode} = req.params;
            //check if in redis
            let originalUrl = await redisClient.get(`url:${shortCode}`);
            //if not, check mongodb
            if(!originalUrl){
                const urlDoc = await db.collection('urls').findOne({shortCode})
                
                //if not even in mongodb return 404
                if(!urlDoc) {
                    return res.status(404).json({error: 'URL not found'});
                }

                //if it is in mongodb set originalUrl to it
                originalUrl = urlDoc.originalUrl;

                //cache it in redis
                await redisClient.set(`url:${shortCode}`, originalUrl, {
                    EX: 3600
                });
            }
            //log which code, when, who, and browser info
            db.collection('clicks').insertOne({
                shortCode,
                timestamp: new Date(),
                ip: req.ip,
                userAgent: req.get('user-agent')
            }).catch(err => console.error('Click logging error:', err));

            //increment the click for the url
            db.collection('urls').updateOne(
                {shortCode},
                {$inc: {clickCount: 1}}
                ).catch(err => console.error('Counter error:', err));
            //do the same for redis
            await redisClient.incr(`clicks:${shortCode}`);

            //redirect to the original url
            res.redirect(originalUrl);

        } catch (error) {
            console.error(error);
            res.status(500).json({error: 'Server Error'});
        }
    });

    //return the result
    return {apiRouter, redirectRouter};
};