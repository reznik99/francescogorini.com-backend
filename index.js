import express from 'express';
import axios from 'axios';
import bodyParser from 'body-parser'
import * as dotenv from "dotenv";
import { createTransport } from 'nodemailer';

const transporter = createTransport({ sendmail: true }) // Auth-less
const app = express()

dotenv.config();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const messageToEmailBody = (name, message, email) => {
    return `Message from ${name}.\n\n${message}.\n\nReply to this email will automatically reply-to:${email}`
}

// Routes
app.post('/api/sendEmail', async (req, res) => {
    const { name, email, message, recaptcha_response } = req.body

    if (!name || !email || !message) {
        console.error(`Unable to send email with missing data. Requires 'name', 'email' and 'message'.`)
        res.status(403).send("Unable to send email with missing data. Requires 'name', 'email' and 'message'.")
        return
    }
    if (!recaptcha_response) {
        console.warn("Attempted Email without recaptcha_response.")
        res.status(403).send("Email not sent. Captcha FAILED!")
        return
    }

    const mailOptions = {
        from: "portfolio",
        to: process.env.RECIPIENT,
        replyTo: email,
        subject: `Message from ${name}`,
        text: messageToEmailBody(name, message, email),
    }

    try {
        const response = await axios.get(`${process.env.RECAPTCHA_URL}?secret=${process.env.RECAPTCHA_SECRET}&response=${recaptcha_response}`)
        const recaptcha_json = await response.json()

        if (!recaptcha_json.success) {
            console.warn("Attempted Email with invalid recaptcha_response.")
            res.status(403).send("Email not sent. Captcha FAILED!")
            return
        }

        await transporter.sendMail(mailOptions)
        console.log(`${email} sent an email.`)
        res.status(202).send()
    } catch (err) {
        console.error(`Send Email request failed:`, err)
        res.status(500).send("Email not sent")
    }
});


app.listen(process.env.PORT, () =>
    console.log(`francescogorini.com API listening on port ${process.env.PORT || 80}!`),
);