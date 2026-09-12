'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Navbar from '@/components/Navbar';
import FileCard from '@/components/FileCard';
import FileTable from '@/components/FileTable';
import FileUploadModal from '@/components/FileUploadModal';
import FileDetailModal from '@/components/FileDetailModal';
import { IFileItem } from '@/types/file';
import { formatBytes } from '@/lib/fileUtils';
import gsap from 'gsap';
import toast from 'react-hot-toast';
import {
  Search,
  Grid,
  List,
  Cloud,
  FileText,
  Image as ImageIcon,
  HardDrive,
  Plus,
  Loader2,
  RefreshCw,
  FolderOpen,
  ArrowUpRight,
} from 'lucide-react';

export default function HomePage() {
  const [files, setFiles] = useState<IFileItem[]>([]);
  const [stats, setStats] = useState({
    totalFiles: 0,
    totalSize: 0,
    imageCount: 0,
    docCount: 0,
    otherCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState<'createdAt' | 'name' | 'size'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modal states
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedFileModal, setSelectedFileModal] = useState<{
    file: IFileItem;
    mode: 'preview' | 'edit';
  } | null>(null);

  // GSAP References
  const headerRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // GSAP Entrance Animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(headerRef.current, {
        y: -30,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
      });
      gsap.from(statsRef.current?.children || [], {
        y: 20,
        opacity: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: 'power2.out',
        delay: 0.2,
      });
    });
    return () => ctx.revert();
  }, []);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (category !== 'all') params.set('category', category);
      params.set('sortBy', sortBy);
      params.set('sortOrder', sortOrder);

      const res = await fetch(`/api/files?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setFiles(data.files);
        if (data.stats) {
          setStats(data.stats);
        }
      }
    } catch (err) {
      console.error('Error loading files:', err);
      toast.error('Failed to load files from server');
    } finally {
      setLoading(false);
    }
  }, [search, category, sortBy, sortOrder]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  // Animate grid cards when files change
  useEffect(() => {
    if (files.length > 0 && contentRef.current) {
      gsap.fromTo(
        contentRef.current.children,
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.05, ease: 'power2.out' }
      );
    }
  }, [files, viewMode]);

  const handleDeleteFile = async (fileToDelete: IFileItem) => {
    if (!confirm(`Delete "${fileToDelete.title}" from MongoDB Atlas?`)) return;

    const toastId = toast.loading('Deleting file...');
    try {
      const res = await fetch(`/api/files/${fileToDelete._id}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (data.success) {
        toast.success(`"${fileToDelete.title}" deleted`, { id: toastId });
        fetchFiles();
      } else {
        toast.error(data.error || 'Failed to delete file', { id: toastId });
      }
    } catch (err) {
      console.error('Delete failed:', err);
      toast.error('Delete failed', { id: toastId });
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-black text-white selection:bg-white selection:text-black">
      <Navbar onOpenUpload={() => setIsUploadOpen(true)} />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Banner Section */}
        <div
          ref={headerRef}
          className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950 p-6 md:p-10 shadow-2xl"
        >
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-black px-3.5 py-1 text-xs font-mono font-semibold tracking-wider text-zinc-300">
                <Cloud className="h-3.5 w-3.5 text-white" />
                <span>MONOCHROME STORAGE HUB</span>
              </div>
              <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight uppercase leading-tight">
                CloudMar Document Vault
              </h1>
              <p className="text-sm text-zinc-400 leading-relaxed font-sans">
                Submit pictures or document files with zero authentication needed. Instant cloud sync, image previews, and full CRUD operations powered by MongoDB Atlas.
              </p>
            </div>

            <button
              onClick={() => setIsUploadOpen(true)}
              className="bw-btn-primary flex items-center justify-center gap-2 rounded-2xl px-6 py-4 text-sm font-black shadow-2xl transition-all active:scale-95 shrink-0"
            >
              <Plus className="h-5 w-5 stroke-[3]" />
              <span>Submit File or Picture</span>
              <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div ref={statsRef} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bw-card rounded-2xl p-5 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-black border border-zinc-800 text-white">
              <FolderOpen className="h-6 w-6" />
            </div>
            <div>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Total Files</p>
              <p className="font-heading text-2xl font-bold text-white">{stats.totalFiles}</p>
            </div>
          </div>

          <div className="bw-card rounded-2xl p-5 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-black border border-zinc-800 text-white">
              <ImageIcon className="h-6 w-6" />
            </div>
            <div>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Pictures</p>
              <p className="font-heading text-2xl font-bold text-white">{stats.imageCount}</p>
            </div>
          </div>

          <div className="bw-card rounded-2xl p-5 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-black border border-zinc-800 text-white">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Documents</p>
              <p className="font-heading text-2xl font-bold text-white">{stats.docCount}</p>
            </div>
          </div>

          <div className="bw-card rounded-2xl p-5 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-black border border-zinc-800 text-white">
              <HardDrive className="h-6 w-6" />
            </div>
            <div>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Storage Used</p>
              <p className="font-heading text-2xl font-bold text-white">{formatBytes(stats.totalSize)}</p>
            </div>
          </div>
        </div>

        {/* Filter & Controls */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 rounded-2xl border border-zinc-800/80 bg-zinc-950 p-4">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search files, extensions, tags..."
              className="w-full bw-input rounded-xl pl-10 pr-4 py-2.5 text-sm placeholder-zinc-600 font-sans"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {['all', 'image', 'document', 'code', 'archive', 'other'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`rounded-xl px-3.5 py-2 font-mono text-[11px] font-bold uppercase tracking-wider transition ${
                  category === cat
                    ? 'bg-white text-black shadow-lg'
                    : 'bg-black border border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split('-');
                setSortBy(sb as 'createdAt' | 'name' | 'size');
                setSortOrder(so as 'asc' | 'desc');
              }}
              className="rounded-xl border border-zinc-800 bg-black px-3 py-2 font-mono text-xs text-zinc-300 focus:border-white focus:outline-none"
            >
              <option value="createdAt-desc">Newest First</option>
              <option value="createdAt-asc">Oldest First</option>
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
              <option value="size-desc">Largest Size</option>
              <option value="size-asc">Smallest Size</option>
            </select>

            <div className="flex items-center rounded-xl border border-zinc-800 bg-black p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`rounded-lg p-1.5 transition ${
                  viewMode === 'grid' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
                }`}
                title="Grid View"
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`rounded-lg p-1.5 transition ${
                  viewMode === 'table' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
                }`}
                title="Table View"
              >
                <List className="h-4 w-4" />
              </button>
            </div>

            <button
              onClick={fetchFiles}
              className="rounded-xl border border-zinc-800 bg-black p-2 text-zinc-400 hover:text-white transition"
              title="Refresh"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Content Display */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-500 space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
            <p className="font-mono text-xs uppercase tracking-widest">Querying MongoDB Atlas...</p>
          </div>
        ) : files.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-800 bg-zinc-950/40 p-16 text-center space-y-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-800 text-white">
              <FolderOpen className="h-8 w-8" />
            </div>
            <div>
              <h3 className="font-heading text-lg font-bold text-white">No files found</h3>
              <p className="text-xs text-zinc-500 max-w-sm mt-1">
                {search || category !== 'all'
                  ? 'No items match your search or category filter.'
                  : 'Get started by uploading your first picture or file.'}
              </p>
            </div>
            <button
              onClick={() => setIsUploadOpen(true)}
              className="bw-btn-primary flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold"
            >
              <Plus className="h-4 w-4" />
              <span>Upload Now</span>
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div ref={contentRef} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {files.map((file) => (
              <FileCard
                key={file._id}
                file={file}
                onPreview={(f) => setSelectedFileModal({ file: f, mode: 'preview' })}
                onEdit={(f) => setSelectedFileModal({ file: f, mode: 'edit' })}
                onDelete={handleDeleteFile}
              />
            ))}
          </div>
        ) : (
          <div ref={contentRef}>
            <FileTable
              files={files}
              onPreview={(f) => setSelectedFileModal({ file: f, mode: 'preview' })}
              onEdit={(f) => setSelectedFileModal({ file: f, mode: 'edit' })}
              onDelete={handleDeleteFile}
            />
          </div>
        )}
      </main>

      {/* Upload Modal */}
      <FileUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={fetchFiles}
      />

      {/* Detail Modal */}
      {selectedFileModal && (
        <FileDetailModal
          file={selectedFileModal.file}
          mode={selectedFileModal.mode}
          onClose={() => setSelectedFileModal(null)}
          onUpdateSuccess={fetchFiles}
          onDelete={handleDeleteFile}
        />
      )}

      {/* Footer */}
      <footer className="mt-auto border-t border-zinc-900 bg-black py-6 text-center text-xs font-mono text-zinc-500">
        <p>CLOUDMAR • MONOCHROME FILE VAULT • NEXT.JS & MONGODB ATLAS</p>
      </footer>
    </div>
  );
}
