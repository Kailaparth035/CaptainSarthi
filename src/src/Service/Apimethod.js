import axios from 'axios';
import axiosInstance from './Apicom';
import { Alert } from 'react-native';
// TODO: Import your navigation logic if needed to redirect on 401
const handleApiResponse = (response) => {
  const { status, data, config } = response;
  console.log('data====>>',status, data,response);
  
 switch (status) {
    case 200:
      return data;

    case 201:
      return data;

    case 401:
      // Alert.alert('Session expired', 'Please login again.');
      return data; // Return data even for 401 to allow handling in components
      
    case 404: 
      return data; // Return data for 404 to allow error message extraction
      // Alert.alert('Something went wrong!',data?.message);
      break;

    default:
      // For other status codes, return the data so error messages can be extracted
      return data;
      // Alert.alert('Error', `Something went wrong (Code: ${status})`);
      break;
  }

  return null;
};

//  GET request
export const getData = async (fullUrl, params = {}) => {
  if (__DEV__) {
    console.log('GET Api Call ----fullUrl--->>>>', fullUrl);
    console.log('GET Api Call ----params--->>>>', params);
  }

  try {
    const response = await axiosInstance.get(fullUrl, { params });
    return handleApiResponse(response);
  } catch (error) {
    console.log('GET error:', error);
    // Return error response data so error messages can be extracted
    if (error?.response?.data) {
      return error.response.data;
    }
    // If no response data, return error object with message
    return {
      status: false,
      message: error?.message || 'An error occurred while processing your request'
    };
  }
};

//  POST request
export const postData = async (fullUrl, body = {}) => {
  if (__DEV__) {
    console.log('POST Api Call ----fullUrl--->>>>', fullUrl);
    console.log('POST Api Call ----body--->>>>', body);
  }

  try {
    const headers = body instanceof FormData
      ? { 'Content-Type': 'multipart/form-data' }
      : { 'Content-Type': 'application/json' };

    const response = await axiosInstance.post(fullUrl, body, { headers });
    return handleApiResponse(response);
  } catch (error) {
    console.log('POST error:', error);
    // Return error response data so error messages can be extracted
    if (error?.response?.data) {
      return error.response.data;
    }
    // If no response data, return error object with message
    return {
      status: false,
      message: error?.message || 'An error occurred while processing your request'
    };
  }
};

//  POST with multipart/image
export const postDataWithImage = async (url, formData) => {
  try {
    const response = await axiosInstance.post(url, formData, {
      headers: {
        Accept: 'application/json', 
        'Content-Type': 'multipart/form-data'
      }
    });
    return handleApiResponse(response);
  } catch (error) {
    console.log("Upload error:", error?.response?.data || error?.message);
    // Return error response data so error messages can be extracted
    if (error?.response?.data) {
      return error.response.data;
    }
    // If no response data, return error object with message
    return {
      status: false,
      message: error?.message || 'An error occurred while processing your request'
    };
  }
};



//  PUT request
export const putData = async (fullUrl, body = {}) => {
  if (__DEV__) {
    console.log('PUT Api Call ----fullUrl--->>>>', fullUrl);
    console.log('PUT Api Call ----body--->>>>', body);
  }

  try {
    const response = await axiosInstance.put(fullUrl, body);
    return handleApiResponse(response);
  } catch (error) {
    console.log('PUT error:', error);
    // Return error response data so error messages can be extracted
    if (error?.response?.data) {
      return error.response.data;
    }
    // If no response data, return error object with message
    return {
      status: false,
      message: error?.message || 'An error occurred while processing your request'
    };
  }
};
