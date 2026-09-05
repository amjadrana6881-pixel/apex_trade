import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';
import Transaction from '@/models/Transaction';

function maskEmail(email) {
  if (!email || !email.includes('@')) return email;
  const [name, domain] = email.split('@');
  if (name.length <= 2) return `${name[0]}*@${domain}`;
  return `${name.substring(0, 2)}***${name.slice(-1)}@${domain}`;
}

export async function GET(request) {
  const { errorResponse, user } = await requireAuth(request);
  if (errorResponse) return errorResponse;

  try {
    await connectToDatabase();
    const freshUser = await User.findById(user._id);

    // Tier 1 (Direct referrals)
    const level1 = await User.find({ referred_by: freshUser.referral_code })
      .select('name email referral_code wallet_balance created_at status');

    // Tier 2 (Referrals of Level 1)
    let level2 = [];
    if (level1.length > 0) {
      const l1Codes = level1.map(u => u.referral_code).filter(Boolean);
      if (l1Codes.length > 0) {
        level2 = await User.find({ referred_by: { $in: l1Codes } })
          .select('name email referral_code referred_by wallet_balance created_at status');
      }
    }

    // Tier 3 (Referrals of Level 2)
    let level3 = [];
    if (level2.length > 0) {
      const l2Codes = level2.map(u => u.referral_code).filter(Boolean);
      if (l2Codes.length > 0) {
        level3 = await User.find({ referred_by: { $in: l2Codes } })
          .select('name email referral_code referred_by wallet_balance created_at status');
      }
    }

    // Total referral earnings
    const bonusTxs = await Transaction.find({ user_id: freshUser._id, type: 'REFERRAL_BONUS' });
    const totalCommissions = bonusTxs.reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

    return NextResponse.json({
      success: true,
      data: {
        referralCode: freshUser.referral_code,
        directCount: level1.length,
        totalTeamCount: level1.length + level2.length + level3.length,
        totalCommissions,
        tree: {
          level1: level1.map(u => ({ ...u.toObject(), email: maskEmail(u.email) })),
          level2: level2.map(u => ({ ...u.toObject(), email: maskEmail(u.email) })),
          level3: level3.map(u => ({ ...u.toObject(), email: maskEmail(u.email) }))
        }
      }
    });
  } catch (err) {
    console.error('Referral tree error:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
