import { useState, useEffect } from 'react';
import type { Chore } from '../../hooks/useChores';
import { useUsers } from '../../hooks/useUsers';

interface ChoreFormData {
  title: string;
  description: string;
  recurrenceType: string;
  startDate: string;
  endDate: string;
  autoRotate: boolean;
  assignedUserIds: string[];
}

interface Props {
  chore?: Chore | null;
  onSubmit: (data: ChoreFormData) => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function ChoreForm({ chore, onSubmit, onCancel, loading }: Props) {
  const { data: users = [] } = useUsers();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [recurrenceType, setRecurrenceType] = useState('NONE');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [autoRotate, setAutoRotate] = useState(false);
  const [assignedUserIds, setAssignedUserIds] = useState<string[]>([]);

  useEffect(() => {
    if (chore) {
      setTitle(chore.title);
      setDescription(chore.description || '');
      setRecurrenceType(chore.recurrenceType);
      setStartDate(chore.startDate.split('T')[0]);
      setEndDate(chore.endDate ? chore.endDate.split('T')[0] : '');
      setAutoRotate(chore.autoRotate);
      setAssignedUserIds(chore.assignments.map((a) => a.userId));
    }
  }, [chore]);

  const toggleUser = (userId: string) => {
    setAssignedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      title,
      description,
      recurrenceType,
      startDate,
      endDate,
      autoRotate,
      assignedUserIds,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., Clean kitchen"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={2}
          placeholder="Optional details..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Recurrence</label>
          <select
            value={recurrenceType}
            onChange={(e) => setRecurrenceType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="NONE">One-time</option>
            <option value="DAILY">Daily</option>
            <option value="WEEKLY">Weekly</option>
            <option value="BIWEEKLY">Biweekly</option>
            <option value="MONTHLY">Monthly</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {recurrenceType !== 'NONE' && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date (optional)</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-end">
            <label className="flex items-center gap-2 pb-2">
              <input
                type="checkbox"
                checked={autoRotate}
                onChange={(e) => setAutoRotate(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Auto-rotate assignment</span>
            </label>
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Assign To</label>
        <div className="flex flex-wrap gap-2">
          {users.map((user) => (
            <button
              key={user.id}
              type="button"
              onClick={() => toggleUser(user.id)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                assignedUserIds.includes(user.id)
                  ? 'bg-blue-100 text-blue-800 ring-1 ring-blue-300'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {user.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Saving...' : chore ? 'Update Chore' : 'Create Chore'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
