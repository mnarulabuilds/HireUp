import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ResumesService } from './resumes.service';
import { emptyResumeContent } from '@hireup/shared';

describe('ResumesService', () => {
  const prisma = {
    resume: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };
  const entitlements = { can: jest.fn() };
  const parser = { parse: jest.fn() };
  const pdf = { buildPdf: jest.fn().mockResolvedValue(Buffer.from('pdf')) };

  const service = new ResumesService(
    prisma as never,
    entitlements as never,
    parser as never,
    pdf as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns normalized content from get', async () => {
    prisma.resume.findFirst.mockResolvedValue({
      id: 'r1',
      userId: 'u1',
      title: 'Resume',
      content: { basics: { fullName: 'Ada', email: 'a@x.com' } },
    });
    const result = await service.get('u1', 'r1');
    expect(result.content.sectionConfig).toBeDefined();
    expect(result.content.basics.fullName).toBe('Ada');
  });

  it('throws when resume missing', async () => {
    prisma.resume.findFirst.mockResolvedValue(null);
    await expect(service.get('u1', 'missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('returns suggestions payload', async () => {
    prisma.resume.findFirst.mockResolvedValue({
      id: 'r1',
      userId: 'u1',
      title: 'Resume',
      content: emptyResumeContent(),
    });
    const result = await service.suggestions('u1', 'r1');
    expect(result.atsReadiness).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(result.suggestions)).toBe(true);
  });

  it('blocks export when entitlement denied', async () => {
    entitlements.can.mockResolvedValue({ allowed: false, reason: 'Upgrade' });
    prisma.resume.findFirst.mockResolvedValue({
      id: 'r1',
      userId: 'u1',
      title: 'Resume',
      content: emptyResumeContent(),
    });
    await expect(service.exportText('u1', 'r1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('lists resumes for user', async () => {
    prisma.resume.findMany.mockResolvedValue([{ id: 'r1' }]);
    const list = await service.list('u1');
    expect(list).toHaveLength(1);
  });

  it('creates resume when entitled', async () => {
    entitlements.can.mockResolvedValue({ allowed: true });
    prisma.resume.create.mockResolvedValue({ id: 'new' });
    const result = await service.create('u1', {
      title: 'New',
      source: 'FORM',
    });
    expect(result.id).toBe('new');
  });

  it('updates resume content', async () => {
    prisma.resume.findFirst.mockResolvedValue({
      id: 'r1',
      userId: 'u1',
      title: 'Resume',
      content: emptyResumeContent(),
    });
    prisma.resume.update.mockResolvedValue({ id: 'r1' });
    await service.update('u1', 'r1', { title: 'Updated' });
    expect(prisma.resume.update).toHaveBeenCalled();
  });

  it('exports plain text when allowed', async () => {
    entitlements.can.mockResolvedValue({ allowed: true });
    prisma.resume.findFirst.mockResolvedValue({
      id: 'r1',
      userId: 'u1',
      title: 'My Resume',
      content: emptyResumeContent(),
    });
    const result = await service.exportText('u1', 'r1');
    expect(result.filename).toMatch(/\.txt$/);
    expect(result.body.length).toBeGreaterThan(0);
  });

  it('creates from upload when entitled', async () => {
    entitlements.can.mockResolvedValue({ allowed: true });
    parser.parse.mockResolvedValue(emptyResumeContent());
    prisma.resume.create.mockResolvedValue({ id: 'up' });
    const file = { originalname: 'cv.pdf' } as Express.Multer.File;
    const created = await service.createFromUpload('u1', file);
    expect(created.id).toBe('up');
  });

  it('deletes resume', async () => {
    prisma.resume.findFirst.mockResolvedValue({
      id: 'r1',
      userId: 'u1',
      title: 'Resume',
      content: emptyResumeContent(),
    });
    await service.remove('u1', 'r1');
    expect(prisma.resume.delete).toHaveBeenCalledWith({ where: { id: 'r1' } });
  });

  it('exports pdf when allowed', async () => {
    entitlements.can.mockResolvedValue({ allowed: true });
    prisma.resume.findFirst.mockResolvedValue({
      id: 'r1',
      userId: 'u1',
      title: 'My Resume',
      content: emptyResumeContent(),
    });
    const result = await service.exportPdf('u1', 'r1');
    expect(result.filename).toMatch(/\.pdf$/);
    expect(pdf.buildPdf).toHaveBeenCalled();
  });
});
