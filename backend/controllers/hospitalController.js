import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import HospitalSettings from '../models/HospitalSettings.js';
import Donation from '../models/donationModel.js';
import PatientRequest from '../models/PatientRequest.js';

const hospitalFilter = (user) => user.hospitalId
  ? { hospitalId: user.hospitalId }
  : { hospitalName: user.hospitalName || '' };

export const getStaff = async (req, res) => {
  try {
    const staff = await User.find({ ...hospitalFilter(req.user), role: { $in: ['admin', 'staff'] } })
      .select('-password').sort({ createdAt: -1 }).lean();
    return res.json({ success: true, staff });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createStaff = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Only hospital administrators can add staff.' });
    const { name, email, password, phone = '', permissions = [] } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!name || !normalizedEmail || !password) return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    if (await User.exists({ email: normalizedEmail })) return res.status(409).json({ success: false, message: 'Email already registered.' });

    const staff = await User.create({
      name: String(name).trim(), email: normalizedEmail, password: await bcrypt.hash(password, 10), role: 'staff',
      hospitalId: req.user.hospitalId || '', hospitalName: req.user.hospitalName || '', hospitalLocation: req.user.hospitalLocation || '',
      phone: String(phone).trim(), permissions: Array.isArray(permissions) && permissions.length ? permissions : ['dashboard', 'requests', 'dispatch'], isActive: true
    });
    const safeStaff = staff.toObject();
    delete safeStaff.password;
    return res.status(201).json({ success: true, staff: safeStaff });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateStaff = async (req, res) => {
  try {
    const filter = { _id: req.params.id, ...hospitalFilter(req.user), role: 'staff' };
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
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Only hospital administrators can remove staff.' });
    const removed = await User.findOneAndDelete({ _id: req.params.id, ...hospitalFilter(req.user), role: 'staff' });
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
      { ...req.body, hospitalId, hospitalName: req.user.hospitalName || '', hospitalLocation: req.user.hospitalLocation || '', updatedBy: req.user._id },
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
    const allowed = ['name', 'phone', 'profile', 'hospitalName', 'hospitalLocation'];
    const updates = {};
    for (const key of allowed) if (req.body[key] !== undefined) updates[key] = String(req.body[key]).trim();
    if (req.body.password) updates.password = await bcrypt.hash(String(req.body.password), 10);
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-password');
    return res.json({ success: true, user });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
