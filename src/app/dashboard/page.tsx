'use client';

import React from 'react';
import { motion } from 'framer-motion';

export default function DashboardPage() {
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
                System Status: <span className="text-neon-teal animate-pulse">Operational</span> // Oracle Sync Enabled
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
                className="w-64 h-64 bg-neon-teal/20 blur-[100px] rounded-full"
              ></motion.div>
            </div>
            
            <div className="absolute bottom-12 left-12">
              <p className="text-gray-500 text-sm font-mono mb-2">/ TOTAL_EQUITY</p>
              <h2 className="text-6xl md:text-8xl font-bold tracking-tighter">$142,500.<span className="text-neon-teal/50">00</span></h2>
            </div>
          </div>

          {/* Data Grid: High Density Cockpit */}
          <div className="grid grid-cols-2 md:grid-cols-4 border-t border-white/10 divide-x divide-white/10">
             {[
               { label: 'YTD_GROWTH', value: '+24.5%', color: 'text-neon-teal' },
               { label: 'LIQUIDITY', value: '42.1K', color: 'text-white' },
               { label: 'RISK_INDEX', value: 'LOW', color: 'text-neon-gold' },
               { label: 'VA_ALPHA', value: '1.2X', color: 'text-white' }
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
                 <p className="text-[10px] font-mono text-neon-teal">MODEL_VERSION: v1.0.4-LINA</p>
                 <h3 className="text-3xl font-bold tracking-tighter">VA_ADVISOR</h3>
              </div>
           </div>

           <div className="space-y-4">
              <div className="p-6 glass-card border-l-4 border-neon-gold">
                 <p className="text-sm text-gray-400 mb-2 leading-relaxed italic">
                   "현재 지출 트렌드가 보수적입니다. 잔여 자산의 5%를 해외 소형 기술주에 재분배하는 것을 제안합니다. 시뮬레이션 결과 기대 수익률은 +12%입니다."
                 </p>
              </div>
              
              <div className="flex flex-col gap-2">
                 <button className="w-full h-16 bg-white text-black font-black text-xs tracking-widest uppercase hover:bg-neon-teal hover:scale-[1.02] transition-all">
                    EXECUTE_PLAN
                 </button>
                 <button className="w-full h-16 glass-card text-white font-black text-xs tracking-widest uppercase hover:bg-white/10 transition-all">
                    ANALYZE_REASON
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

      </div>
    </main>
  );
}
