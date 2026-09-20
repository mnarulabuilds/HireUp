'use client';

import type { ResumeContent, ResumeSectionConfigItem, SectionType } from '@hireup/shared';
import {
  ATS_SECTION_HEADINGS,
  DEFAULT_SECTION_ORDER,
  normalizeSectionConfig,
  reorderSectionConfig,
} from '@hireup/shared';

const LABELS: Record<SectionType, string> = {
  summary: 'Summary',
  experience: 'Experience',
  education: 'Education',
  skills: 'Skills',
  projects: 'Projects',
  custom: 'Custom blocks',
};

type Props = {
  content: ResumeContent;
  onChange: (next: ResumeContent) => void;
};

export function ResumeSectionControls({ content, onChange }: Props) {
  const config = normalizeSectionConfig(content.sectionConfig);

  function updateConfig(next: ResumeSectionConfigItem[]) {
    onChange({ ...content, sectionConfig: next });
  }

  function move(type: SectionType, direction: -1 | 1) {
    updateConfig(reorderSectionConfig(config, type, direction));
  }

  return (
    <section className="panel stack" aria-labelledby="section-controls-heading">
      <div>
        <h2 id="section-controls-heading" style={{ margin: 0 }}>
          ATS sections
        </h2>
        <p className="muted" style={{ margin: '0.35rem 0 0', fontSize: '0.9rem' }}>
          Choose which sections appear in exports and their order. Use standard
          headings for best parser compatibility.
        </p>
      </div>
      <ul className="section-control-list" role="list">
        {config.map((item) => (
          <li key={item.type} className="section-control-row">
            <label className="section-toggle">
              <input
                type="checkbox"
                aria-label={`Include ${LABELS[item.type]} section`}
                checked={item.enabled}
                onChange={(e) => {
                  const next = config.map((c) =>
                    c.type === item.type ? { ...c, enabled: e.target.checked } : c,
                  );
                  updateConfig(next);
                }}
              />
              <span>{LABELS[item.type]}</span>
            </label>
            <input
              className="section-heading-input"
              aria-label={`${LABELS[item.type]} ATS heading`}
              placeholder={ATS_SECTION_HEADINGS[item.type]}
              value={item.heading ?? ''}
              onChange={(e) => {
                const next = config.map((c) =>
                  c.type === item.type
                    ? { ...c, heading: e.target.value || undefined }
                    : c,
                );
                updateConfig(next);
              }}
            />
            <div className="section-move">
              <button
                type="button"
                className="btn btn-secondary btn-icon"
                aria-label={`Move ${LABELS[item.type]} up`}
                disabled={config[0]?.type === item.type}
                onClick={() => move(item.type, -1)}
              >
                ↑
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-icon"
                aria-label={`Move ${LABELS[item.type]} down`}
                disabled={config[config.length - 1]?.type === item.type}
                onClick={() => move(item.type, 1)}
              >
                ↓
              </button>
            </div>
          </li>
        ))}
      </ul>
      <div>
        <p className="muted" style={{ fontSize: '0.85rem', margin: '0 0 0.35rem' }}>
          Export order preview
        </p>
        <div className="section-order-preview" aria-label="Current export section order">
          {config.map((item) => (
            <span
              key={item.type}
              className={`section-order-chip${item.enabled ? '' : ' is-disabled'}`}
            >
              {LABELS[item.type]}
            </span>
          ))}
        </div>
        <p className="muted" style={{ fontSize: '0.85rem', margin: '0.5rem 0 0' }}>
          Recommended ATS order: {DEFAULT_SECTION_ORDER.slice(0, 4).join(' → ')}.
        </p>
      </div>
    </section>
  );
}
