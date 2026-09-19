import express from 'express';
import { registerUser, loginUser, registerStaffFromInvitation } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';
import { sendRewardEmail } from '../services/emailService.js';

const router = express.Router();
router.post('/register', registerUser);
router.post('/staff/register', registerStaffFromInvitation);
router.post('/rewards/send', requireAuth, async (req, res) => {
	try {
		if (req.user.role !== 'donor') return res.status(403).json({ success: false, message: 'Only donor accounts can redeem rewards.' });
		const { rewardTitle, partner, points, voucherCode } = req.body || {};
		if (!rewardTitle || !voucherCode) return res.status(400).json({ success: false, message: 'Reward details are required.' });
		const result = await sendRewardEmail({ donorEmail: req.user.email, donorName: req.user.name, rewardTitle, partner, points, voucherCode });
		if (!result.sent) return res.status(500).json({ success: false, message: 'Voucher email could not be delivered.' });
		return res.json({ success: true, message: 'Voucher sent to your registered email.' });
	} catch (error) {
		return res.status(500).json({ success: false, message: error.message });
	}
});
router.post('/login', loginUser);

export default router;