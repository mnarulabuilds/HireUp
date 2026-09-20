import type { MatchFeedback, MatchScores } from '@hireup/shared';
import { ScoreBars } from './ScoreBars';

type Props = {
  scores: MatchScores;
  feedback: MatchFeedback;
  provider?: string;
  cached?: boolean;
  jobTitle?: string | null;
};

export function MatchFeedbackPanel({
  scores,
  feedback,
  provider,
  cached,
  jobTitle,
}: Props) {
  return (
    <section
      className="panel stack fade-up"
      aria-labelledby="match-results-heading"
      aria-live="polite"
    >
      <div className="section-header-row">
        <h2 id="match-results-heading" style={{ margin: 0 }}>
          Match results
        </h2>
        <div className="toolbar-actions">
          {cached && <span className="badge-muted">Cached result</span>}
          {provider && <span className="badge-muted">Scored via {provider}</span>}
        </div>
      </div>
      {jobTitle && (
        <p className="muted" style={{ margin: 0 }}>
          Target role: <strong>{jobTitle}</strong>
        </p>
      )}
      <ScoreBars scores={scores} />
      <div className="stack">
        <div>
          <h3>Strengths</h3>
          <ul>
            {feedback.strengths.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3>Gaps</h3>
          <ul>
            {feedback.gaps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3>Recommended actions</h3>
          <ul>
            {feedback.actions.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3>Interview clearance path</h3>
          <ul className="interview-stage-list">
            {feedback.interviewStages.map((stage) => (
              <li key={stage.stage}>
                <strong>
                  {stage.stage}: {stage.likelihood}%
                </strong>
                <span className="muted"> — {stage.tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
