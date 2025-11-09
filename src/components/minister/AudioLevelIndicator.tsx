import { useEffect, useRef } from 'react';

interface AudioLevelIndicatorProps {
  level: number; // 0-100
  size?: number;
}

export const AudioLevelIndicator = ({ level, size = 80 }: AudioLevelIndicatorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const barCount = 32;
    const maxBarHeight = 60;
    const minBarHeight = 10;
    const angleStep = (Math.PI * 2) / barCount;
    const baseRadius = size / 2;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw bars around circle
    for (let i = 0; i < barCount; i++) {
      const angle = angleStep * i - Math.PI / 2;
      
      // Add some variation to make it more dynamic
      const variation = Math.sin(Date.now() / 200 + i) * 0.3;
      const normalizedLevel = (level / 100) * (1 + variation);
      const barHeight = minBarHeight + (maxBarHeight - minBarHeight) * normalizedLevel;
      
      const startX = centerX + Math.cos(angle) * baseRadius;
      const startY = centerY + Math.sin(angle) * baseRadius;
      const endX = centerX + Math.cos(angle) * (baseRadius + barHeight);
      const endY = centerY + Math.sin(angle) * (baseRadius + barHeight);

      // Color based on level
      const hue = 180 + (level / 100) * 60; // From cyan to yellow-green
      const saturation = 70 + (level / 100) * 30;
      const lightness = 50 + (level / 100) * 20;
      
      ctx.strokeStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${0.6 + normalizedLevel * 0.4})`;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    }

    // Draw glow effect in center
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, baseRadius);
    const glowIntensity = level / 100;
    gradient.addColorStop(0, `rgba(0, 170, 255, ${glowIntensity * 0.3})`);
    gradient.addColorStop(0.5, `rgba(0, 170, 255, ${glowIntensity * 0.15})`);
    gradient.addColorStop(1, 'rgba(0, 170, 255, 0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

  }, [level, size]);

  useEffect(() => {
    let animationFrame: number;
    
    const animate = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const barCount = 32;
      const maxBarHeight = 60;
      const minBarHeight = 10;
      const angleStep = (Math.PI * 2) / barCount;
      const baseRadius = size / 2;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < barCount; i++) {
        const angle = angleStep * i - Math.PI / 2;
        
        const variation = Math.sin(Date.now() / 200 + i) * 0.3;
        const normalizedLevel = (level / 100) * (1 + variation);
        const barHeight = minBarHeight + (maxBarHeight - minBarHeight) * normalizedLevel;
        
        const startX = centerX + Math.cos(angle) * baseRadius;
        const startY = centerY + Math.sin(angle) * baseRadius;
        const endX = centerX + Math.cos(angle) * (baseRadius + barHeight);
        const endY = centerY + Math.sin(angle) * (baseRadius + barHeight);

        const hue = 180 + (level / 100) * 60;
        const saturation = 70 + (level / 100) * 30;
        const lightness = 50 + (level / 100) * 20;
        
        ctx.strokeStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${0.6 + normalizedLevel * 0.4})`;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
      }

      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, baseRadius);
      const glowIntensity = level / 100;
      gradient.addColorStop(0, `rgba(0, 170, 255, ${glowIntensity * 0.3})`);
      gradient.addColorStop(0.5, `rgba(0, 170, 255, ${glowIntensity * 0.15})`);
      gradient.addColorStop(1, 'rgba(0, 170, 255, 0)');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (level > 0) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    if (level > 0) {
      animate();
    }

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [level, size]);

  const canvasSize = size * 3;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <canvas
        ref={canvasRef}
        width={canvasSize}
        height={canvasSize}
        className="absolute"
        style={{
          width: `${canvasSize}px`,
          height: `${canvasSize}px`,
        }}
      />
    </div>
  );
};
