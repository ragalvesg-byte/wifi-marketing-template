'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Campaign } from '@/types/database';
import { getAspectRatioValue } from '@/lib/aspect-ratio';

export interface CarouselSlide {
  id: string; // 'main' or campaign ID
  mediaUrl: string;
  mediaType: 'IMAGE' | 'VIDEO';
  title?: string;
  description?: string;
  buttonText?: string;
  buttonUrl?: string;
  mediaPositionX?: number;
  mediaPositionY?: number;
  mediaFit?: 'cover' | 'contain';
  isCampaign?: boolean;
  campaign?: any; // original campaign object
  aspectRatio?: string;
}

interface MediaCarouselProps {
  slides: CarouselSlide[];
  onSlideView?: (slide: CarouselSlide) => void;
  onSlideClick?: (slide: CarouselSlide) => void;
  containerAspectRatio?: string; // e.g. '16/9' or '4/5'
}

export function MediaCarousel({
  slides,
  onSlideView,
  onSlideClick,
  containerAspectRatio = '16/9',
}: MediaCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const interactionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartRef = useRef<number | null>(null);

  // Hydration safety: set isMounted on client side
  useEffect(() => {
    setIsMounted(true);
    
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);

      const motionListener = (e: MediaQueryListEvent) => {
        setPrefersReducedMotion(e.matches);
      };
      mediaQuery.addEventListener('change', motionListener);

      return () => {
        mediaQuery.removeEventListener('change', motionListener);
      };
    }
  }, []);

  // Keyboard navigation on desktop
  useEffect(() => {
    if (!isMounted || slides.length <= 1) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }
      if (e.key === 'ArrowLeft') {
        handleInteraction();
        setCurrentIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
      } else if (e.key === 'ArrowRight') {
        handleInteraction();
        setCurrentIndex((prev) => (prev + 1) % slides.length);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMounted, slides.length]);

  // Trigger view log for the active campaign
  useEffect(() => {
    if (isMounted && slides.length > 0 && currentIndex < slides.length) {
      const activeSlide = slides[currentIndex];
      if (activeSlide && onSlideView) {
        onSlideView(activeSlide);
      }
    }
  }, [currentIndex, slides, isMounted, onSlideView]);

  // Handle auto-play rotation
  useEffect(() => {
    if (!isMounted || slides.length <= 1 || prefersReducedMotion) {
      return;
    }

    const startTimer = () => {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
      autoPlayTimerRef.current = setInterval(() => {
        if (!isInteracting && document.visibilityState === 'visible') {
          setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length);
        }
      }, 3000);
    };

    startTimer();

    // Visibility Listener to pause when tab out of focus
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        if (autoPlayTimerRef.current) {
          clearInterval(autoPlayTimerRef.current);
          autoPlayTimerRef.current = null;
        }
      } else {
        startTimer();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (autoPlayTimerRef.current) {
        clearInterval(autoPlayTimerRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isMounted, slides.length, isInteracting, prefersReducedMotion]);

  // Handle interaction pause
  const handleInteraction = () => {
    setIsInteracting(true);
    if (interactionTimerRef.current) {
      clearTimeout(interactionTimerRef.current);
    }
    // Resume auto-play after 5 seconds of no interaction
    interactionTimerRef.current = setTimeout(() => {
      setIsInteracting(false);
    }, 5000);
  };

  useEffect(() => {
    return () => {
      if (interactionTimerRef.current) clearTimeout(interactionTimerRef.current);
    };
  }, []);

  if (slides.length === 0) return null;

  // Statically render the first slide for SSR/CNA compatibility without JS
  const firstSlide = slides[0];

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleInteraction();
    setCurrentIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleInteraction();
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = e.touches[0].clientX;
    handleInteraction();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartRef.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStartRef.current;
    touchStartRef.current = null;

    if (diff > 50) {
      // Swipe Right
      setCurrentIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
    } else if (diff < -50) {
      // Swipe Left
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }
  };

  // Safe styling mapping
  const getSlideStyle = (slide: CarouselSlide) => {
    const posX = slide.mediaPositionX ?? 50;
    const posY = slide.mediaPositionY ?? 50;
    const fit = slide.mediaFit || 'cover';
    return {
      objectPosition: `${posX}% ${posY}%`,
      objectFit: fit as any,
      backgroundColor: fit === 'contain' ? '#0f172a' : 'transparent',
    };
  };

  // Render static first banner if not hydrated yet
  if (!isMounted) {
    const firstSlideRatio = firstSlide.aspectRatio || containerAspectRatio || '16/9';
    return (
      <div 
        className="w-full relative rounded-2xl overflow-hidden border border-white/10 shadow-xl"
        style={{
          aspectRatio: getAspectRatioValue(firstSlideRatio),
          maxHeight: '40vh',
        }}
      >
        {firstSlide.mediaType === 'IMAGE' ? (
          <img
            src={firstSlide.mediaUrl}
            alt="Promoção"
            className="w-full h-full select-none"
            style={getSlideStyle(firstSlide)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-900 text-slate-400 text-xs">
            {firstSlide.title || 'Mídia'}
          </div>
        )}
      </div>
    );
  }

  const activeSlide = slides[currentIndex];
  const activeSlideRatio = activeSlide?.aspectRatio || containerAspectRatio || '16/9';

  return (
    <div
      className="w-full relative group rounded-2xl overflow-hidden border border-white/10 shadow-xl transition-all duration-500 ease-in-out"
      style={{
        aspectRatio: getAspectRatioValue(activeSlideRatio),
        maxHeight: '40vh',
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseEnter={handleInteraction}
      onMouseLeave={handleInteraction}
    >
      {/* Slides Container */}
      <div className="w-full h-full relative">
        {slides.map((slide, index) => {
          const isActive = index === currentIndex;
          return (
            <div
              key={slide.id + '-' + index}
              onClick={() => onSlideClick && onSlideClick(slide)}
              className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${
                isActive ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
              } ${slide.buttonUrl || onSlideClick ? 'cursor-pointer' : ''}`}
            >
              {slide.mediaType === 'IMAGE' ? (
                <img
                  src={slide.mediaUrl}
                  alt="Promoção"
                  className="w-full h-full select-none"
                  style={getSlideStyle(slide)}
                />
              ) : (
                <iframe
                  src={slide.mediaUrl}
                  title={slide.title || 'Video'}
                  className="w-full h-full border-none pointer-events-none"
                  allow="autoplay; encrypted-media"
                />
              )}

              {/* Text Overlay (only if title or description present) */}
              {(slide.title || slide.description) && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent p-4 pb-6 pt-10 text-white z-20 flex flex-col justify-end">
                  {slide.title && <h3 className="font-extrabold text-sm md:text-base line-clamp-1">{slide.title}</h3>}
                  {slide.description && <p className="text-[11px] md:text-xs text-slate-200 mt-1 line-clamp-2">{slide.description}</p>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Navigation Arrows */}
      {slides.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/85 text-white flex items-center justify-center backdrop-blur-md transition-all duration-200 z-30 border border-white/20 active:scale-95 shadow-md"
            aria-label="Banner anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/85 text-white flex items-center justify-center backdrop-blur-md transition-all duration-200 z-30 border border-white/20 active:scale-95 shadow-md"
            aria-label="Próximo banner"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Slide Indicators / Dots */}
      {slides.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-30">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                handleInteraction();
                setCurrentIndex(index);
              }}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                index === currentIndex ? 'bg-white w-4' : 'bg-white/45'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
