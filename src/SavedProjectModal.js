import React, { useState, useEffect } from 'react';
import { getActiveServerUrl } from './serverPort';
import ConfirmModal from './ConfirmModal';

function SavedProjectModal({
  isOpen,
  onClose,
  initialTab = 'save',
  projectType = 'car',
  defaultProjectName = 'רובוט מכונית 4WD',
  currentBlockXml = '',
  currentCode = '',
  onLoadProject // Callback receiving { blockXml, code, projectName }
}) {
  const [activeTab, setActiveTab] = useState(initialTab); // 'save' | 'load'
  const [studentName, setStudentName] = useState(() => {
    try { return localStorage.getItem('smartstart_saved_student_name') || ''; } catch (e) { return ''; }
  });
  const [projectName, setProjectName] = useState('');
  const [password, setPassword] = useState('');
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [projectsList, setProjectsList] = useState([]);
  const [hasFetchedList, setHasFetchedList] = useState(false);

  // Custom Confirm Modal
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    projId: null,
    projName: ''
  });

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setStatusMsg({ type: '', text: '' });
      setProjectsList([]);
      setHasFetchedList(false);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const formatDate = (isoString) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('he-IL') + ' ' + d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return isoString;
    }
  };

  // Handle Save Project
  const handleSave = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (!studentName.trim() || !password.trim()) {
      setStatusMsg({ type: 'error', text: '❌ אנא הזן שם תלמיד וסיסמה אישית' });
      return;
    }

    const finalProjectName = (projectName.trim() || defaultProjectName).trim();
    setIsLoading(true);
    setStatusMsg({ type: 'info', text: '⏳ שומר את הפרויקט בענן תחת הסיסמה האישית שלך...' });

    try {
      localStorage.setItem('smartstart_saved_student_name', studentName.trim());
    } catch (e) {}

    const payload = {
      studentName: studentName.trim(),
      projectName: finalProjectName,
      projectType,
      password: password.trim(),
      blockXml: currentBlockXml,
      code: currentCode
    };

    try {
      const serverUrl = await getActiveServerUrl();
      const res = await fetch(`${serverUrl}/api/projects/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        setStatusMsg({
          type: 'success',
          text: `🎉 ${data.message || 'הפרויקט נשמר בהצלחה!'}`
        });
      } else {
        setStatusMsg({
          type: 'error',
          text: `❌ ${data.error || 'שגיאה בשמירת הפרויקט'}`
        });
      }
    } catch (err) {
      console.warn('Backend offline, saving locally:', err);
      try {
        const localList = JSON.parse(localStorage.getItem('smartstart_all_personal_projects') || '[]');
        const existingUser = localList.find(p => p.studentName.toLowerCase() === studentName.trim().toLowerCase());
        if (existingUser && existingUser.password !== password.trim()) {
          setStatusMsg({ type: 'error', text: '❌ הסיסמה האישית שהזנת שגויה' });
          setIsLoading(false);
          return;
        }

        const existingIdx = localList.findIndex(p =>
          p.studentName.toLowerCase() === studentName.trim().toLowerCase() &&
          p.projectName.toLowerCase() === finalProjectName.toLowerCase() &&
          p.projectType === projectType
        );

        if (existingIdx !== -1) {
          localList[existingIdx].blockXml = currentBlockXml;
          localList[existingIdx].code = currentCode;
          localList[existingIdx].updatedAt = new Date().toISOString();
        } else {
          localList.unshift({
            id: Date.now(),
            ...payload,
            updatedAt: new Date().toISOString()
          });
        }

        localStorage.setItem('smartstart_all_personal_projects', JSON.stringify(localList));
        setStatusMsg({ type: 'success', text: `🎉 הפרויקט "${finalProjectName}" נשמר בהצלחה תחת הסיסמה שלך!` });
      } catch (e) {
        setStatusMsg({ type: 'error', text: '❌ שגיאה בשמירת הפרויקט' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch List of Saved Projects for this Student
  const handleFetchProjectsList = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (!studentName.trim() || !password.trim()) {
      setStatusMsg({ type: 'error', text: '❌ אנא הזן שם תלמיד וסיסמה אישית' });
      return;
    }

    setIsLoading(true);
    setStatusMsg({ type: 'info', text: '⏳ מאמת סיסמה וטוען את רשימת הפרויקטים שלך...' });

    try {
      localStorage.setItem('smartstart_saved_student_name', studentName.trim());
    } catch (e) {}

    try {
      const serverUrl = await getActiveServerUrl();
      const res = await fetch(`${serverUrl}/api/projects/list`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: studentName.trim(),
          projectType,
          password: password.trim()
        })
      });

      const data = await res.json();
      if (data.success) {
        setProjectsList(data.projects || []);
        setHasFetchedList(true);
        if (!data.projects || data.projects.length === 0) {
          setStatusMsg({ type: 'info', text: 'ℹ️ לא נמצאו פרויקטים שמורים במסלול זה. תוכל לשמור פרויקט חדש בלשונית השמירה!' });
        } else {
          setStatusMsg({ type: '', text: '' });
        }
      } else {
        setStatusMsg({ type: 'error', text: `❌ ${data.error || 'הסיסמה שהזנת שגויה'}` });
      }
    } catch (err) {
      console.warn('Backend offline, reading locally:', err);
      try {
        const localList = JSON.parse(localStorage.getItem('smartstart_all_personal_projects') || '[]');
        const userProjs = localList.filter(p =>
          p.studentName.toLowerCase() === studentName.trim().toLowerCase() &&
          (!projectType || p.projectType === projectType)
        );

        if (userProjs.length > 0 && userProjs[0].password !== password.trim()) {
          setStatusMsg({ type: 'error', text: '❌ הסיסמה שהזנת שגויה' });
        } else {
          setProjectsList(userProjs);
          setHasFetchedList(true);
          if (userProjs.length === 0) {
            setStatusMsg({ type: 'info', text: 'ℹ️ לא נמצאו פרויקטים שמורים במסלול זה.' });
          } else {
            setStatusMsg({ type: '', text: '' });
          }
        }
      } catch (e) {
        setStatusMsg({ type: 'error', text: '❌ שגיאה בטעינת הפרויקטים' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Load a Specific Project
  const handleLoadSingleProject = async (proj) => {
    setIsLoading(true);
    setStatusMsg({ type: 'info', text: `⏳ טוען את הפרויקט "${proj.projectName}"...` });

    try {
      const serverUrl = await getActiveServerUrl();
      const res = await fetch(`${serverUrl}/api/projects/load`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: proj.id,
          studentName: studentName.trim(),
          password: password.trim()
        })
      });

      const data = await res.json();
      if (data.success) {
        if (onLoadProject) {
          onLoadProject({
            blockXml: data.blockXml || '',
            code: data.code || '',
            projectName: data.projectName || defaultProjectName
          });
        }
        setStatusMsg({ type: 'success', text: `🎉 הפרויקט "${proj.projectName}" נטען בהצלחה ללוח העבודה!` });
        setTimeout(() => {
          onClose();
        }, 900);
      } else {
        setStatusMsg({ type: 'error', text: `❌ ${data.error || 'שגיאה בטעינת הפרויקט'}` });
      }
    } catch (err) {
      console.warn('Backend offline, loading locally:', err);
      try {
        const localList = JSON.parse(localStorage.getItem('smartstart_all_personal_projects') || '[]');
        const found = localList.find(p => p.id == proj.id);
        if (found) {
          if (onLoadProject) {
            onLoadProject({
              blockXml: found.blockXml || '',
              code: found.code || '',
              projectName: found.projectName || defaultProjectName
            });
          }
          setStatusMsg({ type: 'success', text: `🎉 הפרויקט "${proj.projectName}" נטען בהצלחה!` });
          setTimeout(() => {
            onClose();
          }, 900);
        }
      } catch (e) {
        setStatusMsg({ type: 'error', text: '❌ שגיאה בטעינת הפרויקט' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Delete a Project
  const handleDeleteProject = (proj, e) => {
    if (e) e.stopPropagation();
    setDeleteConfirm({
      isOpen: true,
      projId: proj.id,
      projName: proj.projectName || 'פרויקט'
    });
  };

  const confirmDeleteProject = async () => {
    const projId = deleteConfirm.projId;
    setDeleteConfirm({ isOpen: false, projId: null, projName: '' });
    if (!projId) return;

    try {
      const serverUrl = await getActiveServerUrl();
      await fetch(`${serverUrl}/api/projects/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: projId,
          studentName: studentName.trim(),
          password: password.trim()
        })
      });
    } catch (e) {}

    try {
      const localList = JSON.parse(localStorage.getItem('smartstart_all_personal_projects') || '[]');
      const filtered = localList.filter(p => p.id != projId);
      localStorage.setItem('smartstart_all_personal_projects', JSON.stringify(filtered));
    } catch (e) {}

    setProjectsList(prev => prev.filter(p => p.id != projId));
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
        backgroundColor: 'rgba(15, 23, 42, 0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999999,
        backdropFilter: 'blur(6px)',
        direction: 'rtl',
        margin: 0,
        padding: '16px',
        boxSizing: 'border-box'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '540px',
          background: '#ffffff',
          borderRadius: '24px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 25px 60px rgba(0,0,0,0.15)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          color: '#0f172a',
          fontFamily: "'Rubik', 'Outfit', system-ui, -apple-system, sans-serif",
          margin: 'auto',
          animation: 'modalPop 0.2s ease-out',
          maxHeight: '90vh'
        }}
      >
        {/* Header */}
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
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: '#eff6ff',
              border: '1.5px solid #bfdbfe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.4rem'
            }}>
              {activeTab === 'save' ? '💾' : '📂'}
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0, color: '#0f172a' }}>
                {activeTab === 'save' ? 'שמירת פרויקט אישי בענן' : 'פתיחת פרויקטים שמורים'}
              </h3>
              <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '2px' }}>
                מסלול: <span style={{ color: '#2563eb', fontWeight: 'bold' }}>{defaultProjectName}</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#f1f5f9',
              border: '1px solid #e2e8f0',
              color: '#64748b',
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ✕
          </button>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', padding: '6px 16px', gap: '8px' }}>
          <button
            type="button"
            onClick={() => { setActiveTab('save'); setStatusMsg({ type: '', text: '' }); }}
            style={{
              flex: 1,
              padding: '9px 12px',
              borderRadius: '10px',
              border: activeTab === 'save' ? '1px solid #2563eb' : '1px solid transparent',
              background: activeTab === 'save' ? '#2563eb' : 'transparent',
              color: activeTab === 'save' ? '#ffffff' : '#64748b',
              fontWeight: '700',
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            💾 שמירת פרויקט חדש / עדכון
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('load'); setStatusMsg({ type: '', text: '' }); }}
            style={{
              flex: 1,
              padding: '9px 12px',
              borderRadius: '10px',
              border: activeTab === 'load' ? '1px solid #2563eb' : '1px solid transparent',
              background: activeTab === 'load' ? '#2563eb' : 'transparent',
              color: activeTab === 'load' ? '#ffffff' : '#64748b',
              fontWeight: '700',
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            📂 רשימת הפרויקטים השמורים שלי
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '22px 24px', overflowY: 'auto' }}>
          
          {/* TAB 1: SAVE */}
          {activeTab === 'save' && (
            <form onSubmit={handleSave}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.86rem', marginBottom: '6px', fontWeight: '700', color: '#334155' }}>
                  👤 שם התלמיד: <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="למשל: יעקב גדיף"
                  required
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#0f172a',
                    fontSize: '0.95rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.86rem', marginBottom: '6px', fontWeight: '700', color: '#334155' }}>
                  📁 שם הפרויקט (ניתן לשמור מספר פרויקטים שונים): <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="למשל: רובוט 4WD - שלב ב' עקיפת מכשולים"
                  required
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#0f172a',
                    fontSize: '0.95rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.86rem', marginBottom: '6px', fontWeight: '700', color: '#334155' }}>
                  🔒 סיסמה אישית / קוד אישי: <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="הזן 4 ספרות או סיסמה שבחרת..."
                  required
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#0f172a',
                    fontSize: '0.95rem',
                    fontWeight: '700',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <small style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>
                  💡 סיסמה זו מגנה על כל הפרויקטים שלך כך שרק אתה תוכל לפתוח ולערוך אותם.
                </small>
              </div>

              {/* Status Message */}
              {statusMsg.text && (
                <div style={{
                  marginBottom: '16px',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  fontSize: '0.88rem',
                  fontWeight: '700',
                  background: statusMsg.type === 'error' ? '#fef2f2' : statusMsg.type === 'success' ? '#f0fdf4' : '#eff6ff',
                  color: statusMsg.type === 'error' ? '#dc2626' : statusMsg.type === 'success' ? '#15803d' : '#1d4ed8',
                  border: statusMsg.type === 'error' ? '1px solid #fecaca' : statusMsg.type === 'success' ? '1px solid #bbf7d0' : '1px solid #bfdbfe',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  {statusMsg.text}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    padding: '10px 18px',
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
                <button
                  type="submit"
                  disabled={isLoading}
                  style={{
                    padding: '11px 24px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
                    color: 'white',
                    fontWeight: '800',
                    fontSize: '0.95rem',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    opacity: isLoading ? 0.7 : 1,
                    boxShadow: '0 4px 14px rgba(37,99,235,0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  {isLoading ? '⏳ שומר...' : '💾 שמור פרויקט בענן'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: LOAD & MULTIPLE PROJECTS LIST */}
          {activeTab === 'load' && (
            <div>
              <form onSubmit={handleFetchProjectsList} style={{ marginBottom: '18px' }}>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '4px', fontWeight: '700', color: '#334155' }}>
                      👤 שם התלמיד:
                    </label>
                    <input
                      type="text"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      placeholder="שם התלמיד..."
                      required
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        border: '1.5px solid #cbd5e1',
                        background: '#ffffff',
                        fontSize: '0.9rem',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '4px', fontWeight: '700', color: '#334155' }}>
                      🔒 סיסמה אישית:
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="סיסמה..."
                      required
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        border: '1.5px solid #cbd5e1',
                        background: '#ffffff',
                        fontSize: '0.9rem',
                        fontWeight: '700',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    fontWeight: '800',
                    fontSize: '0.92rem',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 3px 10px rgba(16,185,129,0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  {isLoading ? '⏳ בודק ומציג פרויקטים...' : '🔍 הצג את כל הפרויקטים השמורים שלי'}
                </button>
              </form>

              {/* Status Message */}
              {statusMsg.text && (
                <div style={{
                  marginBottom: '16px',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  fontSize: '0.86rem',
                  fontWeight: '700',
                  background: statusMsg.type === 'error' ? '#fef2f2' : statusMsg.type === 'success' ? '#f0fdf4' : '#eff6ff',
                  color: statusMsg.type === 'error' ? '#dc2626' : statusMsg.type === 'success' ? '#15803d' : '#1d4ed8',
                  border: statusMsg.type === 'error' ? '1px solid #fecaca' : statusMsg.type === 'success' ? '1px solid #bbf7d0' : '1px solid #bfdbfe',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  {statusMsg.text}
                </div>
              )}

              {/* PROJECTS LIST */}
              {hasFetchedList && (
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: '800', color: '#334155', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>📁 פרויקטים שמורים ({projectsList.length}):</span>
                    <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 'normal' }}>לחץ על פרויקט לפתיחה</span>
                  </div>

                  {projectsList.length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1', color: '#64748b', fontSize: '0.9rem' }}>
                      לא נמצאו פרויקטים שמורים עבורך במסלול זה.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
                      {projectsList.map((proj) => (
                        <div
                          key={proj.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '12px 16px',
                            background: '#f8fafc',
                            border: '1.5px solid #e2e8f0',
                            borderRadius: '12px',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: '800', fontSize: '0.95rem', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {proj.projectName}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                              🕒 עודכן: {formatDate(proj.updatedAt)}
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <button
                              type="button"
                              onClick={() => handleLoadSingleProject(proj)}
                              style={{
                                padding: '6px 14px',
                                background: '#2563eb',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '0.85rem',
                                fontWeight: '700',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              📂 פתח פרויקט
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleDeleteProject(proj, e)}
                              title="מחק פרויקט"
                              style={{
                                padding: '6px 8px',
                                background: '#fee2e2',
                                color: '#dc2626',
                                border: '1px solid #fca5a5',
                                borderRadius: '8px',
                                fontSize: '0.85rem',
                                cursor: 'pointer'
                              }}
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* 🔔 CUSTOM CONFIRM MODAL FOR PROJECT DELETION */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        title="מחיקת פרויקט שמור"
        message={`האם אתה בטוח שברצונך למחוק את הפרויקט "${deleteConfirm.projName}" לצמיתות?`}
        icon="🗑️"
        type="danger"
        confirmText="מחק פרויקט"
        cancelText="ביטול"
        onConfirm={confirmDeleteProject}
        onCancel={() => setDeleteConfirm({ isOpen: false, projId: null, projName: '' })}
      />
    </div>
  );
}

export default SavedProjectModal;
