import { useState, useEffect, useRef } from 'react';
import { X, User, Phone, Upload, Trash2 } from 'lucide-react';
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
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPhoneNumber(currentPhoneNumber);
    setAvatarUrl(currentAvatarUrl);
    setAvatarFile(null);
    setPreviewUrl(null);
    setError('');
  }, [currentPhoneNumber, currentAvatarUrl, isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    if (file.size > 204800) {
      setError('Image size must be less than 200KB');
      return;
    }

    setError('');
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setAvatarFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

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

      let newAvatarUrl = avatarUrl;

      if (avatarFile) {
        setUploading(true);

        if (avatarUrl) {
          const oldPath = avatarUrl.split('/').slice(-2).join('/');
          await supabase.storage.from('avatars').remove([oldPath]);
        }

        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${user.id}/avatar-${Date.now()}.${fileExt}`;

        const { error: uploadError, data } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatarFile, {
            cacheControl: '3600',
            upsert: true,
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);

        newAvatarUrl = publicUrl;
        setUploading(false);
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          phone_number: phoneNumber || null,
          avatar_url: newAvatarUrl || null,
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      onUpdate();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
      setUploading(false);
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
              <Upload size={16} />
              Avatar Image
            </label>
            <p className="text-xs text-slate-500 mb-2">
              Upload an image (max 200KB, JPEG, PNG, GIF, or WebP)
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleFileChange}
              className="hidden"
              disabled={loading}
            />

            <div className="flex flex-col items-center gap-3">
              {(previewUrl || avatarUrl) && (
                <div className="relative">
                  <img
                    src={previewUrl || avatarUrl || ''}
                    alt="Avatar preview"
                    className="w-32 h-32 rounded-full object-cover border-4 border-slate-200"
                    onError={(e) => {
                      e.currentTarget.src = 'https://via.placeholder.com/128?text=No+Image';
                    }}
                  />
                  {previewUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors"
                      disabled={loading}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full px-4 py-2 border-2 border-dashed border-slate-300 text-slate-600 rounded-lg hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
                disabled={loading}
              >
                <Upload size={18} />
                {avatarFile ? 'Change Image' : avatarUrl ? 'Upload New Image' : 'Upload Image'}
              </button>
            </div>
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
              {uploading ? 'Uploading...' : loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
