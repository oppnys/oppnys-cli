const axios = require('axios');

const BASE_URL = process.env.OPPNYS_BASE_URL ? process.env.OPPNYS_BASE_URL
  : 'https://391937p1z0.picp.vip/cli';

const request = axios.create({ baseURL: BASE_URL, timeout: 5000 });

request.interceptors.response.use(
  (response) => response.data,
  (error) => Promise.reject(error),
);
module.exports = request;
