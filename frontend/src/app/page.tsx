"use client";

import Image from "next/image";
import { Navbar } from "../../components/landing/Navbar";
import { Hero } from "../../components/landing/Hero";
import { Pricing } from "../../components/landing/Pricing";
import { Showcase } from "../../components/landing/Showcase";
import React, { useState } from "react";
import { AuthModal } from "../../components/landing/AuthModal";


export default function LandingPage() {
  // State to simulate authentication
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <div className="min-h-screen text-white selection:bg-[#CA3E47]/30 relative">
      
      {/* Global Background */}
      <div className="fixed inset-0 z-0 w-full h-full">
        <img 
          src="/gradient-bg.jpg" 
          alt="Background" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-[#1a1a1a]/90 backdrop-blur-[50px]" />
        <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      </div>

      <div className="relative z-10">
        {/* Pass login handler and state to Navbar */}
        <Navbar 
          onLoginSuccess={() => setIsLoggedIn(true)} 
          isLoggedIn={isLoggedIn}
        />
        
        <main>
          <Hero />
          {/* Pass state to Showcase */}
          <Showcase isLoggedIn={isLoggedIn} />
          <Pricing />
        </main>
      </div>
    </div>
  );
}

