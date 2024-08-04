// src/dashboard/markerUtils.js
import { testFetch } from './testFetch.js';
import moment from 'moment-timezone';

export const fetchAndTransformMarkerData = async () => {
  const data = await testFetch();
  const transformedData = data.map((item) => ({
    friendName: item.username,
    location: [item.location.longitude, item.location.latitude],
    description: item.description,
    timestamp: moment(item.timestamp).tz("America/Toronto").format('YYYY-MM-DD HH:mm:ss'),
    emotions: item.emotions,
  }));

  const images = ['/snoopy.jpg', '/pikachu.jpg', '/bmo.jpg', '/minion.jpg', '/stitch.jpg'];
  const usernameToImageMap = {};
  let imageIndex = 0;

  const finalData = transformedData.map((item) => {
    if (!usernameToImageMap[item.friendName]) {
      usernameToImageMap[item.friendName] = images[imageIndex % images.length];
      imageIndex++;
    }
    return {
      ...item,
      friendImage: usernameToImageMap[item.friendName],
    };
  });

  return finalData;
};

export const getMarkerCountByUsername = (markerData) => {
  const counts = {};
  markerData.forEach((marker) => {
    counts[marker.friendName] = (counts[marker.friendName] || 0) + 1;
  });
  return counts;
};