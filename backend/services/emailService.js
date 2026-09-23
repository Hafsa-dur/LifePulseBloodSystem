import nodemailer from 'nodemailer';

let transporter;
const getTransporter = () => {
  if (transporter) return transporter;
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_PORT || !process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) return null;
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: String(process.env.EMAIL_SECURE || 'false') === 'true',
    auth: { user: process.env.EMAIL_USER, pass: String(process.env.EMAIL_PASSWORD).replace(/\s+/g, '') }
  });
  return transporter;
};

export const sendEmailMessage = async ({ to, subject, text, html }) => {
  const mailer = getTransporter();
  const recipient = String(to || '').trim().toLowerCase();
  if (!mailer || !recipient) {
    return { sent: false, reason: !recipient ? 'missing-recipient-email' : 'email-not-configured' };
  }

  try {
    await mailer.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: recipient,
      subject,
      text,
      html: html || text
    });
    return { sent: true };
  } catch (error) {
    console.error('Email delivery failed:', error.message);
    return { sent: false, reason: error.code || 'send-failed', error: error.message };
  }
};

export const sendDonorEmergencyEmail = async ({ donorEmail, donorName, bloodGroup, urgency, hospitalName, hospitalLocation, patientName, unitsRequired, message }) => {
  const donorMessage = message || `A ${String(urgency || 'Urgent').toLowerCase()} blood requirement has been raised.`;
  return sendEmailMessage({
    to: donorEmail,
    subject: `${String(urgency || 'Urgent').toUpperCase()} blood request: ${bloodGroup} needed at ${hospitalName}`,
    text: `Dear ${donorName || 'Donor'},\n\n${donorMessage}\n\nBlood group: ${bloodGroup}\nUnits required: ${unitsRequired}\nPatient: ${patientName || 'Urgent patient request'}\nHospital: ${hospitalName}\nLocation: ${hospitalLocation}\n\nPlease contact the hospital if you are available to donate and help save a life.\n\nWarm regards,\nLifePulse Blood Bank Management System`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.7;">
        <h3 style="color: #5A1827;">LifePulse Blood Donation Alert</h3>
        <p>Dear ${donorName || 'Donor'},</p>
        <p>${donorMessage}</p>
        <p><strong>Blood group:</strong> ${bloodGroup}<br />
        <strong>Units required:</strong> ${unitsRequired}<br />
        <strong>Patient:</strong> ${patientName || 'Urgent patient request'}<br />
        <strong>Hospital:</strong> ${hospitalName}<br />
        <strong>Location:</strong> ${hospitalLocation}</p>
        <p>Please contact the hospital if you are available to donate.</p>
        <p>Warm regards,<br />LifePulse Blood Bank Management System</p>
      </div>
    `
  });
};

export const sendDonorThankYouEmail = async ({ donorEmail, donorName, bloodGroup, units }) => {
  return sendEmailMessage({
    to: donorEmail,
    subject: 'Thank you for your blood donation with LifePulse',
    text: `Dear ${donorName || 'Donor'},\n\nThank you for donating ${units || 1} unit(s) of ${bloodGroup} blood through LifePulse. Your generosity can save lives and support patients in urgent need.\n\nWe sincerely appreciate your contribution and commitment to the community.\n\nWarm regards,\nLifePulse Blood Bank Management System`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.7;">
        <h3 style="color: #5A1827;">Thank you for your donation</h3>
        <p>Dear ${donorName || 'Donor'},</p>
        <p>Thank you for donating ${units || 1} unit(s) of <strong>${bloodGroup}</strong> blood through LifePulse.</p>
        <p>Your generosity helps save lives and strengthens the community’s emergency response network.</p>
        <p>We sincerely appreciate your support.</p>
        <p>Warm regards,<br />LifePulse Blood Bank Management System</p>
      </div>
    `
  });
};

export const sendRewardEmail = async ({ donorEmail, donorName, rewardTitle, partner, points, voucherCode }) => {
  return sendEmailMessage({
    to: donorEmail,
    subject: `LifePulse reward unlocked: ${rewardTitle}`,
    text: `Dear ${donorName || 'Donor'},\n\nYour LifePulse reward has been unlocked.\n\nReward: ${rewardTitle}\nPartner: ${partner}\nPoints used: ${points}\nVoucher code: ${voucherCode}\n\nPlease show this voucher code at the partner lab counter.\n\nWarm regards,\nLifePulse Blood Bank Management System`,
    html: `<div style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.7;"><h3 style="color: #5A1827;">LifePulse Reward Voucher</h3><p>Dear ${donorName || 'Donor'},</p><p>Your reward has been unlocked successfully.</p><p><strong>Reward:</strong> ${rewardTitle}<br /><strong>Partner:</strong> ${partner}<br /><strong>Points used:</strong> ${points}<br /><strong>Voucher code:</strong> ${voucherCode}</p><p>Please show this voucher code at the partner lab counter.</p><p>Warm regards,<br />LifePulse Blood Bank Management System</p></div>`
  });
};

export const sendStaffInvitationEmail = async ({ recipientEmail, hospitalName, inviteLink, staffRole = 'Hospital Staff' }) => {
  const recipient = recipientEmail;
  return sendEmailMessage({
    to: recipient,
    subject: `LifePulse Hospital Staff invitation for ${hospitalName}`,
    text: `You have been invited to join ${hospitalName} as Hospital Staff on the LifePulse platform.\n\nOpen this secure link to complete your staff registration:\n${inviteLink}\n\nThis invitation is time-limited and can only be used once.\n\nLifePulse Blood Bank Management System`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.7;">
        <h3 style="color: #5A1827;">LifePulse Staff Invitation</h3>
        <p>You have been invited to join <strong>${hospitalName}</strong> as <strong>Hospital Staff</strong>.</p>
        <p>Use the secure link below to complete your registration:</p>
        <p><a href="${inviteLink}">${inviteLink}</a></p>
        <p>This invitation is time-limited and can only be used once.</p>
        <p>Warm regards,<br />LifePulse Blood Bank Management System</p>
      </div>
    `
  });
};

export const sendVerificationEmail = async ({ recipientEmail, verificationLink, purpose = 'account' }) => {
  const subject = purpose === 'email-change' ? 'Confirm your new LifePulse email address' : 'Verify your LifePulse email address';
  const intro = purpose === 'email-change'
    ? 'Confirm this new email address to finish changing the email on your LifePulse account.'
    : 'Verify your email address to activate your LifePulse account.';
  return sendEmailMessage({
    to: recipientEmail,
    subject,
    text: `${intro}\n\nOpen this secure link to continue:\n${verificationLink}\n\nThis link expires in 48 hours and can only be used once.\n\nLifePulse Blood Bank Management System`,
    html: `<div style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.7;"><h3 style="color: #5A1827;">LifePulse Email Verification</h3><p>${intro}</p><p><a href="${verificationLink}" style="display:inline-block;background:#5A1827;color:#E5C158;padding:12px 18px;text-decoration:none;border-radius:8px;font-weight:bold;">Verify Email</a></p><p>This link expires in 48 hours and can only be used once.</p><p>Warm regards,<br />LifePulse Blood Bank Management System</p></div>`
  });
};
