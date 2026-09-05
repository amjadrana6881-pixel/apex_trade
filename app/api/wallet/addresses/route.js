import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import DepositWallet from '@/models/DepositWallet';

export async function GET() {
  try {
    await connectToDatabase();
    const wallets = await DepositWallet.find({ is_active: true });
    return NextResponse.json({ success: true, data: wallets });
  } catch (err) {
    console.error('Error fetching deposit addresses:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
