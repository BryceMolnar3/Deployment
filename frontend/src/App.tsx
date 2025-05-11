import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { DisplaySettingsProvider } from './contexts/DisplaySettingsContext';
import ManuscriptViewer from './pages/ManuscriptViewer';
import VerseId from './pages/verse/VerseId';
import NewDataEntry from './pages/NewDataEntry';
import SearchDatabase from './pages/SearchDatabase';
import ManualDifferentiation from './pages/ManualDifferentiation';
import Settings from './pages/Settings';
import PhylogeneticAnalysis from './pages/PhylogeneticAnalysis';
import Login from './pages/Login';
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