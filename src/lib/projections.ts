import { format, addDays, addWeeks, addMonths, isAfter, isBefore, isSameDay, startOfDay } from 'date-fns';
import { Account, Transaction, Bill, RecurringRule, RuleOverride } from '../types';

export interface ProjectionPoint {
  date: string;
  balances: Record<string, number>;
}

export interface ProjectionResult {
  projections: Record<string, Record<string, number>>;
  virtualTransactions: Record<string, Record<string, { id: string, name: string, amount: number, ruleId: string, isOverride?: boolean }[]>>;
}

export function calculateProjections(
  accounts: Account[],
  transactions: Transaction[],
  bills: Bill[],
  recurringRules: RecurringRule[],
  simulations: Record<string, Record<string, number>>,
  overrides: RuleOverride[],
  startDate: Date,
  endDate: Date
): ProjectionResult {
  const today = startOfDay(new Date('2026-04-20'));
  const finalProjections: Record<string, Record<string, number>> = {};
  const virtualTransactions: Record<string, Record<string, { id: string, name: string, amount: number, ruleId: string, isOverride?: boolean }[]>> = {};

  accounts.forEach(acc => {
    finalProjections[acc.id] = {};
    virtualTransactions[acc.id] = {};
    
    // Find absolute start balance
    let balanceAtStart = acc.balance;
    const pastTxs = transactions.filter(t => t.accountId === acc.id && isAfter(new Date(t.date), startDate) && isBefore(new Date(t.date), today));
    pastTxs.forEach(t => balanceAtStart -= t.amount);
    
    let running = balanceAtStart;
    let curr = new Date(startDate);
    
    while (!isAfter(curr, endDate)) {
      const dStr = format(curr, 'yyyy-MM-dd');
      virtualTransactions[acc.id][dStr] = [];
      
      // Events on THIS day
      if (isSameDay(curr, today)) {
          running = acc.balance; // Sync with today's reality
      } else {
        // Historical
        if (isBefore(curr, today)) {
           const dayTxs = transactions.filter(t => t.accountId === acc.id && t.date === dStr);
           dayTxs.forEach(t => running += t.amount);
        } else {
           // Future
           const dayTxs = transactions.filter(t => t.accountId === acc.id && t.date === dStr && isAfter(new Date(t.date), today));
           dayTxs.forEach(t => running += t.amount);
           
           const dayBills = bills.filter(b => b.associatedAccountId === acc.id && b.dueDate === dStr);
           dayBills.forEach(b => running -= b.amount);

           const simVal = simulations[dStr]?.[acc.id] || 0;
           running += simVal;

           recurringRules.forEach(rule => {
             if (rule.accountId === acc.id && rule.isActive && !isBefore(curr, new Date(rule.startDate))) {
                if (matchesFrequency(curr, new Date(rule.startDate), rule.frequency)) {
                   // Check for Override
                   const override = overrides.find(o => o.ruleId === rule.id && o.date === dStr);
                   if (override) {
                      running += override.amount;
                      virtualTransactions[acc.id][dStr].push({ 
                        id: `vtx-${rule.id}-${dStr}`, 
                        name: override.name, 
                        amount: override.amount, 
                        ruleId: rule.id,
                        isOverride: true 
                      });
                   } else {
                      running += rule.amount;
                      virtualTransactions[acc.id][dStr].push({ 
                        id: `vtx-${rule.id}-${dStr}`, 
                        name: rule.name, 
                        amount: rule.amount, 
                        ruleId: rule.id 
                      });
                   }
                }
             }
           });
        }
      }
      
      finalProjections[acc.id][dStr] = running;
      curr = addDays(curr, 1);
    }
  });

  return { projections: finalProjections, virtualTransactions };
}

function subDays(d: Date, n: number) {
  const res = new Date(d);
  res.setDate(res.getDate() - n);
  return res;
}

function matchesFrequency(current: Date, start: Date, freq: RecurringRule['frequency']): boolean {
  const diffDays = Math.floor((current.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  
  switch(freq) {
    case 'daily': return true;
    case 'weekly': return diffDays % 7 === 0;
    case 'biweekly': return diffDays % 14 === 0;
    case 'fifteen_days': return diffDays % 15 === 0;
    case 'monthly': return current.getDate() === start.getDate();
    case 'first_of_month': return current.getDate() === 1;
    default: return false;
  }
}
