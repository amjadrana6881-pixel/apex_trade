'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Clock, ChevronDown, Check, Zap, Sparkles, X } from 'lucide-react';

export default function SignalDateTimePicker({ value, onChange, label = 'Execution Time (PKT/PST)' }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Default to today's date in YYYY-MM-DD
  const getTodayStr = (offsetDays = 0) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper to format date nicely
  const formatDateLabel = (dateStr) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    if (isNaN(dateObj.getTime())) return dateStr;
    return dateObj.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
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
      // Check if value has date format like "12 Sep 2026, 08:00 PM"
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

      // Match time e.g. "08:30 PM" or "19:00"
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

  // Handle outside click to close popover
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Quick Time Presets
  const quickTimePresets = [
    '06:00 PM', '06:30 PM',
    '07:00 PM', '07:30 PM',
    '08:00 PM', '08:30 PM',
    '09:00 PM', '09:30 PM',
    '10:00 PM', '10:30 PM'
  ];

  const applyPresetTime = (preset) => {
    const match = preset.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (match) {
      setSelectedHour(match[1].padStart(2, '0'));
      setSelectedMinute(match[2].padStart(2, '0'));
      setSelectedPeriod(match[3].toUpperCase());
      updateFormattedValue(selectedDate, match[1].padStart(2, '0'), match[2].padStart(2, '0'), match[3].toUpperCase());
    }
  };

  const updateFormattedValue = (dateStr, h, m, p) => {
    const timeOnly = `${h}:${m} ${p} (PST)`;
    if (onChange) {
      onChange(timeOnly);
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

  // Calculate live remaining time countdown
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
        return 'Completed for today';
      }

      const diffMins = Math.floor(diffMs / (1000 * 60));
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;

      if (hours === 0) {
        return `⚡ In ${mins} mins`;
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

      {/* Main Trigger Field */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-slate-800 border ${
          isOpen ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-700 hover:border-slate-600'
        } rounded-xl px-3 py-2 text-xs text-white font-bold flex items-center justify-between transition-all cursor-pointer shadow-sm`}
      >
        <div className="flex items-center gap-2 truncate">
          <div className="w-5 h-5 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
            <Clock className="w-3 h-3" />
          </div>
          <span className="font-mono text-xs text-white">
            {selectedHour}:{selectedMinute} {selectedPeriod}
          </span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 font-semibold uppercase">
            PKT
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] text-amber-400 font-medium hidden sm:inline-block">
            {getCountdownPreview()}
          </span>
          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Dropdown Calendar & Timer Picker Popover */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 sm:right-auto sm:w-[380px] mt-2 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-4 space-y-4 backdrop-blur-xl">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <h4 className="text-xs font-black text-white uppercase tracking-wider">Signal Execution Scheduler</h4>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Section 1: Quick Date Selection */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3 h-3 text-emerald-400" /> Date Selection
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {formatDateLabel(selectedDate)}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => handleDateChange(getTodayStr(0))}
                className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-all ${
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
                className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-all ${
                  selectedDate === getTodayStr(1)
                    ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/30'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800'
                }`}
              >
                Tomorrow
              </button>

              <label className="relative py-1.5 px-2 rounded-lg text-[11px] font-bold border bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800 flex items-center justify-center cursor-pointer">
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

          {/* Section 2: Quick Time Presets */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" /> Quick Time Presets
            </span>
            <div className="grid grid-cols-4 gap-1.5">
              {quickTimePresets.map((preset) => {
                const isActive = `${selectedHour}:${selectedMinute} ${selectedPeriod}` === preset;
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => applyPresetTime(preset)}
                    className={`py-1 px-1 rounded-lg text-[10px] font-mono font-bold border transition-all ${
                      isActive
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 ring-1 ring-amber-500/30'
                        : 'bg-slate-800/50 text-slate-400 border-slate-700/60 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {preset}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Interactive Clock / Timer Wheel */}
          <div className="space-y-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between pb-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Precision Clock Selector
              </span>
              <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded-lg border border-slate-700">
                <button
                  type="button"
                  onClick={() => handlePeriodToggle('AM')}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                    selectedPeriod === 'AM'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  AM
                </button>
                <button
                  type="button"
                  onClick={() => handlePeriodToggle('PM')}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                    selectedPeriod === 'PM'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  PM
                </button>
              </div>
            </div>

            {/* Hours Selector */}
            <div>
              <span className="text-[9px] text-slate-500 font-bold uppercase block mb-1">Hour</span>
              <div className="grid grid-cols-6 gap-1">
                {hoursList.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => handleHourSelect(h)}
                    className={`py-1 rounded-md text-xs font-mono font-bold transition-all ${
                      selectedHour === h
                        ? 'bg-blue-500 text-white font-black shadow-md shadow-blue-500/30'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>

            {/* Minutes Selector */}
            <div>
              <span className="text-[9px] text-slate-500 font-bold uppercase block mb-1">Minute</span>
              <div className="grid grid-cols-6 gap-1">
                {minutesList.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleMinuteSelect(m)}
                    className={`py-1 rounded-md text-xs font-mono font-bold transition-all ${
                      selectedMinute === m
                        ? 'bg-emerald-500 text-white font-black shadow-md shadow-emerald-500/30'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    :{m}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer with summary and Done button */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-800">
            <div className="text-[11px] text-slate-300">
              <span className="text-slate-400">Scheduled: </span>
              <span className="font-mono font-bold text-white">
                {selectedHour}:{selectedMinute} {selectedPeriod} (PST)
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1 shadow-md shadow-blue-500/20 cursor-pointer"
            >
              <Check className="w-3 h-3" />
              <span>Done</span>
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
