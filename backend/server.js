import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import http from 'http'; // HTTP server wrapper for Socket.io integration
import { Server } from 'socket.io'; // Socket.io ES Module Import
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import donationRoutes from './routes/donationRoutes.js';
import User from './models/User.js';
import HospitalRequest from './models/HospitalRequest.js'; 
import PatientRequestsRoutes from './routes/patientRequestsRoutes.js';
import DonorRecipientLog from './models/DonorRecipientLog.js'; // Donor Recipient Dispatch Log Model
import donorRecipientRoutes from './routes/donorRecipientRoutes.js';
import lifeImpactRoutes from './routes/lifeImpactRoutes.js';


// Load environment variables from .env and establish MongoDB connection
dotenv.config();

const app = express();

// Middleware setup for parsing incoming JSON payloads and enabling CORS restrictions
app.use(cors());
app.use(express.json());

// Vercel can invoke a request before the serverless instance has connected.
// Wait for the cached connection before any route performs a Mongoose query.
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error('Database connection unavailable:', error.message);
    return res.status(503).json({
      success: false,
      message: 'Database is temporarily unavailable. Please try again shortly.'
    });
  }
});

// Create HTTP Server instance and attach Socket.io for Real-Time Event Handling
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST", "DELETE", "PUT"]
  }
});

// Global Socket.io Instance Middleware (Injects `io` object into the request lifecycle)
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Handle Socket.io Client Connection and Disconnection Lifecycle Events
io.on('connection', (socket) => {
  console.log(`Socket Connected Successfully: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`Socket Disconnected: ${socket.id}`);
  });
});

// ==========================================
// 🚀 API ROUTES REGISTRATION
// ==========================================
app.use('/api/auth', authRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/patient-requests', PatientRequestsRoutes);
app.use('/api/donor-recipient-logs', donorRecipientRoutes);
app.use('/api/life-impact', lifeImpactRoutes);
// ==========================================
// 🩸 DONOR & RECIPIENT DISPATCH LOG ROUTES
// ==========================================

// 1. GET: Fetch all dispatch history logs
app.get('/api/donor-recipient-logs', async (req, res) => {
  try {
    const logs = await DonorRecipientLog.find().sort({ createdAt: -1 });
    return res.status(200).json(logs);
  } catch (error) {
    console.error('Error fetching dispatch logs:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 2. POST: Add a new donor record / inflow
app.post('/api/donor-recipient-logs/add', async (req, res) => {
  try {
    const { donorName, lastDonationDate, bloodType, pints } = req.body;
    
    const newLog = await DonorRecipientLog.create({
      donorName,
      lastDonationDate,
      bloodType,
      pints: Number(pints),
      sourceType: 'donor',
      matchStatus: 'Matched',
      dispatchStatus: 'Pending',
      status: 'Recorded'
    });

    return res.status(201).json({
      success: true,
      message: 'Donor record added successfully!',
      data: newLog
    });
  } catch (error) {
    console.error('Error adding donor record:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});// PUT: Update recipient allocation & change status
app.put('/api/donor-recipient-logs/dispatch/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { recipientName, status } = req.body; // Yahan recipient ka naam aur status frontend se aayega

    const updatedLog = await DonorRecipientLog.findByIdAndUpdate(
      id,
      { 
        recipientName: recipientName || 'Pending Allocation', 
        status: status || 'Dispatched' 
      },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Dispatch log updated successfully!',
      data: updatedLog
    });
  } catch (error) {
    console.error('Error updating dispatch status:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});
  



// ==========================================
// 🏥 HOSPITAL EMERGENCY ROUTES (PERSISTENT + REAL-TIME)
// ==========================================

// 1. GET ALL HOSPITAL REQUESTS (Fetches persistent emergency logs from MongoDB)
app.get('/api/hospital-requests', async (req, res) => {
  try {
    const requests = await HospitalRequest.find().sort({ createdAt: -1 });
    return res.status(200).json(requests);
  } catch (error) {
    console.error('Error fetching hospital requests:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 2. CREATE & SAVE HOSPITAL REQUEST (Saves to MongoDB database and triggers live broadcast)
app.post('/api/hospital-requests', async (req, res) => {
  try {
    const { hospitalName, bloodGroup, unitsRequired, urgencyLevel, contactPerson, phone } = req.body;

    const newRequest = await HospitalRequest.create({
      hospitalName,
      bloodGroup,
      unitsRequired: Number(unitsRequired),
      urgencyLevel: urgencyLevel || 'Critical',
      contactPerson: contactPerson || 'Emergency Dept',
      phone
    });

    io.emit('new_hospital_request', newRequest);

    return res.status(201).json({
      success: true,
      message: 'Emergency request saved to database and broadcasted successfully!',
      data: newRequest
    });
  } catch (error) {
    console.error('Error saving & broadcasting hospital request:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to broadcast hospital request.',
      error: error.message
    });
  }
});

// 3. RESOLVE / DELETE HOSPITAL REQUEST (Removes document from DB and syncs client UIs)
app.delete('/api/hospital-requests/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await HospitalRequest.findByIdAndDelete(id);

    io.emit('delete_hospital_request', id);

    return res.status(200).json({
      success: true,
      message: 'Hospital request resolved and removed successfully.'
    });
  } catch (error) {
    console.error('Error deleting hospital request:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// ⚠️ BLOOD STOCK MONITORING & LOW STOCK ALERT ROUTE
// ==========================================
app.post('/api/update-stock', (req, res) => {
  try {
    const { bloodGroup, remainingUnits, message } = req.body;
    const units = Number(remainingUnits);

    if (units <= 3) {
      io.emit('low_stock_alert', {
        bloodGroup,
        remainingUnits: units,
        message: message || `CRITICAL ALERT: ${bloodGroup} stock is critically low (${units} units remaining)!`
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Stock updated and verified successfully.',
      remainingUnits: units
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==========================================
// 📱 SMART EMERGENCY DONOR BROADCAST ROUTE
// ==========================================
app.post('/api/emergency/send-sms', async (req, res) => {
  try {
    const { targetCity = 'Peshawar' } = req.body;

    const donors = await User.find({ role: 'donor' }).select('name city bloodGroup phone');

    if (!donors || donors.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No registered donors found in database.',
        matchType: 'No Donors Registered',
        count: 0,
        donorsList: []
      });
    }

    const exactMatches = donors.filter(
      (d) => (d.city || '').trim().toLowerCase() === targetCity.trim().toLowerCase()
    );

    let finalDonorsList = [];
    let matchType = '';

    if (exactMatches.length > 0) {
      finalDonorsList = exactMatches.map((d) => `${d.name} (${d.city || targetCity} - Direct Match)`);
      matchType = `Exact Location Match (${targetCity})`;
    } else {
      finalDonorsList = donors.map(
        (d) => `${d.name} (${d.city || 'General Region'} - Regional Proximity Match)`
      );
      matchType = `Regional Fallback Match for ${targetCity}`;
    }

    io.emit('emergency_broadcast', {
      targetCity,
      matchType,
      count: finalDonorsList.length
    });

    res.status(200).json({
      success: true,
      message: `Emergency broadcast processed successfully via ${matchType}`,
      matchType,
      targetCity,
      count: finalDonorsList.length,
      donorsList: finalDonorsList
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to process emergency notification.',
      error: error.message
    });
  }
});

// Initialize and Start Express & Socket.io HTTP Server on PORT 5000 (or environment specified default)
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`LifePulse Server running successfully on port ${PORT}`));