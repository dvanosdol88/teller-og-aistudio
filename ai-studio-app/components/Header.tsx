import React from 'react';

const Header: React.FC = () => {
    return (
        <header className="bg-white shadow-sm sticky top-0 z-40">
            <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
                <h1 className="text-xl font-bold text-slate-800">LLC Financial Dashboard</h1>
                <div className="hidden md:flex space-x-6 items-center">
                     <a href="#dashboard" className="text-slate-600 hover:text-slate-900">Dashboard</a>
                     <a href="#ai-insights" className="text-slate-600 hover:text-slate-900">✨ AI Insights</a>
                     <a href="#principles" className="text-slate-600 hover:text-slate-900">Principles</a>
                     <a href="https://drive.google.com/drive/folders/1DcRgHqcQ_9xvtsPAw-mXddEJswe6icxU?usp=sharing" target="_blank" rel="noopener noreferrer" className="bg-blue-50 text-blue-700 font-semibold py-2 px-4 rounded-lg hover:bg-blue-100 transition-colors">📁 Real Estate Drive</a>
                </div>
            </nav>
        </header>
    );
};

export default Header;