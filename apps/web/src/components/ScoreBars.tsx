import type { MatchScores } from '@hireup/shared';

const labels: { key: keyof MatchScores; label: string }[] = [
  { key: 'overall', label: 'Overall' },
  { key: 'ats', label: 'ATS' },
  { key: 'skills', label: 'Skills' },
  { key: 'experience', label: 'Experience' },
  { key: 'interviewClearance', label: 'Interview' },
];

export function ScoreBars({ scores }: { scores: MatchScores }) {
  return (
    <div className="stack" data-testid="score-bars">
      {labels.map(({ key, label }) => (
        <div className="score-row" key={key}>
          <span>{label}</span>
          <div className="bar" aria-hidden>
            <span style={{ width: `${Math.max(0, Math.min(100, scores[key]))}%` }} />
          </div>
          <strong>{scores[key]}</strong>
        </div>
      ))}
    </div>
  );
}
