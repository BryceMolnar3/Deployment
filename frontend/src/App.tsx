import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ManuscriptViewer from './pages/ManuscriptViewer.tsx';
import VerseId from './pages/verse/VerseId.tsx';

function App() {
  return (
    <Routes>
      <Route path="/manuscript-viewer/:id" element={<ManuscriptViewer />} />
      <Route path="/verse/:id" element={<VerseId />} />
    </Routes>
  );
}

export default App; 