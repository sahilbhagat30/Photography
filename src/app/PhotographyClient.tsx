"use client";

import {
  Fragment,
  useCallback,
  useEffect,
  useLayoutEffect,
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
import { CustomEase } from "gsap/CustomEase";
import { useGSAP } from "@gsap/react";
import ExportedImage from "next-image-export-optimizer";
import Link from "next/link";
import type { PhotoData } from "@/utils/getPhotos";

gsap.registerPlugin(CustomEase);

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
    : "w-full h-auto landscape:w-auto landscape:h-[112%] max-w-full";
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

function tabletOffset(index: number) {
  return ["-9vh", "4vh", "-2vh", "8vh", "-7vh", "5vh"][index % 6];
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
  } as CSSProperties;

  return (
    <div
      className="flex h-full items-start justify-center [transform:translateY(var(--desktop-offset))]"
      style={cellStyle}
    >
      <button
        type="button"
        onClick={onSelect}
        className={`deal-card group relative block overflow-hidden bg-black/5 transition-opacity duration-500 ${isInitialBatch ? "opacity-0 initial-card" : "opacity-100"} ${cardSize(photo)}`}
        style={{ aspectRatio: photoAspectRatio(photo) }}
        aria-label={`View ${photo.alt}`}
        data-cursor="View"
      >
        <ExportedImage
          src={photo.src}
          alt={photo.alt}
          fill
          sizes="25vw"
          className="deal-image object-cover transition-transform duration-700 ease-out group-active:scale-[0.985] group-active:duration-100"
          loading={index < 20 || !isInitialBatch ? "eager" : "lazy"}
          placeholder="blur"
        />
        <span className="deal-overlay absolute inset-0 bg-[#f5f3f0]/0 transition-colors duration-500" />
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
          ? "lg:translate-x-[72px]"
          : "hover:translate-x-1"
      } ${photo.width >= photo.height ? "w-24" : "w-14 lg:w-24"}`}
      style={{ aspectRatio: photoAspectRatio(photo) }}
    >
      <ExportedImage
        src={photo.src}
        alt=""
        fill
        sizes="96px"
        className="object-cover"
        placeholder="blur"
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
      className="fixed inset-0 z-[110] bg-white text-[#0c0c0c]"
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
        className="absolute left-1/2 top-[max(0.5rem,env(safe-area-inset-top))] z-[130] hidden size-12 -translate-x-1/2 items-center justify-center lg:flex lg:top-3"
        aria-label="Close photo"
        data-cursor="hover"
      >
        <span className="absolute h-[2px] w-7 bg-[#0c0c0c]" />
        <span className="absolute h-7 w-[2px] bg-[#0c0c0c]" />
      </motion.button>

      <div className="relative flex h-full flex-col lg:block">
        <div
          ref={railRef}
          className="order-2 flex h-[calc(7rem+env(safe-area-inset-bottom))] shrink-0 items-center gap-3 overflow-x-auto px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] [scrollbar-width:none] [scroll-padding-inline:1rem] [&::-webkit-scrollbar]:hidden sm:px-6 lg:absolute lg:inset-y-0 lg:left-0 lg:z-20 lg:h-auto lg:w-52 lg:flex-col lg:items-start lg:gap-5 lg:overflow-x-hidden lg:overflow-y-auto lg:px-0 lg:py-0 lg:pl-5 lg:[scroll-padding-block:45vh]"
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

        <div className="relative order-1 flex min-h-0 flex-1 items-center justify-center px-4 pb-3 pt-[max(4rem,calc(env(safe-area-inset-top)+3.25rem))] sm:px-8 lg:absolute lg:inset-0 lg:px-[19vw] lg:pb-16 lg:pt-16">
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
                <ExportedImage
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  sizes="(max-width: 1023px) 100vw, calc(100vw - 180px)"
                  className="object-contain"
                  draggable={false}
                  placeholder="blur"
                />
              </motion.div>
            </AnimatePresence>
          </div>

          <motion.button
            type="button"
            onClick={onClose}
            whileTap={{ scale: 0.94 }}
            transition={PRESS_SPRING}
            className="absolute left-6 top-[max(1.5rem,env(safe-area-inset-top))] z-[130] text-base font-extrabold uppercase tracking-[-0.04em] transition-opacity hover:opacity-40 lg:bottom-4 lg:left-1/2 lg:top-auto lg:-translate-x-1/2 lg:text-2xl"
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
  const [introVisible, setIntroVisible] = useState(true);
  const gridRef = useRef<HTMLElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const loadingMoreRef = useRef(false);

  const closeFocus = useCallback(() => setFocusIndex(null), []);
  const selectPhoto = useCallback((index: number) => setFocusIndex(index), []);
  const stepPhoto = useCallback((distance: number) => {
    setFocusIndex((current) => {
      if (current === null) return null;
      return (current + distance % photos.length + photos.length) % photos.length;
    });
  }, [photos.length]);

  useLayoutEffect(() => {
    const previousScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";

    const resetScroll = () => {
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      window.scrollTo(0, 0);
    };
    resetScroll();
    const frame = requestAnimationFrame(resetScroll);
    const timers = [0, 50, 150, 350].map((delay) => window.setTimeout(resetScroll, delay));
    window.addEventListener("pageshow", resetScroll);
    window.addEventListener("load", resetScroll);

    return () => {
      cancelAnimationFrame(frame);
      timers.forEach((timer) => window.clearTimeout(timer));
      window.removeEventListener("pageshow", resetScroll);
      window.removeEventListener("load", resetScroll);
      window.history.scrollRestoration = previousScrollRestoration;
    };
  }, []);

  useGSAP(
    () => {
      if (!gridRef.current) return;

      const cards = gsap.utils.toArray<HTMLElement>(".initial-card", gridRef.current);
      const title = gridRef.current.querySelector<HTMLElement>(".giant-name");
      const titleInner = gridRef.current.querySelector<HTMLElement>(".giant-name-inner");
      const menuTrigger = document.querySelector<HTMLElement>(".menu-trigger");
      const intro = introRef.current;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (reduceMotion) {
        gsap.set(cards, { opacity: 1 });
        gsap.set(title, { opacity: 1 });
        gsap.set(titleInner, { opacity: 1 });
        gsap.set(menuTrigger, { opacity: 1 });
        gsap.set(intro, { display: "none" });
        setIntroVisible(false);
        return;
      }

      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      const viewportCards = cards.filter((card) => {
        const rect = card.getBoundingClientRect();
        return rect.bottom > 0
          && rect.top < window.innerHeight
          && rect.right > 0
          && rect.left < window.innerWidth;
      });
      const openingCards = viewportCards.length > 0
        ? viewportCards
        : cards.slice(0, Math.min(11, cards.length));
      const openingSet = new Set(openingCards);
      const deferredCards = cards.filter((card) => !openingSet.has(card));
      const stageOrder = gsap.utils.shuffle([...openingCards]);
      const spreadOrder = new Map(
        gsap.utils.shuffle([...openingCards]).map((card, index) => [card, index + 1]),
      );
      const spreadEase = CustomEase.create(
        "photography-reference-spread",
        "M0,0 C0.77,0 0.175,1 1,1",
      );

      gsap.set(cards, { opacity: 0 });
      openingCards.forEach((card) => {
        const rect = card.getBoundingClientRect();
        gsap.set(card, {
          x: centerX - (rect.left + rect.width / 2),
          y: centerY - (rect.top + rect.height / 2),
          willChange: "transform",
        });
      });
      stageOrder.forEach((card, index) => {
        gsap.set(card.parentElement, { zIndex: index + 1 });
      });

      gsap.set([title, titleInner, menuTrigger], { opacity: 0 });
      gsap.set(titleInner, {
        yPercent: 50,
        rotationX: -40,
        filter: "blur(12px)",
        transformOrigin: "center center",
      });

      const timeline = gsap.timeline({ delay: 0.3 });
      timeline
        .to(intro, {
          backgroundColor: "rgba(245, 243, 240, 0)",
          backdropFilter: "blur(0px)",
          duration: 0.49,
          ease: "power1.inOut",
        }, 0.1)
        .set(intro, { display: "none" }, 0.6)
        .set(stageOrder, { opacity: 1, stagger: 0.1 }, 0.1)
        .set(title, { opacity: 1 }, 1)
        .to(titleInner, {
          yPercent: 0,
          rotationX: 0,
          opacity: 1,
          filter: "blur(0px)",
          duration: 0.79,
          ease: spreadEase,
        }, 1.6)
        .to(menuTrigger, { opacity: 1, duration: 0.49, ease: spreadEase }, 1.6);

      openingCards.forEach((card) => {
        timeline.to(card, {
          x: 0,
          y: 0,
          duration: gsap.utils.random(0.8, 1.4, 0.01),
          ease: spreadEase,
          onComplete: () => {
            gsap.set(card, { clearProps: "transform,willChange" });
          },
        }, 1 + (spreadOrder.get(card) ?? 1) * 0.01);
      });

      timeline.call(() => {
        gsap.set(deferredCards, { opacity: 1 });
        gsap.set(openingCards.map((card) => card.parentElement), { clearProps: "zIndex" });
        setIntroVisible(false);
      });

      return () => timeline.kill();
    },
    { scope: gridRef },
  );

  useGSAP(
    () => {
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduceMotion || !gridRef.current) return;
      
      const titleInner = gridRef.current.querySelector<HTMLElement>(".giant-name-inner");
      const gridContainer = gridRef.current.querySelector<HTMLElement>(".photo-grid-container");
      
      const handleMouseMove = (e: MouseEvent) => {
        const { clientX, clientY } = e;
        const xPos = (clientX / window.innerWidth - 0.5) * 40;
        const yPos = (clientY / window.innerHeight - 0.5) * 40;
        
        if (gridContainer) {
          gsap.to(gridContainer, {
            x: -xPos,
            y: -yPos,
            duration: 1.5,
            ease: "power2.out",
            overwrite: "auto",
          });
        }
        
        if (titleInner) {
          gsap.to(titleInner, {
            x: xPos * 0.5,
            y: yPos * 0.5,
            duration: 1.5,
            ease: "power2.out",
            overwrite: "auto",
          });
        }
      };
      
      window.addEventListener("mousemove", handleMouseMove);
      return () => window.removeEventListener("mousemove", handleMouseMove);
    },
    { scope: gridRef }
  );

  useLayoutEffect(() => {
    const root = document.documentElement;
    const previousRootOverflow = root.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    if (focusIndex !== null || navOpen || introVisible) {
      root.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
    }

    if (introVisible) {
      root.scrollTop = 0;
      document.body.scrollTop = 0;
      window.scrollTo(0, 0);
    }

    return () => {
      root.style.overflow = previousRootOverflow;
      document.body.style.overflow = previousBodyOverflow;
    };
  }, [focusIndex, introVisible, navOpen]);

  useEffect(() => {
    if (!navOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setNavOpen(false);
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [navOpen]);

  useEffect(() => {
    if (introVisible) return;

    loadingMoreRef.current = false;
    let frame = 0;

    const appendWhenNeeded = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const remaining = document.documentElement.scrollHeight
          - (window.scrollY + window.innerHeight);

        if (remaining < window.innerHeight * 3 && !loadingMoreRef.current) {
          loadingMoreRef.current = true;
          setMultiplier((current) => current + 1);
        }
      });
    };

    window.addEventListener("scroll", appendWhenNeeded, { passive: true });
    window.addEventListener("resize", appendWhenNeeded);
    appendWhenNeeded();

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", appendWhenNeeded);
      window.removeEventListener("resize", appendWhenNeeded);
    };
  }, [introVisible, multiplier]);

  const displayPhotos = Array.from({ length: multiplier }).flatMap(() => photos);

  return (
    <MotionConfig reducedMotion="user">
      <>
      <motion.button
        type="button"
        onClick={() => setNavOpen((open) => !open)}
        whileTap={{ scale: 0.88 }}
        transition={PRESS_SPRING}
        className="menu-trigger fixed left-1/2 top-[max(0.5rem,env(safe-area-inset-top))] z-[100] flex size-12 -translate-x-1/2 items-center justify-center text-[#0c0c0c]"
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
            className="photography-material fixed inset-0 z-[90] h-[100dvh] overflow-x-hidden overflow-y-auto text-[#0c0c0c]"
            style={{ transformOrigin: "50% 2.75rem" }}
            role="dialog"
            aria-modal="true"
            aria-label="Photography information and navigation"
          >
            <div className="mx-auto flex min-h-full w-full flex-col px-[max(1.25rem,env(safe-area-inset-left))] pb-[max(1.25rem,env(safe-area-inset-bottom))] pr-[max(1.25rem,env(safe-area-inset-right))] pt-[max(5rem,calc(env(safe-area-inset-top)+4rem))] sm:px-8 lg:px-10 lg:pb-6 lg:pt-[5.5rem]">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...APPLE_SPRING, delay: 0.1 }}
                className="flex min-h-0 flex-1 flex-col items-center text-center"
              >
                <nav className="text-[clamp(2.35rem,10vw,4.8rem)] font-extrabold uppercase leading-[0.9] tracking-[-0.065em] sm:text-[clamp(3rem,7vw,4.8rem)] lg:text-[clamp(2.65rem,5vw,4.8rem)]" aria-label="Photography navigation">
                  <button onClick={() => setNavOpen(false)} className="block uppercase transition-opacity hover:opacity-35">Overview</button>
                  <a href="#work" onClick={() => setNavOpen(false)} className="block uppercase transition-opacity hover:opacity-35">Work</a>
                </nav>
                <p className="my-auto max-w-[1220px] py-6 text-[clamp(1.05rem,5.2vw,1.7rem)] font-extrabold uppercase leading-[1.03] tracking-[-0.055em] sm:text-[clamp(1.5rem,4vw,2.5rem)] lg:text-[clamp(1.45rem,3.3vw,3.15rem)]">
                  Sahil Bhagat is a data engineer and visual storyteller based in New York. His photographs follow quiet weather, city rhythms, and the small details that make a place feel lived in.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...APPLE_SPRING, delay: 0.16 }}
                className="grid grid-cols-[1fr_auto] items-end gap-x-4 gap-y-5"
              >
                <a
                  href="mailto:sahilbhagat1497@gmail.com"
                  className="text-left text-[clamp(1.35rem,6vw,2rem)] font-extrabold uppercase leading-none tracking-[-0.06em] transition-opacity hover:opacity-35 sm:text-[clamp(1.8rem,4.5vw,3rem)] lg:text-[clamp(1.7rem,3.4vw,3.7rem)]"
                  data-cursor="hover"
                >
                  Contact me
                </a>
                <div className="flex gap-4 text-[clamp(1.35rem,6vw,2rem)] font-extrabold uppercase leading-none tracking-[-0.06em] sm:gap-6 sm:text-[clamp(1.8rem,4.5vw,3rem)] lg:text-[clamp(1.7rem,3.4vw,3.7rem)]">
                  <a href="https://www.instagram.com/" target="_blank" rel="noreferrer" className="transition-opacity hover:opacity-35">IN</a>
                  <a href="https://www.linkedin.com/" target="_blank" rel="noreferrer" className="transition-opacity hover:opacity-35">LI</a>
                </div>
                <span className="pointer-events-none col-span-2 text-center text-[9px] font-semibold uppercase tracking-[0.08em] sm:text-[10px] lg:text-xs">© Copyright 2026 — all rights reserved</span>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {introVisible && (
        <div
          ref={introRef}
          className="pointer-events-none fixed inset-0 z-[80] bg-[#f5f3f0] [backdrop-filter:blur(12px)]"
          aria-hidden="true"
        />
      )}

      <section
        ref={gridRef}
        id="work"
        className="relative min-h-screen overflow-hidden pb-[24vh] pt-[clamp(66px,10vh,110px)]"
      >
        <h1 className="giant-name pointer-events-none fixed left-1/2 top-1/2 z-0 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-[clamp(2.15rem,5.5vw,5.25rem)] font-extrabold uppercase leading-none tracking-[-0.065em] text-[#0c0c0c] opacity-0 [perspective:1000px]">
          <span className="giant-name-inner inline-block">Sahil Bhagat</span>
        </h1>

        <div className="photo-grid-container group/grid relative z-10 -ml-[11%] grid w-[122%] grid-cols-5 gap-x-[5vw] gap-y-[16vh] [grid-auto-rows:clamp(175px,34svh,260px)]">
          {displayPhotos.map((photo, index) => (
            <Fragment key={`${photo.src}-${index}`}>
              {(index === 2 || index === 6) && (
                <div aria-hidden="true" />
              )}
              <GalleryPhoto
                photo={photo}
                index={index}
                isInitialBatch={index < photos.length}
                onSelect={() => setFocusIndex(index % photos.length)}
              />
            </Fragment>
          ))}
        </div>
      </section>

      <footer className="relative z-20 flex flex-wrap items-center justify-between gap-3 border-t border-black/10 px-[max(1.25rem,env(safe-area-inset-left))] py-5 pr-[max(1.25rem,env(safe-area-inset-right))] text-[9px] font-extrabold uppercase tracking-[0.1em] text-[#0c0c0c] sm:text-[10px] md:px-10 md:py-7 md:text-xs">
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
