import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, AlignLeft } from 'lucide-react';
import { motion } from 'motion/react';

const schema = z.object({
  amount: z.number().positive(),
  description: z.string().min(1).max(500),
  date: z.string(),
  status: z.enum(['Paid', 'Unpaid']),
});

type FormData = z.infer<typeof schema>;

export default function DebtForm({
  onClose,
  onSubmit,
  currency = 'TZS',
}: {
  onClose: () => void;
  onSubmit: (data: any) => void;
  currency?: string;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      status: 'Unpaid',
    },
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
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.3em] mb-2">Debt Registry</p>
            <h2 className="text-3xl font-semibold text-white tracking-tight">
              Record Debt <span className="text-sky">.</span>
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-3 bg-white/5 border border-white/10 rounded-2xl text-slate-400 hover:text-white transition-all"
            type="button"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
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
            {errors.amount && (
              <p className="text-[11px] text-danger font-semibold mt-3 ml-2 tracking-tight">{errors.amount.message}</p>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-3 ml-2">Description</label>
            <div className="relative">
              <AlignLeft className="absolute left-6 top-6 text-slate-500" size={18} />
              <textarea
                {...register('description')}
                className="w-full pl-16 pr-6 py-6 bg-white/5 border border-white/10 rounded-2xl focus:bg-white/7 focus:ring-4 focus:ring-sky/10 outline-none transition-all text-sm font-medium min-h-[120px] resize-none text-white placeholder:text-slate-600"
                placeholder="Creditor, invoice, or note…"
              />
            </div>
            {errors.description && (
              <p className="text-[11px] text-danger font-semibold mt-3 ml-2 tracking-tight">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-3 ml-2">Date</label>
              <input
                type="date"
                {...register('date')}
                className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:bg-white/7 focus:ring-4 focus:ring-sky/10 outline-none transition-all text-xs font-semibold font-mono tracking-wider text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-3 ml-2">Status</label>
              <select
                {...register('status')}
                className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:bg-white/7 focus:ring-4 focus:ring-sky/10 outline-none transition-all text-xs font-semibold appearance-none cursor-pointer text-white"
              >
                <option value="Unpaid">Unpaid</option>
                <option value="Paid">Paid</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-sky to-sky-2 text-navy py-5 rounded-2xl font-semibold text-sm hover:brightness-110 active:brightness-95 transition-all disabled:opacity-50 shadow-[0_18px_50px_rgba(46,229,210,0.15)] mt-8"
          >
            {isSubmitting ? 'Saving…' : 'Save Debt'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

