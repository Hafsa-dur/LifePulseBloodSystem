import mongoose from 'mongoose';
import dns from 'dns';

// DNS SRV lookup resolve karne ke liye Google DNS set karein
dns.setServers(['8.8.8.8', '8.8.4.4']);

const connectDB = async () => {
  try {
    console.log("URI Check:", process.env.MONGODB_URI);
    
    mongoose.connection.on('connected', () => console.log('>>> Database Connected Successfully! <<<'));
    mongoose.connection.on('error', (err) => console.log('Database Connection Error:', err));

    await mongoose.connect(process.env.MONGODB_URI);

  } catch (error) {
    console.log("MongoDB Connection Error:", error.message);
  }
};

export default connectDB;