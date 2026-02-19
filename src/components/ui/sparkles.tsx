"use client";

import React, { useId, useMemo } from "react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface SparklesProps {
  className?: string;
  size?: number;
  count?: number;
  color?: string;
}

interface Sparkle {
  id: string;
  x: string;
  y: string;
  size: number;
  delay: number;
  duration: number;
}

export function Sparkles({
  className = "",
  size = 4,
  count = 20,
  color = "#22d3ee",
}: SparklesProps) {
  const generatedId = useId();
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);

  const generateSparkles = useMemo(
    () => () =>
      Array.from({ length: count }, (_, i) => ({
        id: `${generatedId}-${i}`,
        x: `${Math.random() * 100}%`,
        y: `${Math.random() * 100}%`,
        size: Math.random() * size + size / 2,
        delay: Math.random() * 2,
        duration: Math.random() * 2 + 1,
      })),
    [count, size, generatedId]
  );

  useEffect(() => {
    setSparkles(generateSparkles());
  }, [generateSparkles]);

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {sparkles.map((sparkle) => (
        <motion.div
          key={sparkle.id}
          className="absolute rounded-full"
          style={{
            left: sparkle.x,
            top: sparkle.y,
            width: sparkle.size,
            height: sparkle.size,
            backgroundColor: color,
          }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1, 0],
          }}
          transition={{
            duration: sparkle.duration,
            delay: sparkle.delay,
            repeat: Infinity,
            repeatDelay: Math.random() * 3,
          }}
        />
      ))}
    </div>
  );
}
