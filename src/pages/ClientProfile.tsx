import React from 'react';
import Layout from '../components/Layout/Layout';
import ClientDashboard from '../components/Client/ClientDashboard';

const ClientProfile: React.FC = () => {
  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ClientDashboard />
      </div>
    </Layout>
  );
};

export default ClientProfile;
