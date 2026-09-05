'use client';

import React, { useState, useEffect } from 'react';
import { 
  Wallet as WalletIcon, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Copy, 
  Check, 
  Upload, 
  Clock, 
  ShieldCheck, 
  History, 
  AlertCircle,
  QrCode,
  Sparkles,
  Lock,
  Key,
  Eye,
  EyeOff,
  BookmarkCheck
} from 'lucide-react';
import { useAuth, API_BASE } from '@/app/context/AuthContext';

export default function WalletPage() {
  const { user, token, fetchProfile } = useAuth();
  
  const [tab, setTab] = useState('deposit'); // 'deposit', 'withdraw', 'history'

  // Deposit State
  const [depositWallets, setDepositWallets] = useState([]);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositTxid, setDepositTxid] = useState('');
  const [depositReceipt, setDepositReceipt] = useState(null);
  const [depositLoading, setDepositLoading] = useState(false);
  const [depositMsg, setDepositMsg] = useState('');
  const [copied, setCopied] = useState(false);

  // Withdraw State (USDT Only & Dedicated Password)
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawNetwork, setWithdrawNetwork] = useState(user?.saved_usdt_network || 'TRC-20');
  const [withdrawAddress, setWithdrawAddress] = useState(user?.saved_usdt_address || '');
  const [withdrawPassword, setWithdrawPassword] = useState('');
  const [showWithdrawPassword, setShowWithdrawPassword] = useState(false);
  const [saveAsDefault, setSaveAsDefault] = useState(true);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawMsg, setWithdrawMsg] = useState('');

  // Setup Withdrawal Password Modal
  const [showSetPasswordModal, setShowSetPasswordModal] = useState(false);
  const [newWithdrawalPin, setNewWithdrawalPin] = useState('');
  const [confirmWithdrawalPin, setConfirmWithdrawalPin] = useState('');
  const [setPasswordLoading, setSetPasswordLoading] = useState(false);
  const [setPasswordMsg, setSetPasswordMsg] = useState('');

  // Transactions State
  const [transactions, setTransactions] = useState([]);
  const [txLoading, setTxLoading] = useState(false);

  useEffect(() => {
    fetchDepositWallets();
    if (token) {
      fetchTransactions();
    }
  }, [token]);

  useEffect(() => {
    if (user?.saved_usdt_address) {
      setWithdrawAddress(user.saved_usdt_address);
    }
    if (user?.saved_usdt_network) {
      setWithdrawNetwork(user.saved_usdt_network);
    }
  }, [user]);

  const fetchDepositWallets = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/wallet/addresses`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        setDepositWallets(data.data);
        setSelectedWallet(data.data[0]);
      }
    } catch (err) {
      console.error('Failed to load deposit wallets:', err);
    }
  };

  const fetchTransactions = async () => {
    try {
      setTxLoading(true);
      const res = await fetch(`${API_BASE}/api/wallet/transactions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setTransactions(data.data || []);
      }
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setTxLoading(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Submit Crypto Deposit Request
  const handleDepositSubmit = async (e) => {
    e.preventDefault();
    if (!selectedWallet) return;
    const amt = Number(depositAmount);
    if (!amt || amt <= 0) {
      setDepositMsg('❌ Please enter a valid deposit amount.');
      return;
    }
    if (!depositTxid.trim()) {
      setDepositMsg('❌ Blockchain Transaction ID / Hash (TXID) is required.');
      return;
    }

    try {
      setDepositLoading(true);
      setDepositMsg('');

      const formData = new FormData();
      formData.append('amount', amt);
      formData.append('network', selectedWallet.network);
      formData.append('txid', depositTxid.trim());
      if (depositReceipt) {
        formData.append('receipt', depositReceipt);
      }

      const res = await fetch(`${API_BASE}/api/wallet/deposit`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      const data = await res.json();
      if (data.success) {
        setDepositMsg('✅ Deposit request submitted successfully! Your funds will be credited once verified on blockchain.');
        setDepositAmount('');
        setDepositTxid('');
        setDepositReceipt(null);
        fetchTransactions();
        fetchProfile();
      } else {
        setDepositMsg('❌ ' + (data.message || 'Deposit submission failed.'));
      }
    } catch (err) {
      setDepositMsg('❌ Failed to submit deposit request.');
    } finally {
      setDepositLoading(false);
    }
  };

  // Submit USDT Withdrawal Request (With Dedicated Password)
  const handleWithdrawSubmit = async (e) => {
    e.preventDefault();
    const amt = Number(withdrawAmount);
    if (!amt || amt <= 0) {
      setWithdrawMsg('❌ Please enter a valid withdrawal amount.');
      return;
    }
    if (!withdrawAddress.trim()) {
      setWithdrawMsg('❌ Please enter your USDT receiving address.');
      return;
    }

    if (!user?.has_withdrawal_password) {
      setShowSetPasswordModal(true);
      return;
    }

    if (!withdrawPassword.trim()) {
      setWithdrawMsg('❌ Please enter your dedicated Withdrawal Security Password.');
      return;
    }

    try {
      setWithdrawLoading(true);
      setWithdrawMsg('');

      const res = await fetch(`${API_BASE}/api/wallet/withdraw`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: amt,
          network: withdrawNetwork,
          destinationAddress: withdrawAddress.trim(),
          withdrawalPassword: withdrawPassword.trim(),
          saveAsDefault
        })
      });

      const data = await res.json();
      if (data.success) {
        setWithdrawMsg('✅ Withdrawal request submitted! Credited after security clearance.');
        setWithdrawAmount('');
        setWithdrawPassword('');
        fetchTransactions();
        fetchProfile();
      } else {
        if (data.requiresWithdrawalPasswordSetup) {
          setShowSetPasswordModal(true);
        }
        setWithdrawMsg('❌ ' + (data.message || 'Withdrawal failed.'));
      }
    } catch (err) {
      setWithdrawMsg('❌ Failed to submit withdrawal.');
    } finally {
      setWithdrawLoading(false);
    }
  };

  // Setup Withdrawal Password
  const handleSetWithdrawalPasswordSubmit = async (e) => {
    e.preventDefault();
    if (newWithdrawalPin.length < 4) {
      setSetPasswordMsg('❌ Password must be at least 4 characters/digits.');
      return;
    }
    if (newWithdrawalPin !== confirmWithdrawalPin) {
      setSetPasswordMsg('❌ Passwords do not match.');
      return;
    }

    try {
      setSetPasswordLoading(true);
      setSetPasswordMsg('');

      const res = await fetch(`${API_BASE}/api/auth/set-withdrawal-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          withdrawalPassword: newWithdrawalPin.trim()
        })
      });

      const data = await res.json();
      if (data.success) {
        setShowSetPasswordModal(false);
        setNewWithdrawalPin('');
        setConfirmWithdrawalPin('');
        fetchProfile();
        setWithdrawMsg('✅ Withdrawal Security Password configured! You can now complete your withdrawal.');
      } else {
        setSetPasswordMsg('❌ ' + (data.message || 'Failed to save withdrawal password.'));
      }
    } catch (err) {
      setSetPasswordMsg('❌ Failed to set password.');
    } finally {
      setSetPasswordLoading(false);
    }
  };

  const walletBal = Number(user?.wallet_balance || 0);
  const withdrawFee = withdrawAmount ? (Number(withdrawAmount) * 0.10).toFixed(2) : '0.00';
  const withdrawNet = withdrawAmount && Number(withdrawAmount) > 0 ? (Number(withdrawAmount) - Number(withdrawFee)).toFixed(2) : '0.00';

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Crypto Wallet & Treasury
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Secure USDT deposits and password-protected fast withdrawals via blockchain.
        </p>
      </div>

      {/* Spot Balance Overview Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Liquid Spot Balance</span>
          <h2 className="text-3xl sm:text-5xl font-black font-mono text-slate-900">
            ${walletBal.toFixed(2)}
          </h2>
          <div className="flex items-center gap-2 pt-1">
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Ready for Live Trading
            </span>
            {user?.saved_usdt_address && (
              <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200 flex items-center gap-1">
                <BookmarkCheck className="w-3.5 h-3.5" />
                <span>USDT Address Saved</span>
              </span>
            )}
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex p-1.5 bg-slate-100 rounded-2xl gap-1">
          <button
            onClick={() => setTab('deposit')}
            className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              tab === 'deposit' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>Deposit</span>
          </button>

          <button
            onClick={() => setTab('withdraw')}
            className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              tab === 'withdraw' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Withdraw (USDT)</span>
          </button>

          <button
            onClick={() => setTab('history')}
            className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              tab === 'history' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Ledger</span>
          </button>
        </div>
      </div>

      {/* 1. DEPOSIT TAB */}
      {tab === 'deposit' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Network Selection & Address Card (7 cols) */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs space-y-6">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Step 1: Select Crypto Deposit Network</h2>
              <p className="text-xs text-slate-500">Send USDT, BTC or ETH directly to the official depository address.</p>
            </div>

            {/* Network Selector Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {depositWallets.map((w) => (
                <button
                  key={w._id || w.id}
                  onClick={() => setSelectedWallet(w)}
                  className={`p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                    (selectedWallet?._id === w._id || selectedWallet?.id === w.id)
                      ? 'bg-blue-50/70 border-blue-500 shadow-xs'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-xs font-black block text-slate-900">{w.network}</span>
                  <span className="text-[10px] font-bold text-slate-400 truncate block">{w.network_name || w.name}</span>
                </button>
              ))}
            </div>

            {selectedWallet && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase text-slate-400">Official {selectedWallet.network} Deposit Address</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-blue-100 text-blue-800">
                    Active Channel
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 p-3.5 bg-white border border-slate-200 rounded-xl">
                  <span className="font-mono text-xs font-bold text-slate-900 break-all select-all">
                    {selectedWallet.address}
                  </span>
                  <button
                    onClick={() => handleCopy(selectedWallet.address)}
                    className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors shrink-0 cursor-pointer"
                    title="Copy Address"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <div className="text-[11px] text-slate-500 space-y-1">
                  <p>• {selectedWallet.instructions || `Send only ${selectedWallet.network} tokens to this address.`}</p>
                  <p>• Deposits are credited instantly once verified by admin.</p>
                </div>
              </div>
            )}
          </div>

          {/* Deposit Verification Form (5 cols) */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs space-y-5">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Step 2: Submit Deposit Proof</h2>
              <p className="text-xs text-slate-500">Provide deposit amount and Blockchain TXID hash for rapid verification.</p>
            </div>

            {depositMsg && (
              <div className={`p-3.5 rounded-2xl text-xs font-bold ${
                depositMsg.includes('✅') ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-rose-50 border border-rose-200 text-rose-700'
              }`}>
                {depositMsg}
              </div>
            )}

            <form onSubmit={handleDepositSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">
                  Amount Deposited ($) <span className="text-rose-500">* (Required)</span>
                </label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  required
                  placeholder="e.g. 500"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-mono text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">
                  Blockchain Transaction Hash (TXID) <span className="text-rose-500">* (Required)</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Paste your blockchain TXID"
                  value={depositTxid}
                  onChange={(e) => setDepositTxid(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-mono text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 flex justify-between">
                  <span>Payment Receipt Screenshot</span>
                  <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <label className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-2xl p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-slate-50 transition-colors">
                  <Upload className="w-5 h-5 text-slate-400" />
                  <span className="text-xs font-bold text-slate-600">
                    {depositReceipt ? depositReceipt.name : 'Click to Upload Image / Receipt'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setDepositReceipt(e.target.files[0] || null)}
                  />
                </label>
              </div>

              <button
                type="submit"
                disabled={depositLoading}
                className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {depositLoading ? 'Submitting Verification...' : 'Submit Deposit Verification'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 2. WITHDRAW TAB (USDT Only & Dedicated Password) */}
      {tab === 'withdraw' && (
        <div className="max-w-xl mx-auto bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">USDT Fast Withdrawal Request</h2>
            <p className="text-xs text-slate-500">Withdrawals are processed strictly in USDT with 256-bit PIN security.</p>
          </div>

          {/* Security Notice / Password Setup Alert */}
          {!user?.has_withdrawal_password && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-2 text-xs text-amber-900">
              <div className="flex items-center gap-2 font-bold text-amber-800">
                <Key className="w-4 h-4 text-amber-600" />
                <span>Withdrawal Security Password Required</span>
              </div>
              <p className="text-[11px] text-amber-700">
                For account safety, a dedicated withdrawal password/PIN must be set before funds can be released.
              </p>
              <button
                type="button"
                onClick={() => setShowSetPasswordModal(true)}
                className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs cursor-pointer shadow-xs"
              >
                Set Withdrawal Password Now
              </button>
            </div>
          )}

          {withdrawMsg && (
            <div className={`p-3.5 rounded-2xl text-xs font-bold ${
              withdrawMsg.includes('✅') ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-rose-50 border border-rose-200 text-rose-700'
            }`}>
              {withdrawMsg}
            </div>
          )}

          <form onSubmit={handleWithdrawSubmit} className="space-y-4">
            
            {/* USDT Network Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">
                Select USDT Network <span className="text-rose-500">* (USDT Only)</span>
              </label>
              <select
                value={withdrawNetwork}
                onChange={(e) => setWithdrawNetwork(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-xs font-bold focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="TRC-20">USDT (TRC-20 Network - Recommended Fast)</option>
                <option value="BEP-20">USDT (BNB Smart Chain BEP-20)</option>
                <option value="ERC-20">USDT (Ethereum ERC-20)</option>
              </select>
            </div>

            {/* Withdrawal Amount */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5 flex justify-between">
                <span>Withdrawal Amount ($) <span className="text-rose-500">* (Required)</span></span>
                <span className="text-slate-400 font-normal">Available: ${walletBal.toFixed(2)}</span>
              </label>
              <input
                type="number"
                min="10"
                step="0.01"
                required
                placeholder="e.g. 100"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-mono text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* USDT Address */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-slate-600">
                  Your USDT Receiving Address <span className="text-rose-500">* (Required)</span>
                </label>
                {user?.saved_usdt_address && (
                  <button
                    type="button"
                    onClick={() => {
                      setWithdrawAddress(user.saved_usdt_address);
                      setWithdrawNetwork(user.saved_usdt_network || 'TRC-20');
                    }}
                    className="text-[11px] text-blue-600 font-bold hover:underline"
                  >
                    Paste Saved Default
                  </button>
                )}
              </div>
              <input
                type="text"
                required
                placeholder="Paste your USDT wallet address"
                value={withdrawAddress}
                onChange={(e) => setWithdrawAddress(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-mono text-xs focus:outline-none focus:border-blue-500"
              />
              
              <label className="flex items-center gap-2 mt-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={saveAsDefault}
                  onChange={(e) => setSaveAsDefault(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs text-slate-500">Save this USDT address as default for future withdrawals</span>
              </label>
            </div>

            {/* Dedicated Withdrawal Password */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-slate-600 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Withdrawal Security Password / PIN <span className="text-rose-500">*</span></span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowSetPasswordModal(true)}
                  className="text-[11px] text-blue-600 font-bold hover:underline"
                >
                  Change PIN
                </button>
              </div>
              
              <div className="relative">
                <input
                  type={showWithdrawPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter your withdrawal security password"
                  value={withdrawPassword}
                  onChange={(e) => setWithdrawPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-11 py-3 text-slate-900 font-mono text-xs focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowWithdrawPassword(!showWithdrawPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showWithdrawPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Fee Breakdown (10% Tax) */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Requested Amount</span>
                <span className="font-mono font-bold text-slate-900">${withdrawAmount ? Number(withdrawAmount).toFixed(2) : '0.00'}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Withdrawal Tax & Network Fee (10%)</span>
                <span className="font-mono text-slate-600">-${withdrawFee}</span>
              </div>
              <div className="flex justify-between font-black text-slate-900 border-t border-slate-200 pt-1.5">
                <span>Net USDT Transferred</span>
                <span className="font-mono text-emerald-600 text-sm">${withdrawNet} USDT</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={withdrawLoading || walletBal < Number(withdrawAmount) || !withdrawAmount}
              className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {withdrawLoading ? 'Authorizing Withdrawal...' : 'Confirm USDT Withdrawal'}
            </button>
          </form>
        </div>
      )}

      {/* 3. HISTORY LEDGER TAB */}
      {tab === 'history' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <History className="w-5 h-5 text-blue-600" />
              <span>Wallet Transactions Ledger</span>
            </h2>
            <span className="text-xs text-slate-400 font-medium">
              Total Records: {transactions.length}
            </span>
          </div>

          {txLoading ? (
            <div className="text-center py-8 text-slate-400">Loading ledger records...</div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <WalletIcon className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-xs font-semibold">No wallet transaction records yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Details</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.map((tx) => {
                    const isCredit = Number(tx.amount) > 0;
                    return (
                      <tr key={tx._id || tx.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                            tx.type?.includes('DEPOSIT') || tx.type?.includes('WIN')
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {tx.type}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-700 font-medium">{tx.description}</td>
                        <td className="py-3 px-4 font-mono font-extrabold">
                          <span className={isCredit ? 'text-emerald-600' : 'text-slate-900'}>
                            {isCredit ? `+$${Number(tx.amount).toFixed(2)}` : `-$${Math.abs(Number(tx.amount)).toFixed(2)}`}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                            tx.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                          }`}>
                            {tx.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-slate-400 text-xs">
                          {new Date(tx.created_at || tx.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL: Set / Update Dedicated Withdrawal Security Password */}
      {showSetPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-2xl max-w-md w-full space-y-4">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-slate-900">Set Withdrawal Security Password</h3>
              <p className="text-xs text-slate-500">
                This password/PIN will be required exclusively when making crypto withdrawals.
              </p>
            </div>

            {setPasswordMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-600 text-center">
                {setPasswordMsg}
              </div>
            )}

            <form onSubmit={handleSetWithdrawalPasswordSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">New Withdrawal Password / PIN (Min 4 chars)</label>
                <input
                  type="password"
                  required
                  placeholder="••••••"
                  value={newWithdrawalPin}
                  onChange={(e) => setNewWithdrawalPin(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-mono text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Confirm Withdrawal Password / PIN</label>
                <input
                  type="password"
                  required
                  placeholder="••••••"
                  value={confirmWithdrawalPin}
                  onChange={(e) => setConfirmWithdrawalPin(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-mono text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSetPasswordModal(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={setPasswordLoading}
                  className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-xs cursor-pointer"
                >
                  {setPasswordLoading ? 'Saving PIN...' : 'Save Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
