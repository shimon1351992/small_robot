import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getActiveServerUrl } from './serverPort';
import logoImage from './p.png';

function AuthPage() {
  const navigate = useNavigate();
  // 'student' | 'login' | 'pricing' | 'register'
  const [authMode, setAuthMode] = useState('student');
  
  // Student form state
  const [studentClassCode, setStudentClassCode] = useState('');
  const [studentName, setStudentName] = useState('');

  // Selected pricing plan for teacher registration
  const [selectedPlan, setSelectedPlan] = useState('pro'); // 'basic' | 'pro' | 'enterprise'

  // Teacher Login form state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Teacher Register form state
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regEmail, setRegEmail] = useState('');

  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // Check existing session
  useEffect(() => {
    try {
      const studentSession = localStorage.getItem('smartstart_student_session');
      if (studentSession) {
        const parsed = JSON.parse(studentSession);
        if (parsed && parsed.classCode && parsed.studentName) {
          setStudentClassCode(parsed.classCode);
          setStudentName(parsed.studentName);
        }
      }
    } catch (e) {}
  }, []);

  // 1. 🎓 Student Class Login Handler
  const handleStudentLogin = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setIsAuthLoading(true);
    setAuthError('');
    setAuthSuccess('');

    const cleanCode = studentClassCode.trim().toUpperCase();
    const cleanName = studentName.trim();

    if (!cleanCode || !cleanName) {
      setAuthError('נא להזין קוד כיתה ואת שמך המלא');
      setIsAuthLoading(false);
      return;
    }

    try {
      const serverUrl = await getActiveServerUrl();
      const res = await fetch(`${serverUrl}/api/student/class-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classCode: cleanCode,
          studentName: cleanName
        })
      });

      const data = await res.json();
      if (data.success && data.student) {
        // Save student session
        localStorage.setItem('smartstart_student_session', JSON.stringify(data.student));

        // Unlock courses in localStorage
        const activeLicenses = [
          {
            code: cleanCode,
            targetTrack: (data.student.assignedTracks && data.student.assignedTracks.length === 1) ? data.student.assignedTracks[0] : 'all',
            ownerName: data.student.className,
            unlockedAt: new Date().toISOString()
          }
        ];
        localStorage.setItem('smartstart_active_licenses', JSON.stringify(activeLicenses));

        setAuthSuccess(data.message || 'התחברת בהצלחה!');

        setTimeout(() => {
          navigate('/tracks');
        }, 600);
      } else {
        setAuthError(data.error || 'קוד כיתה שגוי או שאינו קיים במערכת');
      }
    } catch (err) {
      // Fallback demo support
      const activeLicenses = [
        {
          code: cleanCode,
          targetTrack: 'all',
          ownerName: 'כיתת רובוטיקה',
          unlockedAt: new Date().toISOString()
        }
      ];
      localStorage.setItem('smartstart_active_licenses', JSON.stringify(activeLicenses));
      localStorage.setItem('smartstart_student_session', JSON.stringify({
        studentName: cleanName,
        classCode: cleanCode,
        className: 'כיתת רובוטיקה',
        teacherName: 'המורה',
        assignedTracks: ['car', 'turtle', 'house']
      }));
      setAuthSuccess(`ברוך הבא ${cleanName}!`);
      setTimeout(() => navigate('/tracks'), 600);
    } finally {
      setIsAuthLoading(false);
    }
  };

  // 2. 🔑 Teacher Login Handler
  const handleTeacherLogin = async (e) => {
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
        localStorage.removeItem('smartstart_student_session');
        sessionStorage.setItem('smartstart_teacher_user', JSON.stringify(data.teacher));
        navigate('/tracks');
      } else {
        setAuthError(data.error || 'שם משתמש או סיסמה שגויים');
      }
    } catch (err) {
      if ((loginUsername.toLowerCase() === 'shimon' || loginUsername === 'המורה שמעון') && (loginPassword === '123' || loginPassword === '123456' || loginPassword === 'teacher2026')) {
        const teacher = { id: 1, fullName: 'המורה שמעון', username: 'shimon' };
        localStorage.removeItem('smartstart_student_session');
        sessionStorage.setItem('smartstart_teacher_user', JSON.stringify(teacher));
        navigate('/tracks');
      } else {
        setAuthError('שם משתמש או סיסמה שגויים. אנא נסה שוב.');
      }
    } finally {
      setIsAuthLoading(false);
    }
  };

  // 3. ✨ Teacher Register Handler
  const handleTeacherRegister = async (e) => {
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
          email: regEmail.trim(),
          plan: selectedPlan
        })
      });

      const data = await res.json();
      if (data.success && data.teacher) {
        localStorage.removeItem('smartstart_student_session');
        sessionStorage.setItem('smartstart_teacher_user', JSON.stringify(data.teacher));
        navigate('/tracks');
      } else {
        setAuthError(data.error || 'שגיאה ברישום משתמש חדש');
      }
    } catch (err) {
      const teacher = {
        id: Date.now(),
        fullName: regFullName.trim(),
        username: regUsername.trim().toLowerCase(),
        plan: selectedPlan
      };
      localStorage.removeItem('smartstart_student_session');
      sessionStorage.setItem('smartstart_teacher_user', JSON.stringify(teacher));
      navigate('/tracks');
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Pricing Plans definition
  const pricingPlans = [
    {
      id: 'basic',
      name: 'מסלול בסיסי',
      badge: 'יחיד / כיתה אחת',
      badgeColor: '#059669',
      price: '₪149',
      period: 'לחודש (בדיקה: חינם)',
      description: 'מסלול לימוד מובנה 1 לבחירה לכל הכיתה, עד 35 תלמידים.',
      features: [
        '🏎️ מסלול מובנה 1 לבחירה (מכונית / צב / בית חכם)',
        '👥 עד 35 תלמידים במקביל',
        '🔑 הפקת קוד כיתה ייחודי',
        '💻 גישה לסטודיו ולסביבות הפיתוח',
        '⚡ קומפילציה וצריבה ישירה'
      ]
    },
    {
      id: 'pro',
      name: 'מסלול פרו מורה',
      badge: 'הפופולרי ביותר 🔥',
      badgeColor: '#4f46e5',
      price: '₪299',
      period: 'לחודש (בדיקה: חינם)',
      description: 'כל 3 מסלולי הלימוד המובנים, ניהול כיתות מרובות עד 100 תלמידים.',
      features: [
        '🌟 כל 3 מסלולי הלימוד המובנים',
        '👥 עד 100 תלמידים במקביל',
        '🏫 פתיחה וניהול כיתות ללא הגבלה',
        '💬 שליחת הזמנה לוואטסאפ בלחיצה',
        '📥 צפייה בהגשות והורדת קובצי .ino',
        '🤖 מחולל בלוקים ב-AI מובנה'
      ]
    },
    {
      id: 'enterprise',
      name: 'מסלול מוסדי / רשת',
      badge: 'בית ספר שלם 🏛️',
      badgeColor: '#7c3aed',
      price: '₪699',
      period: 'לחודש (בדיקה: חינם)',
      description: 'כל המסלולים + יצירת מסלול מותאם אישית (Beta), ללא הגבלת תלמידים.',
      features: [
        '✨ כל המסלולים + יצירת מסלול מותאם (Beta)',
        '👥 תלמידים וכיתות ללא הגבלה',
        '💾 שמירת פרויקטים אישיים ב-SQL',
        '🎓 תמיכה טכנית והדרכת מורים',
        '📊 דוחות ביצועים והתקדמות'
      ]
    }
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at 50% 12%, rgba(79, 70, 229, 0.12) 0%, transparent 55%), radial-gradient(circle at 10% 85%, rgba(59, 130, 246, 0.1) 0%, transparent 45%), radial-gradient(circle at 90% 75%, rgba(147, 51, 234, 0.08) 0%, transparent 45%), #f8fafc',
      fontFamily: "'Rubik', system-ui, -apple-system, sans-serif",
      direction: 'rtl',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      position: 'relative'
    }}>
      {/* Clean Minimalist Top Bar */}
      <header style={{
        position: 'absolute',
        top: '20px',
        left: '28px',
        zIndex: 10,
        background: 'transparent'
      }}>
        {/* Left: Admin Link */}
        <Link
          to="/admin"
          style={{
            padding: '10px 20px',
            borderRadius: '14px',
            border: '1.5px solid rgba(199, 210, 254, 0.8)',
            background: 'rgba(238, 242, 255, 0.85)',
            backdropFilter: 'blur(10px)',
            color: '#4338ca',
            textDecoration: 'none',
            fontWeight: '800',
            fontSize: '0.9rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 14px rgba(79, 70, 229, 0.1)',
            transition: 'all 0.2s'
          }}
        >
          👑 פאנל מנהל
        </Link>
      </header>

      {/* Main Center Area */}
      <main style={{
        flex: 1,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        marginTop: '-5px'
      }}>
        {/* 🌟 Large Prominent Logo Matching Card Width */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: '16px',
          width: '100%',
          maxWidth: authMode === 'pricing' ? '820px' : '490px',
          height: '210px',
          overflow: 'hidden'
        }}>
          <img
            src={logoImage}
            alt="SmartStart IoT"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              transform: 'scale(1.4)',
              filter: 'drop-shadow(0 12px 24px rgba(30, 58, 138, 0.12))',
              display: 'block'
            }}
          />
        </div>

        {/* 📦 Container Card */}
        <div style={{
          width: '100%',
          maxWidth: authMode === 'pricing' ? '920px' : '490px',
          background: 'rgba(255, 255, 255, 0.94)',
          backdropFilter: 'blur(20px)',
          borderRadius: '28px',
          border: '1.5px solid rgba(226, 232, 240, 0.95)',
          boxShadow: '0 25px 65px -12px rgba(15, 23, 42, 0.09), 0 0 0 1px rgba(255, 255, 255, 0.8) inset',
          padding: authMode === 'pricing' ? '36px 28px' : '36px 32px',
          textAlign: 'center',
          boxSizing: 'border-box'
        }}>
          {/* Main 3 Navigation Tabs */}
          <div style={{
            display: 'flex',
            background: '#f1f5f9',
            borderRadius: '14px',
            padding: '5px',
            marginBottom: '26px',
            gap: '6px'
          }}>
            <button
              type="button"
              onClick={() => { setAuthMode('student'); setAuthError(''); setAuthSuccess(''); }}
              style={{
                flex: 1,
                padding: '11px 12px',
                borderRadius: '10px',
                border: 'none',
                background: authMode === 'student' ? '#ffffff' : 'transparent',
                color: authMode === 'student' ? '#0f172a' : '#64748b',
                fontWeight: '800',
                fontSize: '0.92rem',
                cursor: 'pointer',
                fontFamily: 'inherit',
                boxShadow: authMode === 'student' ? '0 3px 10px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              🎓 כניסת תלמיד
            </button>

            <button
              type="button"
              onClick={() => { setAuthMode('login'); setAuthError(''); setAuthSuccess(''); }}
              style={{
                flex: 1,
                padding: '11px 12px',
                borderRadius: '10px',
                border: 'none',
                background: authMode === 'login' ? '#ffffff' : 'transparent',
                color: authMode === 'login' ? '#0f172a' : '#64748b',
                fontWeight: '800',
                fontSize: '0.92rem',
                cursor: 'pointer',
                fontFamily: 'inherit',
                boxShadow: authMode === 'login' ? '0 3px 10px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              🔑 כניסת מורה
            </button>

            <button
              type="button"
              onClick={() => { setAuthMode('pricing'); setAuthError(''); setAuthSuccess(''); }}
              style={{
                flex: 1,
                padding: '11px 12px',
                borderRadius: '10px',
                border: 'none',
                background: (authMode === 'pricing' || authMode === 'register') ? '#ffffff' : 'transparent',
                color: (authMode === 'pricing' || authMode === 'register') ? '#0f172a' : '#64748b',
                fontWeight: '800',
                fontSize: '0.92rem',
                cursor: 'pointer',
                fontFamily: 'inherit',
                boxShadow: (authMode === 'pricing' || authMode === 'register') ? '0 3px 10px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              ✨ הרשמה
            </button>
          </div>

          {/* 1. 🎓 STUDENT CLASS CODE LOGIN */}
          {authMode === 'student' && (
            <div>
              <h2 style={{ fontSize: '1.45rem', fontWeight: '800', margin: '0 0 6px 0', color: '#0f172a' }}>
                כניסה לכיתה עם קוד
              </h2>
              <p style={{ color: '#64748b', fontSize: '0.92rem', margin: '0 0 24px 0', fontWeight: '500' }}>
                הזן את קוד הכיתה שקיבלת מהמורה ואת שמך המלא כדי לפתוח את השיעורים
              </p>

              <form onSubmit={handleStudentLogin}>
                <div style={{ marginBottom: '18px', textAlign: 'right' }}>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: '#1e293b', marginBottom: '7px' }}>
                    🔑 קוד כיתה / רישיון: <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={studentClassCode}
                    onChange={(e) => setStudentClassCode(e.target.value.toUpperCase())}
                    placeholder="לדוגמה: CLS-9482 או DEMO-ALL-2026"
                    required
                    style={{
                      width: '100%',
                      padding: '13px 16px',
                      borderRadius: '14px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '1rem',
                      fontFamily: 'inherit',
                      background: '#fcfdfe',
                      color: '#0f172a',
                      textAlign: 'center',
                      letterSpacing: '1px',
                      fontWeight: '800',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '22px', textAlign: 'right' }}>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: '#1e293b', marginBottom: '7px' }}>
                    👤 שם מלא של התלמיד: <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="שם פרטי ומשפחה..."
                    required
                    style={{
                      width: '100%',
                      padding: '13px 16px',
                      borderRadius: '14px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.98rem',
                      fontFamily: 'inherit',
                      background: '#fcfdfe',
                      color: '#0f172a',
                      textAlign: 'right',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {authError && (
                  <div style={{
                    color: '#dc2626',
                    fontSize: '0.9rem',
                    marginBottom: '18px',
                    fontWeight: '700',
                    background: '#fef2f2',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: '1px solid #fecaca'
                  }}>
                    {authError}
                  </div>
                )}

                {authSuccess && (
                  <div style={{
                    color: '#15803d',
                    fontSize: '0.9rem',
                    marginBottom: '18px',
                    fontWeight: '700',
                    background: '#f0fdf4',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: '1px solid #bbf7d0'
                  }}>
                    {authSuccess}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isAuthLoading}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '14px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                    color: '#ffffff',
                    fontWeight: '800',
                    fontSize: '1.05rem',
                    fontFamily: 'inherit',
                    cursor: isAuthLoading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 6px 20px rgba(37, 99, 235, 0.35)',
                    transition: 'all 0.2s'
                  }}
                >
                  {isAuthLoading ? 'מאמת קוד כיתה...' : '🚀 כניסה לכיתה והתחלת למידה'}
                </button>

                <div style={{
                  marginTop: '18px',
                  padding: '9px 14px',
                  background: '#f8fafc',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  fontSize: '0.84rem',
                  color: '#64748b'
                }}>
                  💡 קוד בדיקה מהיר: <b>DEMO-ALL-2026</b>
                </div>
              </form>
            </div>
          )}

          {/* 2. 🔑 TEACHER LOGIN */}
          {authMode === 'login' && (
            <div>
              <h2 style={{ fontSize: '1.45rem', fontWeight: '800', margin: '0 0 6px 0', color: '#0f172a' }}>
                כניסת מורה למערכת
              </h2>
              <p style={{ color: '#64748b', fontSize: '0.92rem', margin: '0 0 24px 0', fontWeight: '500' }}>
                הזן את פרטי ההתחברות שלך כדי להיכנס למרחב הניהול והמסלולים
              </p>

              <form onSubmit={handleTeacherLogin}>
                <div style={{ marginBottom: '18px', textAlign: 'right' }}>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: '#1e293b', marginBottom: '7px' }}>
                    👤 שם משתמש:
                  </label>
                  <input
                    type="text"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    placeholder="הזן שם משתמש..."
                    required
                    style={{
                      width: '100%',
                      padding: '13px 16px',
                      borderRadius: '14px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.98rem',
                      fontFamily: 'inherit',
                      background: '#fcfdfe',
                      color: '#0f172a',
                      textAlign: 'right',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '22px', textAlign: 'right' }}>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: '#1e293b', marginBottom: '7px' }}>
                    🔒 סיסמה:
                  </label>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    style={{
                      width: '100%',
                      padding: '13px 16px',
                      borderRadius: '14px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.98rem',
                      fontFamily: 'inherit',
                      background: '#fcfdfe',
                      color: '#0f172a',
                      textAlign: 'right',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {authError && (
                  <div style={{
                    color: '#dc2626',
                    fontSize: '0.9rem',
                    marginBottom: '18px',
                    fontWeight: '700',
                    background: '#fef2f2',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: '1px solid #fecaca'
                  }}>
                    {authError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isAuthLoading}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '14px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
                    color: '#ffffff',
                    fontWeight: '800',
                    fontSize: '1.02rem',
                    fontFamily: 'inherit',
                    cursor: isAuthLoading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 6px 20px rgba(79, 70, 229, 0.35)',
                    transition: 'all 0.2s'
                  }}
                >
                  {isAuthLoading ? 'מתחבר...' : '🔓 כניסה למערכת'}
                </button>

                <div style={{
                  marginTop: '18px',
                  padding: '9px 14px',
                  background: '#f8fafc',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  fontSize: '0.84rem',
                  color: '#64748b'
                }}>
                  מורה בדיקה: שם משתמש <b>shimon</b> | סיסמה <b>123</b>
                </div>
              </form>
            </div>
          )}

          {/* 3. ✨ TEACHER PRICING PLANS SELECTION */}
          {authMode === 'pricing' && (
            <div>
              <h2 style={{ fontSize: '1.55rem', fontWeight: '800', margin: '0 0 6px 0', color: '#0f172a' }}>
                בחר את מסלול ההוראה המתאים לך 🚀
              </h2>
              <p style={{ color: '#64748b', fontSize: '0.94rem', margin: '0 0 26px 0', fontWeight: '500' }}>
                בחר חבילה להפעלת הקורס ופתיחת כיתות לתלמידים, והמשך להרשמה מיידית
              </p>

              {/* Plans Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '18px',
                marginBottom: '26px',
                textAlign: 'right'
              }}>
                {pricingPlans.map((plan) => (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    style={{
                      background: selectedPlan === plan.id ? '#ffffff' : '#f8fafc',
                      borderRadius: '20px',
                      border: selectedPlan === plan.id ? '2.5px solid #4f46e5' : '1.5px solid #e2e8f0',
                      padding: '24px 20px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      boxShadow: selectedPlan === plan.id ? '0 12px 30px rgba(79,70,229,0.15)' : 'none',
                      transform: selectedPlan === plan.id ? 'translateY(-3px)' : 'none',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <span style={{
                          fontSize: '0.76rem',
                          fontWeight: '800',
                          padding: '4px 10px',
                          borderRadius: '20px',
                          background: `${plan.badgeColor}15`,
                          color: plan.badgeColor
                        }}>
                          {plan.badge}
                        </span>
                        <input
                          type="radio"
                          name="plan"
                          checked={selectedPlan === plan.id}
                          onChange={() => setSelectedPlan(plan.id)}
                          style={{ cursor: 'pointer', accentColor: '#4f46e5' }}
                        />
                      </div>

                      <h3 style={{ fontSize: '1.2rem', fontWeight: '800', margin: '0 0 4px 0', color: '#0f172a' }}>
                        {plan.name}
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', margin: '8px 0 12px 0' }}>
                        <span style={{ fontSize: '1.6rem', fontWeight: '900', color: '#4f46e5' }}>{plan.price}</span>
                        <span style={{ fontSize: '0.82rem', color: '#64748b' }}>{plan.period}</span>
                      </div>
                      <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 16px 0', lineHeight: 1.4 }}>
                        {plan.description}
                      </p>

                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.83rem', color: '#334155', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {plan.features.map((f, idx) => (
                          <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>✓</span> {f}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      type="button"
                      onClick={() => { setSelectedPlan(plan.id); setAuthMode('register'); }}
                      style={{
                        marginTop: '20px',
                        width: '100%',
                        padding: '11px',
                        borderRadius: '12px',
                        border: 'none',
                        background: selectedPlan === plan.id ? 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)' : '#e2e8f0',
                        color: selectedPlan === plan.id ? '#ffffff' : '#334155',
                        fontWeight: '800',
                        fontSize: '0.9rem',
                        fontFamily: 'inherit',
                        cursor: 'pointer',
                        boxShadow: selectedPlan === plan.id ? '0 4px 14px rgba(79,70,229,0.3)' : 'none',
                        transition: 'all 0.2s'
                      }}
                    >
                      {selectedPlan === plan.id ? '✓ בחר מסלול והמשך' : 'בחר מסלול זה'}
                    </button>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <button
                  type="button"
                  onClick={() => setAuthMode('register')}
                  style={{
                    padding: '13px 32px',
                    borderRadius: '14px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
                    color: '#ffffff',
                    fontWeight: '800',
                    fontSize: '1rem',
                    fontFamily: 'inherit',
                    cursor: 'pointer',
                    boxShadow: '0 6px 20px rgba(79,70,229,0.3)'
                  }}
                >
                  המשך להרשמה עם המסלול שנבחר ←
                </button>
              </div>
            </div>
          )}

          {/* 4. 📝 REGISTRATION FORM */}
          {authMode === 'register' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: '800', margin: 0, color: '#0f172a' }}>
                  הרשמה למערכת
                </h2>
                <button
                  type="button"
                  onClick={() => setAuthMode('pricing')}
                  style={{
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    color: '#2563eb',
                    padding: '5px 12px',
                    borderRadius: '10px',
                    fontSize: '0.8rem',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  🔄 שנה מסלול ({selectedPlan.toUpperCase()})
                </button>
              </div>
              <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '0 0 20px 0', fontWeight: '500' }}>
                מלא את הפרטים הבאים כדי לפתוח חשבון מורה וליצור את כיתות הלימוד שלך
              </p>

              <form onSubmit={handleTeacherRegister}>
                <div style={{ marginBottom: '14px', textAlign: 'right' }}>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '700', color: '#1e293b', marginBottom: '6px' }}>
                    🏷️ שם מלא של המורה: <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    placeholder="שם פרטי ומשפחה..."
                    required
                    style={{
                      width: '100%',
                      padding: '12px 15px',
                      borderRadius: '13px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.94rem',
                      fontFamily: 'inherit',
                      background: '#fcfdfe',
                      color: '#0f172a',
                      textAlign: 'right',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '14px', textAlign: 'right' }}>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '700', color: '#1e293b', marginBottom: '6px' }}>
                    👤 שם משתמש לכניסה (באנגלית): <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="teacher_username"
                    required
                    style={{
                      width: '100%',
                      padding: '12px 15px',
                      borderRadius: '13px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.94rem',
                      fontFamily: 'inherit',
                      background: '#fcfdfe',
                      color: '#0f172a',
                      textAlign: 'right',
                      direction: 'ltr',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '14px', textAlign: 'right' }}>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '700', color: '#1e293b', marginBottom: '6px' }}>
                    🔒 סיסמה: <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="בחר סיסמה מאובטחת..."
                    required
                    style={{
                      width: '100%',
                      padding: '12px 15px',
                      borderRadius: '13px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.94rem',
                      fontFamily: 'inherit',
                      background: '#fcfdfe',
                      color: '#0f172a',
                      textAlign: 'right',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '20px', textAlign: 'right' }}>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '700', color: '#1e293b', marginBottom: '6px' }}>
                    📧 אימייל (לקבלת דוחות והגשות):
                  </label>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="teacher@school.edu"
                    style={{
                      width: '100%',
                      padding: '12px 15px',
                      borderRadius: '13px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.94rem',
                      fontFamily: 'inherit',
                      background: '#fcfdfe',
                      color: '#0f172a',
                      textAlign: 'right',
                      direction: 'ltr',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {authError && (
                  <div style={{
                    color: '#dc2626',
                    fontSize: '0.9rem',
                    marginBottom: '18px',
                    fontWeight: '700',
                    background: '#fef2f2',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: '1px solid #fecaca'
                  }}>
                    {authError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isAuthLoading}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '14px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
                    color: '#ffffff',
                    fontWeight: '800',
                    fontSize: '1.02rem',
                    fontFamily: 'inherit',
                    cursor: isAuthLoading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 6px 20px rgba(79, 70, 229, 0.35)',
                    transition: 'all 0.2s'
                  }}
                >
                  {isAuthLoading ? 'יוצר חשבון מורה...' : '✨ הירשם והיכנס למרחב המורה'}
                </button>
              </form>
            </div>
          )}
        </div>
      </main>

      {/* Subtle Footer */}
      <footer style={{
        textAlign: 'center',
        padding: '16px',
        fontSize: '0.82rem',
        color: '#94a3b8'
      }}>
        SmartStart Web Platform © {new Date().getFullYear()} - פלטפורמת למידה ופיתוח לרובוטיקה וקוד
      </footer>
    </div>
  );
}

export default AuthPage;
