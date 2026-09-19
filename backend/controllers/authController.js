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
    const tokenHash = crypto.createHash('sha256').update(String(token).trim()).digest('hex');
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
    const user = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: 'hospital_staff',
      staffRole: 'Hospital Staff',
      hospitalId: matchingInvitation.hospitalId,
      hospitalName: matchingInvitation.hospitalName,
      hospitalLocation: matchingInvitation.hospitalLocation,
      phone: String(phone).trim(),
      permissions: ['dashboard', 'requests', 'dispatch', 'tracking', 'account'],
      isActive: true
    });

    const safeUser = safeUserPayload(user);
    safeUser.role = normalizeRole(safeUser.role);

    await StaffInvitation.updateOne({ _id: matchingInvitation._id }, { status: 'used', usedAt: new Date() });

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