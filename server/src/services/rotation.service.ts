import { prisma } from '../index';

export async function getNextRotationUser(
  choreId: string,
  userIds: string[]
): Promise<{ userId: string; rotationOrder: number }> {
  if (userIds.length === 0) {
    throw new Error('No users available for rotation');
  }

  // Find the last assignment for this chore with a rotationOrder
  const lastAssignment = await prisma.assignment.findFirst({
    where: { choreId, rotationOrder: { not: null } },
    orderBy: { assignedDate: 'desc' },
  });

  let nextOrder: number;
  if (!lastAssignment || lastAssignment.rotationOrder === null) {
    nextOrder = 0;
  } else {
    nextOrder = (lastAssignment.rotationOrder + 1) % userIds.length;
  }

  return {
    userId: userIds[nextOrder],
    rotationOrder: nextOrder,
  };
}
