import axiosInstance from './Apicom';
import { Alert } from 'react-native';

const loggableRequestBody = body => {
  if (!body || body instanceof FormData || typeof body !== 'object') {
    return body;
  }

  return body.password
    ? {...body, password: '[REDACTED]'}
    : body;
};

/** Map transport failures (ATS, offline, timeout) to a clear message for the UI */
const networkFailurePayload = error => {
  const code = error?.code;
  const noResponse = !error?.response;
  const isNetwork =
    code === 'ERR_NETWORK' ||
    code === 'ECONNABORTED' ||
    (noResponse && String(error?.message || '').includes('Network Error'));
  if (!isNetwork) {
    return null;
  }
  return {
    status: false,
    success: false,
    message:
      'Could not reach the server. Check your internet connection and try again.',
  };
};

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
    const net = networkFailurePayload(error);
    if (net) {
      return net;
    }
    if (error?.response?.data) {
      return error.response.data;
    }
    return {
      status: false,
      message: error?.message || 'An error occurred while processing your request',
    };
  }
};

//  POST request
export const postData = async (fullUrl, body = {}) => {
  if (__DEV__) {
    console.log('POST Api Call ----fullUrl--->>>>', fullUrl);
    console.log('POST Api Call ----body--->>>>', loggableRequestBody(body));
  }

  try {
    const headers = body instanceof FormData
      ? { 'Content-Type': 'multipart/form-data' }
      : { 'Content-Type': 'application/json' };

    const response = await axiosInstance.post(fullUrl, body, { headers });
    return handleApiResponse(response);
  } catch (error) {
    console.log('POST error:', error);
    const net = networkFailurePayload(error);
    if (net) {
      return net;
    }
    if (error?.response?.data) {
      return error.response.data;
    }
    return {
      status: false,
      message: error?.message || 'An error occurred while processing your request',
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
      },
      timeout: 120000,
    });
    return handleApiResponse(response);
  } catch (error) {
    console.log('Upload error:', error?.response?.data || error?.message);
    const net = networkFailurePayload(error);
    if (net) {
      return net;
    }
    if (error?.response?.data) {
      return error.response.data;
    }
    return {
      status: false,
      message: error?.message || 'An error occurred while processing your request',
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
    const headers = body instanceof FormData
      ? { 'Content-Type': 'multipart/form-data' }
      : { 'Content-Type': 'application/json' };

    const response = await axiosInstance.put(fullUrl, body, { headers });
    return handleApiResponse(response);
  } catch (error) {
    console.log('PUT error:', error);
    const net = networkFailurePayload(error);
    if (net) {
      return net;
    }
    if (error?.response?.data) {
      return error.response.data;
    }
    return {
      status: false,
      message: error?.message || 'An error occurred while processing your request',
    };
  }
};

//  PUT with multipart/form-data (for file uploads)
export const putDataWithImage = async (url, formData) => {
  try {
    const response = await axiosInstance.put(url, formData, {
      headers: {
        Accept: 'application/json', 
        'Content-Type': 'multipart/form-data'
      },
      timeout: 120000,
    });
    return handleApiResponse(response);
  } catch (error) {
    console.log('PUT Upload error:', error?.response?.data || error?.message);
    const net = networkFailurePayload(error);
    if (net) {
      return net;
    }
    if (error?.response?.data) {
      return error.response.data;
    }
    return {
      status: false,
      message: error?.message || 'An error occurred while processing your request',
    };
  }
};

//  DELETE request
export const deleteData = async (fullUrl, params = {}) => {
  if (__DEV__) {
    console.log('DELETE Api Call ----fullUrl--->>>>', fullUrl);
    console.log('DELETE Api Call ----params--->>>>', params);
  }

  try {
    const response = await axiosInstance.delete(fullUrl, { params });
    return handleApiResponse(response);
  } catch (error) {
    console.log('DELETE error:', error);
    const net = networkFailurePayload(error);
    if (net) {
      return net;
    }
    if (error?.response?.data) {
      return error.response.data;
    }
    return {
      status: false,
      message: error?.message || 'An error occurred while processing your request',
    };
  }
};

//  DELETE request with JSON body
export const deleteDataWithBody = async (fullUrl, body = {}) => {
  if (__DEV__) {
    console.log('DELETE (body) Api Call ----fullUrl--->>>>', fullUrl);
    console.log('DELETE (body) Api Call ----body--->>>>', body);
  }

  try {
    const response = await axiosInstance.delete(fullUrl, {
      headers: { 'Content-Type': 'application/json' },
    });
    return handleApiResponse(response);
  } catch (error) {
    console.log('DELETE (body) error:', error);
    const net = networkFailurePayload(error);
    if (net) {
      return net;
    }
    if (error?.response?.data) {
      return error.response.data;
    }
    return {
      status: false,
      message: error?.message || 'An error occurred while processing your request',
    };
  }
};
