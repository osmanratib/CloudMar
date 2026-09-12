import { FileCategory } from '@/types/file';

export function getFileCategory(mimeType: string, extension: string): FileCategory {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.startsWith('video/')) return 'video';
  
  const docExts = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'rtf', 'odt', 'md'];
  const archiveExts = ['zip', 'rar', '7z', 'tar', 'gz', 'bz2'];
  const codeExts = ['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'json', 'py', 'java', 'c', 'cpp', 'cs', 'go', 'rs', 'php', 'rb', 'sql', 'sh', 'xml', 'yaml', 'yml'];

  const ext = extension.toLowerCase().replace('.', '');

  if (docExts.includes(ext) || mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) {
    return 'document';
  }

  if (archiveExts.includes(ext) || mimeType.includes('zip') || mimeType.includes('compressed')) {
    return 'archive';
  }

  if (codeExts.includes(ext) || mimeType.includes('javascript') || mimeType.includes('json')) {
    return 'code';
  }

  return 'other';
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
