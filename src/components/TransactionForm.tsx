import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, TrendingUp, TrendingDown, AlignLeft } from 'lucide-react';
import { motion } from 'motion/react';

const schema = z.object({
  amount: z.number().positive(),
  category: z.enum(['income', 'expense']),
  date: z.string(),
  description: z.string().min(1).max(500),
});

type FormData = z.infer<typeof schema>;

export default function TransactionForm({
  onClose,
  onSubmit,
  currency = 'TZS',
}: {
  onClose: () => void;
  onSubmit: (data: FormData) => void;
  currency?: string;
}) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      category: 'income'
    }
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 selection:bg-gold-light selection:text-white font-sans">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-bg-main/70 backdrop-blur-xl"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative aelyn-panel w-full max-w-lg rounded-[28px] p-10"
      >
        <div className="flex items-center justify-between mb-12">
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.3em] mb-2">New Transaction</p>
            <h2 className="text-3xl font-semibold text-white tracking-tight">
              Record Movement <span className="text-sky">.</span>
            </h2>
          </div>
          <button onClick={onClose} className="p-3 bg-white/5 border border-white/10 rounded-2xl text-slate-400 hover:text-white transition-all" type="button">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div className="flex bg-white/5 p-2 rounded-2xl border border-white/10">
            <label className="flex-1 cursor-pointer">
              <input type="radio" {...register('category')} value="income" className="sr-only peer" />
              <div className="flex items-center justify-center gap-2 py-4 rounded-xl transition-all peer-checked:bg-white/10 peer-checked:text-white group">
                <TrendingUp size={16} className="text-slate-400 group-peer-checked:text-sky" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em]">Income</span>
              </div>
            </label>
            <label className="flex-1 cursor-pointer">
              <input type="radio" {...register('category')} value="expense" className="sr-only peer" />
              <div className="flex items-center justify-center gap-2 py-4 rounded-xl transition-all peer-checked:bg-white/10 peer-checked:text-white group">
                <TrendingDown size={16} className="text-slate-400 group-peer-checked:text-sky" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em]">Expense</span>
              </div>
            </label>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-3 ml-2">Amount</label>
            <div className="relative">
              <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-[11px]">
                {currency}
              </span>
              <input 
                type="number" 
                {...register('amount', { valueAsNumber: true })}
                className="w-full pl-16 pr-6 py-6 bg-white/5 border border-white/10 rounded-2xl focus:bg-white/7 focus:ring-4 focus:ring-sky/10 outline-none transition-all text-2xl font-semibold font-mono tracking-tighter text-white"
                placeholder="0"
              />
            </div>
            {errors.amount && <p className="text-[10px] text-rose-500 font-bold mt-3 ml-2 uppercase tracking-wide">{errors.amount.message}</p>}
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-3 ml-2">Description</label>
            <div className="relative">
              <AlignLeft className="absolute left-6 top-6 text-slate-500" size={18} />
              <textarea 
                {...register('description')}
                className="w-full pl-16 pr-6 py-6 bg-white/5 border border-white/10 rounded-2xl focus:bg-white/7 focus:ring-4 focus:ring-sky/10 outline-none transition-all text-sm font-medium min-h-[120px] resize-none text-white placeholder:text-slate-600"
                placeholder="Describe the nature of this transaction..."
              />
            </div>
            {errors.description && <p className="text-[10px] text-rose-500 font-bold mt-3 ml-2 uppercase tracking-wide">{errors.description.message}</p>}
          </div>

          <div className="flex gap-6">
            <div className="flex-1">
              <label className="block text-[11px] font-semibold text-slate-400 mb-3 ml-2">Date</label>
              <input 
                type="date"
                {...register('date')}
                className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:bg-white/7 focus:ring-4 focus:ring-sky/10 outline-none transition-all text-xs font-semibold font-mono tracking-wider text-white"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-sky to-sky-2 text-navy py-5 rounded-2xl font-semibold text-sm hover:brightness-110 active:brightness-95 transition-all disabled:opacity-50 shadow-[0_18px_50px_rgba(46,229,210,0.15)] mt-8"
          >
            {isSubmitting ? 'Saving…' : 'Confirm Transaction'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
