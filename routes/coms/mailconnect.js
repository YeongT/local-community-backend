import { createTransport } from "nodemailer";

var _response = { "transporter" : null, "mailerror" : true };
const mailConnect = async () => {
    const transporter = createTransport({
        host: process.env.MAIL_AUTH_SMTP_HOST,
        port: process.env.MAIL_AUTH_SMTP_PORT,
        secure: true,
        auth: {
            user: "no-reply@hakbong.me",
            pass: process.env.MAIL_AUTH_PASSWORD
        }
    });
    try {
        const verify = await transporter.verify();
        if (!verify) throw (verify);
        _response.transporter = transporter;
        _response.mailerror = null;
    } catch (error) {
        _response.transporter = null;
        _response.mailerror = error;
    }
    return _response;
};

export default mailConnect;