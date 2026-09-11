'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Clock, ChevronDown, Check, Zap, Sparkles, X, Globe } from 'lucide-react';

export default function SignalDateTimePicker({ value, onChange, label = 'Execution Time (PKT / PST)' }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const [livePktTime, setLivePktTime] = useState('');

  // Live PKT clock ticker
  useEffect(() => {
    const updatePktClock = () => {
      const now = new Date();
      const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
      const pktNow = new Date(utc + (3600000 * 5));
      const hours = pktNow.getHours();
      const minutes = String(pktNow.getMinutes()).padStart(2, '0');
      const seconds = String(pktNow.getSeconds()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const h12 = hours % 12 || 12;
      setLivePktTime(`${String(h12).padStart(2, '0')}:${minutes}:${seconds} ${ampm}`);
    };

    updatePktClock();
    const interval = setInterval(updatePktClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Default to today's date in YYYY-MM-DD
  const getTodayStr = (offsetDays = 0) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Format date nicely
  const formatDateLabel = (dateStr) => {
    if (!dateStr) return '';
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      if (isNaN(dateObj.getTime())) return dateStr;
      return dateObj.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  };

  // State parsed from value
  const [selectedDate, setSelectedDate] = useState(() => getTodayStr(0));
  const [selectedHour, setSelectedHour] = useState('08');
  const [selectedMinute, setSelectedMinute] = useState('00');
  const [selectedPeriod, setSelectedPeriod] = useState('PM');

  // Parse incoming value when it changes
  useEffect(() => {
    if (!value) return;
    try {
      const dateMatch = value.match(/(\d{1,2}\s+[A-Za-z]{3}\s+\d{4})/);
      if (dateMatch) {
        const parsedDate = new Date(dateMatch[1]);
        if (!isNaN(parsedDate.getTime())) {
          const y = parsedDate.getFullYear();
          const m = String(parsedDate.getMonth() + 1).padStart(2, '0');
          const d = String(parsedDate.getDate()).padStart(2, '0');
          setSelectedDate(`${y}-${m}-${d}`);
        }
      }

      const timeMatch = value.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
      if (timeMatch) {
        let h = parseInt(timeMatch[1], 10);
        const min = timeMatch[2].padStart(2, '0');
        const period = timeMatch[3] ? timeMatch[3].toUpperCase() : (h >= 12 ? 'PM' : 'AM');
        
        if (h > 12) h = h - 12;
        if (h === 0) h = 12;
        
        setSelectedHour(String(h).padStart(2, '0'));
        setSelectedMinute(min);
        setSelectedPeriod(period);
      }
    } catch (e) {
      console.warn('Error parsing datetime:', e);
    }
  }, [value]);

  // Handle outside click & Esc key
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Quick Time Presets
  const quickTimePresets = [
    '06:00 PM', '06:30 PM',
    '07:00 PM', '07:30 PM',
    '08:00 PM', '08:30 PM',
    '09:00 PM', '09:30 PM',
    '10:00 PM', '10:30 PM',
    '11:00 PM', '11:30 PM'
  ];

  const updateFormattedValue = (dateStr, h, m, p) => {
    const timeOnly = `${h}:${m} ${p} (PST)`;
    if (onChange) {
      onChange(timeOnly);
    }
  };

  const applyPresetTime = (preset) => {
    const match = preset.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (match) {
      const h = match[1].padStart(2, '0');
      const m = match[2].padStart(2, '0');
      const p = match[3].toUpperCase();
      setSelectedHour(h);
      setSelectedMinute(m);
      setSelectedPeriod(p);
      updateFormattedValue(selectedDate, h, m, p);
    }
  };

  const handleHourSelect = (h) => {
    const formattedHour = String(h).padStart(2, '0');
    setSelectedHour(formattedHour);
    updateFormattedValue(selectedDate, formattedHour, selectedMinute, selectedPeriod);
  };

  const handleMinuteSelect = (m) => {
    const formattedMinute = String(m).padStart(2, '0');
    setSelectedMinute(formattedMinute);
    updateFormattedValue(selectedDate, selectedHour, formattedMinute, selectedPeriod);
  };

  const handlePeriodToggle = (p) => {
    setSelectedPeriod(p);
    updateFormattedValue(selectedDate, selectedHour, selectedMinute, p);
  };

  const handleDateChange = (newDateStr) => {
    setSelectedDate(newDateStr);
    updateFormattedValue(newDateStr, selectedHour, selectedMinute, selectedPeriod);
  };

  // Calculate live relative countdown
  const getCountdownPreview = () => {
    try {
      let h24 = parseInt(selectedHour, 10);
      if (selectedPeriod === 'PM' && h24 < 12) h24 += 12;
      if (selectedPeriod === 'AM' && h24 === 12) h24 = 0;
      
      const now = new Date();
      const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
      const pktNow = new Date(utc + (3600000 * 5));

      const target = new Date(pktNow);
      if (selectedDate) {
        const [y, m, d] = selectedDate.split('-').map(Number);
        target.setFullYear(y, m - 1, d);
      }
      target.setHours(h24, parseInt(selectedMinute, 10), 0, 0);

      let diffMs = target.getTime() - pktNow.getTime();
      if (diffMs < 0) {
        return 'Passed';
      }

      const diffMins = Math.floor(diffMs / (1000 * 60));
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;

      if (hours === 0) {
        return `⚡ In ${mins}m`;
      }
      return `⏳ In ${hours}h ${mins}m`;
    } catch (e) {
      return '';
    }
  };

  const hoursList = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
  const minutesList = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

  return (
    <div className="relative" ref={containerRef}>
      {label && <label className="block text-xs font-bold text-slate-400 mb-1">{label}</label>}

      {/* Main Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-slate-800 border ${
          isOpen ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-700 hover:border-slate-600'
        } rounded-xl px-3 py-2 text-xs text-white font-bold flex items-center justify-between transition-all cursor-pointer shadow-sm`}
      >
        <div className="flex items-center gap-2 truncate">
          <div className="w-5 h-5 rounded-lg bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0">
            <Clock className="w-3 h-3" />
          </div>
          <span className="font-mono text-xs font-black text-white">
            {selectedHour}:{selectedMinute} {selectedPeriod}
          </span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 font-extrabold uppercase">
            PKT
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] text-amber-400 font-bold bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">
            {getCountdownPreview()}
          </span>
          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Popover Scheduler (Modal Sheet on Mobile, Absolute Popover on Desktop) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm sm:bg-transparent sm:backdrop-blur-none sm:absolute sm:inset-auto sm:left-0 sm:top-full sm:mt-2 sm:p-0">
          <div className="w-full max-w-sm sm:w-[380px] bg-slate-900 border border-slate-700 rounded-3xl p-4 sm:p-5 space-y-4 shadow-2xl backdrop-blur-2xl max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            
            {/* Header with Live PKT time */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-1.5 text-blue-400">
                  <Sparkles className="w-4 h-4" />
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">Signal Execution Timer</h4>
                </div>
                {livePktTime && (
                  <p className="text-[10px] text-emerald-400 font-mono font-bold mt-0.5 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>Live PKT: {livePktTime}</span>
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Direct Digital Clock Display & AM/PM Toggle */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Scheduled Time</span>
                <div className="flex items-center gap-1 text-xl font-mono font-black text-white">
                  <span className="bg-slate-800 px-2.5 py-1 rounded-xl border border-slate-700">{selectedHour}</span>
                  <span className="text-blue-500 animate-pulse">:</span>
                  <span className="bg-slate-800 px-2.5 py-1 rounded-xl border border-slate-700">{selectedMinute}</span>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase text-right">Period</span>
                <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
                  <button
                    type="button"
                    onClick={() => handlePeriodToggle('AM')}
                    className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                      selectedPeriod === 'AM'
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    AM
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePeriodToggle('PM')}
                    className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                      selectedPeriod === 'PM'
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    PM
                  </button>
                </div>
              </div>
            </div>

            {/* Section 1: Quick Date Selection */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-blue-400" /> Target Date
                </span>
                <span className="text-[10px] text-blue-300 font-mono font-bold">
                  {formatDateLabel(selectedDate)}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleDateChange(getTodayStr(0))}
                  className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    selectedDate === getTodayStr(0)
                      ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/30'
                      : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  Today
                </button>

                <button
                  type="button"
                  onClick={() => handleDateChange(getTodayStr(1))}
                  className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    selectedDate === getTodayStr(1)
                      ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/30'
                      : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  Tomorrow
                </button>

                <label className="relative py-1.5 px-2 rounded-xl text-xs font-bold border bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800 flex items-center justify-center cursor-pointer transition-all">
                  <span>Pick Date</span>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => handleDateChange(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                </label>
              </div>
            </div>

            {/* Section 2: 1-Tap Quick Time Presets */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-400" /> 1-Tap Popular Signal Times
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                {quickTimePresets.map((preset) => {
                  const isActive = `${selectedHour}:${selectedMinute} ${selectedPeriod}` === preset;
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => applyPresetTime(preset)}
                      className={`py-1.5 px-1 rounded-xl text-[10px] font-mono font-bold border transition-all cursor-pointer ${
                        isActive
                          ? 'bg-amber-500 text-slate-950 font-black border-amber-400 shadow-md shadow-amber-500/30 ring-1 ring-amber-400'
                          : 'bg-slate-800/60 text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      {preset}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section 3: Precision Hours & Minutes Grid */}
            <div className="space-y-3 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
              {/* Hours */}
              <div>
                <span className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Select Hour (1 - 12)</span>
                <div className="grid grid-cols-6 gap-1">
                  {hoursList.map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => handleHourSelect(h)}
                      className={`py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                        selectedHour === h
                          ? 'bg-blue-600 text-white font-black shadow-md shadow-blue-500/30'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                      }`}
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>

              {/* Minutes */}
              <div>
                <span className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Select Minute (00 - 55)</span>
                <div className="grid grid-cols-6 gap-1">
                  {minutesList.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => handleMinuteSelect(m)}
                      className={`py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                        selectedMinute === m
                          ? 'bg-emerald-600 text-white font-black shadow-md shadow-emerald-500/30'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                      }`}
                    >
                      :{m}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <div className="text-xs">
                <span className="text-slate-400">Scheduled: </span>
                <span className="font-mono font-black text-white">
                  {selectedHour}:{selectedMinute} {selectedPeriod} (PST)
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-md shadow-blue-500/20 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Confirm & Apply</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

