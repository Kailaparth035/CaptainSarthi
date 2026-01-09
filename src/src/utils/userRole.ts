/**
 * Check if mobile number is a farmer role
 * Farmer role: mobile number "2222222222"
 * Dealer role: any other mobile number
 */
export const isFarmerRole = (mobileNumber: string): boolean => {
  return mobileNumber === '2222222222';
};

/**
 * Get user role based on mobile number
 */
export const getUserRole = (mobileNumber: string): 'farmer' | 'dealer' => {
  return isFarmerRole(mobileNumber) ? 'farmer' : 'dealer';
};








