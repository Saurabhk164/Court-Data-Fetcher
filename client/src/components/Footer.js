import React from 'react';
import { Scale, Github, ExternalLink } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white mt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-lg">
                <Scale className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-bold">Court Data Fetcher</h3>
            </div>
            <p className="text-gray-400 mb-4">
              A real-time web application for searching and fetching Indian court case information, 
              specifically designed for the Delhi High Court.
            </p>
            <div className="flex space-x-4">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors flex items-center"
              >
                <Github className="w-4 h-4 mr-1" />
                GitHub
              </a>
              <a
                href="https://delhihighcourt.nic.in"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors flex items-center"
              >
                <ExternalLink className="w-4 h-4 mr-1" />
                Delhi High Court
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <a href="/" className="text-gray-400 hover:text-white transition-colors">
                  Home
                </a>
              </li>
              <li>
                <a href="#about" className="text-gray-400 hover:text-white transition-colors">
                  About
                </a>
              </li>
              <li>
                <a href="#help" className="text-gray-400 hover:text-white transition-colors">
                  Help
                </a>
              </li>
              <li>
                <a href="#privacy" className="text-gray-400 hover:text-white transition-colors">
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider mb-4">Contact</h4>
            <ul className="space-y-2">
              <li className="text-gray-400">
                <span className="block">Email:</span>
                <a href="mailto:support@courtdatafetcher.com" className="hover:text-white transition-colors">
                  support@courtdatafetcher.com
                </a>
              </li>
              <li className="text-gray-400">
                <span className="block">Status:</span>
                <a href="/health" className="text-green-400 hover:text-green-300 transition-colors">
                  System Status
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2024 Court Data Fetcher. All rights reserved.
            </p>
            <p className="text-gray-400 text-sm mt-2 md:mt-0">
              Built with ❤️ for the legal community
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 