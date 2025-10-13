import React from 'react';
import Layout from '../components/Layout/Layout';
import ClientDashboard from '../components/Client/ClientDashboard';

const ClientProfile: React.FC = () => {
  return (
    <Layout showHeader={false}>
      <ClientDashboard />
    </Layout>
  );
};

export default ClientProfile;
