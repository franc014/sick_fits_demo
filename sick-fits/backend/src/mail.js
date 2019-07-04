const mailer = require("nodemailer");

const mailTransport = mailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASSWORD
  }
});

const makeANiceEmail = text => `
<div className="email" style="
    border:1px solid black;
    padding:20px;
    font-family:sans-serif;
    line-height:2;
    font-size:20px;
">
<h2>Hello there!</h2>
<p>${text}</p>
<p>Juan Francisco</p>
</div>
`;

exports.transport = mailTransport;
exports.makeANiceEmail = makeANiceEmail;
