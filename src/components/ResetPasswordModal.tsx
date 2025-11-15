import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { X, Key, Copy, Check } from 'lucide-react';

interface ResetPasswordModalProps {
  userId: string;
  userName: string;
  userEmail: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function ResetPasswordModal({ userId, userName, userEmail, onClose, onSuccess }: ResetPasswordModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetComplete, setResetComplete] = useState(false);
  const [temporaryPassword, setTemporaryPassword] = useState('');
  const [copiedPassword, setCopiedPassword] = useState(false);

  const handleReset = async () => {
    setError('');
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reset-user-password`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to reset password');
      }

      setTemporaryPassword(result.temporaryPassword);
      setResetComplete(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const copyPassword = async () => {
    if (temporaryPassword) {
      await navigator.clipboard.writeText(temporaryPassword);
      setCopiedPassword(true);
      setTimeout(() => setCopiedPassword(false), 2000);
    }
  };

  const handleClose = () => {
    if (resetComplete) {
      onSuccess();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Key className="text-orange-600" size={20} />
            </div>
            <h2 className="text-xl font-semibold text-slate-800">
              {resetComplete ? 'Password Reset Complete' : 'Reset User Password'}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {resetComplete ? (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800 font-medium mb-2">
                Password reset successfully!
              </p>
              <p className="text-xs text-green-700">
                Share the temporary password with {userName}. They will be required to change it on next login.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email
              </label>
              <div className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700">
                {userEmail}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Temporary Password
              </label>
              <div className="flex gap-2">
                <div className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-mono text-sm">
                  {temporaryPassword}
                </div>
                <button
                  onClick={copyPassword}
                  className="px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  {copiedPassword ? (
                    <>
                      <Check size={16} />
                      <span className="text-sm">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy size={16} />
                      <span className="text-sm">Copy</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Make sure to save this password. It cannot be retrieved later.
              </p>
            </div>

            <button
              onClick={handleClose}
              className="w-full px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm text-orange-800">
                Are you sure you want to reset the password for <span className="font-semibold">{userName}</span>?
              </p>
              <p className="text-xs text-orange-700 mt-2">
                A temporary password will be generated, and the user will be required to change it on next login.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                User
              </label>
              <div className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700">
                {userName} ({userEmail})
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
