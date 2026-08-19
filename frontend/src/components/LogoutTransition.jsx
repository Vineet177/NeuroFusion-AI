import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Sparkles, Lock } from 'lucide-react';
import Brain3D from './Brain3D';

const LOGOUT_STEPS = [
  'Ending secure session...',
  'Session secured.',
  'Returning to NeuroFusion...',
  'NeuroFusion'
];

const LogoutTransition = ({ onComplete }) => {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    // Sequence: 0ms -> 450ms -> 950ms -> 1450ms -> 1850ms onComplete
    const t1 = setTimeout(() => setStepIndex(1), 450);
    const t2 = setTimeout(() => setStepIndex(2), 950);
    const t3 = setTimeout(() => setStepIndex(3), 1450);
    const t4 = setTimeout(() => {
      if (onComplete) onComplete();
    }, 1850);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-50 bg-[#0B1220] flex flex-col items-center justify-center p-6 text-white select-none overflow-hidden"
    >
      {/* Background Soft Glow Fading */}
      <motion.div 
        animate={{ opacity: [0.2, 0.05], scale: [1, 0.9] }}
        transition={{ duration: 1.8, ease: "easeOut" }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-3xl pointer-events-none" 
      />

      {/* Central 3D Brain with Deactivation Fade */}
      <div className="relative w-64 h-64 sm:w-80 sm:h-80 mb-6 flex items-center justify-center">
        <motion.div
          animate={{ 
            opacity: [1, 0.7, 0.3, 0],
            scale: [1, 0.98, 0.94, 0.9]
          }}
          transition={{ duration: 1.8, ease: "easeInOut" }}
          className="w-full h-full pointer-events-none"
        >
          <Brain3D className="w-full h-full" />
        </motion.div>
      </div>

      {/* Status Progress Container */}
      <div className="text-center space-y-3 max-w-md relative z-10">
        
        {/* Dynamic Badge */}
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-700 text-slate-300 text-xs font-mono font-bold tracking-wider shadow-md">
          <Lock className="w-3.5 h-3.5 text-blue-400" />
          <span>NEUROFUSION SECURE SIGN OUT</span>
        </div>

        {/* Dynamic Headline */}
        <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-white">
          WORKSPACE SHUTDOWN
        </h2>

        {/* Progressive Sequential Status Messages */}
        <div className="h-6 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={stepIndex}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="text-xs text-slate-400 font-mono"
            >
              {LOGOUT_STEPS[stepIndex]}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Deactivation Progress Bar */}
        <div className="w-44 mx-auto h-1 rounded-full bg-slate-800 overflow-hidden mt-4">
          <motion.div
            initial={{ width: '100%' }}
            animate={{ width: stepIndex === 0 ? '75%' : stepIndex === 1 ? '50%' : stepIndex === 2 ? '20%' : '0%' }}
            transition={{ duration: 0.45, ease: "easeInOut" }}
            className="h-full bg-blue-500"
          />
        </div>

      </div>

    </motion.div>
  );
};

export default LogoutTransition;
