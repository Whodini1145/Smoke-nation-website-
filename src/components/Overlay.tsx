import { useEffect, useRef, useSyncExternalStore, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { CloseIcon } from './Icons';

/** Modal that rises as a bottom sheet on phones and sits centered on wider screens. */
export function Sheet({ open, onClose, label, children, wide }: { open: boolean; onClose: () => void; label: string; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
      prev?.focus();
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="sheet-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`sheet${wide ? ' sheet-wide' : ''}`} role="dialog" aria-modal="true" aria-label={label} tabIndex={-1} ref={ref}>
        <button type="button" className="icon-btn sheet-close" onClick={onClose} aria-label="Close">
          <CloseIcon />
        </button>
        {children}
      </div>
    </div>
  );
}

// ── Toast ──────────────────────────────────────────────────────────────────

interface ToastState {
  id: number;
  text: string;
  link?: { to: string; label: string };
}
let toast: ToastState | null = null;
const listeners = new Set<() => void>();
let timer: number | undefined;

export function showToast(text: string, link?: ToastState['link']) {
  toast = { id: Date.now(), text, link };
  listeners.forEach((l) => l());
  window.clearTimeout(timer);
  timer = window.setTimeout(() => {
    toast = null;
    listeners.forEach((l) => l());
  }, 3200);
}

export function ToastHost() {
  const t = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => toast,
  );
  return (
    <div className="toast-host" aria-live="polite">
      {t && (
        <div className="toast" key={t.id}>
          <span>{t.text}</span>
          {t.link && <Link to={t.link.to}>{t.link.label}</Link>}
        </div>
      )}
    </div>
  );
}
