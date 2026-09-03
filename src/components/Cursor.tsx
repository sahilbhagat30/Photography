"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useSpring, useMotionValue } from "framer-motion";

type CursorVariant = "default" | "hover" | "text" | "click" | "custom";

type CursorAnimation = {
  width: number;
  height: number;
  backgroundColor: string;
  opacity: number;
  borderColor?: string;
  borderRadius?: string;
  scale?: number;
};

export default function Cursor() {
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  // The ring lags slightly for a fluid feel, but remains critically damped
  const ringConfig   = { bounce: 0, duration: 0.3 };

  const ringX = useSpring(cursorX, ringConfig);
  const ringY = useSpring(cursorY, ringConfig);

  const [variant, setVariant] = useState<CursorVariant>("default");
  const [customText, setCustomText] = useState("");
  const [isVisible, setIsVisible] = useState(false);

  const rafRef = useRef<number | null>(null);
  const lastHoverTargetRef = useRef<EventTarget | null>(null);

  useEffect(() => {
    // Hide on touch devices
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const move = (e: MouseEvent) => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      const target = e.target as HTMLElement;
      const clientX = e.clientX;
      const clientY = e.clientY;

      rafRef.current = requestAnimationFrame(() => {
        cursorX.set(clientX);
        cursorY.set(clientY);
        setIsVisible(true);

        // Recompute the cursor style only when the hovered element changes.
        if (lastHoverTargetRef.current !== target) {
          lastHoverTargetRef.current = target;
          const customCursorEl = target.closest("[data-cursor]");
          if (customCursorEl) {
            const text = customCursorEl.getAttribute("data-cursor");
            if (text && text !== "hover") {
              setCustomText(text);
              setVariant("custom");
              return;
            }
          }

          const isLink = target.closest("a, button, [role='button'], [data-cursor='hover']");
          const isText = target.closest("p, h1, h2, h3, h4, span");
          const isCanvas = target.closest("canvas");

          if (isCanvas) setVariant("default");
          else if (isLink) setVariant("hover");
          else if (isText) setVariant("text");
          else setVariant("default");
        }
      });
    };

    const enter = () => setIsVisible(true);
    const leave = () => setIsVisible(false);

    const down = () => setVariant("click");
    const up = () => {
      lastHoverTargetRef.current = null;
      setVariant("default");
    };

    window.addEventListener("mousemove", move, { passive: true });
    window.addEventListener("mouseenter", enter);
    window.addEventListener("mouseleave", leave);
    window.addEventListener("mousedown",  down);
    window.addEventListener("mouseup",    up);

    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseenter", enter);
      window.removeEventListener("mouseleave", leave);
      window.removeEventListener("mousedown", down);
      window.removeEventListener("mouseup",   up);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [cursorX, cursorY]);

  const dotVariants: Record<CursorVariant, CursorAnimation> = {
    default: { width: 8,  height: 8,  backgroundColor: "#e5e7eb", opacity: 1 },
    hover:   { width: 12, height: 12, backgroundColor: "#ffffff", opacity: 1 },
    text:    { width: 4,  height: 24, backgroundColor: "#e5e7eb", borderRadius: "2px", opacity: 0.8 },
    click:   { width: 6,  height: 6,  backgroundColor: "#a3a3a3", opacity: 1 },
    custom:  { width: 0,  height: 0,  backgroundColor: "rgba(255,255,255,0)", opacity: 0 },
  };

  const ringVariants: Record<CursorVariant, CursorAnimation> = {
    default: { width: 36, height: 36, borderColor: "rgba(229,231,235,0.4)", backgroundColor: "rgba(3,5,15,0.35)", opacity: isVisible ? 1 : 0, scale: 1 },
    hover:   { width: 56, height: 56, borderColor: "rgba(255,255,255,0.5)", backgroundColor: "rgba(3,5,15,0.45)", opacity: isVisible ? 1 : 0, scale: 1 },
    text:    { width: 40, height: 40, borderColor: "rgba(234,230,225,0.4)", backgroundColor: "rgba(3,5,15,0.3)", opacity: isVisible ? 0.6 : 0, scale: 1 },
    click:   { width: 28, height: 28, borderColor: "rgba(163,163,163,0.8)", backgroundColor: "rgba(3,5,15,0.5)", opacity: isVisible ? 1 : 0, scale: 0.9 },
    custom:  { width: 72, height: 72, borderColor: "rgba(255,255,255,0.28)", backgroundColor: "rgba(3,5,15,0.78)", opacity: isVisible ? 1 : 0, scale: 1 },
  };

  if (typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches) {
    return null;
  }

  return (
    <>
      {/* Dot */}
      <motion.div
        style={{
          left: cursorX,
          top: cursorY,
          position: "fixed",
          pointerEvents: "none",
          zIndex: 9999,
          mixBlendMode: "normal",
          marginLeft: "-4px",
          marginTop: "-4px",
        }}
        animate={dotVariants[variant]}
        transition={{ type: "spring", bounce: 0, duration: 0.2 }}
        className="rounded-full shadow-sm"
      />

      {/* Ring / Custom Label */}
      <motion.div
        style={{
          left: ringX,
          top: ringY,
          position: "fixed",
          pointerEvents: "none",
          zIndex: 9998,
          marginLeft: variant === "custom" ? "-36px" : "-18px",
          marginTop: variant === "custom" ? "-36px" : "-18px",
        }}
        animate={ringVariants[variant]}
        transition={{ type: "spring", bounce: 0, duration: 0.3 }}
        className="flex items-center justify-center rounded-full border"
      >
        {variant === "custom" && (
          <motion.span
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="text-[10px] font-semibold tracking-widest text-white uppercase relative z-10"
          >
            {customText}
          </motion.span>
        )}
      </motion.div>
    </>
  );
}
