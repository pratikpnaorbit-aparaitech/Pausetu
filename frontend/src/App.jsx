import React from 'react';
import { AdminProvider } from './context/AdminContext';
import AppRoutes from './AppRoutes';

export default function App() {
  return (
    <AdminProvider>
      <AppRoutes />
    </AdminProvider>
  );
}
