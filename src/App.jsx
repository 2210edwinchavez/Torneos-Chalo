import { useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { TournamentProvider } from './context/TournamentContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CurrencyProvider } from './context/CurrencyContext';
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

function FieldBackground() {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {/* Base verde césped */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(180deg, #1a4a1a 0%, #1e5c1e 25%, #226622 50%, #1e5c1e 75%, #1a4a1a 100%)',
      }} />
      {/* Franjas de césped */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 60px, rgba(0,0,0,0.08) 60px, rgba(0,0,0,0.08) 120px)',
      }} />
      {/* Líneas de cancha */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.18 }} viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice">
        <rect x="60" y="40" width="880" height="520" fill="none" stroke="white" strokeWidth="3"/>
        <line x1="500" y1="40" x2="500" y2="560" stroke="white" strokeWidth="3"/>
        <circle cx="500" cy="300" r="80" fill="none" stroke="white" strokeWidth="3"/>
        <circle cx="500" cy="300" r="4" fill="white"/>
        <rect x="60" y="170" width="130" height="260" fill="none" stroke="white" strokeWidth="3"/>
        <rect x="60" y="230" width="55" height="140" fill="none" stroke="white" strokeWidth="3"/>
        <path d="M 190 240 A 80 80 0 0 1 190 360" fill="none" stroke="white" strokeWidth="3"/>
        <circle cx="145" cy="300" r="4" fill="white"/>
        <rect x="810" y="170" width="130" height="260" fill="none" stroke="white" strokeWidth="3"/>
        <rect x="885" y="230" width="55" height="140" fill="none" stroke="white" strokeWidth="3"/>
        <path d="M 810 240 A 80 80 0 0 0 810 360" fill="none" stroke="white" strokeWidth="3"/>
        <circle cx="855" cy="300" r="4" fill="white"/>
        <rect x="40" y="258" width="20" height="84" fill="none" stroke="white" strokeWidth="3"/>
        <rect x="940" y="258" width="20" height="84" fill="none" stroke="white" strokeWidth="3"/>
        <path d="M 60 40 Q 75 40 75 55" fill="none" stroke="white" strokeWidth="2"/>
        <path d="M 940 40 Q 925 40 925 55" fill="none" stroke="white" strokeWidth="2"/>
        <path d="M 60 560 Q 75 560 75 545" fill="none" stroke="white" strokeWidth="2"/>
        <path d="M 940 560 Q 925 560 925 545" fill="none" stroke="white" strokeWidth="2"/>
      </svg>
      {/* Overlay oscuro para legibilidad */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.62)' }} />
    </div>
  );
}

function AppLayout() {
  const location = useLocation();
  const { isLoggedIn } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!isLoggedIn) return <Login />;

  return (
    <div className="app-layout" style={{ position: 'relative' }}>
      <FieldBackground />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}
      <div className="main-content" style={{ position: 'relative', zIndex: 1 }}>
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
        <CurrencyProvider>
          <TournamentProvider>
            <AppLayout />
          </TournamentProvider>
        </CurrencyProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
