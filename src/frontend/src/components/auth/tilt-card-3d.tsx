"use client";

import React, { useRef, useState, useCallback } from "react";

interface TiltCard3DProps {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number;
  glareOpacity?: number;
}

export function TiltCard3D({
  children,
  className = "",
  maxTilt = 8,
  glareOpacity = 0.2,
}: TiltCard3DProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({
    transform: "perspective(1100px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)",
    transition: "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.5s ease",
  });
  const [glareStyle, setGlareStyle] = useState<React.CSSProperties>({
    opacity: 0,
    background: "radial-gradient(circle at 50% 50%, rgba(163, 217, 210, 0.25), transparent 75%)",
  });

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const normX = (x / rect.width - 0.5) * 2; // -1 to 1
      const normY = (y / rect.height - 0.5) * 2; // -1 to 1

      const rotateY = normX * maxTilt;
      const rotateX = -normY * maxTilt;

      const glareX = (x / rect.width) * 100;
      const glareY = (y / rect.height) * 100;

      setStyle({
        transform: `perspective(1100px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.015, 1.015, 1.015)`,
        transition: "transform 0.1s ease-out, box-shadow 0.2s ease",
      });

      setGlareStyle({
        opacity: glareOpacity,
        background: `radial-gradient(circle 380px at ${glareX.toFixed(1)}% ${glareY.toFixed(1)}%, rgba(163, 217, 210, 0.25), transparent 75%)`,
        transition: "opacity 0.2s ease",
      });
    },
    [maxTilt, glareOpacity]
  );

  const handleMouseLeave = useCallback(() => {
    setStyle({
      transform: "perspective(1100px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)",
      transition: "transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.5s ease",
    });
    setGlareStyle({
      opacity: 0,
      background: "radial-gradient(circle at 50% 50%, rgba(163, 217, 210, 0.25), transparent 75%)",
      transition: "opacity 0.4s ease",
    });
  }, []);

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative will-change-transform ${className}`}
      style={{
        ...style,
        transformStyle: "preserve-3d",
      }}
    >
      {/* Specular 3D Glare Sheen Layer */}
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none z-30 overflow-hidden mix-blend-screen"
        style={glareStyle}
      />
      {children}
    </div>
  );
}
