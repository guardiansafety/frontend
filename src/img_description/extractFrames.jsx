export const extractFramesFromVideo = (videoFile, frameCount = 5) => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.src = URL.createObjectURL(videoFile);
    video.crossOrigin = "anonymous";

    video.onloadedmetadata = () => {
      if (video.duration === 0) {
        reject(new Error('Video duration is zero.'));
        return;
      }

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      const duration = video.duration;
      const interval = duration / frameCount;
      const frames = [];

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      console.log(`Video Duration: ${duration}, Frame Count: ${frameCount}, Interval: ${interval}`);

      let seekResolve;
      const onSeeked = () => {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(blob => {
          frames.push(blob);
          if (frames.length === frameCount) {
            video.removeEventListener('seeked', onSeeked);
            resolve(frames);
          } else {
            seekResolve();
          }
        }, 'image/jpeg');
      };

      video.addEventListener('seeked', onSeeked);

      const next = i => () => {
        console.log(`Seeking to ${i * interval}`);
        video.currentTime = i * interval;
      };

      let chain = Promise.resolve();
      for (let i = 0; i < frameCount; i++) {
        chain = chain.then(() => new Promise(resolve => {
          seekResolve = resolve;
          next(i)();
        }));
      }
    };

    video.onerror = (e) => {
      console.error('Video Error:', e);
      reject(e);
    };
  });
};
