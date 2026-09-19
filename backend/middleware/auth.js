import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const VALID_STAFF_ROLES = new Set(['Emergency Staff', 'Blood Bank Staff', 'Hospital Staff']);

export const normalizeUserRole = (role) => {
  const value = String(role || '').trim().toLowerCase();
  if (value === 'hospital_admin' || value === 'admin') return 'admin';
  if (value === 'hospital_staff' || value === 'staff') return 'staff';
  if (value === 'donor') return 'donor';
  return value || 'donor';
};

export const requireAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    if (!token) return res.status(401).json({ success: false, message: 'Authentication required.' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user || user.isActive === false) {
      return res.status(401).json({ success: false, message: 'Account is inactive or unavailable.' });
    }

    user.role = normalizeUserRole(user.role);
    if (user.role === 'staff' && user.staffRole && !VALID_STAFF_ROLES.has(user.staffRole)) {
      return res.status(403).json({ success: false, message: 'Only Hospital Staff, Emergency Staff, and Blood Bank Staff accounts are allowed.' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired authentication token.' });
  }
};

export const requireHospitalRole = (req, res, next) => {
  if (!req.user || !['admin', 'staff'].includes(normalizeUserRole(req.user.role))) {
    return res.status(403).json({ success: false, message: 'Hospital staff access required.' });
  }

  if (normalizeUserRole(req.user.role) === 'staff' && (!req.user.staffRole || !VALID_STAFF_ROLES.has(req.user.staffRole))) {
    return res.status(403).json({ success: false, message: 'Invalid staff role for hospital access.' });
  }

  if (!req.user.hospitalId) {
    return res.status(403).json({ success: false, message: 'Hospital association required.' });
  }

  next();
};

export const requireAdmin = (req, res, next) => {
  if (normalizeUserRole(req.user?.role) !== 'admin') return res.status(403).json({ success: false, message: 'Administrator access required.' });
  if (!req.user?.hospitalId) return res.status(403).json({ success: false, message: 'Hospital association required.' });
  next();
};

export const requirePermission = (permission) => (req, res, next) => {
  if (normalizeUserRole(req.user?.role) === 'admin' || req.user?.permissions?.includes(permission)) return next();
  return res.status(403).json({ success: false, message: `Permission required: ${permission}.` });
};

export const requireStaffRole = (allowedStaffRoles = []) => (req, res, next) => {
  if (normalizeUserRole(req.user?.role) === 'admin') return next();
  const safeRoles = Array.isArray(allowedStaffRoles) ? allowedStaffRoles : [allowedStaffRoles].filter(Boolean);
  if (!req.user || normalizeUserRole(req.user.role) !== 'staff' || !safeRoles.includes(req.user.staffRole)) {
    return res.status(403).json({ success: false, message: 'This portal is restricted to the allowed staff role.' });
  }
  next();
};
