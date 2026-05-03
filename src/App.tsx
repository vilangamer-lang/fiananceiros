/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  PiggyBank, 
  Plus, 
  Trash2, 
  CreditCard, 
  Car, 
  Home, 
  Utensils, 
  TrendingDown, 
  TrendingUp, 
  Calendar,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Users,
  User as UserIcon,
  Heart
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  CartesianGrid
} from 'recharts';
import { Transaction, Category, TransactionType, UserType } from './types';
import { INITIAL_DATA, INITIAL_INCOME_SAMUEL, INITIAL_INCOME_EMLYN } from './constants';

const categoryIcons: Record<Category, any> = {
  home: Home,
  food: Utensils,
  credit_card: CreditCard,
  financing: Car,
  salary: TrendingUp,
  leisure: PiggyBank,
  other: PiggyBank,
};

const categoryColors: Record<Category, string> = {
  home: 'bg-blue-100 text-blue-600',
  food: 'bg-orange-100 text-orange-600',
  credit_card: 'bg-purple-100 text-purple-600',
  financing: 'bg-indigo-100 text-indigo-600',
  salary: 'bg-green-100 text-green-600',
  leisure: 'bg-pink-100 text-pink-600',
  other: 'bg-gray-100 text-gray-600',
};

export default function App() {
  const [activeUser, setActiveUser] = useState<UserType>('Samuel');
  
  const [allTransactions, setAllTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('piggify_all_transactions');
    if (saved) return JSON.parse(saved);
    // Migration: If old transactions exist, mark them as Samuel's
    const old = localStorage.getItem('piggify_transactions');
    return old ? JSON.parse(old).map((t: any) => ({ ...t, userId: 'Samuel' })) : INITIAL_DATA;
  });
  
  const [incomes, setIncomes] = useState<Record<'Samuel' | 'Emlyn', number>>(() => {
    const saved = localStorage.getItem('piggify_incomes');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Correção automática se o usuário ainda tiver o valor antigo de 3000 para Emlyn
      if (parsed.Emlyn === 3000) {
        parsed.Emlyn = 5000;
      }
      return parsed;
    }
    return {
      Samuel: INITIAL_INCOME_SAMUEL,
      Emlyn: INITIAL_INCOME_EMLYN
    };
  });

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');

  // Persistence
  useEffect(() => {
    localStorage.setItem('piggify_all_transactions', JSON.stringify(allTransactions));
    localStorage.setItem('piggify_incomes', JSON.stringify(incomes));
  }, [allTransactions, incomes]);

  // Reset filter when user changes
  useEffect(() => {
    setFilterType('all');
  }, [activeUser]);

  // Derived Values
  const currentTransactions = useMemo(() => {
    let base = activeUser === 'Casal' ? allTransactions : allTransactions.filter(t => t.userId === activeUser);
    if (filterType === 'all') return base;
    return base.filter(t => t.type === filterType);
  }, [allTransactions, activeUser, filterType]);

  const totalGanhos = useMemo(() => {
    const baseIncome = activeUser === 'Casal' ? incomes.Samuel + incomes.Emlyn : incomes[activeUser];
    const extraIncomes = currentTransactions
      .filter(t => t.type === 'income')
      .reduce((acc, t) => acc + t.amount, 0);
    return baseIncome + extraIncomes;
  }, [incomes, currentTransactions, activeUser]);

  const totalExpenses = useMemo(() => 
    currentTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0),
    [currentTransactions]
  );

  const balance = totalGanhos - totalExpenses;
  const healthPercentage = Math.max(0, (balance / totalGanhos) * 100);

  // Previsão para o Próximo Mês
  const forecast = useMemo(() => {
    // Gastos que vão se repetir:
    // 1. Fixos (sem installments)
    // 2. Parcelados onde current < total
    const recurringExpenses = currentTransactions
      .filter(t => t.type === 'expense')
      .filter(t => !t.installments || (t.installments.current < t.installments.total))
      .reduce((acc, t) => acc + t.amount, 0);
    
    // Assumimos que o ganho base se repete
    const recurringIncome = activeUser === 'Casal' ? incomes.Samuel + incomes.Emlyn : incomes[activeUser as 'Samuel' | 'Emlyn'];
    
    return {
      expenses: recurringExpenses,
      income: recurringIncome,
      balance: recurringIncome - recurringExpenses
    };
  }, [currentTransactions, incomes, activeUser]);

  const chartData = useMemo(() => [
    { name: 'Ganhos', value: totalGanhos, color: '#22c55e' },
    { name: 'Gastos', value: totalExpenses, color: '#ef4444' }
  ], [totalGanhos, totalExpenses]);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Tem certeza que deseja apagar?')) {
      setAllTransactions(prev => prev.filter(t => t.id !== id));
    }
  };

  const handleReset = () => {
    if (confirm('Deseja redefinir todos os dados? Isso limpará Samuel e Emlyn.')) {
      setAllTransactions(INITIAL_DATA);
      setIncomes({ Samuel: INITIAL_INCOME_SAMUEL, Emlyn: INITIAL_INCOME_EMLYN });
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (activeUser === 'Casal') {
      alert("Selecione Samuel ou Emlyn para adicionar um novo registro.");
      return;
    }

    const formData = new FormData(e.currentTarget);
    const type = formData.get('type') as TransactionType;
    
    const transactionData: Transaction = {
      id: editingTransaction?.id || Date.now().toString(),
      userId: activeUser as 'Samuel' | 'Emlyn',
      description: formData.get('description') as string,
      amount: Number(formData.get('amount')),
      type: type,
      category: formData.get('category') as Category,
      date: formData.get('date') as string,
      installments: type === 'expense' && formData.get('isInstallment') === 'on' ? {
        current: Number(formData.get('currentInstallment')),
        total: Number(formData.get('totalInstallment')),
      } : undefined
    };

    if (editingTransaction) {
      setAllTransactions(prev => prev.map(t => t.id === editingTransaction.id ? transactionData : t));
    } else {
      setAllTransactions(prev => [transactionData, ...prev]);
    }
    
    setIsAddOpen(false);
    setEditingTransaction(null);
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsAddOpen(true);
  };

  const handleIncomeEdit = () => {
    if (activeUser === 'Casal') return;
    const userKey = activeUser as 'Samuel' | 'Emlyn';
    const newIncome = prompt(`Qual o ganho mensal de ${userKey}?`, incomes[userKey].toString());
    if (newIncome && !isNaN(Number(newIncome))) {
      setIncomes(prev => ({ ...prev, [userKey]: Number(newIncome) }));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-32">
      {/* User Selector - Professional Sub-Nav */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-slate-200 px-6 py-3 flex items-center justify-around sticky top-0 z-30 shadow-sm transition-all duration-300">
        {[
          { id: 'Samuel', icon: UserIcon, label: 'Samuel', color: 'text-blue-600', bg: 'bg-blue-50/50' },
          { id: 'Casal', icon: Heart, label: 'Conta Casal', color: 'text-indigo-600', bg: 'bg-indigo-50/50' },
          { id: 'Emlyn', icon: UserIcon, label: 'Emlyn', color: 'text-pink-600', bg: 'bg-pink-50/50' }
        ].map(user => (
          <button
            key={user.id}
            onClick={() => setActiveUser(user.id as UserType)}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl transition-all duration-300 active:scale-95 ${
              activeUser === user.id 
                ? `${user.bg} ${user.color} ring-1 ring-inset ring-slate-100` 
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <user.icon size={18} strokeWidth={activeUser === user.id ? 2.5 : 2} />
            <span className={`text-xs font-bold tracking-tight ${activeUser === user.id ? 'opacity-100' : 'opacity-60'}`}>
              {user.label}
            </span>
            {activeUser === user.id && (
              <motion.div layoutId="user-indicator" className={`w-1 h-1 rounded-full ${user.color.replace('text', 'bg')}`} />
            )}
          </button>
        ))}
      </nav>

      <header className="bg-white border-b border-slate-100">
        <div className="max-w-xl mx-auto px-6 py-10">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <motion.div 
                whileHover={{ rotate: 5, scale: 1.05 }}
                className={`w-14 h-14 rounded-[22px] flex items-center justify-center text-white shadow-xl ${
                activeUser === 'Casal' ? 'bg-indigo-600 shadow-indigo-100' : 
                activeUser === 'Samuel' ? 'bg-blue-600 shadow-blue-100' : 'bg-pink-600 shadow-pink-100'
              }`}>
                {activeUser === 'Casal' ? <Users size={32} /> : <PiggyBank size={32} />}
              </motion.div>
              <div>
                <h1 className="text-2xl font-display font-black tracking-tight text-slate-900">
                  {activeUser === 'Casal' ? 'Conta Casal' : `Cofre de ${activeUser}`}
                </h1>
                <p className="text-sm text-slate-500 font-semibold tracking-tight">
                  {activeUser === 'Casal' ? 'Foco nos objetivos da família' : 'Gestão financeira pessoal'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={handleReset}
                title="Redefinir Dados"
                className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
              >
                <Trash2 size={20} />
              </button>
              <div className="text-right">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-0.5">Saldo Livre</span>
                <span className={`text-2xl font-display font-black tracking-tight ${balance >= 0 ? 'text-slate-900' : 'text-red-600'}`}>
                  R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-slate-500 uppercase">
              <span>Energia do Cofre</span>
              <span>{Math.round(healthPercentage)}%</span>
            </div>
            <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${healthPercentage}%` }}
                className={`h-full rounded-full ${
                  healthPercentage > 50 ? 'bg-green-500' : healthPercentage > 20 ? 'bg-orange-500' : 'bg-red-500'
                }`}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-6 pt-8 space-y-8">
        {/* Analytics Card */}
        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-slate-50 rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity" />
          
          <div className="relative">
            <div className="flex items-center justify-between mb-8">
              <div className="flex flex-col">
                <h2 className="font-display font-black text-slate-800 tracking-tight">Fluxo de Caixa</h2>
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none mt-1">Análise Mensal</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-full">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tempo Real</span>
              </div>
            </div>
            
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 800 }}
                    dy={12}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc', radius: 16 }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-slate-900 text-white p-4 rounded-3xl shadow-2xl border border-white/10 backdrop-blur-md">
                            <p className="text-[10px] font-black uppercase text-slate-400 mb-1">{payload[0].payload.name}</p>
                            <p className="text-lg font-display font-black">
                              R$ {Number(payload[0].value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar 
                    dataKey="value" 
                    radius={[16, 16, 16, 16]} 
                    barSize={48}
                    onClick={(data) => {
                      const type = data.name === 'Ganhos' ? 'income' : 'expense';
                      setFilterType(prev => prev === type ? 'all' : type);
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    {chartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color} 
                        fillOpacity={filterType === 'all' || (filterType === 'income' && entry.name === 'Ganhos') || (filterType === 'expense' && entry.name === 'Gastos') ? 1 : 0.2}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={handleIncomeEdit}
            disabled={activeUser === 'Casal'}
            className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex flex-col items-start hover:bg-slate-50 transition-all hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed group text-left"
          >
            <div className="w-14 h-14 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110">
              <TrendingUp size={28} strokeWidth={2.5} />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Ganhos Totais</span>
            <span className="text-2xl font-display font-black text-slate-900 leading-tight">R$ {totalGanhos.toLocaleString('pt-BR')}</span>
          </button>
          
          <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex flex-col items-start">
            <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-6">
              <TrendingDown size={28} strokeWidth={2.5} />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Gastos Totais</span>
            <span className="text-2xl font-display font-black text-slate-900 leading-tight">R$ {totalExpenses.toLocaleString('pt-BR')}</span>
          </div>
        </div>

        {/* Status Card - Visual Progress */}
        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <h3 className="font-display font-bold text-slate-800 tracking-tight">Status {activeUser === 'Casal' ? 'Familiar' : 'do Mês'}</h3>
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1">Orçamento Planejado</span>
            </div>
            <span className="text-xs font-black py-1.5 px-3.5 bg-slate-100 text-slate-600 rounded-full uppercase tracking-tighter shadow-sm">
              {Math.round((totalExpenses / totalGanhos) * 100)}% Usado
            </span>
          </div>
          
          <div className="space-y-4">
            <div className="h-3.5 bg-slate-50 rounded-full overflow-hidden p-0.5 border border-slate-100">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (totalExpenses / totalGanhos) * 100)}%` }}
                className={`h-full rounded-full transition-all duration-700 ${
                  (totalExpenses / totalGanhos) < 0.7 ? 'bg-green-500' : 
                  (totalExpenses / totalGanhos) < 0.9 ? 'bg-amber-500' : 
                  'bg-red-500'
                }`}
              />
            </div>
            <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none px-1">
              <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-slate-200" /> Início</span>
              <span className="flex items-center gap-1">Teto R$ {totalGanhos.toLocaleString('pt-BR')} <div className="w-1.5 h-1.5 rounded-full bg-red-400/30" /></span>
            </div>
          </div>
        </div>

        {/* Forecast Card - Dark & Premium */}
        <div className="bg-[#0f172a] p-8 rounded-[40px] text-white shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <Calendar size={160} strokeWidth={1} />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-10">
              <div className="flex flex-col">
                <h3 className="text-xl font-display font-black text-white tracking-tight">Previsão Futura</h3>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Projeção Baseada em Dados</span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white/5 text-white/40 flex items-center justify-center backdrop-blur-sm border border-white/10 group-hover:bg-white/10 group-hover:text-white transition-all">
                <ChevronRight size={24} strokeWidth={2.5} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-10 border-b border-white/5 pb-10">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Receita Projetada</span>
                <span className="text-2xl font-display font-black text-white">R$ {forecast.income.toLocaleString('pt-BR')}</span>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Fixos Previstos</span>
                <span className="text-2xl font-display font-black text-red-400">R$ {forecast.expenses.toLocaleString('pt-BR')}</span>
              </div>
            </div>

            <div className="bg-white/5 rounded-[32px] p-6 border border-white/10 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-slate-400">Saldo Livre Planejado</span>
                <span className={`text-2xl font-display font-black ${forecast.balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  R$ {forecast.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <p className="text-[10px] text-slate-600 font-bold leading-relaxed">
                *O sistema considera apenas parcelas restantes e faturas recorrentes para esta estimativa.
              </p>
            </div>
          </div>
        </div>

        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-display font-black text-slate-900 tracking-tight flex items-center gap-3">
                Linha do Tempo <span className="bg-slate-200/60 text-slate-600 text-[11px] py-1 px-3 rounded-full font-black">{currentTransactions.length}</span>
              </h2>
              {filterType !== 'all' && (
                <button 
                  onClick={() => setFilterType('all')}
                  className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1 hover:bg-slate-50 w-fit px-2 py-0.5 rounded-full transition-colors"
                >
                  <Plus size={10} className="rotate-45" /> Limpar Filtro ({filterType === 'income' ? 'Ganhos' : 'Gastos'})
                </button>
              )}
            </div>
            {activeUser !== 'Casal' && (
              <button 
                onClick={() => setIsAddOpen(true)}
                className="bg-slate-900 text-white text-xs font-black py-3 px-6 rounded-2xl flex items-center gap-2 hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-200"
              >
                <Plus size={18} strokeWidth={3} /> NOVO REGISTRO
              </button>
            )}
          </div>
          <div className="space-y-4">
            <AnimatePresence mode='popLayout'>
              {currentTransactions.map((t) => {
                const Icon = categoryIcons[t.category] || PiggyBank;
                const isInstallment = t.installments && t.installments.total > 1;
                
                return (
                  <motion.div
                    key={t.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={() => handleEdit(t)}
                    className="group bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-slate-100 transition-all relative overflow-hidden cursor-pointer active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-5">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${categoryColors[t.category]}`}>
                        <Icon size={28} strokeWidth={2} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 truncate">
                            <h3 className="font-bold text-slate-800 truncate tracking-tight text-base">{t.description}</h3>
                            {activeUser === 'Casal' && (
                              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-lg border ${
                                t.userId === 'Samuel' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-pink-50 text-pink-600 border-pink-100'
                              }`}>
                                {t.userId}
                              </span>
                            )}
                          </div>
                          <span className={`text-lg font-display font-black shrink-0 ml-3 ${t.type === 'income' ? 'text-green-600' : 'text-slate-900'}`}>
                            {t.type === 'income' ? '+' : '-'} R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        
                        <div className="flex items-center flex-wrap gap-3 text-xs font-bold text-slate-400 uppercase tracking-tighter">
                          <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-full">
                            <Calendar size={14} className="text-slate-300" /> {new Date(t.date).toLocaleDateString('pt-BR')}
                          </span>

                          {isInstallment && (
                            <span className="flex items-center gap-1.5 text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">
                              <CheckCircle2 size={12} /> Pago {t.installments?.current}/{t.installments?.total}
                            </span>
                          )}

                          {t.installments && t.installments.current === t.installments.total && (
                            <span className="flex items-center gap-1.5 bg-amber-50 text-amber-600 px-3 py-1.5 rounded-full border border-amber-100 italic">
                               ✨ ÚLTIMA!
                            </span>
                          )}
                          
                          {!t.installments && t.type === 'expense' && (
                            <span className="flex items-center gap-1.5 bg-slate-50 text-slate-500 px-3 py-1.5 rounded-full border border-slate-100">
                              RECORRENTE
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <button 
                        onClick={(e) => handleDelete(e, t.id)}
                        className="opacity-0 group-hover:opacity-100 p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>

                    {isInstallment && (
                      <div className="mt-5 h-1.5 bg-slate-50 rounded-full overflow-hidden p-0.5 border border-slate-100">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${(t.installments!.current / t.installments!.total) * 100}%` }}
                          className="h-full bg-blue-500 rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(59,130,246,0.3)]"
                        />
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </section>
      </main>

      {/* Floating Modern Button */}
      {activeUser !== 'Casal' && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-full max-w-xl px-6 pointer-events-none z-40">
          <motion.button 
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsAddOpen(true)}
            className="pointer-events-auto w-full bg-slate-900 text-white font-display font-black py-5 rounded-[32px] shadow-[0_25px_50px_-12px_rgba(15,23,42,0.5)] flex items-center justify-center gap-3 transition-all ring-4 ring-white"
          >
            <div className="bg-white/15 p-1.5 rounded-xl">
              <Plus size={22} strokeWidth={3} />
            </div>
            NOVO REGISTRO PARA {activeUser.toUpperCase()}
          </motion.button>
        </div>
      )}

      {/* Add Modal */}
      <AnimatePresence>
        {isAddOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center p-0 md:p-6 sm:items-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setIsAddOpen(false); setEditingTransaction(null); }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="relative w-full max-w-lg bg-white rounded-t-[40px] md:rounded-[40px] p-10 shadow-2xl overflow-hidden border-t border-slate-100">
              <div className="w-16 h-1.5 bg-slate-100 rounded-full mx-auto mb-10 md:hidden" />
              
              <div className="flex items-center justify-between mb-10">
                <h2 className="text-3xl font-display font-black text-slate-900 tracking-tight">
                  {editingTransaction ? 'Editar Registro' : 'Novo Registro'}
                </h2>
                <div className="bg-slate-50 px-4 py-1.5 rounded-full border border-slate-100">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Para: </span>
                  <span className="text-[10px] font-black text-primary uppercase tracking-widest leading-none">
                    {activeUser === 'Casal' ? (editingTransaction?.userId || 'Samuel') : activeUser}
                  </span>
                </div>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-6">
                  <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                    <label className="flex-1">
                      <input type="radio" name="type" value="expense" defaultChecked={editingTransaction?.type !== 'income'} className="hidden peer" />
                      <div className="text-center py-3.5 rounded-[14px] font-black text-[11px] uppercase cursor-pointer transition-all peer-checked:bg-white peer-checked:text-slate-900 peer-checked:shadow-sm text-slate-400 hover:text-slate-500">
                        💸 Saída
                      </div>
                    </label>
                    <label className="flex-1">
                      <input type="radio" name="type" value="income" defaultChecked={editingTransaction?.type === 'income'} className="hidden peer" />
                      <div className="text-center py-3.5 rounded-[14px] font-black text-[11px] uppercase cursor-pointer transition-all peer-checked:bg-white peer-checked:text-green-600 peer-checked:shadow-sm text-slate-400 hover:text-slate-500">
                        💰 Entrada
                      </div>
                    </label>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">O que você registrou?</label>
                    <input required name="description" type="text" defaultValue={editingTransaction?.description} placeholder="Ex: Mercado, Aluguer, Extra..." className="w-full bg-[#f8fafc] border-2 border-transparent rounded-[20px] p-5 font-bold focus:border-slate-200 focus:bg-white outline-none transition-all placeholder:text-slate-300" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Valor Total</label>
                      <div className="relative">
                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">R$</span>
                        <input required name="amount" type="number" step="0.01" defaultValue={editingTransaction?.amount} placeholder="0,00" className="w-full bg-[#f8fafc] border-2 border-transparent rounded-[20px] p-5 pl-12 font-display font-black text-xl focus:border-slate-200 focus:bg-white outline-none transition-all placeholder:text-slate-200" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Categoria</label>
                      <select name="category" defaultValue={editingTransaction?.category || 'credit_card'} className="w-full bg-[#f8fafc] border-2 border-transparent rounded-[20px] p-5 font-bold focus:border-slate-200 focus:bg-white outline-none appearance-none transition-all cursor-pointer">
                        <option value="salary">💰 Salário</option>
                        <option value="leisure">🎨 Lazer / Estilo</option>
                        <option value="credit_card">💳 Cartão de Crédito</option>
                        <option value="financing">🚗 Financiamento</option>
                        <option value="home">🏠 Moradia</option>
                        <option value="food">🍕 Alimentação</option>
                        <option value="other">❓ Outros</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Data da Operação</label>
                    <input required name="date" type="date" defaultValue={editingTransaction?.date || new Date().toISOString().split('T')[0]} className="w-full bg-[#f8fafc] border-2 border-transparent rounded-[20px] p-5 font-bold focus:border-slate-200 focus:bg-white outline-none transition-all" />
                  </div>

                  <div className="bg-slate-50 p-6 rounded-[28px] border border-slate-100 space-y-5">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-800">Pagamento Parcelado?</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-0.5">Controla o cofre automaticamente</span>
                      </div>
                      <input name="isInstallment" type="checkbox" defaultChecked={!!editingTransaction?.installments} className="w-6 h-6 rounded-lg border-2 border-slate-200 text-slate-900 focus:ring-slate-900 transition-all cursor-pointer" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="relative">
                        <input name="currentInstallment" type="number" defaultValue={editingTransaction?.installments?.current} placeholder="Nº Parcela" className="bg-white border border-slate-200/50 rounded-xl p-4 text-sm font-bold w-full outline-none focus:border-slate-300" />
                      </div>
                      <div className="relative">
                        <input name="totalInstallment" type="number" defaultValue={editingTransaction?.installments?.total} placeholder="Total Parc." className="bg-white border border-slate-200/50 rounded-xl p-4 text-sm font-bold w-full outline-none focus:border-slate-300" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => { setIsAddOpen(false); setEditingTransaction(null); }} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-5 rounded-[22px] transition-all active:scale-95">
                    Cancelar
                  </button>
                  <button type="submit" className="flex-[2] bg-slate-900 hover:bg-slate-800 text-white font-display font-black py-5 rounded-[22px] shadow-2xl shadow-slate-200 transition-all active:scale-95">
                    {editingTransaction ? 'Salvar Edição' : 'Confirmar Registro'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
