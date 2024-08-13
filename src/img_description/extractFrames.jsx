import { useEffect, useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';

const extractFramesFromVideo = (videoBlob, frameCount = 5) => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.src = URL.createObjectURL(videoBlob);

    video.onloadedmetadata = () => {
      console.log('Video metadata loaded. Duration:', video.duration);
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const frames = [];

      const captureFrame = () => {
        if (frames.length < frameCount) {
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          canvas.toBlob(blob => {
            frames.push(blob);
            if (frames.length < frameCount) {
              requestAnimationFrame(captureFrame);
            } else {
              resolve(frames);
            }
          }, 'image/jpeg');
        }
      };

      video.onplay = captureFrame;
      video.currentTime = 0;
      video.play();
    };

    video.onerror = reject;
  });
};
