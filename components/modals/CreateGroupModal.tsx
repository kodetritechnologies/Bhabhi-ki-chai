'use client';

import React, { useState } from 'react';
import {
  LuX as X,
  LuPlus as Plus,
  LuUsers as Users,
  LuClock as Clock,
  LuCopy as Copy,
  LuCheck as Check,
  LuArrowRight as ArrowRight,
  LuKeyRound as KeyIcon,
  LuCircleAlert as AlertCircle,
  LuCoffee as Coffee,
} from 'react-icons/lu';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (groupId: string) => void;
  userEmail?: string;
}

function to12Hour(time24: string): string {
  if (!time24 || !time24.includes(':')) return time24;
  const [hStr, mStr] = time24.split(':');
  let h = parseInt(hStr, 10);
  const m = mStr || '00';
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${String(h).padStart(2, '0')}:${m} ${ampm}`;
}

function to24Hour(time12: string): string {
  if (!time12) return '10:30';
  const match = time12.match(/(\d+):(\d+)\s*(AM|PM)?/i);
  if (!match) return time12.includes(':') ? time12 : '10:30';
  let h = parseInt(match[1], 10);
  const m = match[2];
  const ampm = (match[3] || '').toUpperCase();
  if (ampm === 'PM' && h < 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${m}`;
}

const PRESET_TIMES = ['10:00 AM', '10:30 AM', '04:30 PM', '05:30 PM'];

const BANNER_OPTIONS = [
  {
    id: 'b1',
    label: 'Golden Hour Tapri',
    url: '/images/golden-hour-tapri.jpg',
  },
  {
    id: 'b2',
    label: 'Doston Ki Chai',
    url: '/images/doston-ki-chai-banner.jpg',
  },
  {
    id: 'b3',
    label: 'Cozy Tea Stall',
    url: '/images/cozy-tea-stall.jpg',
  },
  {
    id: 'b4',
    label: 'Chai Lovers',
    url: '/images/chai-lovers-banner.jpg',
  },
];

export default function CreateGroupModal({
  isOpen,
  onClose,
  onSuccess,
  userEmail,
}: CreateGroupModalProps) {
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');

  // Create Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [chaiTime, setChaiTime] = useState('10:30 AM');
  const [chaiTime24, setChaiTime24] = useState('10:30');
  const [workingDays, setWorkingDays] = useState<number[]>([1, 2, 3, 4, 5, 6]); // Mon to Sat
  const [memberInput, setMemberInput] = useState('');
  const [memberEmails, setMemberEmails] = useState<string[]>([]);
  const [selectedBanner, setSelectedBanner] = useState(BANNER_OPTIONS[0].url);

  // Join Form State
  const [inviteCode, setInviteCode] = useState('');

  // Status & Feedback
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [createdGroup, setCreatedGroup] = useState<{
    _id: string;
    name: string;
    inviteCode: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const dayLabels = [
    { day: 1, label: 'Mon' },
    { day: 2, label: 'Tue' },
    { day: 3, label: 'Wed' },
    { day: 4, label: 'Thu' },
    { day: 5, label: 'Fri' },
    { day: 6, label: 'Sat' },
    { day: 0, label: 'Sun' },
  ];

  const toggleDay = (day: number) => {
    if (workingDays.includes(day)) {
      if (workingDays.length === 1) return; // at least 1 day
      setWorkingDays(workingDays.filter((d) => d !== day));
    } else {
      setWorkingDays([...workingDays, day]);
    }
  };

  const handleAddMember = () => {
    const clean = memberInput.trim().toLowerCase();
    if (clean && clean.includes('@') && !memberEmails.includes(clean)) {
      setMemberEmails([...memberEmails, clean]);
      setMemberInput('');
    }
  };

  const handleMemberKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddMember();
    }
  };

  const handleRemoveMember = (emailToRemove: string) => {
    setMemberEmails(memberEmails.filter((e) => e !== emailToRemove));
  };

  // Submit Create Group
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim()) {
      setErrorMessage('Kripya group ka naam enter karein!');
      return;
    }

    const finalTime = chaiTime || to12Hour(chaiTime24);

    setSubmitting(true);
    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          chaiTime: finalTime,
          workingDays,
          userEmail,
          memberEmails,
          bannerImage: selectedBanner,
        }),
      });

      const data = await res.json();
      if (data.success && data.group) {
        setCreatedGroup({
          _id: data.group._id,
          name: data.group.name,
          inviteCode: data.group.inviteCode,
        });
      } else {
        setErrorMessage(data.error || 'Group create karne me error aayi.');
      }
    } catch (err: unknown) {
      setErrorMessage((err as Error).message || 'Server error.');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Join Group by Invite Code
  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!inviteCode.trim()) {
      setErrorMessage('Kripya invite code enter karein!');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/groups/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inviteCode: inviteCode.trim(),
          userEmail,
        }),
      });

      const data = await res.json();
      if (data.success && data.group) {
        onSuccess?.(data.group._id);
        handleCloseModal();
      } else {
        setErrorMessage(data.error || 'Group join karne me error aayi.');
      }
    } catch (err: unknown) {
      setErrorMessage((err as Error).message || 'Server error.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyCode = () => {
    if (createdGroup?.inviteCode) {
      navigator.clipboard.writeText(createdGroup.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleFinish = () => {
    if (createdGroup) {
      onSuccess?.(createdGroup._id);
    }
    handleCloseModal();
  };

  const handleCloseModal = () => {
    setName('');
    setDescription('');
    setChaiTime('10:30 AM');
    setChaiTime24('10:30');
    setWorkingDays([1, 2, 3, 4, 5, 6]);
    setMemberInput('');
    setMemberEmails([]);
    setInviteCode('');
    setCreatedGroup(null);
    setErrorMessage('');
    setCopied(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs select-none">
      {/* Outer Card: Clean border, no clipped corners or scrollbar leaks */}
      <div className="relative w-full max-w-lg bg-[#FFF9ED] border-4 border-[#8B502C] rounded-3xl shadow-2xl text-[#2B211B] flex flex-col max-h-[88vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={handleCloseModal}
          className="absolute top-3.5 right-3.5 z-20 p-2 rounded-full hover:bg-[#F2E5D3] text-[#7A5A40] transition-colors cursor-pointer"
          title="Close Modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header (Fixed at top) */}
        <div className="px-5 pt-4 pb-3 border-b border-[#EEDFCA] bg-[#FFF8EB] shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#F4B52E]/25 border border-[#8B502C]/30 text-[#8C4610] flex items-center justify-center font-bold text-xl shadow-inner shrink-0">
              <Coffee className="w-5 h-5 text-[#8C4610]" />
            </div>
            <div className="min-w-0 flex-1 pr-6">
              <h3 className="font-kalam text-2xl font-black text-[#3B1B0D] leading-none truncate">
                Chai Group Module
              </h3>
              <p className="text-[11px] text-[#734A29] font-medium mt-0.5 truncate">
                Daily rotation, chai duty &amp; tea expense manager
              </p>
            </div>
          </div>

          {/* Mode Switch Tabs (Create New vs Join with Code) */}
          {!createdGroup && (
            <div className="flex bg-[#EEDCCA] p-1 rounded-xl mt-3 border border-[#DECAAE]">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('create');
                  setErrorMessage('');
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'create'
                    ? 'bg-[#361D0D] text-[#FFF4DF] shadow-sm'
                    : 'text-[#5C3E28] hover:text-[#2B1408]'
                }`}
              >
                Create New Group
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('join');
                  setErrorMessage('');
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'join'
                    ? 'bg-[#361D0D] text-[#FFF4DF] shadow-sm'
                    : 'text-[#5C3E28] hover:text-[#2B1408]'
                }`}
              >
                Join with Invite Code
              </button>
            </div>
          )}
        </div>

        {/* Scrollable Content Body with Elegant Inset Slim Scrollbar */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3.5 modal-scroll">
          {/* Error Message */}
          {errorMessage && (
            <div className="p-2.5 bg-red-100/95 border border-red-300 rounded-xl text-red-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span className="font-semibold">{errorMessage}</span>
            </div>
          )}

          {/* SUCCESS VIEW */}
          {createdGroup ? (
            <div className="py-2 text-center space-y-3.5">
              <div className="w-14 h-14 rounded-full bg-[#10B981]/15 text-[#10B981] flex items-center justify-center mx-auto text-2xl shadow-inner">
                ✓
              </div>
              <div>
                <h4 className="font-kalam text-2xl font-bold text-[#3B1B0D]">
                  Badhai Ho! 🎉
                </h4>
                <p className="text-xs text-[#6C5343] mt-0.5">
                  Group <strong className="text-[#3B1B0D]">&apos;{createdGroup.name}&apos;</strong> safaltapoorvak ban gaya hai!
                </p>
              </div>

              {/* Invite Code Share Card */}
              <div className="p-3.5 bg-[#F5E7D3] border-2 border-[#D8BE9E] rounded-2xl text-left space-y-1.5">
                <span className="text-[10px] font-bold text-[#8C4610] uppercase tracking-wider block">
                  Share this Invite Code with Team Members
                </span>
                <div className="flex items-center justify-between gap-2 bg-white/95 p-2 rounded-xl border border-[#D5BEA1]">
                  <span className="font-mono text-base font-black text-[#3B1B0D] tracking-wider select-all">
                    {createdGroup.inviteCode}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="px-3 py-1.5 rounded-lg bg-[#3B1B0D] text-[#FFF4DF] text-xs font-bold hover:bg-[#522915] transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#10B981]" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-[#F4B52E]" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[10px] text-[#7A695E]">
                  Is code se koi bhi member turant group join kar sakta hai.
                </p>
              </div>

              <button
                type="button"
                onClick={handleFinish}
                className="w-full py-2.5 rounded-xl bg-[#8C4610] hover:bg-[#703509] text-[#FFF4DF] font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Dashboard Par Naye Group Me Jayein</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : activeTab === 'create' ? (
            /* TAB 1: CREATE FORM FIELDS */
            <form id="create-group-form" onSubmit={handleCreateSubmit} className="space-y-3">
              {/* Group Name */}
              <div>
                <label className="block text-xs font-bold text-[#4A2412] mb-1">
                  Group Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border-2 border-[#D5BEA1] focus:border-[#8C4610] bg-white text-xs sm:text-sm font-semibold text-[#3B1B0D] outline-none transition-colors"
                  placeholder="e.g. Core Engineering Chai Gang"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-[#4A2412] mb-1">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-[#D5BEA1] focus:border-[#8C4610] bg-white text-xs text-[#3B1B0D] outline-none transition-colors"
                  placeholder="e.g. Daily cutting chai break & tech charcha"
                />
              </div>

              {/* Chai Time - Native Time Input with Quick Presets */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-[#4A2412] flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#8C4610]" />
                    <span>Daily Chai Time *</span>
                  </label>
                  <span className="text-[11px] font-extrabold text-[#8C4610] bg-[#FCE6CD] px-2 py-0.5 rounded-md border border-[#E9C7A2]">
                    {chaiTime}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Native HTML5 Time Picker Input */}
                  <div className="relative flex-1">
                    <input
                      type="time"
                      value={chaiTime24}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val) {
                          setChaiTime24(val);
                          setChaiTime(to12Hour(val));
                        }
                      }}
                      className="w-full px-3 py-1.5 rounded-xl border-2 border-[#D5BEA1] focus:border-[#8C4610] bg-white text-xs sm:text-sm font-bold text-[#3B1B0D] outline-none transition-colors cursor-pointer"
                    />
                  </div>

                  {/* Quick Preset Time Buttons */}
                  <div className="flex gap-1 shrink-0">
                    {PRESET_TIMES.map((preset) => {
                      const isSelected = chaiTime === preset;
                      return (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => {
                            setChaiTime(preset);
                            setChaiTime24(to24Hour(preset));
                          }}
                          className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#8C4610] text-[#FFF4DF] border-[#8C4610] shadow-xs'
                              : 'bg-white text-[#543825] border-[#D5BEA1] hover:bg-[#FDF3E5]'
                          }`}
                        >
                          {preset}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Active Working Days */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-[#4A2412]">
                    Active Chai Days (Rota Schedule)
                  </label>
                  <span className="text-[10px] text-[#7A695E]">
                    {workingDays.length} Days/Week
                  </span>
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {dayLabels.map(({ day, label }) => {
                    const isSelected = workingDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={`py-1.5 rounded-xl text-xs font-extrabold border transition-all cursor-pointer text-center ${
                          isSelected
                            ? 'bg-[#3B1B0D] text-[#FFF4DF] border-[#3B1B0D] shadow-xs'
                            : 'bg-white/80 text-[#8C7565] border-[#D5BEA1] hover:bg-white'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Initial Member Email Invites */}
              <div>
                <label className="block text-xs font-bold text-[#4A2412] mb-1">
                  Invite Members by Email (Optional)
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="email"
                    value={memberInput}
                    onChange={(e) => setMemberInput(e.target.value)}
                    onKeyDown={handleMemberKeyDown}
                    placeholder="name@example.com"
                    className="flex-1 px-3 py-1.5 rounded-xl border border-[#D5BEA1] focus:border-[#8C4610] bg-white text-xs text-[#3B1B0D] outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddMember}
                    className="px-3 py-1.5 bg-[#F4B52E] hover:bg-[#DE9E16] text-[#281308] font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>
                {memberEmails.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {memberEmails.map((email) => (
                      <span
                        key={email}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#EBD8C3] text-[#3B1B0D] text-[11px] font-semibold rounded-lg"
                      >
                        {email}
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(email)}
                          className="text-red-700 hover:text-red-900 cursor-pointer font-bold ml-0.5"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Theme Banner Selection */}
              <div>
                <label className="block text-xs font-bold text-[#4A2412] mb-1.5 flex items-center justify-between">
                  <span>Group Card Theme Banner</span>
                  <span className="text-[10px] text-[#7A695E] font-medium">Select background art</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {BANNER_OPTIONS.map((b) => {
                    const isSelected = selectedBanner === b.url;
                    return (
                      <div
                        key={b.id}
                        onClick={() => setSelectedBanner(b.url)}
                        className={`group relative rounded-xl overflow-hidden cursor-pointer border-2 transition-all aspect-[16/10] bg-[#2E1408] ${
                          isSelected
                            ? 'border-[#8C4610] ring-2 ring-[#8C4610]/40 shadow-sm'
                            : 'border-[#DEC9AF] hover:border-[#8C4610]/60 opacity-80 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={b.url}
                          alt={b.label}
                          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-black/85 via-black/40 to-transparent flex items-end justify-center pb-0.5 px-1">
                          <span className="text-[9px] text-[#FFF4DF] text-center font-bold truncate">
                            {b.label}
                          </span>
                        </div>
                        {isSelected && (
                          <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#8C4610] text-[#FFF4DF] flex items-center justify-center text-[10px] font-black shadow-md ring-1 ring-white/80">
                            ✓
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </form>
          ) : (
            /* TAB 2: JOIN WITH INVITE CODE */
            <form id="join-group-form" onSubmit={handleJoinSubmit} className="space-y-3.5 py-1">
              <div className="p-3.5 bg-[#F5E7D3] border border-[#DECAAE] rounded-2xl text-xs text-[#5C3E28] leading-relaxed">
                💡 <strong>Invite Code:</strong> Apne group admin se <code>CHAI-XXXX-XX</code> code lein aur yahan enter karein. Aap turant us group ki duty rota list me shamil ho jayenge!
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4A2412] mb-1.5">
                  Enter Group Invite Code *
                </label>
                <div className="relative">
                  <KeyIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C6042]" />
                  <input
                    type="text"
                    required
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    placeholder="e.g. CHAI-OFFICE-99"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border-2 border-[#D5BEA1] bg-white font-mono text-sm font-extrabold text-[#3B1B0D] tracking-wider focus:border-[#8C4610] outline-none"
                  />
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Modal Sticky Footer (Always Visible at Bottom) */}
        {!createdGroup && (
          <div className="px-5 py-3.5 bg-[#FFF4DF] border-t border-[#EEDFCA] shrink-0">
            {activeTab === 'create' ? (
              <button
                type="submit"
                form="create-group-form"
                disabled={submitting}
                className="w-full py-2.5 rounded-xl bg-[#8C4610] hover:bg-[#703509] active:scale-[0.99] text-[#FFF4DF] font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center space-x-1.5 border border-[#8C4610] cursor-pointer disabled:opacity-50"
              >
                <Plus className="w-4 h-4 text-[#F4B52E]" />
                <span>{submitting ? 'Creating Chai Group...' : 'Create Chai Group ☕'}</span>
              </button>
            ) : (
              <button
                type="submit"
                form="join-group-form"
                disabled={submitting || !inviteCode.trim()}
                className="w-full py-2.5 rounded-xl bg-[#361D0D] hover:bg-[#201007] active:scale-[0.99] text-[#FFF4DF] font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center space-x-1.5 border border-[#F4B52E]/40 cursor-pointer disabled:opacity-50"
              >
                <Users className="w-4 h-4 text-[#F4B52E]" />
                <span>{submitting ? 'Joining Group...' : 'Join Chai Circle ☕'}</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
