const axios = require('axios');
const { BOLNA_API_KEY } = process?.env;

if (!BOLNA_API_KEY) {
  console.error('Error: BOLNA_API_KEY is not defined in environment variables.');
  process.exit(1);
}

const bolnaApi = axios.create({
  baseURL: 'https://api.bolna.ai',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${BOLNA_API_KEY}`,
  },
});

module.exports = bolnaApi;
