'use client';

import { useEffect, useState } from 'react';
import type { ResumeSuggestion } from '@hireup/shared';
import { api } from '@/lib/api';

type SuggestionsResponse = {
  atsReadiness: number;
  suggestions: ResumeSuggestion[];
};

export function ResumeSuggestionsPanel({ resumeId }: { resumeId: string }) {
  const [data, setData] = useState<SuggestionsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<SuggestionsResponse>(`/resumes/${resumeId}/suggestions`)
      .then(setData)
      .catch((err) => setError(err?.message ?? 'Could not load suggestions'));
  }, [resumeId]);

  if (error) {
    return (
      <section className="panel" role="alert">
        <p style={{ margin: 0, color: '#9b1c1c' }}>{error}</p>
      </section>
    );
  }

  if (!data) {
    return (
      <section className="panel stack" aria-busy="true" aria-label="Loading suggestions">
        <div className="skeleton" />
        <div className="skeleton" />
      </section>
    );
  }

  const grouped = data.suggestions.reduce<Record<string, ResumeSuggestion[]>>(
    (acc, s) => {
      acc[s.severity] = acc[s.severity] ?? [];
      acc[s.severity]!.push(s);
      return acc;
    },
    {},
  );

  return (
    <section className="panel stack" aria-labelledby="suggestions-heading">
      <div>
        <h2 id="suggestions-heading" style={{ margin: 0 }}>
          ATS readiness
        </h2>
        <p className="muted" style={{ margin: '0.35rem 0 0' }}>
          Score reflects structure, completeness, and export settings — not job-specific keywords.
        </p>
      </div>
      <div className="ats-score-ring" role="img" aria-label={`ATS readiness ${data.atsReadiness} out of 100`}>
        <strong>{data.atsReadiness}</strong>
        <span className="muted">/ 100</span>
      </div>
      {data.suggestions.length === 0 ? (
        <p className="muted" style={{ margin: 0 }}>
          Looking strong. Run a job match to tune keywords for a specific posting.
        </p>
      ) : (
        <div className="stack" role="list" aria-label="Improvement suggestions">
          {(['critical', 'warn', 'info'] as const).map((severity) =>
            grouped[severity]?.map((s) => (
              <article
                key={s.id}
                className={`suggestion suggestion-${severity}`}
                role="listitem"
              >
                <h3 style={{ margin: '0 0 0.25rem', fontSize: '1rem' }}>{s.title}</h3>
                <p className="muted" style={{ margin: 0, fontSize: '0.9rem' }}>
                  {s.detail}
                </p>
              </article>
            )),
          )}
        </div>
      )}
    </section>
  );
}
