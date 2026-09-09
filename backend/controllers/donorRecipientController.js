import DonorRecipientLog from '../models/DonorRecipientLog.js';

// Helper Function for Date Format
const formatCleanDate = (dateVal) => {
  if (!dateVal || dateVal === 'N/A') return 'N/A';
  try {
    const date = new Date(dateVal);
    if (isNaN(date.getTime())) return dateVal;
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch (error) {
    return dateVal;
  }
};

// ==========================================
// COMBINED DISPATCH LOGS (Donor Recipient Logic)
// ==========================================
export const getCombinedDispatchLogs = async (req, res) => {
  try {
    const userEmailQuery = req.query.email?.trim().toLowerCase();
    const userNameQuery = req.query.donorName?.trim();
    const filter = {};
    if (userEmailQuery) filter.donorEmail = userEmailQuery;
    if (userNameQuery) filter.donorName = new RegExp(`^${userNameQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');

    const logs = await DonorRecipientLog.find(filter).sort({ createdAt: -1 }).lean();
    return res.status(200).json(logs.map((log) => ({
      ...log,
      lastDonationDate: formatCleanDate(log.lastDonationDate || log.createdAt),
      receivedBloodType: log.bloodType,
      receivedUnits: log.pints,
      recipientName: log.hospitalName,
    sourceType: log.sourceType || (log.donorName === 'Inventory' ? 'inventory' : 'donor'),
    matchStatus: log.matchStatus || 'Matched',
    dispatchStatus: log.dispatchStatus || (log.status === 'Dispatched' ? 'Dispatched' : 'Pending'),
    donorId: log.donorId || null,
    patientRequestId: log.patientRequestId || null,
    status: log.status || 'Matched'
    })));
  } catch (error) {
    console.error('Error in getCombinedDispatchLogs:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getDonorRecipientHistory = async (req, res) => {
  try {
    const { donorName } = req.params;
    const email = req.query.email?.trim().toLowerCase();
    const records = await DonorRecipientLog.find({
      ...(email ? { donorEmail: email } : { donorName: new RegExp(`^${donorName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') })
    }).sort({ createdAt: -1 });
    return res.status(200).json(records);
  } catch (error) {
    console.error('Error fetching donor history:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
