import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Loader2, ShieldAlert } from 'lucide-react';

const LogoutModal = ({ isOpen, onClose, onConfirm, isLoggingOut }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={!isLoggingOut ? onClose : undefined}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        />

        {/* Modal Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.18 }}
          className="relative w-full max-w-sm bg-[#FFFFFF] dark:bg-[#1E293B] rounded-2xl border border-[#E2E8F0] dark:border-slate-800 shadow-2xl p-6 space-y-5 z-10 text-center"
        >
          {/* Icon Badge */}
          <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 flex items-center justify-center mx-auto text-red-600 dark:text-red-400">
            <LogOut className="w-6 h-6" />
          </div>

          {/* Texts */}
          <div className="space-y-1.5">
            <h3 className="text-base sm:text-lg font-bold text-[#0F172A] dark:text-[#F8FAFC]">
              Sign out of NeuroFusion?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Your current session will be ended.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoggingOut}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoggingOut}
              className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition flex items-center justify-center space-x-1.5 disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {isLoggingOut ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Signing out...</span>
                </>
              ) : (
                <span>Sign Out</span>
              )}
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default LogoutModal;
