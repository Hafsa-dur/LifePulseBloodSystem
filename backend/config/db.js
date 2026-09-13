import mongoose from 'mongoose';

const cached = globalThis.__lifepulseMongo || {
  conn: null,
  promise: null
};

globalThis.__lifepulseMongo = cached;

const connectDB = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not configured');
  }

  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000,
      maxPoolSize: 10
    };

    cached.promise = mongoose.connect(process.env.MONGODB_URI, opts)
      .then((connection) => {
        console.log('MongoDB connected');
        return connection;
      })
      .catch((error) => {
        cached.promise = null;
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    console.error('MongoDB Connection Error:', e.message);
    throw e;
  }

  return cached.conn;
};

export default connectDB;