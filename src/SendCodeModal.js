import React, { useState } from 'react';
import { getActiveServerUrl } from './serverPort';

function SendCodeModal({ isOpen, onClose, code = '', filename = 'superbot_car.ino' }) {
  const [studentName, setStudentName] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const buildEmailBody = () => {
    return `שלום,\n\nמצורף הקוד מהפרויקט של ${studentName || 'התלמיד'}:\nקובץ: ${filename}\nתאריך: ${new Date().toLocaleDateString('he-IL')}\n\n==================== קוד C++ / Arduino ====================\n${code}\n===========================================================\n\nהערות:\n${notes || 'ללא הערות נוספות'}\n\nנשלח מ-SmartStartWeb 🚀`;
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!studentName.trim()) {
      setStatusMsg('❌ אנא הזן את שם התלמיד.');
      return;
    }
    if (!email || !email.includes('@')) {
      setStatusMsg('❌ אנא הזן כתובת מייל תקינה.');
      return;
    }

    setIsLoading(true);
    setStatusMsg('⏳ שולח את הקוד...');

    try {
      const baseUrl = await getActiveServerUrl();
      const res = await fetch(`${baseUrl}/send-code-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName,
          email,
          code,
          filename,
          notes
        }),
        signal: AbortSignal.timeout(3000)
      });

      const data = await res.json();
      if (data.success) {
        setStatusMsg(`✅ הקוד נרשם ונשלח בהצלחה עבור: ${email}`);
      }
    } catch (err) {
      // Fallback to direct client mail trigger
    }

    // Always trigger Gmail / Mail client fallback so the student gets an immediate mail window
    const subject = encodeURIComponent(`💻 קוד פרויקט: ${filename} (נשלח ע"י ${studentName})`);
    const body = encodeURIComponent(buildEmailBody());
    
    // Open Gmail web compose in a new tab if user uses webmail, or mailto
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}&su=${subject}&body=${body}`;
    window.open(gmailUrl, '_blank');

    setStatusMsg(`📧 נפתח חלון שליחת מייל ב-Gmail / דפדפן עבור ${email}`);
    setIsLoading(false);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadIno = () => {
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || 'superbot_car.ino';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(6px)',
        zIndex: 999999,
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
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)',
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
          
          {/* Student Name */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '6px', fontWeight: 'bold', color: '#cbd5e1' }}>
              👤 שם התלמיד / יוצר הפרויקט:
            </label>
            <input 
              type="text" 
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="למשל: דניאל כהן"
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

          {/* Email Address */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '6px', fontWeight: 'bold', color: '#cbd5e1' }}>
              ✉️ כתובת המייל לקבלת הקוד:
            </label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@gmail.com"
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

          {/* Notes */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '6px', fontWeight: 'bold', color: '#cbd5e1' }}>
              📝 הערות או תיאור פרויקט (אופציונלי):
            </label>
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="הוסף הערה קצרה..."
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

          {/* Quick utility buttons */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <button
              type="button"
              onClick={handleCopyCode}
              style={{
                flex: 1,
                padding: '8px 10px',
                borderRadius: '6px',
                border: '1px solid #475569',
                background: copied ? '#065f46' : '#1e293b',
                color: copied ? '#34d399' : '#94a3b8',
                fontSize: '0.82rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {copied ? '✅ הקוד הועתק!' : '📋 העתק קוד ללוח'}
            </button>
            <button
              type="button"
              onClick={handleDownloadIno}
              style={{
                flex: 1,
                padding: '8px 10px',
                borderRadius: '6px',
                border: '1px solid #475569',
                background: '#1e293b',
                color: '#94a3b8',
                fontSize: '0.82rem',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              💾 הורד קובץ .ino
            </button>
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
              סגור
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
              {isLoading ? 'שולח...' : '✉️ שלח במייל עכשיו'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SendCodeModal;
