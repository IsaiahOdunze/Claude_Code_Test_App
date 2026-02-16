import { useState } from 'react';
import { useChores, useCreateChore, useUpdateChore, useDeleteChore, Chore } from '../hooks/useChores';
import { useUsers } from '../hooks/useUsers';
import { useCreateAssignment } from '../hooks/useAssignments';
import ChoreForm from '../components/chores/ChoreForm';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const RECURRENCE_LABELS: Record<string, string> = {
  NONE: 'One-time',
  DAILY: 'Daily',
  WEEKLY: 'Weekly',
  BIWEEKLY: 'Biweekly',
  MONTHLY: 'Monthly',
};

export default function ChoresPage() {
  const { data: chores = [], isLoading } = useChores();
  const { data: users = [] } = useUsers();
  const createChore = useCreateChore();
  const updateChore = useUpdateChore();
  const deleteChore = useDeleteChore();
  const createAssignment = useCreateAssignment();
  const [showForm, setShowForm] = useState(false);
  const [editingChore, setEditingChore] = useState<Chore | null>(null);

  const handleCreate = async (data: any) => {
    try {
      const chore = await createChore.mutateAsync(data);
      // Create initial assignments for assigned users
      for (let i = 0; i < data.assignedUserIds.length; i++) {
        try {
          await createAssignment.mutateAsync({
            choreId: chore.id,
            userId: data.assignedUserIds[i],
            assignedDate: data.startDate,
          });
        } catch {
          // Ignore duplicate assignment errors
        }
      }
      toast.success('Chore created');
      setShowForm(false);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create chore');
    }
  };

  const handleUpdate = async (data: any) => {
    if (!editingChore) return;
    try {
      await updateChore.mutateAsync({ id: editingChore.id, ...data });
      toast.success('Chore updated');
      setEditingChore(null);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update chore');
    }
  };

  const handleDelete = async (chore: Chore) => {
    if (!confirm(`Delete "${chore.title}"? This will remove all assignments.`)) return;
    try {
      await deleteChore.mutateAsync(chore.id);
      toast.success('Chore deleted');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete chore');
    }
  };

  if (isLoading) return <div className="text-gray-500">Loading chores...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Chores</h2>
        <button
          onClick={() => { setShowForm(true); setEditingChore(null); }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Add Chore
        </button>
      </div>

      {(showForm || editingChore) && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingChore ? 'Edit Chore' : 'New Chore'}
          </h3>
          <ChoreForm
            chore={editingChore}
            onSubmit={editingChore ? handleUpdate : handleCreate}
            onCancel={() => { setShowForm(false); setEditingChore(null); }}
            loading={createChore.isPending || updateChore.isPending}
          />
        </div>
      )}

      <div className="grid gap-4">
        {chores.map((chore) => (
          <div key={chore.id} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-semibold text-gray-900">{chore.title}</h3>
                {chore.description && (
                  <p className="text-sm text-gray-500 mt-1">{chore.description}</p>
                )}
                <div className="flex items-center gap-3 mt-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {RECURRENCE_LABELS[chore.recurrenceType] || chore.recurrenceType}
                  </span>
                  <span className="text-xs text-gray-400">
                    Starts {format(new Date(chore.startDate), 'MMM d, yyyy')}
                  </span>
                  {chore.autoRotate && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Auto-rotate
                    </span>
                  )}
                </div>
                {chore.assignments.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {chore.assignments.map((a) => (
                      <span key={a.userId} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                        {a.user.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setEditingChore(chore); setShowForm(false); }}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(chore)}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
        {chores.length === 0 && (
          <p className="text-center text-gray-400 py-8">No chores yet. Create one to get started!</p>
        )}
      </div>
    </div>
  );
}
