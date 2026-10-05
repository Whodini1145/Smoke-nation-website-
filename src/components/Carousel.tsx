import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import logoBadge from '../assets/logo-badge.jpg';
import type { Slide } from '../data/types';

const INTERVAL = 3500;

/** Sliding banner: auto-advances, follows a finger drag, one dot per slide. */
export function Carousel({ slides }: { slides: Slide[] }) {
  const [index, setIndex] = useState(0);
  const [drag, setDrag] = useState<number | null>(null); // px offset while dragging
  const start = useRef<{ x: number; y: number; t: number; locked?: 'x' | 'y' } | null>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const count = slides.length;

  // Keep the index valid when slides are added or removed in admin.
  useEffect(() => {
    if (index >= count) setIndex(0);
  }, [count, index]);

  const go = useCallback((i: number) => setIndex(((i % count) + count) % count), [count]);

  useEffect(() => {
    if (count < 2 || paused || drag !== null) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    const t = window.setTimeout(() => go(index + 1), INTERVAL);
    return () => window.clearTimeout(t);
  }, [index, count, paused, drag, go]);

  useEffect(() => {
    const onVis = () => setPaused(document.hidden);
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  function onPointerDown(e: React.PointerEvent) {
    if (count < 2 || e.button !== 0) return;
    start.current = { x: e.clientX, y: e.clientY, t: Date.now() };
  }
  function onPointerMove(e: React.PointerEvent) {
    const s = start.current;
    if (!s) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (!s.locked && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
      s.locked = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      if (s.locked === 'x') (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }
    if (s.locked === 'x') setDrag(dx);
  }
  function onPointerUp() {
    const s = start.current;
    start.current = null;
    if (drag === null || !s) return;
    const width = viewport.current?.offsetWidth ?? 1;
    const fast = Math.abs(drag) / Math.max(1, Date.now() - s.t) > 0.4;
    if (Math.abs(drag) > width * 0.18 || (fast && Math.abs(drag) > 30)) go(index + (drag < 0 ? 1 : -1));
    setDrag(null);
  }

  if (!count) return null;
  const offset = drag !== null ? `calc(${-index * 100}% + ${drag}px)` : `${-index * 100}%`;

  return (
    <section className="hero" aria-roledescription="carousel" aria-label="Featured">
      <div
        className="hero-viewport"
        ref={viewport}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div className={`hero-track${drag !== null ? ' is-dragging' : ''}`} style={{ transform: `translateX(${offset})` }}>
          {slides.map((s, i) => (
            <div
              key={s.id}
              className={`hero-slide${s.brand ? ' hero-brand' : ''}${!s.photo && !s.brand ? ' hero-plain' : ''}`}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${count}`}
              aria-hidden={i !== index}
            >
              {s.brand ? (
                <img src={logoBadge} alt="Smoke Nation, premium smoke shop" className="hero-logo" draggable={false} />
              ) : (
                <>
                  {s.photo && <img src={s.photo} alt="" className="hero-photo" draggable={false} />}
                  <div className="smoke-edge" aria-hidden="true" />
                  <div className="hero-copy">
                    <h2 className="hero-caption">{s.caption}</h2>
                    {s.link && (
                      <Link to={s.link} className="btn btn-ink" tabIndex={i === index ? 0 : -1}>
                        {s.linkLabel || 'Take a look'}
                      </Link>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
      {count > 1 && (
        <div className="dots" role="tablist" aria-label="Choose slide">
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Slide ${i + 1}`}
              className={i === index ? 'is-on' : ''}
              onClick={() => go(i)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
