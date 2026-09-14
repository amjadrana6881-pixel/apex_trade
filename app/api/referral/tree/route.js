import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import Deposit from '@/models/Deposit';
import { getPakistanDate, getPakistanDateString } from '@/lib/timeUtils';

function maskEmail(email) {
  if (!email || !email.includes('@')) return email || '—';
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
    if (!freshUser) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    // Time calculations in Pakistan Standard Time
    const pktNow = getPakistanDate();
    const todayDateStr = getPakistanDateString(pktNow);
    const yesterdayPkt = new Date(pktNow.getTime() - 86400000);
    const yesterdayDateStr = getPakistanDateString(yesterdayPkt);
    const currentMonthStr = todayDateStr.slice(0, 7); // 'YYYY-MM'

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

    // Collect all member IDs across Tier 1, 2, and 3
    const allMembers = [...level1, ...level2, ...level3];
    const allMemberIds = allMembers.map(m => m._id);

    // Fetch all approved deposits made by all downline members
    const memberDeposits = allMemberIds.length > 0 
      ? await Deposit.find({ user_id: { $in: allMemberIds }, status: 'APPROVED' })
      : [];

    // Map depositId -> deposit object & calculate per-user deposits and daily volumes
    const depositMap = new Map();
    const memberDepositsMap = new Map(); // userId -> total approved deposit amount
    const memberDepositCountMap = new Map();

    let todayTeamVolume = 0;
    let yesterdayTeamVolume = 0;
    let thisMonthTeamVolume = 0;
    let totalTeamVolume = 0;

    memberDeposits.forEach(dep => {
      depositMap.set(dep._id.toString(), dep);
      const uId = dep.user_id.toString();
      const depAmt = Number(dep.amount || 0);
      memberDepositsMap.set(uId, (memberDepositsMap.get(uId) || 0) + depAmt);
      memberDepositCountMap.set(uId, (memberDepositCountMap.get(uId) || 0) + 1);

      totalTeamVolume += depAmt;
      const depDateStr = getPakistanDateString(new Date(dep.created_at));
      if (depDateStr === todayDateStr) {
        todayTeamVolume += depAmt;
      } else if (depDateStr === yesterdayDateStr) {
        yesterdayTeamVolume += depAmt;
      }
      if (depDateStr.startsWith(currentMonthStr)) {
        thisMonthTeamVolume += depAmt;
      }
    });

    // Fetch all referral commission bonus transactions received by freshUser
    const bonusTxs = await Transaction.find({ 
      user_id: freshUser._id, 
      type: 'REFERRAL_BONUS' 
    }).sort({ created_at: -1 });

    // Calculate time-sliced commissions (Today, Yesterday, This Month, All-Time Cumulative)
    let todayCommissions = 0;
    let yesterdayCommissions = 0;
    let thisMonthCommissions = 0;
    let totalCommissions = 0;

    const memberCommissionMap = new Map(); // userId -> commission amount

    const commissionsHistory = bonusTxs.map(tx => {
      let sourceUserId = null;
      let sourceUserName = 'Downline Trader';
      let sourceUserEmail = '';
      let depositAmount = 0;
      let tierLevel = 1;
      const txAmt = Number(tx.amount || 0);

      totalCommissions += txAmt;
      const txDateStr = getPakistanDateString(new Date(tx.created_at));
      if (txDateStr === todayDateStr) {
        todayCommissions += txAmt;
      } else if (txDateStr === yesterdayDateStr) {
        yesterdayCommissions += txAmt;
      }
      if (txDateStr.startsWith(currentMonthStr)) {
        thisMonthCommissions += txAmt;
      }

      // Check if reference_id matches an approved deposit
      if (tx.reference_id && depositMap.has(tx.reference_id)) {
        const dep = depositMap.get(tx.reference_id);
        sourceUserId = dep.user_id.toString();
        depositAmount = Number(dep.amount || 0);
      }

      // Try matching by member in our downline
      if (sourceUserId) {
        const m = allMembers.find(mem => mem._id.toString() === sourceUserId);
        if (m) {
          sourceUserName = m.name;
          sourceUserEmail = maskEmail(m.email);
        }
      } else {
        // Fallback: parse name from description e.g. "Level 1 Commission from Amir javed deposit ($100)"
        const match = tx.description?.match(/from\s+(.*?)\s+deposit/i);
        if (match && match[1]) {
          const parsedName = match[1].trim();
          const m = allMembers.find(mem => mem.name?.toLowerCase() === parsedName.toLowerCase());
          if (m) {
            sourceUserId = m._id.toString();
            sourceUserName = m.name;
            sourceUserEmail = maskEmail(m.email);
          } else {
            sourceUserName = parsedName;
          }
        }
      }

      // Detect tier level from description
      if (tx.description?.includes('Level 2') || tx.description?.includes('Tier 2')) {
        tierLevel = 2;
      } else if (tx.description?.includes('Level 3') || tx.description?.includes('Tier 3')) {
        tierLevel = 3;
      } else {
        tierLevel = 1;
      }

      // Accumulate to memberCommissionMap if source user identified
      if (sourceUserId) {
        memberCommissionMap.set(
          sourceUserId, 
          Number(((memberCommissionMap.get(sourceUserId) || 0) + txAmt).toFixed(2))
        );
      }

      return {
        id: tx._id.toString(),
        amount: txAmt,
        description: tx.description,
        reference_id: tx.reference_id,
        status: tx.status,
        created_at: tx.created_at,
        tier: tierLevel,
        depositAmount,
        sourceUser: {
          id: sourceUserId,
          name: sourceUserName,
          email: sourceUserEmail
        }
      };
    });

    // Helper to enrich member object
    const enrichMember = (m, tierNum, defaultPct) => {
      const uId = m._id.toString();
      const totalDeposited = Number((memberDepositsMap.get(uId) || 0).toFixed(2));
      const depositCount = memberDepositCountMap.get(uId) || 0;
      let commissionEarned = Number((memberCommissionMap.get(uId) || 0).toFixed(2));

      // If no direct bonus tx was matched yet but member has deposits, calculate based on tier pct
      if (commissionEarned === 0 && totalDeposited > 0) {
        commissionEarned = Number(((totalDeposited * defaultPct) / 100).toFixed(2));
      }

      return {
        _id: m._id.toString(),
        id: m._id.toString(),
        name: m.name,
        email: maskEmail(m.email),
        referral_code: m.referral_code,
        status: m.status || 'ACTIVE',
        created_at: m.created_at,
        tier: tierNum,
        tierRatePct: defaultPct,
        totalDeposited,
        depositCount,
        commissionEarned
      };
    };

    const enrichedL1 = level1.map(m => enrichMember(m, 1, 10));
    const enrichedL2 = level2.map(m => enrichMember(m, 2, 5));
    const enrichedL3 = level3.map(m => enrichMember(m, 3, 2));

    const tier1Volume = Number(enrichedL1.reduce((sum, m) => sum + m.totalDeposited, 0).toFixed(2));
    const tier2Volume = Number(enrichedL2.reduce((sum, m) => sum + m.totalDeposited, 0).toFixed(2));
    const tier3Volume = Number(enrichedL3.reduce((sum, m) => sum + m.totalDeposited, 0).toFixed(2));

    const tier1Commissions = Number(enrichedL1.reduce((sum, m) => sum + m.commissionEarned, 0).toFixed(2));
    const tier2Commissions = Number(enrichedL2.reduce((sum, m) => sum + m.commissionEarned, 0).toFixed(2));
    const tier3Commissions = Number(enrichedL3.reduce((sum, m) => sum + m.commissionEarned, 0).toFixed(2));

    return NextResponse.json({
      success: true,
      data: {
        referralCode: freshUser.referral_code,
        directCount: level1.length,
        totalTeamCount: level1.length + level2.length + level3.length,
        summary: {
          // Time-sliced Commission Earnings
          todayCommissions: Number(todayCommissions.toFixed(2)),
          yesterdayCommissions: Number(yesterdayCommissions.toFixed(2)),
          thisMonthCommissions: Number(thisMonthCommissions.toFixed(2)),
          totalCommissions: Number(totalCommissions.toFixed(2)),
          cumulativeCommissions: Number(totalCommissions.toFixed(2)),

          // Time-sliced Team Deposit Volumes
          todayTeamVolume: Number(todayTeamVolume.toFixed(2)),
          yesterdayTeamVolume: Number(yesterdayTeamVolume.toFixed(2)),
          thisMonthTeamVolume: Number(thisMonthTeamVolume.toFixed(2)),
          totalTeamVolume: Number(totalTeamVolume.toFixed(2)),
          cumulativeTeamVolume: Number(totalTeamVolume.toFixed(2)),

          // Tier Breakdown
          tier1: { count: level1.length, volume: tier1Volume, commissions: tier1Commissions, rate: 10 },
          tier2: { count: level2.length, volume: tier2Volume, commissions: tier2Commissions, rate: 5 },
          tier3: { count: level3.length, volume: tier3Volume, commissions: tier3Commissions, rate: 2 }
        },
        tree: {
          level1: enrichedL1,
          level2: enrichedL2,
          level3: enrichedL3
        },
        commissionsHistory
      }
    });
  } catch (err) {
    console.error('Referral tree error:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
