import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getActiveServerUrl } from './serverPort';
import ConfirmModal from './ConfirmModal';
import './TeacherDashboard.css';

function TeacherDashboard() {
  const [currentTeacher, setCurrentTeacher] = useState(null);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  
  // Login form
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regEmail, setRegEmail] = useState('');

  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // Submissions data
  const [submissions, setSubmissions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDbConnected, setIsDbConnected] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProjectType, setSelectedProjectType] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Classes management state
  const [classesList, setClassesList] = useState([]);
  const [showClassModal, setShowClassModal] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassTracks, setNewClassTracks] = useState(['car']);
  const [newClassCode, setNewClassCode] = useState('');
  const [copiedCodeId, setCopiedCodeId] = useState(null);
  const [classModalLoading, setClassModalLoading] = useState(false);
  const [classModalMsg, setClassModalMsg] = useState({ type: '', text: '' });

  // Code modal state
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [copied, setCopied] = useState(false);

  // System Confirm Modal state
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    icon: '🗑️',
    type: 'danger',
    confirmText: 'אישור מחיקה',
    cancelText: 'ביטול',
    onConfirm: null
  });

  const [availableCustomTracks, setAvailableCustomTracks] = useState([]);

  // Check saved teacher session on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('smartstart_teacher_user');
      if (saved) {
        setCurrentTeacher(JSON.parse(saved));
      }
    } catch (e) {}
    fetchClasses();
    fetchCustomTracks();
  }, []);

  const fetchCustomTracks = async () => {
    try {
      const res = await fetch('/api/custom-tracks');
      const data = await res.json();
      if (data.success && Array.isArray(data.tracks)) {
        setAvailableCustomTracks(data.tracks);
      }
    } catch (e) {}
  };

  // Fetch submissions whenever logged in teacher or filters change
  useEffect(() => {
    if (currentTeacher) {
      fetchSubmissions();
    }
  }, [currentTeacher, searchTerm, selectedProjectType, selectedClass, selectedStatus]);

  // Load classes from server
  const fetchClasses = async () => {
    try {
      const serverUrl = await getActiveServerUrl();
      const res = await fetch(`${serverUrl}/api/classes`);
      const data = await res.json();
      if (data.success && data.classes) {
        setClassesList(data.classes);
      }
    } catch (err) {
      console.warn('Backend classes fetch failed, using fallback:', err);
    }
  };

  // Create new class with tracks and classCode
  const handleCreateClass = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!newClassName.trim()) {
      setClassModalMsg({ type: 'error', text: '❌ אנא הזן שם כיתה' });
      return;
    }
    if (newClassTracks.length === 0) {
      setClassModalMsg({ type: 'error', text: '❌ נא לבחור לפחות מסלול לימוד אחד לכיתה' });
      return;
    }

    setClassModalLoading(true);
    setClassModalMsg({ type: 'info', text: '⏳ פותח כיתה חדשה ומפיק קוד...' });

    try {
      const serverUrl = await getActiveServerUrl();
      const res = await fetch(`${serverUrl}/api/classes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          className: newClassName.trim(),
          createdTeacher: currentTeacher ? currentTeacher.fullName : 'מורה',
          classCode: newClassCode.trim().toUpperCase(),
          assignedTracks: newClassTracks
        })
      });

      const data = await res.json();
      if (data.success) {
        const generated = data.classItem ? (data.classItem.classCode || '') : '';
        setClassModalMsg({ 
          type: 'success', 
          text: `🎉 הכיתה "${newClassName.trim()}" נפתחה בהצלחה! קוד הכיתה שהופק: ${generated}` 
        });
        setNewClassName('');
        setNewClassCode('');
        fetchClasses();
      } else {
        setClassModalMsg({ type: 'error', text: `❌ ${data.error || 'שגיאה ביצירת כיתה'}` });
      }
    } catch (err) {
      // Local fallback
      const generated = newClassCode.trim().toUpperCase() || `CLS-${Math.floor(1000 + Math.random() * 9000)}`;
      const newCls = { 
        id: Date.now(), 
        className: newClassName.trim(),
        classCode: generated,
        assignedTracks: newClassTracks,
        createdTeacher: currentTeacher ? currentTeacher.fullName : 'מורה'
      };
      setClassesList(prev => [...prev, newCls]);
      setClassModalMsg({ type: 'success', text: `🎉 הכיתה נפתחה! קוד כיתה: ${generated}` });
      setNewClassName('');
      setNewClassCode('');
    } finally {
      setClassModalLoading(false);
    }
  };

  // Copy WhatsApp Invite
  const handleCopyClassWhatsApp = (cls) => {
    const code = cls.classCode || 'SMART-2026';
    const siteUrl = window.location.origin;
    const tracksNames = (cls.assignedTracks || ['car']).map(t => {
      if (t === 'car') return '🏎️ רובוט מכונית 4WD';
      if (t === 'turtle') return '🤖 רובוט צב חכם';
      if (t === 'house') return '🏡 בית חכם IoT';
      if (t === 'custom') return '✨ מסלול מותאם אישית';
      return t;
    }).join(', ');

    const msg = `שלום לכל תלמידי כיתה *${cls.className}*! 🚀\n\nמצורף קישור ישיר לשיעורי הרובוטיקה והתכנות:\n👉 ${siteUrl}\n\n📌 *איך נכנסים:*\n1. בעמוד הראשי בוחרים בלשונית *"🎓 כניסת תלמיד"*\n2. מזינים את קוד הכיתה: *${code}*\n3. מזינים את השם המלא שלכם\n\n📚 *המסלול שנבחר עבורכם:* ${tracksNames}\nבהצלחה לכולם! ✨`;
    navigator.clipboard.writeText(msg);
    setCopiedCodeId(`wa-${cls.id || cls.className}`);
    setTimeout(() => setCopiedCodeId(null), 3000);
  };

  // Copy code directly
  const handleCopySingleCode = (code, id) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(`code-${id}`);
    setTimeout(() => setCopiedCodeId(null), 2500);
  };

  // Delete class
  const handleDeleteClass = (id, className) => {
    setConfirmDialog({
      isOpen: true,
      title: 'מחיקת כיתה מהמערכת',
      message: `האם אתה בטוח שברצונך למחוק את "${className}" מהמערכת?`,
      icon: '🏫',
      type: 'danger',
      confirmText: 'מחק כיתה',
      cancelText: 'ביטול',
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        try {
          const serverUrl = await getActiveServerUrl();
          await fetch(`${serverUrl}/api/classes/${id}`, { method: 'DELETE' });
        } catch (err) {}

        setClassesList(prev => prev.filter(c => c.id != id));
        if (selectedClass === className) setSelectedClass('');
      }
    });
  };

  // Login handler (Username + Password)
  const handleLogin = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setIsAuthLoading(true);
    setAuthError('');
    setAuthSuccess('');

    try {
      const serverUrl = await getActiveServerUrl();
      const res = await fetch(`${serverUrl}/api/teachers/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: loginUsername.trim(),
          password: loginPassword
        })
      });

      const data = await res.json();
      if (data.success && data.teacher) {
        sessionStorage.setItem('smartstart_teacher_user', JSON.stringify(data.teacher));
        setCurrentTeacher(data.teacher);
      } else {
        setAuthError(data.error || 'שם משתמש או סיסמה שגויים');
      }
    } catch (err) {
      // Local fallback login for default demo teacher
      if ((loginUsername.toLowerCase() === 'shimon' || loginUsername === 'המורה שמעון') && (loginPassword === '123' || loginPassword === '123456' || loginPassword === 'teacher2026')) {
        const teacher = { id: 1, fullName: 'המורה שמעון', username: 'shimon' };
        sessionStorage.setItem('smartstart_teacher_user', JSON.stringify(teacher));
        setCurrentTeacher(teacher);
      } else {
        setAuthError('שם משתמש או סיסמה שגויים. אנא נסה שוב.');
      }
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Register handler
  const handleRegister = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setIsAuthLoading(true);
    setAuthError('');
    setAuthSuccess('');

    if (!regFullName.trim() || !regUsername.trim() || !regPassword) {
      setAuthError('אנא מלא את כל שדות החובה');
      setIsAuthLoading(false);
      return;
    }

    try {
      const serverUrl = await getActiveServerUrl();
      const res = await fetch(`${serverUrl}/api/teachers/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: regFullName.trim(),
          username: regUsername.trim(),
          password: regPassword,
          email: regEmail.trim()
        })
      });

      const data = await res.json();
      if (data.success && data.teacher) {
        sessionStorage.setItem('smartstart_teacher_user', JSON.stringify(data.teacher));
        setCurrentTeacher(data.teacher);
      } else {
        setAuthError(data.error || 'שגיאה ברישום מורה חדש');
      }
    } catch (err) {
      // Local registration fallback
      const teacher = {
        id: Date.now(),
        fullName: regFullName.trim(),
        username: regUsername.trim().toLowerCase()
      };
      sessionStorage.setItem('smartstart_teacher_user', JSON.stringify(teacher));
      setCurrentTeacher(teacher);
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Logout handler
  const handleLogout = () => {
    sessionStorage.removeItem('smartstart_teacher_user');
    setCurrentTeacher(null);
    setLoginUsername('');
    setLoginPassword('');
  };

  // Fetch only this teacher's submissions
  const fetchSubmissions = async () => {
    if (!currentTeacher) return;
    setIsLoading(true);
    let serverList = [];
    let dbStatus = false;

    const teacherName = currentTeacher.fullName;

    let fetchSucceeded = false;

    try {
      const serverUrl = await getActiveServerUrl();
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (teacherName) params.append('teacherName', teacherName);
      if (selectedClass) params.append('className', selectedClass);
      if (selectedProjectType) params.append('projectType', selectedProjectType);
      if (selectedStatus) params.append('status', selectedStatus);

      const res = await fetch(`${serverUrl}/api/teacher/submissions?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        serverList = data.submissions || [];
        dbStatus = !!data.isDbConnected;
        fetchSucceeded = true;
        // Clean old localStorage duplicates since server is active
        try { localStorage.removeItem('smartstart_browser_submissions'); } catch (e) {}
      }
    } catch (err) {
      console.warn('Backend submissions fetch failed, checking local browser storage:', err);
    }

    if (fetchSucceeded) {
      setSubmissions(serverList);
      setIsDbConnected(dbStatus);
      setIsLoading(false);
      return;
    }

    // Fallback only if server is completely offline
    try {
      const localList = JSON.parse(localStorage.getItem('smartstart_browser_submissions') || '[]');
      let filtered = localList.filter(item => !item.teacherName || item.teacherName === teacherName || item.teacherName === 'כללי');

      if (selectedClass) {
        filtered = filtered.filter(item => item.className === selectedClass);
      }

      if (searchTerm) {
        const s = searchTerm.toLowerCase();
        filtered = filtered.filter(item => 
          (item.studentName && item.studentName.toLowerCase().includes(s)) ||
          (item.projectName && item.projectName.toLowerCase().includes(s)) ||
          (item.className && item.className.toLowerCase().includes(s)) ||
          (item.notes && item.notes.toLowerCase().includes(s))
        );
      }
      if (selectedProjectType) {
        filtered = filtered.filter(item => item.projectType === selectedProjectType);
      }
      if (selectedStatus) {
        filtered = filtered.filter(item => item.status === selectedStatus);
      }

      setSubmissions(filtered);
      setIsDbConnected(false);
    } catch (e) {
      setSubmissions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Download .ino file
  const handleDownloadIno = (sub) => {
    const blob = new Blob([sub.code || ''], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeName = (sub.studentName || 'student').replace(/\s+/g, '_');
    const safeProject = (sub.projectName || 'robot').replace(/\s+/g, '_');
    link.download = `${safeName}_${safeProject}.ino`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Download .xml (Blockly) file
  const handleDownloadXml = (sub) => {
    if (!sub.blockXml) return;
    const blob = new Blob([sub.blockXml], { type: 'application/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeName = (sub.studentName || 'student').replace(/\s+/g, '_');
    link.download = `${safeName}_blocks.xml`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Toggle status
  const handleToggleStatus = async (sub) => {
    const nextStatus = sub.status === 'reviewed' ? 'new' : 'reviewed';
    try {
      const serverUrl = await getActiveServerUrl();
      await fetch(`${serverUrl}/api/teacher/submissions/${sub.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
    } catch (e) {}

    setSubmissions(prev => prev.map(s => s.id === sub.id ? { ...s, status: nextStatus } : s));
    try {
      const localList = JSON.parse(localStorage.getItem('smartstart_browser_submissions') || '[]');
      const updatedLocal = localList.map(s => s.id === sub.id ? { ...s, status: nextStatus } : s);
      localStorage.setItem('smartstart_browser_submissions', JSON.stringify(updatedLocal));
    } catch (e) {}
  };

  // Delete submission
  const handleDelete = (id) => {
    setConfirmDialog({
      isOpen: true,
      title: 'מחיקת הגשת תלמיד',
      message: 'האם אתה בטוח שברצונך למחוק הגשה זו? הפעולה תסיר את הקובץ וההגשה לצמיתות.',
      icon: '🗑️',
      type: 'danger',
      confirmText: 'מחק הגשה',
      cancelText: 'ביטול',
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        try {
          const serverUrl = await getActiveServerUrl();
          await fetch(`${serverUrl}/api/teacher/submissions/${id}`, {
            method: 'DELETE'
          });
        } catch (e) {}

        setSubmissions(prev => prev.filter(s => s.id !== id));
        try {
          const localList = JSON.parse(localStorage.getItem('smartstart_browser_submissions') || '[]');
          const updatedLocal = localList.filter(s => s.id !== id);
          localStorage.setItem('smartstart_browser_submissions', JSON.stringify(updatedLocal));
        } catch (e) {}
      }
    });
  };

  // Copy code in modal
  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Format date
  const formatDate = (isoString) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('he-IL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return isoString;
    }
  };

  return (
    <div className="teacher-container">
      {/* Header (Light Theme) */}
      <header className="teacher-header">
        <div className="teacher-brand">
          <Link to="/" className="teacher-logo-badge">
            👨‍🏫
          </Link>
          <div className="teacher-title-wrap">
            <h1>
              {currentTeacher ? `האזור האישי של ${currentTeacher.fullName}` : 'מרחב מורה | כניסה והרשמה'}
            </h1>
            <span>
              {currentTeacher ? 'הגשות התלמידים שנשלחו אליך, בדיקת קוד והורדת קבצים' : 'התחבר או הירשם כדי לנהל את הגשות התלמידים שלך'}
            </span>
          </div>
        </div>

        <div className="teacher-header-actions">
          {currentTeacher && (
            <div className="db-status-badge" title={isDbConnected ? 'מחובר ל-SQL Server' : 'מערכת פעילה'}>
              <span className="db-status-dot"></span>
              {isDbConnected ? 'SQL Server מחובר' : 'מערכת הגשות פעילה'}
            </div>
          )}

          {currentTeacher && (
            <button 
              type="button" 
              onClick={() => { setShowClassModal(true); setClassModalMsg({ type: '', text: '' }); }} 
              className="teacher-nav-link" 
              style={{ cursor: 'pointer', background: '#eff6ff', color: '#1d4ed8', borderColor: '#bfdbfe', fontWeight: 'bold' }}
            >
              🏫 ניהול ופתיחת כיתות ({classesList.length})
            </button>
          )}

          <Link to="/tracks" className="teacher-nav-link">
            🏠 חזרה לדף הבית
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="teacher-content">
        {!currentTeacher ? (
          /* Login / Register Card */
          <div className="teacher-login-wrap">
            <div className="teacher-login-card">
              <div className="teacher-login-icon">👨‍🏫</div>
              <h2 style={{ margin: '0 0 6px 0', fontSize: '1.4rem', color: '#0f172a' }}>
                {authMode === 'login' ? 'כניסת מורה' : 'הרשמת מורה חדש'}
              </h2>
              <p style={{ color: '#64748b', fontSize: '0.88rem', marginBottom: '20px' }}>
                {authMode === 'login' 
                  ? 'הזן שם משתמש וסיסמה כדי להיכנס לאזור האישי שלך.' 
                  : 'מלא את הפרטים הבאים כדי להירשם כמורה במערכת.'}
              </p>

              {/* Toggle Mode Buttons */}
              <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '12px', padding: '4px', marginBottom: '20px' }}>
                <button
                  type="button"
                  onClick={() => { setAuthMode('login'); setAuthError(''); }}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '10px',
                    border: 'none',
                    background: authMode === 'login' ? '#ffffff' : 'transparent',
                    color: authMode === 'login' ? '#0f172a' : '#64748b',
                    fontWeight: '800',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    boxShadow: authMode === 'login' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none'
                  }}
                >
                  התחברות
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthMode('register'); setAuthError(''); }}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '10px',
                    border: 'none',
                    background: authMode === 'register' ? '#ffffff' : 'transparent',
                    color: authMode === 'register' ? '#0f172a' : '#64748b',
                    fontWeight: '800',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    boxShadow: authMode === 'register' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none'
                  }}
                >
                  הרשמת מורה חדש
                </button>
              </div>

              {authMode === 'login' ? (
                /* Login Form */
                <form onSubmit={handleLogin}>
                  <div style={{ marginBottom: '14px', textAlign: 'right' }}>
                    <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>
                      👤 שם משתמש:
                    </label>
                    <input
                      type="text"
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      placeholder="למשל: shimon"
                      autoFocus
                      required
                      className="teacher-login-input"
                      style={{ textAlign: 'right' }}
                    />
                  </div>

                  <div style={{ marginBottom: '18px', textAlign: 'right' }}>
                    <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>
                      🔒 סיסמה:
                    </label>
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="הזן סיסמה..."
                      required
                      className="teacher-login-input"
                      style={{ textAlign: 'right' }}
                    />
                  </div>

                  {authError && (
                    <div style={{ color: '#dc2626', fontSize: '0.86rem', marginBottom: '14px', fontWeight: 'bold' }}>
                      {authError}
                    </div>
                  )}

                  <button type="submit" disabled={isAuthLoading} className="teacher-login-btn">
                    {isAuthLoading ? 'מתחבר...' : '🔓 כניסה לאזור האישי'}
                  </button>

                  <div style={{ marginTop: '14px', fontSize: '0.82rem', color: '#64748b' }}>
                    מורה רשום לבדיקה: שם משתמש <b>shimon</b> | סיסמה <b>123</b>
                  </div>
                </form>
              ) : (
                /* Register Form */
                <form onSubmit={handleRegister}>
                  <div style={{ marginBottom: '12px', textAlign: 'right' }}>
                    <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>
                      🏷️ שם המורה המלא (שיוצג לתלמידים): <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      placeholder="למשל: המורה שמעון כהן"
                      required
                      className="teacher-login-input"
                      style={{ textAlign: 'right' }}
                    />
                  </div>

                  <div style={{ marginBottom: '12px', textAlign: 'right' }}>
                    <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>
                      👤 שם משתמש (באנגלית): <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      placeholder="למשל: shimon"
                      required
                      className="teacher-login-input"
                      style={{ textAlign: 'right', direction: 'ltr' }}
                    />
                  </div>

                  <div style={{ marginBottom: '12px', textAlign: 'right' }}>
                    <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>
                      🔒 סיסמה: <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="בחר סיסמה..."
                      required
                      className="teacher-login-input"
                      style={{ textAlign: 'right' }}
                    />
                  </div>

                  <div style={{ marginBottom: '16px', textAlign: 'right' }}>
                    <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>
                      📧 אימייל (אופציונלי):
                    </label>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="teacher@school.com"
                      className="teacher-login-input"
                      style={{ textAlign: 'right', direction: 'ltr' }}
                    />
                  </div>

                  {authError && (
                    <div style={{ color: '#dc2626', fontSize: '0.86rem', marginBottom: '14px', fontWeight: 'bold' }}>
                      {authError}
                    </div>
                  )}

                  <button type="submit" disabled={isAuthLoading} className="teacher-login-btn">
                    {isAuthLoading ? 'יוצר חשבון...' : '✨ הירשם וכנס לאזור האישי'}
                  </button>
                </form>
              )}
            </div>
          </div>
        ) : (
          /* Personal Teacher Submissions Dashboard */
          <div>
            {/* Controls Bar */}
            <div className="teacher-controls">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="🔍 חיפוש לפי שם תלמיד, כיתה, פרויקט..."
                className="teacher-search-input"
              />

              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="teacher-select"
              >
                <option value="">🏫 כל הכיתות ({classesList.length})</option>
                {classesList.map(c => (
                  <option key={c.id || c.className} value={c.className}>{c.className}</option>
                ))}
              </select>

              <select
                value={selectedProjectType}
                onChange={(e) => setSelectedProjectType(e.target.value)}
                className="teacher-select"
              >
                <option value="">כל סוגי הפרויקטים</option>
                <option value="car">🏎️ רובוט מכונית 4WD</option>
                <option value="turtle">🤖 רובוט צב חכם</option>
                <option value="smarthouse">🏡 בית חכם IoT</option>
                <option value="builder">⚡ סטודיו פיתוח ארדואינו</option>
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="teacher-select"
              >
                <option value="">כל הסטטוסים</option>
                <option value="new">🟢 הגשות חדשות בלבד</option>
                <option value="reviewed">🔵 נבדק</option>
              </select>

              <button onClick={fetchSubmissions} className="teacher-refresh-btn">
                🔄 רענן הגשות
              </button>
            </div>

            {/* Submissions List */}
            <div className="teacher-table-card">
              {isLoading ? (
                <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '12px' }}>⏳</div>
                  טוען את ההגשות שלך...
                </div>
              ) : submissions.length === 0 ? (
                <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📭</div>
                  <h3 style={{ margin: 0, color: '#0f172a' }}>אין עדיין הגשות שנשלחו אליך</h3>
                  <p style={{ fontSize: '0.9rem', marginTop: '6px' }}>כאשר תלמיד יבחר ב-<b>{currentTeacher.fullName}</b> בעת השליחה, ההגשה תופיע כאן מיד.</p>
                </div>
              ) : (
                <table className="submissions-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>שם התלמיד / תאריך</th>
                      <th>כיתה / קבוצה</th>
                      <th>שם הפרויקט</th>
                      <th>הערות התלמיד</th>
                      <th>סטטוס</th>
                      <th style={{ textAlign: 'left' }}>פעולות והורדה</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map((sub, idx) => (
                      <tr key={sub.id || idx}>
                        <td style={{ color: '#94a3b8', fontWeight: 'bold' }}>{idx + 1}</td>
                        <td>
                          <div className="student-cell">
                            <div className="student-avatar">
                              {(sub.studentName || 'ת')[0]}
                            </div>
                            <div>
                              <div className="student-info-name">{sub.studentName}</div>
                              <div className="student-info-date">📅 {formatDate(sub.createdAt)}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontWeight: '700', color: '#2563eb', background: '#eff6ff', border: '1px solid #bfdbfe', padding: '4px 10px', borderRadius: '8px', fontSize: '0.84rem' }}>
                            🏫 {sub.className || 'כללי'}
                          </span>
                        </td>
                        <td>
                          <span className="project-tag">
                            {sub.projectName || 'פרויקט רובוט'}
                          </span>
                        </td>
                        <td style={{ maxWidth: '240px', color: '#64748b', fontSize: '0.86rem' }}>
                          {sub.notes || '—'}
                        </td>
                        <td>
                          <span 
                            onClick={() => handleToggleStatus(sub)}
                            className={`badge-status ${sub.status === 'reviewed' ? 'badge-status-reviewed' : 'badge-status-new'}`}
                            title="לחץ כדי לשנות סטטוס"
                          >
                            {sub.status === 'reviewed' ? '✓ נבדק' : '● חדש'}
                          </span>
                        </td>
                        <td>
                          <div className="table-actions">
                            <button
                              onClick={() => handleDownloadIno(sub)}
                              className="btn-action btn-action-download"
                              title="הורד קובץ .ino למחשב"
                            >
                              📥 הורד .ino
                            </button>

                            {sub.blockXml && (
                              <button
                                onClick={() => handleDownloadXml(sub)}
                                className="btn-action"
                                style={{ background: '#7c3aed', color: 'white' }}
                                title="הורד קובץ בלוקים XML"
                              >
                                🧩 בלוקים
                              </button>
                            )}

                            <button
                              onClick={() => setSelectedSubmission(sub)}
                              className="btn-action btn-action-view"
                              title="צפה בקוד המלא"
                            >
                              👁️ צפה בקוד
                            </button>

                            <button
                              onClick={() => handleDelete(sub.id)}
                              className="btn-action btn-action-delete"
                              title="מחק הגשה"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Code Viewer Modal - Light */}
      {selectedSubmission && (
        <div className="modal-code-overlay" onClick={() => setSelectedSubmission(null)}>
          <div className="modal-code-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-code-header">
              <div>
                <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.2rem', fontWeight: '800' }}>
                  💻 קוד הפרויקט של {selectedSubmission.studentName}
                </h3>
                <span style={{ fontSize: '0.84rem', color: '#64748b' }}>
                  כיתה: {selectedSubmission.className || '—'} | פרויקט: {selectedSubmission.projectName} | תאריך: {formatDate(selectedSubmission.createdAt)}
                </span>
              </div>
              <button
                onClick={() => setSelectedSubmission(null)}
                style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#475569', width: '34px', height: '34px', borderRadius: '50%', cursor: 'pointer', fontWeight: 'bold' }}
              >
                ✕
              </button>
            </div>

            <div className="modal-code-body">
              <pre className="modal-code-pre">
                {selectedSubmission.code || '// אין תוכן קוד להצגה'}
              </pre>
            </div>

            <div className="modal-code-footer">
              <button
                onClick={() => handleCopyCode(selectedSubmission.code)}
                className="btn-action"
                style={{ background: copied ? '#ecfdf5' : '#ffffff', color: copied ? '#059669' : '#334155', border: '1px solid #cbd5e1', padding: '10px 18px' }}
              >
                {copied ? '✅ הועתק ללוח!' : '📋 העתק קוד C++'}
              </button>

              <button
                onClick={() => handleDownloadIno(selectedSubmission)}
                className="btn-action btn-action-download"
                style={{ padding: '10px 18px' }}
              >
                📥 הורד קובץ .ino למחשב
              </button>

              <button
                onClick={() => setSelectedSubmission(null)}
                className="btn-action"
                style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', padding: '10px 18px' }}
              >
                סגור
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🏫 CLASS MANAGEMENT MODAL */}
      {showClassModal && (
        <div
          onClick={() => setShowClassModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999999,
            backdropFilter: 'blur(6px)',
            direction: 'rtl',
            padding: '16px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '520px',
              background: '#ffffff',
              borderRadius: '24px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 25px 60px rgba(0,0,0,0.15)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              fontFamily: "'Rubik', 'Outfit', sans-serif"
            }}
          >
            {/* Modal Header */}
            <div style={{
              padding: '18px 24px',
              background: '#f8fafc',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: '#eff6ff',
                  border: '1.5px solid #bfdbfe',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.4rem'
                }}>
                  🏫
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0, color: '#0f172a' }}>
                    ניהול ופתיחת כיתות לימוד
                  </h3>
                  <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '2px' }}>
                    הפק קוד כיתה ייחודי, שייך מסלולי לימוד ושתף הודעת הזמנה לתלמידים
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowClassModal(false)}
                style={{
                  background: '#f1f5f9',
                  border: '1px solid #e2e8f0',
                  color: '#64748b',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '22px 24px' }}>
              {/* Add New Class Form */}
              <form onSubmit={handleCreateClass} style={{ marginBottom: '22px', background: '#f8fafc', padding: '18px', borderRadius: '16px', border: '1.5px solid #e2e8f0' }}>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '800', color: '#1e293b', marginBottom: '6px' }}>
                    🏷️ שם הכיתה / הקבוצה: <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    placeholder="למשל: כיתה ט׳3 - רובוטיקה מתקדמת"
                    required
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      borderRadius: '12px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.94rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Track Assignment Checkboxes */}
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: '800', color: '#1e293b', marginBottom: '8px' }}>
                    שיוך מסלולי לימוד לכיתה זו:
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {[
                      { key: 'car', label: 'רובוט מכונית 4WD' },
                      { key: 'turtle', label: 'רובוט צב חכם' },
                      { key: 'house', label: 'בית חכם IoT' },
                      ...availableCustomTracks.map(trk => ({
                        key: trk.id || trk.trackId,
                        label: `${trk.title} (AI)`
                      }))
                    ].map(t => (
                      <label
                        key={t.key}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 12px',
                          background: newClassTracks.includes(t.key) ? '#eff6ff' : '#ffffff',
                          border: newClassTracks.includes(t.key) ? '1.5px solid #3b82f6' : '1px solid #cbd5e1',
                          borderRadius: '10px',
                          fontSize: '0.86rem',
                          fontWeight: '700',
                          color: newClassTracks.includes(t.key) ? '#1d4ed8' : '#475569',
                          cursor: 'pointer'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={newClassTracks.includes(t.key)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewClassTracks(prev => [...prev, t.key]);
                            } else {
                              setNewClassTracks(prev => prev.filter(k => k !== t.key));
                            }
                          }}
                          style={{ accentColor: '#2563eb' }}
                        />
                        {t.label}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Optional Custom Code & Submit */}
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input
                    type="text"
                    value={newClassCode}
                    onChange={(e) => setNewClassCode(e.target.value.toUpperCase())}
                    placeholder="קוד כיתה מותאם (אופציונלי)..."
                    style={{
                      flex: 1,
                      padding: '11px 14px',
                      borderRadius: '12px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.88rem',
                      direction: 'ltr',
                      textAlign: 'center',
                      fontWeight: '700',
                      outline: 'none'
                    }}
                  />
                  <button
                    type="submit"
                    disabled={classModalLoading}
                    style={{
                      padding: '11px 22px',
                      background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      fontWeight: '800',
                      fontSize: '0.94rem',
                      cursor: classModalLoading ? 'not-allowed' : 'pointer',
                      boxShadow: '0 3px 12px rgba(37,99,235,0.3)',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {classModalLoading ? 'מייצר כיתה...' : '➕ פתח כיתה והפק קוד'}
                  </button>
                </div>
              </form>

              {/* Status Message */}
              {classModalMsg.text && (
                <div style={{
                  marginBottom: '16px',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  fontSize: '0.88rem',
                  fontWeight: '700',
                  background: classModalMsg.type === 'error' ? '#fef2f2' : classModalMsg.type === 'success' ? '#f0fdf4' : '#eff6ff',
                  color: classModalMsg.type === 'error' ? '#dc2626' : classModalMsg.type === 'success' ? '#15803d' : '#1d4ed8',
                  border: classModalMsg.type === 'error' ? '1px solid #fecaca' : classModalMsg.type === 'success' ? '1px solid #bbf7d0' : '1px solid #bfdbfe'
                }}>
                  {classModalMsg.text}
                </div>
              )}

              {/* Existing Classes List */}
              <div>
                <div style={{ fontSize: '0.92rem', fontWeight: '800', color: '#0f172a', marginBottom: '12px' }}>
                  📋 רשימת הכיתות הפעילות שלך ({classesList.length}):
                </div>
                <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {classesList.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', background: '#f8fafc', borderRadius: '12px' }}>
                      טרם פתחת כיתות לימוד. השתמש בטופס למעלה כדי לפתוח כיתה ראשונה!
                    </div>
                  ) : (
                    classesList.map(c => {
                      const code = c.classCode || `CLS-${c.id || '2026'}`;
                      const isWaCopied = copiedCodeId === `wa-${c.id || c.className}`;
                      const isCodeCopied = copiedCodeId === `code-${c.id || c.className}`;
                      const tracks = c.assignedTracks || ['car'];

                      return (
                        <div
                          key={c.id || c.className}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                            padding: '14px 16px',
                            background: '#ffffff',
                            border: '1.5px solid #e2e8f0',
                            borderRadius: '14px',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontWeight: '800', fontSize: '1rem', color: '#0f172a' }}>
                                🏫 {c.className}
                              </span>
                              <span style={{
                                fontSize: '0.82rem',
                                fontWeight: '800',
                                padding: '3px 10px',
                                background: '#eff6ff',
                                color: '#2563eb',
                                border: '1px solid #bfdbfe',
                                borderRadius: '8px',
                                letterSpacing: '0.5px'
                              }}>
                                🔑 קוד: {code}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDeleteClass(c.id, c.className)}
                              title="מחק כיתה"
                              style={{
                                padding: '5px 9px',
                                background: '#fee2e2',
                                color: '#dc2626',
                                border: '1px solid #fca5a5',
                                borderRadius: '8px',
                                fontSize: '0.82rem',
                                cursor: 'pointer'
                              }}
                            >
                              🗑️ מחק
                            </button>
                          </div>

                          {/* Tracks Badges & Actions */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '8px' }}>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                              {tracks.map(t => (
                                <span
                                  key={t}
                                  style={{
                                    fontSize: '0.75rem',
                                    fontWeight: '700',
                                    padding: '2px 8px',
                                    borderRadius: '6px',
                                    background: t === 'car' ? '#f5f3ff' : t === 'turtle' ? '#fff7ed' : t === 'house' ? '#fdf2f8' : '#f0fdf4',
                                    color: t === 'car' ? '#6d28d9' : t === 'turtle' ? '#c2410c' : t === 'house' ? '#be185d' : '#15803d',
                                    border: '1px solid rgba(0,0,0,0.06)'
                                  }}
                                >
                                  {t === 'car' ? '🏎️ מכונית' : t === 'turtle' ? '🤖 צב' : t === 'house' ? '🏡 בית חכם' : '✨ מותאם'}
                                </span>
                              ))}
                            </div>

                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button
                                type="button"
                                onClick={() => handleCopySingleCode(code, c.id || c.className)}
                                style={{
                                  padding: '5px 10px',
                                  borderRadius: '8px',
                                  border: '1px solid #cbd5e1',
                                  background: isCodeCopied ? '#f0fdf4' : '#f8fafc',
                                  color: isCodeCopied ? '#16a34a' : '#475569',
                                  fontSize: '0.8rem',
                                  fontWeight: '700',
                                  cursor: 'pointer'
                                }}
                              >
                                {isCodeCopied ? '✓ הועתק!' : '📋 העתק קוד'}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleCopyClassWhatsApp(c)}
                                style={{
                                  padding: '5px 12px',
                                  borderRadius: '8px',
                                  border: 'none',
                                  background: isWaCopied ? '#15803d' : '#22c55e',
                                  color: '#ffffff',
                                  fontSize: '0.8rem',
                                  fontWeight: '800',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  boxShadow: '0 2px 6px rgba(34,197,94,0.3)'
                                }}
                              >
                                {isWaCopied ? '✓ הודעת וואטסאפ הועתקה!' : '💬 הודעת וואטסאפ'}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '14px 24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', textAlign: 'left' }}>
              <button
                onClick={() => setShowClassModal(false)}
                style={{
                  padding: '9px 18px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#475569',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                סגור
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔔 CUSTOM SYSTEM CONFIRM/ALERT MODAL */}
      <ConfirmModal
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        icon={confirmDialog.icon}
        type={confirmDialog.type}
        confirmText={confirmDialog.confirmText}
        cancelText={confirmDialog.cancelText}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}

export default TeacherDashboard;
