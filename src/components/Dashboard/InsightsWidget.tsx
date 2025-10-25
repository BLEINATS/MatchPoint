import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, TrendingUp, Star, TrendingDown, Lightbulb } from 'lucide-react';
import { Reserva, Aluno, Quadra } from '../../types';
import { parseDateStringAsLocal } from '../../utils/dateUtils';
import { getDay, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

interface InsightsWidgetProps {
  reservas: Reserva[];
  alunos: Aluno[];
  quadras: Quadra[];
}

const InsightsWidget: React.FC<InsightsWidgetProps> = ({ reservas, alunos, quadras }) => {
  const peakTimeInsight = useMemo(() => {
    if (reservas.length < 15) return null;

    const counts: { [key: string]: number } = {};
    reservas.forEach(r => {
      if (r.status === 'cancelada') return;
      const date = parseDateStringAsLocal(r.date);
      const day = getDay(date);
      const hour = parseInt(r.start_time.split(':')[0], 10);
      const key = `${day}-${hour}`;
      counts[key] = (counts[key] || 0) + 1;
    });

    let maxCount = 0;
    let peakKey = '';
    Object.keys(counts).forEach(key => {
      if (counts[key] > maxCount) {
        maxCount = counts[key];
        peakKey = key;
      }
    });

    if (maxCount < 4) return null;

    const [dayStr, hourStr] = peakKey.split('-');
    const dayOfWeek = ['Domingos', 'Segundas', 'Terças', 'Quartas', 'Quintas', 'Sextas', 'Sábados'][parseInt(dayStr, 10)];
    const hour = `${hourStr}:00`;

    return {
      icon: TrendingUp,
      title: "Horário de Pico Identificado",
      text: `Seu horário mais movimentado é nas ${dayOfWeek} por volta das ${hour}. Considere criar promoções para horários de menor movimento para aumentar a receita.`,
      color: 'text-green-500',
    };
  }, [reservas]);

  const topClientInsight = useMemo(() => {
    if (alunos.length < 3 || reservas.length < 10) return null;

    const monthStart = startOfMonth(new Date());
    const monthEnd = endOfMonth(new Date());

    const monthlyReservations = reservas.filter(r => {
      if (r.status === 'cancelada') return false;
      const rDate = parseDateStringAsLocal(r.date);
      return isWithinInterval(rDate, { start: monthStart, end: monthEnd });
    });

    const clientBookings: { [key: string]: number } = {};
    monthlyReservations.forEach(r => {
      if (r.clientName) {
        clientBookings[r.clientName] = (clientBookings[r.clientName] || 0) + 1;
      }
    });

    let topClient = '';
    let maxBookings = 0;
    Object.keys(clientBookings).forEach(clientName => {
      if (clientBookings[clientName] > maxBookings) {
        maxBookings = clientBookings[clientName];
        topClient = clientName;
      }
    });

    if (maxBookings < 3) return null;

    return {
      icon: Star,
      title: "Cliente Destaque do Mês",
      text: `${topClient} é seu cliente mais frequente este mês com ${maxBookings} reservas. Que tal oferecer um brinde ou um desconto especial?`,
      color: 'text-yellow-500',
    };
  }, [reservas, alunos]);
  
  const lowOccupancyInsight = useMemo(() => {
    if (quadras.length === 0 || reservas.length < 5) return null;

    const counts: { [key: string]: number } = {};
    // Check for morning hours on weekdays
    for (let day = 1; day <= 5; day++) { // Mon-Fri
      for (let hour = 8; hour <= 12; hour++) { // 8am-12pm
        const key = `${day}-${hour}`;
        counts[key] = 0;
      }
    }

    reservas.forEach(r => {
      if (r.status === 'cancelada') return;
      const date = parseDateStringAsLocal(r.date);
      const day = getDay(date);
      const hour = parseInt(r.start_time.split(':')[0], 10);
      if (day >= 1 && day <= 5 && hour >= 8 && hour <= 12) {
        const key = `${day}-${hour}`;
        counts[key] = (counts[key] || 0) + 1;
      }
    });

    let minCount = Infinity;
    let lowKey = '';
    Object.keys(counts).forEach(key => {
      if (counts[key] < minCount) {
        minCount = counts[key];
        lowKey = key;
      }
    });
    
    if (minCount > 0) return null;

    const [dayStr, hourStr] = lowKey.split('-');
    const dayOfWeek = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][parseInt(dayStr, 10)];
    const hour = `${hourStr}:00`;

    return {
      icon: TrendingDown,
      title: "Oportunidade de Ocupação",
      text: `As manhãs de ${dayOfWeek}-feira, por volta das ${hour}, estão com baixa ocupação. Crie uma promoção para atrair mais jogadores nesse horário.`,
      color: 'text-blue-500',
    };
  }, [reservas, quadras]);


  const insights = useMemo(() => [topClientInsight, peakTimeInsight, lowOccupancyInsight].filter(Boolean), [topClientInsight, peakTimeInsight, lowOccupancyInsight]);
  const [currentInsightIndex, setCurrentInsightIndex] = useState(0);

  useEffect(() => {
    if (insights.length > 1) {
      const timer = setInterval(() => {
        setCurrentInsightIndex(prev => (prev + 1) % insights.length);
      }, 10000); // Change insight every 10 seconds
      return () => clearInterval(timer);
    }
  }, [insights.length]);

  const insight = insights[currentInsightIndex];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ delay: 0.3 }} 
      className="bg-gradient-to-br from-brand-blue-500 to-brand-blue-700 dark:from-brand-blue-600 dark:to-brand-blue-800 rounded-xl shadow-lg p-6 text-white flex flex-col justify-between min-h-[230px]"
    >
      <div>
        <h3 className="font-bold text-xl mb-4 flex items-center">
          <Sparkles className="h-5 w-5 mr-2 text-yellow-300" /> 
          Insights & Oportunidades
        </h3>
        <div className="mt-4">
          <AnimatePresence mode="wait">
            {insight ? (
              <motion.div
                key={currentInsightIndex}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.5 }}
                className="flex items-start gap-4"
              >
                <div className={`p-2 bg-white/10 rounded-full`}>
                  <insight.icon className={`h-6 w-6 ${insight.color}`} />
                </div>
                <div>
                  <h4 className="font-semibold">{insight.title}</h4>
                  <p className="text-sm text-blue-100 mt-1 line-clamp-3">{insight.text}</p>
                </div>
              </motion.div>
            ) : (
              <div className="flex items-start gap-4">
                <div className="p-2 bg-white/10 rounded-full">
                  <Lightbulb className="h-6 w-6 text-blue-200" />
                </div>
                <div>
                  <h4 className="font-semibold">Nenhum insight disponível</h4>
                  <p className="text-sm text-blue-100 mt-1 line-clamp-3">Continue usando o sistema para gerar análises sobre sua arena.</p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
      {insights.length > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {insights.map((_, index) => (
            <div key={index} className={`h-1.5 rounded-full transition-all duration-300 ${index === currentInsightIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/50'}`} />
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default InsightsWidget;
