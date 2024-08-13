
const extractFramesFromVideo = (videoBlob, frameCount = 15, maxDuration = 15) => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.src = URL.createObjectURL(videoBlob);

    video.onloadedmetadata = () => {
      console.log('Video metadata loaded.');
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d', { willReadFrequently: true });
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const frames = [];

      const captureFrame = () => {
        if (frames.length < frameCount && video.currentTime < maxDuration) {
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // Check if the frame is not entirely black
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          const isBlack = imageData.data.every((value, index) => index % 4 === 3 || value === 0);
          
          if (!isBlack) {
            canvas.toBlob(blob => {
              frames.push(blob);
              if (frames.length < frameCount) {
                // Move to the next frame
                video.currentTime += 1; // Move 2s forward
              } else {
                resolve(frames);
              }
            }, 'image/jpeg', 0.95);
          } else {
            console.log('Skipping black frame');
            video.currentTime += 0.1; // Move 100ms forward
          }
        } else {
          resolve(frames);
        }
      };

      video.onseeked = () => {
        if (video.currentTime < Math.min(video.duration, maxDuration)) {
          captureFrame();
        } else {
          resolve(frames);
        }
      };
      
      // Start capturing frames
      video.currentTime = 0;
    };

    video.onerror = (e) => {
      console.error('Error loading video:', e);
      reject(new Error('Failed to load video'));
    };

    // Trigger metadata load
    video.load();
  });
};

export default extractFramesFromVideo;