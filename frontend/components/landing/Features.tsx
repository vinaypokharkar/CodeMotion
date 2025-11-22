import React from 'react';
import { Code2, Video, Terminal } from 'lucide-react';

export const Features = () => {
  const features = [
    {
      icon: <Code2 className="w-6 h-6 text-[#CA3E47]" />,
      title: "Natural Language to Code",
      description: "Just type what you want to see. Our fine-tuned LLM generates precise Manim Python code instantly."
    },
    {
      icon: <Video className="w-6 h-6 text-[#CA3E47]" />,
      title: "High-Def Rendering",
      description: "Cloud-based render farm compiles your video in 1080p/4k at 60fps in seconds, not minutes."
    },
    {
      icon: <Terminal className="w-6 h-6 text-[#CA3E47]" />,
      title: "Full Code Control",
      description: "Don't like the output? Edit the generated Python code directly in our browser-based IDE."
    }
  ];

  return (
    <section id="features" className="py-24 bg-transparent relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Built for Speed & Precision</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">Create educational content, technical presentations, and data visualizations without the steep learning curve.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="p-8 rounded-2xl bg-[#414141] border border-[#525252] hover:border-[#CA3E47] transition-all hover:-translate-y-1 duration-300 group"
            >
              <div className="w-12 h-12 bg-[#313131] rounded-lg flex items-center justify-center mb-6 border border-[#525252] group-hover:border-[#CA3E47]/50 transition-colors">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
              <p className="text-gray-400 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};