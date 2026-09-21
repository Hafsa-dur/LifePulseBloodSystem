import express from 'express';
import { registerUser, loginUser, registerStaffFromInvitation, validateStaffInvitation } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';
import { sendRewardEmail } from '../services/emailService.js';
import Donation from '../models/donationModel.js';

const router = express.Router();
router.post('/register', registerUser);
router.get('/staff/invitation/:token', validateStaffInvitation);
router.post('/staff/register', registerStaffFromInvitation);
router.post('/rewards/send', requireAuth, async (req, res) => {
	try {
		if (req.user.role !== 'donor') return res.status(403).json({ success: false, message: 'Only donor accounts can redeem rewards.' });
		const { donorEmail, rewardTitle, partner, points, voucherCode } = req.body || {};
		if (!rewardTitle || !voucherCode) return res.status(400).json({ success: false, message: 'Reward details are required.' });
		const recipientEmail = String(req.user.email || donorEmail || '').trim().toLowerCase();
		if (!recipientEmail) return res.status(400).json({ success: false, message: 'Select a donor email before redeeming a reward.' });
		const donor = await Donation.findOne({ email: recipientEmail }).select('donorName email').lean();
		if (!donor) return res.status(404).json({ success: false, message: 'That donor email was not found in the donation records.' });
		const result = await sendRewardEmail({ donorEmail: String(donor.email).trim().toLowerCase(), donorName: donor.donorName || req.user.name, rewardTitle, partner, points, voucherCode });
		if (!result.sent) return res.status(500).json({ success: false, message: 'Voucher email could not be delivered.' });
		return res.json({ success: true, message: 'Voucher sent to your registered email.' });
	} catch (error) {
		return res.status(500).json({ success: false, message: error.message });
	}
});
router.post('/login', loginUser);

export default router;