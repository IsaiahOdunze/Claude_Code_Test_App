import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/requireAdmin';

const router = Router();

router.use(authenticate);

const createChoreSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  recurrenceType: z.enum(['NONE', 'DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY']).default('NONE'),
  startDate: z.string().transform((s) => new Date(s)),
  endDate: z.string().transform((s) => new Date(s)).optional(),
  autoRotate: z.boolean().default(false),
  assignedUserIds: z.array(z.string()).optional().default([]),
});

const updateChoreSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  recurrenceType: z.enum(['NONE', 'DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY']).optional(),
  startDate: z.string().transform((s) => new Date(s)).optional(),
  endDate: z.string().transform((s) => new Date(s)).nullable().optional(),
  autoRotate: z.boolean().optional(),
  assignedUserIds: z.array(z.string()).optional(),
});

router.get('/', async (_req: Request, res: Response) => {
  const chores = await prisma.chore.findMany({
    include: {
      assignments: {
        select: { userId: true, user: { select: { id: true, name: true } } },
        distinct: ['userId'],
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(chores);
});

router.post('/', requireAdmin, async (req: Request, res: Response) => {
  try {
    const body = createChoreSchema.parse(req.body);
    const { assignedUserIds, ...choreData } = body;

    const chore = await prisma.chore.create({
      data: choreData,
    });

    res.status(201).json(chore);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors });
    }
    res.status(400).json({ error: err.message });
  }
});

router.patch('/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const body = updateChoreSchema.parse(req.body);
    const { assignedUserIds, ...choreData } = body;

    const chore = await prisma.chore.update({
      where: { id: req.params.id },
      data: choreData,
    });

    res.json(chore);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors });
    }
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    await prisma.chore.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
