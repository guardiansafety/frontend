import { FetchData } from './FetchData.js';

export const testFetch = async () => {
  try {
    const data = await FetchData();
    console.log('Fetched data:', data);
    return data;
  } catch (error) {
    console.error('Error:', error);
    return [];
  }
};