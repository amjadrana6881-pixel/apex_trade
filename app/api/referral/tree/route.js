import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import Deposit from '@/models/Deposit';
import Trade from '@/models/Trade';
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

    // Fetch all winning trades placed by downline members
    const memberTrades = allMemberIds.length > 0
      ? await Trade.find({ user_id: { $in: allMemberIds } })
      : [];

    // Map depositId -> deposit object
    const depositMap = new Map();
    const memberDepositsMap = new Map();
    const memberDepositCountMap = new Map();

    let todayTeamDepositVolume = 0;
    let yesterdayTeamDepositVolume = 0;
    let thisMonthTeamDepositVolume = 0;
    let totalTeamDepositVolume = 0;

    memberDeposits.forEach(dep => {
      depositMap.set(dep._id.toString(), dep);
      const uId = dep.user_id.toString();
      const depAmt = Number(dep.amount || 0);
      memberDepositsMap.set(uId, (memberDepositsMap.get(uId) || 0) + depAmt);
      memberDepositCountMap.set(uId, (memberDepositCountMap.get(uId) || 0) + 1);

      totalTeamDepositVolume += depAmt;
      const depDateStr = getPakistanDateString(new Date(dep.created_at));
      if (depDateStr === todayDateStr) {
        todayTeamDepositVolume += depAmt;
      } else if (depDateStr === yesterdayDateStr) {
        yesterdayTeamDepositVolume += depAmt;
      }
      if (depDateStr.startsWith(currentMonthStr)) {
        thisMonthTeamDepositVolume += depAmt;
      }
    });

    // Map tradeId -> trade object & calculate member trade profits
    const tradeMap = new Map();
    const memberTradeProfitMap = new Map();
    const memberTradeVolumeMap = new Map();
    const memberTradeCountMap = new Map();

    let todayTeamTradeVolume = 0;
    let totalTeamTradeVolume = 0;
    let todayTeamTradeProfit = 0;
    let totalTeamTradeProfit = 0;

    memberTrades.forEach(tr => {
      tradeMap.set(tr._id.toString(), tr);
      const uId = tr.user_id.toString();
      const trAmt = Number(tr.amount || 0);
      const trProfit = Number(tr.profit || 0);

      memberTradeVolumeMap.set(uId, (memberTradeVolumeMap.get(uId) || 0) + trAmt);
      totalTeamTradeVolume += trAmt;

      if (tr.result === 'WIN' && trProfit > 0) {
        memberTradeProfitMap.set(uId, (memberTradeProfitMap.get(uId) || 0) + trProfit);
        memberTradeCountMap.set(uId, (memberTradeCountMap.get(uId) || 0) + 1);
        totalTeamTradeProfit += trProfit;
      }

      const trDateStr = getPakistanDateString(new Date(tr.created_at));
      if (trDateStr === todayDateStr) {
        todayTeamTradeVolume += trAmt;
        if (tr.result === 'WIN' && trProfit > 0) {
          todayTeamTradeProfit += trProfit;
        }
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
      let activityType = 'TRADE_PROFIT'; // 'TRADE_PROFIT' | 'DEPOSIT'
      let activityAmount = 0;
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

      // Check if reference_id matches a trade record
      if (tx.reference_id && tradeMap.has(tx.reference_id)) {
        const tr = tradeMap.get(tx.reference_id);
        sourceUserId = tr.user_id.toString();
        activityType = 'TRADE_PROFIT';
        activityAmount = Number(tr.profit || 0);
      }
      // Check if reference_id matches an approved deposit
      else if (tx.reference_id && depositMap.has(tx.reference_id)) {
        const dep = depositMap.get(tx.reference_id);
        sourceUserId = dep.user_id.toString();
        activityType = 'DEPOSIT';
        activityAmount = Number(dep.amount || 0);
      }

      // Try matching by member in our downline
      if (sourceUserId) {
        const m = allMembers.find(mem => mem._id.toString() === sourceUserId);
        if (m) {
          sourceUserName = m.name;
          sourceUserEmail = maskEmail(m.email);
        }
      } else {
        // Fallback: parse name from description e.g. "Tier 1 Trade Profit Commission from Amir javed"
        const match = tx.description?.match(/from\s+(.*?)(?:\s+\(|$)/i);
        if (match && match[1]) {
          const parsedName = match[1].replace(/deposit|trade|profit/gi, '').trim();
          const m = allMembers.find(mem => mem.name?.toLowerCase() === parsedName.toLowerCase());
          if (m) {
            sourceUserId = m._id.toString();
            sourceUserName = m.name;
            sourceUserEmail = maskEmail(m.email);
          } else {
            sourceUserName = parsedName || 'Downline Trader';
          }
        }
      }

      // Detect tier level from description
      if (tx.description?.includes('Tier 2') || tx.description?.includes('Level 2')) {
        tierLevel = 2;
      } else if (tx.description?.includes('Tier 3') || tx.description?.includes('Level 3')) {
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
        activityType,
        activityAmount,
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
      const totalTradeProfit = Number((memberTradeProfitMap.get(uId) || 0).toFixed(2));
      const totalTradeVolume = Number((memberTradeVolumeMap.get(uId) || 0).toFixed(2));
      const tradeCount = memberTradeCountMap.get(uId) || 0;

      let commissionEarned = Number((memberCommissionMap.get(uId) || 0).toFixed(2));

      // If no direct bonus tx was matched yet but member has trade profits, calculate based on tier pct
      if (commissionEarned === 0 && totalTradeProfit > 0) {
        commissionEarned = Number(((totalTradeProfit * defaultPct) / 100).toFixed(2));
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
        totalTradeProfit,
        totalTradeVolume,
        tradeCount,
        commissionEarned
      };
    };

    const enrichedL1 = level1.map(m => enrichMember(m, 1, 10));
    const enrichedL2 = level2.map(m => enrichMember(m, 2, 5));
    const enrichedL3 = level3.map(m => enrichMember(m, 3, 2));

    const tier1Volume = Number(enrichedL1.reduce((sum, m) => sum + m.totalTradeProfit || m.totalDeposited, 0).toFixed(2));
    const tier2Volume = Number(enrichedL2.reduce((sum, m) => sum + m.totalTradeProfit || m.totalDeposited, 0).toFixed(2));
    const tier3Volume = Number(enrichedL3.reduce((sum, m) => sum + m.totalTradeProfit || m.totalDeposited, 0).toFixed(2));

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
          // Time-sliced Commission Earnings from Daily Trade Profits
          todayCommissions: Number(todayCommissions.toFixed(2)),
          yesterdayCommissions: Number(yesterdayCommissions.toFixed(2)),
          thisMonthCommissions: Number(thisMonthCommissions.toFixed(2)),
          totalCommissions: Number(totalCommissions.toFixed(2)),
          cumulativeCommissions: Number(totalCommissions.toFixed(2)),

          // Team Trading Volume & Profit Turnover
          todayTeamTradeVolume: Number(todayTeamTradeVolume.toFixed(2)),
          totalTeamTradeVolume: Number(totalTeamTradeVolume.toFixed(2)),
          todayTeamTradeProfit: Number(todayTeamTradeProfit.toFixed(2)),
          totalTeamTradeProfit: Number(totalTeamTradeProfit.toFixed(2)),

          // Team Deposit Turnover
          todayTeamDepositVolume: Number(todayTeamDepositVolume.toFixed(2)),
          totalTeamDepositVolume: Number(totalTeamDepositVolume.toFixed(2)),
          totalTeamVolume: Number((totalTeamDepositVolume + totalTeamTradeVolume).toFixed(2)),

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
