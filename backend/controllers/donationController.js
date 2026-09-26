import Donation from '../models/donationModel.js';
import User from '../models/User.js';
import mongoose from 'mongoose';
import DonorRecipientLog from '../models/DonorRecipientLog.js';
import { sendDonorThankYouEmail } from '../services/emailService.js';

const locationCache = new Map();
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const availableStockFilter = {
  $or: [
    { availableUnits: { $gt: 0 } },
    { availableUnits: { $exists: false }, units: { $gt: 0 } }
  ],
  status: { $ne: 'Dispatched' }
};

const finiteCoordinate = (value, minimum, maximum) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) && numericValue >= minimum && numericValue <= maximum ? numericValue : null;
};

export const getStoredCoordinates = (record) => {
  const latitude = finiteCoordinate(record?.latitude ?? record?.location?.latitude, -90, 90);
  const longitude = finiteCoordinate(record?.longitude ?? record?.location?.longitude, -180, 180);
  if (latitude !== null && longitude !== null) return { latitude, longitude, source: 'stored' };

  const geoJsonCoordinates = record?.coordinates || record?.geo?.coordinates || record?.location?.coordinates;
  if (Array.isArray(geoJsonCoordinates) && geoJsonCoordinates.length >= 2) {
    const geoLongitude = finiteCoordinate(geoJsonCoordinates[0], -180, 180);
    const geoLatitude = finiteCoordinate(geoJsonCoordinates[1], -90, 90);
    if (geoLatitude !== null && geoLongitude !== null) return { latitude: geoLatitude, longitude: geoLongitude, source: 'stored-geojson' };
  }

  return null;
};

export const geocodeLocation = async (location) => {
  const normalizedLocation = String(location || '').trim();
  if (!normalizedLocation) return null;
  if (locationCache.has(normalizedLocation)) return locationCache.get(normalizedLocation);

  const placeSearchLocations = [normalizedLocation];
  const requestedNumbers = [...normalizedLocation.matchAll(/\d+/g)].map((match) => match[0]);
  const request = (async () => {
    for (const searchLocation of placeSearchLocations) {
      try {
        const photonUrl = new URL('https://photon.komoot.io/api/');
        photonUrl.searchParams.set('q', searchLocation);
        photonUrl.searchParams.set('limit', '10');
        const response = await fetch(photonUrl, { headers: { 'User-Agent': 'LifePulseBloodSystem/1.0' } });
        if (!response.ok) continue;
        const result = await response.json();
        const requestedPlace = searchLocation.split(',')[0].trim().toLowerCase();
        const placeTypes = new Set(['city', 'town', 'village', 'hamlet', 'suburb', 'district', 'locality', 'municipality', 'country', 'state', 'administrative']);
        const feature = result.features?.find((item) => {
          const properties = item.properties || {};
          const coordinates = item.geometry?.coordinates;
          const candidateNames = [properties.name, properties.city, properties.state, properties.country]
            .map((value) => String(value || '').trim().toLowerCase());
          return Array.isArray(coordinates) && coordinates.length === 2
            && finiteCoordinate(coordinates[1], -90, 90) !== null
            && finiteCoordinate(coordinates[0], -180, 180) !== null
            && placeTypes.has(String(properties.type || '').toLowerCase())
            && candidateNames.includes(requestedPlace);
        });
        if (feature?.geometry?.coordinates?.length === 2) {
          return { latitude: Number(feature.geometry.coordinates[1]), longitude: Number(feature.geometry.coordinates[0]), precision: 'place' };
        }
      } catch {
        // Continue with the next real provider.
      }
    }

    for (const searchLocation of placeSearchLocations) {
      try {
        const nominatimUrl = new URL('https://nominatim.openstreetmap.org/search');
        nominatimUrl.searchParams.set('format', 'jsonv2');
        nominatimUrl.searchParams.set('limit', '5');
        nominatimUrl.searchParams.set('q', searchLocation);
        const response = await fetch(nominatimUrl, { headers: { 'User-Agent': 'LifePulseBloodSystem/1.0' } });
        if (!response.ok) continue;
        const results = await response.json();
        const placeResult = results.find((result) => {
          const resultText = `${result.name || ''} ${result.display_name || ''}`;
          return finiteCoordinate(result.lat, -90, 90) !== null
            && finiteCoordinate(result.lon, -180, 180) !== null
            && requestedNumbers.every((number) => new RegExp(`(?:^|\\D)${number}(?:\\D|$)`).test(resultText));
        });
        if (placeResult) return { latitude: Number(placeResult.lat), longitude: Number(placeResult.lon), precision: 'place' };
      } catch {
        // Try the next real location variant.
      }
    }
    return null;
  })();

  locationCache.set(normalizedLocation, request);
  return request;
};

export const distanceInKilometers = (first, second) => {
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

export const findMatchingDonors = async ({ bloodGroup, units, location, hospitalId, hospitalName, session, excludeDonorIds = [], diagnostics }) => {
  const normalizedBloodGroup = String(bloodGroup || '').trim().toUpperCase();
  const requestedUnits = Number(units);
  const savedLocation = String(location || '').trim();
  if (!normalizedBloodGroup || !savedLocation || !Number.isInteger(requestedUnits) || requestedUnits <= 0) {
    return null;
  }

  const requestCoordinates = await geocodeLocation(savedLocation);
  if (!requestCoordinates) {
    diagnostics?.push({ reason: 'hospital-location-unresolved', hospitalLocation: savedLocation });
    return [];
  }

  const donorFilter = {
    bloodGroup: new RegExp(`^${escapeRegex(normalizedBloodGroup)}$`, 'i'),
    status: { $ne: 'Dispatched' },
    donorName: { $exists: true, $nin: ['', null], $not: /^(Direct Donor|System Stock|Inventory|Dispatched to:)/i },
    email: { $exists: true, $nin: ['', null] }
  };
  if (hospitalId) {
    donorFilter.hospitalId = hospitalId;
  } else if (hospitalName) {
    donorFilter.hospitalName = new RegExp(`^${escapeRegex(String(hospitalName))}$`, 'i');
  }

  const donorQuery = Donation.find(donorFilter).sort({ createdAt: 1, _id: 1 });
  if (session) donorQuery.session(session);

  const excluded = new Set(excludeDonorIds.map((id) => String(id)));
  const donors = (await donorQuery).filter((donor) => !excluded.has(String(donor._id)));
  if (donors.length === 0) return [];

  const targetCoordinates = requestCoordinates;

  const rankedDonors = await Promise.all(donors.map(async (donor) => {
    const availableUnits = donor.availableUnits === undefined ? Number(donor.units || 0) : Number(donor.availableUnits || 0);
    const donorLocation = String(donor.location || donor.address || '').trim();
    const storedCoordinates = getStoredCoordinates(donor);
    const coordinates = donorLocation ? await geocodeLocation(donorLocation) : null;
    if (coordinates && (!storedCoordinates || storedCoordinates.latitude !== coordinates.latitude || storedCoordinates.longitude !== coordinates.longitude)) {
      donor.latitude = coordinates.latitude;
      donor.longitude = coordinates.longitude;
      await donor.save(session ? { session } : undefined);
    }
    const donorDiagnostic = {
      donorId: String(donor._id),
      donorName: donor.donorName,
      donorBloodGroup: String(donor.bloodGroup || '').trim().toUpperCase(),
      requestedBloodGroup: normalizedBloodGroup,
      units: availableUnits,
      requestedUnits,
      donorLocation,
      donorCoordinates: coordinates ? { latitude: coordinates.latitude, longitude: coordinates.longitude } : null,
      hospitalCoordinates: { latitude: targetCoordinates.latitude, longitude: targetCoordinates.longitude },
      nextEligibleDate: donor.nextEligibleDate || null,
      status: donor.status,
      available: availableUnits >= requestedUnits && donor.status !== 'Dispatched',
      eligible: !donor.nextEligibleDate || new Date(donor.nextEligibleDate) <= new Date()
    };
    const distance = coordinates ? distanceInKilometers(targetCoordinates, coordinates) : Number.POSITIVE_INFINITY;
    donorDiagnostic.distanceKm = Number.isFinite(distance) ? Number(distance.toFixed(2)) : null;

    if (!coordinates) donorDiagnostic.rejectionReason = 'donor-location-unresolved';
    else if (!donorDiagnostic.available) donorDiagnostic.rejectionReason = 'insufficient-available-units-or-dispatched';
    else if (!donorDiagnostic.eligible) donorDiagnostic.rejectionReason = 'donation-not-yet-eligible';
    else diagnostics?.push({ ...donorDiagnostic, rejectionReason: null });
    if (diagnostics && donorDiagnostic.rejectionReason) diagnostics.push(donorDiagnostic);
    if (donorDiagnostic.rejectionReason) return null;

    return { donor, distance };
  })).then((matches) => matches.filter(Boolean));

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
    const filter = req.user?.hospitalId
      ? { hospitalId: req.user.hospitalId }
      : req.user?.hospitalName
        ? { hospitalName: new RegExp(`^${escapeRegex(req.user.hospitalName)}$`, 'i') }
        : req.user?.role === 'donor'
          ? { email: { $in: [req.user.email, ...(req.user.previousEmails || [])] } }
          : {};
    const donations = await Donation.find(filter).sort({ createdAt: -1 });
    
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
        availableStockFilter,
        { donorName: { $not: /^Dispatched to/i } }
      ]
    };
    if (req.user?.hospitalId) filter.$and.push({ $or: [{ hospitalId: req.user.hospitalId }, { hospitalName: new RegExp(`^${escapeRegex(req.user.hospitalName || '')}$`, 'i') }] });
    else if (req.user?.hospitalName) filter.$and.push({ hospitalName: new RegExp(`^${escapeRegex(req.user.hospitalName)}$`, 'i') });
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

    const resolvedCoordinates = await geocodeLocation(location || address);

    const newDonation = new Donation({
      donorName,
      email: formattedEmail,
      bloodGroup,
      units: Number(units) || 1,
      totalUnits: Number(units) || 1,
      availableUnits: Number(units) || 1,
      dispatchedUnits: 0,
      phone: phone || '03000000000',
      address: address || location || '',
      location: location || address || '',
      latitude: resolvedCoordinates?.latitude,
      longitude: resolvedCoordinates?.longitude,
      hospitalId: hospitalId || '',
      hospitalName: hospitalName || notes || 'General Donation',
      notes: notes || hospitalName || 'General Donation',
      donationDate: donationDate || Date.now(),
      lastDonationDate: lastDonationDate || donationDate || Date.now(),
      nextEligibleDate: req.body.nextEligibleDate || undefined,
    });

    const savedDonation = await newDonation.save();

    await User.findOneAndUpdate(
      { $or: [{ name: new RegExp(`^${donorName}$`, 'i' ) }, { fullName: new RegExp(`^${donorName}$`, 'i') }] },
      { bloodGroup: bloodGroup, lastDonationDate: donationDate || Date.now() },
      { upsert: false }
    );

    if (formattedEmail) {
      sendDonorThankYouEmail({
        donorEmail: formattedEmail,
        donorName: donorName || 'Donor',
        bloodGroup: bloodGroup || 'Unknown',
        units: Number(units) || 1
      }).catch((error) => console.error('Thank-you email failed:', error.message));
    }

    res.status(201).json(savedDonation);
  } catch (error) {
    console.error('Error in addDonation:', error);
    if (error.code === 11000) return res.status(400).json({ message: 'This email already exists in the database! Duplicate donations are not allowed.' });
    return res.status(500).json({ message: error.message });
  }
};

export const updateDonation = async (req, res) => {
  try {
    const scope = req.user.hospitalId
      ? { hospitalId: req.user.hospitalId }
      : { hospitalName: req.user.hospitalName };
    const donation = await Donation.findOne({ _id: req.params.id, ...scope, status: { $ne: 'Dispatched' } });
    if (!donation) return res.status(404).json({ success: false, message: 'Editable donation record not found.' });

    const updates = {};
    for (const key of ['donorName', 'bloodGroup', 'phone', 'address', 'location', 'notes']) {
      if (req.body[key] !== undefined) updates[key] = String(req.body[key]).trim();
    }
    if (req.body.location !== undefined || req.body.address !== undefined) {
      const updatedLocation = req.body.location !== undefined
        ? updates.location
        : req.body.address !== undefined
          ? updates.address
          : donation.location || donation.address;
      const resolvedCoordinates = await geocodeLocation(updatedLocation);
      updates.latitude = resolvedCoordinates?.latitude ?? null;
      updates.longitude = resolvedCoordinates?.longitude ?? null;
    }
    if (req.body.units !== undefined) {
      const units = Number(req.body.units);
      if (!Number.isInteger(units) || units <= 0) return res.status(400).json({ success: false, message: 'Units must be a positive whole number.' });
      const dispatchedUnits = Number(donation.dispatchedUnits || 0);
      updates.units = units;
      updates.availableUnits = units;
      updates.totalUnits = units + dispatchedUnits;
    }

    const updated = await Donation.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }).select('-__v');
    return res.json({ success: true, donation: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
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
        ...availableStockFilter,
        ...(req.user?.hospitalId
          ? { hospitalId: req.user.hospitalId }
          : { hospitalName: new RegExp(`^${escapeRegex(String(req.user?.hospitalName || ''))}$`, 'i') })
      };
      if (donorId) dispatchFilter._id = donorId;
      const donations = await Donation.find(dispatchFilter).sort({ createdAt: 1, _id: 1 }).session(session);
      const availableUnits = donations.reduce((total, donation) => total + (donation.availableUnits === undefined ? Number(donation.units || 0) : Number(donation.availableUnits || 0)), 0);
      if (availableUnits < requestedUnits) {
        throw Object.assign(new Error(`Only ${availableUnits} ${normalizedBloodGroup} unit(s) are available.`), { status: 409 });
      }

      let remainingUnits = requestedUnits;
      for (const donation of donations) {
        if (!remainingUnits) break;
        const currentAvailableUnits = donation.availableUnits === undefined ? Number(donation.units || 0) : Number(donation.availableUnits || 0);
        const allocatedUnits = Math.min(currentAvailableUnits, remainingUnits);
        if (currentAvailableUnits < allocatedUnits) throw Object.assign(new Error('Inventory changed; please retry dispatch'), { status: 409 });
        const previousDispatchedUnits = Number(donation.dispatchedUnits || 0);
        donation.availableUnits = Math.max(0, currentAvailableUnits - allocatedUnits);
        donation.units = donation.availableUnits;
        donation.dispatchedUnits = previousDispatchedUnits + allocatedUnits;
        donation.totalUnits = Number(donation.totalUnits) > 0 ? Number(donation.totalUnits) : currentAvailableUnits + previousDispatchedUnits;
        if (donation.availableUnits === 0) donation.status = 'Dispatched';
        await donation.save({ session });
        remainingUnits -= allocatedUnits;
      }

      savedDispatch = await new Donation({
        donorName: donorName ? `Dispatched to: ${hospitalName} (${donorName})` : `Dispatched to: ${hospitalName || 'Hospital'}`,
        email: `dispatch-${new mongoose.Types.ObjectId()}@lifepulse.com`,
        bloodGroup: normalizedBloodGroup,
        patientName: patientName || '',
        units: -requestedUnits,
        totalUnits: requestedUnits,
        availableUnits: 0,
        dispatchedUnits: requestedUnits,
        hospitalId: req.user?.hospitalId || '',
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

export const getPublicDonationStats = async (req, res) => {
  try {
    const donations = await Donation.find(availableStockFilter).select('bloodGroup units availableUnits donorName').lean();
    const groups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const criticalGroups = groups.filter((group) => donations.filter((item) => item.bloodGroup === group).reduce((sum, item) => sum + (Number(item.availableUnits ?? item.units) || 0), 0) <= 3);
    return res.json({ success: true, criticalGroups, totalDonors: new Set(donations.map((item) => item.donorName)).size });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};