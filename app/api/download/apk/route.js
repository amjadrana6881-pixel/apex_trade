import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = (searchParams.get('type') || 'user').toLowerCase();

    const fileName = type === 'admin' ? 'ApexTrade_Admin.apk' : 'ApexTrade_User.apk';
    const filePath = path.join(process.cwd(), 'public', 'downloads', fileName);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: `APK file ${fileName} not found on server.` },
        { status: 404 }
      );
    }

    const stat = fs.statSync(filePath);
    const fileStream = fs.createReadStream(filePath);

    // Convert node readStream to web readableStream
    const readable = new ReadableStream({
      start(controller) {
        fileStream.on('data', (chunk) => controller.enqueue(chunk));
        fileStream.on('end', () => controller.close());
        fileStream.on('error', (err) => controller.error(err));
      },
      cancel() {
        fileStream.destroy();
      },
    });

    return new Response(readable, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.android.package-archive',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': stat.size.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('APK Download Route Error:', error);
    return NextResponse.json(
      { error: 'Failed to stream APK file', details: error.message },
      { status: 500 }
    );
  }
}
