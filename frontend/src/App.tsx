import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { DisplaySettingsProvider } from './contexts/DisplaySettingsContext.tsx';
import ManuscriptViewer from './pages/ManuscriptViewer.tsx';
import VerseId from './pages/verse/VerseId.tsx';
import NewDataEntry from './pages/NewDataEntry.tsx';
import SearchDatabase from './pages/SearchDatabase.tsx';
import ManualDifferentiation from './pages/ManualDifferentiation.tsx';
import Settings from './pages/Settings.tsx';
import PhylogeneticAnalysis from './pages/PhylogeneticAnalysis.tsx';
import Login from './pages/Login.tsx';
import { collationService } from './services/collationService';

// Protected Route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    return <Navigate to="/login" />;
  }
  return <>{children}</>;
};

function App() {
  return (
    <Router>
      <DisplaySettingsProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/search-database" />} />
          <Route path="/manuscript-viewer/:sigla" element={<ProtectedRoute><ManuscriptViewer /></ProtectedRoute>} />
          <Route path="/verse/:verseNumber" element={<ProtectedRoute><VerseId /></ProtectedRoute>} />
          <Route path="/new-data-entry" element={<ProtectedRoute><NewDataEntry /></ProtectedRoute>} />
          <Route path="/search-database" element={<ProtectedRoute><SearchDatabase /></ProtectedRoute>} />
          <Route path="/manual-differentiation" element={<ProtectedRoute><ManualDifferentiation /></ProtectedRoute>} />
          <Route path="/phylogenetic-analysis" element={<ProtectedRoute><PhylogeneticAnalysis /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/search-database" />} />
        </Routes>
      </DisplaySettingsProvider>
    </Router>
  );
}

export default App; 