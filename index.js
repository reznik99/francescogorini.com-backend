require('dotenv').config()
const fetch = require('node-fetch')
const nodemailer = require('nodemailer')
const bodyParser = require('body-parser');
const express = require('express')

// Express Middleware
const app = express()
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Nodemailer
let transporter = nodemailer.createTransport({ sendmail: true }) // Auth-less

// Routes
app.get('/', (req, res) => {
    return res.send('Received a GET HTTP method');
});

app.post('/api/sendEmail', async (req, res) => {
    console.log(req.body)
    if (req.body.name && req.body.email && req.body.message) {
        //save variables
        let name = req.body.name;
        let sender = req.body.email;
        let msg = `Message from ${name}.\n\n ${req.body.message}.\n\nReply to this email will automatically reply-to:${sender}`

        mailOptions = {
            from: "portfolio",               // sender address
            to: process.env.RECIPIENT,       // list of receivers
            replyTo: sender,
            subject: `Message from ${name}`, // Subject line
            text: msg,                       // plaintext body
            html: ""                         // html body
        }

        if (req.body.recaptcha_response) {
            // Send request and decode response:
            try {
                const response = await fetch(`https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET}&response=${req.body.recaptcha_response}`)
                const recaptcha_json = await response.json()

                if (recaptcha_json.success) {
                    if (transporter.sendMail(mailOptions)) {
                        res.sendStatus(202) // (Accepted) Email sent!
                        console.log(`Successful sendEmail for ${sender}.`)
                    } else {
                        res.sendStatus(500) //Error: (Internal Error) Email not sent.
                        console.warn("Attempted sendEmail failed.")
                    }
                } else {
                    res.sendStatus(403) //Error: (Forbidden) Email not sent. Captcha FAILED!
                    console.warn("Attempted sendEmail with invalid recaptcha_response.")
                }
            } catch (e) {
                console.error(`Error, sendMail request failed:\n${e}`)
            }
        } else {
            res.sendStatus(403) //Error: (Forbidden) Email not sent. Captcha FAILED!
            console.warn("Attempted sendEmail without recaptcha_response.")
        }
    }
});


app.listen(process.env.PORT, () =>
    console.log(`francescogorini.com API listening on port ${process.env.PORT || 80}!`),
);