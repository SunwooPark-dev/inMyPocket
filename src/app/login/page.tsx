'use client';

import React from 'react';
import { motion } from 'framer-motion';

export default function LoginPage() {
  return (
    <main className="min-h-[100dvh] bg-[#050505] text-white flex items-center justify-center p-6">
      <div className="w-full max-w-[450px]">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-12 border-neon-teal/20"
        >
          <h1 className="text-5xl font-bold tracking-tighter mb-8 text-center">
            IN<span className="text-neon-teal">MY</span>POCKET
          </h1>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Digital_Identity</p>
              <input 
                type="email" 
                placeholder="EMAIL_ADDRESS"
                className="w-full bg-white/5 border border-white/10 h-14 px-4 font-mono text-xs focus:neon-border outline-none transition-all"
              />
            </div>
            
            <div className="space-y-2">
              <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Access_Cipher</p>
              <input 
                type="password" 
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 h-14 px-4 font-mono text-xs focus:neon-border outline-none transition-all"
              />
            </div>

            <button className="w-full h-16 bg-white text-black font-black text-xs tracking-widest uppercase hover:bg-neon-teal hover:scale-[1.02] transition-all">
               AUTHORIZE_ACCESS
            </button>

            <div className="flex justify-between items-center text-[10px] text-gray-500 font-mono">
               <span className="hover:text-neon-teal cursor-pointer">FORGOT_PASS?</span>
               <span className="hover:text-neon-teal cursor-pointer">CREATE_ACCOUNT</span>
            </div>
          </div>
        </motion.div>
        
        <p className="mt-8 text-center text-[9px] text-gray-600 font-mono uppercase tracking-[0.2em]">
          Secured by Supabase Identity // Encrypted Endpoint
        </p>
      </div>
    </main>
  );
}
