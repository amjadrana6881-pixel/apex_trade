import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import InvestmentPackage from '@/models/InvestmentPackage';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    await connectToDatabase();
    const packages = await InvestmentPackage.find({ is_active: true }).sort({ duration_days: 1, min_amount: 1 });
    return NextResponse.json({ success: true, data: packages });
  } catch (err) {
    console.error('Error fetching packages:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
