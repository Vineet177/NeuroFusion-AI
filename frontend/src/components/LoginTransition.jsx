import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Brain, Sparkles, Activity, Layers } from 'lucide-react';
import Brain3D from './Brain3D';

const ADMIN_STEPS = [
  'Authentication successful',
  'Loading administrative intelligence...',
  'Preparing doctor availability & clinical network...'
];

const DOCTOR_STEPS = [
  'Authentication successful',
  'Loading clinical workspace...',
  'Preparing patient records, MRI volumetrics & EEG insights...'
];

const LoginTransition = ({ userRole = 'Doctor', onComplete }) => {
  const isDoctor = userRole === 'Doctor';
  const steps = isDoctor ? DOCTOR_STEPS : ADMIN_STEPS;
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    // Step 1: 0ms -> Step 2: 700ms -> Step 3: 1400ms -> Finish: 2100ms
    const t1 = setTimeout(() => setStepIndex(1), 700);
    const t2 = setTimeout(() => setStepIndex(2), 1400);
    const t3 = setTimeout(() => {
      if (onComplete) onComplete();
    }, 2200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 bg-[#0B1220] flex flex-col items-center justify-center p-6 text-white select-none overflow-hidden"
    >
      
      {/* Background Neural Particles Ambient Light */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Central 3D Brain Core */}
      <div className="relative w-72 h-72 sm:w-88 sm:h-88 mb-6 flex items-center justify-center">
        <motion.div
          animate={{ scale: [0.95, 1.05, 0.98] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="w-full h-full"
        >
          <Brain3D className="w-full h-full" />
        </motion.div>
      </div>

      {/* Status Progress Container */}
      <div className="text-center space-y-3 max-w-md relative z-10">
        
        {/* Dynamic Badge */}
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-blue-950/80 border border-blue-500/40 text-blue-400 text-xs font-mono font-bold tracking-wider shadow-md">
          <Sparkles className="w-3.5 h-3.5 animate-spin" />
          <span>NEUROFUSION AI INITIALIZATION</span>
        </div>

        {/* Role Target Title */}
        <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
          {isDoctor ? 'DOCTOR CLINICAL DASHBOARD' : 'ADMINISTRATIVE INTELLIGENCE'}
        </h2>

        {/* Progressive Status Message */}
        <div className="h-6 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={stepIndex}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
              className="text-xs text-slate-400 font-mono"
            >
              {steps[stepIndex]}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Smooth Step Indicator Line */}
        <div className="w-48 mx-auto h-1 rounded-full bg-slate-800 overflow-hidden mt-4">
          <motion.div
            initial={{ width: '15%' }}
            animate={{ width: stepIndex === 0 ? '33%' : stepIndex === 1 ? '70%' : '100%' }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="h-full bg-gradient-to-r from-blue-500 to-cyan-400"
          />
        </div>

      </div>

    </motion.div>
  );
};

export default LoginTransition;
