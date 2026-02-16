import { useState } from 'react';
import { format } from 'date-fns';
import type { Assignment } from '../../hooks/useAssignments';
import { useCreateCompletion, useDeleteCompletion } from '../../hooks/useCompletions';
import { useAuthStore } from '../../stores/authStore';
import toast from 'react-hot-toast';

interface Props {
  assignment: Assignment;
  onClose: () => void;
}

export default function ChoreDetailModal({ assignment, onClose }: Props) {
  const [notes, setNotes] = useState('');
  const { user } = useAuthStore();
  const createCompletion = useCreateCompletion();
  const deleteCompletion = useDeleteCompletion();

  const isCompleted = !!assignment.completion;
  const isOwner = user?.id === assignment.userId;
  const isAdmin = user?.role === 'ADMIN';
  const canComplete = isOwner || isAdmin;

  const handleComplete = async () => {
    try {
      await createCompletion.mutateAsync({ assignmentId: assignment.id, notes: notes || undefined });
      toast.success('Chore marked as complete!');
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to complete');
    }
  };

  const handleUndo = async () => {
    if (!assignment.completion) return;
    try {
      await deleteCompletion.mutateAsync(assignment.completion.id);
      toast.success('Completion undone');
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to undo');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md mx-4 p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{assignment.chore.title}</h2>
            <p className="text-sm text-gray-500">
              {format(new Date(assignment.assignedDate), 'EEEE, MMMM d, yyyy')}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">
            &times;
          </button>
        </div>

        {assignment.chore.description && (
          <p className="text-sm text-gray-600 mb-4">{assignment.chore.description}</p>
        )}

        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">Assigned to:</span>
            <span className="font-medium text-gray-900">{assignment.user.name}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">Recurrence:</span>
            <span className="font-medium text-gray-900 capitalize">
              {assignment.chore.recurrenceType.toLowerCase()}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">Status:</span>
            {isCompleted ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Completed
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                Pending
              </span>
            )}
          </div>
          {assignment.completion?.notes && (
            <div className="text-sm">
              <span className="text-gray-500">Notes:</span>
              <p className="text-gray-700 mt-1">{assignment.completion.notes}</p>
            </div>
          )}
        </div>

        {canComplete && !isCompleted && (
          <div className="space-y-3">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes (optional)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={2}
            />
            <button
              onClick={handleComplete}
              disabled={createCompletion.isPending}
              className="w-full py-2 px-4 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {createCompletion.isPending ? 'Completing...' : 'Mark Complete'}
            </button>
          </div>
        )}

        {canComplete && isCompleted && (
          <button
            onClick={handleUndo}
            disabled={deleteCompletion.isPending}
            className="w-full py-2 px-4 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 disabled:opacity-50 transition-colors"
          >
            {deleteCompletion.isPending ? 'Undoing...' : 'Undo Completion'}
          </button>
        )}
      </div>
    </div>
  );
}
