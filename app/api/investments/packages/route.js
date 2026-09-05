import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import InvestmentPackage from '@/models/InvestmentPackage';

export async function GET() {
  try {
    await connectToDatabase();
    const packages = await InvestmentPackage.find({ is_active: true });
    return NextResponse.json({ success: true, data: packages });
  } catch (err) {
    console.error('Error fetching packages:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
