// frontend/src/services/api.js
import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

// Create an axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API functions
export const getGenderList = async () => {
  try {
    const response = await api.get('/genders');
    return response.data;
  } catch (error) {
    console.error('Error fetching gender list:', error);
    return ['Male', 'Female']; // Fallback
  }
};

export const getGenderCount = async (gender) => {
  try {
    const response = await api.get(`/genders/${gender}/count`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching count for ${gender}:`, error);
    return { count: 0 };
  }
};

export const getClientsByAgeRange = async (minAge = 0, maxAge = 100) => {
  try {
    const response = await api.get('/clients', {
      params: { age_min: minAge, age_max: maxAge }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching clients by age range:', error);
    throw error;
  }
};

export const getAllClients = async () => {
  try {
    const response = await api.get('/clients');
    return response.data;
  } catch (error) {
    console.error('Error fetching all clients:', error);
    throw error;
  }
};

export default {
  getGenderList,
  getGenderCount,
  getClientsByAgeRange,
  getAllClients
};