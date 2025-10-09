import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout/Layout';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Star, Check } from 'lucide-react';
import Button from '../components/Forms/Button';
import { Arena } from '../types';

const Arenas: React.FC = () => {
  const { allArenas, memberships, followArena, user, profile } = useAuth();
  const navigate = useNavigate();

  const handleFollow = async (e: React.MouseEvent, arenaId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      navigate('/auth');
      return;
    }
    await followArena(arenaId);
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-brand-gray-900 dark:text-white">Explore Nossas Arenas</h1>
          <p className="mt-4 text-lg text-brand-gray-600 dark:text-brand-gray-400 max-w-2xl mx-auto">
            Encontre o lugar perfeito para sua próxima partida. Siga uma arena para começar a reservar.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {allArenas.map((arena, index) => {
            const isMember = memberships.some(m => m.arena_id === arena.id);
            return (
              <motion.div
                key={arena.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link to={`/${arena.slug}`} className="block bg-white dark:bg-brand-gray-800 rounded-xl shadow-lg hover:shadow-2xl dark:hover:shadow-brand-blue-500/10 transition-all duration-300 overflow-hidden h-full flex flex-col">
                  <div className="h-48 bg-brand-gray-200 dark:bg-brand-gray-700 overflow-hidden relative">
                    <img src={arena.logo_url || `https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://placehold.co/400x300?text=${arena.name}`} alt={arena.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <div className="absolute bottom-4 left-4 text-white">
                      <h3 className="font-bold text-2xl">{arena.name}</h3>
                      <div className="flex items-center text-sm opacity-90">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span>{arena.city}, {arena.state}</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center text-yellow-500 mb-4">
                        <Star className="h-5 w-5 fill-current" />
                        <Star className="h-5 w-5 fill-current" />
                        <Star className="h-5 w-5 fill-current" />
                        <Star className="h-5 w-5 fill-current" />
                        <Star className="h-5 w-5" />
                        <span className="ml-2 text-sm text-brand-gray-500 dark:text-brand-gray-400">(12 reviews)</span>
                      </div>
                      <p className="text-sm text-brand-gray-600 dark:text-brand-gray-400 mb-4">
                        A melhor arena de {arena.city} para beach tennis e futevôlei. Venha conhecer!
                      </p>
                    </div>
                    {profile?.role === 'cliente' && (
                       <Button 
                         onClick={(e) => handleFollow(e, arena.id)}
                         variant={isMember ? 'secondary' : 'primary'}
                         className="w-full mt-4"
                         disabled={isMember}
                       >
                         {isMember ? <><Check className="h-4 w-4 mr-2"/> Seguindo</> : 'Seguir Arena'}
                       </Button>
                    )}
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
};

export default Arenas;
