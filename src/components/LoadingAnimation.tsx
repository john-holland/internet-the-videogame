import { useEffect, useState } from 'react';

const CART_ASCII = [
  `
   ╭──────────╮
   │  PLAYER  │
   │  LOADING │
   ╰──────────╯
  `,
  `
   ╭──────────╮
   │  PLAYER  │
   │  LOADING.│
   ╰──────────╯
  `,
  `
   ╭──────────╮
   │  PLAYER  │
   │  LOADING..│
   ╰──────────╯
  `,
  `
   ╭──────────╮
   │  PLAYER  │
   │  LOADING...│
   ╰──────────╯
  `,
];

interface LoadingAnimationProps {
  onComplete: () => void;
}

export default function LoadingAnimation({ onComplete }: LoadingAnimationProps) {
  const [frame, setFrame] = useState(0);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setFrame((prev) => (prev + 1) % CART_ASCII.length);
    }, 200);

    const fadeOut = setTimeout(() => {
      setOpacity(0);
      setTimeout(onComplete, 500);
    }, 2000);

    return () => {
      clearInterval(interval);
      clearTimeout(fadeOut);
    };
  }, [onComplete]);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/90 z-50"
      style={{ opacity, transition: 'opacity 0.5s ease-out' }}
    >
      <pre className="text-green-400 font-mono text-sm md:text-base whitespace-pre">
        {CART_ASCII[frame]}
      </pre>
    </div>
  );
} 