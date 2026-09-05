import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import DepositWallet from '@/models/DepositWallet';

export async function GET(request) {
  const { errorResponse } = await requireAdmin(request);
  if (errorResponse) return errorResponse;

  try {
    await connectToDatabase();
    const wallets = await DepositWallet.find().sort({ is_active: -1 });
    return NextResponse.json({ success: true, data: wallets });
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function POST(request) {
  const { errorResponse } = await requireAdmin(request);
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const { network, address, network_name, account_title, account_number, instructions } = body;

    await connectToDatabase();
    await DepositWallet.create({
      network,
      address,
      network_name,
      account_title: account_title || '',
      account_number: account_number || '',
      instructions: instructions || '',
      is_active: true
    });

    return NextResponse.json({ success: true, message: 'Payment channel added successfully!' });
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Failed to add payment channel.' }, { status: 500 });
  }
}
