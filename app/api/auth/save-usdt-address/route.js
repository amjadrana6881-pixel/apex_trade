import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

export async function POST(request) {
  const { errorResponse, user } = await requireAuth(request);
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const { address, network } = body;

    if (!address || !address.trim()) {
      return NextResponse.json({ success: false, message: 'Please provide a valid USDT wallet address.' }, { status: 400 });
    }

    const validNetwork = (network && ['TRC-20', 'BEP-20', 'ERC-20'].includes(network)) ? network : 'TRC-20';

    user.saved_usdt_address = address.trim();
    user.saved_usdt_network = validNetwork;
    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Default USDT withdrawal address saved successfully!',
      savedAddress: address.trim(),
      savedNetwork: validNetwork
    });
  } catch (err) {
    console.error('Save USDT address error:', err);
    return NextResponse.json({ success: false, message: 'Failed to save withdrawal address.' }, { status: 500 });
  }
}
