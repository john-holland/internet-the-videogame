import React, { useEffect, useState } from 'react';
import Image from 'next/image';

export const CommentatorMic: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [orientation, setOrientation] = useState<{
    alpha: number | null;
    beta: number | null;
    gamma: number | null;
  }>({ alpha: null, beta: null, gamma: null });

  useEffect(() => {
    const handleOrientation = (event: DeviceOrientationEvent) => {
      setOrientation({
        alpha: event.alpha,
        beta: event.beta,
        gamma: event.gamma,
      });

      // Check if device is upside down (beta between 150 and 210 degrees)
      const isUpsideDown = event.beta !== null && event.beta > 150 && event.beta < 210;
      setIsRecording(isUpsideDown);
    };

    // Request permission for device orientation on iOS
    if (typeof DeviceOrientationEvent !== 'undefined' && 
        typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      (DeviceOrientationEvent as any).requestPermission()
        .then((permissionState: string) => {
          if (permissionState === 'granted') {
            window.addEventListener('deviceorientation', handleOrientation);
          }
        })
        .catch(console.error);
    } else {
      window.addEventListener('deviceorientation', handleOrientation);
    }

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, []);

  return (
    <div 
      className={`fixed inset-0 flex items-center justify-center transition-colors duration-300 ${
        isRecording ? 'bg-red-900' : 'bg-gray-900'
      }`}
    >
      <div className="relative w-64 h-64">
        <Image
          src="/mic.webp"
          alt="Microphone"
          fill
          className="object-contain"
          priority
        />
        {isRecording && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse" />
          </div>
        )}
      </div>
    </div>
  );
}; 