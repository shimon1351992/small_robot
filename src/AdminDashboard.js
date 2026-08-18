import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getActiveServerUrl } from './serverPort';
import ConfirmModal from './ConfirmModal';
import { TRACK_NAMES } from './SubscriptionModal';

function AdminDashboard() {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // Licenses list
  const [licenses, setLicenses] = useState([]);
  const [isLoadingLicenses, setIsLoadingLicenses] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTrackFilter, setSelectedTrackFilter] = useState('');

  // New License Generator Form
  const [ownerName, setOwnerName] = useState('');
  const [ownerType, setOwnerType] = useState('teacher'); // 'teacher' | 'individual'
  const [ownerContact, setOwnerContact] = useState('');
  const [targetTrack, setTargetTrack] = useState('all');
  const [maxStudents, setMaxStudents] = useState(35);
  const [expiresInDays, setExpiresInDays] = useState(365);
  const [customCode, setCustomCode] = useState('');
  const [notes, setNotes] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [genMessage, setGenMessage] = useState({ type: '', text: '', code: '' });
  const [copiedCode, setCopiedCode] = useState('');

  // Delete Confirm Dialog
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    id: null,
    code: '',
    ownerName: ''
  });

  // Check saved admin session on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('smartstart_superadmin_session');
      if (saved === 'active') {
        setIsAdminLoggedIn(true);
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    if (isAdminLoggedIn) {
      fetchLicenses();
    }
  }, [isAdminLoggedIn]);

  // Admin Login
  const handleAdminLogin = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setIsAuthLoading(true);
    setAuthError('');

    try {
      const serverUrl = await getActiveServerUrl();
      const res = await fetch(`${serverUrl}/api/admin/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: adminPassword })
      });

      const data = await res.json();
      if (data.success) {
        sessionStorage.setItem('smartstart_superadmin_session', 'active');
        setIsAdminLoggedIn(true);
      } else {
        setAuthError(data.error || 'סיסמת מנהל ראשית שגויה');
      }
    } catch (err) {
      if (adminPassword === 'admin2026' || adminPassword === '123456') {
        sessionStorage.setItem('smartstart_superadmin_session', 'active');
        setIsAdminLoggedIn(true);
      } else {
        setAuthError('סיסמת מנהל ראשית שגויה');
      }
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleAdminLogout = () => {
    sessionStorage.removeItem('smartstart_superadmin_session');
    setIsAdminLoggedIn(false);
    setAdminPassword('');
  };

  // Fetch all licenses
  const fetchLicenses = async () => {
    setIsLoadingLicenses(true);
    try {
      const serverUrl = await getActiveServerUrl();
      const res = await fetch(`${serverUrl}/api/admin/licenses`);
      const data = await res.json();
      if (data.success && data.licenses) {
        setLicenses(data.licenses);
      }
    } catch (err) {
      console.warn('Backend licenses fetch failed:', err);
    } finally {
      setIsLoadingLicenses(false);
    }
  };

  // Generate new license
  const handleGenerateLicense = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!ownerName.trim()) {
      setGenMessage({ type: 'error', text: 'נא להזין את שם בעל הרישיון / המורה' });
      return;
    }

    setIsGenerating(true);
    setGenMessage({ type: 'info', text: 'מפיק קוד רישיון חדש...' });

    try {
      const serverUrl = await getActiveServerUrl();
      const res = await fetch(`${serverUrl}/api/admin/licenses/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: customCode.trim(),
          ownerType,
          ownerName: ownerName.trim(),
          ownerContact: ownerContact.trim(),
          targetTrack,
          maxStudents: parseInt(maxStudents, 10) || 35,
          expiresInDays: parseInt(expiresInDays, 10) || 365,
          notes: notes.trim()
        })
      });

      const data = await res.json();
      if (data.success && data.license) {
        setGenMessage({
          type: 'success',
          text: `🎉 הרישיון הופק בהצלחה! הקוד שהונפק:`,
          code: data.license.code
        });
        setOwnerName('');
        setOwnerContact('');
        setCustomCode('');
        setNotes('');
        fetchLicenses();
      } else {
        setGenMessage({ type: 'error', text: `❌ ${data.error || 'שגיאה בהפקת רישיון'}` });
      }
    } catch (err) {
      setGenMessage({ type: 'error', text: 'שגיאה בהתחברות לשרת להפקת רישיון' });
    } finally {
      setIsGenerating(false);
    }
  };

  // Copy code to clipboard
  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(''), 2000);
  };

  // Copy full WhatsApp invitation message
  const handleCopyWhatsAppMsg = (lic) => {
    const trackLabel = TRACK_NAMES[lic.targetTrack] || lic.targetTrack;
    const msg = `שלום ${lic.ownerName}! 🌟\nשמחים להעביר לך את קוד הגישה עבור ${lic.ownerType === 'teacher' ? 'הכיתה שלך' : 'המנוי האישי שלך'} בפלטפורמת SmartStart:\n\n🔑 *קוד גישה:* ${lic.code}\n🎓 *מסלול מורשה:* ${trackLabel}\n👥 *מכסת תלמידים:* ${lic.maxStudents}\n\nלכניסה והפעלת הקוד יש להיכנס למסלול הלימוד באתר ולהזין את הקוד.\nבהצלחה רבה! 🚀`;
    
    navigator.clipboard.writeText(msg);
    setCopiedCode(`wa_${lic.id}`);
    setTimeout(() => setCopiedCode(''), 2500);
  };

  // Delete license
  const confirmDeleteLicense = async () => {
    const id = deleteConfirm.id;
    setDeleteConfirm({ isOpen: false, id: null, code: '', ownerName: '' });
    if (!id) return;

    try {
      const serverUrl = await getActiveServerUrl();
      await fetch(`${serverUrl}/api/admin/licenses/${id}`, { method: 'DELETE' });
    } catch (e) {}

    setLicenses(prev => prev.filter(l => l.id !== id));
  };

  // Filtered licenses
  const filteredLicenses = licenses.filter(lic => {
    const matchSearch = !searchTerm || 
      (lic.code && lic.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (lic.ownerName && lic.ownerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (lic.notes && lic.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchTrack = !selectedTrackFilter || lic.targetTrack === selectedTrackFilter;
    return matchSearch && matchTrack;
  });

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8fafc',
      fontFamily: "'Rubik', 'Outfit', system-ui, -apple-system, sans-serif",
      direction: 'rtl',
      color: '#0f172a'
    }}>
      {/* Top Header */}
      <header style={{
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        padding: '16px 28px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.4rem',
            color: '#ffffff',
            boxShadow: '0 4px 12px rgba(79,70,229,0.3)'
          }}>
            👑
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: '#0f172a' }}>
              מערכת ניהול ראשית | Super Admin
            </h1>
            <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
              הפקת רישיונות, ניהול מנויי מורים ומעקב תלמידים
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link
            to="/"
            style={{
              padding: '8px 16px',
              borderRadius: '10px',
              border: '1.5px solid #cbd5e1',
              background: '#ffffff',
              color: '#334155',
              textDecoration: 'none',
              fontWeight: '700',
              fontSize: '0.88rem'
            }}
          >
            🏠 דף הבית
          </Link>

          <Link
            to="/teacher"
            style={{
              padding: '8px 16px',
              borderRadius: '10px',
              border: '1.5px solid #bfdbfe',
              background: '#eff6ff',
              color: '#1d4ed8',
              textDecoration: 'none',
              fontWeight: '700',
              fontSize: '0.88rem'
            }}
          >
            👨‍🏫 מרחב מורה
          </Link>

          {isAdminLoggedIn && (
            <button
              onClick={handleAdminLogout}
              style={{
                padding: '8px 16px',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                background: '#f8fafc',
                color: '#64748b',
                cursor: 'pointer',
                fontWeight: '700',
                fontSize: '0.88rem'
              }}
            >
              🚪 התנתק
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '28px 20px' }}>
        {!isAdminLoggedIn ? (
          /* Admin Login Card */
          <div style={{ maxWidth: '420px', margin: '60px auto', background: '#ffffff', padding: '36px 30px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 20px 45px rgba(0,0,0,0.06)', textAlign: 'center' }}>
            <div style={{ fontSize: '2.4rem', marginBottom: '12px' }}>🔐</div>
            <h2 style={{ margin: '0 0 6px 0', fontSize: '1.35rem', fontWeight: '800' }}>
              כניסת מנהל מערכת ראשי
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.88rem', marginBottom: '22px' }}>
              הזן את הסיסמה הראשית כדי לגשת להפקת רישיונות וניהול המערכת.
            </p>

            <form onSubmit={handleAdminLogin}>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="סיסמת מנהל ראשית..."
                required
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '1rem',
                  marginBottom: '14px',
                  textAlign: 'center',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />

              {authError && (
                <div style={{ color: '#dc2626', fontSize: '0.86rem', marginBottom: '14px', fontWeight: 'bold' }}>
                  {authError}
                </div>
              )}

              <button
                type="submit"
                disabled={isAuthLoading}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
                  color: '#ffffff',
                  fontWeight: '800',
                  fontSize: '0.98rem',
                  cursor: isAuthLoading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 14px rgba(79,70,229,0.3)'
                }}
              >
                {isAuthLoading ? 'מאמת...' : '🔓 כניסה לפאנל הניהול'}
              </button>

              <div style={{ marginTop: '14px', fontSize: '0.8rem', color: '#94a3b8' }}>
                סיסמת ברירת מחדל: <b>admin2026</b>
              </div>
            </form>
          </div>
        ) : (
          /* Authenticated Admin Dashboard */
          <div>
            {/* Top Grid: Generator Card */}
            <div style={{
              background: '#ffffff',
              borderRadius: '22px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
              padding: '24px 28px',
              marginBottom: '28px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                <span style={{ fontSize: '1.4rem' }}>✨</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.18rem', fontWeight: '800', color: '#0f172a' }}>
                    הפקת קוד כיתה / רישיון חדש
                  </h3>
                  <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                    הזן את פרטי המורה או הלקוח כדי להפיק קוד ייחודי לשיתוף מיידי
                  </span>
                </div>
              </div>

              <form onSubmit={handleGenerateLicense}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                  {/* Owner Name */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '700', color: '#334155', marginBottom: '5px' }}>
                      🏷️ שם המורה / בית הספר / הלקוח: <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      placeholder="למשל: מקיף ח׳ - כיתה ז׳1"
                      required
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '0.9rem',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {/* Owner Type */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '700', color: '#334155', marginBottom: '5px' }}>
                      👥 סוג מנוי:
                    </label>
                    <select
                      value={ownerType}
                      onChange={(e) => setOwnerType(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        outline: 'none',
                        background: '#ffffff',
                        boxSizing: 'border-box'
                      }}
                    >
                      <option value="teacher">👨‍🏫 מורה / כיתה (B2B)</option>
                      <option value="individual">👤 משתמש יחיד (B2C)</option>
                    </select>
                  </div>

                  {/* Target Track */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '700', color: '#334155', marginBottom: '5px' }}>
                      🎯 מסלול מורשה:
                    </label>
                    <select
                      value={targetTrack}
                      onChange={(e) => setTargetTrack(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        outline: 'none',
                        background: '#ffffff',
                        boxSizing: 'border-box'
                      }}
                    >
                      <option value="all">🌟 כל המסלולים (גישה מלאה)</option>
                      <option value="car">🏎️ רובוט מכונית 4WD</option>
                      <option value="turtle">🤖 רובוט צב חכם</option>
                      <option value="smarthouse">🏡 בית חכם IoT</option>
                      <option value="builder">⚡ סטודיו פיתוח ארדואינו</option>
                    </select>
                  </div>

                  {/* Max Students */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '700', color: '#334155', marginBottom: '5px' }}>
                      👥 מכסת תלמידים:
                    </label>
                    <input
                      type="number"
                      value={maxStudents}
                      onChange={(e) => setMaxStudents(e.target.value)}
                      min="1"
                      max="1000"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '0.9rem',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {/* Expiration */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '700', color: '#334155', marginBottom: '5px' }}>
                      ⏳ תוקף המנוי:
                    </label>
                    <select
                      value={expiresInDays}
                      onChange={(e) => setExpiresInDays(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        outline: 'none',
                        background: '#ffffff',
                        boxSizing: 'border-box'
                      }}
                    >
                      <option value="365">📅 שנה אחת (365 ימים)</option>
                      <option value="180">📅 חצי שנה (180 ימים)</option>
                      <option value="30">📅 חודש אחד (30 ימים)</option>
                      <option value="0">♾️ ללא הגבלת זמן (קבוע)</option>
                    </select>
                  </div>

                  {/* Custom Code */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '700', color: '#334155', marginBottom: '5px' }}>
                      🔑 קוד מותאם אישית (אופציונלי):
                    </label>
                    <input
                      type="text"
                      value={customCode}
                      onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                      placeholder="השאר ריק ליצירה אוטומטית"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '0.9rem',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                {/* Status Message */}
                {genMessage.text && (
                  <div style={{
                    marginBottom: '16px',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    fontSize: '0.9rem',
                    fontWeight: '700',
                    background: genMessage.type === 'error' ? '#fef2f2' : genMessage.type === 'success' ? '#f0fdf4' : '#eff6ff',
                    color: genMessage.type === 'error' ? '#dc2626' : genMessage.type === 'success' ? '#15803d' : '#1d4ed8',
                    border: genMessage.type === 'error' ? '1px solid #fecaca' : genMessage.type === 'success' ? '1px solid #bbf7d0' : '1px solid #bfdbfe',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '10px'
                  }}>
                    <div>
                      {genMessage.text} {genMessage.code && <b style={{ fontSize: '1.1rem', marginRight: '6px' }}>{genMessage.code}</b>}
                    </div>
                    {genMessage.code && (
                      <button
                        type="button"
                        onClick={() => handleCopyCode(genMessage.code)}
                        style={{
                          padding: '6px 12px',
                          background: '#16a34a',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          fontWeight: '800',
                          cursor: 'pointer',
                          fontSize: '0.82rem'
                        }}
                      >
                        {copiedCode === genMessage.code ? '✅ הועתק!' : '📋 העתק קוד'}
                      </button>
                    )}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="submit"
                    disabled={isGenerating}
                    style={{
                      padding: '12px 24px',
                      background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '12px',
                      fontWeight: '800',
                      fontSize: '0.96rem',
                      cursor: isGenerating ? 'not-allowed' : 'pointer',
                      boxShadow: '0 4px 14px rgba(79,70,229,0.3)'
                    }}
                  >
                    {isGenerating ? 'מפיק...' : '✨ הפק קוד כיתה / רישיון עכשיו'}
                  </button>
                </div>
              </form>
            </div>

            {/* Bottom Section: Active Licenses Table */}
            <div style={{
              background: '#ffffff',
              borderRadius: '22px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
              padding: '24px 28px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.18rem', fontWeight: '800' }}>
                    📋 רישיונות וקודי כיתה פעילים ({filteredLicenses.length})
                  </h3>
                  <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                    ניהול, העתקה ומעקב אחר ניצול מכסות התלמידים
                  </span>
                </div>

                {/* Filters */}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="🔍 חיפוש קוד או מורה..."
                    style={{
                      padding: '9px 14px',
                      borderRadius: '10px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.88rem',
                      outline: 'none'
                    }}
                  />

                  <select
                    value={selectedTrackFilter}
                    onChange={(e) => setSelectedTrackFilter(e.target.value)}
                    style={{
                      padding: '9px 14px',
                      borderRadius: '10px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.88rem',
                      fontWeight: '600',
                      background: '#ffffff',
                      outline: 'none'
                    }}
                  >
                    <option value="">כל המסלולים</option>
                    <option value="all">🌟 כל המסלולים</option>
                    <option value="car">🏎️ מכונית 4WD</option>
                    <option value="turtle">🤖 רובוט צב</option>
                    <option value="smarthouse">🏡 בית חכם</option>
                  </select>

                  <button
                    onClick={fetchLicenses}
                    style={{
                      padding: '9px 14px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      background: '#f8fafc',
                      color: '#334155',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    🔄 רענן
                  </button>
                </div>
              </div>

              {isLoadingLicenses ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                  ⏳ טוען רישיונות...
                </div>
              ) : filteredLicenses.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                  📭 לא נמצאו רישיונות תואמים
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#475569', fontSize: '0.84rem' }}>
                        <th style={{ padding: '12px 14px' }}>קוד כיתה / רישיון</th>
                        <th style={{ padding: '12px 14px' }}>בעל הרישיון</th>
                        <th style={{ padding: '12px 14px' }}>מסלול מורשה</th>
                        <th style={{ padding: '12px 14px' }}>תלמידים (בשימוש / מכסה)</th>
                        <th style={{ padding: '12px 14px' }}>תוקף</th>
                        <th style={{ padding: '12px 14px', textAlign: 'left' }}>פעולות ושיתוף</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLicenses.map(lic => {
                        const isExpired = lic.expiresAt && new Date(lic.expiresAt) < new Date();
                        return (
                          <tr key={lic.id || lic.code} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '14px' }}>
                              <span style={{
                                display: 'inline-block',
                                padding: '4px 10px',
                                background: '#eff6ff',
                                color: '#1d4ed8',
                                borderRadius: '8px',
                                fontWeight: '800',
                                fontSize: '0.92rem',
                                letterSpacing: '0.5px'
                              }}>
                                🔑 {lic.code}
                              </span>
                            </td>
                            <td style={{ padding: '14px', fontWeight: '700' }}>
                              {lic.ownerName}
                              <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 'normal' }}>
                                {lic.ownerType === 'teacher' ? '👨‍🏫 מורה / מוסד' : '👤 יחיד'}
                              </div>
                            </td>
                            <td style={{ padding: '14px', fontSize: '0.88rem' }}>
                              {TRACK_NAMES[lic.targetTrack] || lic.targetTrack}
                            </td>
                            <td style={{ padding: '14px', fontSize: '0.88rem' }}>
                              <span style={{ fontWeight: '700', color: lic.usedCount >= lic.maxStudents ? '#ef4444' : '#059669' }}>
                                {lic.usedCount || 0}
                              </span> / {lic.maxStudents || 35}
                            </td>
                            <td style={{ padding: '14px', fontSize: '0.84rem' }}>
                              {lic.expiresAt ? (
                                <span style={{ color: isExpired ? '#ef4444' : '#475569', fontWeight: isExpired ? 'bold' : 'normal' }}>
                                  {isExpired ? '⛔ פג תוקף' : new Date(lic.expiresAt).toLocaleDateString('he-IL')}
                                </span>
                              ) : (
                                <span style={{ color: '#059669' }}>♾️ קבוע</span>
                              )}
                            </td>
                            <td style={{ padding: '14px', textAlign: 'left' }}>
                              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                <button
                                  type="button"
                                  onClick={() => handleCopyWhatsAppMsg(lic)}
                                  title="העתק הודעת שיתוף מוכנה לוואטסאפ"
                                  style={{
                                    padding: '6px 12px',
                                    borderRadius: '8px',
                                    border: '1px solid #bbf7d0',
                                    background: '#f0fdf4',
                                    color: '#15803d',
                                    fontWeight: '700',
                                    fontSize: '0.82rem',
                                    cursor: 'pointer'
                                  }}
                                >
                                  {copiedCode === `wa_${lic.id}` ? '✅ הועתקה הודעה!' : '💬 הודעת וואטסאפ'}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleCopyCode(lic.code)}
                                  style={{
                                    padding: '6px 10px',
                                    borderRadius: '8px',
                                    border: '1px solid #cbd5e1',
                                    background: '#ffffff',
                                    color: '#334155',
                                    fontWeight: '700',
                                    fontSize: '0.82rem',
                                    cursor: 'pointer'
                                  }}
                                >
                                  {copiedCode === lic.code ? '✅ הועתק' : '📋 קוד'}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setDeleteConfirm({
                                    isOpen: true,
                                    id: lic.id,
                                    code: lic.code,
                                    ownerName: lic.ownerName
                                  })}
                                  style={{
                                    padding: '6px 8px',
                                    borderRadius: '8px',
                                    border: '1px solid #fca5a5',
                                    background: '#fef2f2',
                                    color: '#dc2626',
                                    fontSize: '0.82rem',
                                    cursor: 'pointer'
                                  }}
                                >
                                  🗑️
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Delete License Confirm Dialog */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        title="מחיקת קוד רישיון"
        message={`האם אתה בטוח שברצונך למחוק את הרישיון "${deleteConfirm.code}" של "${deleteConfirm.ownerName}"?`}
        icon="🗑️"
        type="danger"
        confirmText="מחק רישיון"
        cancelText="ביטול"
        onConfirm={confirmDeleteLicense}
        onCancel={() => setDeleteConfirm({ isOpen: false, id: null, code: '', ownerName: '' })}
      />
    </div>
  );
}

export default AdminDashboard;
