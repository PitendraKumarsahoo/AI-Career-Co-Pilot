import React, { useEffect, useRef } from "react";

interface ConfettiCanvasProps {
  active: boolean;
  onComplete: () => void;
}

interface ConfettiParticle {
  x: number;
  y: number;
  size: number;
  color: string;
  speedX: number;
  speedY: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
}

export default function ConfettiCanvas({ active, onComplete }: ConfettiCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (canvas) {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
      }
    };

    window.addEventListener("resize", handleResize);

    // Color palette
    const colors = [
      "#38bdf8", // sky-400
      "#818cf8", // indigo-400
      "#a78bfa", // violet-400
      "#f472b6", // pink-400
      "#34d399", // emerald-400
      "#fbbf24", // amber-400
    ];

    const particles: ConfettiParticle[] = [];

    // Spawn burst of particles
    const spawnParticles = () => {
      // Spawn from sides/bottom-middle for a dramatic volcanic explosion!
      const count = 150;
      for (let i = 0; i < count; i++) {
        // Spawn around center-bottom or left-bottom/right-bottom
        const side = Math.random();
        let startX = width / 2;
        let startY = height + 10;
        let initialSpeedX = (Math.random() - 0.5) * 15;
        let initialSpeedY = -Math.random() * 20 - 15;

        if (side < 0.3) {
          // Left side
          startX = 0;
          startY = height * 0.7;
          initialSpeedX = Math.random() * 15 + 5;
          initialSpeedY = -Math.random() * 15 - 10;
        } else if (side < 0.6) {
          // Right side
          startX = width;
          startY = height * 0.7;
          initialSpeedX = -Math.random() * 15 - 5;
          initialSpeedY = -Math.random() * 15 - 10;
        }

        particles.push({
          x: startX,
          y: startY,
          size: Math.random() * 8 + 6,
          color: colors[Math.floor(Math.random() * colors.length)],
          speedX: initialSpeedX,
          speedY: initialSpeedY,
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 10,
          opacity: 1,
        });
      }
    };

    spawnParticles();

    // Gravity and drag forces
    const gravity = 0.4;
    const drag = 0.98;

    const updateAndDraw = () => {
      ctx.clearRect(0, 0, width, height);

      let activeCount = 0;

      particles.forEach((p) => {
        p.speedX *= drag;
        p.speedY += gravity;
        p.x += p.speedX;
        p.y += p.speedY;
        p.rotation += p.rotationSpeed;

        // Start fading when falling down
        if (p.speedY > 0) {
          p.opacity -= 0.008;
        }

        if (p.opacity > 0 && p.y < height + 20 && p.x > -20 && p.x < width + 20) {
          activeCount++;

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.globalAlpha = p.opacity;
          ctx.fillStyle = p.color;

          // Draw custom rectangle confetti
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size / 1.5);
          ctx.restore();
        }
      });

      if (activeCount > 0) {
        animationId = requestAnimationFrame(updateAndDraw);
      } else {
        onComplete();
      }
    };

    updateAndDraw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
    };
  }, [active, onComplete]);

  if (!active) return null;

  return (
    <canvas
      id="confetti-celebration-canvas"
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-[9999]"
    />
  );
}
