import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CaseSearch from './components/CaseSearch';
import Header from './components/Header';
import Footer from './components/Footer';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<CaseSearch />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App; 