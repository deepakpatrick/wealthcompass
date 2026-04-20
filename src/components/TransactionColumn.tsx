import React from 'react';
import { motion } from 'motion/react';
import { Transaction } from '../types';
import { format } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface TransactionColumnProps {
  accountName: string;
  accountColor: string;
  transactions: Transaction[];
  balance: number;
}

export const TransactionColumn: React.FC<TransactionColumnProps> = ({ accountName, accountColor, transactions, balance }) => {
  return (
    <div className="flex flex-col h-full w-80 min-w-80 border-r border-gray-200 bg-white/50">
      <div className="p-4 border-bottom border-gray-200" style={{ borderTop: `4px solid ${accountColor}` }}>
        <h3 className="font-semibold text-lg truncate">{accountName}</h3>
        <p className="text-2xl font-mono tracking-tight mt-1">
          ${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </p>
      </div>
      
      <div className="flex-1 overflow-y-auto px-2 py-4 space-y-2">
        {transactions.map((tx) => (
          <motion.div
            key={tx.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-white rounded-xl shadow-sm border border-gray-100 hover:border-brand-primary/20 transition-all cursor-pointer group"
          >
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-mono text-gray-400 uppercase">
                {format(new Date(tx.date), 'MMM dd')}
              </span>
              <span className={cn(
                "text-sm font-medium",
                tx.amount > 0 ? "text-success" : "text-brand-primary"
              )}>
                {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            
            <p className="text-sm font-medium mt-1 line-clamp-1 group-hover:line-clamp-none transition-all">
              {tx.description}
            </p>
            
            <div className="mt-2 flex items-center gap-2">
              <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-md text-[10px] font-medium uppercase tracking-wider">
                {tx.category}
              </span>
            </div>
          </motion.div>
        ))}
        
        {transactions.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400 opacity-50">
            <span className="text-sm italic">No recent transactions</span>
          </div>
        )}
      </div>
    </div>
  );
}
