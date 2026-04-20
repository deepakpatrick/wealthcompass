/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useEffect } from 'react';
import { format } from 'date-fns';
import { Wallet, Plus, Bell, PieChart, Landmark, ArrowRightLeft, CreditCard, Search, Filter, X, Settings, RefreshCcw, Trash2, CheckCircle2, ArrowDownLeft, ArrowUpRight, Edit2 } from 'lucide-react';
import { motion } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { LedgerGrid } from './components/LedgerGrid';
import { TimelineView } from './components/TimelineView';
import { CashFlowChart } from './components/CashFlowChart';
import { MOCK_ACCOUNTS, MOCK_TRANSACTIONS, MOCK_BILLS } from './lib/mockData';
import { ThemeType, RecurringRule, Frequency, RuleOverride } from './types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type ViewType = 'ledger' | 'timeline' | 'chart';

const THEMES: Record<ThemeType, { name: string; primary: string; bg: string; card: string; text: string; accent: string }> = {
  compass: { name: 'Classic Compass', primary: '#0052FF', bg: '#f5f5f5', card: '#ffffff', text: '#111827', accent: '#0052FF' },
  midnight: { name: 'Midnight Neon', primary: '#00FF00', bg: '#050505', card: '#111111', text: '#ffffff', accent: '#00FF00' },
  emerald: { name: 'Garden Emerald', primary: '#5A5A40', bg: '#f5f5f0', card: '#ffffff', text: '#1a1a1a', accent: '#5A5A40' },
  slate: { name: 'Technical Slate', primary: '#141414', bg: '#E4E3E0', card: '#ffffff', text: '#141414', accent: '#141414' },
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'transactions' | 'overview' | 'budgets' | 'settings'>('transactions');
  const [viewType, setViewType] = useState<ViewType>('ledger');
  const [theme, setTheme] = useState<ThemeType>('compass');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [recurringRules, setRecurringRules] = useState<RecurringRule[]>([
    { id: 'r1', accountId: 'acc1', name: 'Bi-Weekly Salary', amount: 3500, frequency: 'biweekly', startDate: '2026-04-20', isActive: true },
    { id: 'r2', accountId: 'acc1', name: 'Rent Payment', amount: -2200, frequency: 'first_of_month', startDate: '2026-05-01', isActive: true },
  ]);
  const [overrides, setOverrides] = useState<RuleOverride[]>([]);

  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [newRule, setNewRule] = useState<Partial<RecurringRule>>({
    accountId: MOCK_ACCOUNTS[0].id,
    frequency: 'monthly',
    amount: 0,
    name: '',
    startDate: '2026-04-20',
    isActive: true
  });

  const categories = useMemo(() => {
    const cats = new Set(MOCK_TRANSACTIONS.map(t => t.category));
    return ['All', ...Array.from(cats)].sort();
  }, []);

  const filteredTransactions = useMemo(() => {
    return MOCK_TRANSACTIONS.filter(t => {
      const matchesSearch = t.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           t.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = filterCategory === 'All' || t.category === filterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, filterCategory]);

  const currentTheme = THEMES[theme];

  const handleAddRule = () => {
    if (newRule.name && newRule.amount !== 0) {
      if (editingRuleId) {
        setRecurringRules(prev => prev.map(r => r.id === editingRuleId ? { ...newRule, id: editingRuleId } as RecurringRule : r));
      } else {
        setRecurringRules(prev => [...prev, { ...newRule, id: Math.random().toString() } as RecurringRule]);
      }
      setShowRecurringModal(false);
      setEditingRuleId(null);
    }
  };

  const startEditRule = (rule: RecurringRule) => {
    setNewRule(rule);
    setEditingRuleId(rule.id);
    setShowRecurringModal(true);
  };

  const deleteRule = (id: string) => {
    setRecurringRules(prev => prev.filter(r => r.id !== id));
    setOverrides(prev => prev.filter(o => o.ruleId !== id)); // Clean up overrides
  };

  const handleAddOverride = (ruleId: string, date: string, amount: number, name: string) => {
    setOverrides(prev => {
      const filtered = prev.filter(o => !(o.ruleId === ruleId && o.date === date));
      return [...filtered, { id: Math.random().toString(), ruleId, date, amount, name }];
    });
  };

  return (
    <div 
      className="flex h-screen overflow-hidden transition-colors duration-500"
      style={{ backgroundColor: currentTheme.bg, color: currentTheme.text }}
    >
      <style>{`
        :root {
          --brand-primary: ${currentTheme.primary};
        }
        .glass-card {
          background-color: ${currentTheme.card};
          border-color: ${theme === 'midnight' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'};
          color: ${currentTheme.text};
        }
        header, aside {
          background-color: ${theme === 'midnight' ? '#0a0a0a' : theme === 'slate' ? '#141414' : theme === 'emerald' ? '#5A5A40' : '#0052FF'};
          border-color: ${theme === 'midnight' ? '#222' : 'transparent'};
        }
        .input-field {
          background-color: ${theme === 'midnight' ? '#222' : '#fff'};
          color: ${theme === 'midnight' ? '#fff' : '#111'};
          border-color: ${theme === 'midnight' ? '#444' : '#e5e7eb'};
        }
        main { background-color: ${currentTheme.bg}; }
        .bg-white { background-color: ${currentTheme.card} !important; border-color: ${theme === 'midnight' ? '#222' : '#e5e7eb'} !important; }
        .text-gray-900 { color: ${currentTheme.text} !important; }
      `}</style>

      {/* Sidebar */}
      <aside className="w-16 md:w-64 text-white flex flex-col items-center md:items-stretch p-4 z-20 border-r border-white/10">
        <div className="flex items-center gap-3 px-2 mb-10 overflow-hidden">
          <div className="bg-white text-brand-primary p-2 rounded-xl">
            <Wallet size={24} />
          </div>
          <h1 className="text-xl font-bold tracking-tight hidden md:block">WealthCompass</h1>
        </div>

        <nav className="flex-1 space-y-2">
          {[
            { id: 'overview', label: 'Overview', icon: PieChart },
            { id: 'transactions', label: 'Finances', icon: ArrowRightLeft },
            { id: 'budgets', label: 'Budgets', icon: Landmark },
            { id: 'settings', label: 'Settings', icon: Settings },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 ${
                activeTab === item.id 
                ? 'bg-white/10 text-white shadow-lg shadow-black/20' 
                : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon size={20} />
              <span className="font-medium hidden md:block">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto space-y-2">
          <button className="w-full flex items-center gap-4 px-4 py-3 text-white/50 hover:text-white transition-all">
            <Bell size={20} />
            <span className="font-medium hidden md:block">Alerts</span>
          </button>
          <button className="w-full md:btn-secondary md:bg-white md:text-brand-primary p-3 md:py-3 rounded-xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all">
            <Plus size={20} />
            <span className="font-bold hidden md:block">Add Account</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 z-10">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
              {[
                { id: 'ledger', label: 'Ledger', icon: ArrowRightLeft },
                { id: 'timeline', label: 'Stream', icon: Bell },
                { id: 'chart', label: 'Forecast', icon: PieChart },
              ].map(v => (
                <button
                  key={v.id}
                  onClick={() => setViewType(v.id as ViewType)}
                  className={`px-3 py-1.5 rounded-md text-[10px] font-bold flex items-center gap-2 transition-all ${
                    viewType === v.id ? "bg-white text-brand-primary shadow-sm" : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  <v.icon size={12} />
                  <span className="hidden lg:inline uppercase tracking-widest">{v.label}</span>
                </button>
              ))}
            </div>
            <div className="h-4 w-[1px] bg-gray-200 mx-2" />
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Landmark size={14} /> 3 Checking
              </span>
              <span className="flex items-center gap-1">
                <CreditCard size={14} /> 6 Credit Cards
              </span>
            </div>
          </div>

          <div className="flex-1 max-w-md mx-8 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Search description..."
                className="input-field pl-10 h-10 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            
            <div className="relative group">
              <select 
                className="appearance-none bg-gray-50 border border-gray-200 rounded-lg px-4 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/10 transition-all cursor-pointer"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none mb-1">Total Net Worth</p>
              <p className="text-lg font-mono font-bold text-brand-primary">$15,845.50</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-brand-primary font-bold">
              DM
            </div>
          </div>
        </header>

        {/* View Layouts */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'transactions' && (
            <>
              {viewType === 'ledger' && (
                <LedgerGrid 
                  accounts={MOCK_ACCOUNTS}
                  transactions={filteredTransactions}
                  bills={MOCK_BILLS}
                  recurringRules={recurringRules}
                  overrides={overrides}
                  onAddOverride={handleAddOverride}
                  searchQuery={searchQuery}
                />
              )}
              {viewType === 'timeline' && (
                <TimelineView 
                  accounts={MOCK_ACCOUNTS}
                  transactions={filteredTransactions}
                  bills={MOCK_BILLS}
                  searchQuery={searchQuery}
                />
              )}
              {viewType === 'chart' && (
                <CashFlowChart 
                  accounts={MOCK_ACCOUNTS}
                  transactions={MOCK_TRANSACTIONS}
                  bills={MOCK_BILLS}
                  recurringRules={recurringRules}
                  overrides={overrides}
                />
              )}
            </>
          )}

          {activeTab === 'settings' && (
            <div className="p-8 max-w-4xl mx-auto space-y-10 overflow-y-auto h-full pb-40 no-scrollbar">
              <section>
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <PieChart size={20} className="text-brand-primary" /> Visual Skins
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {(Object.keys(THEMES) as ThemeType[]).map(t => (
                    <button
                      key={t}
                      onClick={() => setTheme(t)}
                      className={cn(
                        "p-4 rounded-2xl border-2 transition-all text-left group relative overflow-hidden",
                        theme === t ? "border-brand-primary ring-4 ring-brand-primary/10" : "border-transparent bg-gray-100 hover:bg-gray-200"
                      )}
                      style={{ backgroundColor: THEMES[t].bg }}
                    >
                      <div className="w-8 h-8 rounded-full mb-3 shadow-lg" style={{ backgroundColor: THEMES[t].primary }} />
                      <p className="text-xs font-bold" style={{ color: THEMES[t].text }}>{THEMES[t].name}</p>
                      {theme === t && <CheckCircle2 className="absolute top-4 right-4 text-brand-primary" size={16} />}
                    </button>
                  ))}
                </div>
              </section>

              <section>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <RefreshCcw size={20} className="text-brand-primary" /> Recurring Payments & Deposits
                  </h3>
                  <button 
                    onClick={() => {
                      setNewRule({
                        accountId: MOCK_ACCOUNTS[0].id,
                        frequency: 'monthly',
                        amount: 0,
                        name: '',
                        startDate: '2026-04-20',
                        isActive: true
                      });
                      setEditingRuleId(null);
                      setShowRecurringModal(true);
                    }}
                    className="btn-primary py-2 text-xs flex items-center gap-2"
                  >
                    <Plus size={14} /> Add Recurring
                  </button>
                </div>
                
                <div className="space-y-3">
                  {recurringRules.length === 0 && (
                    <div className="text-center py-10 bg-gray-100 rounded-2xl text-gray-400 italic">
                      No recurring rules configured. Add one to see automatic projections.
                    </div>
                  )}
                  {recurringRules.map(rule => (
                    <div key={rule.id} className="glass-card p-4 flex items-center justify-between border border-gray-100 group">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center",
                          rule.amount > 0 ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                        )}>
                          {rule.amount > 0 ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                        </div>
                        <div>
                          <p className="font-bold text-sm tracking-tight">{rule.name}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                            {MOCK_ACCOUNTS.find(a => a.id === rule.accountId)?.name} • Every {rule.frequency.replace('_', ' ')} • Starting {format(new Date(rule.startDate), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className={cn("font-mono font-bold", rule.amount > 0 ? "text-green-600" : "text-red-600")}>
                          {rule.amount > 0 ? '+' : ''}{rule.amount.toLocaleString()}
                        </p>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => startEditRule(rule)} className="p-1 text-gray-300 hover:text-brand-primary transition-colors">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => deleteRule(rule.id)} className="p-1 text-gray-300 hover:text-red-500 transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {showRecurringModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-full h-2 bg-brand-primary" />
                    <button onClick={() => setShowRecurringModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600">
                      <X size={20} />
                    </button>
                    
                    <h3 className="text-2xl font-bold mb-6 text-gray-900">{editingRuleId ? 'Edit Rule' : 'New Recurring Rule'}</h3>
                    
                    <div className="space-y-5">
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Rule Name</label>
                        <input 
                          className="input-field w-full" 
                          placeholder="e.g. Mortgage Payment"
                          value={newRule.name}
                          onChange={(e) => setNewRule({...newRule, name: e.target.value})}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Account</label>
                          <select 
                            className="input-field w-full text-xs"
                            value={newRule.accountId}
                            onChange={(e) => setNewRule({...newRule, accountId: e.target.value})}
                          >
                            {MOCK_ACCOUNTS.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Frequency</label>
                          <select 
                            className="input-field w-full text-xs"
                            value={newRule.frequency}
                            onChange={(e) => setNewRule({...newRule, frequency: e.target.value as Frequency})}
                          >
                            <option value="weekly">Weekly</option>
                            <option value="biweekly">Bi-Weekly</option>
                            <option value="fifteen_days">Every 15 Days</option>
                            <option value="monthly">Monthly</option>
                            <option value="first_of_month">1st of Month</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Amount (Positive = Deposit)</label>
                          <input 
                            type="number" 
                            className="input-field w-full font-mono text-xs" 
                            placeholder="0.00"
                            value={isNaN(newRule.amount!) ? "" : newRule.amount}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              setNewRule({...newRule, amount: isNaN(val) ? 0 : val});
                            }}
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Starting Date</label>
                          <input 
                            type="date" 
                            className="input-field w-full text-xs" 
                            value={newRule.startDate}
                            onChange={(e) => setNewRule({...newRule, startDate: e.target.value})}
                          />
                        </div>
                      </div>

                      <button 
                        onClick={handleAddRule}
                        className="btn-primary w-full py-4 rounded-2xl font-bold text-lg shadow-xl shadow-brand-primary/20"
                      >
                        {editingRuleId ? 'Update Forecasting Rule' : 'Activate Forecasting Rule'}
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </div>
          )}

          {activeTab !== 'transactions' && activeTab !== 'settings' && (
            <div className="p-8 flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-4 animate-pulse">
                <PieChart size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Section Under Construction</h3>
              <p className="text-gray-500 max-w-sm">
                We're currently building the {activeTab} view. Your transactions are safe in the transaction grid.
              </p>
              <button 
                onClick={() => setActiveTab('transactions')}
                className="mt-6 btn-primary"
              >
                Back to Grid View
              </button>
            </div>
          )}
        </div>

        {/* Floating Gradient for scroll indication */}
        <div className="absolute top-16 right-0 h-full w-20 bg-gradient-to-l from-[#f5f5f5] to-transparent pointer-events-none" />
      </main>
    </div>
  );
}
