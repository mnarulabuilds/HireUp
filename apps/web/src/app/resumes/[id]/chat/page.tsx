'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

type ChatState = {
  resumeId: string;
  completed: boolean;
  question: { id: string; prompt: string } | null;
  stepIndex?: number;
  total?: number;
};

type Message = { role: 'bot' | 'user'; text: string };

export default function ChatBuilderPage() {
  const params = useParams<{ id: string }>();
  const resumeId = params.id;
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [answer, setAnswer] = useState('');
  const [state, setState] = useState<ChatState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    api<ChatState>(`/chat-builder/${resumeId}`)
      .then((s) => {
        setState(s);
        if (s.question) {
          setMessages([{ role: 'bot', text: s.question.prompt }]);
        }
        if (s.completed) {
          router.replace(`/resumes/${resumeId}/edit`);
        }
      })
      .catch((err) => {
        if (err?.status === 401) window.location.href = '/login';
        else setError(err?.message ?? 'Failed to load chat');
      });
  }, [resumeId, router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!answer.trim() || !state?.question) return;
    setSending(true);
    setError(null);
    const userText = answer.trim();
    setMessages((m) => [...m, { role: 'user', text: userText }]);
    setAnswer('');
    try {
      const next = await api<ChatState>(`/chat-builder/${resumeId}/answer`, {
        method: 'POST',
        body: JSON.stringify({ answer: userText }),
      });
      setState(next);
      if (next.completed) {
        setMessages((m) => [
          ...m,
          { role: 'bot', text: 'All set — opening your resume editor.' },
        ]);
        setTimeout(() => router.push(`/resumes/${resumeId}/edit`), 700);
      } else if (next.question) {
        setMessages((m) => [...m, { role: 'bot', text: next.question!.prompt }]);
      }
    } catch (err) {
      setError((err as { message?: string })?.message ?? 'Could not send answer');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="app-shell">
      <div className="container stack" style={{ maxWidth: 720 }}>
        <Link href="/dashboard" className="muted">
          ← Dashboard
        </Link>
        <h1>Chat questionnaire</h1>
        <p className="muted">
          Step {(state?.stepIndex ?? 0) + 1} of {state?.total ?? '…'}
        </p>
        <div className="panel chat-log" aria-live="polite">
          {messages.map((m, i) => (
            <div
              key={`${m.role}-${i}`}
              className={`bubble ${m.role === 'bot' ? 'bubble-bot' : 'bubble-user'}`}
            >
              {m.text}
            </div>
          ))}
        </div>
        {error && <p style={{ color: '#9b1c1c' }}>{error}</p>}
        <form className="stack" onSubmit={submit}>
          <div className="field">
            <label htmlFor="answer">Your answer</label>
            <textarea
              id="answer"
              rows={3}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              disabled={sending || state?.completed}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={sending}>
            {sending ? 'Sending…' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
}
