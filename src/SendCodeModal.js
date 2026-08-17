import React, { useState } from 'react';
import { getActiveServerUrl } from './serverPort';

function SendCodeModal({ isOpen, onClose, code = '', filename = 'superbot_car.ino' }) {
  const [email, setEmail] = useState('shimon1351992@gmail.com');
  const [notes, setNotes] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setStatusMsg('❌ אנא הזן כתובת מייל תקינה.');
      return;
    }

    setIsLoading(true);
    setStatusMsg('⏳ שולח את הקוד למייל...');

    try {
      const baseUrl = await getActiveServerUrl();
      const res = await fetch(`${baseUrl}/send-code-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          code,
          filename,
          notes
        })
      });

      const data = await res.json();
      if (data.success) {
        setStatusMsg(`✅ הקוד נשלח בהצלחה למייל: ${email}`);
        setTimeout(() => {
          setIsLoading(false);
          onClose();
        }, 1800);
      } else {
        // Fallback: Mailto link if server email service isn't configured
        triggerMailtoFallback();
      }
    } catch (err) {
      triggerMailtoFallback();
    }
  };

  const triggerMailtoFallback = () => {
    const subject = encodeURIComponent(`💻 קוד פרויקט: ${filename}`);
    const body = encodeURIComponent(`שלום,\n\nמצורף הקוד מהפרויקט שלך:\n\n====================\n${code}\n====================\n\nהערות:\n${notes}\n\nנשלח מ-SmartStartWeb 🚀`);
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
    setStatusMsg(`📧 נפתח חלון שליחת מייל בדפדפן עבר ${email}`);
    setIsLoading(false);
  };

  return (
    <div 
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        direction: 'rtl'
      }}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '90%',
          maxWidth: '520px',
          background: '#0f172a',
          borderRadius: '16px',
          border: '1px solid #334155',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)',
          overflow: 'hidden',
          color: 'white'
        }}
      >
        {/* Header */}
        <div style={{ padding: '18px 24px', background: '#1e293b', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8' }}>
            📧 שלח קוד פרויקט למייל
          </h3>
          <button 
            onClick={onClose} 
            style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.4rem', cursor: 'pointer' }}
          >
            ✖
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSendEmail} style={{ padding: '24px' }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '6px', fontWeight: 'bold', color: '#cbd5e1' }}>
              כתובת המייל לשליחה:
            </label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #475569',
                background: '#1e293b',
                color: 'white',
                fontSize: '0.95rem',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '6px', fontWeight: 'bold', color: '#cbd5e1' }}>
              הערות או תיאור פרויקט (אופציונלי):
            </label>
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="הוסף הערה קצרה לגבי הקוד..."
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #475569',
                background: '#1e293b',
                color: 'white',
                fontSize: '0.9rem',
                outline: 'none',
                resize: 'none'
              }}
            />
          </div>

          {statusMsg && (
            <div style={{ 
              marginBottom: '16px', 
              padding: '10px 14px', 
              borderRadius: '8px', 
              fontSize: '0.85rem', 
              fontWeight: 'bold',
              background: statusMsg.includes('❌') ? '#450a0a' : '#064e3b',
              color: statusMsg.includes('❌') ? '#f87171' : '#34d399',
              border: statusMsg.includes('❌') ? '1px solid #991b1b' : '1px solid #059669'
            }}>
              {statusMsg}
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 18px',
                borderRadius: '8px',
                border: '1px solid #475569',
                background: '#334155',
                color: 'white',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              ביטול
            </button>
            <button
              type="submit"
              disabled={isLoading}
              style={{
                padding: '8px 22px',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                color: 'white',
                fontWeight: 'bold',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 12px rgba(2,132,199,0.3)'
              }}
            >
              {isLoading ? 'שולח...' : '✉️ שלח קוד עכשיו'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SendCodeModal;
