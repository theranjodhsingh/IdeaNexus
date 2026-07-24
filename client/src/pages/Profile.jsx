import { useEffect, useRef, useState } from 'react';
import { Camera, Trash2, UserRound } from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '../components/layout/Navbar';
import Button from '../components/ui/Button';
import { api, getErrorMessage } from '../api/axios';
import useAuthStore from '../store/authStore';

const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export default function Profile() {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const inputRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const chooseFile = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!ACCEPTED_TYPES.has(file.type)) return toast.error('Choose a JPG, PNG, or WebP image.');
    if (file.size > MAX_FILE_SIZE) return toast.error('Image must be 5 MB or smaller.');
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const uploadPicture = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    try {
      const body = new FormData();
      body.append('profilePicture', selectedFile);
      const { data } = await api.post('/users/profile-picture', body, { headers: { 'Content-Type': 'multipart/form-data' } });
      setUser({ ...user, profilePictureUrl: data?.data?.profilePictureUrl });
      setSelectedFile(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      toast.success('Profile picture updated.');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to upload profile picture'));
    } finally {
      setIsUploading(false);
    }
  };

  const removePicture = async () => {
    setIsRemoving(true);
    try {
      await api.delete('/users/profile-picture');
      setUser({ ...user, profilePictureUrl: null });
      setSelectedFile(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      toast.success('Profile picture removed.');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to remove profile picture'));
    } finally {
      setIsRemoving(false);
    }
  };

  const picture = previewUrl || user?.profilePictureUrl;
  const initial = user?.name?.trim()?.charAt(0)?.toUpperCase() || 'U';

  return (
    <div className="min-h-screen bg-[var(--color-bg)]"><Navbar />
      <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6"><div className="nexus-card">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-accent)]">Account</p>
        <h1 className="mt-2 text-3xl">Profile picture</h1>
        <p className="mt-3 text-sm text-[var(--color-text-muted)]">Use a clear photo to make your IdeaNexus profile recognisable.</p>
        <div className="mt-8 flex flex-col items-start gap-6 sm:flex-row sm:items-center">
          <div className="relative">{picture ? <img src={picture} alt="Profile preview" className="h-28 w-28 rounded-full border-2 border-[var(--color-border-strong)] object-cover" /> : <div className="flex h-28 w-28 items-center justify-center rounded-full border-2 border-[var(--color-border-strong)] bg-[var(--color-surface-2)] text-4xl font-semibold text-[var(--color-accent)]">{initial}</div>}<span className="absolute bottom-1 right-1 flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-border-strong)] bg-[var(--color-surface)] text-[var(--color-text-muted)]"><UserRound className="h-4 w-4" /></span></div>
          <div className="space-y-3"><input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={chooseFile} /><div className="flex flex-wrap gap-3"><Button variant="secondary" leftIcon={<Camera className="h-4 w-4" />} onClick={() => inputRef.current?.click()}>Change picture</Button>{(user?.profilePictureUrl || previewUrl) && <Button variant="danger" leftIcon={<Trash2 className="h-4 w-4" />} isLoading={isRemoving} onClick={removePicture}>Remove</Button>}</div><p className="text-xs text-[var(--color-text-muted)]">JPG, PNG, or WebP. Maximum file size 5 MB.</p>{selectedFile && <p className="text-sm text-[var(--color-text-primary)]">Ready to upload: {selectedFile.name}</p>}</div>
        </div>{selectedFile && <div className="mt-8 flex justify-end border-t border-[var(--color-border)] pt-5"><Button isLoading={isUploading} onClick={uploadPicture}>Save picture</Button></div>}
      </div></main>
    </div>
  );
}
