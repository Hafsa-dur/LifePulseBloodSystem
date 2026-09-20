import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const normalizeUserRole = (role) => {
  const value = String(role || '').trim().toLowerCase();
  if (value === 'hospital_admin' || value === 'admin') return 'hospital_admin';
  if (value === 'hospital_staff' || value === 'staff') return 'hospital_staff';
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
    if (user.role === 'hospital_staff' && user.staffRole && user.staffRole !== 'Hospital Staff') {
      user.staffRole = 'Hospital Staff';
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired authentication token.' });
  }
};

export const requireHospitalRole = (req, res, next) => {
  if (!req.user || !['hospital_admin', 'hospital_staff'].includes(normalizeUserRole(req.user.role))) {
    return res.status(403).json({ success: false, message: 'Hospital staff access required.' });
  }

  if (normalizeUserRole(req.user.role) === 'hospital_staff' && req.user.staffRole && req.user.staffRole !== 'Hospital Staff') {
    req.user.staffRole = 'Hospital Staff';
  }

  if (!req.user.hospitalId) {
    return res.status(403).json({ success: false, message: 'Hospital association required.' });
  }

  next();
};

export const requireAdmin = (req, res, next) => {
  if (normalizeUserRole(req.user?.role) !== 'hospital_admin') return res.status(403).json({ success: false, message: 'Administrator access required.' });
  if (!req.user?.hospitalId) return res.status(403).json({ success: false, message: 'Hospital association required.' });
  next();
};

export const requirePermission = (permission) => (req, res, next) => {
  const role = normalizeUserRole(req.user?.role);
  const hospitalStaffOperationalPermissions = ['requests', 'dispatch', 'inventory', 'tracking'];
  if (role === 'hospital_admin' || (role === 'hospital_staff' && hospitalStaffOperationalPermissions.includes(permission)) || req.user?.permissions?.includes(permission)) return next();
  return res.status(403).json({ success: false, message: `Permission required: ${permission}.` });
};

export const requireStaffRole = (allowedStaffRoles = []) => (req, res, next) => {
  if (normalizeUserRole(req.user?.role) === 'hospital_admin') return next();
  const safeRoles = Array.isArray(allowedStaffRoles) ? allowedStaffRoles : [allowedStaffRoles].filter(Boolean);
  if (!req.user || normalizeUserRole(req.user.role) !== 'hospital_staff' || (safeRoles.length > 0 && !safeRoles.includes(req.user.staffRole))) {
    return res.status(403).json({ success: false, message: 'This portal is restricted to the allowed staff role.' });
  }
  next();
};
