"use client";

import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface CardSpotlightProps extends React.HTMLProps<HTMLDivElement> {
  radius?: number;
  color?: string;
  children: React.ReactNode;
}

export function CardSpotlight({
  children,
  radius = 200,
  color = "rgba(14, 116, 144, 0.15)",
  className,
  ...props
}: CardSpotlightProps) {
  const divRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/80 backdrop-blur-sm p-6",
        className
      )}
      {...props}
    >
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition duration-300"
        style={{
          background: `radial-gradient(${radius}px circle at ${position.x}px ${position.y}px, ${color}, transparent 80%)`,
        }}
        animate={{ opacity: isHovered ? 1 : 0 }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
