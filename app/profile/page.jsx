'use client';

import React, { useState, useEffect } from 'react';
import { 
  User, 
  ShieldCheck, 
  Lock, 
  Phone, 
  Mail, 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  Key, 
  FileCheck,
  BookmarkCheck,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth, API_BASE } from '@/app/context/AuthContext';

export default function ProfilePage() {
  const { user, token, fetchProfile } = useAuth();

  // Profile Edit
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [profileMsg, setProfileMsg] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  // Saved USDT Address Edit
  const [savedUsdtAddress, setSavedUsdtAddress] = useState(user?.saved_usdt_address || '');
  const [savedUsdtNetwork, setSavedUsdtNetwork] = useState(user?.saved_usdt_network || 'TRC-20');
  const [usdtMsg, setUsdtMsg] = useState('');
  const [usdtLoading, setUsdtLoading] = useState(false);

  // Dedicated Withdrawal Password Change
  const [newWithdrawalPin, setNewWithdrawalPin] = useState('');
  const [confirmWithdrawalPin, setConfirmWithdrawalPin] = useState('');
  const [pinMsg, setPinMsg] = useState('');
  const [pinLoading, setPinLoading] = useState(false);

  // Login Password Change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdMsg, setPwdMsg] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);

  // KYC Upload
  const [kycFile, setKycFile] = useState(null);
  const [kycLoading, setKycLoading] = useState(false);
  const [kycMsg, setKycMsg] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setSavedUsdtAddress(user.saved_usdt_address || '');
      setSavedUsdtNetwork(user.saved_usdt_network || 'TRC-20');
    }
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setProfileLoading(true);
      setProfileMsg('');
      const res = await fetch(`${API_BASE}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name, phone })
      });
      const data = await res.json();
      if (data.success) {
        setProfileMsg('✅ Profile details updated successfully!');
        fetchProfile();
      } else {
        setProfileMsg('❌ ' + data.message);
      }
    } catch (err) {
      setProfileMsg('❌ Failed to update profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleSaveUsdtAddress = async (e) => {
    e.preventDefault();
    try {
      setUsdtLoading(true);
      setUsdtMsg('');
      const res = await fetch(`${API_BASE}/api/auth/save-usdt-address`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ address: savedUsdtAddress, network: savedUsdtNetwork })
      });
      const data = await res.json();
      if (data.success) {
        setUsdtMsg('✅ Default USDT withdrawal address saved!');
        fetchProfile();
      } else {
        setUsdtMsg('❌ ' + data.message);
      }
    } catch (err) {
      setUsdtMsg('❌ Failed to save address.');
    } finally {
      setUsdtLoading(false);
    }
  };

  const handleUpdateWithdrawalPin = async (e) => {
    e.preventDefault();
    if (newWithdrawalPin.length < 4) {
      setPinMsg('❌ Withdrawal PIN must be at least 4 characters/digits.');
      return;
    }
    if (newWithdrawalPin !== confirmWithdrawalPin) {
      setPinMsg('❌ Withdrawal PINs do not match.');
      return;
    }

    try {
      setPinLoading(true);
      setPinMsg('');
      const res = await fetch(`${API_BASE}/api/auth/set-withdrawal-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ withdrawalPassword: newWithdrawalPin.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setPinMsg('✅ Dedicated Withdrawal Security Password updated successfully!');
        setNewWithdrawalPin('');
        setConfirmWithdrawalPin('');
        fetchProfile();
      } else {
        setPinMsg('❌ ' + data.message);
      }
    } catch (err) {
      setPinMsg('❌ Failed to update withdrawal PIN.');
    } finally {
      setPinLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPwdMsg('❌ New passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setPwdMsg('❌ Password must be at least 6 characters.');
      return;
    }

    try {
      setPwdLoading(true);
      setPwdMsg('');
      const res = await fetch(`${API_BASE}/api/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();
      if (data.success) {
        setPwdMsg('✅ Login password updated successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPwdMsg('❌ ' + data.message);
      }
    } catch (err) {
      setPwdMsg('❌ Failed to change password.');
    } finally {
      setPwdLoading(false);
    }
  };

  const handleKycUpload = async (e) => {
    e.preventDefault();
    if (!kycFile) return alert('Please choose an identity document file');

    try {
      setKycLoading(true);
      setKycMsg('');
      const formData = new FormData();
      formData.append('document', kycFile);

      const res = await fetch(`${API_BASE}/api/auth/kyc`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setKycMsg('✅ ' + data.message);
        fetchProfile();
      } else {
        setKycMsg('❌ ' + data.message);
      }
    } catch (err) {
      setKycMsg('❌ Failed to submit KYC document.');
    } finally {
      setKycLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Account Profile & Security
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Manage your trader credentials, saved USDT addresses, and dedicated withdrawal password.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Profile Form */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center font-black text-white text-lg shadow-sm">
                {user?.name ? user.name[0].toUpperCase() : 'U'}
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">{user?.name}</h3>
                <p className="text-xs text-slate-400 font-mono">{user?.email}</p>
              </div>
            </div>

            {profileMsg && (
              <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-xs font-bold text-blue-700">
                {profileMsg}
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Full Legal Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+92 300 1234567"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="text-slate-400 font-medium">Your Referral Code</p>
                  <p className="font-mono font-bold text-blue-600 text-sm mt-0.5">{user?.referral_code}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="text-slate-400 font-medium">Sponsor Code</p>
                  <p className="font-mono font-bold text-slate-700 text-sm mt-0.5">{user?.referred_by || 'Direct'}</p>
                </div>
              </div>

              <button
                type="submit"
                disabled={profileLoading}
                className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-sm transition-colors cursor-pointer"
              >
                {profileLoading ? 'Saving...' : 'Save Profile Details'}
              </button>
            </form>
          </div>

          {/* Saved USDT Withdrawal Address Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <BookmarkCheck className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Default Saved USDT Address</h3>
                <p className="text-xs text-slate-500">Auto-fills when requesting crypto payouts so you don't need to re-paste.</p>
              </div>
            </div>

            {usdtMsg && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-700">
                {usdtMsg}
              </div>
            )}

            <form onSubmit={handleSaveUsdtAddress} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Network</label>
                  <select
                    value={savedUsdtNetwork}
                    onChange={(e) => setSavedUsdtNetwork(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-slate-900 text-xs font-bold focus:outline-none"
                  >
                    <option value="TRC-20">TRC-20 (USDT)</option>
                    <option value="BEP-20">BEP-20 (USDT)</option>
                    <option value="ERC-20">ERC-20 (USDT)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">USDT Wallet Address</label>
                  <input
                    type="text"
                    required
                    placeholder="Paste your USDT wallet address"
                    value={savedUsdtAddress}
                    onChange={(e) => setSavedUsdtAddress(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-mono text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={usdtLoading}
                className="w-full py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs shadow-2xs transition-colors cursor-pointer"
              >
                {usdtLoading ? 'Saving Address...' : 'Save Default USDT Address'}
              </button>
            </form>
          </div>

          {/* KYC Section */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-extrabold text-slate-900">Identity Verification (KYC)</h3>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                user?.kyc_status === 'VERIFIED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                user?.kyc_status === 'PENDING' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                'bg-slate-100 text-slate-600'
              }`}>
                {user?.kyc_status || 'UNVERIFIED'}
              </span>
            </div>

            <p className="text-xs text-slate-500">
              Submit your CNIC, Passport, or Driving License to unlock verified status.
            </p>

            {kycMsg && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-700">
                {kycMsg}
              </div>
            )}

            {user?.kyc_status !== 'VERIFIED' && (
              <form onSubmit={handleKycUpload} className="space-y-4 pt-2">
                <div className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-2xl p-5 text-center bg-slate-50 relative">
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => setKycFile(e.target.files[0])}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <FileCheck className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                  <p className="text-xs font-bold text-slate-700">
                    {kycFile ? kycFile.name : 'Upload National ID / Passport / License'}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">JPG, PNG, PDF (Max 5MB)</p>
                </div>

                <button
                  type="submit"
                  disabled={kycLoading || !kycFile}
                  className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {kycLoading ? 'Uploading Documents...' : 'Submit Documents For Verification'}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Right Column: Security Passwords (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Dedicated Withdrawal Password Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Lock className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Withdrawal Security Password</h3>
                <p className="text-[11px] text-slate-400">Required exclusively to authorize crypto withdrawals.</p>
              </div>
            </div>

            {pinMsg && (
              <div className={`p-3.5 rounded-2xl text-xs font-bold ${
                pinMsg.includes('✅') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}>
                {pinMsg}
              </div>
            )}

            <form onSubmit={handleUpdateWithdrawalPin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">New Withdrawal PIN / Password (Min 4 chars)</label>
                <input
                  type="password"
                  required
                  placeholder="••••••"
                  value={newWithdrawalPin}
                  onChange={(e) => setNewWithdrawalPin(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Confirm Withdrawal PIN</label>
                <input
                  type="password"
                  required
                  placeholder="••••••"
                  value={confirmWithdrawalPin}
                  onChange={(e) => setConfirmWithdrawalPin(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={pinLoading}
                className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-sm cursor-pointer disabled:opacity-50"
              >
                {pinLoading ? 'Saving PIN...' : 'Save Withdrawal PIN'}
              </button>
            </form>
          </div>

          {/* Login Password Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Key className="w-5 h-5 text-blue-600" />
              <h3 className="text-base font-extrabold text-slate-900">Change Account Login Password</h3>
            </div>

            {pwdMsg && (
              <div className={`p-3.5 rounded-2xl text-xs font-bold ${
                pwdMsg.includes('✅') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}>
                {pwdMsg}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Current Login Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">New Login Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="Min 6 characters"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Confirm New Login Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Re-enter new password"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={pwdLoading}
                className="w-full py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs shadow-2xs cursor-pointer disabled:opacity-50"
              >
                {pwdLoading ? 'Updating Login Password...' : 'Update Login Password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
