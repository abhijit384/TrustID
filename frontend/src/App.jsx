import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { SidebarProvider, useSidebar } from './context/SidebarContext';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { NewScreening } from './pages/NewScreening';
import { Analysis } from './pages/Analysis';
import { AIAnalysis } from './pages/AIAnalysis';
import { Documents } from './pages/Documents';
import { History } from './pages/History';
import { Reports } from './pages/Reports';
import { AuditTrail } from './pages/AuditTrail';
import { Analytics } from './pages/Analytics';
import { UserManagement } from './pages/UserManagement';
import { Settings } from './pages/Settings';
import { Profile } from './pages/Profile';
import { AccessRestricted } from './pages/AccessRestricted';

import { ErrorBoundary } from './components/ErrorBoundary';

// Route protection component enforcing real RBAC
const ProtectedLayout = ({ children, requiredAdmin = false }) => {
  const { user, isAdmin } = useAuth();
  const { isOpen } = useSidebar();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If user tries to manually access an admin-only route, show 403 Access Restricted
  const isUnauthorized = requiredAdmin && !isAdmin;

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex transition-colors duration-200">
      {/* Fixed Left Sidebar */}
      <Sidebar />

      {/* Main Area */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${isOpen ? 'ml-64' : 'ml-0'}`}>
        {/* Fixed Top Navbar */}
        <Navbar />

        {/* Scrollable Main Content Body */}
        <main className="flex-1 mt-16 p-8 max-w-7xl w-full mx-auto">
          <ErrorBoundary>
            {isUnauthorized ? <AccessRestricted /> : children}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <SidebarProvider>
        <AuthProvider>
        <BrowserRouter>
        <Routes>
          {/* Public Landing & Login */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />

          {/* Authenticated Workspace */}
          <Route path="/dashboard" element={
            <ProtectedLayout>
              <Dashboard />
            </ProtectedLayout>
          } />

          <Route path="/screenings/new" element={
            <ProtectedLayout>
              <NewScreening />
            </ProtectedLayout>
          } />

          <Route path="/new-screening" element={
            <ProtectedLayout>
              <NewScreening />
            </ProtectedLayout>
          } />

          <Route path="/analysis/:screeningId" element={
            <ProtectedLayout>
              <Analysis />
            </ProtectedLayout>
          } />

          <Route path="/screenings/:screeningId" element={
            <ProtectedLayout>
              <Analysis />
            </ProtectedLayout>
          } />

          {/* Dedicated AI Analysis Module */}
          <Route path="/ai-analysis" element={
            <ProtectedLayout>
              <AIAnalysis />
            </ProtectedLayout>
          } />

          <Route path="/documents" element={
            <ProtectedLayout>
              <Documents />
            </ProtectedLayout>
          } />

          {/* Screening / Analysis History */}
          <Route path="/history" element={
            <ProtectedLayout>
              <History />
            </ProtectedLayout>
          } />

          <Route path="/my-activity" element={
            <ProtectedLayout>
              <History />
            </ProtectedLayout>
          } />

          <Route path="/reports" element={
            <ProtectedLayout>
              <Reports />
            </ProtectedLayout>
          } />

          {/* User Profile */}
          <Route path="/profile" element={
            <ProtectedLayout>
              <Profile />
            </ProtectedLayout>
          } />

          {/* Admin Only Routes - Show 403 when accessed by User */}
          <Route path="/audit" element={
            <ProtectedLayout requiredAdmin={true}>
              <AuditTrail />
            </ProtectedLayout>
          } />

          <Route path="/analytics" element={
            <ProtectedLayout requiredAdmin={true}>
              <Analytics />
            </ProtectedLayout>
          } />

          <Route path="/users" element={
            <ProtectedLayout requiredAdmin={true}>
              <UserManagement />
            </ProtectedLayout>
          } />

          <Route path="/settings" element={
            <ProtectedLayout requiredAdmin={true}>
              <Settings />
            </ProtectedLayout>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
        </AuthProvider>
      </SidebarProvider>
    </ThemeProvider>
  );
}
