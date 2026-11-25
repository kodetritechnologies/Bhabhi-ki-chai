'use client';

import React from 'react';
import {
  LuSparkles as Sparkles,
  LuArrowRight as ArrowRight,
  LuUsers as Users,
  LuClock as Clock,
  LuReceipt as Receipt,
  LuKeyRound as KeyIcon,
  LuShieldCheck as ShieldCheck,
} from 'react-icons/lu';

interface GuestWelcomeViewProps {
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onExploreDemo?: () => void;
}

export default function GuestWelcomeView({
  onOpenAuth,
  onExploreDemo,
}: GuestWelcomeViewProps) {
  return (
    <div className="w-full max-w-[1280px] mx-auto px-3 sm:px-6 pt-1 sm:pt-2 lg:pt-3 pb-16 select-none animate-in fade-in duration-300">
      {/* 1. HERO BANNER CARD */}
      <div className="relative overflow-hidden rounded-[28px] sm:rounded-[36px] bg-gradient-to-br from-[#FFF9ED] via-[#FCEAD2] to-[#F8D8B6] border-3 sm:border-4 border-[#8B502C] p-6 sm:p-10 shadow-2xl text-[#2B211B] mt-2 sm:mt-4 lg:mt-6 z-20">
        {/* Subtle Decorative Tapri Accents */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-radial from-[#F4B52E]/25 to-transparent rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-radial from-[#8C4610]/15 to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto text-center">
          {/* Headline */}
          <h1 className="font-kalam text-3xl sm:mt-1 sm:text-5xl lg:text-6xl font-black text-[#3B1B0D] tracking-tight leading-tight sm:leading-tight mb-3">
            Chai Pe Charcha, <br className="hidden sm:inline" />
            <span className="text-[#8C4610]">Duty Pe Zero Lafda! ☕</span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base lg:text-lg text-[#6C4B33] font-medium leading-relaxed max-w-2xl mx-auto mb-6 sm:mb-8">
            Office colleagues aur doston ke sath daily cutting chai ka automatic round-robin rota banayein, smart duty reminders paayein aur bina kisi behas ke transparent hisab-kitab rakhein.
          </p>

          {/* Primary & Secondary Call to Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-2xl mx-auto">
            <button
              type="button"
              onClick={() => onOpenAuth('register')}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-[#8C4610] via-[#753709] to-[#5C2A06] hover:from-[#7A3B0C] hover:to-[#4A2004] text-[#FFF4DF] font-extrabold text-sm sm:text-base shadow-xl hover:shadow-2xl hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] transition-all flex items-center justify-center gap-2.5 border-2 border-[#F4B52E] cursor-pointer whitespace-nowrap"
            >
              <KeyIcon className="w-4 h-4 text-[#F4B52E] shrink-0" />
              <span>Login / Create Account</span>
              <ArrowRight className="w-4 h-4 text-[#F4B52E] shrink-0" />
            </button>

            {onExploreDemo && (
              <button
                type="button"
                onClick={onExploreDemo}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-[#FFF3DF] hover:bg-white text-[#3B1B0D] font-extrabold text-sm sm:text-base border-2 border-[#D8BF9E] shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <Sparkles className="w-4 h-4 text-[#8C4610] shrink-0" />
                <span>Explore Demo Preview</span>
              </button>
            )}
          </div>

          {/* Security & Convenience Note */}
          <p className="text-[11px] text-[#8C6D54] font-medium mt-4 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#10B981]" />
            <span>Dev OTP: <code>1234</code> • No password hassle • 10-second setup</span>
          </p>
        </div>
      </div>

      {/* 2. 3 DISTINCT TAPRI FEATURE PILLARS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mt-8 sm:mt-10">
        {/* Card 1: Automatic Rota Rotation */}
        <div className="bg-[#FFF9ED] border-2 border-[#8B502C]/40 hover:border-[#8C4610] rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-200 text-left flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-[#3B1B0D] text-[#F4B52E] flex items-center justify-center text-xl font-bold shadow-md mb-3.5">
              <Users className="w-6 h-6 text-[#F4B52E]" />
            </div>
            <h3 className="font-kalam text-xl sm:text-2xl font-bold text-[#3B1B0D] mb-1.5">
              1. Fair Rota Rotation
            </h3>
            <p className="text-xs sm:text-sm text-[#6C5343] leading-relaxed">
              Roz kiska number hai cutting chai laane ka, system bina kisi bhed-bhav ke automatically decide karta hai. Sunday aur holidays rota me automatically adjust ho jate hain.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-[#EBD6BC] flex items-center gap-1 text-[11px] font-bold text-[#8C4610]">
            <span>Zero confusion, 100% fair</span>
          </div>
        </div>

        {/* Card 2: Smart Duty Alerts */}
        <div className="bg-[#FFF9ED] border-2 border-[#8B502C]/40 hover:border-[#8C4610] rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-200 text-left flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-[#8C4610] text-[#FFF4DF] flex items-center justify-center text-xl font-bold shadow-md mb-3.5">
              <Clock className="w-6 h-6 text-[#F4B52E]" />
            </div>
            <h3 className="font-kalam text-xl sm:text-2xl font-bold text-[#3B1B0D] mb-1.5">
              2. Smart Chai Reminders
            </h3>
            <p className="text-xs sm:text-sm text-[#6C5343] leading-relaxed">
              Subah aur chai time se pehle duty wale sadasya ko automatic alert milta hai. Agar koi busy hai, to 1-click me duty swap ya skip karne ka vikalp maujood hai.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-[#EBD6BC] flex items-center gap-1 text-[11px] font-bold text-[#8C4610]">
            <span>Chai break kabhi late nahi hoga</span>
          </div>
        </div>

        {/* Card 3: Transparent Expense Tracking */}
        <div className="bg-[#FFF9ED] border-2 border-[#8B502C]/40 hover:border-[#8C4610] rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-200 text-left flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-[#2D5A27] text-[#FFF4DF] flex items-center justify-center text-xl font-bold shadow-md mb-3.5">
              <Receipt className="w-6 h-6 text-[#9AE6B4]" />
            </div>
            <h3 className="font-kalam text-xl sm:text-2xl font-bold text-[#3B1B0D] mb-1.5">
              3. Tapri Hisab-Kitab
            </h3>
            <p className="text-xs sm:text-sm text-[#6C5343] leading-relaxed">
              Kisko kitne cup chai mili, kisne kitna bill pay kiya—sabka mahina bhar ka hisab-kitab transparent rahta hai. Monthly report ko PDF/ICS me export kar sakte hain.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-[#EBD6BC] flex items-center gap-1 text-[11px] font-bold text-[#1F5C1B]">
            <span>Clear audit logs aur transparency</span>
          </div>
        </div>
      </div>

      {/* 3. HOW IT WORKS IN 3 STEPS */}
      <div className="mt-10 sm:mt-12 p-6 sm:p-8 rounded-3xl bg-[#361D0D] border-2 border-[#8B502C] text-[#FFF4DF] shadow-xl text-center">
        <h3 className="font-kalam text-2xl sm:text-3xl font-extrabold text-[#F4B52E] mb-2">
          3 Simple Steps Me Shuru Karein ☕
        </h3>
        <p className="text-xs sm:text-sm text-[#D7C2B2] max-w-xl mx-auto mb-6">
          Kisi lambi registration ya complex settings ki zaroorat nahi hai.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
          <div className="p-4 rounded-2xl bg-[#281308] border border-[#522915]">
            <span className="text-xs font-bold text-[#F4B52E] uppercase tracking-wider block mb-1">
              Step 1
            </span>
            <h4 className="font-bold text-sm text-[#FFF4DF] mb-1">Account Banayein</h4>
            <p className="text-xs text-[#CDB29B]">
              Apna naam aur email dalein. Dev OTP <code>1234</code> se turant login karein.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#281308] border border-[#522915]">
            <span className="text-xs font-bold text-[#F4B52E] uppercase tracking-wider block mb-1">
              Step 2
            </span>
            <h4 className="font-bold text-sm text-[#FFF4DF] mb-1">Group Banayein Ya Join Karein</h4>
            <p className="text-xs text-[#CDB29B]">
              Naya Chai Circle create karein ya kisi dost ka invite code daal kar jud jayein.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#281308] border border-[#522915]">
            <span className="text-xs font-bold text-[#F4B52E] uppercase tracking-wider block mb-1">
              Step 3
            </span>
            <h4 className="font-bold text-sm text-[#FFF4DF] mb-1">Chai Duty Rota Chalu!</h4>
            <p className="text-xs text-[#CDB29B]">
              Automatic schedule aur reminders shuru ho jayenge. Chai pe charcha roz ka maja!
            </p>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-[#522915]">
          <button
            type="button"
            onClick={() => onOpenAuth('register')}
            className="px-6 py-2.5 rounded-xl bg-[#F4B52E] hover:bg-[#DE9E16] text-[#281308] font-black text-xs sm:text-sm shadow-md transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <span>Abhi Free Account Banayein</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
