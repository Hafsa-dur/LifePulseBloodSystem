import Donation from '../models/donationModel.js';
import User from '../models/User.js';
import mongoose from 'mongoose';
import DonorRecipientLog from '../models/DonorRecipientLog.js';
import { sendDonorThankYouEmail } from '../services/emailService.js';

const locationCache = new Map();
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const bloodGroups = new Set(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']);
const isBloodGroupCompatible = (donorGroup, recipientGroup) => {
  const normalizedDonorGroup = String(donorGroup || '').trim().toUpperCase();
  const normalizedRecipientGroup = String(recipientGroup || '').trim().toUpperCase();
  // The records do not identify a blood component, so only exact ABO/Rh matches are safe.
  return bloodGroups.has(normalizedDonorGroup) && normalizedDonorGroup === normalizedRecipientGroup;
};
const availableStockFilter = {
  $or: [
    { availableUnits: { $gt: 0 } },
    { availableUnits: { $exists: false }, units: { $gt: 0 } }
  ],
  status: { $ne: 'Dispatched' }
};

const finiteCoordinate = (value, minimum, maximum) => {
  if (value === null || value === undefined || (typeof value === 'string' && !value.trim())) return null;
  if (typeof value !== 'number' && (typeof value !== 'string'
    || !/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(value.trim()))) return null;
  const numericValue = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numericValue) && numericValue >= minimum && numericValue <= maximum ? numericValue : null;
};

export const normalizeCoordinatePair = (latitude, longitude) => {
  const latitudeProvided = latitude !== null && latitude !== undefined && String(latitude).trim() !== '';
  const longitudeProvided = longitude !== null && longitude !== undefined && String(longitude).trim() !== '';
  if (!latitudeProvided && !longitudeProvided) return null;
  if (!latitudeProvided || !longitudeProvided) {
    throw new Error('Both latitude and longitude are required when coordinates are provided.');
  }

  const normalizedLatitude = finiteCoordinate(latitude, -90, 90);
  const normalizedLongitude = finiteCoordinate(longitude, -180, 180);
  if (normalizedLatitude === null || normalizedLongitude === null) {
    throw new Error('Latitude must be between -90 and 90 and longitude between -180 and 180.');
  }
  return { latitude: normalizedLatitude, longitude: normalizedLongitude };
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
  const cacheKey = normalizedLocation.toLocaleLowerCase();
  if (locationCache.has(cacheKey)) return locationCache.get(cacheKey);

  const placeSearchLocations = [normalizedLocation];
  const request = (async () => {
    for (const searchLocation of placeSearchLocations) {
      try {
        const photonUrl = new URL('https://photon.komoot.io/api/');
        photonUrl.searchParams.set('q', searchLocation);
        photonUrl.searchParams.set('limit', '10');
        const response = await fetch(photonUrl, {
          headers: { 'User-Agent': 'VitalTrackBloodSystem/1.0' },
          signal: AbortSignal.timeout(5000)
        });
        if (!response.ok) {
          console.warn(`Photon geocoding returned HTTP ${response.status}.`);
          continue;
        }
        const result = await response.json();
        const features = Array.isArray(result.features) ? result.features : [];
        const validFeatures = features.filter((item) => {
          const coordinates = item.geometry?.coordinates;
          return Array.isArray(coordinates) && coordinates.length >= 2
            && finiteCoordinate(coordinates[1], -90, 90) !== null
            && finiteCoordinate(coordinates[0], -180, 180) !== null;
        });
        const requestedPlace = searchLocation.split(',')[0].trim().toLocaleLowerCase();
        const feature = validFeatures.find((item) =>
          String(item.properties?.name || '').trim().toLocaleLowerCase() === requestedPlace
        ) || validFeatures[0];
        if (feature) {
          return {
            latitude: Number(feature.geometry.coordinates[1]),
            longitude: Number(feature.geometry.coordinates[0]),
            precision: 'place'
          };
        }
      } catch (error) {
        console.warn(`Photon geocoding failed: ${error.message}`);
      }
    }

    for (const searchLocation of placeSearchLocations) {
      try {
        const nominatimUrl = new URL('https://nominatim.openstreetmap.org/search');
        nominatimUrl.searchParams.set('format', 'jsonv2');
        nominatimUrl.searchParams.set('limit', '5');
        nominatimUrl.searchParams.set('q', searchLocation);
        const response = await fetch(nominatimUrl, {
          headers: { 'User-Agent': 'VitalTrackBloodSystem/1.0' },
          signal: AbortSignal.timeout(5000)
        });
        if (!response.ok) {
          console.warn(`Nominatim geocoding returned HTTP ${response.status}.`);
          continue;
        }
        const results = await response.json();
        const placeResult = results.find((result) =>
          finiteCoordinate(result.lat, -90, 90) !== null
          && finiteCoordinate(result.lon, -180, 180) !== null
        );
        if (placeResult) return { latitude: Number(placeResult.lat), longitude: Number(placeResult.lon), precision: 'place' };
      } catch (error) {
        console.warn(`Nominatim geocoding failed: ${error.message}`);
      }
    }
    return null;
  })();

  locationCache.set(cacheKey, request);
  const coordinates = await request;
  if (!coordinates) locationCache.delete(cacheKey);
  return coordinates;
};

export const distanceInKilometers = (first, second) => {
  const firstCoordinates = normalizeCoordinatePair(first?.latitude, first?.longitude);
  const secondCoordinates = normalizeCoordinatePair(second?.latitude, second?.longitude);
  if (!firstCoordinates || !secondCoordinates) return Number.POSITIVE_INFINITY;
  const toRadians = (value) => (value * Math.PI) / 180;
  const latitudeDelta = toRadians(secondCoordinates.latitude - firstCoordinates.latitude);
  const longitudeDelta = toRadians(secondCoordinates.longitude - firstCoordinates.longitude);
  const a = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(toRadians(firstCoordinates.latitude))
    * Math.cos(toRadians(secondCoordinates.latitude))
    * Math.sin(longitudeDelta / 2) ** 2;
  const boundedA = Math.min(1, Math.max(0, a));
  return 6371 * 2 * Math.atan2(Math.sqrt(boundedA), Math.sqrt(1 - boundedA));
};

export const findMatchingDonors = async ({ bloodGroup, units, location, latitude, longitude, hospitalId, hospitalName, session, excludeDonorIds = [], diagnostics }) => {
  const normalizedBloodGroup = String(bloodGroup || '').trim().toUpperCase();
  const requestedUnits = Number(units);
  const savedLocation = String(location || '').trim();
  if (!bloodGroups.has(normalizedBloodGroup) || !savedLocation || !Number.isInteger(requestedUnits) || requestedUnits <= 0) {
    return [];
  }

  const requestCoordinates = normalizeCoordinatePair(latitude, longitude) || await geocodeLocation(savedLocation);
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
    const donorBloodGroup = String(donor.bloodGroup || '').trim().toUpperCase();
    const bloodGroupCompatible = isBloodGroupCompatible(donorBloodGroup, normalizedBloodGroup);
    const available = Number.isFinite(availableUnits) && availableUnits >= requestedUnits && donor.status !== 'Dispatched';
    const eligible = !donor.nextEligibleDate || new Date(donor.nextEligibleDate) <= new Date();
    const donorLocation = String(donor.location || donor.address || '').trim();
    const donorDiagnostic = {
      donorId: String(donor._id),
      donorName: donor.donorName,
      donorBloodGroup,
      requestedBloodGroup: normalizedBloodGroup,
      units: availableUnits,
      requestedUnits,
      donorLocation,
      donorCoordinates: null,
      hospitalCoordinates: { latitude: targetCoordinates.latitude, longitude: targetCoordinates.longitude },
      nextEligibleDate: donor.nextEligibleDate || null,
      status: donor.status,
      bloodGroupCompatible,
      available,
      eligible,
      distanceKm: null
    };

    if (!bloodGroupCompatible) donorDiagnostic.rejectionReason = 'blood-group-incompatible';
    else if (!available) donorDiagnostic.rejectionReason = 'insufficient-available-units-or-dispatched';
    else if (!eligible) donorDiagnostic.rejectionReason = 'donation-not-yet-eligible';
    if (donorDiagnostic.rejectionReason) {
      diagnostics?.push(donorDiagnostic);
      return null;
    }

    const storedCoordinates = getStoredCoordinates(donor);
    const coordinates = storedCoordinates || (donorLocation ? await geocodeLocation(donorLocation) : null);
    if (!storedCoordinates && coordinates) {
      donor.latitude = coordinates.latitude;
      donor.longitude = coordinates.longitude;
      await donor.save(session ? { session } : undefined);
    }
    donorDiagnostic.donorCoordinates = coordinates
      ? { latitude: coordinates.latitude, longitude: coordinates.longitude }
      : null;
    const distance = coordinates ? distanceInKilometers(targetCoordinates, coordinates) : Number.POSITIVE_INFINITY;
    donorDiagnostic.distanceKm = Number.isFinite(distance) ? Number(distance.toFixed(2)) : null;

    if (!coordinates) {
      donorDiagnostic.rejectionReason = 'donor-location-unresolved';
      diagnostics?.push(donorDiagnostic);
      return null;
    }
    diagnostics?.push({ ...donorDiagnostic, rejectionReason: null });

    return { donor, distance };
  })).then((matches) => matches.filter(Boolean));

  rankedDonors.sort((first, second) => first.distance - second.distance
    || new Date(first.donor.createdAt) - new Date(second.donor.createdAt)
    || String(first.donor._id).localeCompare(String(second.donor._id)));
  return rankedDonors;
};

export const findNearestMatchingDonor = async (options) => {
  const diagnostics = options.diagnostics || [];
  const rankedDonors = await findMatchingDonors({ ...options, diagnostics });
  if (rankedDonors.length === 0 && diagnostics.some((item) =>
    item.reason === 'hospital-location-unresolved' || item.rejectionReason === 'donor-location-unresolved'
  )) {
    throw Object.assign(
      new Error('Donor matching is incomplete because one or more locations could not be resolved. Inventory fallback is not available until matching can be retried.'),
      { status: 503 }
    );
  }
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
    const { donorName, email, bloodGroup, units, phone, address, location, latitude, longitude, notes, hospitalId, hospitalName, donationDate, lastDonationDate } = req.body;
    const formattedEmail = email ? email.toLowerCase().trim() : '';
    let suppliedCoordinates;
    try {
      suppliedCoordinates = normalizeCoordinatePair(latitude, longitude);
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

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

    const donorLocation = String(location || '').trim() || String(address || '').trim();
    const resolvedCoordinates = suppliedCoordinates || await geocodeLocation(donorLocation);

    const newDonation = new Donation({
      donorName,
      email: formattedEmail,
      bloodGroup,
      units: Number(units) || 1,
      totalUnits: Number(units) || 1,
      availableUnits: Number(units) || 1,
      dispatchedUnits: 0,
      phone: phone || '03000000000',
      address: address || donorLocation,
      location: donorLocation,
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

    res.status(201).json({
      ...savedDonation.toObject(),
      locationWarning: resolvedCoordinates ? undefined : 'Donation saved, but its location could not be geocoded. Add valid coordinates before distance matching.'
    });
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
    return res.json({
      success: true,
      donation: updated,
      locationWarning: (req.body.location !== undefined || req.body.address !== undefined)
        && (updates.latitude === null || updates.longitude === null)
        ? 'Donation updated, but its location could not be geocoded. Distance matching is unavailable until valid coordinates are added.'
        : undefined
    });
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
        email: `dispatch-${new mongoose.Types.ObjectId()}@vitaltrack.com`,
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