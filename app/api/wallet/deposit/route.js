import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import Deposit from '@/models/Deposit';
import Transaction from '@/models/Transaction';
import SystemSetting from '@/models/SystemSetting';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request) {
  const { errorResponse, user } = await requireAuth(request);
  if (errorResponse) return errorResponse;

  try {
    const formData = await request.formData();
    const amount = Number(formData.get('amount'));
    const network = formData.get('network') || 'TRC-20';
    const txid = formData.get('txid') || '';
    const file = formData.get('receipt');

    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json({ success: false, message: 'Please enter a valid deposit amount.' }, { status: 400 });
    }

    await connectToDatabase();
    const minDepositSetting = await SystemSetting.findOne({ key: 'min_deposit' });
    const minDeposit = minDepositSetting ? Number(minDepositSetting.value) : 10;

    if (amount < minDeposit) {
      return NextResponse.json({ success: false, message: `Minimum crypto deposit amount is $${minDeposit.toFixed(2)}.` }, { status: 400 });
    }

    let receiptUrl = '';
    if (file && typeof file === 'object' && file.name) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const ext = path.extname(file.name) || '.jpg';
      const filename = `receipt-${Date.now()}-${uuidv4().substring(0, 8)}${ext}`;

      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const filePath = path.join(uploadDir, filename);
      fs.writeFileSync(filePath, buffer);
      receiptUrl = `/uploads/${filename}`;
    }

    const newDeposit = await Deposit.create({
      user_id: user._id,
      amount,
      network,
      txid: (txid || '').trim(),
      receipt_url: receiptUrl,
      status: 'PENDING'
    });

    // Record pending transaction
    await Transaction.create({
      user_id: user._id,
      type: 'DEPOSIT',
      amount,
      description: `Crypto deposit request via ${network} ($${amount.toFixed(2)})`,
      reference_id: newDeposit._id.toString(),
      status: 'PENDING'
    });

    return NextResponse.json({
      success: true,
      message: 'Crypto deposit request submitted successfully! Your funds will be credited once verified on blockchain by admin.',
      depositId: newDeposit._id.toString()
    });
  } catch (err) {
    console.error('Deposit request error:', err);
    return NextResponse.json({ success: false, message: 'Failed to process deposit request.' }, { status: 500 });
  }
}
