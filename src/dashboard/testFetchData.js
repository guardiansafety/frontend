import { FetchData } from './FetchData.js';

const testFetchData = async () => {
  try {
    const data = await FetchData();
    console.log('Response data:', data);
  } catch (error) {
    console.error('Error:', error);
  }
};

testFetchData();