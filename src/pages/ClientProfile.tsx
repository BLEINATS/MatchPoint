import React from 'react';
import ClientDashboard from '../components/Client/ClientDashboard';
import Layout from '../components/Layout/Layout';

const ClientProfile: React.FC = () => {
  return (
    <Layout>
      <ClientDashboard />
    </Layout>
  );
};

export default ClientProfile;
