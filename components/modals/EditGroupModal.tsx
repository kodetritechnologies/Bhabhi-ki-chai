'use client';

import React, { useState, useEffect } from 'react';
import {
  LuX as X,
  LuPlus as Plus,
  LuTrash2 as Trash2,
  LuUsers as Users,
  LuClock as Clock,
  LuCircleAlert as AlertCircle,
  LuCheck as Check,
} from 'react-icons/lu';

interface GroupMemberItem {
  userId: string;
  name: string;
  email: string;
  role: 'admin' | 'member';
  isCreator: boolean;
}

interface EditGroupModalProps {
  groupId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  userEmail?: string;
}

const PRESET_TIMES = ['10:00 AM', '10:30 AM', '04:30 PM', '05:30 PM'];

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

const WEEKDAYS = [
  { day: 1, label: 'Mon' },
  { day: 2, label: 'Tue' },
  { day: 3, label: 'Wed' },
  { day: 4, label: 'Thu' },
  { day: 5, label: 'Fri' },
  { day: 6, label: 'Sat' },
  { day: 0, label: 'Sun' },
];

export default function EditGroupModal({
  groupId,
  isOpen,
  onClose,
  onSuccess,
  userEmail,
}: EditGroupModalProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [chaiTime, setChaiTime] = useState('10:30 AM');
  const [chaiTime24, setChaiTime24] = useState('10:30');
  const [workingDays, setWorkingDays] = useState<number[]>([1, 2, 3, 4, 5, 6]);
  const [members, setMembers] = useState<GroupMemberItem[]>([]);
  const [removedUserIds, setRemovedUserIds] = useState<string[]>([]);
  const [newEmails, setNewEmails] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState('');

  useEffect(() => {
    if (!isOpen || !groupId) return;

    let cancelled = false;
    const loadGroup = async () => {
      setLoading(true);
      setErrorMessage('');
      setRemovedUserIds([]);
      setNewEmails([]);
      setEmailInput('');

      try {
        const params = new URLSearchParams();
        if (userEmail) params.set('userEmail', userEmail);
        const res = await fetch(`/api/groups/${groupId}?${params.toString()}`);
        const json = await res.json();
        if (cancelled) return;

        if (!json.success) {
          setErrorMessage(json.error || 'Group details load nahi ho sake.');
        } else {
          setName(json.group.name || '');
          setDescription(json.group.description || '');
          const loadedTime = json.group.chaiTime || '10:30 AM';
          setChaiTime(loadedTime);
          setChaiTime24(to24Hour(loadedTime));
          setWorkingDays(json.group.workingDays || [1, 2, 3, 4, 5, 6]);
          setMembers(json.members || []);
        }
      } catch {
        if (!cancelled) setErrorMessage('Server se connect nahi ho paya.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadGroup();
    return () => {
      cancelled = true;
    };
  }, [isOpen, groupId, userEmail]);

  if (!isOpen || !groupId) return null;

  const toggleDay = (day: number) => {
    if (workingDays.includes(day)) {
      if (workingDays.length === 1) return;
      setWorkingDays(workingDays.filter((d) => d !== day));
    } else {
      setWorkingDays([...workingDays, day]);
    }
  };

  const handleAddEmail = () => {
    const clean = emailInput.trim().toLowerCase();
    if (!clean || !clean.includes('@')) {
      setErrorMessage('Sahi email address enter karein.');
      return;
    }
    const alreadyInMembers = members.some(
      (m) => m.email.toLowerCase() === clean && !removedUserIds.includes(m.userId)
    );
    if (alreadyInMembers || newEmails.includes(clean)) {
      setErrorMessage('Yeh email pehle se group me hai.');
      return;
    }
    setErrorMessage('');
    setNewEmails([...newEmails, clean]);
    setEmailInput('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Group ka naam zaroori hai.');
      return;
    }
    setSaving(true);
    setErrorMessage('');
    try {
      const res = await fetch(`/api/groups/${groupId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail,
          name: name.trim(),
          description: description.trim(),
          chaiTime: chaiTime.trim(),
          workingDays,
          addMemberEmails: newEmails,
          removeUserIds: removedUserIds,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        setErrorMessage(json.error || 'Update nahi ho paya.');
      } else {
        onSuccess?.();
        onClose();
      }
    } catch {
      setErrorMessage('Update karte waqt network error aaya.');
    } finally {
      setSaving(false);
    }
  };

  const visibleMembers = members.filter((m) => !removedUserIds.includes(m.userId));

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-[#FFF8EC] border-2 border-[#D4A45E] rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="bg-[#3B1D0E] text-[#FFF4DF] px-5 py-4 flex items-center justify-between border-b border-[#522915]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#F4B52E]/20 text-[#F4B52E] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-kalam text-xl font-bold leading-none">Update Chai Group</h3>
              <p className="text-[11px] text-[#D8BBA2] mt-0.5">Members add/remove aur settings edit karein</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#522915] hover:bg-[#6E391D] text-[#FFF4DF] flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSave} className="p-5 overflow-y-auto space-y-4 text-sm">
          {errorMessage && (
            <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {loading ? (
            <p className="text-center text-xs text-[#7A5A40] py-8">Group details load ho rahi hain...</p>
          ) : (
            <>
              <div>
                <label className="block text-xs font-bold text-[#4A2412] mb-1">Group Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#DFC39B] text-[#2B211B] text-xs focus:outline-none focus:border-[#8C4610]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4A2412] mb-1">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short tagline..."
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#DFC39B] text-[#2B211B] text-xs focus:outline-none focus:border-[#8C4610]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-[#4A2412] flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Chai Time
                  </label>
                  <span className="text-[11px] font-bold text-[#8C4610] bg-[#F4CF96]/60 px-2 py-0.5 rounded-lg">
                    {chaiTime}
                  </span>
                </div>
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
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
                    className="flex-1 min-w-[120px] px-3 py-1.5 rounded-xl bg-white border border-[#DFC39B] focus:border-[#8C4610] text-xs font-bold text-[#3B1B0D] outline-none cursor-pointer"
                  />
                  <div className="flex flex-wrap gap-1 shrink-0">
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
                          className={`py-1.5 px-2 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#8C4610] text-[#FFF4DF] border-[#8C4610]'
                              : 'bg-white text-[#543825] border-[#DFC39B] hover:bg-[#FDF3E5]'
                          }`}
                        >
                          {preset}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Working Days */}
              <div>
                <label className="block text-xs font-bold text-[#4A2412] mb-1.5">Working Days</label>
                <div className="flex flex-wrap gap-1.5">
                  {WEEKDAYS.map((d) => {
                    const active = workingDays.includes(d.day);
                    return (
                      <button
                        key={d.day}
                        type="button"
                        onClick={() => toggleDay(d.day)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                          active
                            ? 'bg-[#3B1D0E] text-[#F4B52E] border-[#3B1D0E]'
                            : 'bg-white text-[#6E492D] border-[#DFC39B] hover:bg-[#FAF0E1]'
                        }`}
                      >
                        {d.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Current Members */}
              <div>
                <label className="block text-xs font-bold text-[#4A2412] mb-1.5">
                  Members ({visibleMembers.length + newEmails.length})
                </label>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {visibleMembers.map((m) => (
                    <div
                      key={m.userId}
                      className="flex items-center justify-between px-3 py-2 rounded-xl bg-white border border-[#E8D4B4] text-xs"
                    >
                      <div className="min-w-0">
                        <span className="font-bold text-[#3B1D0E]">{m.name}</span>
                        <span className="text-[#7A5A40] ml-1.5 text-[11px]">({m.email})</span>
                      </div>
                      {m.isCreator ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F4B52E]/25 text-[#8C4610] shrink-0">
                          Creator
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setRemovedUserIds([...removedUserIds, m.userId])}
                          className="p-1 rounded-lg text-red-500 hover:bg-red-50 cursor-pointer shrink-0"
                          title="Remove member"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}

                  {newEmails.map((em) => (
                    <div
                      key={em}
                      className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] text-xs"
                    >
                      <div className="min-w-0">
                        <span className="font-bold text-[#065F46]">{em}</span>
                        <span className="ml-1.5 text-[10px] text-[#059669] font-semibold">(New)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setNewEmails(newEmails.filter((x) => x !== em))}
                        className="p-1 rounded-lg text-red-500 hover:bg-red-50 cursor-pointer shrink-0"
                        title="Remove"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add Member by Email */}
              <div>
                <label className="block text-xs font-bold text-[#4A2412] mb-1">Add New Member (Email)</label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddEmail();
                      }
                    }}
                    placeholder="friend@example.com"
                    className="flex-1 px-3.5 py-2 rounded-xl bg-white border border-[#DFC39B] text-[#2B211B] text-xs focus:outline-none focus:border-[#8C4610]"
                  />
                  <button
                    type="button"
                    onClick={handleAddEmail}
                    className="px-3.5 py-2 rounded-xl bg-[#F4CF96] hover:bg-[#EBC07E] text-[#2E180B] border border-[#D4A45E] font-bold text-xs flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Footer Actions */}
          <div className="pt-2 border-t border-[#E8D4B4] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#EFE1CA] hover:bg-[#E5D1B0] text-[#4A2412] font-bold text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || saving}
              className="px-5 py-2 rounded-xl bg-[#1C140E] hover:bg-[#331E12] text-[#FFF4DF] font-bold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
