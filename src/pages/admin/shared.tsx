import { useId, useState, type ReactNode } from 'react';
import { SWATCHES, edgeColor, swatchMatches } from '../../lib/color';
import { readPhoto } from '../../lib/util';

export function ColorPicker({
  hue,
  saturation,
  intensity,
  onChange,
}: {
  hue: number;
  saturation: number;
  intensity: number;
  onChange: (c: { hue: number; saturation: number; intensity: number }) => void;
}) {
  const id = useId();
  return (
    <div className="color-picker">
      <span className="field-label">Card color</span>
      <div className="swatches" role="radiogroup" aria-label="Card color">
        {SWATCHES.map((s) => (
          <button
            key={s.name}
            type="button"
            role="radio"
            aria-checked={swatchMatches(s, hue, saturation)}
            aria-label={s.name}
            title={s.name}
            className={`swatch${swatchMatches(s, hue, saturation) ? ' is-on' : ''}`}
            style={{ background: edgeColor(s.hue, s.saturation, 50) }}
            onClick={() => onChange({ hue: s.hue, saturation: s.saturation, intensity })}
          />
        ))}
      </div>
      <label htmlFor={id} className="field-label">
        Lighter / darker
      </label>
      <input
        id={id}
        type="range"
        min={0}
        max={100}
        value={intensity}
        className="range"
        style={{ ['--track' as string]: `linear-gradient(90deg, ${edgeColor(hue, saturation, 0)}, ${edgeColor(hue, saturation, 100)})` }}
        onChange={(e) => onChange({ hue, saturation, intensity: Number(e.target.value) })}
      />
    </div>
  );
}

export function PhotoField({ photo, onChange, label = 'Photo' }: { photo?: string; onChange: (p: string | undefined) => void; label?: string }) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <div className="photo-field">
      <span className="field-label">{label}</span>
      <div className="photo-row">
        {photo && <img src={photo} alt="" className="photo-thumb" />}
        <label className="btn btn-small btn-ghost file-btn">
          {busy ? 'Loading…' : photo ? 'Replace photo' : 'Upload photo'}
          <input
            type="file"
            accept="image/*"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (!file) return;
              setError('');
              setBusy(true);
              try {
                onChange(await readPhoto(file));
              } catch (err) {
                setError((err as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          />
        </label>
        {photo && (
          <button type="button" className="link-btn" onClick={() => onChange(undefined)}>
            Remove photo
          </button>
        )}
      </div>
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}

/** Text input for a dollar amount that tolerates "$20" and blank. */
export function MoneyInput({ value, onChange, label, placeholder }: { value?: number; onChange: (v: number | undefined) => void; label: ReactNode; placeholder?: string }) {
  const [text, setText] = useState(value === undefined ? '' : String(value));
  return (
    <label className="money">
      <span className="field-label">{label}</span>
      <span className="money-box">
        <span aria-hidden="true">$</span>
        <input
          inputMode="decimal"
          value={text}
          placeholder={placeholder}
          onChange={(e) => {
            setText(e.target.value);
            const n = parseFloat(e.target.value.replace(/[$,\s]/g, ''));
            onChange(e.target.value.trim() === '' ? undefined : Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : value);
          }}
        />
      </span>
    </label>
  );
}

/** Shop staff: the manager and the owner. */
export const MAX_ADMINS = 2;

export function confirmDelete(what: string): boolean {
  return window.confirm(`Remove ${what}? This can't be undone.`);
}
