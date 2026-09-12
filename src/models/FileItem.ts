import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IFileDocument extends Document {
  title: string;
  description?: string;
  originalName: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  size: number;
  category: 'image' | 'document' | 'audio' | 'video' | 'archive' | 'code' | 'other';
  extension: string;
  tags: string[];
  dimensions?: {
    width?: number;
    height?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const FileItemSchema = new Schema<IFileDocument>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      required: true,
      unique: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    category: {
      type: String,
      enum: ['image', 'document', 'audio', 'video', 'archive', 'code', 'other'],
      default: 'other',
    },
    extension: {
      type: String,
      default: '',
    },
    tags: {
      type: [String],
      default: [],
    },
    dimensions: {
      width: { type: Number },
      height: { type: Number },
    },
  },
  {
    timestamps: true,
  }
);

// Search indexes
FileItemSchema.index({ title: 'text', description: 'text', originalName: 'text', tags: 'text' });
FileItemSchema.index({ category: 1, createdAt: -1 });

const FileItem: Model<IFileDocument> =
  mongoose.models.FileItem || mongoose.model<IFileDocument>('FileItem', FileItemSchema);

export default FileItem;
