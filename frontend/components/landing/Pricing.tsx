import React from 'react';
import { CheckCircle2 } from 'lucide-react';

export const Pricing = () => {
  const plans = [
    { name: 'Hobby', price: '$0', features: ['Standard Definition', '15 sec limit', 'Public Gallery'] },
    { name: 'Creator', price: '$19', features: ['1080p HD', '60 sec limit', 'No Watermark', 'Private Projects'], recommended: true },
    { name: 'Pro', price: '$49', features: ['4K Rendering', 'Unlimited length', 'API Access', 'Priority Support'] }
  ];

  return (
    <section id="pricing" className="py-24 bg-transparent border-t border-[#525252]">
       <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Simple Pricing</h2>
          <p className="text-gray-400 mb-12">Start for free, upgrade for 4K rendering and longer clips.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
             {plans.map((plan, i) => (
               <div key={i} className={`relative p-8 rounded-2xl border transition-transform hover:-translate-y-1 ${plan.recommended ? 'border-[#CA3E47] bg-[#414141] shadow-xl shadow-[#CA3E47]/10' : 'border-[#525252] bg-[#414141]/50'} flex flex-col`}>
                 {plan.recommended && <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#CA3E47] text-white px-4 py-1 rounded-full text-xs font-bold tracking-wide shadow-md">POPULAR</div>}
                 <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                 <div className="text-4xl font-bold text-white mb-6">{plan.price}<span className="text-sm text-gray-500 font-normal">/mo</span></div>
                 <ul className="space-y-4 mb-8 flex-1 text-left">
                   {plan.features.map((f, j) => (
                     <li key={j} className="flex items-center gap-3 text-gray-300">
                       <CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${plan.recommended ? 'text-[#CA3E47]' : 'text-gray-500'}`} /> {f}
                     </li>
                   ))}
                 </ul>
                 <button className={`w-full py-3 rounded-lg font-semibold transition-all ${plan.recommended ? 'bg-[#CA3E47] hover:bg-[#a8323a] text-white shadow-lg shadow-[#CA3E47]/20' : 'bg-[#525252] hover:bg-[#606060] text-white'}`}>
                   Choose {plan.name}
                 </button>
               </div>
             ))}
          </div>
       </div>
    </section>
  );
};