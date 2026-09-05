'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Headphones, 
  Edit2, 
  Trash2, 
  Check, 
  CheckCheck, 
  Image as ImageIcon, 
  X, 
  Paperclip, 
  ShieldCheck, 
  User, 
  Maximize2,
  Sparkles,
  Phone,
  Radio,
  ArrowLeft
} from 'lucide-react';
import { useAuth, API_BASE } from '@/app/context/AuthContext';

export default function ContactPage() {
  const { user, token } = useAuth();

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  // Edit Message State
  const [editingMsg, setEditingMsg] = useState(null);
  const [editText, setEditText] = useState('');

  // Delete Modal State
  const [deletingMsg, setDeletingMsg] = useState(null);

  // Image Zoom Lightbox
  const [zoomedImage, setZoomedImage] = useState(null);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/support/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setMessages(data.data);
      }
    } catch (err) {
      console.error('Failed to load support chat:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 2500);
      return () => clearInterval(interval);
    }
  }, [token]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, imagePreview]);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearSelectedImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!inputText.trim() && !selectedImage) || sending) return;

    const messageText = inputText.trim();
    const imageToSend = selectedImage;

    setInputText('');
    clearSelectedImage();

    try {
      setSending(true);

      const formData = new FormData();
      if (messageText) formData.append('message', messageText);
      if (imageToSend) formData.append('image', imageToSend);

      const res = await fetch(`${API_BASE}/api/support/messages/send`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();
      if (data.success && data.data) {
        setMessages((prev) => {
          if (prev.some(m => (m._id || m.id) === (data.data._id || data.data.id))) return prev;
          return [...prev, data.data];
        });
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingMsg || !editText.trim()) return;

    try {
      const msgId = editingMsg._id || editingMsg.id;
      const res = await fetch(`${API_BASE}/api/support/messages/${msgId}/edit`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ message: editText.trim() })
      });

      const data = await res.json();
      if (data.success && data.data) {
        setMessages(prev => prev.map(m => (m._id || m.id) === (data.data._id || data.data.id) ? data.data : m));
        setEditingMsg(null);
        setEditText('');
      }
    } catch (err) {
      console.error('Failed to edit message:', err);
    }
  };

  const handleDeleteMessage = async (mode) => {
    if (!deletingMsg) return;

    try {
      const msgId = deletingMsg._id || deletingMsg.id;
      const res = await fetch(`${API_BASE}/api/support/messages/${msgId}?mode=${mode}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      if (data.success) {
        if (mode === 'for_everyone') {
          setMessages(prev => prev.map(m => {
            if ((m._id || m.id) === msgId) {
              return {
                ...m,
                message: '🚫 This message was deleted',
                image_url: '',
                deleted_for_everyone: true
              };
            }
            return m;
          }));
        } else {
          setMessages(prev => prev.filter(m => (m._id || m.id) !== msgId));
        }
        setDeletingMsg(null);
      }
    } catch (err) {
      console.error('Failed to delete message:', err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-20 md:pb-6">
      
      {/* 1. Messenger Header Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20">
              <Headphones className="w-6 h-6" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"></span>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-base sm:text-lg font-black text-slate-900 leading-tight">ApexTrade Live Human Support</h1>
              <span className="px-2 py-0.2 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black border border-emerald-200">
                ONLINE
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Official Dedicated Human Desk • Typical response under 2 mins
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-600">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Encrypted Session</span>
        </div>
      </div>

      {/* 2. Full Live Chat Messenger Area */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden flex flex-col h-[560px] sm:h-[640px]">
        
        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-6 space-y-4 bg-slate-50/60">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
              <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <p className="text-xs font-bold">Connecting to Support Desk...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
                <Sparkles className="w-8 h-8" />
              </div>
              <h3 className="text-base font-black text-slate-900">Welcome to ApexTrade Live Support</h3>
              <p className="text-xs text-slate-500 max-w-sm">
                Have questions regarding crypto deposits, daily 7 PM signals, withdrawals, or KYC? Send a message or screenshot below to speak with a human support officer.
              </p>
            </div>
          ) : (
            messages.map((m) => {
              const isMe = m.sender_role === 'user';
              const isDeleted = m.deleted_for_everyone === true;

              return (
                <div
                  key={m._id || m.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group`}
                >
                  {/* Sender Name & Timestamp */}
                  <div className="flex items-center gap-1.5 mb-1 px-1">
                    <span className="text-[10px] font-black text-slate-400">
                      {isMe ? 'You' : '🛡️ Official Support'}
                    </span>
                    <span className="text-[9px] text-slate-300">
                      {new Date(m.created_at || m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="relative flex items-center gap-1.5 max-w-[88%] sm:max-w-[75%]">
                    
                    {/* User Action Controls (Edit / Delete) */}
                    {isMe && !isDeleted && (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                        <button
                          onClick={() => {
                            setEditingMsg(m);
                            setEditText(m.message);
                          }}
                          className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-200 transition-colors cursor-pointer"
                          title="Edit Message"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingMsg(m)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-200 transition-colors cursor-pointer"
                          title="Delete Message"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {/* Chat Bubble */}
                    <div
                      className={`p-3.5 sm:p-4 rounded-2xl text-xs sm:text-sm leading-relaxed break-words shadow-2xs ${
                        isDeleted
                          ? 'bg-slate-100 text-slate-400 italic border border-slate-200'
                          : isMe
                          ? 'bg-blue-600 text-white rounded-br-xs font-medium'
                          : 'bg-white text-slate-900 border border-slate-200 rounded-bl-xs'
                      }`}
                    >
                      {/* Attached Image */}
                      {m.image_url && !isDeleted && (
                        <div 
                          onClick={() => setZoomedImage(m.image_url)}
                          className="mb-2.5 rounded-xl overflow-hidden cursor-pointer border border-black/10 max-h-60 relative group/img"
                        >
                          <img 
                            src={m.image_url} 
                            alt="Attachment" 
                            className="w-full h-full object-cover group-hover/img:scale-105 transition-transform" 
                          />
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                            <Maximize2 className="w-5 h-5 text-white" />
                          </div>
                        </div>
                      )}

                      {/* Text Message */}
                      {m.message && <p>{m.message}</p>}

                      {/* Bottom Info: Edited & Double Blue Ticks Seen Indicator */}
                      <div className="flex items-center justify-end gap-1 mt-1">
                        {m.is_edited && !isDeleted && (
                          <span className={`text-[9px] ${isMe ? 'text-blue-200' : 'text-slate-400'}`}>
                            (edited)
                          </span>
                        )}

                        {/* Read Receipts for User Messages */}
                        {isMe && !isDeleted && (
                          <span title={m.is_seen ? 'Seen by Support Officer' : 'Delivered to Server'}>
                            {m.is_seen ? (
                              <CheckCheck className="w-3.5 h-3.5 text-blue-200" />
                            ) : (
                              <Check className="w-3.5 h-3.5 text-blue-300/80" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Selected Image Thumbnail Bar */}
        {imagePreview && (
          <div className="px-4 py-2 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src={imagePreview} alt="Preview" className="w-12 h-12 rounded-xl object-cover border border-slate-300" />
              <div>
                <span className="text-xs font-bold text-slate-800">Screenshot Attached</span>
                <span className="text-[10px] text-slate-400 block">{selectedImage?.name}</span>
              </div>
            </div>
            <button
              onClick={clearSelectedImage}
              className="p-1.5 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Message Input & Attachment Bar */}
        <form
          onSubmit={handleSendMessage}
          className="p-3 sm:p-4 bg-white border-t border-slate-200 flex items-center gap-2"
        >
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            className="hidden"
            onChange={handleImageSelect}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 sm:p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-blue-600 transition-colors cursor-pointer shrink-0"
            title="Attach Screenshot / Image"
          >
            <Paperclip className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your message to support officer..."
            className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-500 font-medium"
          />

          <button
            type="submit"
            disabled={sending || (!inputText.trim() && !selectedImage)}
            className="px-4 sm:px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
      </div>

      {/* 3. LIGHTBOX IMAGE ZOOM MODAL */}
      {zoomedImage && (
        <div 
          onClick={() => setZoomedImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/85 backdrop-blur-md animate-in fade-in"
        >
          <div className="relative max-w-3xl w-full max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setZoomedImage(null)}
              className="absolute -top-10 right-0 p-2 text-white hover:text-slate-300"
            >
              <X className="w-6 h-6" />
            </button>
            <img src={zoomedImage} alt="Zoomed" className="max-h-[85vh] w-auto rounded-2xl shadow-2xl object-contain" />
          </div>
        </div>
      )}

      {/* 4. EDIT MESSAGE MODAL */}
      {editingMsg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl max-w-md w-full space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-blue-600" />
                <span>Edit Support Message</span>
              </h3>
              <button
                onClick={() => setEditingMsg(null)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <textarea
              rows="3"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-blue-500 resize-none font-medium"
            />

            <div className="flex gap-2">
              <button
                onClick={() => setEditingMsg(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. DELETE MESSAGE MODAL */}
      {deletingMsg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl max-w-sm w-full text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-black text-slate-900">Delete Message?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Choose how you want to delete this message.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => handleDeleteMessage('for_everyone')}
                className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-xs cursor-pointer"
              >
                Delete for Everyone
              </button>

              <button
                onClick={() => handleDeleteMessage('for_me')}
                className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs cursor-pointer"
              >
                Delete for Me Only
              </button>

              <button
                onClick={() => setDeletingMsg(null)}
                className="w-full py-2 text-slate-400 hover:text-slate-600 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
