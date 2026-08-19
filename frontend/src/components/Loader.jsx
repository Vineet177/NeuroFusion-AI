import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Sparkles } from 'lucide-react';

const Loader = ({ message = 'Analyzing Multimodal AI Signals...' }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[350px] w-full py-12">
      <div className="relative flex items-center justify-center">
        {/* Outer glowing pulsing ring */}
        <motion.div
          className="absolute w-24 h-24 rounded-full border-2 border-cyan-500/30 border-t-cyan-400"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        />

        {/* Inner reverse rotating purple ring */}
        <motion.div
          className="absolute w-16 h-16 rounded-full border-2 border-purple-500/30 border-b-purple-400"
          animate={{ rotate: -360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        />

        {/* Brain Icon Pulse */}
        <motion.div
          animate={{ scale: [0.9, 1.15, 0.9], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          className="p-3 bg-gradient-to-tr from-cyan-950/80 to-purple-950/80 rounded-full border border-cyan-500/40 shadow-[0_0_25px_rgba(6,182,212,0.4)]"
        >
          <Brain className="w-8 h-8 text-cyan-300" />
        </motion.div>
      </div>

      <div className="mt-8 flex items-center space-x-2 text-slate-300 text-sm font-medium">
        <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
        <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-purple-400 bg-clip-text text-transparent">
          {message}
        </span>
      </div>
      <p className="text-xs text-slate-500 mt-1">NeuroFusion AI Core v3.4</p>
    </div>
  );
};

export default Loader;
