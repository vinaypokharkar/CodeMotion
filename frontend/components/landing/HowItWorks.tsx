import React from 'react';
import { Code2, Zap, Play } from 'lucide-react';

export const HowItWorks = () => {
  const steps = [
    {
      title: "Prompt",
      desc: "Describe a mathematical concept or visual scene in plain English.",
      icon: <Code2 className="w-5 h-5" />
    },
    {
      title: "Generate",
      desc: "Our engine converts your prompt into Python code using the Manim library.",
      icon: <Zap className="w-5 h-5" />
    },
    {
      title: "Render",
      desc: "The code is compiled in the cloud and streams the video result back to you.",
      icon: <Play className="w-5 h-5" />
    }
  ];

  return (
    <section id="how-it-works" className="py-24 bg-transparent border-t border-[#525252]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-8">
              From idea to animation <br /> in three steps.
            </h2>
            <div className="space-y-12">
              {steps.map((step, i) => (
                <div key={i} className="flex gap-6 group">
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full bg-[#CA3E47] flex items-center justify-center text-white font-bold shadow-lg shadow-[#CA3E47]/30 group-hover:scale-110 transition-transform z-10`}>
                      {step.icon}
                    </div>
                    {i !== steps.length - 1 && (
                      <div className="w-0.5 h-full bg-[#525252] mt-2 min-h-[60px]" />
                    )}
                  </div>
                  <div className="pt-1">
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#CA3E47] transition-colors">{step.title}</h3>
                    <p className="text-gray-400">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Visual Pipeline Representation */}
          <div className="relative">
            <div className="absolute inset-0 bg-[#CA3E47]/10 blur-3xl rounded-full" />
            <div className="relative bg-[#414141] border border-[#525252] rounded-xl p-6 aspect-square flex items-center justify-center overflow-hidden shadow-2xl">
               <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
               
               <div className="flex flex-col gap-4 items-center z-10">
                 <div className="p-5 bg-[#313131] border border-[#CA3E47]/50 rounded-xl shadow-lg shadow-[#CA3E47]/10 animate-pulse">
                    <Code2 className="w-8 h-8 text-[#CA3E47]" />
                 </div>
                 <div className="h-8 w-0.5 bg-gradient-to-b from-[#CA3E47] to-[#525252]" />
                 <div className="p-5 bg-[#313131] border border-[#CA3E47]/30 rounded-xl shadow-lg animate-pulse delay-75">
                    <Zap className="w-8 h-8 text-white" />
                 </div>
                 <div className="h-8 w-0.5 bg-gradient-to-b from-[#525252] to-[#CA3E47]" />
                 <div className="p-5 bg-[#313131] border border-[#CA3E47] rounded-xl shadow-lg shadow-[#CA3E47]/20 animate-pulse delay-150">
                    <Play className="w-8 h-8 text-[#CA3E47]" />
                 </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};