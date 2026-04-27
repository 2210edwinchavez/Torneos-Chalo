import { useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { TournamentProvider } from './context/TournamentContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Tournaments from './pages/Tournaments';
import Players from './pages/Players';
import Teams from './pages/Teams';
import Fixtures from './pages/Fixtures';
import Standings from './pages/Standings';
import Bracket from './pages/Bracket';

function AppLayout() {
  const location = useLocation();
  const { isLoggedIn } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!isLoggedIn) return <Login />;

  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}
      <div className="main-content">
        <Header currentPath={location.pathname} onMenuToggle={() => setSidebarOpen(v => !v)} />
        <main className="page-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/torneos" element={<Tournaments />} />
            <Route path="/jugadores" element={<Players />} />
            <Route path="/equipos" element={<Teams />} />
            <Route path="/partidos" element={<Fixtures />} />
            <Route path="/posiciones" element={<Standings />} />
            <Route path="/bracket" element={<Bracket />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <TournamentProvider>
          <AppLayout />
        </TournamentProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
