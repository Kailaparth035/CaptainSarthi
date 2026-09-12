/* eslint-disable quotes */
// Production application API host. This is intentionally the live host supplied
// for Captain Saathi; do not substitute localhost in application builds.
const API_BASE_URL = 'http://139.59.32.197';

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
  DEALER_UPDATE_FARMER_V1:`${API_BASE_URL}/api/dealers/v1/farmer/update`, // For rejected update with full form-data
  DEALER_FCM_REGISTER:`${API_BASE_URL}/api/dealers/fcm/register`,
  DEALER_FCM_UNREGISTER:`${API_BASE_URL}/api/dealers/fcm/unregister`,
  DEALER_PUSH_NOTIFICATIONS:`${API_BASE_URL}/api/dealers/push-notifications`,
  DEALER_PUSH_NOTIFICATION_READ:`${API_BASE_URL}/api/dealers/push-notifications`,
  DEALER_PUSH_NOTIFICATIONS_UNREAD_COUNT:`${API_BASE_URL}/api/dealers/push-notifications/unread-count`,
  FARMER_DASHBOARD:`${API_BASE_URL}/api/farmers/dashboard`,
  FARMER_PROFILE:`${API_BASE_URL}/api/farmers/profile`,
  FARMER_PROFILE_UPDATE:`${API_BASE_URL}/api/farmers/profile/update`,
  FARMER_PROFILE_IMAGE:`${API_BASE_URL}/api/farmers/profile/image`,
  FARMER_MOBILE_UPDATE:`${API_BASE_URL}/api/farmers/mobile/update`,
  FARMER_EVENTS:`${API_BASE_URL}/api/farmers/events`,
  FARMER_STORIES:`${API_BASE_URL}/api/farmers/stories`,
  FARMER_EVENTS_BY_LOCATION:`${API_BASE_URL}/api/farmers/eventsbylocation`,
  FARMER_STORIES_BY_LOCATION:`${API_BASE_URL}/api/farmers/storiesbylocation`,
  FARMER_EVENT_BY_ID:`${API_BASE_URL}/api/farmers/events`,
  FARMER_STORY_BY_ID:`${API_BASE_URL}/api/farmers/stories`,
  FARMER_EVENT_RESPOND:`${API_BASE_URL}/api/farmers/events`,
  FARMER_FCM_REGISTER:`${API_BASE_URL}/api/farmers/fcm/register`,
  FARMER_FCM_UNREGISTER:`${API_BASE_URL}/api/farmers/fcm/unregister`,
  FARMER_PUSH_NOTIFICATIONS:`${API_BASE_URL}/api/farmers/push-notifications`,
  FARMER_PUSH_NOTIFICATION_READ:`${API_BASE_URL}/api/farmers/push-notifications`,
  FARMER_PUSH_NOTIFICATIONS_UNREAD_COUNT:`${API_BASE_URL}/api/farmers/push-notifications/unread-count`,
  FARMER_PUSH_NOTIFICATIONS_DELETE:`${API_BASE_URL}/api/farmers/push-notifications/read`,
  DEALER_PUSH_NOTIFICATIONS_DELETE:`${API_BASE_URL}/api/dealers/push-notifications/read`,
  DEALER_PUSH_NOTIFICATIONS_DELETE:`${API_BASE_URL}/api/dealers/push-notifications/read`,
  FARMER_ACCOUNT_DELETE:`${API_BASE_URL}/api/farmers/fcm/delete`,
  // Location APIs
  GET_STATES:`${API_BASE_URL}/api/dealers/locations/states`,
  GET_DISTRICTS:`${API_BASE_URL}/api/dealers/locations/districts`,
  GET_TALUKAS:`${API_BASE_URL}/api/dealers/locations/talukas`,
  GET_VILLAGES:`${API_BASE_URL}/api/dealers/locations/villages`,
  // Admin / Settings
  ADMIN_SETTINGS_DISCOUNTS: `${API_BASE_URL}/api/admin/settings/discounts`,
  ADMIN_FARMER_SAVINGS: `${API_BASE_URL}/api/dealers/settings/farmer-savings`,
  FARMER_SAVINGS_GET: `${API_BASE_URL}/api/farmers/settings/farmer-savings`,
  
};

export default Apis;
export { API_BASE_URL };
