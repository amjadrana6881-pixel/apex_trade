import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import DepositWallet from '@/models/DepositWallet';

export async function PUT(request, { params }) {
  const { errorResponse } = await requireAdmin(request);
  if (errorResponse) return errorResponse;

  try {
    const { id } = await params;
    const body = await request.json();
    const { address, network_name, account_title, account_number, instructions, is_active } = body;

    await connectToDatabase();
    const wallet = await DepositWallet.findById(id);
    if (!wallet) {
      return NextResponse.json({ success: false, message: 'Wallet not found' }, { status: 404 });
    }

    if (address !== undefined) wallet.address = address;
    if (network_name !== undefined) wallet.network_name = network_name;
    if (account_title !== undefined) wallet.account_title = account_title;
    if (account_number !== undefined) wallet.account_number = account_number;
    if (instructions !== undefined) wallet.instructions = instructions;
    if (is_active !== undefined) wallet.is_active = is_active;

    await wallet.save();
    return NextResponse.json({ success: true, message: 'Payment channel updated successfully!' });
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Failed to update payment channel.' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { errorResponse } = await requireAdmin(request);
  if (errorResponse) return errorResponse;

  try {
    const { id } = await params;
    await connectToDatabase();
    await DepositWallet.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: 'Payment channel deleted.' });
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
