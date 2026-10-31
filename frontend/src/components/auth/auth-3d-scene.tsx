"use client";

import React, { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  size: number;
  alpha: number;
  hue: string;
}

interface Auth3DSceneProps {
  position?: "left" | "right";
}

export function Auth3DScene({ position = "right" }: Auth3DSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const positionRef = useRef(position);
  const currentCenterXRef = useRef<number | null>(null);

  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    const handleMouseMove = (e: MouseEvent) => {
      const nx = (e.clientX / width - 0.5) * 2;
      const ny = (e.clientY / height - 0.5) * 2;
      mouseRef.current.targetX = nx * 0.35;
      mouseRef.current.targetY = ny * 0.25;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    // Floating stardust embers that orbit near the infinity curve
    const PARTICLE_COUNT = 90;
    const particles: Particle[] = [];
    const hues = ["#52E5D0", "#A3D9D2", "#287D73", "#FFFFFF", "#47B5A4"];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: (Math.random() - 0.5) * 800,
        y: (Math.random() - 0.5) * 600,
        z: (Math.random() - 0.5) * 600,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        vz: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2 + 0.8,
        alpha: Math.random() * 0.7 + 0.3,
        hue: hues[Math.floor(Math.random() * hues.length)],
      });
    }

    const FOV = 520;
    let time = 0;

    // 3D Perspective Projection with Euler rotation (Yaw, Pitch, Roll)
    const project = (
      x: number,
      y: number,
      z: number,
      rotX: number,
      rotY: number,
      rotZ: number,
      cx: number,
      cy: number
    ) => {
      // Rotate around Z axis (Roll)
      const cosZ = Math.cos(rotZ);
      const sinZ = Math.sin(rotZ);
      const x0 = x * cosZ - y * sinZ;
      const y0 = x * sinZ + y * cosZ;

      // Rotate around Y axis (Yaw)
      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);
      const x1 = x0 * cosY + z * sinY;
      const z1 = -x0 * sinY + z * cosY;

      // Rotate around X axis (Pitch)
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);
      const y2 = y0 * cosX - z1 * sinX;
      const z2 = y0 * sinX + z1 * cosX;

      const cameraDist = 650;
      const totalZ = z2 + cameraDist;
      if (totalZ <= 10) return null;

      const scale = FOV / totalZ;
      return {
        sx: cx + x1 * scale,
        sy: cy + y2 * scale,
        scale,
        depth: z2,
      };
    };

    const render = () => {
      time += 0.016;

      // Smooth camera interpolation
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;

      ctx.clearRect(0, 0, width, height);

      // On desktop, position can be "left" (30% width) or "right" (70% width)
      const isDesktop = width >= 768;
      const targetLoopCenterX = isDesktop
        ? positionRef.current === "right"
          ? width * 0.70
          : width * 0.30
        : width * 0.5;

      if (currentCenterXRef.current === null) {
        currentCenterXRef.current = targetLoopCenterX;
      } else {
        currentCenterXRef.current += (targetLoopCenterX - currentCenterXRef.current) * 0.055;
      }

      const loopCenterX = currentCenterXRef.current;
      const loopCenterY = height * 0.5;

      // Dimensional scale of the infinity lemniscate
      const loopScale = isDesktop ? Math.min(width * 0.28, 360) : Math.min(width * 0.42, 280);
      const Rx = loopScale;
      const Ry = loopScale * 0.62;
      const Rz = loopScale * 0.72;

      // Slow majestic 3D tumble
      const rotY = mouseRef.current.x + time * 0.22;
      const rotX = mouseRef.current.y + Math.sin(time * 0.28) * 0.25 - 0.15;
      const rotZ = Math.cos(time * 0.18) * 0.12;

      // -------------------------------------------------------------
      // 1. GENERATE THE 3D BRIGHT INFINITY CURVE SAMPLES
      // -------------------------------------------------------------
      const SAMPLES = 280;
      type PointSample = {
        u: number;
        x: number;
        y: number;
        z: number;
        projCenter: { sx: number; sy: number; scale: number; depth: number };
        projLeft: { sx: number; sy: number; scale: number; depth: number };
        projRight: { sx: number; sy: number; scale: number; depth: number };
      };

      const curvePoints: PointSample[] = [];

      for (let i = 0; i < SAMPLES; i++) {
        const u = (i / SAMPLES) * Math.PI * 2;

        // 3D Infinity Lemniscate formula:
        // x = Rx * sin(u)
        // y = Ry * sin(2u)
        // z = Rz * cos(u)
        const cx = Rx * Math.sin(u);
        const cy = Ry * Math.sin(2 * u);
        const cz = Rz * Math.cos(u);

        // Ribbon width offsets
        const ribbonWidth = 14;
        const lx = cx - ribbonWidth * Math.cos(u);
        const ly = cy;
        const lz = cz + ribbonWidth * Math.sin(u);

        const rx = cx + ribbonWidth * Math.cos(u);
        const ry = cy;
        const rz = cz - ribbonWidth * Math.sin(u);

        const pCenter = project(cx, cy, cz, rotX, rotY, rotZ, loopCenterX, loopCenterY);
        const pLeft = project(lx, ly, lz, rotX, rotY, rotZ, loopCenterX, loopCenterY);
        const pRight = project(rx, ry, rz, rotX, rotY, rotZ, loopCenterX, loopCenterY);

        if (pCenter && pLeft && pRight) {
          curvePoints.push({
            u,
            x: cx,
            y: cy,
            z: cz,
            projCenter: pCenter,
            projLeft: pLeft,
            projRight: pRight,
          });
        }
      }

      // -------------------------------------------------------------
      // 2. DRAW VOLUMETRIC LUMINOUS GLOW (ADDITIVE COMPOSITING)
      // -------------------------------------------------------------
      ctx.save();
      ctx.globalCompositeOperation = "lighter";

      // Pass A: Wide Neon Ambient Bloom
      if (curvePoints.length > 2) {
        ctx.beginPath();
        for (let i = 0; i < curvePoints.length; i++) {
          const pt = curvePoints[i].projCenter;
          if (i === 0) ctx.moveTo(pt.sx, pt.sy);
          else ctx.lineTo(pt.sx, pt.sy);
        }
        ctx.closePath();
        ctx.strokeStyle = "rgba(40, 125, 115, 0.45)";
        ctx.lineWidth = 18;
        ctx.lineJoin = "round";
        ctx.stroke();

        // Pass B: Intense Radiant Cyan Core
        ctx.beginPath();
        for (let i = 0; i < curvePoints.length; i++) {
          const pt = curvePoints[i].projCenter;
          if (i === 0) ctx.moveTo(pt.sx, pt.sy);
          else ctx.lineTo(pt.sx, pt.sy);
        }
        ctx.closePath();
        ctx.strokeStyle = "rgba(82, 229, 208, 0.85)";
        ctx.lineWidth = 6;
        ctx.stroke();

        // Pass C: Incandescent White Laser Filament
        ctx.beginPath();
        for (let i = 0; i < curvePoints.length; i++) {
          const pt = curvePoints[i].projCenter;
          if (i === 0) ctx.moveTo(pt.sx, pt.sy);
          else ctx.lineTo(pt.sx, pt.sy);
        }
        ctx.closePath();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.95)";
        ctx.lineWidth = 2.2;
        ctx.stroke();

        // Pass D: Parallel Cyber Ribbon Strands (Lateral rails)
        ctx.beginPath();
        for (let i = 0; i < curvePoints.length; i++) {
          const pt = curvePoints[i].projLeft;
          if (i === 0) ctx.moveTo(pt.sx, pt.sy);
          else ctx.lineTo(pt.sx, pt.sy);
        }
        ctx.closePath();
        ctx.strokeStyle = "rgba(163, 217, 210, 0.35)";
        ctx.lineWidth = 1.4;
        ctx.stroke();

        ctx.beginPath();
        for (let i = 0; i < curvePoints.length; i++) {
          const pt = curvePoints[i].projRight;
          if (i === 0) ctx.moveTo(pt.sx, pt.sy);
          else ctx.lineTo(pt.sx, pt.sy);
        }
        ctx.closePath();
        ctx.strokeStyle = "rgba(163, 217, 210, 0.35)";
        ctx.lineWidth = 1.4;
        ctx.stroke();

        // Cross-rungs along the 3D ribbon
        for (let i = 0; i < curvePoints.length; i += 7) {
          const l = curvePoints[i].projLeft;
          const r = curvePoints[i].projRight;
          ctx.beginPath();
          ctx.moveTo(l.sx, l.sy);
          ctx.lineTo(r.sx, r.sy);
          ctx.strokeStyle = `rgba(163, 217, 210, ${(0.4 * l.scale).toFixed(2)})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      // -------------------------------------------------------------
      // 3. FAST RACING HYPER-BRIGHT PHOTON PULSES (Continuous Loop)
      // -------------------------------------------------------------
      const NUM_PULSES = 5;
      for (let p = 0; p < NUM_PULSES; p++) {
        // Pulse offset along normalized track [0..1]
        const pulseProgress = (time * 0.45 + p / NUM_PULSES) % 1.0;
        const targetSampleIndex = Math.floor(pulseProgress * (curvePoints.length - 1));
        const headPoint = curvePoints[targetSampleIndex];

        if (headPoint) {
          const pt = headPoint.projCenter;
          const pulseRadius = Math.max(3, 8 * pt.scale);

          // Glowing Halo around the traveling photon head
          const grad = ctx.createRadialGradient(
            pt.sx,
            pt.sy,
            0,
            pt.sx,
            pt.sy,
            pulseRadius * 4.5
          );
          grad.addColorStop(0, "rgba(255, 255, 255, 1)");
          grad.addColorStop(0.25, "rgba(82, 229, 208, 0.85)");
          grad.addColorStop(0.65, "rgba(40, 125, 115, 0.4)");
          grad.addColorStop(1, "rgba(40, 125, 115, 0)");

          ctx.beginPath();
          ctx.arc(pt.sx, pt.sy, pulseRadius * 4.5, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.fill();

          // Intense White Core
          ctx.beginPath();
          ctx.arc(pt.sx, pt.sy, pulseRadius * 0.9, 0, Math.PI * 2);
          ctx.fillStyle = "#FFFFFF";
          ctx.fill();

          // Luminous Comet Tail trailing behind the pulse
          const TRAIL_LENGTH = 28;
          for (let t = 1; t <= TRAIL_LENGTH; t++) {
            const trailIndex =
              (targetSampleIndex - t + curvePoints.length) % curvePoints.length;
            const trailPt = curvePoints[trailIndex]?.projCenter;
            if (trailPt) {
              const trailAlpha = (1 - t / TRAIL_LENGTH) * 0.8;
              ctx.beginPath();
              ctx.arc(
                trailPt.sx,
                trailPt.sy,
                Math.max(1, (pulseRadius * (1 - t / TRAIL_LENGTH) * 0.85)),
                0,
                Math.PI * 2
              );
              ctx.fillStyle = `rgba(163, 217, 210, ${trailAlpha.toFixed(2)})`;
              ctx.fill();
            }
          }
        }
      }

      // -------------------------------------------------------------
      // 4. FLOATING STARDUST EMBERS
      // -------------------------------------------------------------
      particles.forEach((part) => {
        part.x += part.vx;
        part.y += part.vy;
        part.z += part.vz;

        if (Math.abs(part.x) > 450) part.vx *= -1;
        if (Math.abs(part.y) > 350) part.vy *= -1;
        if (Math.abs(part.z) > 350) part.vz *= -1;

        const proj = project(
          part.x,
          part.y,
          part.z,
          rotX * 0.7,
          rotY * 0.7,
          rotZ * 0.7,
          loopCenterX,
          loopCenterY
        );

        if (proj) {
          const r = Math.max(0.8, part.size * proj.scale);
          ctx.beginPath();
          ctx.arc(proj.sx, proj.sy, r, 0, Math.PI * 2);
          ctx.fillStyle = part.hue;
          ctx.globalAlpha = Math.min(1, Math.max(0.15, part.alpha * proj.scale));
          ctx.fill();
        }
      });

      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 select-none">
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{
          filter: "drop-shadow(0 0 35px rgba(82, 229, 208, 0.35))",
        }}
      />
      {/* Subtle atmospheric vignette framing */}
      <div className="absolute inset-0 bg-radial from-transparent via-[#070E13]/30 to-[#070E13]/85 pointer-events-none" />
    </div>
  );
}
