import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request) {
  const { errorResponse, user } = await requireAuth(request);
  if (errorResponse) return errorResponse;

  try {
    const formData = await request.formData();
    const file = formData.get('document');

    let docUrl = '';
    if (file && typeof file === 'object' && file.name) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const ext = path.extname(file.name) || '.jpg';
      const filename = `kyc-${Date.now()}-${uuidv4().substring(0, 8)}${ext}`;

      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const filePath = path.join(uploadDir, filename);
      fs.writeFileSync(filePath, buffer);
      docUrl = `/uploads/${filename}`;
    }

    user.kyc_status = 'PENDING';
    if (docUrl) user.kyc_doc = docUrl;
    await user.save();

    return NextResponse.json({
      success: true,
      message: 'KYC documents submitted successfully! Admin will review shortly.',
      kyc_status: 'PENDING',
      kyc_doc: user.kyc_doc
    });
  } catch (err) {
    console.error('KYC upload error:', err);
    return NextResponse.json({ success: false, message: 'Failed to upload KYC document.' }, { status: 500 });
  }
}
