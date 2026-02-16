import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

const createCompletionSchema = z.object({
  assignmentId: z.string(),
  notes: z.string().optional(),
});

// POST /api/completions - Mark assignment done
router.post('/', async (req: Request, res: Response) => {
  try {
    const body = createCompletionSchema.parse(req.body);

    // Verify assignment exists and belongs to user (or user is admin)
    const assignment = await prisma.assignment.findUnique({
      where: { id: body.assignmentId },
    });
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    if (assignment.userId !== req.user!.userId && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Can only complete your own assignments' });
    }

    const completion = await prisma.completion.create({
      data: {
        assignmentId: body.assignmentId,
        userId: req.user!.userId,
        notes: body.notes,
      },
      include: {
        assignment: { include: { chore: true } },
      },
    });
    res.status(201).json(completion);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors });
    }
    if (err.code === 'P2002') {
      return res.status(400).json({ error: 'Assignment already completed' });
    }
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/completions/:id - Undo completion
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const completion = await prisma.completion.findUnique({
      where: { id: req.params.id },
    });
    if (!completion) {
      return res.status(404).json({ error: 'Completion not found' });
    }
    if (completion.userId !== req.user!.userId && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Can only undo your own completions' });
    }

    await prisma.completion.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
