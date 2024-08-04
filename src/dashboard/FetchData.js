import axios from 'axios';

export const FetchData = async () => {
  try {
    const response = await axios.get('http://localhost:3006/get-all-emergencies'); // Adjust the URL to your API endpoint
    console.log(response.data); // Use console.log for debugging
    return response.data;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
};