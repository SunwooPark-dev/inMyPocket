import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAssets } from '@/hooks/use-assets';
import { analyzePortfolio } from '@/lib/analysis';

export default function DashboardPage() {
  const { assets, loading } = useAssets();
  const [status, setStatus] = useState('Stable');
  const [auraColor, setAuraColor] = useState('bg-neon-teal');
  const [isAuditing, setIsAuditing] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);

  // Run Intelligence Engine
  const analysis = useMemo(() => {
    return analyzePortfolio(assets);
  }, [assets]);
  
  const balance = analysis.totalValue;

  useEffect(() => {
    if (!loading && assets.length > 0) {
      if (analysis.safetyScore < 60) {
        setStatus('Anomaly');
        setAuraColor('bg-neon-gold');
      } else {
        setStatus('Stable');
        setAuraColor('bg-neon-teal');
      }
    }
  }, [analysis, loading, assets]);

  const handleStartAudit = () => {
    setIsAuditing(true);
    setTimeout(() => {
      setIsAuditing(false);
      setShowOverlay(true);
    }, 1500); // Simulate cold calculation
  };

  // Removed random simulation for real data-driven updates
  return (
    <main className="min-h-[100dvh] bg-[#050505] text-white selection:bg-neon-teal selection:text-black">
      {/* Cockpit HUD Layout */}
      <div className="max-w-[1600px] mx-auto p-6 md:p-12 lg:flex gap-12">
        
        {/* Left: Financial Oracle (60%) */}
        <section className="flex-1 space-y-12">
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: "spring", stiffness: 100 }}
            >
              <h1 className="text-6xl md:text-8xl font-bold tracking-tighter leading-none mb-4">
                IN<span className="text-neon-teal">MY</span>POCKET
              </h1>
              <p className="text-gray-500 font-medium tracking-widest uppercase text-sm">
                System Status: <span className={`${status === 'Alert' ? 'text-neon-gold' : 'text-neon-teal'} animate-pulse`}>{status}</span> // Oracle Sync Enabled
              </p>
            </motion.div>
            
            <div className="flex gap-4">
              <div className="h-12 w-32 glass-card flex items-center justify-center text-xs font-bold tracking-tighter hover:neon-border transition-all cursor-pointer">
                HISTORY_LOG
              </div>
              <div className="h-12 w-12 glass-card flex items-center justify-center rounded-full hover:bg-white hover:text-black transition-all cursor-pointer">
                ?
              </div>
            </div>
          </header>

          {/* Main Visual: Wealth Aura */}
          <div className="relative aspect-[21/9] w-full glass-card overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-neon-teal/5 to-transparent"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              {/* Pulsing Aura */}
              <motion.div 
                animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className={`w-64 h-64 ${auraColor} blur-[100px] rounded-full`}
              ></motion.div>
            </div>
            
            <div className="absolute inset-x-0 bottom-12 left-12">
              <p className="text-gray-500 text-sm font-mono mb-2">/ TOTAL_EQUITY</p>
              <motion.h2 
                key={balance}
                initial={{ opacity: 0.8 }}
                animate={{ opacity: 1 }}
                className="text-6xl md:text-8xl font-bold tracking-tighter"
              >
                ${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </motion.h2>
            </div>

            {/* Allocation Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-2 flex">
              {analysis.allocations.map((alloc, i) => (
                <div 
                  key={alloc.ticker} 
                  className={`h-full opacity-80 hover:opacity-100 transition-opacity cursor-pointer`}
                  style={{ 
                    width: `${alloc.weight * 100}%`,
                    backgroundColor: i === 0 ? 'var(--neon-teal)' : i === 1 ? 'var(--foreground)' : 'var(--glass-border)'
                  }}
                  title={`${alloc.ticker}: ${(alloc.weight * 100).toFixed(1)}%`}
                />
              ))}
            </div>
          </div>

          {/* Data Grid: High Density Cockpit */}
          <div className="grid grid-cols-2 md:grid-cols-4 border-t border-white/10 divide-x divide-white/10">
             {[
               { label: 'HHI_INDEX', value: analysis.hhiIndex.toFixed(3), color: analysis.hhiIndex > 0.25 ? 'text-neon-gold' : 'text-neon-teal' },
               { label: 'SAFETY_SCORE', value: `${analysis.safetyScore}/100`, color: 'text-white' },
               { label: 'DOMINANT_ASSET', value: analysis.dominantAsset, color: 'text-neon-gold' },
               { label: 'TOTAL_ASSETS', value: assets.length, color: 'text-white' }
             ].map((stat, i) => (
                <div key={i} className="p-8 space-y-2 hover:bg-white/5 transition-colors cursor-crosshair">
                   <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">{stat.label}</p>
                   <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                </div>
             ))}
          </div>
        </section>

        {/* Right: VA Advisor Sidebar (40%) */}
        <aside className="w-full lg:w-[400px] mt-12 lg:mt-0 space-y-8">
           <div className="glass-card p-1 border-neon-teal/50 neon-border aspect-square relative overflow-hidden group">
              <div className="absolute inset-0 bg-neutral-900 group-hover:scale-105 transition-transform duration-700"></div>
              {/* VA Avatar Placeholder with Motion */}
              <motion.div 
                animate={{ opacity: [0.8, 1, 0.8] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-neon-teal/20 to-transparent"
              ></motion.div>
              <div className="absolute inset-0 flex flex-col justify-end p-8 gap-1">
                 <p className="text-[10px] font-mono text-neon-teal">UNIT_TYPE: ANALYTICAL_INSPECTOR</p>
                 <h3 className="text-3xl font-bold tracking-tighter">VA_COLD_UNIT</h3>
              </div>
           </div>

           <div className="space-y-4">
              <div className={`p-6 glass-card border-l-4 ${status === 'Anomaly' ? 'border-neon-gold' : 'border-neon-teal'}`}>
                 <p className="text-sm text-gray-400 mb-2 leading-relaxed font-mono">
                   [{isAuditing ? 'CALCULATING...' : status}] {loading ? "데이터 로딩 중..." : analysis.recommendation}
                 </p>
              </div>
              
              <div className="flex flex-col gap-2">
                 <button 
                   onClick={handleStartAudit}
                   disabled={isAuditing}
                   className="w-full h-16 bg-white text-black font-black text-xs tracking-widest uppercase hover:bg-neon-teal hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-wait"
                 >
                    {isAuditing ? 'EXECUTING_AUDIT...' : 'START_AUDIT'}
                 </button>
                 <button className="w-full h-16 glass-card text-white font-black text-xs tracking-widest uppercase hover:bg-white/10 transition-all">
                    DATA_SOURCE
                 </button>
              </div>
           </div>

           {/* Live Feed */}
           <div className="p-6 border-t border-white/10 space-y-4">
              <p className="text-[10px] font-bold tracking-widest text-gray-500 italic">LIVE_SYNAPSE_FEED</p>
              <div className="space-y-3 font-mono text-[10px]">
                 <div className="flex justify-between text-neon-teal"><span>- TICKER_SYNC</span><span>DONE</span></div>
                 <div className="flex justify-between text-gray-600"><span>- MOOD_ANALYSIS</span><span>STABLE</span></div>
                 <div className="flex justify-between text-gray-600"><span>- PORTFOLIO_LOCK</span><span>YES</span></div>
              </div>
           </div>
        </aside>

        {/* Intelligence Overlay */}
        <AnimatePresence>
          {showOverlay && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6"
            >
              <div className="max-w-2xl w-full glass-card p-12 border-neon-teal/50 neon-border relative">
                <button onClick={() => setShowOverlay(false)} className="absolute top-6 right-6 text-2xl hover:text-neon-teal">&times;</button>
                <h3 className="text-4xl font-bold tracking-tighter mb-2">VA_AUDIT_REPORT</h3>
                <p className="text-neon-teal font-mono text-xs tracking-widest mb-8">SYSTEM TIME: {new Date().toISOString()}</p>

                <div className="space-y-6 font-mono text-sm">
                   <div className="flex justify-between border-b border-white/10 pb-4">
                     <span className="text-gray-500">CONCENTRATION RISK (HHI)</span>
                     <span className={analysis.hhiIndex > 0.25 ? 'text-neon-gold' : 'text-neutral-100'}>{analysis.hhiIndex.toFixed(4)}</span>
                   </div>
                   <div className="flex justify-between border-b border-white/10 pb-4">
                     <span className="text-gray-500">SAFETY SCORE</span>
                     <span>{analysis.safetyScore} / 100</span>
                   </div>
                   <div className="pt-4">
                     <span className="block text-gray-500 mb-4">RECOMMENDATION DIRECTIVE</span>
                     <p className="text-lg leading-relaxed">{analysis.recommendation}</p>
                   </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </main>
  );
}
