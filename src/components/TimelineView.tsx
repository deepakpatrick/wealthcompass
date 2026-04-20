import React, { useMemo } from 'react';
import { Account, Transaction, Bill } from '../types';
import { format, isAfter, isBefore, startOfDay, addDays, differenceInDays } from 'date-fns';
import { motion } from 'motion/react';
import { ChevronDown, ArrowUpRight, ArrowDownLeft, Clock, Landmark } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface TimelineViewProps {
  accounts: Account[];
  transactions: Transaction[];
  bills: Bill[];
  searchQuery: string;
}

export const TimelineView: React.FC<TimelineViewProps> = ({ accounts, transactions, bills, searchQuery }) => {
  const today = startOfDay(new Date('2026-04-20'));

  const timelineData = useMemo(() => {
    // 1. Sort historical transactions
    const sortedPast = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // 2. Identify future bills
    const futureBills = bills.filter(b => isAfter(new Date(b.dueDate), today) || b.dueDate === format(today, 'yyyy-MM-dd'));
    
    // 3. Create a combined list of events
    const events: (Transaction | Bill)[] = [
      ...sortedPast,
      ...futureBills
    ].filter(ev => {
       const desc = 'description' in ev ? ev.description : ev.name;
       return desc.toLowerCase().includes(searchQuery.toLowerCase());
    });

    // 4. Group by date
    const grouped = events.reduce((acc, ev) => {
      const dateKey = 'date' in ev ? ev.date : ev.dueDate;
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(ev);
      return acc;
    }, {} as Record<string, (Transaction | Bill)[]>);

    // 5. Calculate Projected Balances for each date
    const accountProjections: Record<string, Record<string, number>> = {};
    
    accounts.forEach(acc => {
      accountProjections[acc.id] = {};
      
      const futureEvents = events.filter(e => {
        const d = 'date' in e ? e.date : e.dueDate;
        return isAfter(new Date(d), today) || d === format(today, 'yyyy-MM-dd');
      }).sort((a, b) => new Date('date' in a ? a.date : a.dueDate).getTime() - new Date('date' in b ? b.date : b.dueDate).getTime());

      const pastEvents = events.filter(e => {
        const d = 'date' in e ? e.date : e.dueDate;
        return isBefore(new Date(d), today);
      }).sort((a, b) => new Date('date' in b ? b.date : b.dueDate).getTime() - new Date('date' in a ? a.date : a.dueDate).getTime());

      // Future walk
      let fBalance = acc.balance;
      const futureDates = Array.from(new Set(futureEvents.map(e => 'date' in e ? e.date : e.dueDate))).sort();
      futureDates.forEach(d => {
        const dayEvents = futureEvents.filter(e => {
          const date = 'date' in e ? e.date : e.dueDate;
          const targetAccId = 'accountId' in e ? e.accountId : e.associatedAccountId;
          return date === d && targetAccId === acc.id;
        });
        
        dayEvents.forEach(e => {
          if ('dueDate' in e) {
             fBalance -= e.amount;
          } else {
             fBalance += e.amount;
          }
        });
        accountProjections[acc.id][d] = fBalance;
      });

      // Past walk
      let pBalance = acc.balance;
      const pastDatesFiltered = Array.from(new Set(pastEvents.map(e => 'date' in e ? e.date : e.dueDate))).sort((a,b) => new Date(b).getTime() - new Date(a).getTime());
      pastDatesFiltered.forEach(d => {
        const dayEvents = pastEvents.filter(e => {
          const date = 'date' in e ? e.date : e.dueDate;
          const targetAccId = 'accountId' in e ? e.accountId : e.associatedAccountId;
          return date === d && targetAccId === acc.id;
        });
        
        dayEvents.forEach(e => {
           if ('date' in e) {
             pBalance -= e.amount;
           }
        });
        accountProjections[acc.id][d] = pBalance;
      });
      
      accountProjections[acc.id][format(today, 'yyyy-MM-dd')] = acc.balance;
    });

    return {
      dates: Array.from(new Set(Object.keys(grouped))).sort(),
      grouped,
      accountProjections
    };
  }, [accounts, transactions, bills, searchQuery, today]);

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Balanced Summary Banner (Small horizontal scroll on top) */}
      <div className="h-14 border-b border-gray-100 flex items-center px-6 gap-6 overflow-x-auto no-scrollbar bg-white z-10">
        <div className="flex-shrink-0 text-[10px] font-bold text-gray-400 uppercase tracking-widest mr-2">Current</div>
        {accounts.map(acc => (
          <div key={acc.id} className="flex flex-col flex-shrink-0">
            <span className="text-[9px] font-bold text-gray-500 uppercase truncate max-w-[80px]">{acc.name}</span>
            <span className={cn(
              "text-xs font-mono font-bold",
              acc.balance < 0 ? "text-error" : "text-brand-primary"
            )}>
              ${acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-10 pb-40 space-y-12">
        {timelineData.dates.map((dateStr) => {
          const isFuture = isAfter(new Date(dateStr), today);
          const isToday = dateStr === format(today, 'yyyy-MM-dd');
          
          return (
            <div key={dateStr} className="relative pl-12 border-l border-gray-200">
              {/* Date Marker */}
              <div className={cn(
                "absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white shadow-sm transition-colors",
                isToday ? "bg-brand-primary scale-125" : isFuture ? "bg-blue-400" : "bg-gray-300"
              )} />
              
              <div className="flex flex-col md:flex-row md:items-baseline justify-between mb-6 group">
                <div>
                  <h3 className={cn(
                    "text-xl font-bold tracking-tight",
                    isToday ? "text-brand-primary" : "text-gray-900"
                  )}>
                    {format(new Date(dateStr), 'EEEE, MMMM do')}
                    {isToday && <span className="ml-3 text-xs bg-brand-primary text-white px-2 py-0.5 rounded-md uppercase tracking-wider">Today</span>}
                    {isFuture && <span className="ml-3 text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-md uppercase tracking-wider">Projected</span>}
                  </h3>
                </div>

                {/* Day Projections */}
                <div className="mt-4 md:mt-0 flex gap-4 overflow-x-auto no-scrollbar py-2">
                  {accounts.map(acc => {
                    const proj = timelineData.accountProjections[acc.id][dateStr];
                    if (proj === undefined) return null;
                    return (
                      <div key={acc.id} className={cn(
                        "bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 flex flex-col min-w-[100px] transition-all",
                        acc.type === 'checking' && proj < 0 && "bg-red-50 ring-1 ring-inset ring-red-200 border-red-100"
                      )}>
                        <span className={cn(
                          "text-[8px] font-bold uppercase truncate mb-0.5",
                          acc.type === 'checking' && proj < 0 ? "text-red-600" : "text-gray-400"
                        )}>{acc.name}</span>
                        <div className="flex items-center justify-between gap-2">
                           <span className="text-[10px] text-gray-500">{acc.type === 'checking' ? 'Avail' : 'Due'}</span>
                           <span className={cn(
                             "text-[10px] font-mono font-bold",
                             acc.type === 'checking' && proj < 0 ? "text-red-600 animate-pulse" : proj < 0 ? "text-error" : "text-brand-primary"
                           )}>${proj.toLocaleString()}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Day Content */}
              <div className="space-y-4">
                {timelineData.grouped[dateStr].map((item, idx) => {
                  const isTx = 'description' in item;
                  const itemColor = accounts.find(a => a.id === (isTx ? item.accountId : item.associatedAccountId))?.color || '#eee';
                  
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="glass-card p-4 flex items-center gap-6 group hover:translate-x-1"
                    >
                      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-50 text-gray-400 group-hover:scale-110 transition-transform">
                        {isTx ? (
                          item.amount > 0 ? <ArrowDownLeft size={20} className="text-success" /> : <ArrowUpRight size={20} />
                        ) : (
                          <Clock size={20} className="text-blue-500" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span 
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: itemColor }}
                          />
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                            {accounts.find(a => a.id === (isTx ? item.accountId : item.associatedAccountId))?.name}
                          </span>
                        </div>
                        <h4 className="font-medium text-gray-900 truncate">
                          {isTx ? item.description : `Upcoming: ${item.name}`}
                        </h4>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-gray-500">{isTx ? item.category : 'Bill Payment'}</span>
                          {!isTx && <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold">Planned</span>}
                        </div>
                      </div>

                      <div className="text-right">
                        <p className={cn(
                          "text-lg font-mono font-bold",
                          isTx && item.amount > 0 ? "text-success" : "text-brand-primary"
                        )}>
                          {isTx ? (item.amount > 0 ? '+' : '-') : '-'}${Math.abs(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          );
        })}
        
        {/* Endless Scroll Indicator */}
        <div className="pt-20 flex flex-col items-center gap-4 text-gray-400 animate-bounce">
           <Landmark size={32} className="opacity-20" />
           <p className="text-sm font-medium italic">Generating future projections...</p>
           <ChevronDown size={24} />
        </div>
      </div>
    </div>
  );
};
