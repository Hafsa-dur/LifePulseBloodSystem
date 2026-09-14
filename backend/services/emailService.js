import nodemailer from 'nodemailer';

let transporter;
const getTransporter = () => {
  if (transporter) return transporter;
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_PORT || !process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) return null;
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: String(process.env.EMAIL_SECURE || 'false') === 'true',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD }
  });
  return transporter;
};

export const sendDonorEmergencyEmail = async ({ donorEmail, donorName, bloodGroup, urgency, hospitalName, hospitalLocation, unitsRequired }) => {
  const mailer = getTransporter();
  if (!mailer || !donorEmail) return { sent: false, reason: !donorEmail ? 'missing-donor-email' : 'email-not-configured' };
  try {
    await mailer.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: donorEmail,
      subject: `${urgency} blood request: ${bloodGroup} needed at ${hospitalName}`,
      text: `Dear ${donorName || 'Donor'},\n\nA ${urgency.toLowerCase()} blood requirement has been raised.\n\nBlood group: ${bloodGroup}\nUnits required: ${unitsRequired}\nHospital: ${hospitalName}\nLocation: ${hospitalLocation}\n\nPlease contact the hospital if you are available to donate.\n\nLifePulse`
    });
    return { sent: true };
  } catch (error) {
    console.error('Donor notification email failed:', error.message);
    return { sent: false, reason: 'send-failed' };
  }
};
