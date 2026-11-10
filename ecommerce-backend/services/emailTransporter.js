const nodemailer = require("nodemailer");

function getEmailTransporter() {
    const user = process.env.EMAIL || process.env.SMTP_EMAIL;
    const pass = process.env.EMAIL_PASS || process.env.SMTP_PASSWORD;
    if (!user || !pass || pass === "your_email_app_password") return null;

    if (process.env.SMTP_HOST) {
        const port = Number(process.env.SMTP_PORT) || 587;
        return nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port,
            secure: port === 465,
            auth: { user, pass }
        });
    }

    return nodemailer.createTransport({
        service: "gmail",
        auth: { user, pass }
    });
}

module.exports = getEmailTransporter;
