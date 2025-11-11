import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout/Layout';
import AnalyticsDashboard from '../components/Dashboard/AnalyticsDashboard';
import ClientDashboard from '../components/Client/ClientDashboard';
import { Loader2 } from 'lucide-react';
import OnboardingModal from '../components/Onboarding/OnboardingModal';
import { AnimatePresence } from 'framer-motion';

const Dashboard: React.FC = () => {
    const { profile, isLoading, selectedArenaContext: arena } = useAuth();
    const [showOnboarding, setShowOnboarding] = useState(false);

    useEffect(() => {
        if (!arena || profile?.role !== 'admin_arena') return;
        const onboardingKey = `onboarding_completed_${arena.id}`;
        const hasCompletedOnboarding = localStorage.getItem(onboardingKey);
        if (!hasCompletedOnboarding) {
            setShowOnboarding(true);
        }
    }, [arena, profile]);

    const handleOnboardingComplete = () => {
        if (!arena) return;
        const onboardingKey = `onboarding_completed_${arena.id}`;
        localStorage.setItem(onboardingKey, 'true');
        setShowOnboarding(false);
    };

    const handleReopenOnboarding = () => {
        setShowOnboarding(true);
    };

    if (isLoading) {
        return (
            <Layout>
                <div className="flex justify-center items-center h-screen">
                    <Loader2 className="h-8 w-8 animate-spin text-brand-blue-500"/>
                </div>
            </Layout>
        );
    }
    
    if (profile?.role === 'cliente' || profile?.role === 'atleta' || profile?.role === 'professor' || profile?.role === 'funcionario') {
        return (
            <Layout>
                <ClientDashboard />
            </Layout>
        );
    }

    if (profile?.role === 'admin_arena') {
        return (
            <Layout>
                <div className="px-4 sm:px-6 lg:px-8 py-8">
                    <AnalyticsDashboard onReopenOnboarding={handleReopenOnboarding} />
                </div>
                <AnimatePresence>
                    {showOnboarding && (
                        <OnboardingModal
                            isOpen={showOnboarding}
                            onClose={handleOnboardingComplete}
                        />
                    )}
                </AnimatePresence>
            </Layout>
        );
    }

    // Fallback or other roles can be handled here
    return (
        <Layout>
            <div className="p-8 text-center">
                <h1 className="text-2xl font-bold">Bem-vindo!</h1>
                <p>Seu painel está sendo preparado.</p>
            </div>
        </Layout>
    );
};

export default Dashboard;
