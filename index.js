import 'dotenv/config'
import express from 'express'

const app = express()


app.get('/', (req, res) => {
    return res.send('Received a GET HTTP method');
});

app.post('/api/sendEmail', (req, res) => {
    return res.send('Received a POST HTTP method');
});