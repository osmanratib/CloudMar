import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import FileItem from '@/models/FileItem';
import { getFileCategory } from '@/lib/fileUtils';
import { isCloudinaryConfigured, uploadToCloudinary } from '@/lib/cloudinary';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || 'all';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;

    const query: Record<string, unknown> = {};

    if (category && category !== 'all') {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { originalName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    const sortOptions: Record<string, 1 | -1> = {};
    if (sortBy === 'name') {
      sortOptions.title = sortOrder;
    } else if (sortBy === 'size') {
      sortOptions.size = sortOrder;
    } else {
      sortOptions.createdAt = sortOrder;
    }

    const files = await FileItem.find(query).sort(sortOptions).exec();

    const allFiles = await FileItem.find({}).exec();
    const stats = {
      totalFiles: allFiles.length,
      totalSize: allFiles.reduce((sum, item) => sum + (item.size || 0), 0),
      imageCount: allFiles.filter((item) => item.category === 'image').length,
      docCount: allFiles.filter((item) => item.category === 'document').length,
      otherCount: allFiles.filter((item) => !['image', 'document'].includes(item.category)).length,
    };

    return NextResponse.json({
      success: true,
      files,
      stats,
    });
  } catch (error: unknown) {
    console.error('Error fetching files:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch files';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const formData = await request.formData();
    
    const file = formData.get('file') as File | null;
    const titleInput = formData.get('title') as string | null;
    const descriptionInput = formData.get('description') as string | null;
    const tagsInput = formData.get('tags') as string | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const originalName = file.name;
    const ext = path.extname(originalName).toLowerCase();
    const title = titleInput && titleInput.trim().length > 0 ? titleInput.trim() : originalName;
    const description = descriptionInput ? descriptionInput.trim() : '';
    const tags = tagsInput
      ? tagsInput
          .split(',')
          .map((t) => t.trim())
          .filter((t) => t.length > 0)
      : [];

    const mimeType = file.type || 'application/octet-stream';
    const category = getFileCategory(mimeType, ext);
    const size = file.size;

    const uniqueHash = crypto.randomBytes(8).toString('hex');
    const safeBaseName = path.basename(originalName, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `${Date.now()}_${safeBaseName}_${uniqueHash}${ext}`;

    let fileUrl = `/uploads/${fileName}`;

    // If Cloudinary is configured (or in production on Vercel)
    if (isCloudinaryConfigured()) {
      try {
        const cloudResult = await uploadToCloudinary(buffer, originalName);
        fileUrl = cloudResult.url;
      } catch (cloudErr) {
        console.error('Cloudinary upload error:', cloudErr);
        return NextResponse.json({ success: false, error: 'Cloud storage upload failed. Check Cloudinary environment variables.' }, { status: 500 });
      }
    } else if (process.env.VERCEL) {
      // In Vercel serverless without Cloudinary credentials configured yet:
      // Store image as Data URL in MongoDB so uploads work immediately on Vercel!
      const base64 = buffer.toString('base64');
      fileUrl = `data:${mimeType};base64,${base64}`;
    } else {
      // Local development disk storage
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      try {
        await mkdir(uploadDir, { recursive: true });
      } catch {
        // ignore
      }
      const filePathOnDisk = path.join(uploadDir, fileName);
      await writeFile(filePathOnDisk, buffer);
    }

    const newFile = await FileItem.create({
      title,
      description,
      originalName,
      fileName,
      fileUrl,
      mimeType,
      size,
      category,
      extension: ext,
      tags,
    });

    return NextResponse.json({
      success: true,
      file: newFile,
      message: 'File uploaded and saved successfully',
    }, { status: 201 });
  } catch (error: unknown) {
    console.error('Error uploading file:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to upload file';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
