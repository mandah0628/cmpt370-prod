import axios from 'axios';

const instance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_EXPRESS_BASE_URL
});

// Add a request interceptor for debugging
instance.interceptors.request.use(
  (config) => {
    console.log('Request:', {
      url: config.url,
      method: config.method,
      params: config.params,
      baseURL: config.baseURL
    });
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor for debugging
instance.interceptors.response.use(
  (response) => {
    console.log('Response:', {
      status: response.status,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('Response error:', error);
    return Promise.reject(error);
  }
);

export default instance; 