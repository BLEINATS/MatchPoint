import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, DollarSign, Trophy, Users, Shield, Handshake } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout/Layout';
import Button from '../components/Forms/Button';

const Home: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    { 
        icon: Calendar, 
        title: 'Agenda Inteligente e Gestão de Aulas', 
        description: 'Gerencie reservas, aulas e mensalistas em um calendário unificado, evitando conflitos de horário e automatizando a gestão de turmas.' 
    },
    { 
        icon: DollarSign, 
        title: 'Pagamentos Online e Financeiro', 
        description: 'Receba pagamentos via Pix e Cartão, controle o fluxo de caixa, despesas e tenha uma visão clara da saúde financeira do seu negócio.' 
    },
    { 
        icon: Trophy, 
        title: 'Torneios e Eventos', 
        description: 'Organize torneios completos com gestão de chaves e gerencie orçamentos para festas e eventos corporativos com facilidade.' 
    },
    { 
        icon: Users, 
        title: 'Jogos em Grupo e Notificações', 
        description: 'Permita que seus clientes criem jogos, convidem amigos e interajam através de um sistema de notificações integrado.' 
    },
    { 
        icon: Shield, 
        title: 'Equipe com Permissões', 
        description: 'Adicione funcionários e defina permissões de acesso detalhadas para cada um, controlando o que eles podem ver e fazer no sistema.' 
    },
    { 
        icon: Handshake, 
        title: 'Atletas de Aluguel', 
        description: 'Crie um marketplace de atletas de aluguel, gerando uma nova fonte de receita para sua arena e para os jogadores.' 
    },
  ];

  return (
    <Layout showHeader={false}>
      <div className="bg-white dark:bg-brand-gray-950">
        <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 flex justify-between items-center">
            <div className="flex items-center">
                <Calendar className="h-8 w-8 text-brand-blue-500" />
                <span className="ml-2 text-xl font-bold text-brand-gray-900 dark:text-white">MatchPlay</span>
            </div>
            <Button onClick={() => navigate('/auth')} variant="outline">
                Entrar / Cadastrar
            </Button>
        </header>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 sm:pt-20 sm:pb-24">
          <div className="text-center">
            <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl text-brand-gray-900 dark:text-white mb-6">
              Sua Arena, <span className="text-brand-blue-500">Totalmente Automatizada</span>
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-lg sm:text-xl text-brand-gray-600 dark:text-brand-gray-400 mb-8 max-w-3xl mx-auto">
              Do agendamento de quadras à gestão financeira e engajamento de clientes. O MatchPlay é o sistema completo para levar sua arena ao próximo nível.
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="flex justify-center">
              <div className="inline-flex flex-col sm:flex-row gap-4">
                  <Button onClick={() => navigate('/auth')} size="lg" className="text-lg px-8 py-4">Começar gratuitamente</Button>
                  <Button onClick={() => navigate('/arenas')} variant="outline" size="lg" className="text-lg px-8 py-4">Explorar Arenas</Button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="py-16 sm:py-24 bg-brand-gray-50 dark:bg-brand-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-brand-gray-900 dark:text-white mb-4">Funcionalidades Pensadas para o Sucesso da sua Arena</h2>
            <p className="text-lg sm:text-xl text-brand-gray-600 dark:text-brand-gray-400 max-w-2xl mx-auto">Uma solução completa que automatiza reservas e facilita o dia a dia do seu negócio.</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div key={index} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }} className="text-center p-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-brand-blue-500/10 rounded-full mb-4">
                  <feature.icon className="h-8 w-8 text-brand-blue-500" />
                </div>
                <h3 className="text-xl font-semibold text-brand-gray-900 dark:text-white mb-2">{feature.title}</h3>
                <p className="text-brand-gray-600 dark:text-brand-gray-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-brand-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">Pronto para começar?</h2>
            <p className="text-lg sm:text-xl text-blue-100 mb-8 max-w-2xl mx-auto">Junte-se a centenas de donos de arena que já usam o MatchPlay para crescer seus negócios.</p>
            <Button onClick={() => navigate('/auth')} variant="secondary" size="lg" className="bg-white text-brand-blue-600 hover:bg-brand-gray-100 text-lg px-8 py-4">Criar minha arena grátis</Button>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default Home;
