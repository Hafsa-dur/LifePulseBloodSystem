import PatientRequest from '../models/PatientRequest.js';
import Donation from '../models/donationModel.js';
import DonorRecipientLog from '../models/DonorRecipientLog.js';
import mongoose from 'mongoose';

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const realDonorFilter = {
    units: { $gt: 0 },
    status: { $ne: 'Dispatched' },
    donorName: { $exists: true, $nin: ['', null], $not: /^(Direct Donor|System Stock|Inventory|Dispatched to:)/i },
    email: { $exists: true, $nin: ['', null] }
};
const stockFilter = {
    units: { $gt: 0 },
    status: { $ne: 'Dispatched' }
};

// Create a new patient request
export const createPatientRequest = async (req, res) => {
    try {
        const newRequest = new PatientRequest(req.body);
        const savedRequest = await newRequest.save();
        res.status(201).json({ success: true, message: 'Request submitted successfully', data: savedRequest });
    } catch (err) {
        console.error("Error saving patient request:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// Get all patient requests
export const getPatientRequests = async (req, res) => {
    try {
        const requests = await PatientRequest.find().sort({ createdAt: -1 });
        res.status(200).json(requests);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Approve Request (Direct Real Stock & Inventory Sync)
export const approveRequest = async (req, res) => {
    const session = await mongoose.startSession();
    try {
        const { id } = req.params;
        let approvedRequest;
        let matchLog;
        await session.withTransaction(async () => {
            const request = await PatientRequest.findById(id).session(session);
            if (!request) throw Object.assign(new Error('Patient request not found'), { status: 404 });
            if (request.status !== 'Pending') throw Object.assign(new Error('Request already processed'), { status: 400 });

            const bloodGroup = String(request.bloodGroup || '').trim().toUpperCase();
            const requiredUnits = Number(request.unitsRequired);
            if (!bloodGroup) throw Object.assign(new Error('Blood group is required'), { status: 400 });
            if (!Number.isInteger(requiredUnits) || requiredUnits <= 0) {
                throw Object.assign(new Error('Requested units must be a positive whole number'), { status: 400 });
            }

            const groupFilter = { bloodGroup: new RegExp(`^${escapeRegex(bloodGroup)}$`, 'i') };
            const allStock = await Donation.find({ ...groupFilter, ...stockFilter })
                .sort({ createdAt: 1, _id: 1 }).session(session);
            const availableUnits = allStock.reduce((total, donation) => total + donation.units, 0);
            if (availableUnits <= 0) {
                request.status = 'Rejected';
                await request.save({ session });
                approvedRequest = request;
                return;
            }

            const assignedDonorIds = await DonorRecipientLog.distinct('donorId', {
                sourceType: 'donor', donorId: { $ne: null }
            }).session(session);
            const donor = allStock
                .filter((item) => item.donorName && item.email && !/^(Direct Donor|System Stock|Inventory|Dispatched to:)/i.test(item.donorName))
                .find((item) => item.units >= requiredUnits && !assignedDonorIds.some((assignedId) => String(assignedId) === String(item._id)));
            const sourceType = donor ? 'donor' : 'inventory';
            const donorName = donor ? donor.donorName.trim() : 'Inventory';
            const donorEmail = donor ? donor.email : undefined;

            [matchLog] = await DonorRecipientLog.create([{
                donorId: donor?._id || null,
                donorName,
                donorEmail,
                sourceDonationId: donor?._id,
                patientRequestId: request._id,
                lastDonationDate: donor?.donationDate || new Date(),
                bloodType: bloodGroup,
                pints: requiredUnits,
                patientName: request.patientName.trim(),
                hospitalName: request.hospitalName.trim(),
                recipientName: request.hospitalName.trim(),
                sourceType,
                matchStatus: 'Matched',
                dispatchStatus: 'Pending',
                status: 'Matched',
                matchedAt: new Date()
            }], { session });

            request.status = 'Approved';
            request.isAllocated = true;
            request.donorId = donor?._id || null;
            request.donorName = donorName;
            request.donorEmail = donorEmail;
            request.sourceType = sourceType;
            request.matchStatus = 'Matched';
            request.allocationLogIds = [matchLog._id];
            await request.save({ session });
            approvedRequest = request;
        });

        if (approvedRequest.status === 'Rejected') {
            return res.status(200).json({ success: false, autoRejected: true, message: 'No matching blood inventory is available.', request: approvedRequest });
        }
        return res.status(200).json({ success: true, message: `Request matched to ${matchLog.sourceType}.`, request: approvedRequest, match: matchLog });
    } catch (err) {
        console.error("Error approving request:", err);
        return res.status(err.status || 500).json({ success: false, message: err.message });
    } finally {
        await session.endSession();
    }
};

// Dispatch Request (For Live Tracking)
export const dispatchRequest = async (req, res) => {
    const session = await mongoose.startSession();
    try {
        const { id } = req.params;
        let dispatchedRequest;
        let allocationLogs = [];
        await session.withTransaction(async () => {
            const request = await PatientRequest.findById(id).session(session);
            if (!request) throw Object.assign(new Error('Patient request not found'), { status: 404 });
            if (request.status !== 'Approved') throw Object.assign(new Error('Only approved requests can be dispatched'), { status: 400 });

            const bloodGroup = String(request.bloodGroup || '').trim().toUpperCase();
            const requiredUnits = Number(request.unitsRequired);
            const matchLog = await DonorRecipientLog.findOne({ patientRequestId: request._id }).session(session);
            if (!matchLog) throw Object.assign(new Error('No permanent donor/inventory match exists for this request'), { status: 409 });
            const dispatchFilter = {
                bloodGroup: new RegExp(`^${escapeRegex(bloodGroup)}$`, 'i'),
                ...stockFilter
            };
            if (matchLog.sourceType === 'donor' && matchLog.donorId) {
                dispatchFilter._id = matchLog.donorId;
            } else if (matchLog.matchedAt) {
                // Inventory assignments are reserved to stock that existed when
                // the match was made; later donors cannot replace that patient.
                dispatchFilter.createdAt = { $lte: matchLog.matchedAt };
            }
            const donations = await Donation.find(dispatchFilter).sort({ createdAt: 1, _id: 1 }).session(session);
            const availableUnits = donations.reduce((total, donation) => total + donation.units, 0);
            if (availableUnits < requiredUnits) {
                throw Object.assign(new Error(`Only ${availableUnits} ${bloodGroup} unit(s) remain; ${requiredUnits} required`), { status: 409 });
            }

            let remainingUnits = requiredUnits;
            const orderedDonations = donations;
            for (const donation of orderedDonations) {
                if (!remainingUnits) break;
                const allocatedUnits = Math.min(donation.units, remainingUnits);
                const updated = await Donation.updateOne(
                    { _id: donation._id, units: { $gte: allocatedUnits } },
                    { $inc: { units: -allocatedUnits } },
                    { session }
                );
                if (updated.modifiedCount !== 1) throw Object.assign(new Error('Inventory changed; please retry dispatch'), { status: 409 });
                remainingUnits -= allocatedUnits;
            }

            await new Donation({
                donorName: `Dispatched to: ${request.patientName} (${request.hospitalName})`,
                email: `dispatch-${new mongoose.Types.ObjectId()}@lifepulse.com`,
                bloodGroup, units: -requiredUnits, hospitalName: request.hospitalName,
                notes: request.hospitalName, status: 'Dispatched', donationDate: new Date()
            }).save({ session });
            request.status = 'Dispatched';
            request.matchStatus = 'Fulfilled';
            const dispatchDetails = req.body || {};
            request.currentLocationNote = dispatchDetails.currentLocationNote || 'Dispatched securely from blood bank.';
            if (dispatchDetails.areaOrLocation) request.areaOrLocation = dispatchDetails.areaOrLocation;
            if (dispatchDetails.city) request.city = dispatchDetails.city;
            await request.save({ session });
            matchLog.pints = requiredUnits;
            matchLog.matchStatus = 'Fulfilled';
            matchLog.dispatchStatus = 'Dispatched';
            matchLog.dispatchedAt = new Date();
            matchLog.status = 'Dispatched';
            await matchLog.save({ session });
            allocationLogs = [matchLog];
            dispatchedRequest = request;
        });
        return res.status(200).json({ success: true, message: 'Blood request dispatched and inventory updated.', request: dispatchedRequest, allocations: allocationLogs });
    } catch (err) {
        console.error("Error in dispatching request:", err);
        return res.status(err.status || 500).json({ success: false, message: err.message });
    } finally {
        await session.endSession();
    }
};

// Reject Request
export const rejectRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const request = await PatientRequest.findByIdAndUpdate(
            id,
            { status: 'Rejected' },
            { new: true }
        );

        return res.status(200).json({
            success: true,
            message: 'Request rejected',
            request
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};