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
} from 'lucide-react';

interface FileTableProps {
  files: IFileItem[];
  onPreview: (file: IFileItem) => void;
  onEdit: (file: IFileItem) => void;
  onDelete: (file: IFileItem) => void;
}

export default function FileTable({ files, onPreview, onEdit, onDelete }: FileTableProps) {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'image':
        return <ImageIcon className="h-4 w-4 text-white" />;
      case 'document':
        return <FileText className="h-4 w-4 text-white" />;
      case 'audio':
        return <Music className="h-4 w-4 text-white" />;
      case 'video':
        return <Video className="h-4 w-4 text-white" />;
      case 'archive':
        return <Archive className="h-4 w-4 text-white" />;
      case 'code':
        return <Code className="h-4 w-4 text-white" />;
      default:
        return <File className="h-4 w-4 text-zinc-400" />;
    }
  };

  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-950/70 shadow-2xl">
      <table className="w-full text-left text-sm text-zinc-300">
        <thead className="border-b border-zinc-800 bg-black text-xs uppercase font-mono tracking-wider text-zinc-400">
          <tr>
            <th className="px-6 py-4">File Name</th>
            <th className="px-6 py-4">Category</th>
            <th className="px-6 py-4">Size</th>
            <th className="px-6 py-4">Date Uploaded</th>
            <th className="px-6 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-900">
          {files.map((file) => (
            <tr key={file._id} className="hover:bg-zinc-900/50 transition">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-black border border-zinc-800 shrink-0">
                    {getCategoryIcon(file.category)}
                  </div>
                  <div>
                    <div className="font-heading font-bold text-white truncate max-w-xs">{file.title}</div>
                    <div className="font-mono text-xs text-zinc-500 truncate max-w-xs">{file.originalName}</div>
                  </div>
                </div>
              </td>

              <td className="px-6 py-4">
                <span className="inline-flex items-center gap-1 rounded-md bg-zinc-900 border border-zinc-800 px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-white">
                  {file.category}
                </span>
              </td>

              <td className="px-6 py-4 font-mono text-xs text-zinc-300">{formatBytes(file.size)}</td>

              <td className="px-6 py-4 text-xs text-zinc-400">
                <div className="flex items-center gap-1.5 font-mono">
                  <Calendar className="h-3.5 w-3.5 text-zinc-500" />
                  <span>{new Date(file.createdAt).toLocaleDateString()}</span>
                </div>
              </td>

              <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => onPreview(file)}
                    title="Preview"
                    className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <a
                    href={file.fileUrl}
                    download={file.originalName}
                    title="Download"
                    className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                  <button
                    onClick={() => onEdit(file)}
                    title="Edit Metadata"
                    className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onDelete(file)}
                    title="Delete"
                    className="rounded-lg p-1.5 text-zinc-400 hover:bg-red-950 hover:text-red-400 transition"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
