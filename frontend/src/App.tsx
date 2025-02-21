import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ManuscriptViewer from './components/ManuscriptViewer.tsx';

function App() {
  return (
    <Routes>
      <Route path="/manuscript-viewer" element={<ManuscriptViewer />} />
    </Routes>
  );
}

export default App; 