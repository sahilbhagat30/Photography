"use client";

import {
  Fragment,
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type WheelEvent as ReactWheelEvent,
} from "react";
import {
  AnimatePresence,
  MotionConfig,
  motion,
  type PanInfo,
} from "framer-motion";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import Image from "next/image";
import Link from "next/link";
import type { PhotoData } from "@/utils/getPhotos";

const EASE = [0.77, 0, 0.175, 1] as const;
const APPLE_SPRING = { type: "spring", bounce: 0, duration: 0.4 } as const;
const PRESS_SPRING = { type: "spring", stiffness: 700, damping: 45 } as const;

function projectMomentum(velocity: number, decelerationRate = 0.998) {
  return (velocity / 1000) * decelerationRate / (1 - decelerationRate);
}

function photoAspectRatio(photo: PhotoData) {
  return `${photo.width} / ${photo.height}`;
}

function cardSize(photo: PhotoData) {
  return photo.width >= photo.height
    ? "w-full max-h-full"
    : "h-[112%] max-w-full";
}

function desktopOffset(index: number) {
  const openingOffsets = ["-21vh", "-4vh", "-5vh", "-21vh", "-10vh", "8vh", "3vh", "-18vh"];
  if (index < openingOffsets.length) return openingOffsets[index];
  return ["-12vh", "8vh", "-15vh", "8vh", "-15vh"][(index - 8) % 5];
}

function mobileOffset(index: number) {
  if (index === 2 || index === 3) return "17vh";
  return ["-3vh", "6vh", "5vh", "-4vh"][index % 4];
}

function GalleryPhoto({
  photo,
  index,
  isInitialBatch,
  onSelect,
}: {
  photo: PhotoData;
  index: number;
  isInitialBatch: boolean;
  onSelect: () => void;
}) {
  const cellStyle = {
    "--desktop-offset": desktopOffset(index),
    "--mobile-offset": mobileOffset(index),
  } as CSSProperties;

  return (
    <div
      className="flex h-full items-start justify-center [transform:translateY(var(--mobile-offset))] md:[transform:translateY(var(--desktop-offset))]"
      style={cellStyle}
    >
      <button
        type="button"
        onClick={onSelect}
        className={`deal-card group relative block overflow-hidden bg-black/5 ${isInitialBatch ? "opacity-0 initial-card" : "opacity-100"} ${cardSize(photo)}`}
        style={{ aspectRatio: photoAspectRatio(photo) }}
        aria-label={`View ${photo.alt}`}
        data-cursor="View"
      >
        <Image
          src={photo.src}
          alt={photo.alt}
          fill
          sizes="(max-width: 767px) 52vw, 20vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.025] group-active:scale-[0.985] group-active:duration-100"
          quality={85}
          loading={index < 12 ? "eager" : "lazy"}
        />
        <span className="absolute inset-0 bg-[#f5f3f0]/0 transition-colors duration-500 group-hover:bg-[#f5f3f0]/10" />
      </button>
    </div>
  );
}

function Thumbnail({
  photo,
  active,
  onClick,
}: {
  photo: PhotoData;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-active={active ? "true" : "false"}
      aria-label={`Show ${photo.alt}`}
      aria-current={active ? "true" : undefined}
      className={`focus-thumbnail relative shrink-0 overflow-hidden transition-transform duration-500 active:scale-[0.96] ${
        active
          ? "md:translate-x-[72px]"
          : "hover:translate-x-1"
      } ${photo.width >= photo.height ? "w-24" : "w-14 md:w-24"}`}
      style={{ aspectRatio: photoAspectRatio(photo) }}
    >
      <Image
        src={photo.src}
        alt=""
        fill
        sizes="96px"
        className="object-cover"
        quality={75}
      />
    </button>
  );
}

function FocusView({
  photos,
  index,
  onClose,
  onSelect,
  onStep,
}: {
  photos: PhotoData[];
  index: number;
  onClose: () => void;
  onSelect: (index: number) => void;
  onStep: (distance: number) => void;
}) {
  const railRef = useRef<HTMLDivElement>(null);
  const firstSelectionRef = useRef(true);
  const wheelAccumulatorRef = useRef(0);
  const wheelEndTimerRef = useRef<number | null>(null);
  const photo = photos[index];

  const selectNext = useCallback(() => {
    onStep(1);
  }, [onStep]);

  const selectPrevious = useCallback(() => {
    onStep(-1);
  }, [onStep]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        selectNext();
      }
      if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        selectPrevious();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, selectNext, selectPrevious]);

  useEffect(() => {
    return () => {
      if (wheelEndTimerRef.current !== null) {
        window.clearTimeout(wheelEndTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      railRef.current
        ?.querySelector<HTMLElement>("[data-active='true']")
        ?.scrollIntoView({
          behavior: firstSelectionRef.current ? "auto" : "smooth",
          block: "center",
          inline: "center",
        });
      firstSelectionRef.current = false;
    });

    return () => cancelAnimationFrame(frame);
  }, [index]);

  const handleWheel = useCallback((event: ReactWheelEvent<HTMLDivElement>) => {
    event.preventDefault();

    const multiplier = event.deltaMode === 1
      ? 16
      : event.deltaMode === 2
        ? window.innerHeight
        : 1;

    wheelAccumulatorRef.current += event.deltaY * multiplier;

    const stepThreshold = 100;
    const rawSteps = Math.trunc(wheelAccumulatorRef.current / stepThreshold);

    if (rawSteps !== 0) {
      const steps = Math.max(-4, Math.min(4, rawSteps));
      wheelAccumulatorRef.current -= steps * stepThreshold;
      onStep(steps);
    }

    if (wheelEndTimerRef.current !== null) {
      window.clearTimeout(wheelEndTimerRef.current);
    }

    // Discard a partial step when the wheel or trackpad gesture goes quiet.
    wheelEndTimerRef.current = window.setTimeout(() => {
      wheelAccumulatorRef.current = 0;
    }, 160);
  }, [onStep]);

  const handlePhotoDragEnd = useCallback((
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    const projectedDistance = info.offset.y + projectMomentum(info.velocity.y);
    if (Math.abs(projectedDistance) < 55) return;

    const intent = Math.abs(info.velocity.y) > 120
      ? info.velocity.y
      : info.offset.y;
    const steps = Math.max(
      1,
      Math.min(4, Math.round(Math.abs(projectedDistance) / 180)),
    );

    onStep(intent < 0 ? steps : -steps);
  }, [onStep]);

  return (
    <motion.div
      key="focus-view"
      initial={{ opacity: 0, scale: 0.995 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.995 }}
      transition={APPLE_SPRING}
      className="fixed inset-0 z-[110] bg-[#f5f3f0] text-[#0c0c0c]"
      role="dialog"
      aria-modal="true"
      aria-label={`Viewing ${photo.alt}`}
      onWheel={handleWheel}
    >
      <motion.button
        type="button"
        onClick={onClose}
        whileTap={{ scale: 0.88 }}
        transition={PRESS_SPRING}
        className="absolute left-1/2 top-2 z-[130] flex size-12 -translate-x-1/2 items-center justify-center md:top-3"
        aria-label="Close photo"
        data-cursor="hover"
      >
        <span className="absolute h-[2px] w-7 bg-[#0c0c0c]" />
        <span className="absolute h-7 w-[2px] bg-[#0c0c0c]" />
      </motion.button>

      <div className="relative flex h-full flex-col md:block">
        <div
          ref={railRef}
          className="order-2 flex h-28 shrink-0 items-center gap-3 overflow-x-auto px-5 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:absolute md:inset-y-0 md:left-0 md:z-20 md:h-auto md:w-52 md:flex-col md:items-start md:gap-5 md:overflow-x-hidden md:overflow-y-auto md:px-0 md:py-0 md:pl-5 md:[scroll-padding-block:45vh]"
        >
          {photos.map((item, photoIndex) => (
            <Thumbnail
              key={item.src}
              photo={item}
              active={photoIndex === index}
              onClick={() => onSelect(photoIndex)}
            />
          ))}
        </div>

        <div className="relative order-1 flex min-h-0 flex-1 items-center justify-center px-5 pb-4 pt-16 md:absolute md:inset-0 md:px-[19vw] md:pb-16 md:pt-16">
          <div className="relative h-full w-full">
            <AnimatePresence initial={false}>
              <motion.div
                key={photo.src}
                initial={{ opacity: 0, scale: 0.99 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.005 }}
                transition={APPLE_SPRING}
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={0.18}
                dragSnapToOrigin
                dragTransition={{ bounceStiffness: 700, bounceDamping: 45 }}
                onDragEnd={handlePhotoDragEnd}
                whileTap={{ scale: 0.995 }}
                className="absolute inset-0"
                style={{ touchAction: "none" }}
                data-cursor="Drag"
              >
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  sizes="(max-width: 767px) 100vw, calc(100vw - 180px)"
                  className="object-contain"
                  quality={85}
                  preload
                  draggable={false}
                />
              </motion.div>
            </AnimatePresence>
          </div>

          <motion.button
            type="button"
            onClick={onClose}
            whileTap={{ scale: 0.94 }}
            transition={PRESS_SPRING}
            className="absolute bottom-3 left-1/2 -translate-x-1/2 text-base font-black uppercase tracking-[-0.04em] transition-opacity hover:opacity-40 md:bottom-4 md:text-2xl"
          >
            Back
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

export default function PhotographyClient({ photos }: { photos: PhotoData[] }) {
  const [focusIndex, setFocusIndex] = useState<number | null>(null);
  const [navOpen, setNavOpen] = useState(false);
  const [multiplier, setMultiplier] = useState(1);
  const gridRef = useRef<HTMLElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const closeFocus = useCallback(() => setFocusIndex(null), []);
  const selectPhoto = useCallback((index: number) => setFocusIndex(index), []);
  const stepPhoto = useCallback((distance: number) => {
    setFocusIndex((current) => {
      if (current === null) return null;
      return (current + distance % photos.length + photos.length) % photos.length;
    });
  }, [photos.length]);

  useGSAP(
    () => {
      if (!gridRef.current) return;

      const cards = gsap.utils.toArray<HTMLElement>(".initial-card", gridRef.current);
      const title = gridRef.current.querySelector<HTMLElement>(".giant-name");
      const menuTrigger = document.querySelector<HTMLElement>(".menu-trigger");
      const intro = introRef.current;
      const introPhotos = intro
        ? gsap.utils.toArray<HTMLElement>(".intro-photo", intro)
        : [];
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (reduceMotion) {
        gsap.set(cards, { opacity: 1 });
        gsap.set(title, { opacity: 1 });
        gsap.set(menuTrigger, { opacity: 1 });
        gsap.set(intro, { display: "none" });
        return;
      }

      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;

      cards.forEach((card, index) => {
        const rect = card.getBoundingClientRect();
        gsap.set(card, {
          x: centerX - (rect.left + rect.width / 2),
          y: centerY - (rect.top + rect.height / 2),
          rotation: ((index % 7) - 3) * 1.25,
          scale: 0.72,
          opacity: 0,
          filter: "blur(12px)",
          zIndex: cards.length - index,
          willChange: "transform",
        });
      });

      gsap.set([title, menuTrigger], { opacity: 0 });

      const timeline = gsap.timeline({ delay: 0.28 });
      timeline
        .to(intro, { opacity: 1, duration: 0.35, ease: "power2.out" }, 0)
        .to(introPhotos, {
          opacity: 1,
          filter: "blur(0px)",
          scale: 1,
          duration: 0.75,
          stagger: 0.07,
          ease: "power3.out",
        }, 0.2)
        .fromTo(
          title,
          { opacity: 0 },
          { opacity: 1, duration: 0.7, ease: "power2.out" },
          1.7,
        )
        .to(
          cards,
          {
            x: 0,
            y: 0,
            rotation: 0,
            scale: 1,
            opacity: 1,
            filter: "blur(0px)",
            duration: 1.35,
            stagger: 0.035,
            ease: "expo.inOut",
            onComplete: () => {
              gsap.set(cards, { clearProps: "transform,zIndex,willChange,filter" });
            },
          },
          0.82,
        )
        .to(intro, { opacity: 0, duration: 0.35, ease: "power2.out" }, 0.82)
        .set(intro, { display: "none" }, 1.2)
        .to(menuTrigger, { opacity: 1, duration: 0.45, ease: "power2.out" }, 1.55);

      return () => timeline.kill();
    },
    { scope: gridRef },
  );

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    if (focusIndex !== null || navOpen) document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [focusIndex, navOpen]);

  useEffect(() => {
    if (!navOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setNavOpen(false);
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [navOpen]);

  useEffect(() => {
    if (!bottomRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setMultiplier((prev) => prev + 1);
        }
      },
      { rootMargin: "3500px 0px" }
    );

    observer.observe(bottomRef.current);

    return () => observer.disconnect();
  }, []);

  const displayPhotos = Array.from({ length: multiplier }).flatMap(() => photos);

  return (
    <MotionConfig reducedMotion="user">
      <>
      <motion.button
        type="button"
        onClick={() => setNavOpen((open) => !open)}
        whileTap={{ scale: 0.88 }}
        transition={PRESS_SPRING}
        className="menu-trigger fixed left-1/2 top-2 z-[100] flex size-12 -translate-x-1/2 items-center justify-center text-[#0c0c0c] md:top-2"
        aria-label={navOpen ? "Close photography menu" : "Open photography menu"}
        aria-expanded={navOpen}
        aria-controls="photography-menu"
        data-cursor="hover"
      >
        <motion.span
          animate={{ rotate: navOpen ? 45 : 0 }}
          transition={{ duration: 0.45, ease: EASE }}
          className="relative block size-9"
        >
          <span className="absolute left-1/2 top-1/2 h-[2px] w-8 -translate-x-1/2 -translate-y-1/2 bg-current" />
          <span className="absolute left-1/2 top-1/2 h-8 w-[2px] -translate-x-1/2 -translate-y-1/2 bg-current" />
        </motion.span>
      </motion.button>

      <AnimatePresence>
        {navOpen && (
          <motion.div
            id="photography-menu"
            key="photography-menu"
            initial={{ opacity: 0, scale: 0.985, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.985, y: -10 }}
            transition={APPLE_SPRING}
            className="photography-material fixed inset-0 z-[90] overflow-hidden text-[#0c0c0c]"
            style={{ transformOrigin: "50% 2.75rem" }}
            role="dialog"
            aria-modal="true"
            aria-label="Photography information and navigation"
          >
            <div className="mx-auto flex min-h-full w-full flex-col px-5 pb-5 pt-20 md:px-6 md:pb-4 md:pt-[5.5rem]">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...APPLE_SPRING, delay: 0.1 }}
                className="flex min-h-0 flex-1 flex-col items-center text-center"
              >
                <nav className="text-[clamp(2.65rem,5vw,4.8rem)] font-black uppercase leading-[0.9] tracking-[-0.065em]" aria-label="Photography navigation">
                  <button onClick={() => setNavOpen(false)} className="block uppercase transition-opacity hover:opacity-35">Overview</button>
                  <a href="#work" onClick={() => setNavOpen(false)} className="block uppercase transition-opacity hover:opacity-35">Work</a>
                </nav>
                <p className="my-auto max-w-[1220px] text-[clamp(1.45rem,3.3vw,3.15rem)] font-black uppercase leading-[1.03] tracking-[-0.055em]">
                  Sahil Bhagat is a data engineer and visual storyteller based in New York. His photographs follow quiet weather, city rhythms, and the small details that make a place feel lived in.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...APPLE_SPRING, delay: 0.16 }}
                className="grid grid-cols-[1fr_auto] items-end gap-4"
              >
                <a
                  href="mailto:sahilbhagat1497@gmail.com"
                  className="text-left text-[clamp(1.7rem,3.4vw,3.7rem)] font-black uppercase leading-none tracking-[-0.06em] transition-opacity hover:opacity-35"
                  data-cursor="hover"
                >
                  Contact me
                </a>
                <div className="flex gap-6 text-[clamp(1.7rem,3.4vw,3.7rem)] font-black uppercase leading-none tracking-[-0.06em]">
                  <a href="https://www.instagram.com/" target="_blank" rel="noreferrer" className="transition-opacity hover:opacity-35">IN</a>
                  <a href="https://www.linkedin.com/" target="_blank" rel="noreferrer" className="transition-opacity hover:opacity-35">LI</a>
                </div>
                <span className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] font-semibold uppercase md:text-xs">© Copyright 2026 — all rights reserved</span>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div ref={introRef} className="pointer-events-none fixed inset-0 z-[80] bg-[#f5f3f0] opacity-0" aria-hidden="true">
        <div className="absolute left-1/2 top-1/2 h-[28vh] w-[19vh] -translate-x-1/2 -translate-y-1/2">
          {photos.slice(0, 3).map((photo, index) => (
            <div key={photo.src} className="intro-photo absolute inset-0 opacity-0 blur-xl" style={{ transform: `translate(${(index - 1) * 17}px, ${(index - 1) * -8}px) scale(.82)` }}>
              <Image src={photo.src} alt="" fill sizes="20vw" className="object-cover" priority />
            </div>
          ))}
        </div>
      </div>

      <section
        ref={gridRef}
        id="work"
        className="relative min-h-screen overflow-hidden pb-[24vh] pt-[clamp(66px,10vh,110px)]"
      >
        <h1 className="giant-name pointer-events-none fixed left-1/2 top-1/2 z-0 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-[clamp(2.15rem,5.5vw,5.25rem)] font-black uppercase leading-none tracking-[-0.065em] text-[#0c0c0c] opacity-0">
          Sahil Bhagat
        </h1>

        <div className="relative z-10 -ml-[11%] grid w-[122%] grid-cols-2 gap-x-[12vw] gap-y-[17vh] [grid-auto-rows:clamp(175px,34svh,260px)] md:grid-cols-5 md:gap-x-[5vw] md:gap-y-[16vh]">
          {displayPhotos.map((photo, index) => (
            <Fragment key={`${photo.src}-${index}`}>
              {(index === 2 || index === 6) && (
                <div className="hidden md:block" aria-hidden="true" />
              )}
              <GalleryPhoto
                photo={photo}
                index={index}
                isInitialBatch={index < Math.min(12, photos.length)}
                onSelect={() => setFocusIndex(index % photos.length)}
              />
            </Fragment>
          ))}
        </div>
        
        <div ref={bottomRef} className="absolute bottom-0 h-1 w-full" aria-hidden="true" />
      </section>

      <footer className="relative z-20 flex items-center justify-between border-t border-black/10 px-5 py-5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#0c0c0c] md:px-10 md:py-7 md:text-xs">
        <span>Sahil Bhagat — Photography</span>
        <Link href="/" className="transition-opacity hover:opacity-40">
          Portfolio →
        </Link>
      </footer>

      <AnimatePresence>
        {focusIndex !== null && (
          <FocusView
            photos={photos}
            index={focusIndex}
            onClose={closeFocus}
            onSelect={selectPhoto}
            onStep={stepPhoto}
          />
        )}
      </AnimatePresence>
      </>
    </MotionConfig>
  );
}
