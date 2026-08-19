import React from 'react';
import { Link } from 'react-router-dom';
import { Brain, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-[#060911] text-slate-100 flex flex-col items-center justify-center p-4">
      <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 mb-4">
        <Brain className="w-12 h-12 text-cyan-400 animate-pulse" />
      </div>
      <h1 className="text-4xl font-extrabold text-white">404</h1>
      <p className="text-sm text-slate-400 mt-2">Clinical Module Not Found</p>
      <Link
        to="/"
        className="mt-6 px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs flex items-center space-x-2 transition hover:bg-cyan-400"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Multimodal Dashboard</span>
      </Link>
    </div>
  );
};

export default NotFound;
