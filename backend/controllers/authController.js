import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import StaffInvitation from '../models/StaffInvitation.js';
import crypto from 'crypto';

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
      isActive: true,
      permissions: ['profile', 'history']
    });

    const token = jwt.sign({ id: user._id, role: user.role, hospitalId: user.hospitalId, hospitalName: user.hospitalName }, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.status(201).json({
      success: true,
      token,
      user: safeUserPayload(user)
    });
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
      const token = jwt.sign({ id: user._id, role: user.role, hospitalId: user.hospitalId, hospitalName: user.hospitalName }, process.env.JWT_SECRET, { expiresIn: '1d' });
      return res.status(200).json({
        success: true,
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
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