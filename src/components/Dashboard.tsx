import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, TrendingDown, Wallet, Users, 
  Plus, History, LogOut, ChevronRight,
  PieChart as PieChartIcon, BarChart3, Receipt, Landmark,
  Bell, User, Settings, X, Camera, Key, Save, AlertCircle,
  BellRing
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db, auth } from '../lib/firebase';
import { useFinance } from '../hooks/useFinance';
import { formatCurrency, cn } from '../lib/utils';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import TransactionForm from './TransactionForm';
import DebtForm from './DebtForm';
import ActivityLog from './ActivityLog';
import { Entry, Debt, ActivityLog as LogType, Notification, UserProfile } from '../types';
import { collection, query, orderBy, onSnapshot, limit, doc, updateDoc } from 'firebase/firestore';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { toast } from 'sonner';
import aelynLogo from '../assets/aelyn-logo.png';

export default function Dashboard() {
  const { profile } = useAuth();
  const { entries, debts, logs, loading, addEntry, addDebt, deleteEntry, updateDebtStatus, deleteDebt } = useFinance();
  const userCurrency = profile?.currency || 'TZS';
  const initialLoad = useRef(true);
  const debtSeeded = useRef(false);

  // Auto-seed requested debts
  useEffect(() => {
    if (!loading && debts.length === 0 && profile && !debtSeeded.current) {
      const seedDefaults = async () => {
        debtSeeded.current = true;
        // Double check existence inside the seed function just in case
        const hasMonitor = debts.some(d => d.description.includes('Monitor'));
        const hasInternet = debts.some(d => d.description.includes('Internet'));
        
        if (!hasMonitor && !hasInternet) {
          await addDebt({
            amount: 180000,
            description: 'Monitor purchase (Seed)',
            date: new Date().toISOString().split('T')[0],
            status: 'Unpaid'
          });
          await addDebt({
            amount: 38000,
            description: 'Internet bundles (Seed)',
            date: new Date().toISOString().split('T')[0],
            status: 'Unpaid'
          });
        }
      };
      seedDefaults();
    }
  }, [loading, debts, profile, addDebt]);

  // Notifications Listener
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [showDebtForm, setShowDebtForm] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showNotifTray, setShowNotifTray] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'ledger' | 'debts' | 'logs'>('overview');

  useEffect(() => {
    if (!profile) return;
    const q = query(collection(db, 'notifications'), orderBy('timestamp', 'desc'), limit(20));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Notification));
      
      // Toast for new notifications (skip initial load toasts)
      if (!initialLoad.current) {
        snapshot.docChanges().forEach(change => {
          if (change.type === 'added') {
            const newNotif = change.doc.data() as Notification;
            toast.info(newNotif.message, {
              icon: <BellRing size={16} className="text-indigo-500" />,
              description: new Date().toLocaleTimeString()
            });
          }
        });
      }
      initialLoad.current = false;
      setNotifications(docs);
    });
    return () => unsubscribe();
  }, [profile]);

  const markNotifRead = async (id: string) => {
    if (!profile?.uid) return;
    const notif = notifications.find(n => n.id === id);
    if (notif && !notif.readBy.includes(profile.uid)) {
      await updateDoc(doc(db, 'notifications', id), {
        readBy: [...notif.readBy, profile.uid]
      });
    }
  };

  const unreadCount = notifications.filter(n => profile?.uid && !n.readBy.includes(profile.uid)).length;

  // Filtering State
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterCategory, setFilterCategory] = useState<'all' | 'income' | 'expense'>('all');
  const [filterUserId, setFilterUserId] = useState('all');

  const filteredEntries = entries.filter(e => {
    const dateMatch = (!filterStartDate || e.date >= filterStartDate) && (!filterEndDate || e.date <= filterEndDate);
    const categoryMatch = filterCategory === 'all' || e.category === filterCategory;
    const userMatch = filterUserId === 'all' || e.userId === filterUserId;
    return dateMatch && categoryMatch && userMatch;
  });

  const filteredDebts = debts.filter(d => {
    const dateMatch = (!filterStartDate || d.date >= filterStartDate) && (!filterEndDate || d.date <= filterEndDate);
    const userMatch = filterUserId === 'all' || d.userId === filterUserId;
    return dateMatch && userMatch;
  });

  const totalRevenue = filteredEntries.filter(e => e.category === 'income').reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpenses = filteredEntries.filter(e => e.category === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
  const netProfit = totalRevenue - totalExpenses;

  const investmentFund = Math.max(0, netProfit * 0.4);
  const stakeholderDistribution = Math.max(0, netProfit * 0.6);
  const individualShare = stakeholderDistribution / 2;

  const unpaidDebts = filteredDebts.filter(d => d.status === 'Unpaid').reduce((acc, curr) => acc + curr.amount, 0);

  // Financial Health Score Calculation
  const profitabilityScore = Math.min(100, (netProfit / (totalRevenue || 1)) * 200);
  const debtRatioScore = Math.max(0, 100 - (unpaidDebts / (totalRevenue || 1)) * 100);
  const healthScore = Math.round((profitabilityScore * 0.6) + (debtRatioScore * 0.4));
  const healthColor = healthScore > 80 ? 'text-success' : healthScore > 50 ? 'text-amber' : 'text-danger';

  const pieData = [
    { name: 'Investment (40%)', value: investmentFund, color: '#000000' }, // Black
    { name: 'Stakeholder A (30%)', value: individualShare, color: '#c5a022' }, // Gold
    { name: 'Stakeholder B (30%)', value: individualShare, color: '#927521' }, // Dark Gold
  ];

  const chartData = filteredEntries.slice(0, 10).reverse().map(e => ({
    name: new Date(e.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    income: e.category === 'income' ? e.amount : 0,
    expense: e.category === 'expense' ? e.amount : 0,
  }));

  const uniqueUsers = entries.reduce((acc: { id: string; name: string }[], curr) => {
    if (!acc.find(u => u.id === curr.userId)) {
      acc.push({ id: curr.userId, name: curr.userName });
    }
    return acc;
  }, []);

  const exportCSV = () => {
    const csvContent = [
      ['Report: Aelyn Finance Financial Summary'],
      [`Period: ${filterStartDate || 'All Time'} to ${filterEndDate || 'Present'}`],
      [''],
      ['Summary Metrics'],
      ['Total Revenue', formatCurrency(totalRevenue, userCurrency)],
      ['Total Expenses', formatCurrency(totalExpenses, userCurrency)],
      ['Net Profit', formatCurrency(netProfit, userCurrency)],
      [''],
      ['Transaction Details'],
      ['Date', 'Description', 'Category', 'Amount', 'Author'],
      ...filteredEntries.map(e => [
        new Date(e.date).toLocaleDateString(),
        e.description,
        e.category,
        e.amount,
        e.userName
      ])
    ].map(e => e.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Aelyn_Finance_Report_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text('Aelyn Finance: Financial Report', 14, 22);
    
    doc.setFontSize(10);
    doc.text(`Period: ${filterStartDate || 'Start'} to ${filterEndDate || 'End'}`, 14, 30);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 35);

    doc.setFontSize(14);
    doc.text('Summary Metrics', 14, 45);
    
    autoTable(doc, {
      startY: 50,
      head: [['Metric', 'Value']],
      body: [
        ['Total Revenue', formatCurrency(totalRevenue, userCurrency)],
        ['Total Expenses', formatCurrency(totalExpenses, userCurrency)],
        ['Net Profit', formatCurrency(netProfit, userCurrency)],
        ['Investment Fund (40%)', formatCurrency(investmentFund, userCurrency)],
        ['Stakeholder Distribution (60%)', formatCurrency(stakeholderDistribution, userCurrency)],
      ],
      theme: 'striped',
    });

    const finalY = (doc as any).lastAutoTable.finalY || 100;
    
    doc.text('Transaction Details', 14, finalY + 15);
    
    autoTable(doc, {
      startY: finalY + 20,
      head: [['Date', 'Description', 'Type', 'Amount', 'Author']],
      body: filteredEntries.map(e => [
        new Date(e.date).toLocaleDateString(),
        e.description,
        e.category,
        formatCurrency(e.amount, userCurrency),
        e.userName
      ]),
      theme: 'grid',
    });

    doc.save(`Aelyn_Finance_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const tabTitle =
    activeTab === 'overview'
      ? 'Dashboard'
      : activeTab === 'ledger'
        ? 'Transactions'
        : activeTab === 'debts'
          ? 'Debts'
          : 'Activity Log';

  return (
    <div className="min-h-screen aelyn-bg flex font-sans text-slate-200 selection:bg-gold-light">
      {/* Sidebar */}
      <aside className="w-[280px] hidden lg:flex flex-col fixed inset-y-0 left-0 z-50 px-6 py-8">
        <div className="aelyn-panel-soft rounded-2xl p-5 flex items-center gap-3">
          <img src={aelynLogo} alt="Aelyn" className="w-10 h-10 object-contain" />
          <div className="min-w-0">
            <div className="text-white font-semibold tracking-tight leading-tight">AELYN</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-[0.25em] -mt-0.5">Technologies</div>
          </div>
        </div>

        <nav className="mt-6 aelyn-panel-soft rounded-2xl p-3 flex flex-col gap-1">
          {[
            { id: 'overview', label: 'Dashboard', icon: PieChartIcon, onClick: () => setActiveTab('overview') },
            {
              id: 'ledger',
              label: 'Transactions',
              icon: Receipt,
              onClick: () => {
                setActiveTab('ledger');
                setFilterCategory('all');
              },
            },
            {
              id: 'income',
              label: 'Income',
              icon: TrendingUp,
              onClick: () => {
                setActiveTab('ledger');
                setFilterCategory('income');
              },
            },
            {
              id: 'expenses',
              label: 'Expenses',
              icon: TrendingDown,
              onClick: () => {
                setActiveTab('ledger');
                setFilterCategory('expense');
              },
            },
            { id: 'investments', label: 'Investments', icon: Landmark, onClick: () => setActiveTab('overview') },
            { id: 'debts', label: 'Debts', icon: Wallet, onClick: () => setActiveTab('debts') },
            { id: 'reports', label: 'Reports', icon: BarChart3, onClick: () => setActiveTab('overview') },
            { id: 'stakeholders', label: 'Stakeholders', icon: Users, onClick: () => setActiveTab('overview') },
            { id: 'logs', label: 'Activity Log', icon: History, onClick: () => setActiveTab('logs') },
          ].map((item) => {
            const selected =
              item.id === activeTab ||
              (activeTab === 'ledger' && (item.id === 'income' || item.id === 'expenses' || item.id === 'ledger'));
            return (
              <button
                key={item.id}
                onClick={item.onClick}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors',
                  selected ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white',
                )}
              >
                <item.icon size={18} className={cn(selected ? 'text-sky' : 'text-slate-400')} />
                <span className="text-[13px] font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="mt-auto aelyn-panel-soft rounded-2xl p-3 flex items-center justify-between gap-3">
          <button onClick={() => setShowProfileModal(true)} className="flex items-center gap-3 min-w-0" type="button">
            <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/10 bg-white/5 shrink-0">
              {profile?.photoURL ? (
                <img src={profile.photoURL} className="w-full h-full object-cover" alt="Me" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-sm font-semibold text-slate-300">
                  {profile?.displayName?.charAt(0) || 'A'}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <div className="text-[13px] text-white font-medium truncate">{profile?.displayName || 'Admin'}</div>
              <div className="text-[11px] text-slate-500 truncate">{profile?.role || 'stakeholder'}</div>
            </div>
          </button>
          <button
            onClick={() => auth.signOut()}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-danger hover:bg-danger/10 transition-all"
            type="button"
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-grow lg:ml-[280px] flex flex-col">
        <header className="sticky top-0 z-40 px-6 lg:px-10 py-6">
          <div className="aelyn-panel-soft rounded-2xl px-6 py-4 flex items-center justify-between gap-6">
            <div className="flex flex-col min-w-0">
              <h1 className="text-[20px] font-semibold text-white tracking-tight">{tabTitle}</h1>
              <p className="text-[12px] text-slate-500">
                {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                <span className="text-[12px] text-slate-400">Range</span>
                <input
                  type="date"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                  className="bg-transparent text-[12px] text-slate-200 outline-none"
                />
                <span className="text-slate-600">–</span>
                <input
                  type="date"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                  className="bg-transparent text-[12px] text-slate-200 outline-none"
                />
              </div>

              <button
                onClick={exportPDF}
                className="hidden md:inline-flex items-center gap-2 bg-white/5 border border-white/10 text-slate-200 text-[12px] font-medium px-4 py-2.5 rounded-xl hover:bg-white/10 transition-all"
                type="button"
              >
                Export Report
              </button>

              <button
                onClick={() => setShowNotifTray(!showNotifTray)}
                className="relative p-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-300 hover:text-sky transition-all"
                type="button"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-sky rounded-full border-2 border-bg-main" />
                )}
              </button>

              {activeTab === 'debts' && (
                <button
                  onClick={() => setShowDebtForm(true)}
                  className="hidden sm:inline-flex items-center gap-2 bg-white/5 border border-white/10 text-slate-200 text-[12px] font-medium px-4 py-2.5 rounded-xl hover:bg-white/10 transition-all"
                  type="button"
                >
                  <Plus size={16} className="text-sky" /> Add Debt
                </button>
              )}
              <button
                onClick={() => setShowEntryForm(true)}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-sky to-sky-2 text-navy text-[12px] font-semibold px-4 py-2.5 rounded-xl hover:brightness-110 active:brightness-95 transition-all shadow-[0_18px_50px_rgba(46,229,210,0.15)]"
                type="button"
              >
                <Plus size={16} /> Add Transaction
              </button>
            </div>
          </div>
        </header>

        {/* Dashboard Grid View */}
        <main className="px-6 lg:px-10 pb-20 flex-grow">
          {/* Top Level Summary Cards - Modern Glossy Style */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            <MetricCard 
              label="Liquid Revenue" 
              value={totalRevenue} 
              icon={<TrendingUp size={24} className="text-success" />} 
              currency={userCurrency}
              trend="+11.4% Monthly"
              color="success"
            />
            <MetricCard 
              label="Operating Cost" 
              value={totalExpenses} 
              icon={<TrendingDown size={24} className="text-amber" />} 
              currency={userCurrency}
              trend="2.4% Optimal"
              color="amber"
            />
            <MetricCard 
              label="Asset Equity" 
              value={netProfit} 
              icon={<Landmark size={24} className="text-sky" />} 
              currency={userCurrency}
              trend="Capital Surplus"
              color="sky"
              dark
            />
            <MetricCard 
              label="System Liability" 
              value={unpaidDebts} 
              icon={<AlertCircle size={24} className="text-danger" />} 
              currency={userCurrency}
              trend="Audit Required"
              color="danger"
            />
          </div>

          {/* Filter Controls */}
          <div className="aelyn-panel-soft p-6 rounded-2xl border border-white/10 flex flex-wrap items-center gap-6 mb-12">
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-medium text-slate-500 ml-1">Period start</label>
              <input 
                type="date" 
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs font-semibold outline-none focus:ring-2 focus:ring-sky/20 text-slate-200"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-medium text-slate-500 ml-1">Period end</label>
              <input 
                type="date" 
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs font-semibold outline-none focus:ring-2 focus:ring-sky/20 text-slate-200"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-medium text-slate-500 ml-1">Type</label>
              <select 
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value as any)}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs font-semibold outline-none focus:ring-2 focus:ring-sky/20 appearance-none text-slate-200"
              >
                <option value="all">All</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>
            <div className="flex-grow"></div>
            <div className="flex items-center gap-3">
              <button 
                onClick={exportCSV}
                className="bg-white/5 border border-white/10 text-slate-200 text-[12px] font-medium px-4 py-2.5 rounded-xl hover:bg-white/10 transition-all"
                type="button"
              >
                Export CSV
              </button>
              <button 
                onClick={exportPDF}
                className="bg-gradient-to-r from-sky to-sky-2 text-navy text-[12px] font-semibold px-4 py-2.5 rounded-xl hover:brightness-110 active:brightness-95 transition-all shadow-[0_18px_50px_rgba(46,229,210,0.15)]"
                type="button"
              >
                Generate report
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <div className="flex flex-col gap-10">
                {/* Financial Health Score Hero Section */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-navy rounded-[40px] p-12 text-white relative overflow-hidden shadow-2xl"
                >
                  <div className="absolute top-0 right-0 w-96 h-96 bg-sky/10 rounded-full blur-[120px] -mr-32 -mt-32"></div>
                  <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber/5 rounded-full blur-[100px] -ml-32 -mb-32"></div>
                  
                  <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                    <div className="flex flex-col gap-4 max-w-lg">
                      <div className="flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full bg-sky animate-pulse"></span>
                        <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-sky-light/60">Institutional Vitality Index</p>
                      </div>
                      <h2 className="text-4xl md:text-5xl font-bold tracking-tighter leading-tight">Financial Health Performance Score</h2>
                      <p className="text-slate-400 text-sm leading-relaxed font-medium">A composite metric evaluating your revenue trajectory, liability exposure, and operational margins. This score dictates your current institutional borrowing capacity.</p>
                    </div>

                    <div className="flex flex-col items-center">
                      <div className="relative w-48 h-48 flex items-center justify-center">
                        <svg className="w-full h-full -rotate-90">
                          <circle cx="96" cy="96" r="88" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
                          <motion.circle 
                            cx="96" cy="96" r="88" 
                            fill="transparent" 
                            stroke="currentColor" 
                            strokeWidth="12" 
                            strokeDasharray="552.92"
                            initial={{ strokeDashoffset: 552.92 }}
                            animate={{ strokeDashoffset: 552.92 * (1 - healthScore / 100) }}
                            transition={{ duration: 2, ease: "easeOut" }}
                            className={cn(
                              healthScore > 80 ? "text-success" : healthScore > 50 ? "text-amber" : "text-danger"
                            )}
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className={cn("text-6xl font-bold tracking-tighter", healthColor)}>{healthScore}</span>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">PERCENTILE</span>
                        </div>
                      </div>
                      <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.2em] px-6 py-2 bg-white/5 rounded-full border border-white/10">
                        Status: <span className={healthColor}>{healthScore > 80 ? 'Optimal' : healthScore > 50 ? 'Stable' : 'Critical'}</span>
                      </p>
                    </div>
                  </div>
                </motion.div>

                <motion.div 
                  key="overview"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-8"
                >
                {/* 1. Revenue Donut */}
                <Card title="Revenue Breakdown" badge="Last 30 Days">
                  <div className="flex items-center gap-8 py-4">
                    <div className="w-1/2 h-44">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Collected', value: totalRevenue * 0.85, color: '#000000' },
                              { name: 'Pending', value: totalRevenue * 0.15, color: '#c5a022' }
                            ]}
                            innerRadius={50}
                            outerRadius={70}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                          >
                            {[{color: '#000000'}, {color: '#c5a022'}].map((e, i) => <Cell key={i} fill={e.color} />)}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="w-1/2 space-y-4">
                      <DonutLegend label="Collected" amount={totalRevenue * 0.85} currency={userCurrency} color="bg-black" />
                      <DonutLegend label="Pending" amount={totalRevenue * 0.15} currency={userCurrency} color="bg-gold" />
                    </div>
                  </div>
                </Card>

                {/* 2. Stakeholder Equity Distribution Bars */}
                <Card title="Stakeholder Allocation" badge="Equity Pool">
                   <div className="h-44 mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart layout="vertical" data={[
                        { name: 'Reserve', val: investmentFund, color: '#000000' },
                        { name: 'Stake A', val: individualShare, color: '#c5a022' },
                        { name: 'Stake B', val: individualShare, color: '#927521' }
                      ]} margin={{ left: 10, right: 30 }}>
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                        <Bar dataKey="val" radius={[0, 4, 4, 0]} barSize={12}>
                           {[
                            { color: '#000000' },
                            { color: '#c5a022' },
                            { color: '#927521' }
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                {/* 3. Expense Control Area */}
                <Card title="Expenditure Profile" badge="Operating Costs">
                  <div className="flex items-center gap-8 py-4">
                     <div className="w-1/2 h-44">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={[
                                { name: 'Fixed', value: totalExpenses * 0.7, color: '#000000' },
                                { name: 'Variable', value: totalExpenses * 0.3, color: '#c5a022' },
                                { name: 'Unpaid Debts', value: unpaidDebts, color: '#ef4444' }
                              ]}
                              innerRadius={50}
                              outerRadius={70}
                              paddingAngle={5}
                              dataKey="value"
                              stroke="none"
                            >
                              {[{color: '#000000'}, {color: '#c5a022'}, {color: '#ef4444'}].map((e, i) => <Cell key={i} fill={e.color} />)}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="w-1/2 space-y-4">
                        <DonutLegend label="Fixed Costs" amount={totalExpenses * 0.7} currency={userCurrency} color="bg-black" />
                        <DonutLegend label="Variables" amount={totalExpenses * 0.3} currency={userCurrency} color="bg-gold" />
                        <DonutLegend label="Unpaid Debts" amount={unpaidDebts} currency={userCurrency} color="bg-rose-500" />
                      </div>
                  </div>
                </Card>

                {/* 4. Cash Flow Trend */}
                <Card title="Activity Timeline" badge="Real-time Stream">
                   <div className="h-44 mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" hide />
                        <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '10px' }}
                            formatter={(v: number) => formatCurrency(v, userCurrency)}
                        />
                        <Line type="monotone" dataKey="income" stroke="#000000" strokeWidth={3} dot={false} />
                        <Line type="monotone" dataKey="expense" stroke="#c5a022" strokeWidth={3} dot={false} strokeDasharray="5 5" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                {/* Full Width Recent Ledger Brief */}
                <div className="col-span-full bg-white rounded-[32px] border border-slate-100 overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.01)]">
                  <div className="px-8 py-8 border-b border-slate-50 flex justify-between items-center group">
                    <h3 className="font-bold text-navy tracking-tight flex items-center gap-2">
                       <History size={18} className="text-sky" /> Executive Activity Ledger
                    </h3>
                    <button onClick={() => setActiveTab('ledger')} className="text-[10px] font-bold text-sky uppercase tracking-[0.2em] hover:translate-x-1 transition-transform flex items-center gap-1">
                      Full Record <ChevronRight size={12} />
                    </button>
                  </div>
                  <div className="px-8 py-4">
                    {filteredEntries.slice(0, 4).map(entry => (
                       <div key={entry.id} className="flex items-center justify-between py-5 border-b border-slate-50 last:border-none">
                          <div className="flex gap-5 items-center">
                            <div className={cn(
                              "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
                              entry.category === 'income' ? "bg-navy text-white" : "bg-sky-light text-sky"
                            )}>
                              {entry.category === 'income' ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-800 tracking-tight">{entry.description}</p>
                              <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-0.5">{new Date(entry.date).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="text-right">
                             <p className={cn("text-lg font-bold font-mono tracking-tighter", entry.category === 'income' ? "text-navy" : "text-sky")}>
                                {entry.category === 'income' ? '+' : '-'}{formatCurrency(entry.amount, userCurrency)}
                             </p>
                             <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">{entry.userName}</p>
                          </div>
                       </div>
                    ))}
                  </div>
                </div>
              </motion.div>
              </div>
            )}

            {activeTab === 'ledger' && (
              <motion.div 
                key="ledger"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <Card title="Executive Transaction Ledger" badge={`${filteredEntries.length} Records`}>
                  <div className="flex flex-col gap-6">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
                        {[
                          { id: 'all', label: 'All' },
                          { id: 'income', label: 'Income' },
                          { id: 'expense', label: 'Expense' },
                          { id: 'transfer', label: 'Transfer' },
                        ].map((t) => {
                          const isTransfer = t.id === 'transfer';
                          const selected = !isTransfer && filterCategory === t.id;
                          return (
                            <button
                              key={t.id}
                              type="button"
                              disabled={isTransfer}
                              onClick={() => setFilterCategory(t.id as any)}
                              className={cn(
                                'px-3 py-2 rounded-lg text-[12px] font-medium transition-colors',
                                isTransfer
                                  ? 'text-slate-600 cursor-not-allowed'
                                  : selected
                                    ? 'bg-white/10 text-white'
                                    : 'text-slate-300 hover:bg-white/5 hover:text-white',
                              )}
                            >
                              {t.label}
                            </button>
                          );
                        })}
                      </div>

                      <button
                        onClick={() => setShowEntryForm(true)}
                        className="bg-gradient-to-r from-sky to-sky-2 text-navy text-[12px] font-semibold px-4 py-2.5 rounded-xl hover:brightness-110 active:brightness-95 transition-all shadow-[0_18px_50px_rgba(46,229,210,0.15)]"
                        type="button"
                      >
                        <Plus size={16} className="inline-block mr-2" />
                        Add Transaction
                      </button>
                    </div>

                    <div className="divide-y divide-white/10 border border-white/10 rounded-2xl overflow-hidden bg-white/5">
                      {filteredEntries.length === 0 ? (
                        <div className="p-10 text-center text-slate-500 text-sm">No transactions in this range.</div>
                      ) : (
                        filteredEntries.map((entry) => (
                          <div key={entry.id} className="px-5 py-4 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className={cn(
                                  'w-10 h-10 rounded-xl flex items-center justify-center border',
                                  entry.category === 'income'
                                    ? 'bg-success/10 border-success/20 text-success'
                                    : 'bg-danger/10 border-danger/20 text-danger',
                                )}
                              >
                                {entry.category === 'income' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                              </div>
                              <div className="min-w-0">
                                <div className="text-[13px] font-medium text-white truncate">{entry.description}</div>
                                <div className="text-[12px] text-slate-500">
                                  {new Date(entry.date).toLocaleDateString()} • {entry.userName}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              <div
                                className={cn(
                                  'text-[14px] font-semibold font-mono tracking-tight',
                                  entry.category === 'income' ? 'text-success' : 'text-danger',
                                )}
                              >
                                {entry.category === 'income' ? '+' : '-'}
                                {formatCurrency(entry.amount, userCurrency)}
                              </div>
                              <button
                                onClick={() => deleteEntry(entry.id, entry)}
                                className="p-2 rounded-lg text-slate-500 hover:text-danger hover:bg-danger/10 transition-colors"
                                type="button"
                                aria-label="Delete transaction"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}

            {activeTab === 'debts' && (
              <motion.div 
                key="debts"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                 <Card title="Liability Matrix" badge={`${filteredDebts.length} Commitments`}>
                  <div className="flex flex-col gap-6">
                    <div className="flex items-center justify-between gap-4">
                      <div className="text-[12px] text-slate-500">
                        Unpaid:{' '}
                        <span className="text-slate-200 font-semibold">
                          {filteredDebts.filter((d) => d.status === 'Unpaid').length}
                        </span>
                      </div>
                      <button
                        onClick={() => setShowDebtForm(true)}
                        className="bg-gradient-to-r from-sky to-sky-2 text-navy text-[12px] font-semibold px-4 py-2.5 rounded-xl hover:brightness-110 active:brightness-95 transition-all shadow-[0_18px_50px_rgba(46,229,210,0.15)]"
                        type="button"
                      >
                        <Plus size={16} className="inline-block mr-2" />
                        Add Debt
                      </button>
                    </div>

                    <div className="divide-y divide-white/10 border border-white/10 rounded-2xl overflow-hidden bg-white/5">
                      {filteredDebts.length === 0 ? (
                        <div className="p-10 text-center text-slate-500 text-sm">No debts in this range.</div>
                      ) : (
                        filteredDebts.map((debt) => (
                          <div key={debt.id} className="px-5 py-4 flex items-center justify-between gap-4">
                            <div className="min-w-0">
                              <div className="text-[13px] font-medium text-white truncate">{debt.description}</div>
                              <div className="text-[12px] text-slate-500">
                                {new Date(debt.date).toLocaleDateString()} • Ref {debt.id.slice(0, 8)}
                              </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              <div className="text-[14px] font-semibold font-mono tracking-tight text-slate-200">
                                {formatCurrency(debt.amount, userCurrency)}
                              </div>
                              <span
                                className={cn(
                                  'px-2.5 py-1 rounded-lg text-[11px] font-medium border',
                                  debt.status === 'Unpaid'
                                    ? 'bg-danger/10 border-danger/20 text-danger'
                                    : 'bg-success/10 border-success/20 text-success',
                                )}
                              >
                                {debt.status}
                              </span>
                              {debt.status === 'Unpaid' && (
                                <button
                                  onClick={() => updateDebtStatus(debt.id, 'Paid', debt)}
                                  className="px-3 py-2 rounded-lg text-[12px] font-medium text-sky hover:bg-white/5 transition-colors"
                                  type="button"
                                >
                                  Mark paid
                                </button>
                              )}
                              <button
                                onClick={() => deleteDebt(debt.id, debt)}
                                className="p-2 rounded-lg text-slate-500 hover:text-danger hover:bg-danger/10 transition-colors"
                                type="button"
                                aria-label="Delete debt"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                 </Card>
              </motion.div>
            )}

            {activeTab === 'logs' && <ActivityLog logs={logs} />}
          </AnimatePresence>
        </main>
      </div>

      {/* Notification Tray */}
      {showNotifTray && (
        <div className="fixed top-24 right-6 lg:right-10 w-[360px] aelyn-panel rounded-2xl z-[60] overflow-hidden">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <h3 className="text-[11px] font-semibold text-slate-300 tracking-tight">Notifications</h3>
            <button onClick={() => setShowNotifTray(false)} className="text-slate-500 hover:text-white" type="button">
              <X size={16} />
            </button>
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-10 text-center text-slate-500 text-sm">No notifications yet.</div>
            ) : (
              notifications.map(n => (
                <div 
                  key={n.id} 
                  onClick={() => markNotifRead(n.id)}
                  className={cn(
                    "p-4 border-b border-white/10 cursor-pointer transition-colors",
                    profile?.uid && !n.readBy.includes(profile.uid) ? "bg-white/5" : "hover:bg-white/5"
                  )}
                >
                  <div className="flex gap-3">
                    <div className={cn(
                      "w-2 h-2 rounded-full mt-1.5 shrink-0",
                      n.type === 'entry' ? "bg-success" : n.type === 'debt' ? "bg-danger" : "bg-amber"
                    )} />
                    <div>
                      <p className="text-[13px] font-medium text-slate-200 leading-tight">{n.message}</p>
                      <p className="text-[11px] text-slate-500 mt-1 font-mono">{n.timestamp?.toDate ? n.timestamp.toDate().toLocaleString() : 'Just now'}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {showProfileModal && (
        <ProfileModal 
          onClose={() => setShowProfileModal(false)}
          profile={profile}
        />
      )}

      {/* Forms */}
      <AnimatePresence>
        {showEntryForm && (
          <TransactionForm 
            onClose={() => setShowEntryForm(false)} 
            currency={userCurrency}
            onSubmit={async (data) => {
              await addEntry(data);
              setShowEntryForm(false);
            }} 
          />
        )}
        {showDebtForm && (
          <DebtForm 
            onClose={() => setShowDebtForm(false)} 
            currency={userCurrency}
            onSubmit={async (data) => {
              await addDebt(data);
              setShowDebtForm(false);
            }} 
          />
        )}
      </AnimatePresence>
    </div>

  );
}

const ProfileModal = ({ onClose, profile }: { onClose: () => void, profile: any }) => {
  const [name, setName] = useState(profile?.displayName || '');
  const [photoURL, setPhotoURL] = useState(profile?.photoURL || '');
  const [currency, setCurrency] = useState(profile?.currency || 'TZS');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleUpdateProfile = async () => {
    if (!auth.currentUser) return;
    setIsUpdating(true);
    setError('');
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        displayName: name,
        photoURL: photoURL,
        currency: currency
      });
      setSuccess('Profile updated');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangePassword = async () => {
    if (!auth.currentUser || !currentPassword || !newPassword) return;
    setIsUpdating(true);
    setError('');
    try {
      const email = auth.currentUser.email;
      if (email) {
        const credential = EmailAuthProvider.credential(email, currentPassword);
        await reauthenticateWithCredential(auth.currentUser, credential);
        await updatePassword(auth.currentUser, newPassword);
        setSuccess('Password updated');
        setCurrentPassword('');
        setNewPassword('');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onClose}
        className="absolute inset-0 bg-bg-main/70 backdrop-blur-md"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative aelyn-panel w-full max-w-md rounded-[28px] p-8"
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.25em] mb-1">Profile</p>
            <h2 className="text-xl font-semibold text-white tracking-tight">Settings</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg text-slate-500 hover:text-white" type="button">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6">
          <div className="flex flex-col items-center mb-6">
            <div className="relative group">
              <div className="w-20 h-20 bg-white/5 rounded-full border border-white/10 flex items-center justify-center text-slate-500 overflow-hidden">
                {photoURL ? (
                  <img src={photoURL} className="w-full h-full object-cover" alt="Profile" />
                ) : (
                  <User size={32} />
                )}
              </div>
              <label className="absolute inset-0 bg-bg-main/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white cursor-pointer">
                <Camera size={16} />
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setPhotoURL(reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-2">Display name</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:bg-white/7 transition-all text-sm font-medium outline-none text-white placeholder:text-slate-600"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-2">Base currency</label>
              <select 
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:bg-white/7 transition-all text-sm font-medium appearance-none cursor-pointer outline-none text-white"
              >
                <option value="TZS">TZS - Tanzanian Shilling</option>
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
              </select>
            </div>
            <button 
              onClick={handleUpdateProfile}
              disabled={isUpdating}
              className="w-full bg-gradient-to-r from-sky to-sky-2 text-navy py-4 rounded-xl font-semibold text-sm hover:brightness-110 active:brightness-95 transition-all flex items-center justify-center gap-2 shadow-[0_18px_50px_rgba(46,229,210,0.15)]"
              type="button"
            >
              <Save size={14} /> Commit Changes
            </button>
          </div>

          <div className="pt-6 border-t border-white/10">
            <button 
              onClick={handleChangePassword}
              disabled={isUpdating}
              className="w-full bg-white/5 border border-white/10 text-slate-200 py-4 rounded-xl font-semibold text-sm hover:bg-white/10 transition-all flex items-center justify-center gap-2"
              type="button"
            >
              <Key size={14} /> Security Protocol
            </button>
          </div>

          {error && <p className="text-[10px] text-rose-500 font-bold uppercase text-center mt-2">{error}</p>}
          {success && <p className="text-[10px] text-emerald-500 font-bold uppercase text-center mt-2">{success}</p>}
        </div>
      </motion.div>
    </div>
  );
};

const Card = ({ title, badge, children }: any) => (
  <div className="aelyn-panel-soft rounded-[28px] overflow-hidden flex flex-col h-full">
    <div className="px-8 py-7 border-b border-white/10 flex justify-between items-center">
      <h3 className="font-semibold text-white tracking-tight text-sm">{title}</h3>
      <span className="text-[10px] font-semibold text-sky bg-sky-light px-3 py-1.5 rounded-xl tracking-wide border border-white/10">
        {badge}
      </span>
    </div>
    <div className="p-8 flex-grow">
      {children}
    </div>
  </div>
);

const DonutLegend = ({ label, amount, currency, color }: any) => (
  <div className="flex items-center justify-between group">
    <div className="flex items-center gap-3">
      <div className={cn("w-2 h-2 rounded-full", color)}></div>
      <span className="text-[11px] font-medium text-slate-400">{label}</span>
    </div>
    <span className="text-xs font-semibold text-slate-200 font-mono tracking-tighter">{formatCurrency(amount, currency)}</span>
  </div>
);

const MetricCard = ({ label, value, icon, currency, trend, color, dark }: any) => (
  <div className={cn(
    "p-7 rounded-[28px] border transition-colors cursor-default flex flex-col justify-between min-h-[210px]",
    dark ? "aelyn-panel border-white/10" : "aelyn-panel-soft border-white/10",
  )}>
    <div className="flex items-center justify-between relative z-10">
      <p className="text-[12px] text-slate-400">{label}</p>
      <div className={cn("w-11 h-11 rounded-2xl flex items-center justify-center", "bg-white/5 border border-white/10 text-sky")}>
        {icon}
      </div>
    </div>
    
    <div className="relative z-10 mt-6">
      <h3 className="text-3xl font-semibold tracking-tight leading-none mb-4 text-white">
        {formatCurrency(value, currency)}
      </h3>
      <div className={cn("flex items-center text-[8px] font-bold uppercase tracking-widest gap-2 py-1.5 transition-opacity", 
        color === 'success' ? "text-success" : 
        color === 'danger' ? "text-danger" : 
        color === 'amber' ? "text-amber" : 
        color === 'sky' ? "text-sky" : "text-slate-400")}>
        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
        {trend}
      </div>
    </div>
  </div>
);

const DistributionRow = ({ label, value, percentage, color, accent, currency }: any) => {
  return (
    <div className="p-5 bg-slate-800/40 rounded-2xl border border-slate-800/50 hover:bg-slate-800 transition-colors">
      <div className="flex justify-between items-center mb-4">
        <span className="text-[10px] font-medium text-slate-300 uppercase tracking-[0.2em]">{label}</span>
        <span className={cn("text-sm font-normal font-mono tracking-tighter", accent && color.includes('text') ? color.split(' ').pop() : "text-white")}>
          {formatCurrency(value, currency || 'TZS')}
        </span>
      </div>
      <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={cn("h-full", color.split(' ')[0])} 
        />
      </div>
    </div>
  );
}
