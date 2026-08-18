import React, { useState } from 'react';
import { getActiveServerUrl } from './serverPort';

export const TRACK_NAMES = {
  car: '🏎️ רובוט מכונית 4WD',
  turtle: '🤖 רובוט צב חכם',
  smarthouse: '🏡 בית חכם IoT',
  builder: '⚡ סטודיו פיתוח ארדואינו',
  all: '🌟 גישה מלאה לכל המסלולים'
};

/**
 * Check if the user has an active license for a track
 */
export function isTrackUnlocked(trackType = 'car') {
  try {
    const raw = localStorage.getItem('smartstart_active_licenses');
    if (!raw) return false;
    const licenses = JSON.parse(raw);
    if (!Array.isArray(licenses)) return false;

    return licenses.some(lic => {
      if (!lic) return false;
      if (lic.expiresAt && new Date(lic.expiresAt) < new Date()) return false;
      return lic.targetTrack === 'all' || lic.targetTrack === trackType;
    });
  } catch (e) {
    return false;
  }
}

/**
 * Save an active license locally
 */
export function saveActiveLicense(license) {
  try {
    const raw = localStorage.getItem('smartstart_active_licenses');
    let list = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(list)) list = [];
    list = list.filter(l => l.code !== license.code);
    list.unshift(license);
    localStorage.setItem('smartstart_active_licenses', JSON.stringify(list));
  } catch (e) {}
}

function SubscriptionModal({
  isOpen,
  onClose,
  projectType = 'car',
  lessonTitle = '',
  onUnlockSuccess
}) {
  const [activeTab, setActiveTab] = useState('code'); // 'code' | 'buy'
  const [code, setCode] = useState('');
  const [studentName, setStudentName] = useState(() => {
    try { return localStorage.getItem('smartstart_saved_student_name') || ''; } catch (e) { return ''; }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });
  const [unlockedSuccess, setUnlockedSuccess] = useState(false);

  if (!isOpen) return null;

  const trackTitle = TRACK_NAMES[projectType] || 'מסלול למידה';

  const handleValidateCode = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      setStatusMsg({ type: 'error', text: '❌ נא להזין קוד כיתה או קוד רישיון' });
      return;
    }

    setIsLoading(true);
    setStatusMsg({ type: 'info', text: '⏳ בודק תקינות קוד רישיון במערכת...' });

    try {
      const serverUrl = await getActiveServerUrl();
      const res = await fetch(`${serverUrl}/api/licenses/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: cleanCode,
          studentName: studentName.trim(),
          projectType
        })
      });

      const data = await res.json();
      if (data.success && data.license) {
        saveActiveLicense(data.license);
        if (studentName.trim()) {
          try { localStorage.setItem('smartstart_saved_student_name', studentName.trim()); } catch (e) {}
        }
        setUnlockedSuccess(true);
        setStatusMsg({
          type: 'success',
          text: `🎉 אימות הצליח! נפתחה גישה מלאה ל${TRACK_NAMES[data.license.targetTrack] || 'מסלול'}`
        });

        setTimeout(() => {
          if (onUnlockSuccess) onUnlockSuccess(data.license);
          onClose();
        }, 1400);
      } else {
        setStatusMsg({ type: 'error', text: `❌ ${data.error || 'קוד רישיון שגוי או שאינו בתוקף'}` });
      }
    } catch (err) {
      // Local demo fallback check
      if (cleanCode === 'DEMO-ALL-2026' || cleanCode === 'CAR-PRO-2026' || cleanCode.startsWith('SMART-')) {
        const demoLic = {
          code: cleanCode,
          ownerName: 'רישיון מקומי',
          targetTrack: cleanCode === 'CAR-PRO-2026' ? 'car' : 'all',
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        };
        saveActiveLicense(demoLic);
        setUnlockedSuccess(true);
        setStatusMsg({ type: 'success', text: '🎉 הרישיון אומת בהצלחה!' });
        setTimeout(() => {
          if (onUnlockSuccess) onUnlockSuccess(demoLic);
          onClose();
        }, 1200);
      } else {
        setStatusMsg({ type: 'error', text: '❌ לא ניתן לאמת את הקוד. אנא ודא שהשרת פעיל ושהקוד מדויק.' });
      }
    } finally {
      setIsLoading(false);
    }
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
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999999,
        backdropFilter: 'blur(8px)',
        direction: 'rtl',
        padding: '16px'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '540px',
          background: '#ffffff',
          borderRadius: '26px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 25px 60px rgba(0,0,0,0.22)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: "'Rubik', 'Outfit', system-ui, -apple-system, sans-serif"
        }}
      >
        {/* Header Banner */}
        <div style={{
          padding: '24px 26px 18px 26px',
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          color: '#ffffff',
          position: 'relative'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.6rem',
                boxShadow: '0 4px 14px rgba(37,99,235,0.4)'
              }}>
                🔒
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0, color: '#f8fafc' }}>
                  פתיחת גישה מלאה למסלול
                </h3>
                <div style={{ fontSize: '0.86rem', color: '#94a3b8', marginTop: '3px' }}>
                  {trackTitle} {lessonTitle ? `• ${lessonTitle}` : ''}
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.12)',
                border: 'none',
                color: '#cbd5e1',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '0.9rem'
              }}
            >
              ✕
            </button>
          </div>

          {/* Navigation Tabs */}
          <div style={{
            display: 'flex',
            marginTop: '18px',
            background: 'rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '4px',
            gap: '4px'
          }}>
            <button
              type="button"
              onClick={() => { setActiveTab('code'); setStatusMsg({ type: '', text: '' }); }}
              style={{
                flex: 1,
                padding: '9px 12px',
                borderRadius: '9px',
                border: 'none',
                background: activeTab === 'code' ? '#ffffff' : 'transparent',
                color: activeTab === 'code' ? '#0f172a' : '#cbd5e1',
                fontWeight: '800',
                fontSize: '0.88rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              🔑 יש לי קוד כיתה / רישיון
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('buy'); setStatusMsg({ type: '', text: '' }); }}
              style={{
                flex: 1,
                padding: '9px 12px',
                borderRadius: '9px',
                border: 'none',
                background: activeTab === 'buy' ? '#ffffff' : 'transparent',
                color: activeTab === 'buy' ? '#0f172a' : '#cbd5e1',
                fontWeight: '800',
                fontSize: '0.88rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              🛒 רכישת מנוי / פרטים למורים
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px 26px' }}>
          {activeTab === 'code' ? (
            /* Tab 1: Enter License / Class Code */
            <form onSubmit={handleValidateCode}>
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '14px',
                padding: '14px 16px',
                marginBottom: '18px',
                fontSize: '0.88rem',
                color: '#475569',
                lineHeight: 1.5
              }}>
                💡 <b>קיבלת קוד מהמורה או רכשת רישיון?</b> הזן את הקוד למטה לפתיחת כל השיעורים, הסימולטור וסביבת הצריבה לרובוט.
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  🔑 קוד כיתה או קוד רישיון: <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="למשל: CAR-PRO-2026 או SMART-1234"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: '2px solid #cbd5e1',
                    fontSize: '1.05rem',
                    fontWeight: '800',
                    textAlign: 'center',
                    letterSpacing: '1.5px',
                    color: '#1e293b',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  👤 שם התלמיד / משתמש (אופציונלי):
                </label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="שם מלא..."
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.92rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Status feedback */}
              {statusMsg.text && (
                <div style={{
                  marginBottom: '16px',
                  padding: '11px 14px',
                  borderRadius: '12px',
                  fontSize: '0.88rem',
                  fontWeight: '700',
                  background: statusMsg.type === 'error' ? '#fef2f2' : statusMsg.type === 'success' ? '#f0fdf4' : '#eff6ff',
                  color: statusMsg.type === 'error' ? '#dc2626' : statusMsg.type === 'success' ? '#15803d' : '#1d4ed8',
                  border: statusMsg.type === 'error' ? '1px solid #fecaca' : statusMsg.type === 'success' ? '1px solid #bbf7d0' : '1px solid #bfdbfe'
                }}>
                  {statusMsg.text}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || unlockedSuccess}
                style={{
                  width: '100%',
                  padding: '13px',
                  borderRadius: '14px',
                  border: 'none',
                  background: unlockedSuccess 
                    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                    : 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
                  color: '#ffffff',
                  fontWeight: '800',
                  fontSize: '1rem',
                  cursor: (isLoading || unlockedSuccess) ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 15px rgba(37,99,235,0.3)',
                  transition: 'all 0.2s'
                }}
              >
                {isLoading ? 'מאמת קוד...' : unlockedSuccess ? '✅ הגישה פתוחה!' : '🔓 הפעל גישה למסלול'}
              </button>
            </form>
          ) : (
            /* Tab 2: Pricing & Contact for Teachers */
            <div>
              <div style={{
                background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
                border: '1.5px solid #bbf7d0',
                borderRadius: '16px',
                padding: '16px 18px',
                marginBottom: '18px'
              }}>
                <div style={{ fontSize: '1rem', fontWeight: '800', color: '#166534', marginBottom: '6px' }}>
                  🌟 מה כולל המנוי המלא למסלול?
                </div>
                <ul style={{ margin: 0, paddingRight: '20px', fontSize: '0.88rem', color: '#15803d', lineHeight: 1.6 }}>
                  <li>גישה מלאה לכל עשרות שיעורי הבנייה והתכנות.</li>
                  <li>סימולטור תלת-ממד אינטראקטיבי בזמן אמת.</li>
                  <li>סביבת צריבה ישירה לרובוט (ESP32 / SuperBot).</li>
                  <li>הגשת עבודות ישירה למורה ובדיקת קוד.</li>
                </ul>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <a
                  href={`https://wa.me/972500000000?text=${encodeURIComponent(`שלום, אני מעוניין ברכישת מנוי / קוד כיתה למסלול ${trackTitle} באתר SmartStart`)}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '12px',
                    background: '#22c55e',
                    color: '#ffffff',
                    textDecoration: 'none',
                    borderRadius: '12px',
                    fontWeight: '800',
                    fontSize: '0.94rem',
                    boxShadow: '0 3px 12px rgba(34,197,94,0.3)'
                  }}
                >
                  💬 פנייה מהירה בוואטסאפ לרכישה והצעת מחיר
                </a>

                <button
                  type="button"
                  onClick={() => setActiveTab('code')}
                  style={{
                    padding: '11px',
                    background: '#f8fafc',
                    color: '#475569',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: '12px',
                    fontWeight: '700',
                    fontSize: '0.9rem',
                    cursor: 'pointer'
                  }}
                >
                  חזרה להזנת קוד רישיון
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SubscriptionModal;
