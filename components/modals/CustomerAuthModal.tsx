'use client';

import React, { useState, useRef } from 'react';
import {
  LuX as X,
  LuUser as UserIcon,
  LuMail as MailIcon,
  LuKeyRound as KeyIcon,
  LuArrowRight as ArrowRight,
  LuCircleCheck as CheckCircle,
  LuCircleAlert as AlertCircle,
  LuCoffee as Coffee,
} from 'react-icons/lu';

interface CustomerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: { _id: string; name: string; email: string; avatar: string }) => void;
  initialMode?: 'login' | 'register';
}

export default function CustomerAuthModal({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'login',
}: CustomerAuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  
  // Register fields
  const [name, setName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  
  // Login fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginStep, setLoginStep] = useState<'email' | 'otp'>('email');
  const [otp, setOtp] = useState<string[]>(['', '', '', '']);
  
  // Status states
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // 4 OTP input refs
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const handleClose = () => {
    setErrorMessage('');
    setSuccessMessage('');
    setLoginStep('email');
    setOtp(['', '', '', '']);
    onClose();
  };

  if (!isOpen) return null;

  // Handle single digit change in OTP inputs
  const handleOtpChange = (index: number, value: string) => {
    // Only accept numeric value
    const cleanChar = value.replace(/[^0-9]/g, '');
    const newOtp = [...otp];

    if (cleanChar.length > 0) {
      newOtp[index] = cleanChar[cleanChar.length - 1]; // take last character typed
      setOtp(newOtp);
      setErrorMessage('');

      // Auto move focus to next input box
      if (index < 3) {
        inputRefs[index + 1].current?.focus();
      }
    } else {
      newOtp[index] = '';
      setOtp(newOtp);
    }
  };

  // Handle Backspace navigation across OTP boxes
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        // If current box is empty, jump back to previous box and clear it
        inputRefs[index - 1].current?.focus();
      }
    }
  };

  // Handle full OTP paste (e.g. user copies '1234')
  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim().replace(/[^0-9]/g, '');
    if (pastedData.length >= 4) {
      const chars = pastedData.slice(0, 4).split('');
      setOtp(chars);
      inputRefs[3].current?.focus();
    }
  };

  // 1. Submit Registration Form
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!name.trim()) {
      setErrorMessage('Kripya apna naam enter karein!');
      return;
    }
    if (!regEmail.trim()) {
      setErrorMessage('Kripya email address enter karein!');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: regEmail.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Registration failed.');
        return;
      }

      setSuccessMessage('Account ban gaya! Ab 4-digit OTP daal kar login karein.');
      // Auto move to Login with OTP
      setLoginEmail(regEmail.trim());
      setMode('login');
      setLoginStep('otp');
      setTimeout(() => {
        inputRefs[0].current?.focus();
      }, 100);
    } catch (err) {
      console.error(err);
      setErrorMessage('Server error. Kripya punah koshish karein.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Step 1: Send OTP for Login (also handles Resend OTP)
  const requestOtp = async (isResend = false) => {
    setErrorMessage('');
    setSuccessMessage('');

    if (!loginEmail.trim()) {
      setErrorMessage('Kripya apna email address enter karein!');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail.trim(), isResend }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Account nahi mila.');
        return;
      }

      setSuccessMessage(data.message || 'OTP safaltapoorvak bhej diya gaya hai!');
      setLoginStep('otp');
      setOtp(['', '', '', '']);
      setTimeout(() => {
        inputRefs[0].current?.focus();
      }, 100);
    } catch (err) {
      console.error(err);
      setErrorMessage('OTP bhejte samay error aayi.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    await requestOtp(false);
  };

  const handleResendOtp = async () => {
    await requestOtp(true);
  };

  // 3. Step 2: Verify 4-digit OTP & Login
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const enteredOtp = otp.join('');
    if (enteredOtp.length < 4) {
      setErrorMessage('Kripya pura 4-digit OTP daalein!');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail.trim(), otp: enteredOtp }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Galat OTP!');
        return;
      }

      setSuccessMessage('Login safal raha! Khul raha hai dashboard...');
      setTimeout(() => {
        onSuccess(data.user);
        onClose();
      }, 700);
    } catch (err) {
      console.error(err);
      setErrorMessage('Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs select-none">
      <div className="relative w-full max-w-md bg-[#FFF9ED] border-4 border-[#8B502C] rounded-3xl p-6 sm:p-7 shadow-2xl text-[#2B211B] animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-[#F2E5D3] text-[#7A5A40] transition-colors cursor-pointer"
          title="Close Modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#F4B52E]/20 border-2 border-[#8B502C]/40 mb-2 shadow-inner">
            <Coffee className="w-7 h-7 text-[#8C4610]" />
          </div>
          <h2 className="font-kalam text-3xl font-extrabold text-[#3B1B0D] tracking-tight">
            Customer Account
          </h2>
          <p className="text-xs text-[#7A695E] font-medium mt-0.5">
            Bhabhi Ki Chai • Team Tapri Portal
          </p>
        </div>

        {/* Mode Switch Tabs (Register vs Login) */}
        <div className="flex bg-[#EEDCCA] p-1 rounded-2xl mb-5 border border-[#DECAAE]">
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMessage('');
              setSuccessMessage('');
            }}
            className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
              mode === 'register'
                ? 'bg-[#361D0D] text-[#FFF4DF] shadow-md'
                : 'text-[#5C3E28] hover:text-[#2B1408]'
            }`}
          >
            Create Account
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMessage('');
              setSuccessMessage('');
            }}
            className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
              mode === 'login'
                ? 'bg-[#361D0D] text-[#FFF4DF] shadow-md'
                : 'text-[#5C3E28] hover:text-[#2B1408]'
            }`}
          >
            OTP Login
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-100/90 border border-red-300 rounded-xl text-red-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span className="font-semibold">{errorMessage}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div className="mb-4 p-3 bg-green-100/90 border border-green-300 rounded-xl text-green-900 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0 text-green-700" />
            <span className="font-semibold">{successMessage}</span>
          </div>
        )}

        {/* ================= REGISTER FORM ================= */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#4A2412] mb-1.5">
                Apna Poora Naam (Full Name) *
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C6042]" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Vikram Sharma"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-white/90 border-2 border-[#D9C4A9] focus:border-[#8C4610] rounded-xl text-sm text-[#2B211B] outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#4A2412] mb-1.5">
                Email Address *
              </label>
              <div className="relative">
                <MailIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C6042]" />
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-white/90 border-2 border-[#D9C4A9] focus:border-[#8C4610] rounded-xl text-sm text-[#2B211B] outline-none transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 bg-[#8C4610] hover:bg-[#703509] text-[#FFF4DF] rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span>Account Ban Raha Hai...</span>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <p className="text-center text-xs text-[#7A695E] mt-3">
              Pehle se account hai?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMessage('');
                  setSuccessMessage('');
                }}
                className="font-bold text-[#8C4610] underline cursor-pointer hover:text-[#5E2B08]"
              >
                Yahan se Login karein
              </button>
            </p>
          </form>
        )}

        {/* ================= LOGIN FORM WITH 4-BOX OTP ================= */}
        {mode === 'login' && (
          <div>
            {loginStep === 'email' ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#4A2412] mb-1.5">
                    Registered Email Address *
                  </label>
                  <div className="relative">
                    <MailIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C6042]" />
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="e.g. rahul@example.com"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-white/90 border-2 border-[#D9C4A9] focus:border-[#8C4610] rounded-xl text-sm text-[#2B211B] outline-none transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-[#361D0D] hover:bg-[#201007] text-[#F4B52E] rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <span>OTP Bhej Rahe Hain...</span>
                  ) : (
                    <>
                      <span>Get 4-Digit OTP</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <p className="text-center text-xs text-[#7A695E] mt-3">
                  Naye user ho?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('register');
                      setErrorMessage('');
                      setSuccessMessage('');
                    }}
                    className="font-bold text-[#8C4610] underline cursor-pointer hover:text-[#5E2B08]"
                  >
                    Naya Account Banayein
                  </button>
                </p>
              </form>
            ) : (
              /* OTP 4 Input Boxes Screen */
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="text-center mb-1">
                  <p className="text-xs text-[#7A695E]">
                    OTP bhej diya gaya hai: <strong className="text-[#3B1B0D]">{loginEmail}</strong>
                  </p>
                  <button
                    type="button"
                    onClick={() => setLoginStep('email')}
                    className="text-[11px] text-[#8C4610] font-bold underline cursor-pointer mt-0.5"
                  >
                    Change Email
                  </button>
                </div>

                {/* 4 Distinct OTP Square Boxes */}
                <div>
                  <label className="block text-center text-xs font-bold text-[#4A2412] mb-3">
                    Enter 4-Digit OTP
                  </label>
                  <div className="flex items-center justify-center gap-3 sm:gap-4" onPaste={handleOtpPaste}>
                    {[0, 1, 2, 3].map((idx) => (
                      <input
                        key={idx}
                        ref={inputRefs[idx]}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={otp[idx]}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        className={`w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-black rounded-2xl border-2 transition-all outline-none shadow-sm ${
                          otp[idx]
                            ? 'border-[#8C4610] bg-[#FFF5E6] text-[#3B1B0D] ring-2 ring-[#8C4610]/30'
                            : 'border-[#D9C4A9] bg-white text-[#2B211B] focus:border-[#8C4610]'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.join('').length < 4}
                  className="w-full py-3 bg-[#8C4610] hover:bg-[#703509] text-[#FFF4DF] rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <span>Verifying OTP...</span>
                  ) : (
                    <>
                      <KeyIcon className="w-4 h-4" />
                      <span>Verify OTP & Login</span>
                    </>
                  )}
                </button>

                <div className="text-center mt-2">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleResendOtp}
                    className="text-xs font-semibold text-[#7A695E] hover:text-[#3B1B0D] cursor-pointer disabled:opacity-50"
                  >
                    OTP nahi mila? <span className="underline font-bold text-[#8C4610]">Resend OTP</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
