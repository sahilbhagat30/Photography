"use client";

import { ReactNode, useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default function LenisProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Disable Lenis on touch devices (iOS/Android) — native momentum scroll is better
    // and Lenis can conflict with iOS Safari's touch handling and break sticky scroll
    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    if (isTouch) return;

    gsap.registerPlugin(ScrollTrigger);

    const lenis = new Lenis({
      lerp: 0.05, // Buttery smooth linear interpolation
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1,
    });

    // Sync Lenis with GSAP ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update);

    function raf(time: number) {
      lenis.raf(time * 1000); // GSAP passes time in seconds, Lenis expects ms
    }

    gsap.ticker.add(raf);
    // Disable GSAP's lag smoothing to avoid conflicts with Lenis
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
