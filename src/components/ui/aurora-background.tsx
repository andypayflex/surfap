"use client";

import { cn } from "@/lib/utils";
import React, { ReactNode } from "react";

interface AuroraBackgroundProps extends React.HTMLProps<HTMLDivElement> {
  children: ReactNode;
  showRadialGradient?: boolean;
}

export const AuroraBackground = ({
  className,
  children,
  showRadialGradient = true,
  ...props
}: AuroraBackgroundProps) => {
  return (
    <main>
      <div
        className={cn(
          "relative flex flex-col items-center justify-center bg-zinc-950 text-zinc-200 transition-bg",
          className
        )}
        {...props}
      >
        <div className="absolute inset-0 overflow-hidden">
          <div
            className={cn(
              `pointer-events-none absolute -inset-[10px] opacity-50
              [--aurora:repeating-linear-gradient(100deg,#0c4a6e_10%,#0e7490_15%,#0891b2_20%,#06b6d4_25%,#22d3ee_30%)]
              [background-image:var(--aurora)]
              [background-size:300%,_200%]
              [background-position:50%_50%,50%_50%]
              filter blur-[10px]
              after:content-[''] after:absolute after:inset-0
              after:[background-image:var(--aurora)]
              after:[background-size:200%,_100%]
              after:animate-aurora after:mix-blend-difference
              after:[background-attachment:fixed]`,
              showRadialGradient &&
                `[mask-image:radial-gradient(ellipse_at_100%_0%,black_10%,transparent_70%)]`
            )}
          />
        </div>
        <div className="relative z-10">{children}</div>
      </div>
    </main>
  );
};
