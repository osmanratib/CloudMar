'use client';

import React, { useState, useEffect } from 'react';
import { IFileItem } from '@/types/file';
import { formatBytes } from '@/lib/fileUtils';
import { X, Download, Trash2, Save, FileText, Calendar, HardDrive, Tag, Loader2, Edit3, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

interface FileDetailModalProps {
  file: IFileItem | null;
  mode: 'preview' | 'edit' | null;
  onClose: () => void;
  onUpdateSuccess: () => void;
  onDelete: (file: IFileItem) => void;
}

export default function FileDetailModal({
  file,
  mode,
  onClose,
  onUpdateSuccess,
  onDelete,
}: FileDetailModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [replacementFile, setReplacementFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'view' | 'edit'>('view');

  useEffect(() => {
    if (file) {
      setTitle(file.title || '');
      setDescription(file.description || '');
      setTags(file.tags ? file.tags.join(', ') : '');
      setActiveTab(mode === 'edit' ? 'edit' : 'view');
      setReplacementFile(null);
    }
  }, [file, mode]);

  if (!file || !mode) return null;

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const toastId = toast.loading('Updating file details...');

    try {
      if (replacementFile) {
        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('tags', tags);
        formData.append('file', replacementFile);

        const res = await fetch(`/api/files/${file._id}`, {
          method: 'PUT',
          body: formData,
        });

        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Failed to update file');
      } else {
        const res = await fetch(`/api/files/${file._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            description,
            tags: tags
              .split(',')
              .map((t) => t.trim())
              .filter((t) => t.length > 0),
          }),
        });

        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Failed to update metadata');
      }

      toast.success('File updated successfully!', { id: toastId });
      onUpdateSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Update failed';
      toast.error(msg, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4 bg-black">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('view')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                activeTab === 'view'
                  ? 'bg-white text-black'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Eye className="h-4 w-4" />
              <span>Preview</span>
            </button>
            <button
              onClick={() => setActiveTab('edit')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                activeTab === 'edit'
                  ? 'bg-white text-black'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Edit3 className="h-4 w-4" />
              <span>Edit Metadata</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-900 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'view' ? (
            <div className="space-y-6">
              {/* Media Preview Box */}
              <div className="relative flex min-h-[220px] max-h-[360px] w-full items-center justify-center overflow-hidden rounded-xl border border-zinc-800 bg-black p-2">
                {file.category === 'image' ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={file.fileUrl}
                    alt={file.title}
                    className="max-h-[340px] w-auto rounded-lg object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-800 text-white mb-3">
                      <FileText className="h-8 w-8" />
                    </div>
                    <p className="text-sm font-semibold text-zinc-300">{file.originalName}</p>
                    <p className="text-xs text-zinc-500 font-mono mt-1">{file.mimeType}</p>
                  </div>
                )}
              </div>

              {/* Details Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-2">
                  <h4 className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Title & Notes</h4>
                  <div className="text-sm text-white font-bold font-heading">{file.title}</div>
                  {file.description && <p className="text-xs text-zinc-400">{file.description}</p>}
                </div>

                <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-2 text-xs">
                  <h4 className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">File Metadata</h4>
                  <div className="flex items-center justify-between text-zinc-300">
                    <span className="flex items-center gap-1.5 text-zinc-400 font-mono">
                      <HardDrive className="h-3.5 w-3.5 text-white" />
                      Size
                    </span>
                    <span className="font-mono">{formatBytes(file.size)}</span>
                  </div>
                  <div className="flex items-center justify-between text-zinc-300">
                    <span className="flex items-center gap-1.5 text-zinc-400 font-mono">
                      <Calendar className="h-3.5 w-3.5 text-white" />
                      Uploaded
                    </span>
                    <span className="font-mono">{new Date(file.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Tags */}
              {file.tags && file.tags.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {file.tags.map((tag, idx) => (
                      <span key={idx} className="flex items-center gap-1 rounded-lg bg-zinc-900 border border-zinc-800 px-2.5 py-1 text-xs text-white font-mono">
                        <Tag className="h-3 w-3 text-zinc-400" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* EDIT FORM */
            <form id="edit-form" onSubmit={handleUpdateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bw-input rounded-xl px-3.5 py-2 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full bw-input rounded-xl px-3.5 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1">Tags (Comma-separated)</label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="w-full bw-input rounded-xl px-3.5 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1">Replace File Binary (Optional)</label>
                <input
                  type="file"
                  onChange={(e) => setReplacementFile(e.target.files?.[0] || null)}
                  className="w-full bw-input rounded-xl px-3.5 py-2 text-xs text-zinc-400 file:mr-4 file:rounded-lg file:border-0 file:bg-zinc-800 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
                />
              </div>
            </form>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-zinc-800 bg-black px-6 py-4">
          <button
            type="button"
            onClick={() => {
              onDelete(file);
              onClose();
            }}
            className="flex items-center gap-1.5 rounded-xl border border-red-950 bg-red-950/20 px-4 py-2 text-xs font-semibold text-red-400 hover:bg-red-900/40 transition"
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete File</span>
          </button>

          <div className="flex items-center gap-3">
            <a
              href={file.fileUrl}
              download={file.originalName}
              className="bw-btn-secondary flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold"
            >
              <Download className="h-4 w-4" />
              <span>Download</span>
            </a>

            {activeTab === 'edit' && (
              <button
                type="submit"
                form="edit-form"
                disabled={loading}
                className="bw-btn-primary flex items-center gap-2 rounded-xl px-5 py-2 text-xs font-bold disabled:opacity-40"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
