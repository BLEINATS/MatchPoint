import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, Loader2, ChevronLeft, ChevronRight, DollarSign, TrendingUp, TrendingDown, BarChart, Users } from 'lucide-react';
import Layout from '../components/Layout/Layout';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { localApi } from '../lib/localApi';
import { Reserva, FinanceTransaction, Torneio } from '../types';
import Button from '../components/Forms/Button';
import { format, startOfMonth, endOfMonth, subMonths, addMonths, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCurrency } from '../utils/formatters';
import DonutChart from '../components/Financeiro/DonutChart';
import TransactionTable from '../components/Financeiro/TransactionTable';

const StatCard: React.FC<{ label: string, value: string | number, icon: React.ElementType, color: string }> = ({ label, value, icon: Icon, color }) => (
  <div className="bg-white dark:bg-brand-gray-800 p-6 rounded-lg shadow-md border border-brand-gray-200 dark:border-brand-gray-700">
    <div className="flex items-center">
      <div className={`p-3 rounded-lg mr-4 ${color.replace('text-', 'bg-').replace('-500', '-100')} dark:${color.replace('text-', 'bg-').replace('-500', '-900/50')}`}>
        <Icon className={`h-6 w-6 ${color}`} />
      </div>
      <div>
        <p className="text-sm font-medium text-brand-gray-600 dark:text-brand-gray-400">{label}</p>
        <p className="text-2xl font-bold text-brand-gray-900 dark:text-white">{value}</p>
      </div>
    </div>
  </div>
);

const FinanceiroProfissional: React.FC = () => {
    const { selectedArenaContext: arena } = useAuth();
    const { addToast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    
    const [reservas, setReservas] = useState<Reserva[]>([]);
    const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
    const [torneios, setTorneios] = useState<Torneio[]>([]);

    const loadData = useCallback(async () => {
        if (!arena) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const [reservasRes, transactionsRes, torneiosRes] = await Promise.all([
                localApi.select<Reserva>('reservas', arena.id),
                localApi.select<FinanceTransaction>('finance_transactions', arena.id),
                localApi.select<Torneio>('torneios', arena.id),
            ]);
            setReservas(reservasRes.data || []);
            setTransactions(transactionsRes.data || []);
            setTorneios(torneiosRes.data || []);
        } catch (error: any) {
            addToast({ message: `Erro ao carregar dados: ${error.message}`, type: 'error' });
        } finally {
            setIsLoading(false);
        }
    }, [arena, addToast]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const financialData = useMemo(() => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(currentMonth);

        const receitas: { source: string; value: number, date: Date, description: string }[] = [];
        
        reservas.forEach(r => {
            if ((r.status === 'confirmada' || r.status === 'realizada') && r.payment_status === 'pago' && r.total_price && r.total_price > 0) {
                const paymentDate = r.updated_at ? new Date(r.updated_at) : new Date(r.created_at);
                if (isWithinInterval(paymentDate, { start: monthStart, end: monthEnd })) {
                    receitas.push({ source: 'Reservas', value: r.total_price, date: paymentDate, description: `Reserva: ${r.clientName}` });
                }
            }
        });

        transactions.forEach(t => {
            if (t.type === 'receita' && isWithinInterval(new Date(t.date), { start: monthStart, end: monthEnd })) {
                receitas.push({ source: t.category || 'Outras Receitas', value: t.amount, date: new Date(t.date), description: t.description });
            }
        });
        
        torneios.forEach(t => {
            (t.participants || []).forEach(p => {
                const category = t.categories.find(c => c.id === p.categoryId);
                const fee = category?.registration_fee || 0;
                p.players.forEach(player => {
                    if (player.payment_status === 'pago') {
                        if (isWithinInterval(new Date(t.start_date), { start: monthStart, end: monthEnd })) {
                            receitas.push({ source: 'Torneios', value: fee, date: new Date(t.start_date), description: `Inscrição: ${t.name} - ${player.name}` });
                        }
                    }
                });
            });
        });

        const despesas = transactions
            .filter(t => t.type === 'despesa' && isWithinInterval(new Date(t.date), { start: monthStart, end: monthEnd }))
            .map(t => ({ source: t.category || 'Outras Despesas', value: t.amount, date: new Date(t.date), description: t.description }));

        const totalReceita = receitas.reduce((sum, item) => sum + item.value, 0);
        const totalDespesas = despesas.reduce((sum, item) => sum + item.value, 0);
        const lucroLiquido = totalReceita - totalDespesas;
        const totalReservasPagas = reservas.filter(r => r.payment_status === 'pago' && isWithinInterval(new Date(r.date), { start: monthStart, end: monthEnd })).length;
        const ticketMedio = totalReservasPagas > 0 ? totalReceita / totalReservasPagas : 0;

        const receitaPorCategoria = receitas.reduce((acc, item) => {
            const category = item.source || 'Outras Receitas';
            acc[category] = (acc[category] || 0) + item.value;
            return acc;
        }, {} as Record<string, number>);

        const despesasPorCategoria = despesas.reduce((acc, item) => {
            const category = item.source || 'Outras Despesas';
            acc[category] = (acc[category] || 0) + item.value;
            return acc;
        }, {} as Record<string, number>);

        const allTransactionsForTable = [
            ...receitas.map(r => ({ ...r, type: 'receita', category: r.source, amount: r.value })),
            ...despesas.map(d => ({ ...d, type: 'despesa', category: d.source, amount: d.value }))
        ].sort((a, b) => b.date.getTime() - a.date.getTime());

        return {
            totalReceita,
            totalDespesas,
            lucroLiquido,
            ticketMedio,
            receitaPorCategoria,
            despesasPorCategoria,
            allTransactionsForTable
        };

    }, [currentMonth, reservas, transactions, torneios]);

    const handleMonthChange = (direction: 'prev' | 'next') => {
        setCurrentMonth(prev => direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1));
    };

    if (isLoading) {
        return <Layout><div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin text-brand-blue-500"/></div></Layout>;
    }

    return (
        <Layout>
            <div className="px-4 sm:px-6 lg:px-8 py-8">
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                    <Link to="/financeiro" className="inline-flex items-center text-sm font-medium text-brand-gray-600 dark:text-brand-gray-400 hover:text-brand-blue-500 dark:hover:text-brand-blue-400 transition-colors mb-4">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Voltar para o Financeiro Simples
                    </Link>
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-brand-gray-900 dark:text-white">Dashboard Financeiro Detalhado</h1>
                            <p className="text-brand-gray-600 dark:text-brand-gray-400 mt-2">Uma visão completa da saúde financeira da sua arena.</p>
                        </div>
                        <div className="flex items-center gap-2 bg-white dark:bg-brand-gray-800 p-2 rounded-lg border border-brand-gray-200 dark:border-brand-gray-700">
                            <Button variant="ghost" size="sm" onClick={() => handleMonthChange('prev')}><ChevronLeft/></Button>
                            <span className="font-semibold w-40 text-center capitalize">{format(currentMonth, 'MMMM yyyy', { locale: ptBR })}</span>
                            <Button variant="ghost" size="sm" onClick={() => handleMonthChange('next')}><ChevronRight/></Button>
                        </div>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard label="Receita Total" value={formatCurrency(financialData.totalReceita)} icon={TrendingUp} color="text-green-500" />
                    <StatCard label="Despesas Totais" value={formatCurrency(financialData.totalDespesas)} icon={TrendingDown} color="text-red-500" />
                    <StatCard label="Lucro Líquido" value={formatCurrency(financialData.lucroLiquido)} icon={DollarSign} color={financialData.lucroLiquido >= 0 ? "text-blue-500" : "text-red-500"} />
                    <StatCard label="Ticket Médio" value={formatCurrency(financialData.ticketMedio)} icon={Users} color="text-purple-500" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    <DonutChart data={financialData.receitaPorCategoria} title="Distribuição de Receitas" />
                    <DonutChart data={financialData.despesasPorCategoria} title="Distribuição de Despesas" />
                </div>

                <TransactionTable transactions={financialData.allTransactionsForTable} />
            </div>
        </Layout>
    );
};

export default FinanceiroProfissional;
