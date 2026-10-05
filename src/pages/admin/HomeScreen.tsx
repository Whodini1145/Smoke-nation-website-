import { useState } from 'react';
import { showToast } from '../../components/Overlay';
import { uid, updateDB, useDB } from '../../data/store';
import type { Review, Slide } from '../../data/types';
import { Stars } from '../Home';
import { PhotoField, confirmDelete } from './shared';

const LINK_OPTIONS = [
  { to: '', label: 'No button' },
  { to: '/shop/flower', label: 'THCA Flower' },
  { to: '/shop/vapes', label: 'Vapes' },
  { to: '/shop/vapes/deals', label: 'Vape deals' },
  { to: '/about', label: 'About us & hours' },
];

function SlideEditor({ initial, isNew, onDone }: { initial: Slide; isNew: boolean; onDone: () => void }) {
  const [s, setS] = useState(initial);
  return (
    <div className="editor">
      <div className="editor-fields">
        {s.brand ? (
          <p className="fine">This is the logo slide. It always shows the Smoke Nation logo.</p>
        ) : (
          <>
            <label>
              <span className="field-label">Caption</span>
              <input value={s.caption} onChange={(e) => setS({ ...s, caption: e.target.value })} placeholder="Short line over the photo" />
            </label>
            <div className="field-pair">
              <label>
                <span className="field-label">Button goes to</span>
                <select value={s.link ?? ''} onChange={(e) => setS({ ...s, link: e.target.value || undefined })}>
                  {LINK_OPTIONS.map((o) => <option key={o.to} value={o.to}>{o.label}</option>)}
                </select>
              </label>
              {s.link && (
                <label>
                  <span className="field-label">Button text</span>
                  <input value={s.linkLabel ?? ''} onChange={(e) => setS({ ...s, linkLabel: e.target.value })} placeholder="e.g. Shop flower" />
                </label>
              )}
            </div>
            <PhotoField photo={s.photo} onChange={(photo) => setS({ ...s, photo })} label="Banner photo (wide photos work best)" />
          </>
        )}
        <div className="btn-row">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              updateDB((d) => {
                const i = d.slides.findIndex((x) => x.id === s.id);
                if (i >= 0) d.slides[i] = s;
                else d.slides.push(s);
              });
              showToast(isNew ? 'Slide added' : 'Slide saved');
              onDone();
            }}
            disabled={!s.brand && !s.caption.trim() && !s.photo}
          >
            {isNew ? 'Add slide' : 'Save slide'}
          </button>
          <button type="button" className="btn btn-ghost" onClick={onDone}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

function ReviewEditor({ initial, isNew, onDone }: { initial: Review; isNew: boolean; onDone: () => void }) {
  const [r, setR] = useState(initial);
  return (
    <div className="editor">
      <div className="editor-fields">
        <div className="field-pair">
          <label>
            <span className="field-label">Name</span>
            <input value={r.name} onChange={(e) => setR({ ...r, name: e.target.value })} placeholder="e.g. Jordan M." />
          </label>
          <label>
            <span className="field-label">Stars</span>
            <select value={r.stars} onChange={(e) => setR({ ...r, stars: Number(e.target.value) })}>
              {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} star{n > 1 ? 's' : ''}</option>)}
            </select>
          </label>
        </div>
        <label>
          <span className="field-label">Review</span>
          <textarea rows={3} value={r.text} onChange={(e) => setR({ ...r, text: e.target.value })} />
        </label>
        <div className="btn-row">
          <button
            type="button"
            className="btn btn-primary"
            disabled={!r.name.trim() || !r.text.trim()}
            onClick={() => {
              updateDB((d) => {
                const i = d.reviews.findIndex((x) => x.id === r.id);
                if (i >= 0) d.reviews[i] = r;
                else d.reviews.push(r);
              });
              showToast(isNew ? 'Review added' : 'Review saved');
              onDone();
            }}
          >
            {isNew ? 'Add review' : 'Save review'}
          </button>
          <button type="button" className="btn btn-ghost" onClick={onDone}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default function HomeTab() {
  const db = useDB();
  const [slide, setSlide] = useState<{ s: Slide; isNew: boolean } | null>(null);
  const [review, setReview] = useState<{ r: Review; isNew: boolean } | null>(null);
  const move = (i: number, dir: -1 | 1) =>
    updateDB((d) => {
      const j = i + dir;
      if (j < 0 || j >= d.slides.length) return;
      [d.slides[i], d.slides[j]] = [d.slides[j], d.slides[i]];
    });

  return (
    <div className="tab">
      <section className="admin-section">
        <div className="list-head">
          <h2 className="h-section">Rotating banner</h2>
          <button type="button" className="btn btn-primary btn-small" onClick={() => setSlide({ s: { id: uid('s'), caption: '' }, isNew: true })}>Add slide</button>
        </div>
        <p className="fine">The banner shows {db.slides.length} slide{db.slides.length === 1 ? '' : 's'} with one dot each, in this order.</p>
        {slide?.isNew && <SlideEditor initial={slide.s} isNew onDone={() => setSlide(null)} />}
        <ul className="admin-list">
          {db.slides.map((s, i) => (
            <li key={s.id} className="admin-row">
              {slide && !slide.isNew && slide.s.id === s.id ? (
                <SlideEditor initial={s} isNew={false} onDone={() => setSlide(null)} />
              ) : (
                <>
                  <span className="row-thumb row-thumb-wide">{s.photo ? <img src={s.photo} alt="" /> : <span className="thumb-text">{s.brand ? 'Logo' : 'No photo'}</span>}</span>
                  <div className="row-main">
                    <span className="row-name">{s.brand ? 'Logo slide' : s.caption || 'Untitled slide'}</span>
                    {s.link && <span className="row-meta">Button: {s.linkLabel || 'Take a look'}</span>}
                  </div>
                  <div className="row-actions">
                    <button type="button" className="btn btn-small btn-ghost" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">Up</button>
                    <button type="button" className="btn btn-small btn-ghost" onClick={() => move(i, 1)} disabled={i === db.slides.length - 1} aria-label="Move down">Down</button>
                    <button type="button" className="btn btn-small btn-ghost" onClick={() => setSlide({ s, isNew: false })}>Edit</button>
                    <button type="button" className="btn btn-small btn-ghost danger" onClick={() => confirmDelete('this slide') && updateDB((d) => (d.slides = d.slides.filter((x) => x.id !== s.id)))}>Remove</button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="admin-section">
        <h2 className="h-section">Reviews</h2>
        <p className="fine">The overall rating is separate from the reviews you feature. Set it to match your Google listing.</p>
        <div className="field-pair">
          <label>
            <span className="field-label">Average rating</span>
            <input type="number" min={1} max={5} step={0.1} value={db.settings.rating} onChange={(e) => updateDB((d) => (d.settings.rating = Math.min(5, Math.max(0, Number(e.target.value)))))} />
          </label>
          <label>
            <span className="field-label">Number of Google reviews</span>
            <input type="number" min={0} value={db.settings.reviewCount} onChange={(e) => updateDB((d) => (d.settings.reviewCount = Math.max(0, Math.round(Number(e.target.value)))))} />
          </label>
        </div>
        <div className="list-head">
          <h3 className="h-sub">Featured reviews</h3>
          <button type="button" className="btn btn-primary btn-small" onClick={() => setReview({ r: { id: uid('r'), name: '', stars: 5, text: '' }, isNew: true })}>Add review</button>
        </div>
        {review?.isNew && <ReviewEditor initial={review.r} isNew onDone={() => setReview(null)} />}
        <ul className="admin-list">
          {db.reviews.map((r) => (
            <li key={r.id} className="admin-row">
              {review && !review.isNew && review.r.id === r.id ? (
                <ReviewEditor initial={r} isNew={false} onDone={() => setReview(null)} />
              ) : (
                <>
                  <div className="row-main">
                    <span className="row-name">{r.name} <Stars value={r.stars} size={14} /></span>
                    <span className="row-desc">{r.text}</span>
                  </div>
                  <div className="row-actions">
                    <button type="button" className="btn btn-small btn-ghost" onClick={() => setReview({ r, isNew: false })}>Edit</button>
                    <button type="button" className="btn btn-small btn-ghost danger" onClick={() => confirmDelete(`${r.name}'s review`) && updateDB((d) => (d.reviews = d.reviews.filter((x) => x.id !== r.id)))}>Remove</button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
