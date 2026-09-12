'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, X, Image as ImageIcon, FileText, Tag, Loader2, CheckCircle2 } from 'lucide-react';
import { formatBytes } from '@/lib/fileUtils';
import toast from 'react-hot-toast';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
}

export default function FileUploadModal({ isOpen, onClose, onUploadSuccess }: FileUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setTitle(file.name.substring(0, file.name.lastIndexOf('.')) || file.name);

    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error('Please select a file or picture');
      return;
    }

    setLoading(true);
    const toastId = toast.loading('Uploading file to MongoDB Atlas...');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('title', title);
      formData.append('description', description);
      formData.append('tags', tags);

      const res = await fetch('/api/files', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to upload file');
      }

      toast.success(`"${data.file.title}" uploaded successfully!`, { id: toastId });

      // Reset
      setSelectedFile(null);
      setPreviewUrl(null);
      setTitle('');
      setDescription('');
      setTags('');
      onUploadSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      toast.error(msg, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-xl rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-zinc-400 hover:bg-zinc-900 hover:text-white transition"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-black font-bold">
            <UploadCloud className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-heading text-lg font-bold text-white tracking-wide">Upload File or Picture</h2>
            <p className="text-xs text-zinc-400">Pictures are converted into managed cloud records</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Dropzone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-all ${
              isDragOver
                ? 'border-white bg-zinc-900 scale-[0.99]'
                : selectedFile
                ? 'border-zinc-500 bg-zinc-900/60'
                : 'border-zinc-800 bg-black hover:border-zinc-700 hover:bg-zinc-950'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleInputChange}
              className="hidden"
            />

            {selectedFile ? (
              <div className="flex flex-col items-center space-y-3">
                {previewUrl ? (
                  <div className="relative h-32 w-32 rounded-xl overflow-hidden border border-zinc-700 shadow-xl">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
                  </div>
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-800 text-white">
                    <FileText className="h-8 w-8" />
                  </div>
                )}
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1.5 font-semibold text-white text-sm">
                    <CheckCircle2 className="h-4 w-4 text-white" />
                    <span>{selectedFile.name}</span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">{formatBytes(selectedFile.size)} • {selectedFile.type || 'Unknown'}</p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                    setPreviewUrl(null);
                  }}
                  className="text-xs text-zinc-400 hover:text-white underline"
                >
                  Change selection
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-800 text-white mb-3">
                  <ImageIcon className="h-6 w-6" />
                </div>
                <p className="text-sm font-medium text-zinc-200">
                  <span className="text-white font-bold underline underline-offset-4">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-zinc-500 mt-1">Images, PDFs, Documents, Archives (up to 50MB)</p>
              </div>
            )}
          </div>

          {/* Form details */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1 uppercase tracking-wider">Title / Display Name</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter title"
                className="w-full bw-input rounded-xl px-3.5 py-2 text-sm placeholder-zinc-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1 uppercase tracking-wider">Description (Optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add notes..."
                rows={2}
                className="w-full bw-input rounded-xl px-3.5 py-2 text-sm placeholder-zinc-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center gap-1 uppercase tracking-wider">
                <Tag className="h-3 w-3 text-white" />
                <span>Tags (comma-separated)</span>
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="e.g. design, photo, invoice"
                className="w-full bw-input rounded-xl px-3.5 py-2 text-sm placeholder-zinc-600"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="bw-btn-secondary rounded-xl px-4 py-2 text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !selectedFile}
              className="bw-btn-primary flex items-center gap-2 rounded-xl px-5 py-2 text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="h-4 w-4" />
                  <span>Save to Atlas</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
