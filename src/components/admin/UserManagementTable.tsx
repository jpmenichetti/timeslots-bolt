import { Users, Download, UserPlus, Key, Ban, CheckCircle, Trash2 } from 'lucide-react';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  created_at: string;
  is_blocked: boolean;
  avatar_url?: string;
  phone_number?: string;
}

interface UserManagementTableProps {
  users: User[];
  loading: boolean;
  currentUserId?: string;
  deletingUserId: string | null;
  blockingUserId: string | null;
  onCreateAdmin: () => void;
  onDownloadCSV: () => void;
  onResetPassword: (userId: string, userName: string, userEmail: string) => void;
  onToggleBlock: (userId: string, userName: string, isBlocked: boolean) => void;
  onDeleteUser: (userId: string, userName: string, userRole: string) => void;
  formatDate: (dateString: string) => string;
}

export function UserManagementTable({
  users,
  loading,
  currentUserId,
  deletingUserId,
  blockingUserId,
  onCreateAdmin,
  onDownloadCSV,
  onResetPassword,
  onToggleBlock,
  onDeleteUser,
  formatDate,
}: UserManagementTableProps) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
          <Users size={20} />
          Registered Users
        </h2>
        <div className="flex items-center gap-4">
          <div className="text-sm text-slate-600">{users.length} total users</div>
          <button
            onClick={onCreateAdmin}
            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            <UserPlus size={18} />
            Create Admin
          </button>
          {users.length > 0 && (
            <button
              onClick={onDownloadCSV}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
            >
              <Download size={18} />
              Download CSV
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading...</div>
      ) : users.length === 0 ? (
        <div className="text-center py-12 text-slate-500">No users registered yet.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Name</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Email</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Phone</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Role</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Status</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Joined</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.name}
                          className="w-8 h-8 rounded-full object-cover border border-slate-200"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div
                        className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center text-white text-sm font-medium"
                        style={{ display: user.avatar_url ? 'none' : 'flex' }}
                      >
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-slate-800">{user.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-slate-600">{user.email}</td>
                  <td className="py-4 px-4 text-slate-600">
                    {user.phone_number || <span className="text-slate-400 italic">Not provided</span>}
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                        user.role === 'admin'
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                        user.is_blocked ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {user.is_blocked ? 'Blocked' : 'Active'}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-slate-600 text-sm">{formatDate(user.created_at)}</td>
                  <td className="py-4 px-4 text-right">
                    {user.id !== currentUserId && (
                      <div className="flex items-center justify-end gap-2">
                        {user.role === 'worker' && (
                          <button
                            onClick={() => onResetPassword(user.id, user.name, user.email)}
                            className="inline-flex items-center gap-2 px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Reset password"
                          >
                            <Key size={16} />
                            <span className="text-sm">Reset Password</span>
                          </button>
                        )}
                        <button
                          onClick={() => onToggleBlock(user.id, user.name, user.is_blocked)}
                          disabled={blockingUserId === user.id}
                          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                            user.is_blocked
                              ? 'text-amber-600 hover:bg-amber-50'
                              : 'text-orange-600 hover:bg-orange-50'
                          }`}
                        >
                          {blockingUserId === user.id ? (
                            <>
                              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                              <span className="text-sm">Processing...</span>
                            </>
                          ) : user.is_blocked ? (
                            <>
                              <CheckCircle size={16} />
                              <span className="text-sm">Unblock</span>
                            </>
                          ) : (
                            <>
                              <Ban size={16} />
                              <span className="text-sm">Block</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => onDeleteUser(user.id, user.name, user.role)}
                          disabled={deletingUserId === user.id}
                          className="inline-flex items-center gap-2 px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {deletingUserId === user.id ? (
                            <>
                              <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                              <span className="text-sm">Deleting...</span>
                            </>
                          ) : (
                            <>
                              <Trash2 size={16} />
                              <span className="text-sm">Delete</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
