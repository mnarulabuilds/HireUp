'use client';

import { useState } from 'react';

export function SponsoredTip() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <aside className="promo" aria-label="Sponsored tip">
      <div>
        <strong>Sponsored tip:</strong> Keep a living skills list — recruiters
        search exact keywords more than soft adjectives.
      </div>
      <button
        type="button"
        className="btn btn-secondary"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss sponsored tip"
      >
        Dismiss
      </button>
    </aside>
  );
}
