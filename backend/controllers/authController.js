import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import StaffInvitation from '../models/StaffInvitation.js';
import crypto from 'crypto';

const normalizeRole = (role) => {
  const value = String(role || '').trim().toLowerCase();
  if (value === 'hospital_admin' || value === 'admin') return 'admin';
  if (value === 'hospital_staff' || value === 'staff') return 'staff';
  return value || 'donor';
};

const safeUserPayload = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  staffRole: user.staffRole,
  hospitalId: user.hospitalId,
  hospitalName: user.hospitalName,
  hospitalLocation: user.hospitalLocation,
  phone: user.phone,
  profile: user.profile,
  isActive: user.isActive,
  permissions: user.permissions
});

const invitationHash = (token) => crypto.createHash('sha256').update(String(token || '').trim()).digest('hex');

export const validateStaffInvitation = async (req, res) => {
  try {
    const token = String(req.params.token || '').trim();
    if (!token) return res.status(400).json({ success: false, valid: false, message: 'Invitation token is required.' });

    const invitation = await StaffInvitation.findOne({ tokenHash: invitationHash(token) }).lean();
    if (!invitation) return res.status(404).json({ success: false, valid: false, message: 'This invitation link is invalid.' });
    if (invitation.status === 'used' || invitation.usedAt) return res.status(410).json({ success: false, valid: false, message: 'This invitation has already been used.' });
    if (invitation.expiresAt <= new Date()) {
      await StaffInvitation.updateOne({ _id: invitation._id, status: 'pending' }, { status: 'expired' });
      return res.status(410).json({ success: false, valid: false, message: 'This invitation has expired.' });
    }

    return res.json({ success: true, valid: true, invitation: { email: invitation.email, hospitalName: invitation.hospitalName, expiresAt: invitation.expiresAt } });
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
    if (!token || !name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Invitation token, name, email, and password are required.' });
    }

    const normalizedEmail = String(email || '').trim().toLowerCase();
    const tokenHash = invitationHash(token);
    const invitation = await StaffInvitation.findOne({ tokenHash, status: 'pending', expiresAt: { $gt: new Date() } }).lean();
    const matchingInvitation = invitation || null;
    if (!matchingInvitation) {
      return res.status(400).json({ success: false, message: 'Invalid, expired, or already used staff invitation token.' });
    }

    if (matchingInvitation.email && matchingInvitation.email !== normalizedEmail) {
      return res.status(403).json({ success: false, message: 'This invitation is only valid for the invited email address.' });
    }

    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(String(password), 10);
    const claimedInvitation = await StaffInvitation.findOneAndUpdate(
      { _id: matchingInvitation._id, status: 'pending', expiresAt: { $gt: new Date() } },
      { status: 'used', usedAt: new Date() },
      { new: true }
    ).lean();
    if (!claimedInvitation) {
      return res.status(409).json({ success: false, message: 'This invitation has already been used or expired.' });
    }

    let user;
    try {
      user = await User.create({
        name: String(name).trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role: 'hospital_staff',
        staffRole: matchingInvitation.staffRole || 'Hospital Staff',
        hospitalId: matchingInvitation.hospitalId,
        hospitalName: matchingInvitation.hospitalName,
        hospitalLocation: matchingInvitation.hospitalLocation,
        phone: String(phone).trim(),
        permissions: ['dashboard', 'requests', 'dispatch', 'tracking', 'account'],
        isActive: true
      });
    } catch (error) {
      await StaffInvitation.updateOne({ _id: matchingInvitation._id, status: 'used' }, { status: 'pending', usedAt: null });
      throw error;
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
          role: user.role,
          staffRole: user.staffRole,
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