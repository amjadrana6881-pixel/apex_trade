'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  Wallet, 
  BarChart2, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Settings, 
  TrendingUp, 
  Sparkles, 
  Bell, 
  ShieldCheck, 
  Search, 
  Check, 
  X, 
  Trash2, 
  RefreshCw, 
  Eye, 
  Sliders, 
  DollarSign, 
  Radio, 
  Clock, 
  Layers, 
  FileText, 
  UserCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Edit3, 
  Key, 
  Lock, 
  Headphones, 
  Send, 
  Edit2, 
  BookmarkCheck,
  Menu,
  LogOut,
  ChevronRight,
  Zap,
  Smartphone,
  Download,
  Save
} from 'lucide-react';
import { useAuth, API_BASE } from '@/app/context/AuthContext';

export default function AdminDashboardPage() {
  const { token, user, logout } = useAuth();
  const router = useRouter();

  const [tab, setTab] = useState('overview');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Stats
  const [stats, setStats] = useState({});

  // Users & Master Editor
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [inspectedUser, setInspectedUser] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [editUserLoading, setEditUserLoading] = useState(false);
  const [editUserMessage, setEditUserMessage] = useState('');
  const [balanceModalUser, setBalanceModalUser] = useState(null);
  const [balanceAdjustment, setBalanceAdjustment] = useState('');
  const [balanceActionType, setBalanceActionType] = useState('ADD'); // 'ADD' or 'SUBTRACT'
  const [balanceReason, setBalanceReason] = useState('');

  // Daily Signals & Signal Editor
  const [signals, setSignals] = useState([]);
  const [editingSignal, setEditingSignal] = useState(null);
  const [editSignalLoading, setEditSignalLoading] = useState(false);
  const [newSignal, setNewSignal] = useState({
    title: `${new Date().toLocaleDateString('en-GB')}, Day Trading Signal`,
    instrument: 'BTCUSDT',
    order_type: 'BUY',
    min_capital: 10,
    execution_time_pst: '07:00 PM (PST)',
    duration_seconds: 180,
    profit_percentage: 5.00,
    outcome: 'WIN',
    status: 'ACTIVE',
    disclaimer: 'Disclaimer: Forex and CFD trading involve risk. Follow official signal parameters. Unscheduled trades are subject to 100% loss.'
  });

  // Trades
  const [trades, setTrades] = useState([]);

  // Deposits & Withdrawals (CRYPTO ONLY)
  const [deposits, setDeposits] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [receiptModalUrl, setReceiptModalUrl] = useState('');

  // Deposit Wallets (CRYPTO ONLY)
  const [wallets, setWallets] = useState([]);
  const [newWallet, setNewWallet] = useState({ 
    network: 'TRC-20', 
    address: '', 
    network_name: 'USDT (TRC-20 Network)', 
    instructions: 'Send USDT TRC-20.' 
  });

  // Packages
  const [packages, setPackages] = useState([]);
  const [newPackage, setNewPackage] = useState({
    name: 'Standard Growth Tier',
    min_amount: 100,
    max_amount: 5000,
    daily_roi: 2.5,
    duration_days: 30,
    total_return_roi: 75,
    tag: 'Popular',
    description: 'Algorithmic yield generation portfolio.'
  });

  // Announcements & KYC & Settings
  const [announcements, setAnnouncements] = useState([]);
  const [newAnn, setNewAnn] = useState({ title: '', content: '', category: 'General' });
  const [kycUsers, setKycUsers] = useState([]);
  const [settings, setSettings] = useState({});
  const [settingsForm, setSettingsForm] = useState({
    platform_name: 'ApexTrade PRO',
    min_deposit: '10',
    min_withdrawal: '20',
    withdrawal_fee_percent: '10',
    referral_tier1_percent: '10',
    referral_tier2_percent: '5',
    referral_tier3_percent: '2',
    support_telegram: 'https://t.me/apextrade_official',
    support_email: 'support@apextrade.com',
    trading_window_pst: '07:00 PM (PST)',
    maintenance_mode: 'false'
  });
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState('');

  // Live Support Chat Desk State
  const [supportConversations, setSupportConversations] = useState([]);
  const [activeChatUserId, setActiveChatUserId] = useState(null);
  const [activeChatMessages, setActiveChatMessages] = useState([]);
  const [adminChatInput, setAdminChatInput] = useState('');
  const [adminSending, setAdminSending] = useState(false);
  const adminChatEndRef = useRef(null);

  const getAdminToken = () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('apextrade_admin_token') || (user?.role === 'admin' ? token : null);
  };

  useEffect(() => {
    const admTok = getAdminToken();
    if (admTok) {
      fetchAllData();
    }
  }, [token, user]);

  // Periodic Polling for Live Chat, Stats, Deposits, & Withdrawals
  useEffect(() => {
    const interval = setInterval(() => {
      const admTok = getAdminToken();
      if (admTok) {
        fetchSupportConversations();
        fetchStats();
        fetchDeposits();
        fetchWithdrawals();
        fetchKyc();
        if (activeChatUserId && tab === 'support') {
          fetchConversationMessages(activeChatUserId);
        }
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [activeChatUserId, tab]);

  const fetchAllData = () => {
    fetchStats();
    fetchUsers();
    fetchSignals();
    fetchTrades();
    fetchDeposits();
    fetchWithdrawals();
    fetchWallets();
    fetchPackages();
    fetchAnnouncements();
    fetchKyc();
    fetchSettings();
    fetchSupportConversations();
  };

  const fetchStats = async () => {
    try {
      const admTok = getAdminToken();
      if (!admTok) return;
      const res = await fetch(`${API_BASE}/api/admin/stats`, { headers: { Authorization: `Bearer ${admTok}` } });
      const data = await res.json();
      if (data.success) setStats(data.data || {});
    } catch (e) { console.error(e); }
  };

  const fetchUsers = async () => {
    try {
      const admTok = getAdminToken();
      if (!admTok) return;
      const res = await fetch(`${API_BASE}/api/admin/users`, { headers: { Authorization: `Bearer ${admTok}` } });
      const data = await res.json();
      if (data.success) setUsers(data.data || []);
    } catch (e) { console.error(e); }
  };

  const fetchSignals = async () => {
    try {
      const admTok = getAdminToken();
      if (!admTok) return;
      const res = await fetch(`${API_BASE}/api/signals/admin/list`, { headers: { Authorization: `Bearer ${admTok}` } });
      const data = await res.json();
      if (data.success) setSignals(data.data || []);
    } catch (e) { console.error(e); }
  };

  const fetchTrades = async () => {
    try {
      const admTok = getAdminToken();
      if (!admTok) return;
      const res = await fetch(`${API_BASE}/api/admin/trades`, { headers: { Authorization: `Bearer ${admTok}` } });
      const data = await res.json();
      if (data.success) setTrades(data.data || []);
    } catch (e) { console.error(e); }
  };

  const fetchDeposits = async () => {
    try {
      const admTok = getAdminToken();
      if (!admTok) return;
      const res = await fetch(`${API_BASE}/api/admin/deposits`, { headers: { Authorization: `Bearer ${admTok}` } });
      const data = await res.json();
      if (data.success) setDeposits(data.data || []);
    } catch (e) { console.error(e); }
  };

  const fetchWithdrawals = async () => {
    try {
      const admTok = getAdminToken();
      if (!admTok) return;
      const res = await fetch(`${API_BASE}/api/admin/withdrawals`, { headers: { Authorization: `Bearer ${admTok}` } });
      const data = await res.json();
      if (data.success) setWithdrawals(data.data || []);
    } catch (e) { console.error(e); }
  };

  const fetchWallets = async () => {
    try {
      const admTok = getAdminToken();
      if (!admTok) return;
      const res = await fetch(`${API_BASE}/api/admin/wallets`, { headers: { Authorization: `Bearer ${admTok}` } });
      const data = await res.json();
      if (data.success) setWallets(data.data || []);
    } catch (e) { console.error(e); }
  };

  const fetchPackages = async () => {
    try {
      const admTok = getAdminToken();
      if (!admTok) return;
      const res = await fetch(`${API_BASE}/api/admin/packages`, { headers: { Authorization: `Bearer ${admTok}` } });
      const data = await res.json();
      if (data.success) setPackages(data.data || []);
    } catch (e) { console.error(e); }
  };

  const fetchAnnouncements = async () => {
    try {
      const admTok = getAdminToken();
      if (!admTok) return;
      const res = await fetch(`${API_BASE}/api/admin/announcements`, { headers: { Authorization: `Bearer ${admTok}` } });
      const data = await res.json();
      if (data.success) setAnnouncements(data.data || []);
    } catch (e) { console.error(e); }
  };

  const fetchKyc = async () => {
    try {
      const admTok = getAdminToken();
      if (!admTok) return;
      const res = await fetch(`${API_BASE}/api/admin/kyc`, { headers: { Authorization: `Bearer ${admTok}` } });
      const data = await res.json();
      if (data.success) setKycUsers(data.data || []);
    } catch (e) { console.error(e); }
  };

  const fetchSettings = async () => {
    try {
      const admTok = getAdminToken();
      if (!admTok) return;
      const res = await fetch(`${API_BASE}/api/admin/settings`, { headers: { Authorization: `Bearer ${admTok}` } });
      const data = await res.json();
      if (data.success && data.data) {
        setSettings(data.data);
        setSettingsForm(prev => ({
          ...prev,
          ...data.data
        }));
      }
    } catch (e) { console.error(e); }
  };

  const handleUpdateSignal = async (e) => {
    e.preventDefault();
    if (!editingSignal) return;
    try {
      setEditSignalLoading(true);
      const id = editingSignal._id || editingSignal.id;
      const res = await fetch(`${API_BASE}/api/signals/admin/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAdminToken()}` },
        body: JSON.stringify(editingSignal)
      });
      const data = await res.json();
      if (data.success) {
        alert('Signal updated successfully!');
        setEditingSignal(null);
        fetchSignals();
      } else {
        alert(data.message || 'Failed to update signal');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setEditSignalLoading(false);
    }
  };

  const handleToggleSignalStatus = async (signal) => {
    try {
      const id = signal._id || signal.id;
      const newStatus = signal.status === 'ACTIVE' ? 'EXPIRED' : 'ACTIVE';
      const res = await fetch(`${API_BASE}/api/signals/admin/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAdminToken()}` },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        fetchSignals();
      } else {
        alert(data.message);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveEditUser = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      setEditUserLoading(true);
      setEditUserMessage('');
      const id = editingUser._id || editingUser.id;
      const res = await fetch(`${API_BASE}/api/admin/user/${id}/edit-all`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAdminToken()}` },
        body: JSON.stringify(editingUser)
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message || 'User profile updated!');
        setEditingUser(null);
        fetchUsers();
      } else {
        setEditUserMessage('❌ ' + (data.message || 'Update failed'));
      }
    } catch (err) {
      setEditUserMessage('❌ Failed to update user.');
    } finally {
      setEditUserLoading(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      setSettingsSaving(true);
      setSettingsMessage('');
      const res = await fetch(`${API_BASE}/api/admin/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAdminToken()}` },
        body: JSON.stringify(settingsForm)
      });
      const data = await res.json();
      if (data.success) {
        setSettingsMessage('✅ Platform Controls & Financial Parameters updated successfully in database!');
        fetchSettings();
      } else {
        setSettingsMessage('❌ ' + (data.message || 'Failed to save settings'));
      }
    } catch (err) {
      setSettingsMessage('❌ Error saving system settings');
    } finally {
      setSettingsSaving(false);
    }
  };

  const fetchSupportConversations = async () => {
    try {
      const admTok = getAdminToken();
      if (!admTok) return;
      const res = await fetch(`${API_BASE}/api/support/admin/conversations`, { headers: { Authorization: `Bearer ${admTok}` } });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setSupportConversations(data.data);
      }
    } catch (e) { console.error(e); }
  };

  const fetchConversationMessages = async (userId) => {
    try {
      setActiveChatUserId(userId);
      const admTok = getAdminToken();
      if (!admTok) return;
      const res = await fetch(`${API_BASE}/api/support/admin/conversation/${userId}`, {
        headers: { Authorization: `Bearer ${admTok}` }
      });
      const data = await res.json();
      if (data.success && data.data) {
        const msgList = Array.isArray(data.data.messages) 
          ? data.data.messages 
          : (Array.isArray(data.data) ? data.data : []);
        setActiveChatMessages(msgList);
      }
    } catch (e) { console.error(e); }
  };

  // Actions
  const handleDepositAction = async (id, action) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/deposit/${id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAdminToken()}` },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message || `Deposit ${action}`);
        fetchDeposits();
        fetchStats();
      } else {
        alert(data.message);
      }
    } catch (e) { console.error(e); }
  };

  const handleWithdrawalAction = async (id, action) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/withdrawal/${id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAdminToken()}` },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message || `Withdrawal ${action}`);
        fetchWithdrawals();
        fetchStats();
      } else {
        alert(data.message);
      }
    } catch (e) { console.error(e); }
  };

  const handleKycAction = async (id, action) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/kyc/${id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAdminToken()}` },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message || `KYC ${action}`);
        fetchKyc();
      } else {
        alert(data.message);
      }
    } catch (e) { console.error(e); }
  };

  const handleCreateSignal = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/signals/admin/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAdminToken()}` },
        body: JSON.stringify(newSignal)
      });
      const data = await res.json();
      if (data.success) {
        alert('Daily signal broadcasted successfully!');
        fetchSignals();
      } else {
        alert(data.message);
      }
    } catch (e) { console.error(e); }
  };

  const handleDeleteSignal = async (id) => {
    if (!confirm('Are you sure you want to delete this signal?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/signals/admin/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getAdminToken()}` }
      });
      const data = await res.json();
      if (data.success) {
        fetchSignals();
      }
    } catch (e) { console.error(e); }
  };

  const handleCreateWallet = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/admin/wallets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAdminToken()}` },
        body: JSON.stringify(newWallet)
      });
      const data = await res.json();
      if (data.success) {
        alert('Deposit address added!');
        setNewWallet({ network: 'TRC-20', address: '', network_name: 'USDT (TRC-20 Network)', instructions: 'Send USDT TRC-20.' });
        fetchWallets();
      } else {
        alert(data.message);
      }
    } catch (e) { console.error(e); }
  };

  const handleDeleteWallet = async (id) => {
    if (!confirm('Delete this deposit wallet?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/wallets/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getAdminToken()}` }
      });
      const data = await res.json();
      if (data.success) fetchWallets();
    } catch (e) { console.error(e); }
  };

  const handleAdjustBalance = async (e) => {
    e.preventDefault();
    if (!balanceModalUser) return;
    const amt = Number(balanceAdjustment);
    if (!amt || amt <= 0) return alert('Enter valid amount');

    try {
      const finalAmount = balanceActionType === 'ADD' ? amt : -amt;
      const res = await fetch(`${API_BASE}/api/admin/user/${balanceModalUser._id || balanceModalUser.id}/balance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAdminToken()}` },
        body: JSON.stringify({ amount: finalAmount, reason: balanceReason || 'Admin Manual Adjustment' })
      });
      const data = await res.json();
      if (data.success) {
        alert('User balance updated!');
        setBalanceModalUser(null);
        setBalanceAdjustment('');
        setBalanceReason('');
        fetchUsers();
      } else {
        alert(data.message);
      }
    } catch (e) { console.error(e); }
  };

  const handleUpdateUserTradeMode = async (userId, tradeMode) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/user/${userId}/trade-mode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAdminToken()}` },
        body: JSON.stringify({ tradeMode })
      });
      const data = await res.json();
      if (data.success) {
        fetchUsers();
      }
    } catch (e) { console.error(e); }
  };

  const handleUpdateUserStatus = async (userId, status) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/user/${userId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAdminToken()}` },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (data.success) {
        fetchUsers();
      }
    } catch (e) { console.error(e); }
  };

  const handleAdminSendMessage = async (e) => {
    e.preventDefault();
    if (!activeChatUserId || !adminChatInput.trim() || adminSending) return;

    try {
      setAdminSending(true);
      const text = adminChatInput.trim();
      setAdminChatInput('');

      const res = await fetch(`${API_BASE}/api/support/admin/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAdminToken()}` },
        body: JSON.stringify({ userId: activeChatUserId, message: text })
      });

      const data = await res.json();
      if (data.success && data.data) {
        setActiveChatMessages(prev => [...prev, data.data]);
        fetchSupportConversations();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAdminSending(false);
    }
  };

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/admin/announcements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAdminToken()}` },
        body: JSON.stringify(newAnn)
      });
      const data = await res.json();
      if (data.success) {
        alert('Announcement broadcasted!');
        setNewAnn({ title: '', content: '', category: 'General' });
        fetchAnnouncements();
      }
    } catch (e) { console.error(e); }
  };

  const handleDeleteAnnouncement = async (id) => {
    if (!confirm('Delete announcement?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/announcements/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getAdminToken()}` }
      });
      const data = await res.json();
      if (data.success) fetchAnnouncements();
    } catch (e) { console.error(e); }
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(userSearch.toLowerCase()) || 
    u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.referral_code?.toLowerCase().includes(userSearch.toLowerCase())
  );

  const navItems = [
    { id: 'overview', label: 'Master Overview', icon: BarChart2 },
    { id: 'users', label: 'User Directory & Balances', icon: Users },
    { id: 'signals', label: 'Daily Signals Hub', icon: Radio },
    { id: 'trades', label: 'Option Trades', icon: TrendingUp },
    { id: 'deposits', label: 'Crypto Deposits', icon: ArrowDownLeft, badge: deposits.filter(d => d.status === 'PENDING').length },
    { id: 'withdrawals', label: 'Crypto Withdrawals', icon: ArrowUpRight, badge: withdrawals.filter(w => w.status === 'PENDING').length },
    { id: 'wallets', label: 'Depository Wallets', icon: Wallet },
    { id: 'packages', label: 'Yield Staking Plans', icon: Layers },
    { id: 'announcements', label: 'System News & Alerts', icon: Bell },
    { id: 'kyc', label: 'KYC Document Verification', icon: UserCheck, badge: kycUsers.length },
    { id: 'support', label: 'Live Chat Center', icon: Headphones, badge: supportConversations.reduce((acc, c) => acc + (c.unread_count || 0), 0) },
    { id: 'settings', label: 'Platform Controls', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      
      {/* Sidebar (Desktop & Mobile Drawer) */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 border-r border-slate-800 flex flex-col justify-between transition-transform duration-200 md:static md:translate-x-0 ${
        mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-5 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center font-black text-white text-lg shadow-md shadow-blue-500/20">
                A
              </div>
              <div>
                <span className="font-black text-base text-white tracking-tight flex items-center gap-1.5">
                  ApexTrade <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-red-500/20 text-red-400 border border-red-500/30">MASTER</span>
                </span>
                <p className="text-[10px] text-slate-400 font-mono">Super Admin Console</p>
              </div>
            </div>
            <button 
              onClick={() => setMobileSidebarOpen(false)}
              className="md:hidden p-1.5 rounded-xl bg-slate-800 text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = tab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setTab(item.id);
                    setMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-5 border-t border-slate-800 space-y-3">
          {/* Admin APK Download Card */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center gap-2 text-rose-400">
              <Smartphone className="w-4 h-4" />
              <span className="font-extrabold text-xs text-white">Admin Android APK</span>
            </div>
            <p className="text-[10px] text-slate-400">Lock-screen alerts for all deposits, withdrawals & support chat.</p>
            <a
              href="/downloads/ApexTrade_Admin.apk"
              download="ApexTrade_Admin.apk"
              className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-extrabold text-[11px] flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Admin APK</span>
            </a>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">
              SA
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">{user?.name || 'Super Master Admin'}</p>
              <p className="text-[10px] text-slate-400 font-mono truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={() => {
              logout();
              router.push('/admin-secure-auth');
            }}
            className="w-full py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-extrabold flex items-center justify-center gap-2 border border-rose-500/20 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out Master</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-950 min-h-screen">
        
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl bg-slate-800 text-slate-300"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-base sm:text-lg font-black text-white tracking-tight capitalize">
              {navItems.find(i => i.id === tab)?.label || 'Master Console'}
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href="/downloads/ApexTrade_Admin.apk"
              download="ApexTrade_Admin.apk"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-xs shadow-md shadow-red-600/20 transition-all cursor-pointer"
              title="Download Master Admin Android App"
            >
              <Download className="w-3.5 h-3.5 text-white" />
              <span className="hidden sm:inline">Download Admin APK</span>
              <span className="sm:hidden">Admin App</span>
            </a>
            <button
              onClick={fetchAllData}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
            >
              Trader View →
            </button>
          </div>
        </header>

        {/* Dynamic Admin Body */}
        <div className="p-4 sm:p-8 space-y-6">
          
          {/* TAB 1: OVERVIEW */}
          {tab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-2">
                  <div className="flex justify-between items-center text-slate-400">
                    <span className="text-xs font-bold uppercase">Total Users</span>
                    <Users className="w-5 h-5 text-blue-400" />
                  </div>
                  <p className="text-3xl font-black font-mono text-white">{stats.totalUsers || users.length || 0}</p>
                  <p className="text-[11px] text-slate-500">Registered platform traders</p>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-2">
                  <div className="flex justify-between items-center text-slate-400">
                    <span className="text-xs font-bold uppercase">Total Approved Deposits</span>
                    <ArrowDownLeft className="w-5 h-5 text-emerald-400" />
                  </div>
                  <p className="text-3xl font-black font-mono text-emerald-400">${Number(stats.totalDeposits || 0).toFixed(2)}</p>
                  <p className="text-[11px] text-emerald-500">{deposits.filter(d => d.status === 'APPROVED').length} Approved Transactions</p>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-2">
                  <div className="flex justify-between items-center text-slate-400">
                    <span className="text-xs font-bold uppercase">Total Withdrawals</span>
                    <ArrowUpRight className="w-5 h-5 text-purple-400" />
                  </div>
                  <p className="text-3xl font-black font-mono text-purple-400">${Number(stats.totalWithdrawals || 0).toFixed(2)}</p>
                  <p className="text-[11px] text-purple-500">{withdrawals.filter(w => w.status === 'APPROVED').length} Paid Out</p>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-2">
                  <div className="flex justify-between items-center text-slate-400">
                    <span className="text-xs font-bold uppercase">Net Platform Profit</span>
                    <TrendingUp className="w-5 h-5 text-amber-400" />
                  </div>
                  <p className="text-3xl font-black font-mono text-amber-400">
                    ${Number((stats.totalDeposits || 0) - (stats.totalWithdrawals || 0)).toFixed(2)}
                  </p>
                  <p className="text-[11px] text-slate-500">Gross Treasury Reserve</p>
                </div>
              </div>

              {/* Quick Actions & Recent Option Contracts */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
                  <h3 className="text-base font-extrabold text-white">Pending Action Alerts</h3>
                  <div className="space-y-2.5">
                    <div 
                      onClick={() => setTab('deposits')}
                      className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between cursor-pointer hover:bg-slate-800"
                    >
                      <div className="flex items-center gap-3">
                        <ArrowDownLeft className="w-5 h-5 text-emerald-400" />
                        <div>
                          <p className="text-xs font-bold text-white">Pending Crypto Deposits</p>
                          <p className="text-[11px] text-slate-400">Blockchain deposits awaiting verification</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300">
                        {deposits.filter(d => d.status === 'PENDING').length} Pending
                      </span>
                    </div>

                    <div 
                      onClick={() => setTab('withdrawals')}
                      className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between cursor-pointer hover:bg-slate-800"
                    >
                      <div className="flex items-center gap-3">
                        <ArrowUpRight className="w-5 h-5 text-rose-400" />
                        <div>
                          <p className="text-xs font-bold text-white">Pending Crypto Withdrawals</p>
                          <p className="text-[11px] text-slate-400">USDT payouts awaiting approval</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-black bg-rose-500/20 text-rose-300">
                        {withdrawals.filter(w => w.status === 'PENDING').length} Pending
                      </span>
                    </div>

                    <div 
                      onClick={() => setTab('kyc')}
                      className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between cursor-pointer hover:bg-slate-800"
                    >
                      <div className="flex items-center gap-3">
                        <UserCheck className="w-5 h-5 text-blue-400" />
                        <div>
                          <p className="text-xs font-bold text-white">KYC Verification Submissions</p>
                          <p className="text-[11px] text-slate-400">ID documents awaiting compliance review</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-500/20 text-blue-300">
                        {kycUsers.length} Submissions
                      </span>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
                  <h3 className="text-base font-extrabold text-white">Recent Realtime Trades</h3>
                  <div className="space-y-2">
                    {trades.slice(0, 5).map((t) => (
                      <div key={t._id || t.id} className="p-3 bg-slate-800/40 rounded-xl flex items-center justify-between text-xs">
                        <div>
                          <span className="font-extrabold text-white">{t.pair}</span>
                          <span className={`ml-2 px-1.5 py-0.2 rounded text-[9px] font-black ${
                            t.type === 'BUY' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                          }`}>
                            {t.type}
                          </span>
                        </div>
                        <div className="text-right font-mono font-bold">
                          <span className={t.result === 'WIN' ? 'text-emerald-400' : 'text-rose-400'}>
                            {t.result === 'WIN' ? `+$${Number(t.profit).toFixed(2)}` : `-$${Number(t.amount).toFixed(2)}`}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: USERS */}
          {tab === 'users' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by name, email, referral code..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <span className="text-xs text-slate-400 font-bold">Total: {filteredUsers.length} Users</span>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                        <th className="py-3.5 px-4">User</th>
                        <th className="py-3.5 px-4">Balance</th>
                        <th className="py-3.5 px-4">Role</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4">Trade Mode</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredUsers.map((u) => (
                        <tr key={u._id || u.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3.5 px-4">
                            <p className="font-extrabold text-white">{u.name}</p>
                            <p className="text-[11px] text-slate-400 font-mono">{u.email}</p>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-black text-emerald-400">
                            ${Number(u.wallet_balance || 0).toFixed(2)}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                              u.role === 'admin' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-blue-500/20 text-blue-400'
                            }`}>
                              {u.role.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <select
                              value={u.status || 'ACTIVE'}
                              onChange={(e) => handleUpdateUserStatus(u._id || u.id, e.target.value)}
                              className="bg-slate-800 border border-slate-700 text-xs rounded-xl px-2 py-1 text-slate-300 font-bold cursor-pointer"
                            >
                              <option value="ACTIVE">ACTIVE</option>
                              <option value="SUSPENDED">SUSPENDED</option>
                              <option value="BANNED">BANNED</option>
                            </select>
                          </td>
                          <td className="py-3.5 px-4">
                            <select
                              value={u.trade_mode || 'OFFICIAL_SIGNAL_PROTECTION'}
                              onChange={(e) => handleUpdateUserTradeMode(u._id || u.id, e.target.value)}
                              className="bg-slate-800 border border-slate-700 text-xs rounded-xl px-2 py-1 text-slate-300 font-bold cursor-pointer"
                            >
                              <option value="OFFICIAL_SIGNAL_PROTECTION">Protected Signal Only</option>
                              <option value="FORCE_WIN">Force 100% Wins</option>
                              <option value="FORCE_LOSS">Force 100% Losses</option>
                              <option value="DEFAULT_MARKET">Pure Market Live</option>
                            </select>
                          </td>
                          <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                            <button
                              onClick={() => {
                                setBalanceModalUser(u);
                                setBalanceAdjustment('');
                                setBalanceReason('');
                              }}
                              className="px-2.5 py-1 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30 cursor-pointer"
                            >
                              ± Balance
                            </button>
                            <button
                              onClick={() => {
                                setEditingUser({
                                  ...u,
                                  password: '',
                                  withdrawal_password: '',
                                  wallet_balance: u.wallet_balance || 0,
                                  investment_balance: u.investment_balance || 0,
                                  phone: u.phone || '',
                                  saved_usdt_address: u.saved_usdt_address || '',
                                  saved_usdt_network: u.saved_usdt_network || 'TRC-20',
                                  kyc_status: u.kyc_status || 'NOT_SUBMITTED',
                                  status: u.status || 'ACTIVE',
                                  trade_mode: u.trade_mode || 'OFFICIAL_SIGNAL_PROTECTION',
                                  custom_win_rate: u.custom_win_rate || 90
                                });
                                setEditUserMessage('');
                              }}
                              className="px-2.5 py-1 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-bold border border-amber-500/30 cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => setInspectedUser(u)}
                              className="px-2.5 py-1 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs font-bold border border-blue-500/30 cursor-pointer"
                            >
                              Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SIGNALS */}
          {tab === 'signals' && (
            <div className="space-y-6">
              {/* Broadcast Signal Form */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Radio className="w-5 h-5 text-blue-500 animate-pulse" />
                  <span>Broadcast New Official Daily Signal</span>
                </h3>

                <form onSubmit={handleCreateSignal} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Signal Title</label>
                    <input
                      type="text"
                      required
                      value={newSignal.title}
                      onChange={(e) => setNewSignal({ ...newSignal, title: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Instrument Pair</label>
                    <select
                      value={newSignal.instrument}
                      onChange={(e) => setNewSignal({ ...newSignal, instrument: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold"
                    >
                      <option value="BTCUSDT">BTCUSDT</option>
                      <option value="ETHUSDT">ETHUSDT</option>
                      <option value="SOLUSDT">SOLUSDT</option>
                      <option value="XAUUSD">XAUUSD (Gold)</option>
                      <option value="EURUSD">EURUSD</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Order Direction</label>
                    <select
                      value={newSignal.order_type}
                      onChange={(e) => setNewSignal({ ...newSignal, order_type: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold"
                    >
                      <option value="BUY">BUY / CALL</option>
                      <option value="SELL">SELL / PUT</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Execution Time (PST)</label>
                    <input
                      type="text"
                      required
                      value={newSignal.execution_time_pst}
                      onChange={(e) => setNewSignal({ ...newSignal, execution_time_pst: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Duration (Seconds)</label>
                    <input
                      type="number"
                      required
                      value={newSignal.duration_seconds}
                      onChange={(e) => setNewSignal({ ...newSignal, duration_seconds: Number(e.target.value) })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Profit Yield (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={newSignal.profit_percentage}
                      onChange={(e) => setNewSignal({ ...newSignal, profit_percentage: Number(e.target.value) })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Min Capital ($)</label>
                    <input
                      type="number"
                      required
                      value={newSignal.min_capital}
                      onChange={(e) => setNewSignal({ ...newSignal, min_capital: Number(e.target.value) })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs shadow-md shadow-blue-500/20 cursor-pointer"
                    >
                      Publish Signal Now
                    </button>
                  </div>
                </form>
              </div>

              {/* Signals History */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
                <h3 className="text-base font-extrabold text-white">Broadcast Signals Ledger</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                        <th className="py-3 px-3">Title</th>
                        <th className="py-3 px-3">Asset</th>
                        <th className="py-3 px-3">Type</th>
                        <th className="py-3 px-3">PST Time</th>
                        <th className="py-3 px-3">Duration</th>
                        <th className="py-3 px-3">Yield</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {signals.map((s) => (
                        <tr key={s._id || s.id} className="hover:bg-slate-800/40">
                          <td className="py-3 px-3 font-bold text-white">{s.title}</td>
                          <td className="py-3 px-3 font-mono text-blue-400">{s.instrument}</td>
                          <td className="py-3 px-3 font-extrabold">{s.order_type}</td>
                          <td className="py-3 px-3 text-slate-400">{s.execution_time_pst}</td>
                          <td className="py-3 px-3 font-mono">{s.duration_seconds}s</td>
                          <td className="py-3 px-3 font-mono text-emerald-400">+{s.profit_percentage}%</td>
                          <td className="py-3 px-3">
                            <button
                              onClick={() => handleToggleSignalStatus(s)}
                              className={`px-2 py-0.5 rounded text-[10px] font-black cursor-pointer transition-colors ${
                                s.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                              }`}
                              title="Click to toggle status"
                            >
                              {s.status} ⇄
                            </button>
                          </td>
                          <td className="py-3 px-3 text-right space-x-1.5 whitespace-nowrap">
                            <button
                              onClick={() => setEditingSignal({ ...s })}
                              className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 cursor-pointer"
                              title="Edit Signal"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteSignal(s._id || s.id)}
                              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 cursor-pointer"
                              title="Delete Signal"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: DEPOSITS */}
          {tab === 'deposits' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-extrabold text-white">Crypto Deposit Requests</h3>
                <span className="text-xs text-slate-400 font-bold">Total: {deposits.length} Records</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                      <th className="py-3 px-3">User</th>
                      <th className="py-3 px-3">Amount</th>
                      <th className="py-3 px-3">Network</th>
                      <th className="py-3 px-3">Blockchain TXID</th>
                      <th className="py-3 px-3">Proof</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {deposits.map((d) => (
                      <tr key={d._id || d.id} className="hover:bg-slate-800/40">
                        <td className="py-3 px-3 font-bold text-white">{d.user_name || d.user_id?.name || 'Trader'}</td>
                        <td className="py-3 px-3 font-mono font-black text-emerald-400">${Number(d.amount).toFixed(2)}</td>
                        <td className="py-3 px-3 font-bold text-blue-400">{d.network}</td>
                        <td className="py-3 px-3 font-mono text-[11px] text-slate-400 max-w-[150px] truncate">{d.txid}</td>
                        <td className="py-3 px-3">
                          {d.receipt_url ? (
                            <button
                              onClick={() => setReceiptModalUrl(d.receipt_url)}
                              className="px-2 py-1 rounded bg-blue-500/20 text-blue-400 text-[10px] font-bold"
                            >
                              View Image
                            </button>
                          ) : (
                            <span className="text-slate-600">No Image</span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                            d.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400' :
                            d.status === 'REJECTED' ? 'bg-rose-500/20 text-rose-400' :
                            'bg-amber-500/20 text-amber-400'
                          }`}>
                            {d.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right space-x-1.5">
                          {d.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => handleDepositAction(d._id || d.id, 'APPROVE')}
                                className="px-2.5 py-1 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 font-bold text-xs"
                              >
                                Approve (Distribute 3-Tier)
                              </button>
                              <button
                                onClick={() => handleDepositAction(d._id || d.id, 'REJECT')}
                                className="px-2.5 py-1 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 font-bold text-xs"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: WITHDRAWALS */}
          {tab === 'withdrawals' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-extrabold text-white">Crypto Withdrawal Requests (10% Tax Enforced)</h3>
                <span className="text-xs text-slate-400 font-bold">Total: {withdrawals.length} Records</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                      <th className="py-3 px-3">User</th>
                      <th className="py-3 px-3">Gross Amount</th>
                      <th className="py-3 px-3">Tax (10%)</th>
                      <th className="py-3 px-3">Net USDT</th>
                      <th className="py-3 px-3">USDT Address</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {withdrawals.map((w) => (
                      <tr key={w._id || w.id} className="hover:bg-slate-800/40">
                        <td className="py-3 px-3 font-bold text-white">{w.user_name || w.user_id?.name || 'Trader'}</td>
                        <td className="py-3 px-3 font-mono font-bold text-slate-300">${Number(w.amount).toFixed(2)}</td>
                        <td className="py-3 px-3 font-mono text-slate-500">-${Number(w.tax_amount || w.amount * 0.1).toFixed(2)}</td>
                        <td className="py-3 px-3 font-mono font-black text-emerald-400">
                          ${Number(w.net_amount || w.amount * 0.9).toFixed(2)} USDT
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px] text-blue-400 max-w-[170px] truncate">
                          {w.destination_address || w.wallet_address}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                            w.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400' :
                            w.status === 'REJECTED' ? 'bg-rose-500/20 text-rose-400' :
                            'bg-amber-500/20 text-amber-400'
                          }`}>
                            {w.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right space-x-1.5">
                          {w.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => handleWithdrawalAction(w._id || w.id, 'APPROVE')}
                                className="px-2.5 py-1 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 font-bold text-xs"
                              >
                                Approve Payout
                              </button>
                              <button
                                onClick={() => handleWithdrawalAction(w._id || w.id, 'REJECT')}
                                className="px-2.5 py-1 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 font-bold text-xs"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: WALLETS */}
          {tab === 'wallets' && (
            <div className="space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
                <h3 className="text-base font-extrabold text-white">Add Platform Deposit Wallet Address</h3>
                <form onSubmit={handleCreateWallet} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Network</label>
                    <select
                      value={newWallet.network}
                      onChange={(e) => setNewWallet({ ...newWallet, network: e.target.value, network_name: `${e.target.value} Network` })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white font-bold"
                    >
                      <option value="TRC-20">USDT (TRC-20)</option>
                      <option value="BEP-20">USDT (BEP-20)</option>
                      <option value="ERC-20">USDT (ERC-20)</option>
                      <option value="BTC">Bitcoin (BTC)</option>
                      <option value="ETH">Ethereum (ETH)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Deposit Address</label>
                    <input
                      type="text"
                      required
                      placeholder="Paste receiving wallet address"
                      value={newWallet.address}
                      onChange={(e) => setNewWallet({ ...newWallet, address: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white font-mono"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs shadow-md shadow-blue-500/20 cursor-pointer"
                    >
                      Save Wallet Address
                    </button>
                  </div>
                </form>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
                <h3 className="text-base font-extrabold text-white">Active Platform Deposit Channels</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {wallets.map((w) => (
                    <div key={w._id || w.id} className="p-4 bg-slate-800/60 border border-slate-700 rounded-2xl flex items-center justify-between">
                      <div className="space-y-1 min-w-0 pr-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-blue-500/20 text-blue-400">
                          {w.network}
                        </span>
                        <p className="font-mono text-xs font-bold text-white break-all">{w.address}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteWallet(w._id || w.id)}
                        className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 shrink-0 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: LIVE SUPPORT CENTER */}
          {tab === 'support' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 h-[680px]">
              {/* Left Column: Conversations List */}
              <div className="lg:col-span-4 border-r border-slate-800 flex flex-col">
                <div className="p-4 border-b border-slate-800">
                  <h3 className="font-extrabold text-white text-sm">Active Support Tickets</h3>
                  <p className="text-xs text-slate-400">Realtime direct client inquiries</p>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
                  {supportConversations.map((c) => (
                    <div
                      key={c.user_id}
                      onClick={() => fetchConversationMessages(c.user_id)}
                      className={`p-4 cursor-pointer transition-colors ${
                        activeChatUserId === c.user_id ? 'bg-blue-600/20 border-l-4 border-blue-500' : 'hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <h4 className="font-extrabold text-white text-xs">{c.user_name}</h4>
                        {c.unread_count > 0 && (
                          <span className="px-2 py-0.2 rounded-full bg-blue-500 text-white text-[10px] font-black">
                            {c.unread_count} New
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-1">{c.last_message}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Chat Room */}
              <div className="lg:col-span-8 flex flex-col justify-between bg-slate-950/40">
                {activeChatUserId ? (
                  <>
                    <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                      <h4 className="font-extrabold text-white text-xs">
                        Chatting with: {supportConversations.find(c => c.user_id === activeChatUserId)?.user_name || 'Client'}
                      </h4>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {activeChatMessages.map((m) => {
                        const isAdmin = m.sender_role === 'admin';
                        return (
                          <div key={m._id || m.id} className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}>
                            <div className={`max-w-[75%] p-3 rounded-2xl text-xs ${
                              isAdmin ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-100'
                            }`}>
                              {m.image_url && (
                                <img src={m.image_url} alt="Attachment" className="mb-2 rounded-xl max-h-48 object-cover" />
                              )}
                              <p>{m.message}</p>
                            </div>
                            <span className="text-[9px] text-slate-500 mt-0.5">
                              {new Date(m.created_at || m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        );
                      })}
                      <div ref={adminChatEndRef} />
                    </div>

                    <form onSubmit={handleAdminSendMessage} className="p-3 border-t border-slate-800 flex gap-2">
                      <input
                        type="text"
                        placeholder="Reply to client as Master Admin..."
                        value={adminChatInput}
                        onChange={(e) => setAdminChatInput(e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                      <button
                        type="submit"
                        disabled={adminSending || !adminChatInput.trim()}
                        className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs cursor-pointer disabled:opacity-50"
                      >
                        Send
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-500">
                    <Headphones className="w-10 h-10 mb-2" />
                    <p className="text-xs font-bold">Select a user conversation from the left to start live support.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 8: KYC */}
          {tab === 'kyc' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
              <h3 className="text-base font-extrabold text-white">Pending KYC Verification Documents</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                      <th className="py-3 px-3">Trader Name</th>
                      <th className="py-3 px-3">Email</th>
                      <th className="py-3 px-3">Document</th>
                      <th className="py-3 px-3 text-right">Verification Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {kycUsers.map((u) => (
                      <tr key={u._id || u.id} className="hover:bg-slate-800/40">
                        <td className="py-3 px-3 font-bold text-white">{u.name}</td>
                        <td className="py-3 px-3 font-mono text-slate-400">{u.email}</td>
                        <td className="py-3 px-3">
                          {u.kyc_document_url ? (
                            <button
                              onClick={() => setReceiptModalUrl(u.kyc_document_url)}
                              className="px-2.5 py-1 rounded bg-blue-500/20 text-blue-400 text-xs font-bold"
                            >
                              Inspect Document
                            </button>
                          ) : (
                            <span className="text-slate-600">No Document</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right space-x-2">
                          <button
                            onClick={() => handleKycAction(u._id || u.id, 'APPROVE')}
                            className="px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold text-xs hover:bg-emerald-500/30"
                          >
                            Approve KYC
                          </button>
                          <button
                            onClick={() => handleKycAction(u._id || u.id, 'REJECT')}
                            className="px-3 py-1 rounded-xl bg-rose-500/20 text-rose-400 font-bold text-xs hover:bg-rose-500/30"
                          >
                            Reject
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 9: ANNOUNCEMENTS */}
          {tab === 'announcements' && (
            <div className="space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
                <h3 className="text-base font-extrabold text-white">Broadcast System Announcement</h3>
                <form onSubmit={handleCreateAnnouncement} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-400 mb-1">Headline Title</label>
                      <input
                        type="text"
                        required
                        value={newAnn.title}
                        onChange={(e) => setNewAnn({ ...newAnn, title: e.target.value })}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">Category</label>
                      <select
                        value={newAnn.category}
                        onChange={(e) => setNewAnn({ ...newAnn, category: e.target.value })}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold"
                      >
                        <option value="General">General</option>
                        <option value="Promotion">Promotion</option>
                        <option value="System">System Update</option>
                        <option value="Signal">Signal Alert</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Message Content</label>
                    <textarea
                      rows="3"
                      required
                      value={newAnn.content}
                      onChange={(e) => setNewAnn({ ...newAnn, content: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white"
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs shadow-md shadow-blue-500/20"
                  >
                    Publish Announcement
                  </button>
                </form>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
                <h3 className="text-base font-extrabold text-white">Active System Bulletins</h3>
                <div className="space-y-3">
                  {announcements.map((a) => (
                    <div key={a._id || a.id} className="p-4 bg-slate-800/60 border border-slate-700 rounded-2xl flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.2 rounded text-[10px] font-black bg-blue-500/20 text-blue-400">
                            {a.category}
                          </span>
                          <span className="text-xs font-extrabold text-white">{a.title}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{a.content}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteAnnouncement(a._id || a.id)}
                        className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 10: SETTINGS */}
          {tab === 'settings' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 max-w-4xl">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Settings className="w-5 h-5 text-blue-500" />
                  <span>Platform System Parameters & Controls</span>
                </h3>
                <p className="text-xs text-slate-400">Edit and save live platform settings, financial boundaries, and customer contact parameters</p>
              </div>

              {settingsMessage && (
                <div className={`p-4 rounded-2xl text-xs font-bold ${
                  settingsMessage.includes('✅') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}>
                  {settingsMessage}
                </div>
              )}

              <form onSubmit={handleSaveSettings} className="space-y-6">
                {/* 1. General Branding & Signals */}
                <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-5 space-y-4">
                  <h4 className="text-xs font-black uppercase text-blue-400 tracking-wider">General Configuration</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">Platform Brand Title</label>
                      <input
                        type="text"
                        value={settingsForm.platform_name || ''}
                        onChange={(e) => setSettingsForm({ ...settingsForm, platform_name: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">Official Signal Window (PST / PKT)</label>
                      <input
                        type="text"
                        value={settingsForm.trading_window_pst || ''}
                        onChange={(e) => setSettingsForm({ ...settingsForm, trading_window_pst: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white font-bold font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Financial Limits & Taxes */}
                <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-5 space-y-4">
                  <h4 className="text-xs font-black uppercase text-emerald-400 tracking-wider">Financial Boundaries & Taxes</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">Min Deposit ($)</label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={settingsForm.min_deposit || ''}
                        onChange={(e) => setSettingsForm({ ...settingsForm, min_deposit: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">Min Withdrawal ($)</label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={settingsForm.min_withdrawal || ''}
                        onChange={(e) => setSettingsForm({ ...settingsForm, min_withdrawal: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">Withdrawal Tax Rate (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        step="0.5"
                        value={settingsForm.withdrawal_fee_percent || ''}
                        onChange={(e) => setSettingsForm({ ...settingsForm, withdrawal_fee_percent: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white font-mono font-bold"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. 3-Tier Affiliate Commission Rates */}
                <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-5 space-y-4">
                  <h4 className="text-xs font-black uppercase text-amber-400 tracking-wider">3-Tier Affiliate Commission Yields</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">Tier 1 Direct (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={settingsForm.referral_tier1_percent || ''}
                        onChange={(e) => setSettingsForm({ ...settingsForm, referral_tier1_percent: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">Tier 2 Secondary (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={settingsForm.referral_tier2_percent || ''}
                        onChange={(e) => setSettingsForm({ ...settingsForm, referral_tier2_percent: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">Tier 3 Tertiary (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={settingsForm.referral_tier3_percent || ''}
                        onChange={(e) => setSettingsForm({ ...settingsForm, referral_tier3_percent: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white font-mono font-bold"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Support Contact & Telegram Links */}
                <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-5 space-y-4">
                  <h4 className="text-xs font-black uppercase text-purple-400 tracking-wider">Official Support Desk & Links</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">Support Telegram Group / Channel</label>
                      <input
                        type="text"
                        placeholder="https://t.me/..."
                        value={settingsForm.support_telegram || ''}
                        onChange={(e) => setSettingsForm({ ...settingsForm, support_telegram: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">Support Email Address</label>
                      <input
                        type="email"
                        placeholder="support@apextrade.com"
                        value={settingsForm.support_email || ''}
                        onChange={(e) => setSettingsForm({ ...settingsForm, support_email: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={settingsSaving}
                    className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-blue-500/20 cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{settingsSaving ? 'Saving Controls...' : 'Save Platform Controls'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>

      {/* BALANCE ADJUSTMENT MODAL */}
      {balanceModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-extrabold text-white">Adjust User Balance</h3>
              <button onClick={() => setBalanceModalUser(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              User: <strong className="text-white">{balanceModalUser.name}</strong> ({balanceModalUser.email})
            </p>
            <p className="text-xs text-slate-400">
              Current Spot Balance: <strong className="text-emerald-400 font-mono">${Number(balanceModalUser.wallet_balance || 0).toFixed(2)}</strong>
            </p>

            <form onSubmit={handleAdjustBalance} className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setBalanceActionType('ADD')}
                  className={`py-2 rounded-xl text-xs font-black transition-all ${
                    balanceActionType === 'ADD' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  + Credit Funds
                </button>
                <button
                  type="button"
                  onClick={() => setBalanceActionType('SUBTRACT')}
                  className={`py-2 rounded-xl text-xs font-black transition-all ${
                    balanceActionType === 'SUBTRACT' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  - Debit Funds
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Adjustment Amount ($)</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  placeholder="e.g. 500"
                  value={balanceAdjustment}
                  onChange={(e) => setBalanceAdjustment(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Reason / Note</label>
                <input
                  type="text"
                  placeholder="e.g. Approved manual bonus"
                  value={balanceReason}
                  onChange={(e) => setBalanceReason(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setBalanceModalUser(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold shadow-sm"
                >
                  Execute Balance Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECEIPT / DOCUMENT LIGHTBOX MODAL */}
      {receiptModalUrl && (
        <div 
          onClick={() => setReceiptModalUrl('')}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
        >
          <div className="relative max-w-2xl w-full max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setReceiptModalUrl('')}
              className="absolute -top-10 right-0 p-2 text-white hover:text-slate-300"
            >
              <X className="w-6 h-6" />
            </button>
            <img src={receiptModalUrl} alt="Uploaded Proof" className="max-h-[85vh] w-auto rounded-2xl shadow-2xl object-contain" />
          </div>
        </div>
      )}

      {/* MASTER USER EDITOR MODAL */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-amber-500" />
                <span>Master User Profile Editor: {editingUser.name}</span>
              </h3>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {editUserMessage && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold">
                {editUserMessage}
              </div>
            )}

            <form onSubmit={handleSaveEditUser} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editingUser.name || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={editingUser.email || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Set New Login Password (Optional)</label>
                  <input
                    type="text"
                    placeholder="Leave blank to keep unchanged"
                    value={editingUser.password || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Set New Withdrawal PIN (Optional)</label>
                  <input
                    type="text"
                    placeholder="Leave blank to keep unchanged"
                    value={editingUser.withdrawal_password || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, withdrawal_password: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Spot Balance ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingUser.wallet_balance !== undefined ? editingUser.wallet_balance : ''}
                    onChange={(e) => setEditingUser({ ...editingUser, wallet_balance: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold text-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Investment Balance ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingUser.investment_balance !== undefined ? editingUser.investment_balance : ''}
                    onChange={(e) => setEditingUser({ ...editingUser, investment_balance: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold text-blue-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Saved USDT Address</label>
                  <input
                    type="text"
                    placeholder="T..."
                    value={editingUser.saved_usdt_address || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, saved_usdt_address: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={editingUser.phone || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Account Status</label>
                  <select
                    value={editingUser.status || 'ACTIVE'}
                    onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                    <option value="BANNED">BANNED</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">KYC Status</label>
                  <select
                    value={editingUser.kyc_status || 'NOT_SUBMITTED'}
                    onChange={(e) => setEditingUser({ ...editingUser, kyc_status: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold"
                  >
                    <option value="APPROVED">APPROVED</option>
                    <option value="PENDING">PENDING</option>
                    <option value="REJECTED">REJECTED</option>
                    <option value="NOT_SUBMITTED">NOT SUBMITTED</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Trade Mode</label>
                  <select
                    value={editingUser.trade_mode || 'OFFICIAL_SIGNAL_PROTECTION'}
                    onChange={(e) => setEditingUser({ ...editingUser, trade_mode: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold"
                  >
                    <option value="OFFICIAL_SIGNAL_PROTECTION">Signal Protected</option>
                    <option value="FORCE_WIN">Force 100% Wins</option>
                    <option value="FORCE_LOSS">Force 100% Losses</option>
                    <option value="DEFAULT_MARKET">Pure Market Live</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editUserLoading}
                  className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-extrabold shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {editUserLoading ? 'Saving Profile...' : 'Save User Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* USER DETAILS INSPECTION MODAL */}
      {inspectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-white">{inspectedUser.name}</h3>
                <p className="text-xs text-slate-400 font-mono">{inspectedUser.email}</p>
              </div>
              <button onClick={() => setInspectedUser(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-800/60 rounded-xl">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Spot Balance</span>
                <span className="text-base font-mono font-black text-emerald-400">${Number(inspectedUser.wallet_balance || 0).toFixed(2)}</span>
              </div>
              <div className="p-3 bg-slate-800/60 rounded-xl">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Investments</span>
                <span className="text-base font-mono font-black text-blue-400">${Number(inspectedUser.investment_balance || 0).toFixed(2)}</span>
              </div>
              <div className="p-3 bg-slate-800/60 rounded-xl">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Referral Code</span>
                <span className="font-mono font-bold text-white">{inspectedUser.referral_code || 'N/A'}</span>
              </div>
              <div className="p-3 bg-slate-800/60 rounded-xl">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Referred By</span>
                <span className="font-mono font-bold text-slate-300">{inspectedUser.referred_by || 'Direct'}</span>
              </div>
              <div className="p-3 bg-slate-800/60 rounded-xl">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">KYC Verification</span>
                <span className="font-bold text-white">{inspectedUser.kyc_status || 'NOT_SUBMITTED'}</span>
              </div>
              <div className="p-3 bg-slate-800/60 rounded-xl">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Trade Outcome Mode</span>
                <span className="font-bold text-white">{inspectedUser.trade_mode || 'OFFICIAL_SIGNAL_PROTECTION'}</span>
              </div>
            </div>

            {inspectedUser.saved_usdt_address && (
              <div className="p-3 bg-slate-800/60 rounded-xl space-y-1">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Saved USDT TRC-20 Address</span>
                <p className="text-xs font-mono text-white break-all">{inspectedUser.saved_usdt_address}</p>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setEditingUser({ ...inspectedUser });
                  setInspectedUser(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-extrabold cursor-pointer"
              >
                Edit Full Profile
              </button>
              <button
                type="button"
                onClick={() => setInspectedUser(null)}
                className="py-2.5 px-5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT SIGNAL MODAL */}
      {editingSignal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-xl w-full space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-blue-500" />
                <span>Edit Daily Signal: {editingSignal.instrument}</span>
              </h3>
              <button onClick={() => setEditingSignal(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateSignal} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Signal Title</label>
                  <input
                    type="text"
                    required
                    value={editingSignal.title || ''}
                    onChange={(e) => setEditingSignal({ ...editingSignal, title: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Instrument Pair</label>
                  <select
                    value={editingSignal.instrument || 'BTCUSDT'}
                    onChange={(e) => setEditingSignal({ ...editingSignal, instrument: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold"
                  >
                    <option value="BTCUSDT">BTCUSDT</option>
                    <option value="ETHUSDT">ETHUSDT</option>
                    <option value="SOLUSDT">SOLUSDT</option>
                    <option value="XAUUSD">XAUUSD (Gold)</option>
                    <option value="EURUSD">EURUSD</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Order Direction</label>
                  <select
                    value={editingSignal.order_type || 'BUY'}
                    onChange={(e) => setEditingSignal({ ...editingSignal, order_type: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold"
                  >
                    <option value="BUY">BUY / CALL</option>
                    <option value="SELL">SELL / PUT</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Execution Time (PST / PKT)</label>
                  <input
                    type="text"
                    required
                    value={editingSignal.execution_time_pst || ''}
                    onChange={(e) => setEditingSignal({ ...editingSignal, execution_time_pst: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Duration (Seconds)</label>
                  <input
                    type="number"
                    required
                    value={editingSignal.duration_seconds || 180}
                    onChange={(e) => setEditingSignal({ ...editingSignal, duration_seconds: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Profit Yield (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editingSignal.profit_percentage || 5}
                    onChange={(e) => setEditingSignal({ ...editingSignal, profit_percentage: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Status</label>
                  <select
                    value={editingSignal.status || 'ACTIVE'}
                    onChange={(e) => setEditingSignal({ ...editingSignal, status: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="EXPIRED">EXPIRED</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingSignal(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSignalLoading}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {editSignalLoading ? 'Saving Signal...' : 'Save Signal Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
