import { useEffect, useRef, useState } from 'react';
import { Player } from '@/types/game';
import LoadingAnimation from './LoadingAnimation';

interface AudienceVisualizationProps {
  players: Player[];
  totalAudience: number;
}

export default function AudienceVisualization({ players, totalAudience }: AudienceVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = window.innerWidth;
    canvas.height = 200; // Fixed height for audience visualization

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate silhouette size based on audience size
    const baseSize = 20;
    const scale = Math.min(1, 1000 / totalAudience);
    const silhouetteSize = baseSize * scale;

    // Draw silhouettes
    const rows = Math.ceil(totalAudience / 20);
    const spacing = canvas.width / 20;

    // Animate silhouettes appearing
    let currentRow = 0;
    const animateRow = () => {
      if (currentRow >= rows) return;

      for (let col = 0; col < 20; col++) {
        const x = col * spacing + spacing / 2;
        const y = currentRow * (silhouetteSize * 1.5) + silhouetteSize;

        // Draw silhouette with fade-in effect
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.beginPath();
        ctx.arc(x, y, silhouetteSize / 2, 0, Math.PI * 2);
        ctx.fill();

        // Draw head
        ctx.beginPath();
        ctx.arc(x, y - silhouetteSize / 4, silhouetteSize / 3, 0, Math.PI * 2);
        ctx.fill();

        // Draw shoulders
        ctx.beginPath();
        ctx.moveTo(x - silhouetteSize / 2, y);
        ctx.lineTo(x + silhouetteSize / 2, y);
        ctx.lineTo(x + silhouetteSize / 3, y + silhouetteSize / 2);
        ctx.lineTo(x - silhouetteSize / 3, y + silhouetteSize / 2);
        ctx.closePath();
        ctx.fill();
      }

      currentRow++;
      if (currentRow < rows) {
        setTimeout(animateRow, 100);
      } else {
        // After all silhouettes are drawn, highlight cohort members
        highlightCohorts();
      }
    };

    const highlightCohorts = () => {
      players.forEach((player) => {
        if (player.role === 'cohort_100') {
          const row = Math.floor(players.indexOf(player) / 20);
          const col = players.indexOf(player) % 20;
          const x = col * spacing + spacing / 2;
          const y = row * (silhouetteSize * 1.5) + silhouetteSize;

          // Add glow effect
          ctx.shadowColor = '#FFD700';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(x, y, silhouetteSize / 2 + 5, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });
    };

    // Start animation
    animateRow();
  }, [players, totalAudience]);

  if (isLoading) {
    return <LoadingAnimation onComplete={() => setIsLoading(false)} />;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 h-[200px] bg-gradient-to-t from-black/80 to-transparent pointer-events-none">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
      />
    </div>
  );
} 