const express = require('express')
const axios = require('axios')
const redis = require('redis')
const responseTime = require('response-time');
const { promisify } = require('util');

const app = express()

const client = redis.createClient({
    host: '127.0.0.1',
    port: 6379
})

const GET_ASYNC = promisify(client.get).bind(client);
const SET_ASYNC = promisify(client.set).bind(client);

app.use(responseTime())

app.get('/character', async(req, res, next) => {
    try {
        const reply = await GET_ASYNC('jokes');
        if (reply) {
            console.log('using cached data');
            return res.send(JSON.parse(reply))
        }

        const response = await axios.get('https://rickandmortyapi.com/api/character')
        const saveResult = await SET_ASYNC('jokes', JSON.stringify(response.data), 'EX', 10);

        console.log('saved data:', saveResult);

        res.send(response.data)
    } catch (error) {
        res.send(error.message)
    }
});

app.get('/character/:id', async (req, res, next) => {
    try {
        const reply = await GET_ASYNC(req.params.id);
        if (reply) {
            console.log('using cached data');
            return res.send(JSON.parse(reply))
        }

        const response = await axios.get('https://rickandmortyapi.com/api/character/' + req.params.id);
        const saveResult = await SET_ASYNC(req.params.id, JSON.stringify(response.data), 'EX', 15);

        console.log('saved data:', saveResult);

        res.send(response.data)
    } catch (error) {
        console.log(error)
        res.send(error.message)
    }
})

app.listen(3000, console.log('server listen on port 3000'))