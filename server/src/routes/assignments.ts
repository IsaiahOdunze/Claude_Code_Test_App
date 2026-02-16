import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/requireAdmin';
import { computeOccurrences } from '../services/recurrence.service';
import { getNextRotationUser } from '../services/rotation.service';

const router = Router();

router.use(authenticate);

// Parse date strings as UTC to avoid timezone issues
function toUTCDate(s: string): Date {
  const d = new Date(s + (s.includes('T') ? '' : 'T00:00:00.000Z'));
  return d;
}

function startOfDayUTC(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function endOfDayUTC(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));
}

const querySchema = z.object({
  start: z.string().transform((s) => toUTCDate(s)),
  end: z.string().transform((s) => toUTCDate(s)),
});

const createAssignmentSchema = z.object({
  choreId: z.string(),
  userId: z.string(),
  assignedDate: z.string().transform((s) => toUTCDate(s)),
  rotationOrder: z.number().optional(),
});

// GET /api/assignments?start=DATE&end=DATE - Primary calendar data source
router.get('/', async (req: Request, res: Response) => {
  try {
    const { start, end } = querySchema.parse(req.query);
    const rangeStart = startOfDayUTC(start);
    const rangeEnd = endOfDayUTC(end);

    // Expand recurring chores into assignments
    await expandRecurringChores(rangeStart, rangeEnd);

    // Fetch all assignments in range
    const assignments = await prisma.assignment.findMany({
      where: {
        assignedDate: { gte: rangeStart, lte: rangeEnd },
      },
      include: {
        chore: true,
        user: { select: { id: true, name: true, email: true } },
        completion: true,
      },
      orderBy: { assignedDate: 'asc' },
    });

    res.json(assignments);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors });
    }
    res.status(500).json({ error: err.message });
  }
});

// POST /api/assignments - Manual assign
router.post('/', requireAdmin, async (req: Request, res: Response) => {
  try {
    const body = createAssignmentSchema.parse(req.body);
    const assignment = await prisma.assignment.create({
      data: {
        choreId: body.choreId,
        userId: body.userId,
        assignedDate: startOfDayUTC(body.assignedDate),
        rotationOrder: body.rotationOrder,
      },
      include: {
        chore: true,
        user: { select: { id: true, name: true, email: true } },
        completion: true,
      },
    });
    res.status(201).json(assignment);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors });
    }
    if (err.code === 'P2002') {
      return res.status(400).json({ error: 'Assignment already exists for this chore on this date' });
    }
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/assignments/:id
router.delete('/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    await prisma.assignment.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

async function expandRecurringChores(rangeStart: Date, rangeEnd: Date) {
  const chores = await prisma.chore.findMany({
    where: {
      recurrenceType: { not: 'NONE' },
      startDate: { lte: rangeEnd },
      OR: [{ endDate: null }, { endDate: { gte: rangeStart } }],
    },
  });

  for (const chore of chores) {
    const occurrences = computeOccurrences(
      chore.recurrenceType,
      chore.startDate,
      chore.endDate,
      rangeStart,
      rangeEnd
    );

    // Find existing assignments to avoid duplicates
    const existing = await prisma.assignment.findMany({
      where: {
        choreId: chore.id,
        assignedDate: { gte: rangeStart, lte: rangeEnd },
      },
      select: { assignedDate: true },
    });

    const existingDates = new Set(
      existing.map((a) => startOfDayUTC(a.assignedDate).toISOString())
    );

    // Get assigned users for this chore (from past assignments)
    const assignedUsers = await getChoreUsers(chore.id);
    if (assignedUsers.length === 0) continue;

    for (const date of occurrences) {
      const dateKey = startOfDayUTC(date).toISOString();
      if (existingDates.has(dateKey)) continue;

      let userId: string;
      let rotationOrder: number | undefined;

      if (chore.autoRotate && assignedUsers.length > 1) {
        const rotation = await getNextRotationUser(chore.id, assignedUsers);
        userId = rotation.userId;
        rotationOrder = rotation.rotationOrder;
      } else {
        userId = assignedUsers[0];
      }

      try {
        await prisma.assignment.create({
          data: {
            choreId: chore.id,
            userId,
            assignedDate: startOfDayUTC(date),
            rotationOrder,
          },
        });
      } catch {
        // Ignore duplicate key errors from concurrent expansion
      }
    }
  }
}

async function getChoreUsers(choreId: string): Promise<string[]> {
  const assignments = await prisma.assignment.findMany({
    where: { choreId },
    select: { userId: true, rotationOrder: true },
    distinct: ['userId'],
    orderBy: { rotationOrder: 'asc' },
  });

  return assignments.map((a) => a.userId);
}

export default router;
