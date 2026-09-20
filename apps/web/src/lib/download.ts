import { API_URL } from './api';

export async function downloadResumeExport(
  resumeId: string,
  format: 'txt' | 'pdf',
): Promise<void> {
  const path =
    format === 'pdf'
      ? `/resumes/${resumeId}/export/pdf`
      : `/resumes/${resumeId}/export`;
  const res = await fetch(`${API_URL}/api/v1${path}`, {
    credentials: 'include',
  });
  if (!res.ok) {
    let message = res.statusText;
    try {
      const data = await res.json();
      message = data.message ?? message;
    } catch {
      // ignore
    }
    throw new Error(String(message));
  }
  const blob = await res.blob();
  const disposition = res.headers.get('Content-Disposition') ?? '';
  const match = disposition.match(/filename="([^"]+)"/);
  const filename =
    match?.[1] ?? `resume.${format === 'pdf' ? 'pdf' : 'txt'}`;
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
