"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  ChevronDown, 
  ChevronRight, 
  Clock, 
  MoreHorizontal, 
  PlayCircle, 
  Copy 
} from 'lucide-react';

// --- Mock Data ---
const userProjects = [
  {
    id: 1,
    title: "Binary Search Tree Visualizer",
    edited: "Edited 2 hours ago",
    thumbnail: "from-indigo-900 to-purple-900" 
  }
];

const communityProjects = [
  { id: 1, title: "Fourier Series Explanation", author: "Grant S.", forks: 854, tag: "Math", thumbnail: "from-[#CA3E47]/20 to-black" },
  { id: 2, title: "Sorting Algorithms Race", author: "Dev Sarah", forks: 320, tag: "CS", thumbnail: "from-blue-900/40 to-black" },
  { id: 3, title: "Solar System Physics", author: "PhysicsLab", forks: 150, tag: "Physics", thumbnail: "from-orange-900/30 to-black" },
  { id: 4, title: "Neural Network Topologies", author: "AI Researcher", forks: 2042, tag: "AI", thumbnail: "from-emerald-900/30 to-black" }
];

const categories = ["Math", "Physics", "Computer Science", "Chemistry", "Biology", "Engineering"];

// --- Interface ---
interface ShowcaseProps {
  isLoggedIn?: boolean;
}

export const Showcase = ({ isLoggedIn = false }: ShowcaseProps) => {
  return (
    <section id="showcase" className="py-20 bg-transparent">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="bg-black/40 backdrop-blur-md rounded-3xl border border-[#525252] p-8 min-h-[600px] relative overflow-hidden">
          
          {/* ---------------- User Projects Section (Conditional) ---------------- */}
          {isLoggedIn && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-16"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Your Projects</h2>
                <button className="text-sm text-gray-400 hover:text-white flex items-center gap-1 transition-colors">
                  View all <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input 
                    type="text" 
                    placeholder="Search projects..." 
                    className="w-full bg-[#313131] border border-[#525252] text-white text-sm rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-[#CA3E47] transition-colors"
                  />
                </div>

                <div className="flex gap-3">
                  <button className="flex items-center gap-2 px-4 py-2.5 bg-[#313131] border border-[#525252] rounded-lg text-sm text-gray-300 hover:text-white hover:border-gray-500 transition-all">
                    <span>Last edited</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* User Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                <motion.div 
                  whileHover={{ y: -2 }}
                  className="aspect-video rounded-xl border border-dashed border-[#525252] bg-[#313131]/30 hover:bg-[#313131] hover:border-[#CA3E47] cursor-pointer flex flex-col items-center justify-center gap-3 transition-all group"
                >
                  <div className="w-10 h-10 rounded-full bg-[#CA3E47]/10 flex items-center justify-center group-hover:bg-[#CA3E47] transition-colors">
                    <span className="text-xl text-[#CA3E47] group-hover:text-white font-light">+</span>
                  </div>
                  <span className="text-sm font-medium text-gray-400 group-hover:text-white">New Project</span>
                </motion.div>

                {userProjects.map((project) => (
                  <motion.div key={project.id} whileHover={{ y: -2 }} className="group cursor-pointer">
                    <div className={`aspect-video rounded-xl bg-gradient-to-br ${project.thumbnail} border border-[#525252] relative overflow-hidden mb-3 group-hover:border-[#CA3E47]/50 transition-colors`}>
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
                      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1.5 bg-black/50 backdrop-blur-md rounded-md text-white hover:bg-[#CA3E47] transition-colors">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-white font-medium text-sm group-hover:text-[#CA3E47] transition-colors">{project.title}</h3>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>{project.edited}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ---------------- Community Section (Always Visible) ---------------- */}
          <div className={isLoggedIn ? "pt-8 border-t border-[#525252]" : ""}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">From the Community</h2>
              <button className="text-sm text-gray-400 hover:text-white flex items-center gap-1 transition-colors">
                View all <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Filter Chips */}
            <div className="flex items-center gap-3 overflow-x-auto pb-6 scrollbar-hide">
              <button className="flex items-center gap-2 px-4 py-1.5 bg-[#313131] border border-[#525252] rounded-lg text-sm text-white hover:border-[#CA3E47] transition-all shrink-0">
                <span>Featured</span>
                <ChevronDown className="w-3 h-3" />
              </button>
              <div className="w-px h-6 bg-[#525252] mx-2 shrink-0" />
              <button className="px-4 py-1.5 bg-[#CA3E47] text-white text-sm rounded-full font-medium shadow-lg shadow-[#CA3E47]/20 shrink-0">
                Discover
              </button>
              {categories.map((cat) => (
                <button key={cat} className="px-4 py-1.5 bg-[#313131] hover:bg-[#414141] text-gray-300 hover:text-white text-sm rounded-full border border-transparent hover:border-[#525252] transition-all shrink-0">
                  {cat}
                </button>
              ))}
            </div>

            {/* Community Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {communityProjects.map((project) => (
                <motion.div key={project.id} whileHover={{ y: -4 }} className="group bg-[#313131] border border-[#525252] rounded-xl overflow-hidden hover:border-[#CA3E47]/30 transition-all">
                  <div className={`h-40 bg-gradient-to-br ${project.thumbnail} relative`}>
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 backdrop-blur-[2px]">
                      <button className="bg-white text-black px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 transform scale-95 group-hover:scale-100 transition-transform">
                        <PlayCircle className="w-3 h-3" /> Preview
                      </button>
                    </div>
                    <div className="absolute bottom-3 left-3">
                       <span className="px-2 py-1 bg-black/60 backdrop-blur-md border border-white/10 rounded text-[10px] text-white font-medium uppercase tracking-wider">
                         {project.tag}
                       </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-white font-bold text-lg leading-tight mb-1">{project.title}</h3>
                    <p className="text-gray-500 text-xs mb-4">An interactive visualization.</p>
                    <div className="flex items-center justify-between pt-4 border-t border-[#525252]">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-gray-700 to-gray-600 border border-gray-500" />
                        <span className="text-xs text-gray-300 font-medium">{project.author}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Copy className="w-3 h-3" />
                        <span>{project.forks} Remixes</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#CA3E47]/5 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none" />
        </div>
      </div>
    </section>
  );
};