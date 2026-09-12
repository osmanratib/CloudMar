'use client';

import React from 'react';
import { IFileItem } from '@/types/file';
import { formatBytes } from '@/lib/fileUtils';
import {
  Image as ImageIcon,
  FileText,
  Music,
  Video,
  Archive,
  Code,
  File,
  Download,
  Trash2,
  Edit,
  Eye,
  Calendar,
  Tag,
} from 'lucide-react';

interface FileCardProps {
  file: IFileItem;
  onPreview: (file: IFileItem) => void;
  onEdit: (file: IFileItem) => void;
  onDelete: (file: IFileItem) => void;
}

export default function FileCard({ file, onPreview, onEdit, onDelete }: FileCardProps) {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'image':
        return <ImageIcon className="h-5 w-5 text-white" />;
      case 'document':
        return <FileText className="h-5 w-5 text-white" />;
      case 'audio':
        return <Music className="h-5 w-5 text-white" />;
      case 'video':
        return <Video className="h-5 w-5 text-white" />;
      case 'archive':
        return <Archive className="h-5 w-5 text-white" />;
      case 'code':
        return <Code className="h-5 w-5 text-white" />;
      default:
        return <File className="h-5 w-5 text-zinc-400" />;
    }
  };

  const downloadUrl = `/api/files/${file._id}/download`;

  return (
    <div className="bw-card group relative flex flex-col justify-between rounded-2xl p-4">
      {/* File Preview Container */}
      <div>
        <div className="relative mb-3 flex h-36 w-full items-center justify-center overflow-hidden rounded-xl bg-black border border-zinc-800">
          {file.category === 'image' ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={file.fileUrl}
              alt={file.title}
              className="h-full w-full object-cover grayscale contrast-125 group-hover:grayscale-0 transition-all duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 p-4 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-800">
                {getCategoryIcon(file.category)}
              </div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
                {file.extension || 'FILE'}
              </span>
            </div>
          )}

          {/* Quick Action Overlay */}
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/80 opacity-0 backdrop-blur-xs transition-opacity duration-200 group-hover:opacity-100">
            <button
              onClick={() => onPreview(file)}
              title="Preview File"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-black hover:scale-110 transition"
            >
              <Eye className="h-4 w-4" />
            </button>
            <a
              href={downloadUrl}
              download={file.originalName}
              title="Download File"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-800 text-white border border-zinc-700 hover:bg-zinc-700 hover:scale-110 transition"
            >
              <Download className="h-4 w-4" />
            </a>
          </div>

          {/* Category Pill */}
          <div className="absolute top-2 left-2">
            <span className="inline-flex items-center gap-1 rounded-md bg-black/80 backdrop-blur-md px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-white border border-zinc-700">
              {file.category}
            </span>
          </div>
        </div>

        {/* Info */}
        <h3 className="font-heading font-bold text-white text-sm truncate" title={file.title}>
          {file.title}
        </h3>
        {file.description && (
          <p className="mt-1 text-xs text-zinc-400 line-clamp-2" title={file.description}>
            {file.description}
          </p>
        )}

        {/* Tags */}
        {file.tags && file.tags.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1">
            {file.tags.slice(0, 3).map((tag, idx) => (
              <span key={idx} className="flex items-center gap-0.5 rounded-md bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 text-[10px] font-mono text-zinc-300">
                <Tag className="h-2.5 w-2.5 text-zinc-400" />
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
        <div className="flex flex-col">
          <span className="font-mono text-[11px] font-semibold text-white">{formatBytes(file.size)}</span>
          <span className="flex items-center gap-1 text-[10px] text-zinc-500 mt-0.5">
            <Calendar className="h-3 w-3" />
            {new Date(file.createdAt).toLocaleDateString()}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(file)}
            title="Edit Details"
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition"
          >
            <Edit className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onDelete(file)}
            title="Delete File"
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-red-950 hover:text-red-400 transition"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
