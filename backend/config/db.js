import mongoose from 'mongoose';
import dns from 'dns';

// DNS SRV lookup resolve karne ke liye Google DNS set karein
dns.setServers(['8.8.8.8', '8.8.4.4']);

// Vercel serverless environment ke liye connection cache variable
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not configured');
  }

  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (cached.conn && mongoose.connection.readyState !== 1) {
    cached.conn = null;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false, // Yeh buffering timeout error ko rokta hai
      serverSelectionTimeoutMS: 5000,
    };

    cached.promise = mongoose.connect(process.env.MONGODB_URI, opts).then((mongoose) => {
      console.log('>>> Database Connected Successfully! <<<');
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    console.error('MongoDB Connection Error:', e.message);
    throw e;
  }

  return cached.conn;
};

export default connectDB;