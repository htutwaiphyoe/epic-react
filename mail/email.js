const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
    // create transpoter
    const transport = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
        },
    });

    // define email options
    const mailOptions = {
        from: "Natours <admin@natours.org>",
        to: options.email,
        subject: options.subject,
        text: options.body,
    };

    // send email
    await transport.sendMail(mailOptions);
};

module.exports = sendEmail;
