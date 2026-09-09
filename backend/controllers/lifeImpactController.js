import DonorRecipientLog from '../models/DonorRecipientLog.js';
import Donation from '../models/donationModel.js';

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

export const getLifeImpactBoard = async (req, res) => {
  try {
    const userEmailQuery = req.query.email ? req.query.email.trim().toLowerCase() : '';
    const userNameQuery = req.query.donorName ? req.query.donorName.trim() : '';

    if (!userEmailQuery && !userNameQuery) {
      return res.status(200).json({
        success: true,
        stats: { totalDonations: 0, totalUnits: 0, livesImpactedApprox: 0 },
        donations: [],
        impactLogs: []
      });
    }

    const logFilter = userEmailQuery
      ? { donorEmail: userEmailQuery }
      : { donorName: new RegExp(`^${userNameQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') };
    const donationFilter = userEmailQuery
      ? { email: userEmailQuery }
      : { donorName: new RegExp(`^${userNameQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') };

    // Allocation logs are authoritative. Do not infer or rewrite historical
    // donor/patient relationships while serving this read-only endpoint.
    const [donationLogs, donationsList] = await Promise.all([
      DonorRecipientLog.find(logFilter).sort({ createdAt: -1 }).lean(),
      Donation.find(donationFilter).sort({ createdAt: -1 }).lean()
    ]);

    const finalRows = donationLogs.map((log) => ({
      _id: log._id,
      sourceDonationId: log.sourceDonationId || log.donorId || null,
      patientRequestId: log.patientRequestId || null,
      donorName: log.donorName,
      donorEmail: log.donorEmail || '',
      lastDonationDate: formatCleanDate(log.lastDonationDate || log.createdAt),
      bloodType: log.bloodType || 'N/A',
      pints: log.pints || 0,
      recipientName: log.hospitalName || '',
      hospitalName: log.hospitalName || '',
      patientName: log.patientName || '',
      receivedBloodType: log.bloodType || '',
      receivedUnits: log.pints || 0,
      sourceType: log.sourceType || 'donor',
      status: log.status || log.matchStatus || 'Matched'
    }));

    const totalDonationsCount = donationsList.length;
    const totalUnitsDonated = donationsList.reduce((acc, curr) => acc + (Number(curr.units) || 0), 0);
    const helpedPatientsCount = finalRows.filter(r => r.patientName && r.patientName !== 'Pending Match').length;

    return res.status(200).json({
      success: true,
      stats: {
        totalDonations: totalDonationsCount > 0 ? totalDonationsCount : finalRows.length,
        totalUnits: totalUnitsDonated,
        livesImpactedApprox: helpedPatientsCount > 0 ? helpedPatientsCount * 3 : 0
      },
      donations: donationsList,
      impactLogs: finalRows
    });

  } catch (error) {
    console.error('Error in getLifeImpactBoard:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching life impact board.',
      error: error.message
    });
  }
};