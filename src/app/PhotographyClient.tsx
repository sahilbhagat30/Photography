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
import Image from "next/image";
import Link from "next/link";
import type { PhotoData } from "@/utils/getPhotos";

gsap.registerPlugin(CustomEase);

const EASE = [0.77, 0, 0.175, 1] as const;
const APPLE_SPRING = { type: "spring", bounce: 0, duration: 0.4 } as const;
const PRESS_SPRING = { type: "spring", stiffness: 700, damping: 45 } as const;
const PROJECT_LEAVE_DURATION = 500;

type ViewMode = "grid" | "list";

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

function projectTitle(photo: PhotoData, index: number) {
  return photo.alt || `Frame ${String(index + 1).padStart(2, "0")}`;
}

function GalleryPhoto({
  photo,
  index,
  rel,
  isInitialBatch,
  isHovering,
  isLeaving,
  onHoverStart,
  onHoverEnd,
  onSelect,
}: {
  photo: PhotoData;
  index: number;
  rel: number;
  isInitialBatch: boolean;
  isHovering: boolean;
  isLeaving: boolean;
  onHoverStart: (rel: number) => void;
  onHoverEnd: (rel: number) => void;
  onSelect: () => void;
}) {
  const cellStyle = {
    "--desktop-offset": desktopOffset(index),
    "--mobile-offset": mobileOffset(index),
    "--tablet-offset": tabletOffset(index),
  } as CSSProperties;

  return (
    <div
      className="flex h-full items-start justify-center [transform:translateY(var(--mobile-offset))] md:[transform:translateY(var(--tablet-offset))] xl:[transform:translateY(var(--desktop-offset))]"
      style={cellStyle}
    >
      <button
        type="button"
        onClick={onSelect}
        onMouseEnter={() => onHoverStart(rel)}
        onMouseLeave={() => onHoverEnd(rel)}
        onFocus={() => onHoverStart(rel)}
        onBlur={() => onHoverEnd(rel)}
        className={`deal-card js-grid-projecthover group relative block overflow-hidden bg-black/5 ${isInitialBatch ? "opacity-0 initial-card" : "opacity-100"} ${isHovering ? "js-project--ishovering" : ""} ${isLeaving ? "js-project--isleaving" : ""} ${cardSize(photo)}`}
        style={{ aspectRatio: photoAspectRatio(photo) }}
        aria-label={`View ${photo.alt}`}
        data-rel={rel}
        data-cursor="View"
      >
        <Image
          src={photo.src}
          alt={photo.alt}
          fill
          sizes="(max-width: 639px) 58vw, (max-width: 1023px) 38vw, (max-width: 1279px) 29vw, 20vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.025] group-active:scale-[0.985] group-active:duration-100"
          quality={85}
          loading={index < 12 ? "eager" : "lazy"}
        />
        <span className="absolute inset-0 bg-[#f5f3f0]/0 transition-colors duration-500 group-hover:bg-[#f5f3f0]/10" />
      </button>
    </div>
  );
}

function ProjectHoverTitles({
  photos,
  hoveredRel,
  leavingRel,
}: {
  photos: PhotoData[];
  hoveredRel: number | null;
  leavingRel: number | null;
}) {
  return (
    <div
      className="c-element-projects__list"
      aria-hidden="true"
    >
      {photos.map((photo, index) => (
        <div
          key={`grid-title-${photo.src}`}
          className={`project-list-item js-list-projecthover ${hoveredRel === index ? "js-project--ishovering" : ""} ${leavingRel === index ? "js-project--isleaving" : ""}`}
          data-rel={index}
        >
          <span className="project-name">
            {projectTitle(photo, index)}
          </span>
        </div>
      ))}
    </div>
  );
}

function ProjectListView({
  photos,
  hoveredRel,
  leavingRel,
  onHoverStart,
  onHoverEnd,
  onSelect,
}: {
  photos: PhotoData[];
  hoveredRel: number | null;
  leavingRel: number | null;
  onHoverStart: (rel: number) => void;
  onHoverEnd: (rel: number) => void;
  onSelect: (index: number) => void;
}) {
  return (
    <div className="c-element-projects view--list relative z-20 min-h-screen px-[max(1.25rem,env(safe-area-inset-left))] pr-[max(1.25rem,env(safe-area-inset-right))]">
      <div className="c-element-projects__grid" aria-hidden="true">
        {photos.map((photo, index) => (
          <div
            key={`list-preview-${photo.src}`}
            className={`project-grid-item js-grid-projecthover ${hoveredRel === index ? "js-project--ishovering" : ""} ${leavingRel === index ? "js-project--isleaving" : ""}`}
            data-rel={index}
          >
            <span className="fs-media relative block h-full w-full">
              <Image
                src={photo.src}
                alt=""
                fill
                sizes="34vw"
                className="object-contain"
                quality={85}
              />
            </span>
          </div>
        ))}
      </div>

      <div className="c-element-projects__list relative z-10 flex min-h-screen flex-col items-center justify-center py-[max(6.5rem,calc(env(safe-area-inset-top)+5.5rem))] pb-[max(7rem,calc(env(safe-area-inset-bottom)+5.5rem))]">
        {photos.map((photo, index) => (
          <button
            key={`list-item-${photo.src}`}
            type="button"
            className={`project-list-item js-list-projecthover group text-center ${hoveredRel === index ? "js-project--ishovering" : ""} ${leavingRel === index ? "js-project--isleaving" : ""}`}
            style={{ "--project-delay": `${Math.min(index, 20) * 0.03}s` } as CSSProperties}
            data-rel={index}
            onClick={() => onSelect(index)}
            onMouseEnter={() => onHoverStart(index)}
            onMouseLeave={() => onHoverEnd(index)}
            onFocus={() => onHoverStart(index)}
            onBlur={() => onHoverEnd(index)}
            data-cursor="View"
          >
            <span className="project-name">
              {projectTitle(photo, index)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ProjectSwitch({
  viewMode,
  hidden,
  onSwitch,
}: {
  viewMode: ViewMode;
  hidden: boolean;
  onSwitch: (viewMode: ViewMode) => void;
}) {
  return (
    <div
      className={`photography-project-switch ${hidden ? "is-hidden" : ""}`}
      aria-label="Photography view switch"
    >
      <button
        type="button"
        className={viewMode === "grid" ? "is--active" : ""}
        aria-pressed={viewMode === "grid"}
        onClick={() => onSwitch("grid")}
      >
        Grid
      </button>
      <button
        type="button"
        className={viewMode === "list" ? "is--active" : ""}
        aria-pressed={viewMode === "list"}
        onClick={() => onSwitch("list")}
      >
        List
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
      className="fixed inset-0 z-[110] h-[100dvh] bg-[#f5f3f0] text-[#0c0c0c]"
      role="dialog"
      aria-modal="true"
      aria-label={`Viewing ${photo.alt}`}
      onWheel={handleWheel}
    >
      <div className="relative flex h-full flex-col lg:block">
        <div className="relative z-[130] flex h-[10.25rem] shrink-0 flex-col items-center justify-start pt-[max(0.5rem,env(safe-area-inset-top))] lg:absolute lg:left-1/2 lg:top-3 lg:h-auto lg:-translate-x-1/2 lg:pt-0">
          <motion.button
            type="button"
            onClick={onClose}
            whileTap={{ scale: 0.88 }}
            transition={PRESS_SPRING}
            className="relative flex size-12 items-center justify-center"
            aria-label="Close photo"
            data-cursor="hover"
          >
            <span className="absolute h-[2px] w-7 bg-[#0c0c0c]" />
            <span className="absolute h-7 w-[2px] bg-[#0c0c0c]" />
          </motion.button>

          <motion.button
            type="button"
            onClick={onClose}
            whileTap={{ scale: 0.94 }}
            transition={PRESS_SPRING}
            className="-mt-1 text-base font-black uppercase leading-none tracking-[-0.04em] transition-opacity hover:opacity-40 lg:hidden"
          >
            Back
          </motion.button>
        </div>

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

        <div className="relative order-1 flex min-h-0 flex-1 items-center justify-center px-4 pb-3 pt-0 sm:px-8 lg:absolute lg:inset-0 lg:px-[19vw] lg:pb-16 lg:pt-16">
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
                  sizes="(max-width: 1023px) 100vw, calc(100vw - 180px)"
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
            className="hidden lg:absolute lg:bottom-4 lg:left-1/2 lg:block lg:-translate-x-1/2 lg:text-2xl lg:font-black lg:uppercase lg:tracking-[-0.04em] lg:transition-opacity lg:hover:opacity-40"
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
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [hoveredRel, setHoveredRel] = useState<number | null>(null);
  const [leavingRel, setLeavingRel] = useState<number | null>(null);
  const gridRef = useRef<HTMLElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const loadingMoreRef = useRef(false);
  const hoverLeaveTimerRef = useRef<number | null>(null);

  const closeFocus = useCallback(() => setFocusIndex(null), []);
  const selectPhoto = useCallback((index: number) => setFocusIndex(index), []);
  const stepPhoto = useCallback((distance: number) => {
    setFocusIndex((current) => {
      if (current === null) return null;
      return (current + distance % photos.length + photos.length) % photos.length;
    });
  }, [photos.length]);

  const activateProjectHover = useCallback((rel: number) => {
    if (hoverLeaveTimerRef.current !== null) {
      window.clearTimeout(hoverLeaveTimerRef.current);
      hoverLeaveTimerRef.current = null;
    }

    setLeavingRel(null);
    setHoveredRel(rel);
  }, []);

  const releaseProjectHover = useCallback((rel: number) => {
    if (hoverLeaveTimerRef.current !== null) {
      window.clearTimeout(hoverLeaveTimerRef.current);
    }

    setHoveredRel((current) => (current === rel ? null : current));
    setLeavingRel(rel);
    hoverLeaveTimerRef.current = window.setTimeout(() => {
      setLeavingRel((current) => (current === rel ? null : current));
      hoverLeaveTimerRef.current = null;
    }, PROJECT_LEAVE_DURATION);
  }, []);

  const switchView = useCallback((nextViewMode: ViewMode) => {
    if (hoverLeaveTimerRef.current !== null) {
      window.clearTimeout(hoverLeaveTimerRef.current);
      hoverLeaveTimerRef.current = null;
    }

    setHoveredRel(null);
    setLeavingRel(null);
    setViewMode(nextViewMode);
    window.setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 0);
  }, []);

  useEffect(() => {
    return () => {
      if (hoverLeaveTimerRef.current !== null) {
        window.clearTimeout(hoverLeaveTimerRef.current);
      }
    };
  }, []);

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
      const titleTargets = [title, titleInner, menuTrigger].filter(Boolean) as HTMLElement[];

      if (reduceMotion) {
        if (cards.length > 0) gsap.set(cards, { opacity: 1 });
        if (title) gsap.set(title, { opacity: 1 });
        if (titleInner) gsap.set(titleInner, { opacity: 1 });
        if (menuTrigger) gsap.set(menuTrigger, { opacity: 1 });
        if (intro) gsap.set(intro, { display: "none" });
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

      if (cards.length > 0) gsap.set(cards, { opacity: 0 });
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

      if (titleTargets.length > 0) {
        gsap.set(titleTargets, { opacity: 0 });
      }
      if (titleInner) {
        gsap.set(titleInner, {
          yPercent: 50,
          rotationX: -40,
          filter: "blur(12px)",
          transformOrigin: "center center",
        });
      }

      const timeline = gsap.timeline({ delay: 0.3 });
      if (intro) {
        timeline
          .to(intro, {
          backgroundColor: "rgba(245, 243, 240, 0)",
          backdropFilter: "blur(0px)",
          duration: 0.49,
          ease: "power1.inOut",
          }, 0.1)
          .set(intro, { display: "none" }, 0.6);
      }

      if (stageOrder.length > 0) {
        timeline.set(stageOrder, { opacity: 1, stagger: 0.1 }, 0.1);
      }
      if (title) {
        timeline.set(title, { opacity: 1 }, 1);
      }
      if (titleInner) {
        timeline.to(titleInner, {
          yPercent: 0,
          rotationX: 0,
          opacity: 1,
          filter: "blur(0px)",
          duration: 0.79,
          ease: spreadEase,
        }, 1.6);
      }
      if (menuTrigger) {
        timeline.to(menuTrigger, { opacity: 1, duration: 0.49, ease: spreadEase }, 1.6);
      }

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
        if (deferredCards.length > 0) gsap.set(deferredCards, { opacity: 1 });
        const openingParents = openingCards
          .map((card) => card.parentElement)
          .filter(Boolean) as HTMLElement[];
        if (openingParents.length > 0) gsap.set(openingParents, { clearProps: "zIndex" });
        setIntroVisible(false);
      });

      return () => timeline.kill();
    },
    { scope: gridRef },
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
    if (introVisible || viewMode !== "grid") return;

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
  }, [introVisible, multiplier, viewMode]);

  const displayPhotos = Array.from({ length: multiplier }).flatMap(() => photos);

  return (
    <MotionConfig reducedMotion="user">
      <div
        className={`portfolio-shell min-h-screen ${!introVisible ? "is-loaded" : ""} ${hoveredRel !== null ? "is-project-hovering" : ""}`}
        data-view={viewMode}
      >
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
                <nav className="text-[clamp(2.35rem,10vw,4.8rem)] font-black uppercase leading-[0.9] tracking-[-0.065em] sm:text-[clamp(3rem,7vw,4.8rem)] lg:text-[clamp(2.65rem,5vw,4.8rem)]" aria-label="Photography navigation">
                  <button onClick={() => { switchView("grid"); setNavOpen(false); }} className="block uppercase transition-opacity hover:opacity-35">Overview</button>
                  <button onClick={() => { switchView("list"); setNavOpen(false); }} className="block uppercase transition-opacity hover:opacity-35">List</button>
                </nav>
                <p className="my-auto max-w-[1220px] py-6 text-[clamp(1.05rem,5.2vw,1.7rem)] font-black uppercase leading-[1.03] tracking-[-0.055em] sm:text-[clamp(1.5rem,4vw,2.5rem)] lg:text-[clamp(1.45rem,3.3vw,3.15rem)]">
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
                  className="text-left text-[clamp(1.35rem,6vw,2rem)] font-black uppercase leading-none tracking-[-0.06em] transition-opacity hover:opacity-35 sm:text-[clamp(1.8rem,4.5vw,3rem)] lg:text-[clamp(1.7rem,3.4vw,3.7rem)]"
                  data-cursor="hover"
                >
                  Contact me
                </a>
                <div className="flex gap-4 text-[clamp(1.35rem,6vw,2rem)] font-black uppercase leading-none tracking-[-0.06em] sm:gap-6 sm:text-[clamp(1.8rem,4.5vw,3rem)] lg:text-[clamp(1.7rem,3.4vw,3.7rem)]">
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
        className={`relative min-h-screen overflow-hidden ${viewMode === "grid" ? "pb-[18vh] pt-[max(4.5rem,calc(env(safe-area-inset-top)+4rem))] sm:pb-[20vh] xl:pb-[24vh] xl:pt-[clamp(66px,10vh,110px)]" : "pb-0 pt-0"}`}
      >
        <h1 className="giant-name pointer-events-none fixed left-1/2 top-1/2 z-0 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-[clamp(2rem,8.6vw,3rem)] font-black uppercase leading-none tracking-[-0.065em] text-[#0c0c0c] opacity-0 [perspective:1000px] sm:text-[clamp(2.8rem,7vw,4.4rem)] xl:text-[clamp(2.15rem,5.5vw,5.25rem)]">
          <span className="giant-name-inner inline-block">Sahil Bhagat</span>
        </h1>

        {viewMode === "grid" ? (
          <div className="c-element-projects view--grid">
            <div className="relative z-10 -ml-[8%] grid w-[116%] grid-cols-2 gap-x-[10vw] gap-y-[14vh] [grid-auto-rows:clamp(175px,32svh,250px)] sm:-ml-[5%] sm:w-[110%] sm:gap-x-[8vw] md:grid-cols-3 md:gap-x-[7vw] md:gap-y-[14vh] md:[grid-auto-rows:clamp(210px,28svh,310px)] lg:grid-cols-4 lg:gap-x-[5vw] lg:gap-y-[15vh] xl:-ml-[11%] xl:w-[122%] xl:grid-cols-5 xl:gap-y-[16vh] xl:[grid-auto-rows:clamp(175px,34svh,260px)]">
              {displayPhotos.map((photo, index) => {
                const rel = index % photos.length;

                return (
                  <Fragment key={`${photo.src}-${index}`}>
                    {(index === 2 || index === 6) && (
                      <div className="hidden xl:block" aria-hidden="true" />
                    )}
                    <GalleryPhoto
                      photo={photo}
                      index={index}
                      rel={rel}
                      isInitialBatch={index < photos.length}
                      isHovering={hoveredRel === rel}
                      isLeaving={leavingRel === rel}
                      onHoverStart={activateProjectHover}
                      onHoverEnd={releaseProjectHover}
                      onSelect={() => setFocusIndex(rel)}
                    />
                  </Fragment>
                );
              })}
            </div>
            <ProjectHoverTitles
              photos={photos}
              hoveredRel={hoveredRel}
              leavingRel={leavingRel}
            />
          </div>
        ) : (
          <ProjectListView
            photos={photos}
            hoveredRel={hoveredRel}
            leavingRel={leavingRel}
            onHoverStart={activateProjectHover}
            onHoverEnd={releaseProjectHover}
            onSelect={setFocusIndex}
          />
        )}
      </section>

      <ProjectSwitch
        viewMode={viewMode}
        hidden={introVisible || navOpen || focusIndex !== null}
        onSwitch={switchView}
      />

      <footer className="relative z-20 flex flex-wrap items-center justify-between gap-3 border-t border-black/10 px-[max(1.25rem,env(safe-area-inset-left))] py-5 pr-[max(1.25rem,env(safe-area-inset-right))] text-[9px] font-bold uppercase tracking-[0.1em] text-[#0c0c0c] sm:text-[10px] md:px-10 md:py-7 md:text-xs">
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
      </div>
    </MotionConfig>
  );
}
