import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthProvider';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { createStorageBucket } from './lib/supabaseApi';

function App() {
  useEffect(() => {
    createStorageBucket().catch(err => {
      console.warn('⚠️ Storage bucket setup required. See SUPABASE-STORAGE-SETUP.md');
    });
  }, []);

  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <Outlet />
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
