const axios = require('axios');

const BASE_URL = process.env.BASE_URL ? process.env.BASE_URL
  : 'http://localhost:7001';

const request = axios.create({ baseURL: BASE_URL, timeout: 5000 });

request.interceptors.response.use(
  (response) => response.data,
  (error) => Promise.reject(error),
);
module.exports = request;
