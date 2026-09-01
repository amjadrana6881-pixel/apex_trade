import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
  LogOut
} from 'lucide-react';
import { useAuth, API_BASE } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

export default function AdminDashboard() {
  const { token, user, logout } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Stats
  const [stats, setStats] = useState({});

  // Users & Master Editor
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [inspectedUser, setInspectedUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  // Daily Signals
  const [signals, setSignals] = useState([]);
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
    disclaimer: `Disclaimer: Forex and CFD trading involve risk. Follow official signal parameters. Unscheduled trades are subject to 100% loss.`
  });

  // Trades
  const [trades, setTrades] = useState([]);

  // Deposits & Withdrawals (CRYPTO ONLY)
  const [deposits, setDeposits] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [receiptModalUrl, setReceiptModalUrl] = useState('');

  // Deposit Wallets (CRYPTO ONLY)
  const [wallets, setWallets] = useState([]);
  const [newWallet, setNewWallet] = useState({ network: 'TRC-20', address: '', network_name: 'USDT (TRC-20 Network)', instructions: 'Send USDT TRC-20.' });

  // Packages & Wheel
  const [packages, setPackages] = useState([]);
  const [wheelPrizes, setWheelPrizes] = useState([]);

  // Announcements & KYC & Settings
  const [announcements, setAnnouncements] = useState([]);
  const [newAnn, setNewAnn] = useState({ title: '', content: '', category: 'General' });
  const [kycUsers, setKycUsers] = useState([]);
  const [settings, setSettings] = useState({});

  // Live Support Chat Desk State
  const [supportConversations, setSupportConversations] = useState([]);
  const [activeChatUserId, setActiveChatUserId] = useState(null);
  const [activeChatMessages, setActiveChatMessages] = useState([]);
  const [adminChatInput, setAdminChatInput] = useState('');
  const [adminSending, setAdminSending] = useState(false);
  const [adminEditingMsg, setAdminEditingMsg] = useState(null);
  const [adminEditText, setAdminEditText] = useState('');
  const [adminDeletingMsg, setAdminDeletingMsg] = useState(null);
  const adminChatEndRef = useRef(null);

  useEffect(() => {
    if (token && user?.role === 'admin') {
      fetchAllData();
    }
  }, [token, user]);

  const fetchAllData = () => {
    fetchStats();
    fetchUsers();
    fetchSignals();
    fetchTrades();
    fetchDeposits();
    fetchWithdrawals();
    fetchWallets();
    fetchPackages();
    fetchWheel();
    fetchAnnouncements();
    fetchKyc();
    fetchSettings();
    fetchSupportConversations();
  };

  // Socket listeners for live support chat
  useEffect(() => {
    if (socket) {
      const handleAdminNewMsg = (newMsg) => {
        if (activeChatUserId === newMsg.user_id) {
          setActiveChatMessages((prev) => {
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
        fetchSupportConversations();
      };

      const handleAdminMsgUpdated = (updatedMsg) => {
        if (activeChatUserId === updatedMsg.user_id) {
          setActiveChatMessages((prev) => prev.map(m => m.id === updatedMsg.id ? updatedMsg : m));
        }
      };

      const handleAdminMsgDeleted = ({ id }) => {
        setActiveChatMessages((prev) => prev.map(m => {
          if (m.id === id) {
            return {
              ...m,
              message: '🚫 This message was deleted',
              deleted_for_everyone: 1,
              isDeletedForEveryone: true
            };
          }
          return m;
        }));
      };

      socket.on('support:admin_new_message', handleAdminNewMsg);
      socket.on('support:message_updated', handleAdminMsgUpdated);
      socket.on('support:message_deleted_for_everyone', handleAdminMsgDeleted);

      return () => {
        socket.off('support:admin_new_message', handleAdminNewMsg);
        socket.off('support:message_updated', handleAdminMsgUpdated);
        socket.off('support:message_deleted_for_everyone', handleAdminMsgDeleted);
      };
    }
  }, [socket, activeChatUserId]);

  useEffect(() => {
    adminChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChatMessages]);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/stats`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setStats(data.data);
    } catch (e) { console.error(e); }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/users`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setUsers(data.data);
    } catch (e) { console.error(e); }
  };

  const fetchSignals = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/signals/admin/list`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setSignals(data.data);
    } catch (e) { console.error(e); }
  };

  const fetchTrades = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/trades`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setTrades(data.data);
    } catch (e) { console.error(e); }
  };

  const fetchDeposits = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/deposits`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setDeposits(data.data);
    } catch (e) { console.error(e); }
  };

  const fetchWithdrawals = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/withdrawals`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setWithdrawals(data.data);
    } catch (e) { console.error(e); }
  };

  const fetchWallets = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/wallet/deposit-wallets`);
      const data = await res.json();
      if (data.success) setWallets(data.data);
    } catch (e) { console.error(e); }
  };

  const fetchPackages = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/packages`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setPackages(data.data);
    } catch (e) { console.error(e); }
  };

  const fetchWheel = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/wheel`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setWheelPrizes(data.data);
    } catch (e) { console.error(e); }
  };

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/announcements`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setAnnouncements(data.data);
    } catch (e) { console.error(e); }
  };

  const fetchKyc = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/kyc`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setKycUsers(data.data);
    } catch (e) { console.error(e); }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/settings`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setSettings(data.data);
    } catch (e) { console.error(e); }
  };

  // Support Chat Fetchers
  const fetchSupportConversations = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/support/admin/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setSupportConversations(data.data || []);
        if (!activeChatUserId && data.data.length > 0) {
          selectConversation(data.data[0].user_id);
        }
      }
    } catch (e) { console.error(e); }
  };

  const selectConversation = async (userId) => {
    setActiveChatUserId(userId);
    try {
      const res = await fetch(`${API_BASE}/api/support/admin/conversation/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setActiveChatMessages(data.data || []);
      }
    } catch (e) { console.error(e); }
  };

  const handleAdminSendMessage = async (e) => {
    e.preventDefault();
    if (!adminChatInput.trim() || !activeChatUserId || adminSending) return;

    const messageText = adminChatInput.trim();
    setAdminChatInput('');

    try {
      setAdminSending(true);
      const res = await fetch(`${API_BASE}/api/support/admin/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: activeChatUserId,
          message: messageText
        })
      });
      const data = await res.json();
      if (data.success && data.data) {
        setActiveChatMessages(prev => [...prev, data.data]);
        fetchSupportConversations();
      }
    } catch (e) { console.error(e); }
    finally { setAdminSending(false); }
  };

  const handleAdminSaveEdit = async () => {
    if (!adminEditingMsg || !adminEditText.trim()) return;

    try {
      const res = await fetch(`${API_BASE}/api/support/admin/edit/${adminEditingMsg.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ message: adminEditText.trim() })
      });
      const data = await res.json();
      if (data.success && data.data) {
        setActiveChatMessages(prev => prev.map(m => m.id === data.data.id ? data.data : m));
        setAdminEditingMsg(null);
        setAdminEditText('');
      }
    } catch (e) { console.error(e); }
  };

  const handleAdminDeleteMessage = async (mode) => {
    if (!adminDeletingMsg) return;

    try {
      const res = await fetch(`${API_BASE}/api/support/admin/delete/${adminDeletingMsg.id}?mode=${mode}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        if (mode === 'for_everyone') {
          setActiveChatMessages(prev => prev.map(m => {
            if (m.id === adminDeletingMsg.id) {
              return {
                ...m,
                message: '🚫 This message was deleted',
                deleted_for_everyone: 1,
                isDeletedForEveryone: true
              };
            }
            return m;
          }));
        } else {
          setActiveChatMessages(prev => prev.filter(m => m.id !== adminDeletingMsg.id));
        }
        setAdminDeletingMsg(null);
      }
    } catch (e) { console.error(e); }
  };

  // Inspect User Full Details
  const handleInspectUser = async (userId) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/user/${userId}/full-details`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setInspectedUser(data.data.user);
        setUserDetails(data.data);
      }
    } catch (e) { console.error(e); }
  };

  // Open Full User Editor Modal
  const handleOpenEditUser = (userObj) => {
    setEditingUser(userObj);
    setEditFormData({
      name: userObj.name || '',
      email: userObj.email || '',
      password: '',
      withdrawal_password: '',
      saved_usdt_address: userObj.saved_usdt_address || '',
      saved_usdt_network: userObj.saved_usdt_network || 'TRC-20',
      wallet_balance: userObj.wallet_balance || 0,
      investment_balance: userObj.investment_balance || 0,
      kyc_status: userObj.kyc_status || 'UNVERIFIED',
      status: userObj.status || 'ACTIVE',
      referral_code: userObj.referral_code || '',
      referred_by: userObj.referred_by || '',
      phone: userObj.phone || '',
      trade_mode: userObj.trade_mode || 'AUTO',
      custom_win_rate: userObj.custom_win_rate || 0.5
    });
  };

  // Save Full User Edits
  const handleSaveUserEdits = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/admin/user/${editingUser.id}/edit-all`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(editFormData)
      });
      const data = await res.json();
      alert(data.message);
      setEditingUser(null);
      fetchUsers();
    } catch (e) {
      console.error(e);
      alert('Failed to save user changes.');
    }
  };

  // Delete User Permanently
  const handleDeleteUser = async (userObj) => {
    if (!window.confirm(`Are you sure you want to permanently delete user '${userObj.name}' (${userObj.email})? This action cannot be undone.`)) {
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/admin/user/${userObj.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      alert(data.message);
      if (data.success) {
        fetchUsers();
        if (inspectedUser?.id === userObj.id) setInspectedUser(null);
      }
    } catch (e) {
      console.error(e);
      alert('Failed to delete user.');
    }
  };

  // Create Signal
  const handleCreateSignal = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/signals/admin/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(newSignal)
      });
      const data = await res.json();
      alert(data.message);
      fetchSignals();
    } catch (e) { console.error(e); }
  };

  // Quick Signal Outcome Day Toggle (WIN / LOSS Day)
  const handleToggleSignalOutcome = async (sig) => {
    const nextOutcome = sig.outcome === 'WIN' ? 'LOSS' : 'WIN';
    try {
      const res = await fetch(`${API_BASE}/api/signals/admin/${sig.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...sig,
          outcome: nextOutcome
        })
      });
      const data = await res.json();
      alert(`Signal outcome updated to ${nextOutcome}! (House ${nextOutcome === 'LOSS' ? 'Loss Simulation' : 'Win Distribution'})`);
      fetchSignals();
    } catch (e) { console.error(e); }
  };

  // Delete Signal
  const handleDeleteSignal = async (id) => {
    if (!confirm('Are you sure you want to delete this signal?')) return;
    try {
      await fetch(`${API_BASE}/api/signals/admin/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchSignals();
    } catch (e) { console.error(e); }
  };

  // Approve / Reject Crypto Deposit
  const handleDepositAction = async (id, action) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/deposits/${id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      alert(data.message);
      fetchDeposits();
      fetchUsers();
      fetchStats();
    } catch (e) { console.error(e); }
  };

  // Approve / Reject Crypto Withdrawal
  const handleWithdrawalAction = async (id, action) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/withdrawals/${id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      alert(data.message);
      fetchWithdrawals();
      fetchUsers();
      fetchStats();
    } catch (e) { console.error(e); }
  };

  // Add Deposit Wallet
  const handleAddWallet = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/admin/wallets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(newWallet)
      });
      const data = await res.json();
      alert(data.message);
      setNewWallet({ network: 'TRC-20', address: '', network_name: 'USDT (TRC-20 Network)', instructions: '' });
      fetchWallets();
    } catch (e) { console.error(e); }
  };

  // Delete Crypto Wallet
  const handleDeleteWallet = async (id) => {
    if (!confirm('Are you sure?')) return;
    try {
      await fetch(`${API_BASE}/api/admin/wallets/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchWallets();
    } catch (e) { console.error(e); }
  };

  // KYC Action
  const handleKycAction = async (id, action) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/kyc/${id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      alert(data.message);
      fetchKyc();
      fetchUsers();
    } catch (e) { console.error(e); }
  };

  // Settings Save
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/admin/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(settings)
      });
      const data = await res.json();
      alert(data.message);
    } catch (e) { console.error(e); }
  };

  const handleLogout = () => {
    logout();
    navigate('/admin-secure-auth');
  };

  const tabs = [
    { key: 'overview', label: 'Overview', icon: BarChart2 },
    { key: 'support', label: 'Support Desk', icon: Headphones, badge: supportConversations.length > 0 ? supportConversations.length : null, badgeColor: 'bg-blue-600' },
    { key: 'signals', label: 'Daily Signals', icon: Radio, badge: signals.length > 0 ? signals.length : null, badgeColor: 'bg-indigo-600' },
    { key: 'users', label: 'Users & Master Editor', icon: Users, badge: users.length > 0 ? users.length : null, badgeColor: 'bg-slate-700' },
    { key: 'trades', label: 'Live Trades', icon: TrendingUp },
    { key: 'deposits', label: 'Crypto Deposits', icon: ArrowDownLeft, badge: stats.pendingDeposits > 0 ? stats.pendingDeposits : null, badgeColor: 'bg-amber-600' },
    { key: 'withdrawals', label: 'Crypto Withdrawals', icon: ArrowUpRight, badge: stats.pendingWithdrawals > 0 ? stats.pendingWithdrawals : null, badgeColor: 'bg-rose-600' },
    { key: 'wallets', label: 'Deposit Addresses', icon: Wallet },
    { key: 'kyc', label: 'KYC Review', icon: ShieldCheck, badge: stats.pendingKyc > 0 ? stats.pendingKyc : null, badgeColor: 'bg-amber-600' },
    { key: 'announcements', label: 'Announcements', icon: Bell },
    { key: 'settings', label: 'Platform Settings', icon: Settings },
  ];

  const activeChatUser = users.find(u => u.id === activeChatUserId);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col lg:flex-row">
      
      {/* 1. Mobile Top Bar (< lg) */}
      <header className="lg:hidden sticky top-0 z-40 bg-slate-900 text-white border-b border-slate-800 px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white cursor-pointer"
            aria-label="Open Admin Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 p-0.5 flex items-center justify-center">
              <img src="/logo.svg" alt="ApexTrade" className="w-full h-full rounded-lg" />
            </div>
            <span className="font-black text-white text-sm">ApexTrade Admin</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-400 text-[10px] font-black uppercase">
            {tabs.find(t => t.key === tab)?.label || 'Overview'}
          </span>
          <button
            onClick={handleLogout}
            className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:text-rose-300 cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. Mobile Drawer Overlay */}
      {mobileSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm transition-opacity"
          onClick={() => setMobileSidebarOpen(false)}
        >
          <div 
            className="w-72 max-w-[85%] h-full bg-slate-900 border-r border-slate-800 p-4 flex flex-col justify-between shadow-2xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 p-0.5 flex items-center justify-center">
                    <img src="/logo.svg" alt="ApexTrade" className="w-full h-full rounded-xl" />
                  </div>
                  <div>
                    <h2 className="font-black text-white text-sm leading-tight">ApexTrade PRO</h2>
                    <span className="text-[10px] font-black text-rose-400 uppercase">SUPER ADMIN DESK</span>
                  </div>
                </div>
                <button
                  onClick={() => setMobileSidebarOpen(false)}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Navigation Links */}
              <div className="space-y-1">
                {tabs.map((t) => {
                  const Icon = t.icon;
                  const isActive = tab === t.key;
                  return (
                    <button
                      key={t.key}
                      onClick={() => {
                        setTab(t.key);
                        setMobileSidebarOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                        <span>{t.label}</span>
                      </div>
                      {t.badge && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black text-white ${t.badgeColor || 'bg-slate-700'}`}>
                          {t.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Profile & Logout */}
            <div className="pt-4 mt-6 border-t border-slate-800 space-y-3">
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-800/60 border border-slate-800">
                <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white truncate">{user?.name || 'Super Admin'}</p>
                  <p className="text-[10px] text-slate-400 truncate font-mono">{user?.email || 'admin@apextrade.net'}</p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 font-bold text-xs cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Desktop Dedicated Left Sidebar (>= lg) */}
      <aside className="hidden lg:flex w-72 bg-slate-900 border-r border-slate-800 p-5 flex-col justify-between shrink-0 min-h-screen sticky top-0">
        <div className="space-y-6">
          {/* Brand Header */}
          <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 p-0.5 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <img src="/logo.svg" alt="ApexTrade Master" className="w-full h-full rounded-2xl" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-white text-base tracking-tight">ApexTrade</span>
                <span className="px-1.5 py-0.5 rounded bg-blue-500/20 border border-blue-500/30 text-blue-400 text-[10px] font-black">PRO</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[9px] font-black uppercase tracking-wider block mt-1 w-fit">
                SUPER ADMIN DESK
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-1">
            <span className="px-3 text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">Control Center</span>
            {tabs.map((t) => {
              const Icon = t.icon;
              const isActive = tab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 translate-x-1'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{t.label}</span>
                  </div>
                  {t.badge && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black text-white ${t.badgeColor || 'bg-slate-700'}`}>
                      {t.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Profile & Logout Card */}
        <div className="pt-4 border-t border-slate-800 space-y-3">
          <div className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-slate-800/60 border border-slate-800">
            <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">{user?.name || 'Super Admin'}</p>
              <p className="text-[10px] text-slate-400 truncate font-mono">{user?.email || 'admin@apextrade.net'}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 font-bold text-xs transition-all cursor-pointer shadow-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* 4. Main Control Workspace */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        {/* Workspace Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-black tracking-wider uppercase">
                {tabs.find(t => t.key === tab)?.label || 'Control Desk'}
              </span>
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Server Synced</span>
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
              {tab === 'overview' && 'ApexTrade Master Overview'}
              {tab === 'support' && 'Live Support Chat Desk'}
              {tab === 'signals' && 'Daily Trading Signals Hub'}
              {tab === 'users' && 'Registered Traders & Master User Editor'}
              {tab === 'trades' && 'Live Option Contracts & Ledger'}
              {tab === 'deposits' && 'Crypto Deposit Verification Requests'}
              {tab === 'withdrawals' && 'USDT Crypto Withdrawal Requests'}
              {tab === 'wallets' && 'Platform Deposit Wallet Addresses'}
              {tab === 'kyc' && 'KYC Verification Submissions'}
              {tab === 'announcements' && 'Platform Broadcast Announcements'}
              {tab === 'settings' && 'Platform Parameters & 3-Tier Referral Rates'}
            </h1>
            <p className="text-xs text-slate-500">100% full platform control over signals, user balances, crypto deposits/withdrawals, and live chat support.</p>
          </div>

          <button
            onClick={fetchAllData}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-2xs cursor-pointer w-fit"
          >
            <RefreshCw className="w-4 h-4 text-blue-600" />
            <span>Refresh All Data</span>
          </button>
        </div>

      {/* 1. OVERVIEW TAB */}
      {tab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-2">
              <span className="text-[11px] font-bold uppercase text-slate-400">Total Registered Users</span>
              <p className="text-3xl font-black font-mono text-slate-900">{stats.totalUsers || 0}</p>
              <span className="text-[11px] text-emerald-600 font-semibold">{stats.activeUsers || 0} Active Accounts</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-2">
              <span className="text-[11px] font-bold uppercase text-slate-400">Total Deposited Volume</span>
              <p className="text-3xl font-black font-mono text-emerald-600">${Number(stats.totalDeposited || 0).toFixed(2)}</p>
              <span className="text-[11px] text-slate-500">{stats.approvedDepositsCount || 0} Cleared Deposits</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-2">
              <span className="text-[11px] font-bold uppercase text-slate-400">Pending Crypto Withdrawals</span>
              <p className="text-3xl font-black font-mono text-amber-600">{stats.pendingWithdrawals || 0}</p>
              <span className="text-[11px] text-amber-700 font-semibold">Requires Approval</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-2">
              <span className="text-[11px] font-bold uppercase text-slate-400">Live Option Trades</span>
              <p className="text-3xl font-black font-mono text-blue-600">{stats.totalTrades || 0}</p>
              <span className="text-[11px] text-slate-500">Platform Lifetime Contracts</span>
            </div>
          </div>
        </div>
      )}

      {/* 2. SUPPORT CHAT DESK TAB */}
      {tab === 'support' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white border border-slate-200 rounded-3xl p-4 sm:p-6 shadow-xs min-h-[600px]">
          
          {/* Conversation List (4 cols) */}
          <div className="lg:col-span-4 border-r border-slate-100 pr-4 space-y-3">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">User Chat Threads ({supportConversations.length})</h2>
            
            <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
              {supportConversations.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">No support chats started yet.</div>
              ) : (
                supportConversations.map((c) => {
                  const isSelected = activeChatUserId === c.user_id;
                  return (
                    <div
                      key={c.user_id}
                      onClick={() => selectConversation(c.user_id)}
                      className={`p-3 rounded-2xl cursor-pointer transition-all ${
                        isSelected ? 'bg-blue-50 border border-blue-200' : 'bg-slate-50 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-extrabold text-xs text-slate-900">{c.name}</span>
                        <span className="text-[9px] text-slate-400">
                          {c.last_activity ? new Date(c.last_activity).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">{c.last_message || 'New inquiry'}</p>
                      <div className="flex justify-between items-center mt-1 text-[10px] text-slate-400 font-mono">
                        <span>${Number(c.wallet_balance || 0).toFixed(2)} Bal</span>
                        <span className="text-blue-600 font-bold">{c.email}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Active Chat Conversation (8 cols) */}
          <div className="lg:col-span-8 flex flex-col justify-between h-[520px]">
            {activeChatUserId ? (
              <>
                {/* Chat Top Banner */}
                <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                  <div>
                    <h3 className="text-base font-black text-slate-900">{activeChatUser?.name || 'Trader'}</h3>
                    <p className="text-xs text-slate-400 font-mono">{activeChatUser?.email}</p>
                  </div>
                  <button
                    onClick={() => handleOpenEditUser(activeChatUser)}
                    className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 font-extrabold text-xs hover:bg-blue-100 cursor-pointer"
                  >
                    Edit User Profile
                  </button>
                </div>

                {/* Messages List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50 rounded-2xl my-2">
                  {activeChatMessages.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 text-xs">No messages in this conversation.</div>
                  ) : (
                    activeChatMessages.map((m) => {
                      const isAdmin = m.sender_role === 'admin';
                      const isDeleted = m.deleted_for_everyone === 1 || m.isDeletedForEveryone;

                      return (
                        <div
                          key={m.id}
                          className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'} group`}
                        >
                          <div className="flex items-center gap-1 mb-1">
                            <span className="text-[10px] font-extrabold text-slate-400">
                              {isAdmin ? '🛡️ Admin' : m.sender_name}
                            </span>
                            <span className="text-[9px] text-slate-300">
                              {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          <div className="relative flex items-center gap-1.5 max-w-[85%]">
                            {/* Actions for Admin messages */}
                            {isAdmin && !isDeleted && (
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                <button
                                  onClick={() => {
                                    setAdminEditingMsg(m);
                                    setAdminEditText(m.message);
                                  }}
                                  className="p-1 rounded text-slate-400 hover:text-blue-600"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setAdminDeletingMsg(m)}
                                  className="p-1 rounded text-slate-400 hover:text-rose-600"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}

                            <div
                              className={`p-3 rounded-2xl text-xs break-words shadow-2xs ${
                                isDeleted
                                  ? 'bg-slate-100 text-slate-400 italic border border-slate-200'
                                  : isAdmin
                                  ? 'bg-blue-600 text-white rounded-br-xs'
                                  : 'bg-white text-slate-900 border border-slate-200 rounded-bl-xs'
                              }`}
                            >
                              {m.image_url && !isDeleted && (
                                <div 
                                  onClick={() => setReceiptModalUrl(`${API_BASE}${m.image_url}`)}
                                  className="mb-2 rounded-xl overflow-hidden cursor-pointer max-h-48 border border-black/10"
                                >
                                  <img src={`${API_BASE}${m.image_url}`} alt="Attachment" className="w-full h-full object-cover" />
                                </div>
                              )}

                              {m.message && <p>{m.message}</p>}

                              <div className="flex items-center justify-end gap-1 mt-1">
                                {m.is_edited === 1 && !isDeleted && (
                                  <span className={`text-[9px] ${isAdmin ? 'text-blue-200' : 'text-slate-400'}`}>(edited)</span>
                                )}
                                {isAdmin && !isDeleted && (
                                  <span title={m.is_seen === 1 ? 'Seen by Trader' : 'Delivered'}>
                                    {m.is_seen === 1 ? (
                                      <CheckCheck className="w-3.5 h-3.5 text-blue-200" />
                                    ) : (
                                      <Check className="w-3.5 h-3.5 text-blue-300" />
                                    )}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={adminChatEndRef} />
                </div>

                {/* Reply Form */}
                <form onSubmit={handleAdminSendMessage} className="flex items-center gap-2 pt-2">
                  <input
                    type="text"
                    required
                    value={adminChatInput}
                    onChange={(e) => setAdminChatInput(e.target.value)}
                    placeholder="Reply as ApexTrade Official Support..."
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs text-slate-900 focus:outline-none focus:border-blue-500 font-medium"
                  />
                  <button
                    type="submit"
                    disabled={adminSending || !adminChatInput.trim()}
                    className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Send className="w-4 h-4" />
                    <span>Reply</span>
                  </button>
                </form>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 text-xs">
                Select a user thread on the left to start live chatting.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. SIGNALS TAB */}
      {tab === 'signals' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
            <h2 className="text-lg font-black text-slate-900">Publish New Daily Trading Signal</h2>
            <form onSubmit={handleCreateSignal} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Signal Title</label>
                <input
                  type="text"
                  required
                  value={newSignal.title}
                  onChange={(e) => setNewSignal({ ...newSignal, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Asset Instrument</label>
                <input
                  type="text"
                  required
                  value={newSignal.instrument}
                  onChange={(e) => setNewSignal({ ...newSignal, instrument: e.target.value.toUpperCase() })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-xs font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Order Type</label>
                <select
                  value={newSignal.order_type}
                  onChange={(e) => setNewSignal({ ...newSignal, order_type: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-xs font-bold focus:outline-none"
                >
                  <option value="BUY">BUY / CALL (Higher)</option>
                  <option value="SELL">SELL / PUT (Lower)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Execution Time (PST)</label>
                <input
                  type="text"
                  required
                  value={newSignal.execution_time_pst}
                  onChange={(e) => setNewSignal({ ...newSignal, execution_time_pst: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Duration Seconds (Max 180s)</label>
                <input
                  type="number"
                  max="180"
                  required
                  value={newSignal.duration_seconds}
                  onChange={(e) => setNewSignal({ ...newSignal, duration_seconds: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-xs font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Signal Outcome (WIN or LOSS Day)</label>
                <select
                  value={newSignal.outcome}
                  onChange={(e) => setNewSignal({ ...newSignal, outcome: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-xs font-bold focus:outline-none"
                >
                  <option value="WIN">WIN (All signal users win profit)</option>
                  <option value="LOSS">LOSS (Planned realistic house loss day)</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md cursor-pointer"
                >
                  Publish Official Signal
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
            <h2 className="text-base font-extrabold text-slate-900">Broadcast Signals Ledger</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="py-2.5 px-3">Title</th>
                    <th className="py-2.5 px-3">Instrument</th>
                    <th className="py-2.5 px-3">Order</th>
                    <th className="py-2.5 px-3">Time (PST)</th>
                    <th className="py-2.5 px-3">Outcome</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {signals.map((s) => (
                    <tr key={s.id}>
                      <td className="py-3 px-3 font-bold text-slate-900">{s.title}</td>
                      <td className="py-3 px-3 font-extrabold text-blue-600">{s.instrument}</td>
                      <td className="py-3 px-3">{s.order_type}</td>
                      <td className="py-3 px-3">{s.execution_time_pst}</td>
                      <td className="py-3 px-3">
                        <button
                          onClick={() => handleToggleSignalOutcome(s)}
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black cursor-pointer ${
                            s.outcome === 'WIN' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {s.outcome} (Click to toggle)
                        </button>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                          s.status === 'ACTIVE' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button onClick={() => handleDeleteSignal(s.id)} className="text-rose-600 hover:underline">
                          Delete
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

      {/* 4. USERS & MASTER EDITOR TAB */}
      {tab === 'users' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-base font-extrabold text-slate-900">Registered Traders & Master User Editor</h2>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search user name or email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 focus:outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Name</th>
                  <th className="py-2.5 px-3">Email</th>
                  <th className="py-2.5 px-3">Spot Balance</th>
                  <th className="py-2.5 px-3">KYC</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Mode</th>
                  <th className="py-2.5 px-3 text-right">Master Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.filter(u => u.name?.toLowerCase().includes(userSearch.toLowerCase()) || u.email?.toLowerCase().includes(userSearch.toLowerCase())).map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="py-3 px-3 font-bold text-slate-900">{u.name}</td>
                    <td className="py-3 px-3 font-mono text-slate-600">{u.email}</td>
                    <td className="py-3 px-3 font-mono font-black text-emerald-600">${Number(u.wallet_balance).toFixed(2)}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                        u.kyc_status === 'VERIFIED' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {u.kyc_status}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                        u.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                      }`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-blue-600">{u.trade_mode || 'AUTO'}</td>
                    <td className="py-3 px-3 text-right space-x-2">
                      <button
                        onClick={() => handleInspectUser(u.id)}
                        className="p-1.5 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer inline-flex items-center gap-1"
                        title="Inspect User Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </button>
                      <button
                        onClick={() => handleOpenEditUser(u)}
                        className="p-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs cursor-pointer inline-flex items-center gap-1"
                        title="Master Edit User"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => handleDeleteUser(u)}
                          className="p-1.5 px-2.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 font-extrabold text-xs cursor-pointer inline-flex items-center gap-1 border border-rose-200"
                          title="Delete User"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. DEPOSITS TAB */}
      {tab === 'deposits' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
          <h2 className="text-base font-extrabold text-slate-900">Crypto Deposit Verification Requests</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-3">User</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Network</th>
                  <th className="py-2.5 px-3">TXID Hash</th>
                  <th className="py-2.5 px-3">Proof</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {deposits.map((d) => (
                  <tr key={d.id}>
                    <td className="py-3 px-3 font-bold">{d.user_name} ({d.user_email})</td>
                    <td className="py-3 px-3 font-mono font-black text-emerald-600">${Number(d.amount).toFixed(2)}</td>
                    <td className="py-3 px-3 font-mono font-bold text-blue-600">{d.network}</td>
                    <td className="py-3 px-3 font-mono text-[10px] text-slate-600 break-all max-w-xs">{d.txid}</td>
                    <td className="py-3 px-3">
                      {d.receipt_url ? (
                        <button
                          onClick={() => setReceiptModalUrl(`${API_BASE}${d.receipt_url}`)}
                          className="text-blue-600 underline font-bold"
                        >
                          View Receipt
                        </button>
                      ) : (
                        <span className="text-slate-400">None</span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-bold">{d.status}</td>
                    <td className="py-3 px-3 text-right space-x-2">
                      {d.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleDepositAction(d.id, 'APPROVE')}
                            className="px-3 py-1 rounded bg-emerald-600 text-white font-bold cursor-pointer"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleDepositAction(d.id, 'REJECT')}
                            className="px-3 py-1 rounded bg-rose-600 text-white font-bold cursor-pointer"
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

      {/* 6. WITHDRAWALS TAB */}
      {tab === 'withdrawals' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
          <h2 className="text-base font-extrabold text-slate-900">USDT Crypto Withdrawal Requests</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-3">User</th>
                  <th className="py-2.5 px-3">Requested</th>
                  <th className="py-2.5 px-3">Tax (10%)</th>
                  <th className="py-2.5 px-3">Net Payout</th>
                  <th className="py-2.5 px-3">Network</th>
                  <th className="py-2.5 px-3">Receiving Address</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {withdrawals.map((w) => (
                  <tr key={w.id}>
                    <td className="py-3 px-3 font-bold">{w.user_name} ({w.user_email})</td>
                    <td className="py-3 px-3 font-mono font-black text-slate-900">${Number(w.amount).toFixed(2)}</td>
                    <td className="py-3 px-3 font-mono text-rose-600">-${Number(w.fee).toFixed(2)}</td>
                    <td className="py-3 px-3 font-mono font-black text-emerald-600">${Number(w.net_amount).toFixed(2)} USDT</td>
                    <td className="py-3 px-3 font-mono font-bold text-blue-600">{w.network}</td>
                    <td className="py-3 px-3 font-mono text-[10px] text-slate-600 break-all max-w-xs">{w.destination_address}</td>
                    <td className="py-3 px-3 font-bold">{w.status}</td>
                    <td className="py-3 px-3 text-right space-x-2">
                      {w.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleWithdrawalAction(w.id, 'APPROVE')}
                            className="px-3 py-1 rounded bg-emerald-600 text-white font-bold cursor-pointer"
                          >
                            Clear & Pay
                          </button>
                          <button
                            onClick={() => handleWithdrawalAction(w.id, 'REJECT')}
                            className="px-3 py-1 rounded bg-rose-600 text-white font-bold cursor-pointer"
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

      {/* 7. WALLETS TAB */}
      {tab === 'wallets' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
            <h2 className="text-base font-black text-slate-900">Add Crypto Depository Address</h2>
            <form onSubmit={handleAddWallet} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Network Symbol</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TRC-20, BEP-20, ERC-20"
                  value={newWallet.network}
                  onChange={(e) => setNewWallet({ ...newWallet, network: e.target.value.toUpperCase() })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-xs font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Full Network Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. USDT (TRC-20 Network)"
                  value={newWallet.network_name}
                  onChange={(e) => setNewWallet({ ...newWallet, network_name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Crypto Receiving Address</label>
                <input
                  type="text"
                  required
                  placeholder="Paste blockchain address"
                  value={newWallet.address}
                  onChange={(e) => setNewWallet({ ...newWallet, address: e.target.value.trim() })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-xs font-mono focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-sm cursor-pointer"
              >
                Add Crypto Channel
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
            <h2 className="text-base font-black text-slate-900">Active Crypto Channels</h2>
            <div className="space-y-3">
              {wallets.map((w) => (
                <div key={w.id} className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-black">
                      {w.network}
                    </span>
                    <p className="font-extrabold text-slate-900 text-sm">{w.network_name}</p>
                    <p className="font-mono text-xs text-slate-600 break-all select-all font-bold">{w.address}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteWallet(w.id)}
                    className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 8. SETTINGS TAB */}
      {tab === 'settings' && (
        <div className="max-w-2xl bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <h2 className="text-lg font-black text-slate-900">System Platform Settings</h2>
            <p className="text-xs text-slate-500">Configure financial limits, loss protection, and withdrawal tax.</p>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-blue-900">Enforce Signal-Only Trading Protection</p>
                <p className="text-[11px] text-blue-700 mt-0.5">
                  When enabled, trades placed outside the official Daily Signal result in 100% loss to protect the house funds.
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.enforce_signal_only === 'true' || settings.enforce_signal_only === true}
                onChange={(e) => setSettings({ ...settings, enforce_signal_only: e.target.checked ? 'true' : 'false' })}
                className="w-5 h-5 accent-blue-600 cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Min Deposit ($)</label>
                <input
                  type="number"
                  value={settings.min_deposit || 10}
                  onChange={(e) => setSettings({ ...settings, min_deposit: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-xs font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Min Withdrawal ($)</label>
                <input
                  type="number"
                  value={settings.min_withdrawal || 10}
                  onChange={(e) => setSettings({ ...settings, min_withdrawal: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-xs font-mono focus:outline-none"
                />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3">
              <div>
                <p className="text-xs font-black text-emerald-900">3-Tier Automated Referral Commission Percentages</p>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  Automatically credited to inviter wallets whenever an approved deposit clears.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-emerald-800 mb-1">Level 1 Direct (%)</label>
                  <input
                    type="number"
                    value={settings.referral_lvl1_pct || 10}
                    onChange={(e) => setSettings({ ...settings, referral_lvl1_pct: e.target.value })}
                    className="w-full bg-white border border-emerald-300 rounded-xl px-3 py-2 text-slate-900 text-xs font-mono font-black focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-emerald-800 mb-1">Level 2 (%)</label>
                  <input
                    type="number"
                    value={settings.referral_lvl2_pct || 5}
                    onChange={(e) => setSettings({ ...settings, referral_lvl2_pct: e.target.value })}
                    className="w-full bg-white border border-emerald-300 rounded-xl px-3 py-2 text-slate-900 text-xs font-mono font-black focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-emerald-800 mb-1">Level 3 (%)</label>
                  <input
                    type="number"
                    value={settings.referral_lvl3_pct || 2}
                    onChange={(e) => setSettings({ ...settings, referral_lvl3_pct: e.target.value })}
                    className="w-full bg-white border border-emerald-300 rounded-xl px-3 py-2 text-slate-900 text-xs font-mono font-black focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Withdrawal Fee / Tax (%)</label>
              <input
                type="number"
                value={settings.withdrawal_fee_percent || 10}
                onChange={(e) => setSettings({ ...settings, withdrawal_fee_percent: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-xs font-mono focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md cursor-pointer"
            >
              Save Platform Settings
            </button>
          </form>
        </div>
      )}

      {/* MASTER USER EDITOR MODAL (100% Full Admin Control) */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setEditingUser(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-black uppercase">
                MASTER USER EDITOR (FULL CONTROL)
              </span>
              <h3 className="text-xl font-black text-slate-900 mt-1">Edit User: {editingUser.name}</h3>
              <p className="text-xs text-slate-500 font-mono">{editingUser.email}</p>
            </div>

            <form onSubmit={handleSaveUserEdits} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Full Legal Name</label>
                  <input
                    type="text"
                    required
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Reset Login Password</label>
                  <input
                    type="text"
                    placeholder="Leave blank to keep unchanged"
                    value={editFormData.password}
                    onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-xs font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Reset Withdrawal Password / PIN</label>
                  <input
                    type="text"
                    placeholder="Set new withdrawal PIN"
                    value={editFormData.withdrawal_password}
                    onChange={(e) => setEditFormData({ ...editFormData, withdrawal_password: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-xs font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Saved USDT Address</label>
                  <input
                    type="text"
                    placeholder="User default USDT address"
                    value={editFormData.saved_usdt_address}
                    onChange={(e) => setEditFormData({ ...editFormData, saved_usdt_address: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-xs font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Saved USDT Network</label>
                  <select
                    value={editFormData.saved_usdt_network}
                    onChange={(e) => setEditFormData({ ...editFormData, saved_usdt_network: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-xs font-bold focus:outline-none"
                  >
                    <option value="TRC-20">TRC-20</option>
                    <option value="BEP-20">BEP-20</option>
                    <option value="ERC-20">ERC-20</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Spot Wallet Balance ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editFormData.wallet_balance}
                    onChange={(e) => setEditFormData({ ...editFormData, wallet_balance: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 font-mono text-sm font-black focus:outline-none text-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Account Login Status</label>
                  <select
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-xs font-bold focus:outline-none"
                  >
                    <option value="ACTIVE">ACTIVE (Allowed to trade & login)</option>
                    <option value="BANNED">BANNED (Blocked from login)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Trade Outcome Mode</label>
                  <select
                    value={editFormData.trade_mode}
                    onChange={(e) => setEditFormData({ ...editFormData, trade_mode: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-xs font-bold focus:outline-none"
                  >
                    <option value="AUTO">AUTO (Calculated via Signal / Win Rate)</option>
                    <option value="FORCE_WIN">FORCE WIN (User wins every trade)</option>
                    <option value="FORCE_LOSS">FORCE LOSS (User loses every trade)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Custom Win Rate: {Math.round((editFormData.custom_win_rate || 0.5) * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={editFormData.custom_win_rate}
                    onChange={(e) => setEditFormData({ ...editFormData, custom_win_rate: Number(e.target.value) })}
                    className="w-full accent-blue-600 mt-2 cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="flex-1 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md cursor-pointer"
                >
                  Save All User Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INSPECTED USER MODAL */}
      {inspectedUser && userDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-3xl bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setInspectedUser(null);
                setUserDetails(null);
              }}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-black uppercase">
                DEEP USER INSPECTION
              </span>
              <h3 className="text-xl font-black text-slate-900 mt-1">{inspectedUser.name}</h3>
              <p className="text-xs text-slate-500 font-mono">{inspectedUser.email} • Joined: {new Date(inspectedUser.created_at).toLocaleDateString()}</p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Spot Wallet</p>
                <p className="text-lg font-black font-mono text-emerald-600">${Number(inspectedUser.wallet_balance).toFixed(2)}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <p className="text-[10px] font-bold text-slate-400 uppercase">KYC</p>
                <p className="text-lg font-black font-mono text-blue-600">{inspectedUser.kyc_status}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Ref Code</p>
                <p className="text-lg font-black font-mono text-blue-600">{inspectedUser.referral_code}</p>
              </div>
            </div>

            {/* User Trades History */}
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase text-slate-700">Executed Option Trades ({userDetails.trades?.length || 0})</h4>
              <div className="max-h-40 overflow-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-50 text-slate-400 font-bold">
                    <tr>
                      <th className="p-2">Pair</th>
                      <th className="p-2">Type</th>
                      <th className="p-2">Amount</th>
                      <th className="p-2">Outcome</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {userDetails.trades.map((t) => (
                      <tr key={t.id}>
                        <td className="p-2 font-bold">{t.pair}</td>
                        <td className="p-2">{t.type}</td>
                        <td className="p-2 font-mono">${t.amount}</td>
                        <td className="p-2 font-bold text-emerald-600">{t.result}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RECEIPT MODAL */}
      {receiptModalUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div className="relative max-w-2xl w-full bg-white rounded-3xl p-6 text-center space-y-4 border border-slate-200">
            <button
              onClick={() => setReceiptModalUrl('')}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-extrabold text-slate-900 text-base">Uploaded Payment Proof</h3>
            <div className="max-h-[70vh] overflow-auto rounded-xl border border-slate-200">
              <img src={receiptModalUrl} alt="Receipt" className="w-full object-contain mx-auto" />
            </div>
          </div>
        </div>
      )}

      {/* ADMIN EDIT MESSAGE MODAL */}
      {adminEditingMsg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl max-w-md w-full space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-black text-slate-900">Admin Edit Message</h3>
              <button onClick={() => setAdminEditingMsg(null)}><X className="w-4 h-4" /></button>
            </div>
            <textarea
              rows="3"
              value={adminEditText}
              onChange={(e) => setAdminEditText(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none"
            />
            <div className="flex gap-2">
              <button onClick={() => setAdminEditingMsg(null)} className="flex-1 py-2.5 rounded-xl bg-slate-100 text-xs font-bold">Cancel</button>
              <button onClick={handleAdminSaveEdit} className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN DELETE MESSAGE MODAL */}
      {adminDeletingMsg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl max-w-sm w-full text-center space-y-4">
            <h3 className="text-base font-black text-slate-900">Delete Support Message?</h3>
            <div className="space-y-2">
              <button
                onClick={() => handleAdminDeleteMessage('for_everyone')}
                className="w-full py-2.5 rounded-xl bg-rose-600 text-white font-extrabold text-xs"
              >
                Delete for Everyone
              </button>
              <button
                onClick={() => handleAdminDeleteMessage('for_me')}
                className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-700 font-extrabold text-xs"
              >
                Delete for Admin Only
              </button>
              <button onClick={() => setAdminDeletingMsg(null)} className="text-xs text-slate-400">Cancel</button>
            </div>
          </div>
        </div>
      )}
      </main>
    </div>
  );
}
