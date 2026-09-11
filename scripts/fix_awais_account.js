import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import Trade from '../models/Trade.js';

async function fixAwais() {
  await mongoose.connect(process.env.MONGODB_URI);
  const user = await User.findOne({ email: 'hafizawais0102@gmail.com' });
  if (!user) {
    console.error('User not found');
    process.exit(1);
  }

  // 1. Delete the recent 763 loss and order transactions
  const txDel = await Transaction.deleteMany({
    user_id: user._id,
    $or: [
      { _id: new mongoose.Types.ObjectId('6aa445bb731446f4a3f7e951') },
      { _id: new mongoose.Types.ObjectId('6aa44506731446f4a3f7e950') },
      { description: /763/i }
    ]
  });
  console.log('Deleted Transactions count:', txDel.deletedCount);

  // 2. Delete the 763 trade
  const tradeDel = await Trade.deleteMany({
    user_id: user._id,
    $or: [
      { _id: new mongoose.Types.ObjectId('6aa44506731446f4a3f7e94f') },
      { amount: 763 }
    ]
  });
  console.log('Deleted Trades count:', tradeDel.deletedCount);

  // 3. Set wallet_balance and tradeable_amount to 763
  user.wallet_balance = 763.00;
  user.tradeable_amount = 763.00;
  await user.save();
  console.log('Updated user wallet_balance & tradeable_amount to:', user.wallet_balance);

  // Verify
  const updatedUser = await User.findOne({ email: 'hafizawais0102@gmail.com' }).lean();
  console.log('Verified Awais in DB:', {
    name: updatedUser.name,
    email: updatedUser.email,
    wallet_balance: updatedUser.wallet_balance,
    tradeable_amount: updatedUser.tradeable_amount
  });

  const latestTx = await Transaction.find({ user_id: user._id }).sort({ created_at: -1 }).limit(5).lean();
  console.log('Latest 5 Transactions:');
  latestTx.forEach(t => console.log(t._id, t.type, t.amount, t.description, t.created_at));

  process.exit(0);
}

fixAwais().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
