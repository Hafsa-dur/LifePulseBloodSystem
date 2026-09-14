import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

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
    // Public registration can only create donor accounts. Hospital admins are
    // created through the hospital onboarding endpoint after hospital binding.
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
      permissions: safeRole === 'admin'
        ? ['dashboard', 'requests', 'dispatch', 'staff', 'settings']
        : safeRole === 'staff'
          ? ['dashboard', 'requests', 'dispatch']
          : ['profile', 'history']
    });

    const token = jwt.sign({ id: user._id, role: user.role, hospitalId: user.hospitalId, hospitalName: user.hospitalName }, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.status(201).json({
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
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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