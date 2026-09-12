export type FileCategory = 'image' | 'document' | 'audio' | 'video' | 'archive' | 'code' | 'other';

export interface IFileItem {
  _id: string;
  title: string;
  description?: string;
  originalName: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  size: number;
  category: FileCategory;
  extension: string;
  tags: string[];
  dimensions?: {
    width?: number;
    height?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface FileFilterOptions {
  search?: string;
  category?: string;
  sortBy?: 'createdAt' | 'name' | 'size';
  sortOrder?: 'asc' | 'desc';
}
