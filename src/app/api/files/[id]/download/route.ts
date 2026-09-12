import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import FileItem from '@/models/FileItem';

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

    // If fileUrl is a Data URL (base64)
    if (file.fileUrl.startsWith('data:')) {
      const matches = file.fileUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (!matches) {
        return NextResponse.json({ success: false, error: 'Invalid file content format' }, { status: 500 });
      }
      const mimeType = matches[1];
      const base64Data = matches[2];
      const buffer = Buffer.from(base64Data, 'base64');

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': mimeType || file.mimeType || 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${encodeURIComponent(file.originalName)}"`,
          'Content-Length': buffer.length.toString(),
        },
      });
    }

    // If fileUrl is a remote URL (Cloudinary or external)
    if (file.fileUrl.startsWith('http://') || file.fileUrl.startsWith('https://')) {
      const response = await fetch(file.fileUrl);
      
      if (!response.ok) {
        // Fallback: modify Cloudinary URL to add attachment flag if blocked
        if (file.fileUrl.includes('res.cloudinary.com') && file.fileUrl.includes('/upload/')) {
          const downloadUrl = file.fileUrl.replace('/upload/', '/upload/fl_attachment/');
          const retryRes = await fetch(downloadUrl);
          if (retryRes.ok) {
            const blob = await retryRes.arrayBuffer();
            return new NextResponse(Buffer.from(blob), {
              status: 200,
              headers: {
                'Content-Type': file.mimeType || 'application/pdf',
                'Content-Disposition': `attachment; filename="${encodeURIComponent(file.originalName)}"`,
              },
            });
          }
        }
        return NextResponse.json({ success: false, error: 'Failed to retrieve remote file content' }, { status: response.status });
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': file.mimeType || response.headers.get('content-type') || 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${encodeURIComponent(file.originalName)}"`,
          'Content-Length': buffer.length.toString(),
        },
      });
    }

    // Local file fallback
    return NextResponse.redirect(new URL(file.fileUrl, request.url));
  } catch (error: unknown) {
    console.error('Download error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error downloading file';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
