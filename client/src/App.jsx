import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/layout/Layout';

// Main Public Flow
import ShiftWizard from './features/public-portal/ShiftWizard';

import LoginPage from './features/admin/auth/LoginPage';
import AdminLayout from './features/admin/layout/AdminLayout';
import Dashboard from './features/admin/Dashboard';
import ConfigView from './features/admin/config/ConfigView';
import ServiceList from './features/admin/services/ServiceList';
import ClientList from './features/admin/clients/ClientList';
import NotificationConfig from './features/admin/config/NotificationConfig';
import StaffList from './features/admin/staff/StaffList';
import AgendaView from './features/admin/agenda/AgendaView';

function App() {
  return (
    <>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Layout />}>
          <Route index element={<ShiftWizard />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin" element={<LoginPage />} />
        
        {/* Admin Panel (Protected) */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="config" element={<ConfigView />} />
          <Route path="services" element={<ServiceList />} />
          <Route path="clients" element={<ClientList />} />
          <Route path="notifications" element={<NotificationConfig />} />
          <Route path="staff" element={<StaffList />} />
          <Route path="agenda" element={<AgendaView />} />
        </Route>
      </Routes>
      <Toaster position="top-right" />
    </>
  );

}

export default App;
