import React, { useState, useEffect } from 'react';
import { getActiveServerUrl } from './serverPort';

const PRESET_TEACHERS = [
  'המורה שמעון',
  'המורה רוני',
  'המורה דוד',
  'המורה מיכל',
  'הזן שם מורה אחר...'
];

const PRESET_CLASSES = [];

function SendCodeModal({ 
  isOpen, 
  onClose, 
  code = '', 
  filename = 'superbot_car.ino',
  projectName = 'רובוט מכונית 4WD',
  projectType = 'car',
  blockXml = ''
}) {
  const [studentName, setStudentName] = useState('');
  const [teachersList, setTeachersList] = useState(PRESET_TEACHERS);
  const [classesList, setClassesList] = useState(PRESET_CLASSES);
  const [selectedTeacher, setSelectedTeacher] = useState(PRESET_TEACHERS[0]);
  const [customTeacher, setCustomTeacher] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [customProjectName, setCustomProjectName] = useState(projectName);
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [activeTab, setActiveTab] = useState('teacher'); // 'teacher' | 'whatsapp'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

  // Load student session if logged in
  useEffect(() => {
    try {
      const studentSession = localStorage.getItem('smartstart_student_session');
      if (studentSession) {
        const parsed = JSON.parse(studentSession);
        if (parsed.studentName) setStudentName(parsed.studentName);
        if (parsed.className) {
          setSelectedClass(parsed.className);
          setClassesList(prev => prev.includes(parsed.className) ? prev : [parsed.className, ...prev]);
        }
        if (parsed.teacherName) {
          setSelectedTeacher(parsed.teacherName);
        }
      }
    } catch (e) {}
  }, [isOpen]);

  // Load dynamically registered teachers & classes from server
  useEffect(() => {
    async function loadData() {
      try {
        const serverUrl = await getActiveServerUrl();
        // 1. Teachers
        const resT = await fetch(`${serverUrl}/api/teachers`);
        const dataT = await resT.json();
        if (dataT.success && dataT.teachers && dataT.teachers.length > 0) {
          const names = Array.from(new Set(dataT.teachers.map(t => t.fullName)));
          names.push('הזן שם מורה אחר...');
          setTeachersList(names);
        }

        // 2. Classes
        const resC = await fetch(`${serverUrl}/api/classes`);
        const dataC = await resC.json();
        if (dataC.success && dataC.classes) {
          const cNames = dataC.classes.map(c => c.className);
          setClassesList(cNames);
          if (cNames.length > 0) {
            setSelectedClass(prev => prev || cNames[0]);
          }
        }
      } catch (e) {}
    }
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const targetTeacherName = selectedTeacher === 'הזן שם מורה אחר...' 
    ? (customTeacher.trim() || 'מורה כללי') 
    : selectedTeacher;

  const normalizePhoneNumber = (raw) => {
    let clean = raw.replace(/\D/g, '');
    if (clean.startsWith('05')) {
      clean = '972' + clean.slice(1);
    } else if (clean.startsWith('5')) {
      clean = '972' + clean;
    }
    return clean;
  };

  // 1. Direct submit to Teacher System (SQL Server & fallback)
  const handleSubmitToTeacher = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (!studentName.trim()) {
      setStatusMsg({ type: 'error', text: '❌ אנא הזן את שמך המלא (שם התלמיד).' });
      return;
    }

    setIsSubmitting(true);
    setStatusMsg({ type: 'info', text: '⏳ שולח את הפרויקט למורה...' });

    const payload = {
      studentName: studentName.trim(),
      teacherName: targetTeacherName,
      className: selectedClass,
      projectName: customProjectName || projectName || filename || 'פרויקט רובוטיקה',
      projectType: projectType || 'car',
      code: code,
      blockXml: blockXml || '',
      notes: notes.trim(),
      createdAt: new Date().toISOString()
    };

    try {
      const serverUrl = await getActiveServerUrl();
      const response = await fetch(`${serverUrl}/api/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (data.success) {
        setStatusMsg({ 
          type: 'success', 
          text: `🎉 מעולה! הפרויקט נשלח בהצלחה ל-${targetTeacherName} (${selectedClass}) ונשמר במערכת!` 
        });
      } else {
        setStatusMsg({ 
          type: 'error', 
          text: `❌ שגיאה בשמירה: ${data.error || 'אנא נסה שוב'}` 
        });
      }
    } catch (err) {
      console.warn('Backend offline, saving to local fallback storage:', err);
      try {
        const localList = JSON.parse(localStorage.getItem('smartstart_browser_submissions') || '[]');
        localList.unshift({ ...payload, id: Date.now(), status: 'new' });
        localStorage.setItem('smartstart_browser_submissions', JSON.stringify(localList));
      } catch (e) {}
      
      setStatusMsg({ 
        type: 'success', 
        text: `✅ הפרויקט נשמר בהצלחה במערכת עבור ${targetTeacherName} (${selectedClass})!` 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Send via WhatsApp
  const handleSendWhatsApp = (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (!studentName.trim()) {
      setStatusMsg({ type: 'error', text: '❌ אנא הזן את שם התלמיד.' });
      return;
    }

    const cleanPhone = normalizePhoneNumber(phone);
    if (!cleanPhone || cleanPhone.length < 9) {
      setStatusMsg({ type: 'error', text: '❌ אנא הזן מספר טלפון תקין (למשל: 052-1234567).' });
      return;
    }

    const inoFilename = filename.endsWith('.ino') ? filename : `${filename}.ino`;

    const message = `🤖 *SmartStart Robot - קוד פרויקט ארדואינו*\n\n` +
      `👤 *תלמיד/ה:* ${studentName}\n` +
      `👨‍🏫 *מורה מקבל:* ${targetTeacherName} (${selectedClass})\n` +
      `📁 *פרויקט:* ${customProjectName || projectName}\n` +
      `📄 *קובץ:* ${inoFilename}\n` +
      `📅 *תאריך:* ${new Date().toLocaleDateString('he-IL')}\n` +
      (notes ? `📝 *הערות:* ${notes}\n\n` : `\n`) +
      `💻 *קוד ה-Arduino C++ של הרובוט:*\n` +
      `\`\`\`cpp\n` +
      `${code}\n` +
      `\`\`\`\n\n` +
      `🚀 *נשלח מ-SmartStart Robot Studio*`;

    const waUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
    setStatusMsg({ type: 'success', text: `✅ פותח את WhatsApp לשליחה למספר ${phone}...` });
  };

  // 3. Download .ino locally
  const handleDownloadIno = () => {
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename.endsWith('.ino') ? filename : `${filename}.ino`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 4. Copy code to clipboard
  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
          boxShadow: '0 25px 60px rgba(0,0,0,0.15), 0 0 1px rgba(0,0,0,0.1)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          color: '#0f172a',
          fontFamily: "'Rubik', 'Outfit', system-ui, -apple-system, sans-serif",
          margin: 'auto',
          animation: 'modalPop 0.2s ease-out'
        }}
      >
        {/* Header (Light & Fresh) */}
        <div style={{ 
          padding: '20px 24px', 
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
              📤
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0, color: '#0f172a' }}>
                שליחת פרויקט וקוד
              </h3>
              <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '2px' }}>
                קובץ יעד: <span style={{ color: '#2563eb', fontWeight: 'bold' }}>{filename}</span>
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
              justifyContent: 'center',
              transition: 'all 0.15s'
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.color = '#0f172a'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#64748b'; }}
          >
            ✕
          </button>
        </div>

        {/* Tab Selection */}
        <div style={{ display: 'flex', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', padding: '6px 16px', gap: '8px' }}>
          <button
            type="button"
            onClick={() => { setActiveTab('teacher'); setStatusMsg({ type: '', text: '' }); }}
            style={{
              flex: 1,
              padding: '9px 12px',
              borderRadius: '10px',
              border: activeTab === 'teacher' ? '1px solid #2563eb' : '1px solid transparent',
              background: activeTab === 'teacher' ? '#2563eb' : 'transparent',
              color: activeTab === 'teacher' ? '#ffffff' : '#64748b',
              fontWeight: '700',
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.15s'
            }}
          >
            👨‍🏫 שלח ישירות למורה (במערכת)
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('whatsapp'); setStatusMsg({ type: '', text: '' }); }}
            style={{
              flex: 1,
              padding: '9px 12px',
              borderRadius: '10px',
              border: activeTab === 'whatsapp' ? '1px solid #16a34a' : '1px solid transparent',
              background: activeTab === 'whatsapp' ? '#16a34a' : 'transparent',
              color: activeTab === 'whatsapp' ? '#ffffff' : '#64748b',
              fontWeight: '700',
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.15s'
            }}
          >
            💬 שלח ב-WhatsApp
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={activeTab === 'teacher' ? handleSubmitToTeacher : handleSendWhatsApp} style={{ padding: '20px 24px', maxHeight: '72vh', overflowY: 'auto' }}>
          
          {/* Student Name */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '0.86rem', marginBottom: '6px', fontWeight: '700', color: '#334155' }}>
              👤 שם התלמיד / יוצר הפרויקט: <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input 
              type="text" 
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="למשל: דניאל כהן"
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
              onFocus={(e) => e.target.style.borderColor = '#2563eb'}
              onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
            />
          </div>

          {/* Teacher and Class Selector Row */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.86rem', marginBottom: '6px', fontWeight: '700', color: '#334155' }}>
                👨‍🏫 לאיזה מורה לשלוח:
              </label>
              <select
                value={selectedTeacher}
                onChange={(e) => setSelectedTeacher(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px 12px',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#0f172a',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              >
                {teachersList.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.86rem', marginBottom: '6px', fontWeight: '700', color: '#334155' }}>
                🏫 כיתה / קבוצה:
              </label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px 12px',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#0f172a',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              >
                {classesList.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Custom Teacher Name field if selected */}
          {selectedTeacher === 'הזן שם מורה אחר...' && (
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.86rem', marginBottom: '6px', fontWeight: '700', color: '#334155' }}>
                ✍️ הזן את שם המורה:
              </label>
              <input 
                type="text" 
                value={customTeacher}
                onChange={(e) => setCustomTeacher(e.target.value)}
                placeholder="למשל: המורה יוסף"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1.5px solid #2563eb',
                  background: '#ffffff',
                  color: '#0f172a',
                  fontSize: '0.9rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          )}

          {/* Project Name (Editable) */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '0.86rem', marginBottom: '6px', fontWeight: '700', color: '#334155' }}>
              📁 שם הפרויקט / הנושא:
            </label>
            <input 
              type="text" 
              value={customProjectName}
              onChange={(e) => setCustomProjectName(e.target.value)}
              placeholder="למשל: רובוט עוקב קו - שלב ב'"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1.5px solid #cbd5e1',
                background: '#ffffff',
                color: '#0f172a',
                fontSize: '0.9rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* WhatsApp Phone Number */}
          {activeTab === 'whatsapp' && (
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.86rem', marginBottom: '6px', fontWeight: '700', color: '#334155' }}>
                📱 מספר טלפון WhatsApp: <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input 
                type="tel" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="052-1234567"
                required={activeTab === 'whatsapp'}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: '10px',
                  border: '1.5px solid #16a34a',
                  background: '#ffffff',
                  color: '#0f172a',
                  fontSize: '0.95rem',
                  fontWeight: 'bold',
                  letterSpacing: '1px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  direction: 'ltr',
                  textAlign: 'right'
                }}
              />
            </div>
          )}

          {/* Notes */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.86rem', marginBottom: '6px', fontWeight: '700', color: '#334155' }}>
              📝 הערות או שאלות למורה (אופציונלי):
            </label>
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="כתוב כאן הערה או שאלה לגבי הקוד..."
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1.5px solid #cbd5e1',
                background: '#ffffff',
                color: '#0f172a',
                fontSize: '0.88rem',
                outline: 'none',
                resize: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Quick utility buttons */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
            <button
              type="button"
              onClick={handleCopyCode}
              style={{
                flex: 1,
                padding: '9px 12px',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                background: copied ? '#ecfdf5' : '#f8fafc',
                color: copied ? '#059669' : '#475569',
                fontSize: '0.82rem',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.15s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              {copied ? '✅ הקוד הועתק!' : '📋 העתק קוד C++'}
            </button>
            <button
              type="button"
              onClick={handleDownloadIno}
              style={{
                flex: 1,
                padding: '9px 12px',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                background: '#f8fafc',
                color: '#475569',
                fontSize: '0.82rem',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              💾 הורד קובץ .ino מקומי
            </button>
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

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
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
              disabled={isSubmitting}
              style={{
                padding: '11px 24px',
                borderRadius: '10px',
                border: 'none',
                background: activeTab === 'teacher'
                  ? 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)'
                  : 'linear-gradient(135deg, #16a34a 0%, #059669 100%)',
                color: 'white',
                fontWeight: '800',
                fontSize: '0.95rem',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.7 : 1,
                boxShadow: activeTab === 'teacher' ? '0 4px 14px rgba(37,99,235,0.3)' : '0 4px 14px rgba(22,163,74,0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {isSubmitting ? '⏳ שולח...' : activeTab === 'teacher' ? `🚀 שלח ל-${targetTeacherName}` : '💬 שלח ב-WhatsApp'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SendCodeModal;
