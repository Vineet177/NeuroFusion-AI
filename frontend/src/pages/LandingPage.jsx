import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BrainCircuit, 
  Brain, 
  Activity, 
  Scan, 
  Layers, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles, 
  FileText, 
  Users, 
  Lock, 
  Database, 
  BarChart3, 
  Menu, 
  X,
  Stethoscope,
  TrendingUp,
  Cpu,
  Shield,
  ChevronDown
} from 'lucide-react';
import Brain3D from '../components/Brain3D';
import { useAuth } from '../hooks/useAuth';

const NAV_ITEMS = [
  { id: 'about', label: 'About' },
  { id: 'how-it-works', label: 'How It Works' },
  { id: 'technology', label: 'Technology' },
  { id: 'features', label: 'Features' },
  { id: 'security', label: 'Security' }
];

const LandingPage = () => {
  const { user, isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('about');
  const [activeTab, setActiveTab] = useState('mri');

  // Mouse position state for subtle liquid-glass navbar reflection
  const navRef = useRef(null);
  const [navMousePos, setNavMousePos] = useState({ x: 0, y: 0, opacity: 0 });

  const handleNavMouseMove = (e) => {
    if (!navRef.current) return;
    const rect = navRef.current.getBoundingClientRect();
    setNavMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      opacity: 1
    });
  };

  const handleNavMouseLeave = () => {
    setNavMousePos((prev) => ({ ...prev, opacity: 0 }));
  };

  const scrollToSection = (id) => {
    setActiveSection(id);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#F7F7F5] dark:bg-[#171321] text-[#171321] dark:text-[#F7F7F5] font-sans antialiased selection:bg-[#7C3AED] selection:text-white transition-colors relative overflow-hidden">
      
      {/* ------------------------------------------------------------- */}
      {/* AURORA LIGHTING MESH OVERLAY                                  */}
      {/* ------------------------------------------------------------- */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Soft Lavender Aurora */}
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-[#A78BFA]/15 dark:bg-[#7C3AED]/20 rounded-full blur-[140px]" />
        {/* Soft Rose Aurora */}
        <div className="absolute top-1/3 -right-40 w-[550px] h-[550px] bg-[#F0A7C0]/12 dark:bg-[#F0A7C0]/10 rounded-full blur-[150px]" />
        {/* Aurora Violet Ambient Glow */}
        <div className="absolute bottom-20 left-1/3 w-[500px] h-[500px] bg-[#7C3AED]/10 dark:bg-[#A78BFA]/10 rounded-full blur-[140px]" />
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 1. FLOATING LIQUID GLASS NAVIGATION BAR                       */}
      {/* ------------------------------------------------------------- */}
      <header className="fixed top-4 left-0 right-0 z-50 px-4 sm:px-8 max-w-6xl mx-auto">
        <nav
          ref={navRef}
          onMouseMove={handleNavMouseMove}
          onMouseLeave={handleNavMouseLeave}
          className="relative rounded-[22px] liquid-glass-nav px-5 py-3 shadow-lg shadow-purple-950/5 flex items-center justify-between transition-all"
        >
          {/* Subtle cursor glass refraction highlight */}
          <div
            className="pointer-events-none absolute -inset-px rounded-[22px] transition-opacity duration-300"
            style={{
              opacity: navMousePos.opacity,
              background: `radial-gradient(180px circle at ${navMousePos.x}px ${navMousePos.y}px, rgba(167, 139, 250, 0.15), transparent 70%)`
            }}
          />

          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2.5 group cursor-pointer relative z-10">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#A78BFA] flex items-center justify-center text-white shadow-md shadow-purple-500/25 group-hover:scale-105 transition-transform">
              <BrainCircuit className="w-5 h-5 text-white" />
            </div>
            <span className="font-extrabold text-base sm:text-lg tracking-tight text-[#171321] dark:text-[#F7F7F5]">
              NEURO<span className="text-[#7C3AED] dark:text-[#A78BFA]">FUSION</span>
            </span>
          </Link>

          {/* Desktop Navigation Links with Liquid Moving Glass Pill */}
          <div className="hidden md:flex items-center space-x-1 p-1 rounded-full bg-slate-900/5 dark:bg-white/5 border border-slate-900/5 dark:border-white/10 text-xs font-semibold relative z-10">
            {NAV_ITEMS.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`relative px-3.5 py-1.5 rounded-full transition-colors cursor-pointer ${
                    isActive
                      ? 'text-[#7C3AED] dark:text-white font-bold'
                      : 'text-slate-600 dark:text-slate-300 hover:text-[#171321] dark:hover:text-white'
                  }`}
                >
                  {/* Morphing Liquid Glass Pill */}
                  {isActive && (
                    <motion.div
                      layoutId="activeNavPill"
                      className="absolute inset-0 rounded-full bg-white dark:bg-purple-900/60 shadow-sm border border-purple-200/60 dark:border-purple-500/30"
                      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    />
                  )}
                  <span className="relative z-10">{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="hidden sm:flex items-center space-x-2.5 text-xs font-semibold relative z-10">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="px-4 py-2 rounded-xl glass-btn-primary flex items-center space-x-1.5 font-bold"
              >
                <span>Dashboard ({user?.role || 'Doctor'})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-xl glass-btn-secondary font-bold"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-xl glass-btn-primary flex items-center space-x-1 font-bold"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-700 dark:text-slate-300 hover:text-slate-900 cursor-pointer relative z-10"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </nav>

        {/* Mobile Dropdown Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              className="md:hidden mt-2 p-5 rounded-2xl liquid-glass-card shadow-2xl space-y-4 text-xs font-semibold"
            >
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className="block w-full text-left py-1 text-slate-700 dark:text-slate-200"
                >
                  {item.label}
                </button>
              ))}
              <div className="pt-3 border-t border-purple-200/40 dark:border-purple-900/40 flex flex-col gap-2">
                <Link to="/login" className="py-2 text-center text-slate-800 dark:text-slate-200 font-bold">
                  Login
                </Link>
                <Link to="/register" className="py-2.5 rounded-xl glass-btn-primary text-center font-bold">
                  Get Started
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* 2. HERO SECTION                                               */}
      {/* ------------------------------------------------------------- */}
      <section className="relative pt-32 pb-20 md:pt-44 md:pb-32 px-4 sm:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          
          {/* Left Column: Hero Copy */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-6 space-y-6 text-center lg:text-left"
          >
            
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full liquid-glass-pill text-[11px] font-bold shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-[#7C3AED]" />
              <span>✦ MULTIMODAL NEUROLOGICAL AI</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#171321] dark:text-[#F7F7F5] leading-[1.08]">
              AI-Powered <br />
              <span className="bg-gradient-to-r from-[#7C3AED] via-[#A78BFA] to-[#F0A7C0] bg-clip-text text-transparent">
                Neurological Intelligence.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-[#6B6875] dark:text-slate-300 max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
              Connecting MRI, EEG and cognitive assessment through multimodal artificial intelligence.
            </p>

            {/* Hero CTAs */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Link
                to="/register"
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl glass-btn-primary font-bold text-sm flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <button
                onClick={() => scrollToSection('technology')}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl glass-btn-secondary font-bold text-sm flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>Explore Technology</span>
                <ChevronDown className="w-4 h-4 text-purple-400" />
              </button>
            </div>

            {/* Quick Metrics Strip */}
            <div className="pt-6 grid grid-cols-3 gap-4 border-t border-purple-200/40 dark:border-purple-900/40 text-left">
              <div>
                <span className="text-xl sm:text-2xl font-extrabold text-[#171321] dark:text-[#F7F7F5]">3-in-1</span>
                <p className="text-[11px] text-[#6B6875] font-medium">Multimodal Signals</p>
              </div>
              <div>
                <span className="text-xl sm:text-2xl font-extrabold text-[#7C3AED] dark:text-[#A78BFA]">0.08s</span>
                <p className="text-[11px] text-[#6B6875] font-medium">Inference Latency</p>
              </div>
              <div>
                <span className="text-xl sm:text-2xl font-extrabold text-[#22C55E]">100%</span>
                <p className="text-[11px] text-[#6B6875] font-medium">Clinical Role Isolation</p>
              </div>
            </div>

          </motion.div>

          {/* Right Column: 3D Anatomical Brain */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-6 relative w-full h-[420px] sm:h-[520px] rounded-3xl liquid-glass-card p-4 overflow-hidden shadow-2xl"
          >
            <Brain3D />
          </motion.div>

        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 3. ABOUT SECTION                                              */}
      {/* ------------------------------------------------------------- */}
      <section id="about" className="py-20 px-4 sm:px-8 max-w-7xl mx-auto border-t border-purple-200/30 dark:border-purple-900/30">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="text-xs font-extrabold uppercase tracking-widest text-[#7C3AED] dark:text-[#A78BFA]">
            Unified Diagnostics
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#171321] dark:text-[#F7F7F5]">
            One Brain. Multiple Signals. One Intelligence.
          </h2>
          <p className="text-sm sm:text-base text-[#6B6875] dark:text-slate-300 leading-relaxed font-medium">
            NeuroFusion brings together multiple neurological data sources into a unified AI-powered clinical intelligence platform.
            MRI imaging. EEG signals. Cognitive assessments. One connected view of neurological health.
          </p>
        </div>

        {/* 3 Pillars Liquid Glass Cards */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="p-7 rounded-2xl liquid-glass-card hover:border-[#7C3AED] transition-all duration-300 hover:shadow-xl space-y-4 group">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 dark:bg-purple-500/20 text-[#7C3AED] dark:text-[#A78BFA] flex items-center justify-center">
              <Brain className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[#171321] dark:text-[#F7F7F5]">
              MRI Intelligence
            </h3>
            <p className="text-xs text-[#6B6875] dark:text-slate-400 leading-relaxed font-medium">
              AI-assisted structural analysis and T1 hippocampal volumetric quantification for brain tissue atrophy detection.
            </p>
          </div>

          <div className="p-7 rounded-2xl liquid-glass-card hover:border-[#A78BFA] transition-all duration-300 hover:shadow-xl space-y-4 group">
            <div className="w-12 h-12 rounded-xl bg-violet-500/10 dark:bg-violet-500/20 text-[#A78BFA] flex items-center justify-center">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[#171321] dark:text-[#F7F7F5]">
              EEG Intelligence
            </h3>
            <p className="text-xs text-[#6B6875] dark:text-slate-400 leading-relaxed font-medium">
              Neural signal and power spectral density analysis across 19-channel scalp montages for slowing & microstate detection.
            </p>
          </div>

          <div className="p-7 rounded-2xl liquid-glass-card hover:border-[#F0A7C0] transition-all duration-300 hover:shadow-xl space-y-4 group">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 dark:bg-rose-500/20 text-[#F0A7C0] flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[#171321] dark:text-[#F7F7F5]">
              Cognitive Insights
            </h3>
            <p className="text-xs text-[#6B6875] dark:text-slate-400 leading-relaxed font-medium">
              MMSE, MoCA, and clinical progression scoring fused as patient-specific Bayesian priors for unified risk stratification.
            </p>
          </div>

        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 4. HOW NEUROFUSION WORKS                                      */}
      {/* ------------------------------------------------------------- */}
      <section id="how-it-works" className="py-20 px-4 sm:px-8 max-w-7xl mx-auto border-t border-purple-200/30 dark:border-purple-900/30">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-14">
          <span className="text-xs font-extrabold uppercase tracking-widest text-[#7C3AED] dark:text-[#A78BFA]">
            Clinical Workflow
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#171321] dark:text-[#F7F7F5]">
            How NeuroFusion Works
          </h2>
          <p className="text-xs sm:text-sm text-[#6B6875] font-medium">
            From raw biomedical intake to precision multimodal clinical intelligence
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
          
          {[
            {
              step: '01',
              title: 'COLLECT',
              desc: 'MRI Scan payload, EEG 19-channel signals, and MMSE/MoCA scores.',
              tag: 'Multimodal Intake'
            },
            {
              step: '02',
              title: 'ANALYZE',
              desc: 'ResNet convolutional feature extraction and LSTM spectral processing.',
              tag: 'Deep Neural Processing'
            },
            {
              step: '03',
              title: 'FUSE',
              desc: 'Multimodal decision matrix rebalancing with active confidence weighting.',
              tag: 'AI Decision Fusion'
            },
            {
              step: '04',
              title: 'INSIGHT',
              desc: 'Stratified risk assessment, longitudinal progression & automated reporting.',
              tag: 'Clinical Action'
            }
          ].map((item, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl liquid-glass-card relative space-y-3 hover:border-[#7C3AED] transition-colors"
            >
              <span className="text-3xl font-extrabold text-purple-300/80 dark:text-purple-900/80 font-mono">
                {item.step}
              </span>
              <h3 className="text-base font-extrabold text-[#171321] dark:text-[#F7F7F5] tracking-wide">
                {item.title}
              </h3>
              <p className="text-xs text-[#6B6875] dark:text-slate-400 leading-relaxed font-medium">
                {item.desc}
              </p>
              <div className="pt-2">
                <span className="text-[10px] font-bold font-mono px-2.5 py-1 rounded-full bg-purple-500/10 text-[#7C3AED] dark:text-[#C4B5FD]">
                  {item.tag}
                </span>
              </div>
            </div>
          ))}

        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 5. TECHNOLOGY SECTION (Deep Plum Theme #171321)               */}
      {/* ------------------------------------------------------------- */}
      <section id="technology" className="py-24 px-4 sm:px-8 bg-[#171321] text-white border-y border-purple-900/40 relative overflow-hidden">
        
        {/* Soft Aurora in dark section */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[#7C3AED]/12 rounded-full blur-[160px] pointer-events-none" />

        <div className="max-w-7xl mx-auto space-y-14 relative z-10">
          
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-mono font-bold tracking-widest text-[#A78BFA] uppercase">
              THE TECHNOLOGY
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Built for multimodal neurological intelligence.
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 font-medium">
              Hardware-accelerated neural networks specifically calibrated for neurological diagnostic markers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-5">
            
            <div className="p-5 rounded-2xl liquid-glass-card-dark space-y-3">
              <Cpu className="w-6 h-6 text-[#A78BFA]" />
              <h3 className="font-bold text-sm text-white">CNN</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                Medical Image Analysis & T1 Structural Atrophy Quantification
              </p>
            </div>

            <div className="p-5 rounded-2xl liquid-glass-card-dark space-y-3">
              <Activity className="w-6 h-6 text-[#F0A7C0]" />
              <h3 className="font-bold text-sm text-white">LSTM</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                Temporal EEG 19-Channel Spectral Decomposition & Oscillatory Tracking
              </p>
            </div>

            <div className="p-5 rounded-2xl liquid-glass-card-dark space-y-3">
              <Layers className="w-6 h-6 text-[#7C3AED]" />
              <h3 className="font-bold text-sm text-white">Multimodal Fusion</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                Unified MRI + EEG + Cognitive Score Confidence Fusion
              </p>
            </div>

            <div className="p-5 rounded-2xl liquid-glass-card-dark space-y-3">
              <BarChart3 className="w-6 h-6 text-[#22C55E]" />
              <h3 className="font-bold text-sm text-white">Adaptive Risk Scoring</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                Patient-Specific Biomarker Rebalancing & Prior Weighting
              </p>
            </div>

            <div className="p-5 rounded-2xl liquid-glass-card-dark space-y-3">
              <TrendingUp className="w-6 h-6 text-[#F59E0B]" />
              <h3 className="font-bold text-sm text-white">AI Monitoring</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                Longitudinal Progression & Clinical Cohort Tracking
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 6. INTERACTIVE BRAIN EXPLORATION SECTION                      */}
      {/* ------------------------------------------------------------- */}
      <section id="features" className="py-20 px-4 sm:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-10">
          <span className="text-xs font-extrabold uppercase tracking-widest text-[#7C3AED] dark:text-[#A78BFA]">
            Interactive Anatomy
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#171321] dark:text-[#F7F7F5]">
            Explore the NeuroFusion Brain
          </h2>
          <p className="text-xs sm:text-sm text-[#6B6875]">
            A connected view of neurological data across all clinical modalities.
          </p>
        </div>

        {/* Liquid Glass Modality Tabs */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[
            { id: 'mri', label: 'MRI Structural', icon: Scan },
            { id: 'eeg', label: 'EEG Spectral', icon: Activity },
            { id: 'cog', label: 'Cognitive Prior', icon: FileText }
          ].map((tab) => {
            const Icon = tab.icon;
            const isSel = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
                  isSel
                    ? 'glass-btn-primary'
                    : 'glass-btn-secondary'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Visualizer Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          <div className="lg:col-span-7 h-[400px] sm:h-[460px] rounded-3xl liquid-glass-card p-4 shadow-xl relative">
            <Brain3D activeModality={activeTab} />
          </div>

          <div className="lg:col-span-5 space-y-4">
            {activeTab === 'mri' && (
              <div className="p-6 rounded-2xl liquid-glass-card border-purple-300/50 dark:border-purple-800/50 space-y-3">
                <div className="flex items-center space-x-2 text-[#7C3AED]">
                  <Scan className="w-5 h-5" />
                  <h3 className="font-extrabold text-sm text-[#171321] dark:text-white">Structural MRI Intelligence</h3>
                </div>
                <p className="text-xs text-[#6B6875] dark:text-slate-300 leading-relaxed font-medium">
                  Analyzes T1-weighted axial volumetric brain scans for medial temporal lobe atrophy, ventricular enlargement, and cortical thinning.
                </p>
                <div className="pt-2 text-[11px] font-mono text-[#6B6875] dark:text-slate-400 space-y-1 border-t border-purple-100 dark:border-purple-900/40">
                  <p>• Model: ResNet Convolutional Neural Classifier</p>
                  <p>• Regions: Hippocampus, Entorhinal Cortex, Ventricles</p>
                  <p>• Feature: Dynamic Grad-CAM Saliency Maps</p>
                </div>
              </div>
            )}

            {activeTab === 'eeg' && (
              <div className="p-6 rounded-2xl liquid-glass-card border-purple-300/50 dark:border-purple-800/50 space-y-3">
                <div className="flex items-center space-x-2 text-[#A78BFA]">
                  <Activity className="w-5 h-5" />
                  <h3 className="font-extrabold text-sm text-[#171321] dark:text-white">Neural EEG Signal Intelligence</h3>
                </div>
                <p className="text-xs text-[#6B6875] dark:text-slate-300 leading-relaxed font-medium">
                  Extracts 19-channel oscillatory power spectral densities (PSD) and evaluates theta/alpha wave ratio slowing markers.
                </p>
                <div className="pt-2 text-[11px] font-mono text-[#6B6875] dark:text-slate-400 space-y-1 border-t border-purple-100 dark:border-purple-900/40">
                  <p>• Model: 2-Layer Recurrent LSTM Network</p>
                  <p>• Montage: International 10-20 Standard</p>
                  <p>• Feature: Aperiodic Power Fit & Signal Synchrony</p>
                </div>
              </div>
            )}

            {activeTab === 'cog' && (
              <div className="p-6 rounded-2xl liquid-glass-card border-purple-300/50 dark:border-purple-800/50 space-y-3">
                <div className="flex items-center space-x-2 text-[#F0A7C0]">
                  <FileText className="w-5 h-5" />
                  <h3 className="font-extrabold text-sm text-[#171321] dark:text-white">Cognitive Assessment Prior</h3>
                </div>
                <p className="text-xs text-[#6B6875] dark:text-slate-300 leading-relaxed font-medium">
                  Integrates Mini-Mental State Examination (MMSE) and Montreal Cognitive Assessment (MoCA) as clinical diagnostic priors.
                </p>
                <div className="pt-2 text-[11px] font-mono text-[#6B6875] dark:text-slate-400 space-y-1 border-t border-purple-100 dark:border-purple-900/40">
                  <p>• Clinical Prior: MMSE (/30) & MoCA (/30)</p>
                  <p>• Thresholds: Normal (27-30), MCI (21-26), Dementia (≤20)</p>
                  <p>• Fusion: Bayesian Multimodal Rebalancing</p>
                </div>
              </div>
            )}
          </div>

        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 7. PATIENT MONITORING PREVIEW SECTION                          */}
      {/* ------------------------------------------------------------- */}
      <section className="py-20 px-4 sm:px-8 max-w-7xl mx-auto border-t border-purple-200/30 dark:border-purple-900/30">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
          <span className="text-[10px] font-mono font-bold tracking-widest px-3 py-1 rounded-full bg-purple-500/10 text-[#7C3AED] dark:text-[#A78BFA] border border-purple-300/40 uppercase">
            ILLUSTRATIVE DEMO
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#171321] dark:text-[#F7F7F5]">
            Patient Progression & Risk Tracking
          </h2>
          <p className="text-xs sm:text-sm text-[#6B6875]">
            Unified longitudinal clinical monitoring dashboard preview
          </p>
        </div>

        {/* Demo Dashboard Liquid Glass Frame */}
        <div className="max-w-4xl mx-auto p-6 sm:p-8 rounded-3xl liquid-glass-card shadow-2xl space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-100 dark:border-purple-900/40 pb-4">
            <div>
              <span className="text-[10px] font-bold text-[#6B6875] uppercase font-mono">Sample Cohort Subject</span>
              <h3 className="text-base font-bold text-[#171321] dark:text-[#F7F7F5]">
                Subject Demo-7721 • 72 Yrs • Female
              </h3>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                MRI: ✓ Processed
              </span>
              <span className="px-3 py-1 rounded-lg bg-purple-50 text-[#7C3AED] font-bold border border-purple-200">
                EEG: ✓ Analyzed
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-medium">
            <div className="p-4 rounded-xl liquid-glass-card space-y-1">
              <span className="text-[#6B6875]">Multimodal Risk Indicator</span>
              <p className="text-lg font-extrabold text-amber-600">Moderate Cognitive Decline</p>
            </div>
            <div className="p-4 rounded-xl liquid-glass-card space-y-1">
              <span className="text-[#6B6875]">Cognitive Score Status</span>
              <p className="text-lg font-extrabold text-[#7C3AED]">21 / 30 MMSE</p>
            </div>
            <div className="p-4 rounded-xl liquid-glass-card space-y-1">
              <span className="text-[#6B6875]">AI Recommendation</span>
              <p className="text-lg font-extrabold text-emerald-600">Schedule Neurologist Review</p>
            </div>
          </div>

        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 8. WHO USES NEUROFUSION                                       */}
      {/* ------------------------------------------------------------- */}
      <section className="py-20 px-4 sm:px-8 max-w-7xl mx-auto border-t border-purple-200/30 dark:border-purple-900/30">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
          <span className="text-xs font-extrabold uppercase tracking-widest text-[#7C3AED] dark:text-[#A78BFA]">
            Clinical Ecosystem
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#171321] dark:text-[#F7F7F5]">
            Who Uses NeuroFusion?
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="p-7 rounded-2xl liquid-glass-card space-y-3 hover:border-[#7C3AED] transition-colors">
            <Stethoscope className="w-8 h-8 text-[#7C3AED]" />
            <h3 className="text-base font-bold text-[#171321] dark:text-[#F7F7F5]">Neurologists</h3>
            <p className="text-xs text-[#6B6875] dark:text-slate-400 leading-relaxed font-medium">
              AI-assisted clinical insights, automated risk stratification, and longitudinal patient monitoring.
            </p>
          </div>

          <div className="p-7 rounded-2xl liquid-glass-card space-y-3 hover:border-[#A78BFA] transition-colors">
            <Users className="w-8 h-8 text-[#A78BFA]" />
            <h3 className="text-base font-bold text-[#171321] dark:text-[#F7F7F5]">Healthcare Teams</h3>
            <p className="text-xs text-[#6B6875] dark:text-slate-400 leading-relaxed font-medium">
              Unified neurological information, multi-doctor directory coordination, and structured triage workflows.
            </p>
          </div>

          <div className="p-7 rounded-2xl liquid-glass-card space-y-3 hover:border-[#F0A7C0] transition-colors">
            <BrainCircuit className="w-8 h-8 text-[#F0A7C0]" />
            <h3 className="text-base font-bold text-[#171321] dark:text-[#F7F7F5]">Researchers</h3>
            <p className="text-xs text-[#6B6875] dark:text-slate-400 leading-relaxed font-medium">
              Multimodal neurological data fusion, cohort-wide statistical distributions, and deep AI feature attributions.
            </p>
          </div>

        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 9. SECURITY & DATA PRIVACY SECTION                            */}
      {/* ------------------------------------------------------------- */}
      <section id="security" className="py-20 px-4 sm:px-8 max-w-7xl mx-auto border-t border-purple-200/30 dark:border-purple-900/30">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
          <span className="text-xs font-extrabold uppercase tracking-widest text-[#7C3AED] dark:text-[#A78BFA]">
            Security First
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#171321] dark:text-[#F7F7F5]">
            Built With Clinical Data Security in Mind
          </h2>
          <p className="text-xs sm:text-sm text-[#6B6875] font-medium">
            Engineered with strict role isolation and cryptographic credentials protection.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          
          <div className="p-4 rounded-xl liquid-glass-card text-center space-y-2">
            <Lock className="w-5 h-5 text-[#7C3AED] mx-auto" />
            <h4 className="text-xs font-bold">Secure Authentication</h4>
          </div>

          <div className="p-4 rounded-xl liquid-glass-card text-center space-y-2">
            <Shield className="w-5 h-5 text-[#A78BFA] mx-auto" />
            <h4 className="text-xs font-bold">Role-Based Access</h4>
          </div>

          <div className="p-4 rounded-xl liquid-glass-card text-center space-y-2">
            <Stethoscope className="w-5 h-5 text-[#F0A7C0] mx-auto" />
            <h4 className="text-xs font-bold">Controlled Clinical Access</h4>
          </div>

          <div className="p-4 rounded-xl liquid-glass-card text-center space-y-2">
            <Database className="w-5 h-5 text-[#22C55E] mx-auto" />
            <h4 className="text-xs font-bold">Protected Medical Data</h4>
          </div>

          <div className="p-4 rounded-xl liquid-glass-card text-center space-y-2 col-span-2 sm:col-span-1">
            <ShieldCheck className="w-5 h-5 text-amber-500 mx-auto" />
            <h4 className="text-xs font-bold">Secure Credentials</h4>
          </div>

        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 10. FINAL CALL TO ACTION (CTA)                                */}
      {/* ------------------------------------------------------------- */}
      <section className="py-24 px-4 sm:px-8 bg-[#171321] text-white relative overflow-hidden border-t border-purple-900/40 text-center">
        
        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#7C3AED]/15 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-3xl mx-auto space-y-6 relative z-10">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Turn neurological data <br />
            into connected intelligence.
          </h2>
          <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto font-medium">
            Explore NeuroFusion and empower your clinical team with multimodal MRI, EEG & cognitive decision support.
          </p>
          <div className="pt-4 flex items-center justify-center gap-4">
            <Link
              to="/register"
              className="px-8 py-3.5 rounded-xl glass-btn-primary font-bold text-sm flex items-center space-x-2 cursor-pointer shadow-xl shadow-purple-900/40"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 11. FOOTER                                                    */}
      {/* ------------------------------------------------------------- */}
      <footer className="py-12 px-4 sm:px-8 max-w-7xl mx-auto text-xs text-[#6B6875] border-t border-purple-200/30 dark:border-purple-900/30">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          
          <div className="space-y-3 col-span-2 md:col-span-1">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-lg bg-[#7C3AED] flex items-center justify-center text-white">
                <BrainCircuit className="w-3.5 h-3.5" />
              </div>
              <span className="font-extrabold text-sm text-[#171321] dark:text-[#F7F7F5]">NEUROFUSION</span>
            </div>
            <p className="text-[11px] text-[#6B6875]">
              AI-Powered Neurological Intelligence
            </p>
          </div>

          <div className="space-y-2">
            <h5 className="font-bold text-[#171321] dark:text-[#F7F7F5] text-xs">Product</h5>
            <ul className="space-y-1.5 text-[11px]">
              {NAV_ITEMS.map((item) => (
                <li key={item.id}>
                  <button onClick={() => scrollToSection(item.id)} className="hover:text-[#7C3AED]">
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-2">
            <h5 className="font-bold text-[#171321] dark:text-[#F7F7F5] text-xs">Resources</h5>
            <ul className="space-y-1.5 text-[11px]">
              <li><button onClick={() => scrollToSection('about')} className="hover:text-[#7C3AED]">Documentation</button></li>
              <li><button onClick={() => scrollToSection('security')} className="hover:text-[#7C3AED]">Contact</button></li>
            </ul>
          </div>

          <div className="space-y-2">
            <h5 className="font-bold text-[#171321] dark:text-[#F7F7F5] text-xs">Account</h5>
            <ul className="space-y-1.5 text-[11px]">
              <li><Link to="/login" className="hover:text-[#7C3AED]">Login</Link></li>
              <li><Link to="/register" className="hover:text-[#7C3AED]">Register</Link></li>
            </ul>
          </div>

        </div>

        <div className="pt-6 border-t border-purple-200/20 dark:border-purple-900/20 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px]">
          <p>© 2026 NeuroFusion. All rights reserved.</p>
          <p>Medical AI Decision Support Architecture</p>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
