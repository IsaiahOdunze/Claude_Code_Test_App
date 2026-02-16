import { useState } from 'react';
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser, User } from '../hooks/useUsers';
import MemberForm from '../components/team/MemberForm';
import toast from 'react-hot-toast';

export default function TeamPage() {
  const { data: users = [], isLoading } = useUsers();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const handleCreate = async (data: { email: string; name: string; password: string; role: string }) => {
    try {
      await createUser.mutateAsync(data);
      toast.success('Member created');
      setShowForm(false);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create member');
    }
  };

  const handleUpdate = async (data: { email: string; name: string; password: string; role: string }) => {
    if (!editingUser) return;
    try {
      const updateData: any = { id: editingUser.id, email: data.email, name: data.name, role: data.role };
      if (data.password) updateData.password = data.password;
      await updateUser.mutateAsync(updateData);
      toast.success('Member updated');
      setEditingUser(null);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update member');
    }
  };

  const handleDelete = async (user: User) => {
    if (!confirm(`Remove ${user.name} from the team?`)) return;
    try {
      await deleteUser.mutateAsync(user.id);
      toast.success('Member removed');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to remove member');
    }
  };

  if (isLoading) return <div className="text-gray-500">Loading team...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Team</h2>
        <button
          onClick={() => { setShowForm(true); setEditingUser(null); }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Add Member
        </button>
      </div>

      {(showForm || editingUser) && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingUser ? 'Edit Member' : 'New Member'}
          </h3>
          <MemberForm
            user={editingUser}
            onSubmit={editingUser ? handleUpdate : handleCreate}
            onCancel={() => { setShowForm(false); setEditingUser(null); }}
            loading={createUser.isPending || updateUser.isPending}
          />
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{user.name}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{user.email}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button
                    onClick={() => { setEditingUser(user); setShowForm(false); }}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(user)}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
