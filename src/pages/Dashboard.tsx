import React from 'react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout/Layout';
import AnalyticsDashboard from '../components/Dashboard/AnalyticsDashboard';
import ClientDashboard from '../components/Client/ClientDashboard';
import { Loader2 } from 'lucide-react';

const Dashboard: React.FC = () => {
    const { profile, isLoading } = useAuth();

    if (isLoading || !profile) {
        return (
            <Layout>
                <div className="flex justify-center items-center h-screen">
                    <Loader2 className="h-8 w-8 animate-spin text-brand-blue-500"/>
                </div>
            </Layout>
        );
    }

    if (profile.role === 'cliente') {
        return <ClientDashboard />;
    }

    return (
        <Layout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <AnalyticsDashboard />
            </div>
        </Layout>
    );
};

export default Dashboard;
