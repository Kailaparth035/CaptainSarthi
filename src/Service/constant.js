/* eslint-disable quotes */
// Base URLs
const BASE_URL = 'https://submissions-endif-essence-ahead.trycloudflare.com';
const LIVE_URL = 'https://api.captainsathi.com'; // Update when production URL is available

// Toggle
const isTestEnvironment = true; // Change this to false for Live Environment

// Pick correct base URL
const API_BASE_URL = isTestEnvironment ? BASE_URL : LIVE_URL;

// API Endpoints - Based on Postman collection
const Apis = {
  // Common Auth Endpoints (used by both dealer and farmer)
  LOGIN: `${API_BASE_URL}/api/common-auth/login`,
  SEND_OTP: `${API_BASE_URL}/api/common-auth/send-otp`,

};

export default Apis;
export { API_BASE_URL };
