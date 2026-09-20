import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { downloadResumeExport } from './download';

describe('downloadResumeExport', () => {
  const fetchMock = vi.fn();
  let clickSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:mock'),
      revokeObjectURL: vi.fn(),
    });
    clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    clickSpy.mockRestore();
  });

  it('downloads txt exports using response filename', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      blob: vi.fn().mockResolvedValue(new Blob(['hello'])),
      headers: {
        get: (key: string) =>
          key === 'Content-Disposition' ? 'filename="my-resume.txt"' : null,
      },
    });

    await downloadResumeExport('r1', 'txt');

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/resumes/r1/export'),
      expect.objectContaining({ credentials: 'include' }),
    );
    expect(clickSpy).toHaveBeenCalled();
  });

  it('throws parsed API errors for failed pdf exports', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      statusText: 'Forbidden',
      json: vi.fn().mockResolvedValue({ message: 'Upgrade required' }),
    });

    await expect(downloadResumeExport('r1', 'pdf')).rejects.toThrow('Upgrade required');
  });

  it('falls back to default filename when header is missing', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      blob: vi.fn().mockResolvedValue(new Blob(['%PDF'])),
      headers: { get: () => null },
    });

    await downloadResumeExport('r1', 'pdf');
    expect(clickSpy).toHaveBeenCalled();
  });
});
