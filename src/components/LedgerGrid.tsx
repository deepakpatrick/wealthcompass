import React, { useMemo, useState } from 'react';
import { Account, Transaction, Bill, RecurringRule, RuleOverride } from '../types';
import { format, startOfDay, addDays, eachDayOfInterval, subDays, isSameDay, isAfter, isBefore, addYears } from 'date-fns';
import { motion } from 'motion/react';
import { Info, Calculator, Calendar as CalendarIcon, ArrowUpRight, ArrowDownLeft, RefreshCcw, Edit2, X } from 'lucide-react';
import { calculateProjections } from '../lib/projections';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface LedgerGridProps {
  accounts: Account[];
  transactions: Transaction[];
  bills: Bill[];
  recurringRules: RecurringRule[];
  overrides: RuleOverride[];
  onAddOverride: (ruleId: string, date: string, amount: number, name: string) => void;
  searchQuery: string;
}

export const LedgerGrid: React.FC<LedgerGridProps> = ({ accounts, transactions, bills, recurringRules, overrides, onAddOverride, searchQuery }) => {
  const today = startOfDay(new Date('2026-04-20'));
  
  // Simulation State: Record<date_string, Record<account_id, number>>
  const [simulations, setSimulations] = useState<Record<string, Record<string, number>>>({});
  const [editingVtx, setEditingVtx] = useState<{ ruleId: string; date: string; name: string; amount: number } | null>(null);

  const handleSimulate = (date: string, accountId: string, amount: string) => {
    const val = parseFloat(amount);
    setSimulations(prev => ({
      ...prev,
      [date]: {
        ...(prev[date] || {}),
        [accountId]: isNaN(val) ? 0 : val
      }
    }));
  };

  const dayRange = useMemo(() => {
    return eachDayOfInterval({
      start: subDays(today, 14),
      end: addYears(today, 1) // 12 Months
    });
  }, [today]);

  const filteredBills = useMemo(() => {
    if (!searchQuery) return bills;
    return bills.filter(b => b.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [bills, searchQuery]);

  const gridData = useMemo(() => {
    const dates = dayRange.map(d => format(d, 'yyyy-MM-dd'));
    const { projections, virtualTransactions } = calculateProjections(
      accounts,
      transactions,
      bills,
      recurringRules,
      simulations,
      overrides,
      dayRange[0],
      dayRange[dayRange.length - 1]
    );

    return { dates, projections, virtualTransactions };
  }, [accounts, transactions, bills, recurringRules, simulations, overrides, dayRange]);

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden">
      {/* Scrollable Container */}
      <div className="flex-1 overflow-auto relative border-t border-gray-200">
        <table className="min-w-full border-collapse table-fixed">
          <thead className="sticky top-0 z-30 bg-white border-b-2 border-gray-200">
            <tr>
              <th className="sticky left-0 z-40 bg-white border-r border-gray-200 p-4 w-48 text-left">
                <div className="flex items-center gap-2 text-gray-400">
                  <CalendarIcon size={16} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Date / Acc</span>
                </div>
              </th>
              {accounts.map(acc => (
                <th key={acc.id} className="p-4 border-r border-gray-100 min-w-[240px] text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: acc.color }} />
                    <span className="text-xs font-bold text-gray-900 truncate">{acc.name}</span>
                  </div>
                  <div className="text-[10px] text-gray-400 font-medium uppercase tracking-tighter">
                    {acc.type === 'checking' ? 'Checking Account' : 'Credit Card'}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          
          <tbody>
            {gridData.dates.map((dateStr) => {
              const date = new Date(dateStr);
              const isToday = isSameDay(date, today);
              const isFuture = isAfter(date, today);
              
              return (
                <tr key={dateStr} className={cn(
                  "hover:bg-gray-50/50 transition-colors border-b border-gray-100",
                  isToday && "bg-brand-primary/5 ring-1 ring-inset ring-brand-primary/20"
                )}>
                  {/* Date Column */}
                  <td className="sticky left-0 z-20 bg-white border-r border-gray-200 p-4 font-mono text-xs text-brand-primary">
                    <div className={cn(
                      "flex flex-col",
                      isToday ? "font-bold" : "text-gray-500"
                    )}>
                      <span>{format(date, 'MMM dd')}</span>
                      <span className="text-[10px] opacity-60 font-sans">{format(date, 'EEEE')}</span>
                    </div>
                  </td>

                  {/* Account Columns */}
                  {accounts.map(acc => {
                    const dayTxs = transactions.filter(t => t.accountId === acc.id && t.date === dateStr);
                    const dayBills = filteredBills.filter(b => b.associatedAccountId === acc.id && b.dueDate === dateStr);
                    const virtualTxs = gridData.virtualTransactions?.[acc.id]?.[dateStr] || [];
                    const bal = gridData.projections[acc.id][dateStr];
                    const simVal = simulations[dateStr]?.[acc.id] || '';

                    return (
                      <td key={acc.id} className={cn(
                        "p-4 border-r border-gray-50 vertical-top align-top group min-h-[100px] transition-all",
                        acc.type === 'checking' && bal < 0 && "bg-red-50/80 ring-1 ring-inset ring-red-200"
                      )}>
                        {/* Summary / Balance Area */}
                        <div className="flex justify-between items-center mb-3">
                          <span className={cn(
                            "text-[9px] font-bold uppercase tracking-widest",
                            acc.type === 'checking' && bal < 0 ? "text-red-600" : "text-gray-300"
                          )}>
                            {acc.type === 'checking' ? 'BAL' : 'DUE'}
                          </span>
                          <span className={cn(
                            "text-xs font-mono font-bold px-1 rounded",
                            acc.type === 'checking' && bal < 0 
                              ? "text-white bg-red-600 animate-pulse ring-4 ring-red-600/20" 
                              : bal < 0 ? "text-error" : "text-brand-primary"
                          )}>
                            ${bal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </div>

                        {/* Events List */}
                        <div className="space-y-1.5 mb-3">
                          {dayTxs.map(tx => (
                            <div key={tx.id} className="flex items-center justify-between gap-1 group/item">
                              <span className="text-[11px] text-gray-600 truncate group-hover/item:overflow-visible group-hover/item:whitespace-normal group-hover/item:bg-white group-hover/item:z-10 group-hover/item:relative group-hover/item:pr-2">
                                {tx.description}
                              </span>
                              <span className={cn(
                                "text-[10px] font-mono whitespace-nowrap",
                                tx.amount > 0 ? "text-success" : "text-gray-900"
                              )}>
                                {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()}
                              </span>
                            </div>
                          ))}
                          {dayBills.map(bill => (
                            <div key={bill.id} className="flex items-center justify-between gap-1 text-blue-600">
                              <span className="text-[11px] truncate flex items-center gap-1">
                                <Info size={10} /> Bill: {bill.name}
                              </span>
                              <span className="text-[10px] font-mono">-{bill.amount.toLocaleString()}</span>
                            </div>
                          ))}
                          {virtualTxs.map((vtx, idx) => (
                            <div 
                              key={`vtx-${idx}`} 
                              className={cn(
                                "flex items-center justify-between gap-1 italic cursor-pointer hover:bg-purple-50 p-0.5 rounded transition-colors group/vtx",
                                vtx.isOverride ? "text-orange-600 font-bold" : "text-purple-600"
                              )}
                              onClick={() => setEditingVtx({ ruleId: vtx.ruleId, date: dateStr, name: vtx.name, amount: vtx.amount })}
                            >
                              <span className="text-[11px] truncate flex items-center gap-1">
                                {vtx.isOverride ? <Edit2 size={10} /> : <RefreshCcw size={10} />} {vtx.name}
                              </span>
                              <span className="text-[10px] font-mono whitespace-nowrap">
                                {vtx.amount > 0 ? '+' : ''}{vtx.amount.toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Simulation Input (Future Only) */}
                        {isFuture && (
                          <div className="mt-auto opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                            <div className="relative">
                              <Calculator className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" size={10} />
                              <input 
                                type="number" 
                                placeholder="Simulate..."
                                className="w-full pl-6 pr-2 py-1 text-[10px] bg-gray-50 border border-gray-200 rounded focus:border-brand-primary focus:outline-none transition-all placeholder:text-[9px]"
                                value={simVal === 0 ? '' : simVal}
                                onChange={(e) => handleSimulate(dateStr, acc.id, e.target.value)}
                              />
                            </div>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* Footer Info */}
      <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-[11px] text-gray-500">
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand-primary/20 border border-brand-primary" />
            <span>Today's Baseline</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-100 border border-blue-400" />
            <span>Upcoming Bill</span>
          </div>
        </div>
        <p className="italic">Hover over future cells to enter simulation values. Click purple items (↻) to override specific recurring instances.</p>
      </div>

      {editingVtx && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl relative"
          >
            <button onClick={() => setEditingVtx(null)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold mb-2">Adjust Instance</h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-6">
              {format(new Date(editingVtx.date), 'MMMM dd, yyyy')}
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Description Override</label>
                <input 
                  className="input-field w-full text-sm" 
                  value={editingVtx.name}
                  onChange={(e) => setEditingVtx({...editingVtx, name: e.target.value})}
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Amount Override</label>
                <input 
                  type="number"
                  className="input-field w-full font-mono text-sm" 
                  value={isNaN(editingVtx.amount) ? "" : editingVtx.amount}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setEditingVtx({...editingVtx, amount: isNaN(val) ? 0 : val});
                  }}
                />
              </div>
              <button 
                onClick={() => {
                  onAddOverride(editingVtx.ruleId, editingVtx.date, editingVtx.amount, editingVtx.name);
                  setEditingVtx(null);
                }}
                className="btn-primary w-full py-3 rounded-xl font-bold"
              >
                Apply One-Time Change
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
