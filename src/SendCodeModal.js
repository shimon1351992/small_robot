import React, { useState } from 'react';

function SendCodeModal({ isOpen, onClose, code = '', filename = 'superbot_car.ino' }) {
  const [studentName, setStudentName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [copied, setCopied] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  if (!isOpen) return null;

  const normalizePhoneNumber = (raw) => {
    let clean = raw.replace(/\D/g, ''); // remove non-digits
    if (clean.startsWith('05')) {
      clean = '972' + clean.slice(1);
    } else if (clean.startsWith('5')) {
      clean = '972' + clean;
    }
    return clean;
  };

  const handleSendWhatsApp = (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (!studentName.trim()) {
      setStatusMsg('❌ אנא הזן את שם התלמיד.');
      return;
    }

    const cleanPhone = normalizePhoneNumber(phone);
    if (!cleanPhone || cleanPhone.length < 9) {
      setStatusMsg('❌ אנא הזן מספר טלפון תקין (למשל: 052-1234567).');
      return;
    }

    const inoFilename = filename.endsWith('.ino') ? filename : `${filename}.ino`;

    // Construct Clean WhatsApp Message
    const message = `🤖 *SmartStart Robot - קוד פרויקט ארדואינו*\n\n` +
      `👤 *תלמיד/ה:* ${studentName}\n` +
      `📄 *קובץ פרויקט:* ${inoFilename}\n` +
      `📅 *תאריך:* ${new Date().toLocaleDateString('he-IL')}\n` +
      (notes ? `📝 *הערות:* ${notes}\n\n` : `\n`) +
      `💻 *קוד ה-Arduino C++ של הרובוט:*\n` +
      `\`\`\`cpp\n` +
      `${code}\n` +
      `\`\`\`\n\n` +
      `🚀 *נשלח מ-SmartStart Robot Studio*`;

    const waUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');

    setStatusMsg(`✅ פותח את WhatsApp לשליחה למספר ${phone}...`);
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
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999999,
        backdropFilter: 'blur(8px)',
        direction: 'rtl',
        margin: 0,
        padding: 0
      }}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '90%',
          maxWidth: '540px',
          background: '#0f172a',
          borderRadius: '24px',
          border: '1.5px solid #22c55e',
          boxShadow: '0 25px 70px rgba(0,0,0,0.8), 0 0 30px rgba(34,197,94,0.15)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          color: '#ffffff',
          margin: 'auto'
        }}
      >
        {/* Header */}
        <div style={{ padding: '20px 28px', background: '#1e293b', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', boxShadow: '0 4px 12px rgba(37,211,102,0.3)' }}>
              💬
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0, color: '#ffffff' }}>
                שלח קוד פרויקט ב-WhatsApp
              </h3>
              <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '3px' }}>
                קובץ: <span style={{ color: '#4ade80', fontWeight: 'bold' }}>{filename}</span>
              </div>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            style={{ background: '#334155', border: 'none', color: '#ffffff', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSendWhatsApp} style={{ padding: '24px' }}>
          
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
                padding: '12px 14px',
                borderRadius: '10px',
                border: '1.5px solid #475569',
                background: '#1e293b',
                color: 'white',
                fontSize: '0.95rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* WhatsApp Phone Number */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '6px', fontWeight: 'bold', color: '#cbd5e1' }}>
              📱 מספר טלפון / WhatsApp (לשליחת הקוד):
            </label>
            <input 
              type="tel" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="052-1234567"
              required
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '10px',
                border: '1.5px solid #22c55e',
                background: '#1e293b',
                color: 'white',
                fontSize: '1rem',
                fontWeight: 'bold',
                letterSpacing: '1px',
                outline: 'none',
                boxSizing: 'border-box',
                direction: 'ltr',
                textAlign: 'right'
              }}
            />
            <small style={{ color: '#94a3b8', fontSize: '0.78rem', marginTop: '4px', display: 'block' }}>
              💡 הקוד יישלח ישירות לוואטסאפ של המספר שהזנת (הורים / מורה / עצמי).
            </small>
          </div>

          {/* Notes */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '6px', fontWeight: 'bold', color: '#cbd5e1' }}>
              📝 הערות לפרויקט (אופציונלי):
            </label>
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="הוסף הערה קצרה..."
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1.5px solid #475569',
                background: '#1e293b',
                color: 'white',
                fontSize: '0.9rem',
                outline: 'none',
                resize: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Quick utility buttons */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '18px' }}>
            <button
              type="button"
              onClick={handleCopyCode}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '10px',
                border: '1px solid #475569',
                background: copied ? '#065f46' : '#1e293b',
                color: copied ? '#34d399' : '#94a3b8',
                fontSize: '0.85rem',
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
                padding: '10px',
                borderRadius: '10px',
                border: '1px solid #475569',
                background: '#1e293b',
                color: '#94a3b8',
                fontSize: '0.85rem',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              💾 הורד קובץ .ino למחשב
            </button>
          </div>

          {statusMsg && (
            <div style={{ 
              marginBottom: '16px', 
              padding: '12px 16px', 
              borderRadius: '10px', 
              fontSize: '0.9rem', 
              fontWeight: 'bold',
              background: statusMsg.includes('❌') ? '#450a0a' : '#064e3b',
              color: statusMsg.includes('❌') ? '#f87171' : '#34d399',
              border: statusMsg.includes('❌') ? '1px solid #991b1b' : '1px solid #059669'
            }}>
              {statusMsg}
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 20px',
                borderRadius: '10px',
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
              style={{
                padding: '12px 26px',
                borderRadius: '10px',
                border: 'none',
                background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                color: 'white',
                fontWeight: '800',
                fontSize: '0.95rem',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(37,211,102,0.4)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              💬 שלח בוואטסאפ עכשיו
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SendCodeModal;
