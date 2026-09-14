import Donation from '../models/donationModel.js';
import User from '../models/User.js';
import mongoose from 'mongoose';
import DonorRecipientLog from '../models/DonorRecipientLog.js';

const locationCache = new Map();

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const geocodeLocation = async (location) => {
  const normalizedLocation = String(location || '').trim();
  if (!normalizedLocation) return null;
  if (locationCache.has(normalizedLocation)) return locationCache.get(normalizedLocation);

  const request = fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(normalizedLocation)}`, {
    headers: { 'User-Agent': 'LifePulseBloodSystem/1.0' }
  })
    .then(async (response) => {
      if (!response.ok) return null;
      const results = await response.json();
      if (!results[0]) return null;
      return { latitude: Number(results[0].lat), longitude: Number(results[0].lon) };
    })
    .catch(() => null);

  locationCache.set(normalizedLocation, request);
  return request;
};

const distanceInKilometers = (first, second) => {
  if (!first || !second) return Number.POSITIVE_INFINITY;
  const toRadians = (value) => (value * Math.PI) / 180;
  const latitudeDelta = toRadians(second.latitude - first.latitude);
  const longitudeDelta = toRadians(second.longitude - first.longitude);
  const a = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(toRadians(first.latitude))
    * Math.cos(toRadians(second.latitude))
    * Math.sin(longitudeDelta / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const findMatchingDonors = async ({ bloodGroup, units, location, session, excludeDonorIds = [] }) => {
  const normalizedBloodGroup = String(bloodGroup || '').trim().toUpperCase();
  const requestedUnits = Number(units);
  const savedLocation = String(location || '').trim();
  if (!normalizedBloodGroup || !savedLocation || !Number.isInteger(requestedUnits) || requestedUnits <= 0) {
    return null;
  }

  const donorQuery = Donation.find({
    bloodGroup: new RegExp(`^${escapeRegex(normalizedBloodGroup)}$`, 'i'),
    units: { $gte: requestedUnits },
    status: { $ne: 'Dispatched' },
    donorName: { $exists: true, $nin: ['', null], $not: /^(Direct Donor|System Stock|Inventory|Dispatched to:)/i },
    email: { $exists: true, $nin: ['', null] },
    $or: [
      { location: { $exists: true, $nin: ['', null] } },
      { address: { $exists: true, $nin: ['', null] } }
    ]
  }).sort({ createdAt: 1, _id: 1 });
  if (session) donorQuery.session(session);

  const excluded = new Set(excludeDonorIds.map((id) => String(id)));
  const donors = (await donorQuery).filter((donor) => !excluded.has(String(donor._id)));
  if (donors.length === 0) return [];

  const targetCoordinates = await geocodeLocation(savedLocation);
  const rankedDonors = await Promise.all(donors.map(async (donor) => {
    const donorLocation = String(donor.location || donor.address || '').trim();
    const coordinates = await geocodeLocation(donorLocation);
    const exactLocation = donorLocation.toLowerCase() === savedLocation.toLowerCase();
    return {
      donor,
      distance: exactLocation ? 0 : distanceInKilometers(targetCoordinates, coordinates)
    };
  }));

  rankedDonors.sort((first, second) => first.distance - second.distance
    || new Date(first.donor.createdAt) - new Date(second.donor.createdAt)
    || String(first.donor._id).localeCompare(String(second.donor._id)));
  return rankedDonors;
};

export const findNearestMatchingDonor = async (options) => {
  const rankedDonors = await findMatchingDonors(options);
  return rankedDonors[0]?.donor || null;
};

  
// 1. Fetch All Donations (For Stock Inventory & Directory & Radar)
export const getAllDonations = async (req, res) => {
  try {
    const donations = await Donation.find().sort({ createdAt: -1 });
    
    // Clean and normalize blood groups for seamless radar/search matching
    const sanitizedDonations = donations.map(item => {
      let bg = item.bloodGroup || item.group || '';
      return {
        ...item._doc,
        bloodGroup: bg.trim()
      };
    });

    res.status(200).json(sanitizedDonations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// 2. Fetch Dashboard Donations (Strictly for Dashboard / Registered Donors)
export const getDashboardDonations = async (req, res) => {
  try {
    const filter = {
      $and: [
        { status: { $ne: 'Dispatched' } },
        { units: { $gt: 0 } },
        { donorName: { $not: /^Dispatched to/i } }
      ]
    };
    if (req.query.hospitalId || req.query.hospitalName) {
      filter.$or = [
        req.query.hospitalId ? { hospitalId: req.query.hospitalId } : null,
        req.query.hospitalName ? { hospitalName: new RegExp(`^${escapeRegex(String(req.query.hospitalName))}$`, 'i') } : null
      ].filter(Boolean);
    }
    const donations = await Donation.find(filter).sort({ createdAt: -1 });
    
    res.status(200).json(donations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 3. Add New Donation with Strict Duplicate Email Check
export const addDonation = async (req, res) => {
  try {
    const { donorName, email, bloodGroup, units, phone, address, location, notes, hospitalId, hospitalName, donationDate, lastDonationDate } = req.body;
    const formattedEmail = email ? email.toLowerCase().trim() : '';

    if (!formattedEmail) {
      return res.status(400).json({ message: 'Email address is required for unique tracking!' });
    }

    const existingDonation = await Donation.findOne({ email: formattedEmail }).sort({ createdAt: -1 });

    if (existingDonation) {
        const baseDate = new Date(lastDonationDate || existingDonation.lastDonationDate || existingDonation.donationDate || Date.now());
        baseDate.setDate(baseDate.getDate() + 56); 
        const formattedDate = baseDate.toISOString().split('T')[0];

        return res.status(400).json({
            success: false,
            message: `Donation already recorded. Your next eligible date is ${formattedDate}. Thank you!`
        });
    }

    const newDonation = new Donation({
      donorName,
      email: formattedEmail,
      bloodGroup,
      units: Number(units) || 1,
      phone: phone || '03000000000',
      address: address || location || '',
      location: location || address || '',
      hospitalId: hospitalId || '',
      hospitalName: hospitalName || notes || 'General Donation',
      notes: notes || hospitalName || 'General Donation',
      donationDate: donationDate || Date.now(),
      lastDonationDate: lastDonationDate || donationDate || Date.now(),
    });

    const savedDonation = await newDonation.save();

    await User.findOneAndUpdate(
      { $or: [{ name: new RegExp(`^${donorName}$`, 'i' ) }, { fullName: new RegExp(`^${donorName}$`, 'i') }] },
      { bloodGroup: bloodGroup, lastDonationDate: donationDate || Date.now() },
      { upsert: false }
    );

    res.status(201).json(savedDonation);
  } catch (error) {
    console.error('Error in addDonation:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'This email already exists in the database! Duplicate donations are not allowed.' });
    }
    res.status(500).json({ message: error.message });
  }
};

// 4. Get Specific Donor History by Name
export const getDonorHistory = async (req, res) => {
  try {
    const { donorName } = req.params;
    const history = await Donation.find({ 
      donorName: new RegExp(`^${donorName}$`, 'i') 
    }).sort({ createdAt: -1 });
    
    res.status(200).json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 5. Dispatch Blood Units (Clean & Direct without dummy logs)
export const dispatchBlood = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const { hospitalName, hospitalLocation, bloodGroup, units, donorId, donorName, donorEmail, donorLocation, patientName } = req.body || {};
    const requestedUnits = Number(units);
    const normalizedBloodGroup = String(bloodGroup || '').trim();
    if (!normalizedBloodGroup || !Number.isInteger(requestedUnits) || requestedUnits <= 0) {
      return res.status(400).json({ success: false, message: 'Blood group and a positive whole number of units are required.' });
    }

    let savedDispatch;
    await session.withTransaction(async () => {
      const dispatchFilter = {
        bloodGroup: new RegExp(`^${normalizedBloodGroup.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
        units: { $gt: 0 },
        status: { $ne: 'Dispatched' }
      };
      if (donorId) dispatchFilter._id = donorId;
      const donations = await Donation.find(dispatchFilter).sort({ createdAt: 1, _id: 1 }).session(session);
      const availableUnits = donations.reduce((total, donation) => total + donation.units, 0);
      if (availableUnits < requestedUnits) {
        throw Object.assign(new Error(`Only ${availableUnits} ${normalizedBloodGroup} unit(s) are available.`), { status: 409 });
      }

      let remainingUnits = requestedUnits;
      for (const donation of donations) {
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

      savedDispatch = await new Donation({
        donorName: donorName ? `Dispatched to: ${hospitalName} (${donorName})` : `Dispatched to: ${hospitalName || 'Hospital'}`,
        email: `dispatch-${new mongoose.Types.ObjectId()}@lifepulse.com`,
        bloodGroup: normalizedBloodGroup,
        patientName: patientName || '',
        units: -requestedUnits,
        phone: 'N/A',
        hospitalName: hospitalName || 'General Hospital',
        notes: hospitalName || 'Direct Dispatch',
        status: 'Dispatched',
        donationDate: new Date()
      }).save({ session });

      if (patientName) {
        await DonorRecipientLog.create([{
          donorId: donorId || null,
          donorName: donorId ? (donorName || 'Registered Donor') : 'Inventory',
          donorEmail: donorId ? donorEmail : undefined,
          donorLocation: donorId ? donorLocation || '' : '',
          hospitalLocation: hospitalLocation || '',
          bloodType: normalizedBloodGroup,
          pints: requestedUnits,
          patientName: patientName.trim(),
          hospitalName: (hospitalName || 'General Hospital').trim(),
          recipientName: (hospitalName || 'General Hospital').trim(),
          patientRequestId: null,
          sourceType: donorId ? 'donor' : 'inventory',
          matchStatus: 'Fulfilled',
          dispatchStatus: 'Dispatched',
          matchedAt: new Date(),
          dispatchedAt: new Date(),
          status: 'Dispatched'
        }], { session });
      }
    });

    return res.status(201).json({
      success: true,
      message: `${requestedUnits} unit(s) of ${bloodGroup} dispatched successfully!`,
      data: savedDispatch
    });

  } catch (error) {
    console.error('Error in dispatchBlood:', error);
    return res.status(error.status || 500).json({
      success: false,
      message: 'Failed to dispatch blood units',
      error: error.message
    });
  } finally {
    await session.endSession();
  }
};