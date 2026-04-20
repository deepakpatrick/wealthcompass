import React, { useMemo } from 'react';
import { Account, Transaction, Bill, RecurringRule, RuleOverride } from '../types';
import { format, startOfDay, addYears, eachDayOfInterval } from 'date-fns';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine } from 'recharts';
import { AlertCircle, TrendingDown } from 'lucide-react';
import { calculateProjections } from '../lib/projections';

interface CashFlowChartProps {
  accounts: Account[];
  transactions: Transaction[];
  bills: Bill[];
  recurringRules: RecurringRule[];
  overrides: RuleOverride[];
}

export const CashFlowChart: React.FC<CashFlowChartProps> = ({ accounts, transactions, bills, recurringRules, overrides }) => {
  const today = startOfDay(new Date('2026-04-20'));
  
  const chartData = useMemo(() => {
    const end = addYears(today, 1);
    const dates = eachDayOfInterval({ start: today, end });
    const { projections } = calculateProjections(
      accounts,
      transactions,
      bills,
      recurringRules,
      {}, // no simulations in chart view currently
      overrides,
      today,
      end
    );

    return dates.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const row: any = { date: format(date, 'MMM dd'), fullDate: dateStr };
      accounts.forEach(acc => {
        row[acc.name] = projections[acc.id][dateStr];
      });
      return row;
    });
  }, [accounts, transactions, bills, recurringRules, today]);

  // Find risk points (negative checking balances)
  const risks = useMemo(() => {
    const riskDates: { date: string; account: string; val: number }[] = [];
    chartData.forEach(d => {
      accounts.filter(a => a.type === 'checking').forEach(acc => {
        if (d[acc.name] < 0) {
          riskDates.push({ date: d.date, account: acc.name, val: d[acc.name] });
        }
      });
    });
    return riskDates.slice(0, 5); // Just show first few
  }, [chartData, accounts]);

  return (
    <div className="h-full flex flex-col p-8 bg-white overflow-y-auto">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">12-Month Liquidity Forecast</h3>
          <p className="text-gray-500">Projected cash flow inclusive of recurring salaries, bills, and debt repayments.</p>
        </div>
        {risks.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-4 max-w-md animate-in fade-in slide-in-from-top-4">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 flex-shrink-0">
              <AlertCircle size={24} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-red-900 mb-1">Liquidity Warning</h4>
              <p className="text-xs text-red-700 leading-relaxed">
                Checking account balances are projected to drop below zero starting on <span className="font-bold underline">{risks[0].date}</span>.
                Review scheduled bill payments or simulate transfers to mitigate risk.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 min-h-[400px] w-full bg-gray-50 rounded-2xl border border-gray-100 p-6">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: '#999' }}
              interval={30}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: '#999' }}
              tickFormatter={(val) => `$${val}`}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
            />
            <Legend verticalAlign="top" height={36}/>
            <ReferenceLine y={0} stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" label={{ position: 'right', value: 'Zero Overdraft', fill: '#ef4444', fontSize: 10 }} />
            
            {accounts.map((acc, idx) => (
              <Line 
                key={acc.id}
                type="monotone" 
                dataKey={acc.name} 
                stroke={acc.color} 
                strokeWidth={acc.type === 'checking' ? 3 : 1}
                dot={false}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 pb-20">
        <div className="glass-card p-4 border-l-4 border-l-brand-primary">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Max Projected Liquidity</p>
          <p className="text-xl font-bold text-gray-900 font-mono">
            ${Math.max(...chartData.map(d => accounts.filter(a => a.type === 'checking').reduce((sum, acc) => sum + d[acc.name], 0))).toLocaleString()}
          </p>
        </div>
        <div className="glass-card p-4 border-l-4 border-l-error">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Lowest Net Liquid Day</p>
          <div className="flex items-center gap-2">
            <TrendingDown size={14} className="text-error" />
            <p className="text-xl font-bold text-error font-mono">
              ${Math.min(...chartData.map(d => accounts.filter(a => a.type === 'checking').reduce((sum, acc) => sum + d[acc.name], 0))).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="glass-card p-4 border-l-4 border-l-blue-400">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Accounts at Risk</p>
          <p className="text-xl font-bold text-gray-900">{accounts.filter(a => risks.some(r => r.account === a.name)).length} Accounts</p>
        </div>
      </div>
    </div>
  );
};

// Helper for date conversion used in projections
function isBefore(date1: Date, date2: Date) {
  return date1.getTime() < date2.getTime();
}
