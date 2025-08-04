import React from 'react';
import { Scale, Search } from 'lucide-react';

const Header = () => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg">
              <Scale className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Court Data Fetcher</h1>
              <p className="text-sm text-gray-600">Delhi High Court Case Search</p>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center space-x-6">
            <a href="/" className="text-gray-600 hover:text-blue-600 transition-colors">
              Home
            </a>
            <a href="#about" className="text-gray-600 hover:text-blue-600 transition-colors">
              About
            </a>
            <a href="#help" className="text-gray-600 hover:text-blue-600 transition-colors">
              Help
            </a>
          </nav>

          <div className="flex items-center space-x-2">
            <Search className="w-5 h-5 text-gray-400" />
            <span className="text-sm text-gray-500">Real-time Case Search</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 