import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import FileItem from '@/models/FileItem';
import { isCloudinaryConfigured, uploadToCloudinary } from '@/lib/cloudinary';
import { unlink, writeFile } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { getFileCategory } from '@/lib/fileUtils';

export const runtime = 'nodejs';

interface Context {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: Context) {
  try {
    await connectToDatabase();
    const { id } = await context.params;

    const file = await FileItem.findById(id).exec();
    if (!file) {
      return NextResponse.json({ success: false, error: 'File not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, file });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error fetching file';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: Context) {
  try {
    await connectToDatabase();
    const { id } = await context.params;

    const existingFile = await FileItem.findById(id).exec();
    if (!existingFile) {
      return NextResponse.json({ success: false, error: 'File not found' }, { status: 404 });
    }

    const contentType = request.headers.get('content-type') || '';
    
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const title = formData.get('title') as string | null;
      const description = formData.get('description') as string | null;
      const tagsInput = formData.get('tags') as string | null;
      const file = formData.get('file') as File | null;

      if (title) existingFile.title = title.trim();
      if (description !== null) existingFile.description = description.trim();
      if (tagsInput !== null) {
        existingFile.tags = tagsInput
          .split(',')
          .map((t) => t.trim())
          .filter((t) => t.length > 0);
      }

      if (file) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const originalName = file.name;
        const ext = path.extname(originalName).toLowerCase();
        const mimeType = file.type || 'application/octet-stream';
        const category = getFileCategory(mimeType, ext);
        const size = file.size;

        const uniqueHash = crypto.randomBytes(8).toString('hex');
        const safeBaseName = path.basename(originalName, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
        const newFileName = `${Date.now()}_${safeBaseName}_${uniqueHash}${ext}`;

        let fileUrl = '';
        const isProductionOrServerless = Boolean(process.env.VERCEL || process.env.VERCEL_ENV || process.env.NODE_ENV === 'production');

        if (isCloudinaryConfigured()) {
          const cloudResult = await uploadToCloudinary(buffer, originalName);
          fileUrl = cloudResult.url;
        } else if (isProductionOrServerless) {
          const base64 = buffer.toString('base64');
          fileUrl = `data:${mimeType};base64,${base64}`;
        } else {
          const uploadDir = path.join(process.cwd(), 'public', 'uploads');
          const newFilePathOnDisk = path.join(uploadDir, newFileName);
          await writeFile(newFilePathOnDisk, buffer);
          fileUrl = `/uploads/${newFileName}`;
        }

        existingFile.originalName = originalName;
        existingFile.fileName = newFileName;
        existingFile.fileUrl = fileUrl;
        existingFile.mimeType = mimeType;
        existingFile.size = size;
        existingFile.category = category;
        existingFile.extension = ext;
      }

      await existingFile.save();
      return NextResponse.json({ success: true, file: existingFile, message: 'File updated successfully' });
    } else {
      const body = await request.json();
      const { title, description, tags } = body;

      if (title !== undefined) existingFile.title = title.trim();
      if (description !== undefined) existingFile.description = description.trim();
      if (tags !== undefined && Array.isArray(tags)) existingFile.tags = tags;

      await existingFile.save();
      return NextResponse.json({ success: true, file: existingFile, message: 'File metadata updated' });
    }
  } catch (error: unknown) {
    console.error('Error updating file:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error updating file';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: Context) {
  try {
    await connectToDatabase();
    const { id } = await context.params;

    const file = await FileItem.findById(id).exec();
    if (!file) {
      return NextResponse.json({ success: false, error: 'File not found' }, { status: 404 });
    }

    const isProductionOrServerless = Boolean(process.env.VERCEL || process.env.VERCEL_ENV || process.env.NODE_ENV === 'production');
    if (!isProductionOrServerless) {
      const filePath = path.join(process.cwd(), 'public', 'uploads', file.fileName);
      try {
        await unlink(filePath);
      } catch (fsError) {
        console.warn('File on disk missing:', fsError);
      }
    }

    await FileItem.findByIdAndDelete(id).exec();

    return NextResponse.json({ success: true, message: 'File deleted successfully' });
  } catch (error: unknown) {
    console.error('Error deleting file:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error deleting file';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
