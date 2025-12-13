import axios from 'axios';
import axiosInstance from './Apicom';
import { Alert } from 'react-native';
// TODO: Import your navigation logic if needed to redirect on 401
const handleApiResponse = (response) => {
  const { status, data, config } = response;
  console.log('data====>>',data?.message);
  
 switch (status) {
    case 200:
      return data;

    case 201:
      return data;

    case 401:
      // Alert.alert('Session expired', 'Please login again.');
      break;
      
      case 404: 
      // Alert.alert('Something went wrong!',data?.message);
      break;

    default:
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
    return null;
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
    return null;
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
    console.log("Upload error:", error?.response?.data || error);
    return null;
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
    return null;
  }
};
