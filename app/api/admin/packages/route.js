import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import InvestmentPackage from '@/models/InvestmentPackage';
import UserInvestment from '@/models/UserInvestment';

export async function GET(request) {
  const { errorResponse } = await requireAdmin(request);
  if (errorResponse) return errorResponse;

  try {
    await connectToDatabase();
    const list = await InvestmentPackage.find().sort({ duration_days: 1, min_amount: 1 });
    
    // Add active investor count to each package
    const packagesWithStats = await Promise.all(list.map(async (pkg) => {
      const activeCount = await UserInvestment.countDocuments({ package_id: pkg._id, status: 'ACTIVE' });
      const totalInvestedSum = await UserInvestment.aggregate([
        { $match: { package_id: pkg._id, status: 'ACTIVE' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      const pkgObj = pkg.toObject();
      pkgObj.active_subscribers = activeCount;
      pkgObj.total_active_staked = totalInvestedSum[0]?.total || 0;
      return pkgObj;
    }));

    return NextResponse.json({ success: true, data: packagesWithStats });
  } catch (err) {
    console.error('Admin fetch packages error:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function POST(request) {
  const { errorResponse } = await requireAdmin(request);
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const { name, tag, min_amount, max_amount, duration_days, total_return_roi, daily_roi, description } = body;

    const duration = Number(duration_days) || 7;
    let totalRoi = Number(total_return_roi);
    let dRoi = Number(daily_roi);

    if (isNaN(totalRoi) || totalRoi <= 0) {
      if (!isNaN(dRoi) && dRoi > 0) {
        totalRoi = Number((dRoi * duration).toFixed(2));
      } else {
        totalRoi = 15.0;
      }
    }

    if (isNaN(dRoi) || dRoi <= 0) {
      dRoi = Number((totalRoi / duration).toFixed(2));
    }

    await connectToDatabase();
    const newPkg = await InvestmentPackage.create({
      name: name || `${duration}-Day Growth Plan`,
      tag: tag || 'Yield Staking',
      min_amount: Number(min_amount) || 50,
      max_amount: Number(max_amount) || 10000,
      duration_days: duration,
      total_return_roi: totalRoi,
      daily_roi: dRoi,
      description: description || `Lock funds for ${duration} days. Earn ${totalRoi}% guaranteed return while trading freely with VIP Signal boost.`,
      is_active: true
    });

    return NextResponse.json({ success: true, message: 'Investment package created successfully!', data: newPkg });
  } catch (err) {
    console.error('Admin create package error:', err);
    return NextResponse.json({ success: false, message: 'Failed to create package.' }, { status: 500 });
  }
}
