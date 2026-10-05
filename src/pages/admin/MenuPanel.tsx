import { useState } from 'react';
import { showToast } from '../../components/Overlay';
import { uid, updateDB, useDB } from '../../data/store';
import type { CategoryId, MenuTile } from '../../data/types';
import { cardBackground, edgeColor } from '../../lib/color';
import { Placeholder } from '../../components/ProductCard';
import { CATEGORY_NAMES, lineLabel, linesOf } from '../../lib/catalog';
import { ColorPicker, PhotoField, confirmDelete } from './shared';

function TileEditor({ initial, isNew, onDone }: { initial: MenuTile; isNew: boolean; onDone: () => void }) {
  const db = useDB();
  const [t, setT] = useState(initial);
  return (
    <div className="editor">
      <div className="editor-fields">
        <div className="field-pair">
          <label>
            <span className="field-label">Label</span>
            <input value={t.label} onChange={(e) => setT({ ...t, label: e.target.value })} />
          </label>
          <label>
            <span className="field-label">Opens</span>
            <select value={t.lineId ?? ''} onChange={(e) => setT({ ...t, lineId: e.target.value || undefined })}>
              <option value="">All {CATEGORY_NAMES[t.category]}</option>
              {linesOf(db, t.category).map((l) => <option key={l.id} value={l.id}>{lineLabel(l)}</option>)}
            </select>
          </label>
        </div>
        <ColorPicker hue={t.hue} saturation={t.saturation} intensity={t.intensity} onChange={(c) => setT({ ...t, ...c })} />
        <PhotoField photo={t.photo} onChange={(photo) => setT({ ...t, photo })} />
        <div className="btn-row">
          <button
            type="button"
            className="btn btn-primary"
            disabled={!t.label.trim()}
            onClick={() => {
              updateDB((d) => {
                const i = d.tiles.findIndex((x) => x.id === t.id);
                if (i >= 0) d.tiles[i] = t;
                else d.tiles.push(t);
              });
              showToast(isNew ? 'Tile added' : 'Tile saved');
              onDone();
            }}
          >
            {isNew ? 'Add tile' : 'Save tile'}
          </button>
          <button type="button" className="btn btn-ghost" onClick={onDone}>Cancel</button>
        </div>
      </div>
      <div className="editor-preview">
        <span className="field-label">Live preview</span>
        <div className="tile tile-preview">
          <span className="tile-art" style={{ background: cardBackground(t.hue, t.saturation, t.intensity) }}>{t.photo ? <img src={t.photo} alt="" /> : <Placeholder category={t.category} color={edgeColor(t.hue, t.saturation, Math.min(100, t.intensity + 25))} />}</span>
          <span className="tile-label">{t.label || 'Label'}</span>
        </div>
      </div>
    </div>
  );
}

export default function MenuTab() {
  const db = useDB();
  const [edit, setEdit] = useState<{ t: MenuTile; isNew: boolean } | null>(null);
  const k = db.settings.menuIntensity / 100;

  return (
    <div className="tab">
      <section className="admin-section">
        <h2 className="h-section">Menu background</h2>
        <label className="intensity-row">
          <span className="field-label">Lighter / darker green behind the menu</span>
          <input
            type="range"
            min={0}
            max={100}
            className="range"
            value={db.settings.menuIntensity}
            style={{ ['--track' as string]: 'linear-gradient(90deg, hsl(96 46% 92%), hsl(96 54% 22%))' }}
            onChange={(e) => updateDB((d) => (d.settings.menuIntensity = Number(e.target.value)))}
          />
          <span className="intensity-swatch" style={{ background: `hsl(96 ${46 + k * 8}% ${92 - k * 70}%)` }} />
        </label>
      </section>

      {(['flower', 'vapes'] as CategoryId[]).map((c) => (
        <section key={c} className="admin-section">
          <div className="list-head">
            <h2 className="h-section">{CATEGORY_NAMES[c]} tiles</h2>
            <button type="button" className="btn btn-primary btn-small" onClick={() => setEdit({ t: { id: uid('t'), category: c, label: '', hue: 96, saturation: 55, intensity: 50 }, isNew: true })}>Add tile</button>
          </div>
          {edit?.isNew && edit.t.category === c && <TileEditor initial={edit.t} isNew onDone={() => setEdit(null)} />}
          <ul className="admin-list">
            {db.tiles.filter((t) => t.category === c).map((t) => (
              <li key={t.id} className="admin-row">
                {edit && !edit.isNew && edit.t.id === t.id ? (
                  <TileEditor initial={t} isNew={false} onDone={() => setEdit(null)} />
                ) : (
                  <>
                    <span className="row-thumb" style={{ background: cardBackground(t.hue, t.saturation, t.intensity) }}>{t.photo && <img src={t.photo} alt="" />}</span>
                    <div className="row-main">
                      <span className="row-name">{t.label}</span>
                      <span className="row-meta">Opens {t.lineId ? lineLabel(db.lines.find((l) => l.id === t.lineId) ?? { id: '', name: 'a removed line', category: c, sort: 0 }) : `all ${CATEGORY_NAMES[c]}`}</span>
                    </div>
                    <div className="row-actions">
                      <button type="button" className="btn btn-small btn-ghost" onClick={() => setEdit({ t, isNew: false })}>Edit</button>
                      <button type="button" className="btn btn-small btn-ghost danger" onClick={() => confirmDelete(`the ${t.label} tile`) && updateDB((d) => (d.tiles = d.tiles.filter((x) => x.id !== t.id)))}>Remove</button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
