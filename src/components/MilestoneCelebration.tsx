/**
 * Milestone celebration component — confetti + toast animation.
 */
import { useEffect, useState, useCallback } from 'react';

const CONFETTI_COLORS = [
  'hsl(230, 75%, 58%)', 'hsl(152, 60%, 38%)', 'hsl(38, 92%, 50%)',
  'hsl(330, 65%, 50%)', 'hsl(280, 60%, 55%)', 'hsl(0, 72%, 51%)',
];

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  color: string;
  rotation: number;
  scale: number;
  delay: number;
  shape: 'circle' | 'square' | 'star';
}

function generateConfetti(count: number): ConfettiPiece[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: -10 - Math.random() * 20,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    rotation: Math.random() * 360,
    scale: 0.5 + Math.random() * 0.8,
    delay: Math.random() * 0.5,
    shape: (['circle', 'square', 'star'] as const)[Math.floor(Math.random() * 3)],
  }));
}

const MILESTONE_MESSAGES: Record<number, { emoji: string; text: string }> = {
  25: { emoji: '🌱', text: 'Great start! 25% done!' },
  50: { emoji: '🔥', text: 'Halfway there! Keep going!' },
  75: { emoji: '⚡', text: 'Almost there! 75% complete!' },
  100: { emoji: '🎉', text: 'Goal reached! Amazing!' },
};

export function MilestoneCelebration({
  milestone,
  goalName,
  onDone,
}: {
  milestone: number;
  goalName: string;
  onDone: () => void;
}) {
  const [confetti] = useState(() => generateConfetti(50));
  const [show, setShow] = useState(true);
  const msg = MILESTONE_MESSAGES[milestone] ?? MILESTONE_MESSAGES[50];

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      setTimeout(onDone, 300);
    }, 3000);
    return () => clearTimeout(timer);
  }, [onDone]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none overflow-hidden">
      {/* Confetti */}
      {confetti.map((p) => (
        <div
          key={p.id}
          className="absolute animate-confetti-fall"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            animationDelay: `${p.delay}s`,
            transform: `rotate(${p.rotation}deg) scale(${p.scale})`,
          }}
        >
          {p.shape === 'circle' && (
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />
          )}
          {p.shape === 'square' && (
            <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: p.color }} />
          )}
          {p.shape === 'star' && (
            <span className="text-sm" style={{ color: p.color }}>✦</span>
          )}
        </div>
      ))}

      {/* Toast banner */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 pointer-events-auto">
        <div className="bg-card border border-border shadow-2xl rounded-2xl px-6 py-4 text-center animate-scale-in min-w-[260px]">
          <div className="text-4xl mb-2">{msg.emoji}</div>
          <p className="text-sm font-bold text-foreground">{msg.text}</p>
          <p className="text-xs text-muted-foreground mt-1">{goalName}</p>
        </div>
      </div>
    </div>
  );
}

/** Hook to queue and show milestone celebrations */
export function useMilestoneCelebration() {
  const [queue, setQueue] = useState<{ milestone: number; goalName: string }[]>([]);

  const celebrate = useCallback((milestones: number[], goalName: string) => {
    if (milestones.length === 0) return;
    // Show highest milestone
    const highest = Math.max(...milestones);
    setQueue((prev) => [...prev, { milestone: highest, goalName }]);
  }, []);

  const current = queue[0] ?? null;

  const dismiss = useCallback(() => {
    setQueue((prev) => prev.slice(1));
  }, []);

  return { current, celebrate, dismiss };
}
