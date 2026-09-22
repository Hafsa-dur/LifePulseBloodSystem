import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import StaffInvitation from '../models/StaffInvitation.js';
import crypto from 'crypto';
import { sendVerificationEmail } from '../services/emailService.js';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const tokenHash = (token) => crypto.createHash('sha256').update(token).digest('hex');
const frontendUrl = () => String(process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
const createVerification = () => {
  const token = crypto.randomBytes(32).toString('hex');
  return { token, tokenHash: tokenHash(token), expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) };
};
const sendUserVerification = async (user, purpose = 'account', recipientEmail = user.email) => {
  const verification = createVerification();
  user.verificationTokenHash = verification.tokenHash;
  user.verificationTokenExpiresAt = verification.expiresAt;
  await user.save();
  const result = await sendVerificationEmail({
    recipientEmail,
    purpose,
    verificationLink: `${frontendUrl()}/verify-email?token=${encodeURIComponent(verification.token)}`
  });
  return { ...result, verification };
};

const normalizeRole = (role) => {
  const value = String(role || '').trim().toLowerCase();
  if (value === 'hospital_admin' || value === 'admin') return 'hospital_admin';
  if (value === 'hospital_staff' || value === 'staff') return 'hospital_staff';
  return value || 'donor';
};

const safeUserPayload = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  previousEmails: user.previousEmails || [],
  emailVerified: user.emailVerified !== false,
  role: normalizeRole(user.role),
  staffRole: normalizeRole(user.role) === 'hospital_staff' ? 'Hospital Staff' : '',
  hospitalId: user.hospitalId,
  hospitalName: user.hospitalName,
  hospitalLocation: user.hospitalLocation,
  phone: user.phone,
  profile: user.profile,
  isActive: user.isActive,
  permissions: user.permissions
});

const invitationHash = (token) => crypto.createHash('sha256').update(String(token || '').trim()).digest('hex');
const normalizeInvitationToken = (token) => {
  const value = String(token || '').trim();
  try { return decodeURIComponent(value).trim(); } catch { return value; }
};

const findInvitationByToken = async (token, query = {}) => {
  const normalizedToken = normalizeInvitationToken(token);
  const invitation = await StaffInvitation.findOne({
    ...query,
    $or: [{ tokenHash: invitationHash(normalizedToken) }, { token: normalizedToken }]
  });
  if (invitation && !invitation.tokenHash) {
    await StaffInvitation.updateOne(
      { _id: invitation._id },
      { $set: { tokenHash: invitationHash(normalizedToken) }, $unset: { token: 1 } },
      { strict: false }
    );
    invitation.tokenHash = invitationHash(normalizedToken);
  }
  return invitation;
};

export const validateStaffInvitation = async (req, res) => {
  try {
    const token = normalizeInvitationToken(req.params.token);
    if (!token) return res.status(400).json({ success: false, valid: false, message: 'Invitation token is required.' });

    const invitation = await findInvitationByToken(token);
    if (!invitation) return res.status(404).json({ success: false, valid: false, message: 'This invitation link is invalid.' });
    if (invitation.status === 'accepted' || invitation.status === 'used' || invitation.usedAt) {
      return res.json({
        success: true,
        valid: false,
        accepted: true,
        message: 'Invitation already accepted. This staff account is already registered.',
        invitation: { email: invitation.email, inviteeName: invitation.inviteeName || '', hospitalName: invitation.hospitalName, expiresAt: invitation.expiresAt, acceptedUserId: invitation.acceptedUserId || null }
      });
    }
    if (invitation.expiresAt <= new Date()) {
      await StaffInvitation.updateOne({ _id: invitation._id, status: 'pending' }, { status: 'expired' });
      return res.status(410).json({ success: false, valid: false, message: 'This invitation has expired.' });
    }

    return res.json({ success: true, valid: true, invitation: { email: invitation.email, inviteeName: invitation.inviteeName || '', hospitalName: invitation.hospitalName, expiresAt: invitation.expiresAt } });
  } catch (error) {
    return res.status(500).json({ success: false, valid: false, message: error.message });
  }
};

export const registerUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role = 'donor',
      hospitalId = '',
      hospitalName = '',
      hospitalLocation = '',
      phone = '',
      profile = ''
    } = req.body;

    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!normalizedEmail || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    if (!emailPattern.test(normalizedEmail)) return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const safeRole = 'donor';

    const user = await User.create({
      name: String(name || '').trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: safeRole,
      hospitalId: String(hospitalId || '').trim(),
      hospitalName: String(hospitalName || '').trim(),
      hospitalLocation: String(hospitalLocation || '').trim(),
      phone: String(phone || '').trim(),
      profile: String(profile || '').trim(),
      isActive: false,
      emailVerified: false,
      permissions: ['profile', 'history']
    });
    const emailResult = await sendUserVerification(user);
    if (!emailResult.sent) {
      await User.deleteOne({ _id: user._id });
      return res.status(502).json({ success: false, message: 'Verification email could not be sent. Please try again.' });
    }
    return res.status(201).json({ success: true, pendingVerification: true, message: 'Verification email sent. Please check your inbox before signing in.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const registerStaffFromInvitation = async (req, res) => {
  try {
    const { token, name, email, password, phone = '' } = req.body;
    if (!token) return res.status(400).json({ success: false, message: 'Invitation token is required.' });

    const normalizedEmail = String(email || '').trim().toLowerCase();
    const normalizedToken = normalizeInvitationToken(token);
    const invitation = await findInvitationByToken(normalizedToken);
    const matchingInvitation = invitation || null;
    if (!matchingInvitation) {
      return res.status(400).json({ success: false, message: 'Invalid, expired, or already used staff invitation token.' });
    }
    if (matchingInvitation.status === 'accepted' || matchingInvitation.status === 'used' || matchingInvitation.usedAt) {
      if (!normalizedEmail || (matchingInvitation.email && matchingInvitation.email !== normalizedEmail)) {
        return res.status(403).json({ success: false, message: 'This invitation is only valid for the invited email address.' });
      }
      const existingStaff = matchingInvitation.acceptedUserId
        ? await User.findOne({ _id: matchingInvitation.acceptedUserId, role: { $in: ['hospital_staff', 'staff'] } }).select('-password').lean()
        : await User.findOne({ email: normalizedEmail, hospitalId: matchingInvitation.hospitalId, role: { $in: ['hospital_staff', 'staff'] } }).select('-password').lean();
      return res.status(200).json({
        success: true,
        accepted: true,
        alreadyRegistered: true,
        code: 'INVITATION_ACCEPTED',
        message: 'Invitation already accepted. This invitation is already linked to your staff account.',
        invitation: { email: matchingInvitation.email, hospitalName: matchingInvitation.hospitalName, acceptedUserId: matchingInvitation.acceptedUserId || null },
        user: existingStaff ? safeUserPayload(existingStaff) : null
      });
    }
    if (matchingInvitation.status !== 'pending' || matchingInvitation.expiresAt <= new Date()) {
      if (matchingInvitation.status === 'pending') await StaffInvitation.updateOne({ _id: matchingInvitation._id, status: 'pending' }, { status: 'expired' });
      return res.status(410).json({ success: false, message: 'This invitation has expired.' });
    }

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Invitation email, name, and password are required.' });
    }

    if (matchingInvitation.email && matchingInvitation.email !== normalizedEmail) {
      return res.status(403).json({ success: false, message: 'This invitation is only valid for the invited email address.' });
    }

    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(String(password), 10);
    let user;
    try {
      user = await User.create({
        name: String(name).trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role: 'hospital_staff',
        staffRole: 'Hospital Staff',
        hospitalId: matchingInvitation.hospitalId,
        hospitalName: matchingInvitation.hospitalName,
        hospitalLocation: matchingInvitation.hospitalLocation,
        phone: String(phone).trim(),
        permissions: ['dashboard', 'requests', 'inventory', 'dispatch', 'tracking', 'account'],
        isActive: true
      });
    } catch (error) {
      throw error;
    }

    const acceptedInvitation = await StaffInvitation.findOneAndUpdate(
      { _id: matchingInvitation._id, status: 'pending', expiresAt: { $gt: new Date() } },
      { status: 'accepted', acceptedUserId: user._id, usedAt: new Date() },
      { new: true }
    ).lean();
    if (!acceptedInvitation) {
      await User.deleteOne({ _id: user._id });
      return res.status(409).json({ success: false, accepted: true, code: 'INVITATION_ACCEPTED', message: 'Invitation was already accepted by another registration.' });
    }

    const safeUser = safeUserPayload(user);
    safeUser.role = normalizeRole(safeUser.role);

    const authToken = jwt.sign({ id: user._id, role: user.role, hospitalId: user.hospitalId, hospitalName: user.hospitalName }, process.env.JWT_SECRET, { expiresIn: '1d' });
    return res.status(201).json({ success: true, token: authToken, user: safeUser });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();

    const user = await User.findOne({ email: normalizedEmail });

    if (user && (await bcrypt.compare(password, user.password))) {
      if (user.emailVerified === false || user.isActive === false) {
        return res.status(403).json({ success: false, code: 'EMAIL_NOT_VERIFIED', message: 'Please verify your email address before continuing.' });
      }
      const token = jwt.sign({ id: user._id, role: user.role, hospitalId: user.hospitalId, hospitalName: user.hospitalName }, process.env.JWT_SECRET, { expiresIn: '1d' });
      return res.status(200).json({
        success: true,
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          previousEmails: user.previousEmails || [],
          emailVerified: user.emailVerified !== false,
          role: normalizeRole(user.role),
          staffRole: normalizeRole(user.role) === 'hospital_staff' ? 'Hospital Staff' : '',
          hospitalId: user.hospitalId,
          hospitalName: user.hospitalName,
          hospitalLocation: user.hospitalLocation,
          phone: user.phone,
          profile: user.profile,
          isActive: user.isActive,
          permissions: user.permissions
        }
      });
    } else {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, currentPassword, newPassword } = req.body || {};
    const updates = {};
    const account = newPassword ? await User.findById(req.user._id) : null;

    if (typeof name === 'string' && name.trim()) updates.name = name.trim();

    if (newPassword) {
      if (!account || !currentPassword || !(await bcrypt.compare(String(currentPassword), account.password))) {
        return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
      }
      if (String(newPassword).length < 6) {
        return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
      }
      updates.password = await bcrypt.hash(String(newPassword), 10);
    }

    if (!Object.keys(updates).length) {
      return res.status(400).json({ success: false, message: 'Enter a new name or password.' });
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    return res.json({ success: true, user: safeUserPayload(user) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const token = String(req.query.token || '').trim();
    if (!token) return res.status(400).json({ success: false, message: 'Verification token is required.' });
    const user = await User.findOne({ verificationTokenHash: tokenHash(token), verificationTokenExpiresAt: { $gt: new Date() } });
    if (!user) return res.status(400).json({ success: false, message: 'This verification link is invalid or expired.' });

    if (user.pendingEmail) {
      if (await User.exists({ email: user.pendingEmail, _id: { $ne: user._id } })) return res.status(409).json({ success: false, message: 'This email address is already registered.' });
      user.previousEmails = [...new Set([...(user.previousEmails || []), user.email])];
      user.email = user.pendingEmail;
      user.pendingEmail = '';
    }
    user.emailVerified = true;
    user.isActive = true;
    user.verificationTokenHash = '';
    user.verificationTokenExpiresAt = null;
    await user.save();
    return res.json({ success: true, message: 'Email verified successfully. You can now sign in.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const resendVerificationEmail = async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    if (!emailPattern.test(email)) return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    const user = await User.findOne({ $or: [{ email }, { pendingEmail: email }] });
    if (!user) return res.status(404).json({ success: false, message: 'No pending account was found for this email address.' });
    if (user.emailVerified !== false && !user.pendingEmail) return res.status(400).json({ success: false, message: 'This email address is already verified.' });
    const result = await sendUserVerification(user, user.pendingEmail ? 'email-change' : 'account', user.pendingEmail || user.email);
    if (!result.sent) return res.status(502).json({ success: false, message: 'Verification email could not be sent. Please try again.' });
    return res.json({ success: true, message: 'A new verification email has been sent.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const requestEmailChange = async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const currentPassword = String(req.body?.currentPassword || '');
    if (!emailPattern.test(email)) return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    if (email === req.user.email) return res.status(400).json({ success: false, message: 'Enter a different email address.' });
    if (!currentPassword || !(await bcrypt.compare(currentPassword, (await User.findById(req.user._id)).password))) return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    if (await User.exists({ email, _id: { $ne: req.user._id } })) return res.status(409).json({ success: false, message: 'Email already registered.' });
    const user = await User.findById(req.user._id);
    user.pendingEmail = email;
    const result = await sendUserVerification(user, 'email-change', email);
    if (!result.sent) {
      user.pendingEmail = '';
      user.verificationTokenHash = '';
      user.verificationTokenExpiresAt = null;
      await user.save();
      return res.status(502).json({ success: false, message: 'Verification email could not be sent. Please try again.' });
    }
    return res.json({ success: true, pendingVerification: true, message: 'Verification email sent to your new email address.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};