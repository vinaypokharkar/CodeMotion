"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  ArrowUp, 
  Paperclip, 
  Globe, 
  Mic, 
  Plus,
  ChevronRight 
} from 'lucide-react';

export const Hero = () => {
  return (
    <section className="relative min-h-[90vh] flex flex-col items-center justify-center overflow-hidden pt-20">
      
      {/* --- Background Aurora Gradient (Lovable Style) --- */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
       
        
        {/* Secondary blue/cyan glow to mimic the spectrum in the image */}
       
      </div>

      <div className="relative z-10 w-full max-w-5xl px-4 sm:px-6 flex flex-col items-center text-center">
        
        {/* --- Pill Badge --- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <button className="group inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#424242] hover:bg-[#525252] border border-[#525252] transition-all">
            <span className="px-2 py-0.5 rounded bg-blue-500 text-white text-[10px] font-bold uppercase tracking-wider">
              New
            </span>
            <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
              Manim Engine 2.0 Live
            </span>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-white" />
          </button>
        </motion.div>

        {/* --- Main Title --- */}
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-4"
        >
          Build something <span className="text-[#CA3E47]">Mathematical</span>
        </motion.h1>

        {/* --- Subtitle --- */}
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-xl text-gray-400 mb-12 max-w-2xl"
        >
          Create educational videos and data visualizations by chatting with AI.
        </motion.p>

        {/* --- The "Lovable" Input Box --- */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="w-full max-w-3xl"
        >
          <div className="relative group bg-[#1e1e1e] rounded-2xl border border-[#525252] shadow-2xl shadow-black/50 transition-all focus-within:border-[#CA3E47]/50 focus-within:ring-1 focus-within:ring-[#CA3E47]/50">
            
            {/* Text Area */}
            <textarea 
              placeholder="Ask Animind to create a visualization of a binary search tree..."
              className="w-full h-20 bg-transparent text-lg text-white placeholder-gray-500 p-6 resize-none outline-none font-medium"
              spellCheck={false}
            />

            {/* Bottom Toolbar */}
            <div className="flex items-center justify-between px-4 pb-4">
              
              {/* Left Actions */}
              <div className="flex items-center gap-2">
                {/* Plus Button */}
                <button className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-[#313131] transition-colors border border-transparent hover:border-[#525252]">
                  <Plus className="w-5 h-5" />
                </button>
                
                {/* Attach Button */}
                <button className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium text-gray-400 hover:text-white hover:bg-[#313131] transition-colors border border-transparent hover:border-[#525252]">
                  <Paperclip className="w-4 h-4" />
                  <span>Attach</span>
                </button>

                {/* Theme/Globe Button */}
                <button className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium text-gray-400 hover:text-white hover:bg-[#313131] transition-colors border border-transparent hover:border-[#525252]">
                  <Globe className="w-4 h-4" />
                  <span>Manim CE</span>
                </button>
              </div>

              {/* Right Actions */}
              <div className="flex items-center gap-3">
                <button className="p-2 text-gray-400 hover:text-white transition-colors">
                  <Mic className="w-5 h-5" />
                </button>
                
                {/* Submit Button */}
                <button className="p-2 rounded-full bg-[#414141] text-gray-400 hover:bg-[#CA3E47] hover:text-white transition-all duration-300">
                  <ArrowUp className="w-5 h-5" />
                </button>
              </div>

            </div>
          </div>

          {/* Suggested Prompts (Optional, below input) */}
          <div className="mt-6 flex flex-wrap justify-center gap-3 text-sm text-gray-500">
            <span className="opacity-50">Try asking:</span>
            <button className="hover:text-[#CA3E47] transition-colors">"Rotating 3D Cube"</button>
            <span className="opacity-30">•</span>
            <button className="hover:text-[#CA3E47] transition-colors">"Fourier Series"</button>
            <span className="opacity-30">•</span>
            <button className="hover:text-[#CA3E47] transition-colors">"Sorting Algorithms"</button>
          </div>

        </motion.div>
      </div>
    </section>
  );
};