const mongoose = require('mongoose');

exports.connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      readPreference: 'secondaryPreferred',
    });
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('MongoDB connection failed', {
      message: error.message,
      stack: error.stack,
    });
    process.exit(1);
  }
};

exports.disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB disconnected');
  } catch (error) {
    console.error('MongoDB disconnection failed', {
      message: error.message,
      stack: error.stack,
    });
  }
};
