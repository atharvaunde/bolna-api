const cors = require('cors');
const helmet = require('helmet');
const hpp = require('hpp');
const express = require('express');

module.exports = (app) => {
  app.set('trust proxy', 1);

  app.use((req, res, next) => {
    req.requestId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    res.setHeader('X-Request-Id', req.requestId);
    next();
  });

  app.use(helmet());
  app.use(hpp());

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
  app.use(
    cors({
      origin: allowedOrigins,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
      maxAge: 86400, // 24 hours
    }),
  );
};
