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

    // 1. Data URLs (base64 stored in MongoDB)
    if (file.fileUrl.startsWith('data:')) {
      const matches = file.fileUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (!matches) {
        return NextResponse.json({ success: false, error: 'Invalid base64 file content' }, { status: 500 });
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

    // 2. Remote URLs (Cloudinary or external HTTP/HTTPS)
    if (file.fileUrl.startsWith('http://') || file.fileUrl.startsWith('https://')) {
      try {
        const response = await fetch(file.fileUrl);
        
        if (!response.ok) {
          // Retry with Cloudinary fl_attachment flag if needed
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
          return NextResponse.json(
            { success: false, error: 'Remote file resource could not be retrieved from Cloudinary' },
            { status: response.status }
          );
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
      } catch (fetchErr) {
        console.error('Remote fetch error:', fetchErr);
        return NextResponse.json({ success: false, error: 'Failed to download file from cloud storage' }, { status: 500 });
      }
    }

    // 3. Local disk files (/uploads/...)
    // If running on Vercel serverless, old local /uploads/ files from earlier deployments do not exist on disk
    if (process.env.VERCEL || process.env.VERCEL_ENV) {
      return NextResponse.json(
        {
          success: false,
          error: `The file "${file.originalName}" was uploaded prior to Cloudinary cloud configuration. Please delete this item and upload it again.`,
        },
        { status: 404 }
      );
    }

    // Local environment redirect
    return NextResponse.redirect(new URL(file.fileUrl, request.url));
  } catch (error: unknown) {
    console.error('Download error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error downloading file';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
