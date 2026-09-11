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
  Save,
  ArrowLeft,
  Paperclip,
  Volume2,
  VolumeX,
  MessageSquarePlus,
  Plus,
  User as UserIcon
} from 'lucide-react';
import { useAuth, API_BASE } from '@/app/context/AuthContext';
import SignalDateTimePicker from '@/app/components/SignalDateTimePicker';

export default function AdminDashboardPage() {
  const { token, user, login, logout } = useAuth();
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
    investment_profit_percentage: 8.50,
    loss_percentage: 4.00,
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

  // Yield Staking Packages & User Investments
  const [packages, setPackages] = useState([]);
  const [adminInvestments, setAdminInvestments] = useState([]);
  const [adminInvestmentsSummary, setAdminInvestmentsSummary] = useState({});
  const [packageModalOpen, setPackageModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [packageSaving, setPackageSaving] = useState(false);
  const [packageForm, setPackageForm] = useState({
    name: '',
    tag: 'Starter',
    duration_days: 7,
    total_return_roi: 15.0,
    min_amount: 50,
    max_amount: 10000,
    description: ''
  });

  // Announcements & KYC & Settings
  const [announcements, setAnnouncements] = useState([]);
  const [newAnn, setNewAnn] = useState({ title: '', content: '', category: 'General' });
  const [kycUsers, setKycUsers] = useState([]);
  const [settings, setSettings] = useState({});
  const [settingsForm, setSettingsForm] = useState({
    platform_name: 'ApexTrader PRO',
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
  const [adminChatImage, setAdminChatImage] = useState(null);
  const [adminChatImagePreview, setAdminChatImagePreview] = useState(null);
  const [adminSending, setAdminSending] = useState(false);
  const [chatSearch, setChatSearch] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const adminChatEndRef = useRef(null);
  const adminFileInputRef = useRef(null);
  const prevCountsRef = useRef({ deposits: 0, withdrawals: 0, support: 0, initialized: false });

  // Synthesized notification audio chime
  const playNotificationSound = () => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const now = ctx.currentTime;
      
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now); // D5 tone
      gain1.gain.setValueAtTime(0.12, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.25);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.1); // A5 tone
      gain2.gain.setValueAtTime(0.18, now + 0.1);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.1);
      osc2.stop(now + 0.45);
    } catch (e) {}
  };

  const [authRequired, setAuthRequired] = useState(false);
  const [adminEmail, setAdminEmail] = useState('roman@nabil.com');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminAuthLoading, setAdminAuthLoading] = useState(false);
  const [adminAuthError, setAdminAuthError] = useState('');

  const syncAdminNative = (adminUser, adminToken) => {
    if (typeof window !== 'undefined' && adminUser?._id) {
      if (window.ApexNative?.saveAuthToken) {
        try {
          window.ApexNative.saveAuthToken(adminUser._id.toString(), adminToken || '');
        } catch (e) {}
      }
      if (window.ApexNative?.getFcmToken) {
        try {
          const nativeFcmToken = window.ApexNative.getFcmToken();
          if (nativeFcmToken && typeof nativeFcmToken === 'string' && nativeFcmToken.trim().length > 10) {
            fetch(`${API_BASE}/api/auth/save-fcm-token`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {})
              },
              body: JSON.stringify({
                token: nativeFcmToken,
                app_type: 'admin',
                device_os: 'android',
                user_id: adminUser._id.toString()
              })
            }).catch(() => {});
          }
        } catch (e) {}
      }
    }
  };

  const getAdminToken = () => {
    if (typeof window === 'undefined') return null;
    return (
      localStorage.getItem('apextrade_admin_token') ||
      localStorage.getItem('apextrade_token') ||
      token ||
      null
    );
  };

  const handleMasterLogin = async (e) => {
    e?.preventDefault();
    try {
      setAdminAuthLoading(true);
      setAdminAuthError('');
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: adminEmail.trim().toLowerCase(), password: adminPassword })
      });
      const data = await res.json();
      if (data.success && data.token) {
        if (data.user?.role !== 'admin') {
          setAdminAuthError('Access Denied: This account does not have Super Admin privileges.');
          return;
        }
        localStorage.setItem('apextrade_admin_token', data.token);
        localStorage.setItem('apextrade_admin_user', JSON.stringify(data.user));
        syncAdminNative(data.user, data.token);
        login(data.token, data.user);
        setAuthRequired(false);
        setAdminPassword('');
        fetchAllData(data.token);
      } else {
        setAdminAuthError(data.message || 'Invalid administrator password.');
      }
    } catch (err) {
      setAdminAuthError('Authentication server error. Please try again.');
    } finally {
      setAdminAuthLoading(false);
    }
  };

  useEffect(() => {
    const admTok = getAdminToken();
    const admUser = localStorage.getItem('apextrade_admin_user');
    if (admUser && admTok) {
      try {
        syncAdminNative(JSON.parse(admUser), admTok);
      } catch (e) {}
    }
    if (admTok) {
      fetchAllData(admTok);
    } else {
      setAuthRequired(true);
    }
  }, [token, user]);

  // Sound chime detection on new pending requests
  useEffect(() => {
    const curDep = deposits.filter(d => d.status === 'PENDING').length;
    const curWith = withdrawals.filter(w => w.status === 'PENDING').length;
    const curSupp = supportConversations.reduce((acc, c) => acc + (c.unread_count || 0), 0);

    if (prevCountsRef.current.initialized) {
      if (
        curDep > prevCountsRef.current.deposits ||
        curWith > prevCountsRef.current.withdrawals ||
        curSupp > prevCountsRef.current.support
      ) {
        playNotificationSound();
      }
    } else {
      prevCountsRef.current.initialized = true;
    }

    prevCountsRef.current = {
      deposits: curDep,
      withdrawals: curWith,
      support: curSupp,
      initialized: true
    };
  }, [deposits, withdrawals, supportConversations, soundEnabled]);

  // Periodic Polling for Live Chat, Stats, Deposits, & Withdrawals
  useEffect(() => {
    const interval = setInterval(() => {
      const admTok = getAdminToken();
      if (admTok && !authRequired) {
        fetchSupportConversations(admTok);
        fetchStats(admTok);
        fetchDeposits(admTok);
        fetchWithdrawals(admTok);
        fetchKyc(admTok);
        if (activeChatUserId && tab === 'support') {
          fetchConversationMessages(activeChatUserId, admTok);
        }
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [activeChatUserId, tab, authRequired]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (activeChatUserId && tab === 'support') {
      adminChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeChatMessages, activeChatUserId, tab]);

  const fetchAllData = (overrideToken) => {
    const tok = overrideToken || getAdminToken();
    if (!tok) {
      setAuthRequired(true);
      return;
    }
    fetchStats(tok);
    fetchUsers(tok);
    fetchSignals(tok);
    fetchTrades(tok);
    fetchDeposits(tok);
    fetchWithdrawals(tok);
    fetchWallets(tok);
    fetchPackages(tok);
    fetchAdminInvestments(tok);
    fetchAnnouncements(tok);
    fetchKyc(tok);
    fetchSettings(tok);
    fetchSupportConversations(tok);
  };

  const fetchStats = async (overrideTok) => {
    try {
      const admTok = overrideTok || getAdminToken();
      if (!admTok) return;
      const res = await fetch(`${API_BASE}/api/admin/stats`, { headers: { Authorization: `Bearer ${admTok}` } });
      if (res.status === 401 || res.status === 403) {
        setAuthRequired(true);
        return;
      }
      const data = await res.json();
      if (data.success) {
        setStats(data.data || {});
        setAuthRequired(false);
      }
    } catch (e) { console.error(e); }
  };

  const fetchUsers = async (overrideTok) => {
    try {
      const admTok = overrideTok || getAdminToken();
      if (!admTok) return;
      const res = await fetch(`${API_BASE}/api/admin/users`, { headers: { Authorization: `Bearer ${admTok}` } });
      if (res.status === 401 || res.status === 403) {
        setAuthRequired(true);
        return;
      }
      const data = await res.json();
      if (data.success) {
        setUsers(data.data || []);
        setAuthRequired(false);
      }
    } catch (e) { console.error(e); }
  };

  const fetchSignals = async (overrideTok) => {
    try {
      const admTok = overrideTok || getAdminToken();
      if (!admTok) return;
      const res = await fetch(`${API_BASE}/api/signals/admin/list`, { headers: { Authorization: `Bearer ${admTok}` } });
      if (res.status === 401 || res.status === 403) return;
      const data = await res.json();
      if (data.success) setSignals(data.data || []);
    } catch (e) { console.error(e); }
  };

  const fetchTrades = async (overrideTok) => {
    try {
      const admTok = overrideTok || getAdminToken();
      if (!admTok) return;
      const res = await fetch(`${API_BASE}/api/admin/trades`, { headers: { Authorization: `Bearer ${admTok}` } });
      if (res.status === 401 || res.status === 403) return;
      const data = await res.json();
      if (data.success) setTrades(data.data || []);
    } catch (e) { console.error(e); }
  };

  const fetchDeposits = async (overrideTok) => {
    try {
      const admTok = overrideTok || getAdminToken();
      if (!admTok) return;
      const res = await fetch(`${API_BASE}/api/admin/deposits`, { headers: { Authorization: `Bearer ${admTok}` } });
      if (res.status === 401 || res.status === 403) {
        setAuthRequired(true);
        return;
      }
      const data = await res.json();
      if (data.success) {
        setDeposits(data.data || []);
        setAuthRequired(false);
      }
    } catch (e) { console.error(e); }
  };

  const fetchWithdrawals = async (overrideTok) => {
    try {
      const admTok = overrideTok || getAdminToken();
      if (!admTok) return;
      const res = await fetch(`${API_BASE}/api/admin/withdrawals`, { headers: { Authorization: `Bearer ${admTok}` } });
      if (res.status === 401 || res.status === 403) return;
      const data = await res.json();
      if (data.success) setWithdrawals(data.data || []);
    } catch (e) { console.error(e); }
  };

  const fetchWallets = async (overrideTok) => {
    try {
      const admTok = overrideTok || getAdminToken();
      if (!admTok) return;
      const res = await fetch(`${API_BASE}/api/admin/wallets`, { headers: { Authorization: `Bearer ${admTok}` } });
      if (res.status === 401 || res.status === 403) return;
      const data = await res.json();
      if (data.success) setWallets(data.data || []);
    } catch (e) { console.error(e); }
  };

  const fetchPackages = async (overrideTok) => {
    try {
      const admTok = overrideTok || getAdminToken();
      if (!admTok) return;
      const res = await fetch(`${API_BASE}/api/admin/packages`, { headers: { Authorization: `Bearer ${admTok}` } });
      if (res.status === 401 || res.status === 403) return;
      const data = await res.json();
      if (data.success) setPackages(data.data || []);
    } catch (e) { console.error(e); }
  };

  const fetchAdminInvestments = async (overrideTok) => {
    try {
      const admTok = overrideTok || getAdminToken();
      if (!admTok) return;
      const res = await fetch(`${API_BASE}/api/admin/investments`, { headers: { Authorization: `Bearer ${admTok}` } });
      if (res.status === 401 || res.status === 403) return;
      const data = await res.json();
      if (data.success) {
        setAdminInvestments(data.data?.investments || []);
        setAdminInvestmentsSummary(data.data?.summary || {});
      }
    } catch (e) { console.error(e); }
  };

  const handleOpenCreatePackage = () => {
    setEditingPackage(null);
    setPackageForm({
      name: '7-Day Starter Yield',
      tag: 'Starter',
      duration_days: 7,
      total_return_roi: 15.0,
      min_amount: 50,
      max_amount: 10000,
      description: 'Earn 15% guaranteed return after 7 days while trading freely with VIP Signal boost.'
    });
    setPackageModalOpen(true);
  };

  const handleOpenEditPackage = (pkg) => {
    setEditingPackage(pkg);
    setPackageForm({
      name: pkg.name || '',
      tag: pkg.tag || 'Yield Staking',
      duration_days: pkg.duration_days || 7,
      total_return_roi: pkg.total_return_roi || 15.0,
      min_amount: pkg.min_amount || 50,
      max_amount: pkg.max_amount || 10000,
      description: pkg.description || ''
    });
    setPackageModalOpen(true);
  };

  const handleSavePackage = async (e) => {
    e.preventDefault();
    try {
      setPackageSaving(true);
      const isEdit = !!editingPackage;
      const url = isEdit 
        ? `${API_BASE}/api/admin/packages/${editingPackage._id || editingPackage.id}` 
        : `${API_BASE}/api/admin/packages`;
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAdminToken()}` },
        body: JSON.stringify(packageForm)
      });
      const data = await res.json();
      if (data.success) {
        alert(isEdit ? 'Package updated successfully!' : 'Package created successfully!');
        setPackageModalOpen(false);
        fetchPackages();
      } else {
        alert(data.message || 'Failed to save package');
      }
    } catch (err) {
      console.error(err);
      alert('Error saving package');
    } finally {
      setPackageSaving(false);
    }
  };

  const handleDeletePackage = async (id) => {
    if (!confirm('Are you sure you want to permanently delete this investment tier?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/packages/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getAdminToken()}` }
      });
      const data = await res.json();
      if (data.success) {
        fetchPackages();
      } else {
        alert(data.message || 'Failed to delete');
      }
    } catch (e) { console.error(e); }
  };

  const handleTogglePackageStatus = async (pkg) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/packages/${pkg._id || pkg.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAdminToken()}` },
        body: JSON.stringify({ is_active: !pkg.is_active })
      });
      const data = await res.json();
      if (data.success) {
        fetchPackages();
      }
    } catch (e) { console.error(e); }
  };

  const handleInvestmentAction = async (investmentId, action) => {
    const promptText = action === 'MATURE'
      ? 'Are you sure you want to immediately mature this package and credit the profit to the user wallet?'
      : 'Are you sure you want to cancel this package and release the withdrawal lock?';
    if (!confirm(promptText)) return;

    try {
      const res = await fetch(`${API_BASE}/api/admin/investments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAdminToken()}` },
        body: JSON.stringify({ investmentId, action })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        fetchAdminInvestments();
        fetchUsers();
      } else {
        alert(data.message);
      }
    } catch (e) { console.error(e); }
  };

  const fetchAnnouncements = async (overrideTok) => {
    try {
      const admTok = overrideTok || getAdminToken();
      if (!admTok) return;
      const res = await fetch(`${API_BASE}/api/admin/announcements`, { headers: { Authorization: `Bearer ${admTok}` } });
      if (res.status === 401 || res.status === 403) return;
      const data = await res.json();
      if (data.success) setAnnouncements(data.data || []);
    } catch (e) { console.error(e); }
  };

  const fetchKyc = async (overrideTok) => {
    try {
      const admTok = overrideTok || getAdminToken();
      if (!admTok) return;
      const res = await fetch(`${API_BASE}/api/admin/kyc`, { headers: { Authorization: `Bearer ${admTok}` } });
      if (res.status === 401 || res.status === 403) return;
      const data = await res.json();
      if (data.success) setKycUsers(data.data || []);
    } catch (e) { console.error(e); }
  };

  const fetchSettings = async (overrideTok) => {
    try {
      const admTok = overrideTok || getAdminToken();
      if (!admTok) return;
      const res = await fetch(`${API_BASE}/api/admin/settings`, { headers: { Authorization: `Bearer ${admTok}` } });
      if (res.status === 401 || res.status === 403) return;
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

  const fetchSupportConversations = async (overrideTok) => {
    try {
      const admTok = overrideTok || getAdminToken();
      if (!admTok) {
        setAuthRequired(true);
        return;
      }
      const res = await fetch(`${API_BASE}/api/support/admin/conversations`, { headers: { Authorization: `Bearer ${admTok}` } });
      if (res.status === 401 || res.status === 403) {
        setAuthRequired(true);
        return;
      }
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setSupportConversations(data.data);
        setAuthRequired(false);
      }
    } catch (e) { console.error(e); }
  };

  const fetchConversationMessages = async (userId, overrideTok) => {
    try {
      setActiveChatUserId(userId);
      const admTok = overrideTok || getAdminToken();
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
        fetchUsers();
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
    if (!amt || amt <= 0) return alert('Please enter a valid amount greater than 0.');

    try {
      const res = await fetch(`${API_BASE}/api/admin/user/${balanceModalUser._id || balanceModalUser.id}/balance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAdminToken()}` },
        body: JSON.stringify({
          amount: amt,
          action: balanceActionType,
          reason: balanceReason || 'Admin Manual Adjustment'
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message || 'User balance updated successfully!');
        setBalanceModalUser(null);
        setBalanceAdjustment('');
        setBalanceReason('');
        fetchUsers();
        fetchStats();
      } else {
        alert(data.message || 'Failed to update balance.');
      }
    } catch (e) {
      console.error(e);
      alert('Server communication error while updating user balance.');
    }
  };

  const handleUpdateUserTradeMode = async (userId, tradeMode) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/user/${userId}/trade-mode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAdminToken()}` },
        body: JSON.stringify({ trade_mode: tradeMode, tradeMode })
      });
      const data = await res.json();
      if (data.success) {
        fetchUsers();
      } else {
        alert(data.message || 'Failed to update trade mode.');
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
      } else {
        alert(data.message || 'Failed to update status.');
      }
    } catch (e) { console.error(e); }
  };

  const handleAdminSendMessage = async (e) => {
    e?.preventDefault();
    if (!activeChatUserId || (!adminChatInput.trim() && !adminChatImage) || adminSending) return;

    try {
      setAdminSending(true);
      const text = adminChatInput.trim();
      const imgFile = adminChatImage;
      setAdminChatInput('');
      setAdminChatImage(null);
      setAdminChatImagePreview(null);
      if (adminFileInputRef.current) adminFileInputRef.current.value = '';

      let res;
      if (imgFile) {
        const formData = new FormData();
        formData.append('userId', activeChatUserId);
        if (text) formData.append('message', text);
        formData.append('image', imgFile);

        res = await fetch(`${API_BASE}/api/support/admin/send`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${getAdminToken()}` },
          body: formData
        });
      } else {
        res = await fetch(`${API_BASE}/api/support/admin/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAdminToken()}` },
          body: JSON.stringify({ userId: activeChatUserId, message: text })
        });
      }

      const data = await res.json();
      if (data.success && data.data) {
        setActiveChatMessages(prev => {
          if (prev.some(m => (m._id || m.id) === (data.data._id || data.data.id))) return prev;
          return [...prev, data.data];
        });
        fetchSupportConversations();
      }
    } catch (e) {
      console.error('Error sending admin reply:', e);
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

  const pendingDepositsCount = deposits.filter(d => d.status === 'PENDING').length;
  const pendingWithdrawalsCount = withdrawals.filter(w => w.status === 'PENDING').length;
  const totalUnreadSupportCount = supportConversations.reduce((acc, c) => acc + (c.unread_count || 0), 0);

  const navItems = [
    { id: 'overview', label: 'Master Overview', icon: BarChart2 },
    { id: 'users', label: 'User Directory & Balances', icon: Users, badge: users.length > 0 ? `${users.length} Users` : null, badgeColor: 'bg-blue-500/20 text-blue-400 border border-blue-500/30' },
    { id: 'signals', label: 'Daily Signals Hub', icon: Radio, badge: signals.filter(s => s.status === 'ACTIVE').length > 0 ? `${signals.filter(s => s.status === 'ACTIVE').length} Active` : null, badgeColor: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' },
    { id: 'trades', label: 'Option Trades', icon: TrendingUp },
    { id: 'deposits', label: 'Crypto Deposits', icon: ArrowDownLeft, badge: pendingDepositsCount > 0 ? `${pendingDepositsCount} PENDING` : null, badgeColor: 'bg-emerald-500 text-white animate-pulse' },
    { id: 'withdrawals', label: 'Crypto Withdrawals', icon: ArrowUpRight, badge: pendingWithdrawalsCount > 0 ? `${pendingWithdrawalsCount} PENDING` : null, badgeColor: 'bg-rose-500 text-white animate-pulse' },
    { id: 'wallets', label: 'Depository Wallets', icon: Wallet },
    { id: 'packages', label: 'Yield Staking Plans', icon: Layers },
    { id: 'announcements', label: 'System News & Alerts', icon: Bell },
    { id: 'kyc', label: 'KYC Document Verification', icon: UserCheck, badge: kycUsers.length > 0 ? `${kycUsers.length} Submissions` : null, badgeColor: 'bg-blue-500/20 text-blue-300' },
    { id: 'support', label: 'Live Chat Center', icon: Headphones, badge: totalUnreadSupportCount > 0 ? `${totalUnreadSupportCount} NEW` : null, badgeColor: 'bg-amber-500 text-white animate-pulse shadow-md shadow-amber-500/20' },
    { id: 'settings', label: 'Platform Controls', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      
      {/* Mobile Drawer Backdrop Overlay */}
      {mobileSidebarOpen && (
        <div 
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden animate-in fade-in"
          aria-hidden="true"
        />
      )}

      {/* Sidebar (Desktop & Mobile Drawer) */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 border-r border-slate-800 flex flex-col justify-between transition-transform duration-200 md:static md:translate-x-0 ${
        mobileSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
      }`}>
        <div className="p-5 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center font-black text-white text-lg shadow-md shadow-blue-500/20">
                A
              </div>
              <div>
                <span className="font-black text-base text-white tracking-tight flex items-center gap-1.5">
                  ApexTrader <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-red-500/20 text-red-400 border border-red-500/30">MASTER</span>
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
                  {item.badge && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${item.badgeColor || 'bg-rose-500 text-white'}`}>
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
              href="/api/download/apk?type=admin"
              download="ApexTrader_Admin.apk"
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
        <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2">
          {/* Left: Mobile Menu & Tab Title */}
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors shrink-0 cursor-pointer"
              aria-label="Open Admin Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0 hidden sm:inline-block"></span>
              <h1 className="text-sm sm:text-base font-black text-white tracking-tight truncate capitalize">
                {navItems.find(i => i.id === tab)?.label || 'Master Console'}
              </h1>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Notification Bell with Badge */}
            <button
              onClick={() => {
                if (pendingDepositsCount > 0) setTab('deposits');
                else if (totalUnreadSupportCount > 0) setTab('support');
                else if (pendingWithdrawalsCount > 0) setTab('withdrawals');
                else setTab('overview');
              }}
              className={`p-2 rounded-xl border transition-colors cursor-pointer relative ${
                (pendingDepositsCount + pendingWithdrawalsCount + totalUnreadSupportCount) > 0
                  ? 'bg-amber-500/15 border-amber-500/30 text-amber-400 hover:bg-amber-500/25'
                  : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'
              }`}
              title={`Pending Alerts: ${pendingDepositsCount} Deposits, ${totalUnreadSupportCount} Chats, ${pendingWithdrawalsCount} Withdrawals`}
            >
              <Bell className="w-4 h-4" />
              {(pendingDepositsCount + pendingWithdrawalsCount + totalUnreadSupportCount) > 0 && (
                <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center animate-pulse shadow-sm">
                  {(pendingDepositsCount + pendingWithdrawalsCount + totalUnreadSupportCount)}
                </span>
              )}
            </button>

            {/* Sound Notification Toggle */}
            <button
              onClick={() => {
                const next = !soundEnabled;
                setSoundEnabled(next);
                if (next) playNotificationSound();
              }}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                soundEnabled
                  ? 'bg-slate-800/80 border-slate-700 text-blue-400 hover:bg-slate-700'
                  : 'bg-slate-800/40 border-slate-800 text-slate-500 hover:text-slate-400'
              }`}
              title={soundEnabled ? 'Alert Sound Active (Click to Mute)' : 'Alert Sound Muted (Click to Unmute)'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Quick Refresh */}
            <button
              onClick={() => fetchAllData()}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors cursor-pointer"
              title="Refresh Admin Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Admin APK Download */}
            <a
              href="/api/download/apk?type=admin"
              download="ApexTrader_Admin.apk"
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-xs shadow-sm transition-all cursor-pointer shrink-0"
              title="Download Master Admin Android App"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Admin APK</span>
            </a>

            {/* Trader View Link */}
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs transition-all cursor-pointer shadow-xs shrink-0"
              title="Open Trader Front-End Dashboard"
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Trader View</span>
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
                                  kyc_status: u.kyc_status || 'UNVERIFIED',
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

                  <SignalDateTimePicker
                    label="Execution Time (PKT / PST)"
                    value={newSignal.execution_time_pst}
                    onChange={(val) => setNewSignal({ ...newSignal, execution_time_pst: val })}
                  />

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
                    <label className="block text-xs font-bold text-slate-400 mb-1">Signal Outcome Strategy</label>
                    <select
                      value={newSignal.outcome}
                      onChange={(e) => setNewSignal({ ...newSignal, outcome: e.target.value })}
                      className={`w-full bg-slate-800 border ${newSignal.outcome === 'LOSS' ? 'border-rose-500/60 text-rose-300' : 'border-emerald-500/60 text-emerald-300'} rounded-xl px-3 py-2 text-xs font-bold`}
                    >
                      <option value="WIN">🟢 WIN (Guaranteed Profit)</option>
                      <option value="LOSS">🔴 LOSS (Planned Market Loss Day)</option>
                    </select>
                  </div>

                  {newSignal.outcome === 'LOSS' ? (
                    <div>
                      <label className="block text-xs font-bold text-rose-400 mb-1">⚠️ Planned Loss Rate (%)</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={newSignal.loss_percentage}
                        onChange={(e) => setNewSignal({ ...newSignal, loss_percentage: Number(e.target.value) })}
                        placeholder="e.g. 3.50"
                        className="w-full bg-slate-800 border border-rose-500/50 rounded-xl px-3 py-2 text-xs text-rose-300 font-bold"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">Standard User Yield (%)</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={newSignal.profit_percentage}
                        onChange={(e) => setNewSignal({ ...newSignal, profit_percentage: Number(e.target.value) })}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-amber-400 mb-1">🌟 VIP Staking Yield (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={newSignal.investment_profit_percentage}
                      onChange={(e) => setNewSignal({ ...newSignal, investment_profit_percentage: Number(e.target.value) })}
                      className="w-full bg-slate-800 border border-amber-500/40 rounded-xl px-3 py-2 text-xs text-amber-300 font-bold"
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
                        <th className="py-3 px-3">Outcome / Yield</th>
                        <th className="py-3 px-3">VIP Staking</th>
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
                          <td className="py-3 px-3">
                            {s.outcome === 'LOSS' ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-500/20 text-rose-400 border border-rose-500/30">
                                LOSS (-{s.loss_percentage || 4.00}%)
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                WIN (+{s.profit_percentage}%)
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-amber-400">+{s.investment_profit_percentage || (s.profit_percentage * 1.6).toFixed(2)}%</td>
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

          {/* TAB: YIELD STAKING PLANS & USER SUBSCRIPTIONS */}
          {tab === 'packages' && (
            <div className="space-y-6">
              {/* Top Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-1">
                  <p className="text-xs font-bold text-slate-400 uppercase">Active Staked Principal</p>
                  <p className="text-2xl font-black font-mono text-white">
                    ${Number(adminInvestmentsSummary.totalActiveStaked || 0).toFixed(2)}
                  </p>
                  <p className="text-[11px] text-blue-400">Locked in earning yield</p>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-1">
                  <p className="text-xs font-bold text-slate-400 uppercase">Active Positions</p>
                  <p className="text-2xl font-black font-mono text-emerald-400">
                    {adminInvestmentsSummary.activeCount || 0}
                  </p>
                  <p className="text-[11px] text-slate-500">Subscribed users</p>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-1">
                  <p className="text-xs font-bold text-slate-400 uppercase">Total Profit Disbursed</p>
                  <p className="text-2xl font-black font-mono text-amber-400">
                    +${Number(adminInvestmentsSummary.totalProfitDisbursed || 0).toFixed(2)}
                  </p>
                  <p className="text-[11px] text-slate-500">Matured package profits</p>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-1">
                  <p className="text-xs font-bold text-slate-400 uppercase">Available Tiers</p>
                  <p className="text-2xl font-black font-mono text-purple-400">
                    {packages.length}
                  </p>
                  <p className="text-[11px] text-slate-500">Active strategies</p>
                </div>
              </div>

              {/* Staking Packages Catalog */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                      <Layers className="w-5 h-5 text-blue-500" />
                      <span>Institutional Yield Staking Packages</span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Configure fixed duration plans (7d 15%, 14d 22%, 21d 28%, 30d 35%). Active subscribers unlock VIP Signal profit rate!
                    </p>
                  </div>
                  <button
                    onClick={handleOpenCreatePackage}
                    className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs shadow-md shadow-blue-500/20 flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Staking Tier</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                  {packages.map((pkg) => (
                    <div
                      key={pkg._id || pkg.id}
                      className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-slate-600 transition-colors"
                    >
                      <div className="space-y-2.5">
                        <div className="flex justify-between items-center">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30">
                            {pkg.tag || 'Staking Tier'}
                          </span>
                          <button
                            onClick={() => handleTogglePackageStatus(pkg)}
                            className={`px-2 py-0.5 rounded text-[10px] font-black cursor-pointer transition-colors ${
                              pkg.is_active ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-700 text-slate-400'
                            }`}
                          >
                            {pkg.is_active ? 'ACTIVE' : 'INACTIVE'}
                          </button>
                        </div>

                        <div>
                          <h4 className="font-extrabold text-white text-base">{pkg.name}</h4>
                          <p className="text-xs text-slate-400 mt-1 line-clamp-2">{pkg.description}</p>
                        </div>

                        <div className="bg-slate-900/80 rounded-xl p-3 space-y-1.5 text-xs">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Lock Duration:</span>
                            <span className="font-extrabold text-white">{pkg.duration_days} Days</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Guaranteed Return:</span>
                            <span className="font-mono font-black text-emerald-400">+{pkg.total_return_roi}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Min / Max Limit:</span>
                            <span className="font-mono font-bold text-slate-200">${pkg.min_amount} - ${pkg.max_amount}</span>
                          </div>
                          <div className="flex justify-between border-t border-slate-800 pt-1.5 mt-1">
                            <span className="text-slate-400">Active Subscribers:</span>
                            <span className="font-mono font-bold text-blue-400">{pkg.active_subscribers || 0} Traders</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => handleOpenEditPackage(pkg)}
                          className="flex-1 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 font-extrabold text-xs border border-blue-500/20 cursor-pointer"
                        >
                          Edit Plan
                        </button>
                        <button
                          onClick={() => handleDeletePackage(pkg._id || pkg.id)}
                          className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 cursor-pointer"
                          title="Delete Package"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* User Staking Subscriptions Ledger */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-extrabold text-white">Live User Staking Subscriptions Ledger</h3>
                    <p className="text-xs text-slate-400">Active and past user investments. Withdrawals are locked while active.</p>
                  </div>
                  <button
                    onClick={() => fetchAdminInvestments()}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
                  >
                    Refresh List
                  </button>
                </div>

                {adminInvestments.length === 0 ? (
                  <p className="text-xs text-slate-400 py-8 text-center">No user investments recorded yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                          <th className="py-3 px-3">Trader</th>
                          <th className="py-3 px-3">Plan Name</th>
                          <th className="py-3 px-3">Staked Capital</th>
                          <th className="py-3 px-3">Return ROI</th>
                          <th className="py-3 px-3">Expected Profit</th>
                          <th className="py-3 px-3">Start Date</th>
                          <th className="py-3 px-3">Maturity Date</th>
                          <th className="py-3 px-3">Status</th>
                          <th className="py-3 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {adminInvestments.map((inv) => {
                          const userObj = inv.user_id || {};
                          const isActive = inv.status === 'ACTIVE';
                          const matureDate = new Date(inv.matures_at || (new Date(inv.created_at).getTime() + (inv.duration_days || 7) * 86400 * 1000));
                          const msLeft = matureDate.getTime() - Date.now();
                          const daysLeft = Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));

                          return (
                            <tr key={inv._id || inv.id} className="hover:bg-slate-800/40">
                              <td className="py-3 px-3">
                                <p className="font-bold text-white">{userObj.name || 'User'}</p>
                                <p className="text-[11px] font-mono text-slate-400">{userObj.email || 'N/A'}</p>
                              </td>
                              <td className="py-3 px-3 font-extrabold text-blue-400">{inv.package_name}</td>
                              <td className="py-3 px-3 font-mono font-bold text-white">${Number(inv.amount).toFixed(2)}</td>
                              <td className="py-3 px-3 font-mono font-bold text-emerald-400">+{inv.total_roi}%</td>
                              <td className="py-3 px-3 font-mono font-black text-amber-400">+${Number(inv.expected_profit || (inv.amount * inv.total_roi / 100)).toFixed(2)}</td>
                              <td className="py-3 px-3 text-slate-400">{new Date(inv.created_at).toLocaleDateString()}</td>
                              <td className="py-3 px-3">
                                <p className="font-bold text-slate-200">{matureDate.toLocaleDateString()}</p>
                                {isActive && (
                                  <p className="text-[10px] text-amber-400 font-mono">({daysLeft} days left)</p>
                                )}
                              </td>
                              <td className="py-3 px-3">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                                  inv.status === 'ACTIVE' 
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse' 
                                    : inv.status === 'COMPLETED'
                                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                      : 'bg-slate-700 text-slate-400'
                                }`}>
                                  {inv.status}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-right space-x-1.5 whitespace-nowrap">
                                {isActive && (
                                  <>
                                    <button
                                      onClick={() => handleInvestmentAction(inv._id || inv.id, 'MATURE')}
                                      className="px-2.5 py-1 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-extrabold text-[11px] border border-emerald-500/30 cursor-pointer"
                                      title="Manually Mature and credit profit to user wallet"
                                    >
                                      💰 Mature & Payout
                                    </button>
                                    <button
                                      onClick={() => handleInvestmentAction(inv._id || inv.id, 'CANCEL')}
                                      className="px-2.5 py-1 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-extrabold text-[11px] border border-rose-500/30 cursor-pointer"
                                      title="Cancel and release withdrawal lock"
                                    >
                                      Cancel
                                    </button>
                                  </>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 7: LIVE SUPPORT CENTER (WHATSAPP-STYLE RESPONSIVE UI) */}
          {tab === 'support' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden flex flex-col lg:flex-row h-[72vh] min-h-[580px] max-h-[780px] shadow-2xl">
              
              {/* LEFT COLUMN: CONVERSATION LIST & TRADER SEARCH (Hidden on mobile when in chat) */}
              <div className={`${activeChatUserId ? 'hidden lg:flex' : 'flex'} flex-col w-full lg:w-96 lg:border-r border-slate-800 bg-slate-900 shrink-0 h-full`}>
                
                {/* Search & Header Bar */}
                <div className="p-3.5 sm:p-4 border-b border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-extrabold text-white text-sm flex items-center gap-2">
                        <Headphones className="w-4 h-4 text-blue-400" />
                        <span>Support Chats</span>
                      </h3>
                      <p className="text-[11px] text-slate-400">Direct realtime client messaging</p>
                    </div>
                    {totalUnreadSupportCount > 0 && (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black animate-pulse">
                        {totalUnreadSupportCount} New
                      </span>
                    )}
                  </div>

                  {/* Search Bar for Conversations & Registered Users */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search chat or user (name/email)..."
                      value={chatSearch}
                      onChange={(e) => setChatSearch(e.target.value)}
                      className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                    {chatSearch && (
                      <button
                        onClick={() => setChatSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Conversation List / Search Results */}
                <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 select-none">
                  {/* Filtered Active Conversations */}
                  {supportConversations
                    .filter(c => 
                      !chatSearch.trim() ||
                      c.user_name?.toLowerCase().includes(chatSearch.toLowerCase()) ||
                      c.user_email?.toLowerCase().includes(chatSearch.toLowerCase()) ||
                      c.last_message?.toLowerCase().includes(chatSearch.toLowerCase())
                    )
                    .map((c) => {
                      const isActive = activeChatUserId === c.user_id;
                      return (
                        <div
                          key={c.user_id}
                          onClick={() => fetchConversationMessages(c.user_id)}
                          className={`p-3.5 sm:p-4 cursor-pointer transition-all flex items-center gap-3 ${
                            isActive
                              ? 'bg-blue-600/20 border-l-4 border-blue-500'
                              : 'hover:bg-slate-800/50'
                          }`}
                        >
                          {/* User Avatar */}
                          <div className="relative shrink-0">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white text-sm shadow-md shadow-blue-500/20">
                              {c.user_name ? c.user_name[0].toUpperCase() : 'U'}
                            </div>
                            {c.unread_count > 0 && (
                              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-500 rounded-full border-2 border-slate-900 animate-pulse"></span>
                            )}
                          </div>

                          {/* Message Snippet & Meta */}
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline gap-1">
                              <h4 className="font-bold text-white text-xs truncate">{c.user_name}</h4>
                              <span className="text-[10px] text-slate-500 font-mono shrink-0">
                                {c.last_activity ? new Date(c.last_activity).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                              </span>
                            </div>
                            <div className="flex justify-between items-center mt-1">
                              <p className="text-[11px] text-slate-400 truncate pr-2">{c.last_message || 'No messages yet'}</p>
                              {c.unread_count > 0 && (
                                <span className="px-1.5 py-0.2 rounded-full bg-blue-500 text-white text-[9px] font-black shrink-0">
                                  {c.unread_count}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                  {/* If Searching: Show Registered Traders who don't have conversation yet */}
                  {chatSearch.trim() && (
                    <div className="p-2 space-y-1">
                      <p className="text-[10px] font-black uppercase text-slate-500 px-3 py-1">
                        Other Registered Traders
                      </p>
                      {users
                        .filter(u => 
                          (u.name?.toLowerCase().includes(chatSearch.toLowerCase()) || 
                           u.email?.toLowerCase().includes(chatSearch.toLowerCase())) &&
                          !supportConversations.some(c => c.user_id === (u._id || u.id))
                        )
                        .map(u => (
                          <div
                            key={u._id || u.id}
                            onClick={() => {
                              setActiveChatUserId(u._id || u.id);
                              fetchConversationMessages(u._id || u.id);
                            }}
                            className="p-3 rounded-2xl hover:bg-slate-800/60 transition-colors cursor-pointer flex items-center justify-between gap-3 border border-transparent hover:border-slate-700"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-xl bg-slate-800 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
                                {u.name ? u.name[0].toUpperCase() : 'U'}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-white truncate">{u.name}</p>
                                <p className="text-[10px] text-slate-400 font-mono truncate">{u.email}</p>
                              </div>
                            </div>
                            <span className="px-2 py-1 rounded-xl bg-blue-600/20 text-blue-400 text-[10px] font-bold shrink-0 flex items-center gap-1">
                              <MessageSquarePlus className="w-3 h-3" />
                              <span>Chat</span>
                            </span>
                          </div>
                        ))}
                    </div>
                  )}

                  {/* Empty Search / Empty Conversations */}
                  {supportConversations.length === 0 && !chatSearch.trim() && (
                    <div className="p-8 text-center text-slate-500 space-y-2">
                      <Headphones className="w-8 h-8 mx-auto text-slate-600" />
                      <p className="text-xs font-bold">No support messages yet.</p>
                      <p className="text-[11px] text-slate-600">Search any user above to initiate a direct message.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT COLUMN: CHAT ROOM (Full Screen on mobile when conversation selected) */}
              <div className={`${activeChatUserId ? 'flex' : 'hidden lg:flex'} flex-col flex-1 bg-slate-950/60 h-full`}>
                {activeChatUserId ? (
                  <>
                    {/* Chat Room Top Bar (WhatsApp Style) */}
                    <div className="p-3 sm:p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80 gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Mobile Back to List Button */}
                        <button
                          onClick={() => setActiveChatUserId(null)}
                          className="lg:hidden p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0"
                          title="Back to Chats List"
                        >
                          <ArrowLeft className="w-4 h-4" />
                        </button>

                        {/* Active Trader Identity */}
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                          {supportConversations.find(c => c.user_id === activeChatUserId)?.user_name?.[0]?.toUpperCase() ||
                           users.find(u => (u._id || u.id) === activeChatUserId)?.name?.[0]?.toUpperCase() || 'T'}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-extrabold text-white text-xs sm:text-sm truncate">
                              {supportConversations.find(c => c.user_id === activeChatUserId)?.user_name ||
                               users.find(u => (u._id || u.id) === activeChatUserId)?.name || 'Trader Client'}
                            </h4>
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                          </div>
                          <p className="text-[10px] text-slate-400 font-mono truncate">
                            {supportConversations.find(c => c.user_id === activeChatUserId)?.user_email ||
                             users.find(u => (u._id || u.id) === activeChatUserId)?.email || 'Live Channel'}
                          </p>
                        </div>
                      </div>

                      {/* Right: Actions (Profile & Close Chat) */}
                      <div className="flex items-center gap-2 shrink-0">
                        {/* Quick Inspect Profile Button */}
                        <button
                          onClick={() => {
                            const targetUser = users.find(u => (u._id || u.id) === activeChatUserId);
                            if (targetUser) setInspectedUser(targetUser);
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                          title="View Full Trader Profile"
                        >
                          <Eye className="w-3.5 h-3.5 text-blue-400" />
                          <span className="hidden sm:inline">Profile</span>
                        </button>

                        {/* Close / Exit Conversation Button */}
                        <button
                          onClick={() => setActiveChatUserId(null)}
                          className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-500/30 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                          title="Close Conversation View"
                        >
                          <X className="w-4 h-4" />
                          <span className="hidden sm:inline">Close</span>
                        </button>
                      </div>
                    </div>

                    {/* Messages Body */}
                    <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 bg-slate-950/40">
                      {activeChatMessages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2">
                          <MessageSquarePlus className="w-8 h-8 text-slate-600" />
                          <p className="text-xs font-bold">No messages in this ticket yet.</p>
                          <p className="text-[11px] text-slate-600">Type a message below to start conversation.</p>
                        </div>
                      ) : (
                        activeChatMessages.map((m) => {
                          const isAdmin = m.sender_role === 'admin';
                          return (
                            <div key={m._id || m.id} className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'} space-y-0.5`}>
                              <div className={`max-w-[85%] sm:max-w-[70%] p-3 sm:p-3.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                                isAdmin
                                  ? 'bg-blue-600 text-white rounded-tr-xs'
                                  : 'bg-slate-800 text-slate-100 rounded-tl-xs border border-slate-700/60'
                              }`}>
                                {m.image_url && (
                                  <div className="mb-2 rounded-xl overflow-hidden cursor-pointer" onClick={() => setReceiptModalUrl(m.image_url)}>
                                    <img src={m.image_url} alt="Attachment" className="max-h-60 rounded-xl object-cover hover:opacity-90 transition-opacity" />
                                  </div>
                                )}
                                <p className="break-words whitespace-pre-wrap">{m.message}</p>
                              </div>
                              <div className="flex items-center gap-1 px-1">
                                <span className="text-[9px] text-slate-500 font-mono">
                                  {new Date(m.created_at || m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                {isAdmin && (
                                  <Check className="w-3 h-3 text-blue-400" />
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                      <div ref={adminChatEndRef} />
                    </div>

                    {/* Image Attachment Preview Bar */}
                    {adminChatImagePreview && (
                      <div className="px-4 py-2 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <img src={adminChatImagePreview} alt="Preview" className="w-10 h-10 object-cover rounded-xl border border-slate-700" />
                          <span className="text-xs text-slate-300 font-bold">Image attached</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setAdminChatImage(null);
                            setAdminChatImagePreview(null);
                            if (adminFileInputRef.current) adminFileInputRef.current.value = '';
                          }}
                          className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {/* Bottom Chat Input Bar */}
                    <form onSubmit={handleAdminSendMessage} className="p-2.5 sm:p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2">
                      <input
                        type="file"
                        ref={adminFileInputRef}
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setAdminChatImage(file);
                            const reader = new FileReader();
                            reader.onload = (ev) => setAdminChatImagePreview(ev.target.result);
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => adminFileInputRef.current?.click()}
                        className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
                        title="Attach screenshot or receipt image"
                      >
                        <Paperclip className="w-4 h-4" />
                      </button>

                      <input
                        type="text"
                        placeholder="Reply to trader as Master Admin..."
                        value={adminChatInput}
                        onChange={(e) => setAdminChatInput(e.target.value)}
                        className="flex-1 bg-slate-800/90 border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />

                      <button
                        type="submit"
                        disabled={adminSending || (!adminChatInput.trim() && !adminChatImage)}
                        className="p-2.5 sm:px-5 sm:py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 shrink-0"
                      >
                        <Send className="w-4 h-4" />
                        <span className="hidden sm:inline">{adminSending ? 'Sending...' : 'Send'}</span>
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full p-8 text-center text-slate-500 space-y-3">
                    <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-blue-500 shadow-xl">
                      <Headphones className="w-8 h-8" />
                    </div>
                    <div className="space-y-1 max-w-sm">
                      <h3 className="font-extrabold text-white text-base">Select a Trader Conversation</h3>
                      <p className="text-xs text-slate-400">
                        Choose an active support inquiry from the left or search any registered user by email/name to start chatting.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 8: KYC */}
          {tab === 'kyc' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-white">KYC Identity Verification Center</h3>
                  <p className="text-xs text-slate-400">Review trader national ID cards, passports, and verification status.</p>
                </div>
                <button
                  onClick={() => fetchKyc()}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Refresh
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                      <th className="py-3 px-3">Trader Name</th>
                      <th className="py-3 px-3">Email</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3">Document</th>
                      <th className="py-3 px-3 text-right">Verification Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {kycUsers.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="py-8 text-center text-slate-500 font-medium">
                          No KYC verification submissions found.
                        </td>
                      </tr>
                    ) : (
                      kycUsers.map((u) => (
                        <tr key={u._id || u.id} className="hover:bg-slate-800/40">
                          <td className="py-3 px-3 font-bold text-white">{u.name}</td>
                          <td className="py-3 px-3 font-mono text-slate-400">{u.email}</td>
                          <td className="py-3 px-3">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${
                              u.kyc_status === 'VERIFIED' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                              u.kyc_status === 'PENDING' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                              u.kyc_status === 'REJECTED' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' :
                              'bg-slate-700/50 text-slate-400 border-slate-700'
                            }`}>
                              {u.kyc_status || 'UNVERIFIED'}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            {(u.kyc_doc || u.kyc_document_url) ? (
                              <button
                                onClick={() => setReceiptModalUrl(u.kyc_doc || u.kyc_document_url)}
                                className="px-2.5 py-1 rounded-xl bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 text-xs font-bold transition-colors cursor-pointer"
                              >
                                View ID Document
                              </button>
                            ) : (
                              <span className="text-slate-500 italic">No Document</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right space-x-1.5">
                            {u.kyc_status !== 'VERIFIED' && (
                              <button
                                onClick={() => handleKycAction(u._id || u.id, 'APPROVE')}
                                className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold text-xs hover:bg-emerald-500/30 transition-colors cursor-pointer"
                              >
                                Approve KYC
                              </button>
                            )}
                            {u.kyc_status !== 'REJECTED' && (
                              <button
                                onClick={() => handleKycAction(u._id || u.id, 'REJECT')}
                                className="px-3 py-1.5 rounded-xl bg-rose-500/20 text-rose-400 font-bold text-xs hover:bg-rose-500/30 transition-colors cursor-pointer"
                              >
                                Reject
                              </button>
                            )}
                            <button
                              onClick={() => handleKycAction(u._id || u.id, 'RESET')}
                              className="px-2.5 py-1.5 rounded-xl bg-slate-800 text-slate-400 font-bold text-xs hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
                              title="Reset status back to unverified"
                            >
                              Reset
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
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
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-8 max-w-md w-full max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl">
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
                    value={editingUser.kyc_status || 'UNVERIFIED'}
                    onChange={(e) => setEditingUser({ ...editingUser, kyc_status: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold"
                  >
                    <option value="VERIFIED">VERIFIED (Approved)</option>
                    <option value="PENDING">PENDING (Under Review)</option>
                    <option value="REJECTED">REJECTED</option>
                    <option value="UNVERIFIED">UNVERIFIED</option>
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
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto space-y-5 shadow-2xl">
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
                <span className="font-bold text-white">{inspectedUser.kyc_status || 'UNVERIFIED'}</span>
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
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-8 max-w-xl w-full max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl">
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
                <SignalDateTimePicker
                  label="Execution Time (PKT / PST)"
                  value={editingSignal.execution_time_pst || ''}
                  onChange={(val) => setEditingSignal({ ...editingSignal, execution_time_pst: val })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
                  <label className="block text-xs font-bold text-slate-400 mb-1">Outcome Strategy</label>
                  <select
                    value={editingSignal.outcome || 'WIN'}
                    onChange={(e) => setEditingSignal({ ...editingSignal, outcome: e.target.value })}
                    className={`w-full bg-slate-800 border ${editingSignal.outcome === 'LOSS' ? 'border-rose-500/60 text-rose-300' : 'border-emerald-500/60 text-emerald-300'} rounded-xl px-3 py-2 text-xs font-bold`}
                  >
                    <option value="WIN">🟢 WIN (Guaranteed Profit)</option>
                    <option value="LOSS">🔴 LOSS (Planned Market Loss)</option>
                  </select>
                </div>

                {editingSignal.outcome === 'LOSS' ? (
                  <div>
                    <label className="block text-xs font-bold text-rose-400 mb-1">⚠️ Planned Loss Rate (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={editingSignal.loss_percentage || 4.00}
                      onChange={(e) => setEditingSignal({ ...editingSignal, loss_percentage: Number(e.target.value) })}
                      className="w-full bg-slate-800 border border-rose-500/50 rounded-xl px-3 py-2 text-xs text-rose-300 font-bold"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Standard Yield (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={editingSignal.profit_percentage || 5}
                      onChange={(e) => setEditingSignal({ ...editingSignal, profit_percentage: Number(e.target.value) })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-amber-400 mb-1">VIP Staking Yield (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editingSignal.investment_profit_percentage || 8.50}
                    onChange={(e) => setEditingSignal({ ...editingSignal, investment_profit_percentage: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-amber-500/40 rounded-xl px-3 py-2 text-xs text-amber-300 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Minimum Capital ($)</label>
                  <input
                    type="number"
                    required
                    value={editingSignal.min_capital || 10}
                    onChange={(e) => setEditingSignal({ ...editingSignal, min_capital: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Signal Status</label>
                  <select
                    value={editingSignal.status || 'ACTIVE'}
                    onChange={(e) => setEditingSignal({ ...editingSignal, status: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold"
                  >
                    <option value="ACTIVE">ACTIVE (Traders can execute)</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="INACTIVE">INACTIVE / PAUSED</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Disclaimer / Instructions</label>
                <textarea
                  rows="2"
                  value={editingSignal.disclaimer || ''}
                  onChange={(e) => setEditingSignal({ ...editingSignal, disclaimer: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold"
                />
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

      {/* CREATE / EDIT YIELD STAKING PACKAGE MODAL */}
      {packageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-500" />
                <span>{editingPackage ? 'Edit Yield Staking Package' : 'Create New Yield Staking Package'}</span>
              </h3>
              <button onClick={() => setPackageModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePackage} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Package Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 7-Day Starter Yield"
                  value={packageForm.name}
                  onChange={(e) => setPackageForm({ ...packageForm, name: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Category / Tag</label>
                  <select
                    value={packageForm.tag}
                    onChange={(e) => setPackageForm({ ...packageForm, tag: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold"
                  >
                    <option value="Starter">Starter</option>
                    <option value="Popular">Popular</option>
                    <option value="VIP Elite">VIP Elite</option>
                    <option value="Max Return">Max Return</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Duration (Days)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={packageForm.duration_days}
                    onChange={(e) => setPackageForm({ ...packageForm, duration_days: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-emerald-400 mb-1">Total Return (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    placeholder="e.g. 15.0"
                    value={packageForm.total_return_roi}
                    onChange={(e) => setPackageForm({ ...packageForm, total_return_roi: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-emerald-500/40 rounded-xl px-3 py-2 text-xs text-emerald-300 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Min Capital ($)</label>
                  <input
                    type="number"
                    required
                    value={packageForm.min_amount}
                    onChange={(e) => setPackageForm({ ...packageForm, min_amount: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Max Capital ($)</label>
                  <input
                    type="number"
                    required
                    value={packageForm.max_amount}
                    onChange={(e) => setPackageForm({ ...packageForm, max_amount: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Description / Perks</label>
                <textarea
                  rows="2"
                  value={packageForm.description}
                  onChange={(e) => setPackageForm({ ...packageForm, description: e.target.value })}
                  placeholder="e.g. Earn 15% guaranteed return after 7 days. Full balance remains active for trading with VIP Signal boost!"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPackageModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={packageSaving}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {packageSaving ? 'Saving Plan...' : (editingPackage ? 'Update Staking Plan' : 'Publish Staking Plan')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUPER ADMIN MASTER AUTH REQUIRED MODAL */}
      {authRequired && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 text-white text-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 p-0.5 mx-auto flex items-center justify-center shadow-lg shadow-blue-500/30">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <div>
              <span className="px-3 py-0.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] font-black tracking-wider uppercase">
                SUPER ADMIN AUTHENTICATION REQUIRED
              </span>
              <h2 className="text-xl font-black mt-2">Unlock Master Admin Panel</h2>
              <p className="text-xs text-slate-400 mt-1">
                Enter your Master Administrator credentials to view live deposits, chat inquiries, and users.
              </p>
            </div>

            {adminAuthError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold">
                {adminAuthError}
              </div>
            )}

            <form onSubmit={handleMasterLogin} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Master Admin Email</label>
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Master Password</label>
                <input
                  type="password"
                  required
                  placeholder="Enter administrator password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={adminAuthLoading}
                className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{adminAuthLoading ? 'Authenticating...' : 'Unlock Super Admin Panel'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
