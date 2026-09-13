import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Resume tips',
  description: 'Practical resume and interview tips from HireUp.',
};

const tips = [
  {
    title: 'Mirror the job’s vocabulary',
    body: 'ATS systems and humans both reward exact skill phrasing from the posting.',
  },
  {
    title: 'Lead with outcomes',
    body: 'Replace task lists with bullets that include a metric, audience, or business result.',
  },
  {
    title: 'Keep contact fields machine-readable',
    body: 'Plain-text email and phone near the top improve parse rates across recruiters’ tools.',
  },
];

export default function TipsPage() {
  return (
    <section className="section">
      <div className="container stack">
        <div>
          <h1>Tips for landing the interview</h1>
          <p className="lead">
            Short, practical guidance you can apply while editing in HireUp.
          </p>
        </div>
        {tips.map((tip) => (
          <article key={tip.title} className="panel">
            <h2 style={{ marginTop: 0 }}>{tip.title}</h2>
            <p className="muted">{tip.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
