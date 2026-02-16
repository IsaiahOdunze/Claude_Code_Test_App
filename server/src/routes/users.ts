import { Router, Request, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '../index';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/requireAdmin';

const router = Router();

router.use(authenticate);

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(6),
  role: z.enum(['ADMIN', 'MEMBER']).optional().default('MEMBER'),
});

const updateUserSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().min(1).optional(),
  password: z.string().min(6).optional(),
  role: z.enum(['ADMIN', 'MEMBER']).optional(),
});

router.get('/', async (_req: Request, res: Response) => {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true, createdAt: true },
    orderBy: { name: 'asc' },
  });
  res.json(users);
});

router.post('/', requireAdmin, async (req: Request, res: Response) => {
  try {
    const body = createUserSchema.parse(req.body);
    const passwordHash = await bcrypt.hash(body.password, 10);
    const user = await prisma.user.create({
      data: { email: body.email, name: body.name, passwordHash, role: body.role },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });
    res.status(201).json(user);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors });
    }
    if (err.code === 'P2002') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(400).json({ error: err.message });
  }
});

router.patch('/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const body = updateUserSchema.parse(req.body);
    const data: any = { ...body };
    if (body.password) {
      data.passwordHash = await bcrypt.hash(body.password, 10);
      delete data.password;
    }
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data,
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });
    res.json(user);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors });
    }
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    // Prevent deleting yourself
    if (req.params.id === req.user!.userId) {
      return res.status(400).json({ error: 'Cannot delete yourself' });
    }
    await prisma.user.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
