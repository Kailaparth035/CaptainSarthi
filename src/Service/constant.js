/* eslint-disable quotes */
// Base URLs
const BASE_URL = 'https://employees-falling-ordinance-functional.trycloudflare.com';
const LIVE_URL = 'https://api.captainsathi.com'; // Update when production URL is available

// Toggle
const isTestEnvironment = true; // Change this to false for Live Environment

// Pick correct base URL
const API_BASE_URL = isTestEnvironment ? BASE_URL : LIVE_URL;

// API Endpoints - Based on Postman collection
const Apis = {
  // Dealer APIs
  DEALER_SEND_OTP: `${API_BASE_URL}/api/dealers/send-otp`,
  DEALER_LOGIN: `${API_BASE_URL}/api/dealers/login`,
  DEALER_DASHBOARD: `${API_BASE_URL}/api/dealers/dashboard`,
  DEALER_FARMERS: `${API_BASE_URL}/api/dealers/farmers`,
  DEALER_FARMER_BY_ID: (id) => `${API_BASE_URL}/api/dealers/farmers/${id}`,
  DEALER_TRACTORS: `${API_BASE_URL}/api/dealers/tractors`,
  DEALER_PROFILE: `${API_BASE_URL}/api/dealers/profile`,
  
  // Farmer APIs
  FARMER_SEND_OTP: `${API_BASE_URL}/api/farmers/send-otp`,
  FARMER_LOGIN: `${API_BASE_URL}/api/farmers/login`,
  FARMER_DASHBOARD: `${API_BASE_URL}/api/farmers/dashboard`,
  FARMER_PROFILE: `${API_BASE_URL}/api/farmers/profile`,
  FARMER_EVENTS: `${API_BASE_URL}/api/farmers/events`,
  FARMER_STORIES: `${API_BASE_URL}/api/farmers/stories`,
  FARMER_TOP_VIDEOS: `${API_BASE_URL}/api/farmers/top-videos`,
  FARMER_RECENT_STORIES: `${API_BASE_URL}/api/farmers/recent-stories`,
  
  // Admin APIs
  ADMIN_DASHBOARD: `${API_BASE_URL}/api/admin/dashboard`,
  ADMIN_DEALERS: `${API_BASE_URL}/api/admin/dealers`,
  ADMIN_FARMERS: `${API_BASE_URL}/api/admin/farmers`,
  
  // Common endpoints (for backward compatibility)
  SEND_OTP: `${API_BASE_URL}/api/dealers/send-otp`, // Default to dealer
  LOGIN_API: `${API_BASE_URL}/api/dealers/login`, // Default to dealer
};

export default Apis;
export { API_BASE_URL };
