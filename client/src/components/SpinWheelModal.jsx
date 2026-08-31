import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { X, Sparkles, Trophy, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth, API_BASE } from '../context/AuthContext';

export default function SpinWheelModal({ isOpen, onClose }) {
  const { token, fetchProfile } = useAuth();

  const [wheelData, setWheelData] = useState(null);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [wonPrize, setWonPrize] = useState(null);
  const [error, setError] = useState('');
  const [canSpin, setCanSpin] = useState(false);

  const wheelRef = useRef(null);

  useEffect(() => {
    if (isOpen && token) {
      setError('');
      setWonPrize(null);
      fetchWheelStatus();
    }
  }, [isOpen, token]);

  const fetchWheelStatus = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/wheel/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setWheelData(data.data);
        setCanSpin(data.data.allowed);
      }
    } catch (err) {
      console.error('Failed to fetch wheel status:', err);
    }
  };

  const handleSpin = async () => {
    if (spinning || !canSpin) return;
    try {
      setSpinning(true);
      setError('');

      const res = await fetch(`${API_BASE}/api/wheel/spin`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      const result = await res.json();
      if (!result.success) {
        setSpinning(false);
        setError(result.error || 'Failed to spin');
        return;
      }

      const prizes = wheelData?.wheel?.prizes || [];
      const numSlices = prizes.length || 6;
      const sliceAngle = 360 / numSlices;
      const winningPos = result.data.winningPosition;

      // Calculate target angle with 5-8 full spins
      const extraSpins = 360 * 6;
      const targetSliceCenter = (winningPos * sliceAngle) + (sliceAngle / 2);
      const targetDegree = extraSpins + (360 - targetSliceCenter);

      setRotation(targetDegree);

      setTimeout(() => {
        setSpinning(false);
        setWonPrize(result.data.prize);
        setCanSpin(false);
        fetchProfile();

        // Confetti celebration
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }, 5000);

    } catch (err) {
      setSpinning(false);
      setError('Connection error');
    }
  };

  if (!isOpen) return null;

  const prizes = wheelData?.wheel?.prizes || [
    { label: '$5 Bonus', color: '#3b82f6', amount: 5 },
    { label: '$10 Cash', color: '#10b981', amount: 10 },
    { label: '$25 Reward', color: '#f59e0b', amount: 25 },
    { label: '$50 Jackpot', color: '#6366f1', amount: 50 },
    { label: '$100 Super', color: '#ec4899', amount: 100 },
    { label: '$250 Mega', color: '#8b5cf6', amount: 250 },
  ];
  const numSlices = prizes.length;
  const sliceAngle = 360 / numSlices;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden text-center space-y-6">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="space-y-1">
          <span className="px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-xs font-black text-amber-700 uppercase tracking-wide">
            DAILY LUCKY SPIN
          </span>
          <h3 className="text-2xl font-extrabold text-slate-900">Spin & Win Instant Cash</h3>
          <p className="text-xs text-slate-500">Every 24 hours, spin the wheel to claim free wallet cash!</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-600 flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {/* Wheel Container */}
        <div className="relative w-64 h-64 mx-auto flex items-center justify-center">
          {/* Top Indicator Arrow */}
          <div className="absolute -top-3 z-30 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[22px] border-t-amber-500 drop-shadow-md"></div>

          {/* SVG Wheel */}
          <div 
            ref={wheelRef}
            className="w-full h-full rounded-full shadow-xl border-4 border-white transition-transform duration-[5000ms] cubic-bezier(0.15, 0.9, 0.2, 1)"
            style={{ transform: `rotate(${rotation}deg)` }}
          >
            <svg viewBox="0 0 100 100" className="w-full h-full rounded-full">
              {prizes.map((p, idx) => {
                const angle = idx * sliceAngle;
                const rad = (angle * Math.PI) / 180;
                const nextRad = ((angle + sliceAngle) * Math.PI) / 180;

                const x1 = 50 + 50 * Math.cos(rad);
                const y1 = 50 + 50 * Math.sin(rad);
                const x2 = 50 + 50 * Math.cos(nextRad);
                const y2 = 50 + 50 * Math.sin(nextRad);

                const textAngle = angle + sliceAngle / 2;
                const textRad = (textAngle * Math.PI) / 180;
                const textX = 50 + 32 * Math.cos(textRad);
                const textY = 50 + 32 * Math.sin(textRad);

                return (
                  <g key={idx}>
                    <path
                      d={`M 50 50 L ${x1} ${y1} A 50 50 0 0 1 ${x2} ${y2} Z`}
                      fill={p.color || '#3b82f6'}
                      stroke="#ffffff"
                      strokeWidth="0.8"
                    />
                    <text
                      x={textX}
                      y={textY}
                      fill="#ffffff"
                      fontSize="4.2"
                      fontWeight="800"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      transform={`rotate(${textAngle + 90}, ${textX}, ${textY})`}
                    >
                      {p.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Center Medallion */}
          <div className="absolute z-20 w-12 h-12 rounded-full bg-white border-2 border-slate-200 shadow-lg flex items-center justify-center font-black text-xs text-blue-600">
            APEX
          </div>
        </div>

        {/* Won Prize Notification */}
        {wonPrize && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 space-y-1 animate-in zoom-in-90 duration-300">
            <Trophy className="w-7 h-7 text-emerald-600 mx-auto" />
            <h4 className="font-extrabold text-base">You Won {wonPrize.label}!</h4>
            <p className="text-xs text-emerald-700">Funds have been credited directly to your Spot Wallet.</p>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={handleSpin}
          disabled={spinning || !canSpin}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-slate-900 font-extrabold text-sm shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4 text-slate-900" />
          <span>
            {spinning ? 'Spinning Wheel...' : canSpin ? 'Spin Wheel Now (Free)' : 'Already Spun Today (24h Limit)'}
          </span>
        </button>
      </div>
    </div>
  );
}
