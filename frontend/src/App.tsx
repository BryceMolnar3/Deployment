import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ManuscriptViewer from './pages/ManuscriptViewer.tsx';
import VerseId from './pages/verse/VerseId.tsx';
import NewDataEntry from './pages/NewDataEntry.tsx';
import SearchDatabase from './pages/SearchDatabase.tsx';
import ManualDifferentiation from './pages/ManualDifferentiation.tsx';

function App() {
  return (
    <Routes>
      {/* Redirect root path to search-database */}
      <Route path="/" element={<Navigate to="/search-database" replace />} />
      
      <Route path="/manuscript-viewer/:id" element={<ManuscriptViewer />} />
      <Route path="/verse/:id" element={<VerseId />} />
      <Route path="/new-data-entry" element={<NewDataEntry />} />
      <Route path="/search-database" element={<SearchDatabase />} />
      <Route path="/manual-differentiation" element={<ManualDifferentiation />} />
      
      {/* Catch all unknown routes and redirect to search-database */}
      <Route path="*" element={<Navigate to="/search-database" replace />} />
    </Routes>
  );
}

export default App; 