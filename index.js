require('dotenv').config()
const express = require('express')

const app = express()


app.get('/', (req, res) => {
    return res.send('Received a GET HTTP method');
});

app.post('/api/sendEmail', (req, res) => {
    return res.send('Received a POST HTTP method');
});


app.listen(process.env.PORT, () =>
    console.log(`francescogorini.com API listening on port ${process.env.PORT}!`),
);