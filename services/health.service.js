const mongoose = require('mongoose');
const pkg = require('../package.json');
const { handleError } = require('../utils/error');

exports.pingCheck = async () => {
  try {
    let mongoStatus = 'unknown';

    try {
      mongoStatus =
        mongoose.connection.readyState === 1
          ? 'connected'
          : mongoose.connection.readyState === 2
            ? 'connecting'
            : 'disconnected';
    } catch (err) {
      mongoStatus = 'error';
    }

    return {
      success: true,
      statusCode: 200,
      message: 'Health check successful',
      data: {
        uptime: process.uptime(),
        timestamp: new Date(),
        services: {
          mongo: mongoStatus,
        },
      },
    };
  } catch (error) {
    console.log(error);
  }
};

exports.metaData = async () => {
  try {
    return {
      success: true,
      statusCode: 200,
      message: 'Metadata fetched successfully',
      data: {
        name: pkg.name,
        version: pkg.version,
        description: pkg.description,
        environment: process.env.NODE_ENV || 'development',
        pid: process.pid,
        node: process.version,
      },
    };
  } catch (error) {
    throw handleError(error);
  }
};
