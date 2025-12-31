/* eslint-disable quotes */
// Base URLs
const BASE_URL = 'http://165.232.184.177';
const LIVE_URL = 'https://api.captainsathi.com'; // Update when production URL is available

// Toggle
const isTestEnvironment = true; // Change this to false for Live Environment

// Pick correct base URL
const API_BASE_URL =  BASE_URL;

// API Endpoints - Based on Postman collection
const Apis = {
  // Common Auth Endpoints (used by both dealer and farmer)
  LOGIN: `${API_BASE_URL}/api/common-auth/login`,
  SEND_OTP: `${API_BASE_URL}/api/common-auth/send-otp`,
  GET_LANGUAGES: `${API_BASE_URL}/api/common-auth/languages`,
  DEALER_FARMERS:`${API_BASE_URL}/api/dealers/farmers`,
  DEALER_DASHBOARD:`${API_BASE_URL}/api/dealers/dashboard`,
  DEALER_TRACTORS:`${API_BASE_URL}/api/dealers/tractors`,
  DEALER_TRACTOR_BY_ID:`${API_BASE_URL}/api/dealers/tractors`,
  DEALER_PROFILE:`${API_BASE_URL}/api/dealers/profile`,
  DEALER_PROFILE_IMAGE:`${API_BASE_URL}/api/dealers/profile/image`,
  DEALER_CATEGORIES:`${API_BASE_URL}/api/dealers/categories`,
  DEALER_QUESTIONS:`${API_BASE_URL}/api/dealers/questions`,
  DEALER_ADD_FARMER:`${API_BASE_URL}/api/dealers/v1/farmer/add`,
  DEALER_UPDATE_FARMER:`${API_BASE_URL}/api/dealers/farmers/update-request`,
  FARMER_DASHBOARD:`${API_BASE_URL}/api/farmers/dashboard`,
  FARMER_PROFILE:`${API_BASE_URL}/api/farmers/profile`,
  FARMER_PROFILE_IMAGE:`${API_BASE_URL}/api/farmers/profile/image`,
  FARMER_MOBILE_UPDATE:`${API_BASE_URL}/api/farmers/mobile/update`,
  FARMER_EVENTS:`${API_BASE_URL}/api/farmers/events`,
  FARMER_STORIES:`${API_BASE_URL}/api/farmers/stories`,
  FARMER_EVENTS_BY_LOCATION:`${API_BASE_URL}/api/farmers/eventsbylocation`,
  FARMER_STORIES_BY_LOCATION:`${API_BASE_URL}/api/farmers/storiesbylocation`,
  FARMER_EVENT_BY_ID:`${API_BASE_URL}/api/farmers/events`,
  FARMER_STORY_BY_ID:`${API_BASE_URL}/api/farmers/stories`,
  FARMER_FCM_REGISTER:`${API_BASE_URL}/api/farmers/fcm/register`,
  FARMER_FCM_UNREGISTER:`${API_BASE_URL}/api/farmers/fcm/unregister`,
  FARMER_PUSH_NOTIFICATIONS:`${API_BASE_URL}/api/farmers/push-notifications`,
  FARMER_PUSH_NOTIFICATION_READ:`${API_BASE_URL}/api/farmers/push-notifications`,
  FARMER_PUSH_NOTIFICATIONS_UNREAD_COUNT:`${API_BASE_URL}/api/farmers/push-notifications/unread-count`,
  // Location APIs
  GET_STATES:`${API_BASE_URL}/api/dealers/locations/states`,
  GET_DISTRICTS:`${API_BASE_URL}/api/dealers/locations/districts`,
  GET_VILLAGES:`${API_BASE_URL}/api/dealers/locations/villages`,

};

export default Apis;
export { API_BASE_URL };
