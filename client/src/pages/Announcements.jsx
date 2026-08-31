import React, { useState, useEffect } from 'react';
import { Bell, Clock } from 'lucide-react';
import { API_BASE } from '../context/AuthContext';

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE}/api/announcements`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setAnnouncements(data.data);
        }
      })
      .catch(console.error);
  }, []);

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
          <Bell className="w-7 h-7 text-blue-600" />
          <span>System News & Broadcasts</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Official platform updates, daily signals notifications, and system promotions.
        </p>
      </div>

      <div className="space-y-4">
        {announcements.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200">
            <Bell className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-500">No active announcements at this moment.</p>
          </div>
        ) : (
          announcements.map((ann) => (
            <div
              key={ann.id}
              className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs space-y-3 hover:border-blue-300 transition-colors"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    ann.category === 'Promotion' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                    ann.category === 'System' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                    'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}>
                    {ann.category || 'General'}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(ann.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <h3 className="text-base sm:text-lg font-extrabold text-slate-900">{ann.title}</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{ann.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
