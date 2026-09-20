import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import HospitalSettings from '../models/HospitalSettings.js';
import Donation from '../models/donationModel.js';
import PatientRequest from '../models/PatientRequest.js';
import Hospital from '../models/Hospital.js';
import StaffInvitation from '../models/StaffInvitation.js';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import crypto from 'crypto';
import { sendStaffInvitationEmail } from '../services/emailService.js';

const hospitalFilter = (user) => user.hospitalId
  ? { hospitalId: user.hospitalId }
  : { hospitalName: user.hospitalName || '' };

const publicUser = (user) => {
  const value = user.toObject ? user.toObject() : { ...user };
  delete value.password;
  if (value.role === 'admin') value.role = 'hospital_admin';
  if (value.role === 'staff') value.role = 'hospital_staff';
  if (value.role === 'hospital_staff') value.staffRole = 'Hospital Staff';
  return value;
};

const normalizeRole = (role) => {
  const value = String(role || '').trim().toLowerCase();
  if (value === 'admin' || value === 'hospital_admin') return 'hospital_admin';
  if (value === 'staff' || value === 'hospital_staff') return 'hospital_staff';
  if (value === 'donor') return 'donor';
  return value || 'donor';
};

export const listHospitals = async (req, res) => {
  try {
    const hospitals = await Hospital.find({ isActive: true }).select('hospitalId name location contactPhone').sort({ name: 1 }).lean();
    return res.json({ success: true, hospitals });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const onboardHospitalAdmin = async (req, res) => {
  try {
    const { name, email, password, hospitalId, hospitalName, hospitalLocation, contactPhone = '' } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!name || !normalizedEmail || !password) return res.status(400).json({ success: false, message: 'Admin name, email, and password are required.' });
    if (await User.exists({ email: normalizedEmail })) return res.status(409).json({ success: false, message: 'Email already registered.' });

    let hospital;
    if (hospitalId) {
      hospital = await Hospital.findOne({ hospitalId, isActive: true });
      if (!hospital) return res.status(404).json({ success: false, message: 'Selected hospital was not found.' });
    } else {
      const cleanName = String(hospitalName || '').trim();
      const cleanLocation = String(hospitalLocation || '').trim();
      if (!cleanName || !cleanLocation) return res.status(400).json({ success: false, message: 'New hospital name and location are required.' });
      const generatedId = `HOSP-${new mongoose.Types.ObjectId().toString().slice(-10).toUpperCase()}`;
      hospital = await Hospital.create({ hospitalId: generatedId, name: cleanName, location: cleanLocation, contactPhone });
    }

    const admin = await User.create({
      name: String(name).trim(), email: normalizedEmail, password: await bcrypt.hash(password, 10), role: 'hospital_admin',
      hospitalId: hospital.hospitalId, hospitalName: hospital.name, hospitalLocation: hospital.location,
      phone: String(req.body.phone || '').trim(), isActive: true,
      permissions: ['dashboard', 'requests', 'dispatch', 'staff', 'settings', 'reports']
    });
    const token = jwt.sign({ id: admin._id, role: admin.role, hospitalId: admin.hospitalId, hospitalName: admin.hospitalName }, process.env.JWT_SECRET, { expiresIn: '1d' });
    return res.status(201).json({ success: true, token, user: publicUser(admin), hospital });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getStaff = async (req, res) => {
  try {
    const staff = await User.find({
      ...hospitalFilter(req.user),
      role: { $in: ['hospital_staff', 'staff'] }
    }).select('-password').sort({ createdAt: -1 }).lean();
    return res.json({ success: true, staff });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createStaff = async (req, res) => {
  try {
    if (normalizeRole(req.user.role) !== 'hospital_admin') return res.status(403).json({ success: false, message: 'Only hospital administrators can add staff.' });
    const { name, email, password, phone = '', permissions = [] } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!name || !normalizedEmail || !password) return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    if (await User.exists({ email: normalizedEmail })) return res.status(409).json({ success: false, message: 'Email already registered.' });

    const staff = await User.create({
      name: String(name).trim(), email: normalizedEmail, password: await bcrypt.hash(password, 10), role: 'hospital_staff',
      staffRole: 'Hospital Staff',
      hospitalId: req.user.hospitalId || '', hospitalName: req.user.hospitalName || '', hospitalLocation: req.user.hospitalLocation || '',
      phone: String(phone).trim(), permissions: Array.isArray(permissions) && permissions.length ? permissions : ['dashboard', 'requests', 'inventory', 'dispatch', 'tracking', 'account'], isActive: true
    });
    const safeStaff = staff.toObject();
    delete safeStaff.password;
    return res.status(201).json({ success: true, staff: safeStaff });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createStaffInvitation = async (req, res) => {
  try {
    if (normalizeRole(req.user.role) !== 'hospital_admin') {
      return res.status(403).json({ success: false, message: 'Only hospital administrators can create staff invitations.' });
    }

    const { email, name = '' } = req.body || {};
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const inviteeName = String(name || '').trim();
    if (!normalizedEmail || !inviteeName) {
      return res.status(400).json({ success: false, message: 'Staff name and invited email are required.' });
    }

    const configuredFrontendUrl = String(process.env.FRONTEND_URL || '').trim().replace(/\/$/, '');
    const frontendUrl = configuredFrontendUrl || (process.env.NODE_ENV === 'production'
      ? 'https://life-pulse-blood-system.vercel.app'
      : 'http://localhost:5173');
    if (process.env.NODE_ENV === 'production' && /localhost|127\.0\.0\.1/i.test(frontendUrl)) {
      return res.status(500).json({ success: false, message: 'Production FRONTEND_URL cannot be localhost. Invitation was not created.' });
    }
    if (!frontendUrl) {
      return res.status(500).json({ success: false, message: 'FRONTEND_URL is required to create a staff invitation.' });
    }

    const token = crypto.randomBytes(24).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const invitation = await StaffInvitation.create({
      tokenHash,
      hospitalId: req.user.hospitalId,
      hospitalName: req.user.hospitalName || '',
      hospitalLocation: req.user.hospitalLocation || '',
      staffRole: 'Hospital Staff',
      inviteeName,
      createdBy: req.user._id,
      email: normalizedEmail,
      expiresAt,
      status: 'pending'
    });

    const inviteLink = `${frontendUrl}/staff-registration?token=${encodeURIComponent(token)}`;
    const emailResult = await sendStaffInvitationEmail({
      recipientEmail: normalizedEmail,
      hospitalName: req.user.hospitalName || 'LifePulse Hospital',
      inviteLink,
      staffRole: 'Hospital Staff'
    });
    if (!emailResult.sent) {
      await StaffInvitation.deleteOne({ _id: invitation._id });
      return res.status(502).json({ success: false, message: `Invitation email could not be sent to ${normalizedEmail}. SMTP error: ${emailResult.error || emailResult.reason || 'unknown error'}.` });
    }

    return res.status(201).json({ success: true, invitation: { _id: invitation._id, expiresAt, inviteLink, email: normalizedEmail }, message: `Invitation sent successfully to ${normalizedEmail}.` });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateStaff = async (req, res) => {
  try {
    const filter = { _id: req.params.id, ...hospitalFilter(req.user), role: { $in: ['hospital_staff', 'staff'] } };
    const updates = {};
    for (const key of ['name', 'phone', 'permissions', 'isActive']) if (req.body[key] !== undefined) updates[key] = req.body[key];
    if (req.body.password) updates.password = await bcrypt.hash(req.body.password, 10);
    const staff = await User.findOneAndUpdate(filter, updates, { new: true }).select('-password');
    if (!staff) return res.status(404).json({ success: false, message: 'Staff member not found.' });
    return res.json({ success: true, staff });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteStaff = async (req, res) => {
  try {
    if (normalizeRole(req.user.role) !== 'hospital_admin') return res.status(403).json({ success: false, message: 'Only hospital administrators can remove staff.' });
    const removed = await User.findOneAndDelete({ _id: req.params.id, ...hospitalFilter(req.user), role: { $in: ['hospital_staff', 'staff'] } });
    if (!removed) return res.status(404).json({ success: false, message: 'Staff member not found.' });
    return res.json({ success: true, message: 'Staff member removed.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getHospitalSettings = async (req, res) => {
  const settings = await HospitalSettings.findOne({ hospitalId: req.user.hospitalId || req.user.hospitalName });
  return res.json({ success: true, settings: settings || {
    hospitalId: req.user.hospitalId || req.user.hospitalName, hospitalName: req.user.hospitalName || '', hospitalLocation: req.user.hospitalLocation || '',
    emergencyAlerts: true, autoDispatch: true, donorNotifications: true
  } });
};

export const updateHospitalSettings = async (req, res) => {
  try {
    const hospitalId = req.user.hospitalId || req.user.hospitalName;
    const settings = await HospitalSettings.findOneAndUpdate(
      { hospitalId },
      { emergencyAlerts: req.body.emergencyAlerts !== false, autoDispatch: req.body.autoDispatch !== false, donorNotifications: req.body.donorNotifications !== false, hospitalId, hospitalName: req.user.hospitalName || '', hospitalLocation: req.user.hospitalLocation || '', updatedBy: req.user._id },
      { new: true, upsert: true, runValidators: true }
    );
    return res.json({ success: true, settings });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getHospitalAnalytics = async (req, res) => {
  try {
    const filter = hospitalFilter(req.user);
    const dateFilter = {};
    if (req.query.from) dateFilter.$gte = new Date(`${req.query.from}T00:00:00.000Z`);
    if (req.query.to) dateFilter.$lte = new Date(`${req.query.to}T23:59:59.999Z`);
    if (Object.keys(dateFilter).length) filter.createdAt = dateFilter;
    const [requests, donations] = await Promise.all([
      PatientRequest.find(filter).lean(),
      Donation.find({ ...filter, units: { $gt: 0 }, status: { $ne: 'Dispatched' } }).lean()
    ]);
    const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
    const bloodBreakdown = bloodGroups.map((group) => ({ group, units: donations.filter((item) => item.bloodGroup === group).reduce((sum, item) => sum + (Number(item.units) || 0), 0) }));
    return res.json({ success: true, metrics: {
      totalRequests: requests.length,
      approvedRequests: requests.filter((item) => ['Approved', 'Dispatched', 'Delivered'].includes(item.status)).length,
      dispatchedUnits: requests.filter((item) => ['Dispatched', 'Delivered'].includes(item.status)).reduce((sum, item) => sum + (Number(item.unitsRequired) || 0), 0),
      totalDonations: donations.reduce((sum, item) => sum + (Number(item.units) || 0), 0)
    }, bloodBreakdown });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateAccount = async (req, res) => {
  try {
    const allowed = ['name', 'phone', 'profile'];
    const updates = {};
    for (const key of allowed) if (req.body[key] !== undefined) updates[key] = String(req.body[key]).trim();
    if (req.body.password) updates.password = await bcrypt.hash(String(req.body.password), 10);
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-password');
    return res.json({ success: true, user });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
