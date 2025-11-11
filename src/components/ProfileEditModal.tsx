import { useState, useEffect } from 'react';
import { X, User, Phone, Image } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPhoneNumber?: string;
  currentAvatarUrl?: string;
  onUpdate: () => void;
}

export function ProfileEditModal({
  isOpen,
  onClose,
  currentPhoneNumber = '',
  currentAvatarUrl = '',
  onUpdate,
}: ProfileEditModalProps) {
  const [phoneNumber, setPhoneNumber] = useState(currentPhoneNumber);
  const [avatarUrl, setAvatarUrl] = useState(currentAvatarUrl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setPhoneNumber(currentPhoneNumber);
    setAvatarUrl(currentAvatarUrl);
  }, [currentPhoneNumber, currentAvatarUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setError('Not authenticated');
        return;
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          phone_number: phoneNumber || null,
          avatar_url: avatarUrl || null,
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      onUpdate();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <User size={24} className="text-slate-800" />
            <h2 className="text-xl font-semibold text-slate-800">Edit Profile</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
              <Phone size={16} />
              Phone Number
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Enter your phone number"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
              <Image size={16} />
              Avatar URL
            </label>
            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://example.com/avatar.jpg"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {avatarUrl && (
              <div className="mt-3 flex justify-center">
                <img
                  src={avatarUrl}
                  alt="Avatar preview"
                  className="w-24 h-24 rounded-full object-cover border-2 border-slate-200"
                  onError={(e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/96?text=Invalid';
                  }}
                />
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
