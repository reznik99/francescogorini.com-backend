import express from 'express';
import axios from 'axios';
import bodyParser from 'body-parser'
import { createTransport } from 'nodemailer';
import { log_error, log_info, log_warning } from './log.js';
import "dotenv/config";

const PORT = process.env.PORT || 80
const transporter = createTransport({ sendmail: true }) // Auth-less
const app = express()

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const messageToEmailBody = (name, message, email) => {
    return `Message from ${name}.\n\n${message}.\n\nReply to this email will automatically reply-to:${email}`
}

// Routes
app.post('/api/sendEmail', async (req, res) => {
    const { name, email, message, recaptcha_response } = req.body

    if (!name || !email || !message) {
        log_error(`Unable to send email with missing data. Requires 'name', 'email' and 'message'.`)
        res.status(403).send("Unable to send email with missing data. Requires 'name', 'email' and 'message'.")
        return
    }
    if (!recaptcha_response) {
        log_warning("Attempted Email without recaptcha_response.")
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

        if (!response.data.success) {
            log_warning("Attempted Email with invalid recaptcha_response.")
            res.status(403).send("Email not sent. Captcha FAILED!")
            return
        }

        await transporter.sendMail(mailOptions)
        log_info(`${email} sent an email.`)
        res.status(202).send()
    } catch (err) {
        log_error(`Send Email request failed:`, err)
        res.status(500).send("Email not sent")
    }
});


app.listen(PORT, () => {
    if (!process.env.RECIPIENT) {
        log_error("env: RECIPIENT not set!")
    } else if (!process.env.RECAPTCHA_URL) {
        log_error("env: RECAPTCHA_URL not set but required!")
    } else if (!process.env.RECAPTCHA_SECRET) {
        log_error("env: RECAPTCHA_SECRET not set but required!")
    }
    log_info(`francescogorini.com API listening on port ${process.env.PORT || 80}!`);
});