import React from 'react';
import { useNavigate } from 'react-router-dom';
import Dashboard from './Dashboard';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const handleNavigateHome = () => {
    navigate('/dashboard');
  };

  return <Dashboard onNavigateHome={handleNavigateHome} />;
};

export default DashboardPage;
