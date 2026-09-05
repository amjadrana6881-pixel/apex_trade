import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import Deposit from '@/models/Deposit';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import SystemSetting from '@/models/SystemSetting';

export async function POST(request, { params }) {
  const { errorResponse } = await requireAdmin(request);
  if (errorResponse) return errorResponse;

  try {
    const { id } = await params;
    const body = await request.json();
    const { action, notes } = body; // 'APPROVE' or 'REJECT'

    await connectToDatabase();
    const deposit = await Deposit.findById(id);
    if (!deposit) {
      return NextResponse.json({ success: false, message: 'Deposit request not found.' }, { status: 404 });
    }

    if (deposit.status !== 'PENDING') {
      return NextResponse.json({ success: false, message: `Deposit is already ${deposit.status}.` }, { status: 400 });
    }

    if (action === 'APPROVE') {
      // 1. Credit user wallet
      const user = await User.findById(deposit.user_id);
      if (user) {
        user.wallet_balance += deposit.amount;
        user.tradeable_amount = user.wallet_balance;
        await user.save();
      }

      // 2. Mark deposit approved
      deposit.status = 'APPROVED';
      deposit.admin_notes = notes || 'Approved by Admin';
      await deposit.save();

      // 3. Mark transaction completed
      await Transaction.updateMany(
        { reference_id: deposit._id.toString() },
        { status: 'COMPLETED' }
      );

      // 4. Distribute 3-Tier Referral Commissions
      if (user && user.referred_by) {
        await distributeReferralCommissions(user, deposit.amount, deposit._id.toString());
      }

      return NextResponse.json({
        success: true,
        message: `Deposit of $${deposit.amount.toFixed(2)} approved and balance credited!`
      });
    } else if (action === 'REJECT') {
      deposit.status = 'REJECTED';
      deposit.admin_notes = notes || 'Rejected by Admin';
      await deposit.save();

      await Transaction.updateMany(
        { reference_id: deposit._id.toString() },
        { status: 'REJECTED' }
      );

      return NextResponse.json({ success: true, message: 'Deposit rejected.' });
    } else {
      return NextResponse.json({ success: false, message: 'Invalid action.' }, { status: 400 });
    }
  } catch (err) {
    console.error('Deposit action error:', err);
    return NextResponse.json({ success: false, message: 'Failed to process deposit action.' }, { status: 500 });
  }
}

async function distributeReferralCommissions(user, depositAmount, depositId) {
  try {
    const lvl1Setting = await SystemSetting.findOne({ key: 'referral_lvl1_pct' });
    const lvl2Setting = await SystemSetting.findOne({ key: 'referral_lvl2_pct' });
    const lvl3Setting = await SystemSetting.findOne({ key: 'referral_lvl3_pct' });

    const lvl1Pct = Number(lvl1Setting?.value || 10);
    const lvl2Pct = Number(lvl2Setting?.value || 5);
    const lvl3Pct = Number(lvl3Setting?.value || 2);

    // Tier 1 sponsor
    const u1 = await User.findOne({ referral_code: user.referred_by });
    if (u1) {
      const bonus1 = (depositAmount * lvl1Pct) / 100;
      u1.wallet_balance += bonus1;
      u1.tradeable_amount = u1.wallet_balance;
      await u1.save();

      await Transaction.create({
        user_id: u1._id,
        type: 'REFERRAL_BONUS',
        amount: bonus1,
        description: `Level 1 Commission from ${user.name} deposit ($${depositAmount})`,
        reference_id: depositId,
        status: 'COMPLETED'
      });

      // Tier 2 sponsor
      if (u1.referred_by) {
        const u2 = await User.findOne({ referral_code: u1.referred_by });
        if (u2) {
          const bonus2 = (depositAmount * lvl2Pct) / 100;
          u2.wallet_balance += bonus2;
          u2.tradeable_amount = u2.wallet_balance;
          await u2.save();

          await Transaction.create({
            user_id: u2._id,
            type: 'REFERRAL_BONUS',
            amount: bonus2,
            description: `Level 2 Commission from ${user.name} deposit ($${depositAmount})`,
            reference_id: depositId,
            status: 'COMPLETED'
          });

          // Tier 3 sponsor
          if (u2.referred_by) {
            const u3 = await User.findOne({ referral_code: u2.referred_by });
            if (u3) {
              const bonus3 = (depositAmount * lvl3Pct) / 100;
              u3.wallet_balance += bonus3;
              u3.tradeable_amount = u3.wallet_balance;
              await u3.save();

              await Transaction.create({
                user_id: u3._id,
                type: 'REFERRAL_BONUS',
                amount: bonus3,
                description: `Level 3 Commission from ${user.name} deposit ($${depositAmount})`,
                reference_id: depositId,
                status: 'COMPLETED'
              });
            }
          }
        }
      }
    }
  } catch (err) {
    console.error('Commission distribution error:', err);
  }
}
