import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import ProductAnalytics from './pages/ProductAnalytics';
import UserAnalytics from './pages/UserAnalytics';
import SalesAnalytics from './pages/SalesAnalytics';
import SearchAnalytics from './pages/SearchAnalytics';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import './App.css';

function App() {
  return (
    <Router>
      <div className="flex h-screen bg-gray-100">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/products" element={<ProductAnalytics />} />
              <Route path="/users" element={<UserAnalytics />} />
              <Route path="/sales" element={<SalesAnalytics />} />
              <Route path="/search" element={<SearchAnalytics />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;