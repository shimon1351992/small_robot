import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import axios from 'axios';
import './App.css';
import Smarthouse from './Smarthouse';
import Builder from './Builder';
import RobotSmall from './RobotSmall';
import SrobotBuilder from './SrobotBuilder';
import CodeToBlock from './CodeToBlock';
import WebBlocks from './WebBlocks';
import CodeEditorPage from './CodeEditorPage';
import FreenoveCar from './FreenoveCar';
import TeacherDashboard from './TeacherDashboard';
import AdminDashboard from './AdminDashboard';
import AuthPage from './AuthPage';
import CustomTrackCreator from './CustomTrackCreator';
import CustomTrackStudio from './CustomTrackStudio';
import { getActiveServerUrl } from './serverPort';
import logoImage from './p.png';

import { CAR_4WD_HERO, SMARTHOUSE_HERO, TURTLE_HERO } from './projectImages';

function Home() {
  const [currentUser, setCurrentUser] = React.useState(() => {
    try {
      const saved = sessionStorage.getItem('smartstart_teacher_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [currentStudent, setCurrentStudent] = React.useState(() => {
    try {
      const saved = localStorage.getItem('smartstart_student_session');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [customTracks, setCustomTracks] = React.useState([]);

  React.useEffect(() => {
    async function loadTracks() {
      try {
        const serverUrl = await getActiveServerUrl();
        const res = await axios.get(`${serverUrl}/api/custom-tracks`);
        if (res.data && res.data.success && Array.isArray(res.data.tracks)) {
          setCustomTracks(res.data.tracks);
        }
      } catch (e) {
        console.log('Could not fetch custom tracks:', e);
      }
    }
    loadTracks();
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem('smartstart_teacher_user');
    localStorage.removeItem('smartstart_student_session');
    window.location.href = '/';
  };

  const handleDeleteCustomTrack = async (e, trackId, trackTitle) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm(`האם אתה בטוח שברצונך למחוק את המסלול "${trackTitle}"?`)) return;

    try {
      const serverUrl = await getActiveServerUrl();
      const res = await axios.delete(`${serverUrl}/api/custom-tracks/${trackId}`);
      if (res.data && res.data.success) {
        setCustomTracks(prev => prev.filter(t => (t.id || t.trackId) !== trackId));
      } else {
        alert('שגיאה במחיקת המסלול');
      }
    } catch (err) {
      console.error('Error deleting custom track:', err);
      alert('שגיאה בתקשורת עם השרת במחיקת המסלול');
    }
  };

  const learningTracks = [
    {
      to: "/FreenoveCar",
      title: "רובוט מכונית 4WD Pro",
      description: "הרכבה וכיול 4WD Pro, מנוע סרוו Pan-Tilt, מעקב אחר קו, עקיפת מכשולים ושליטה ב-Wi-Fi.",
      imgUrl: CAR_4WD_HERO,
      badges: ["4WD Pro", "ESP32", "Wi-Fi & App"],
      gradient: "linear-gradient(135deg, #4F46E5 0%, #7E22CE 100%)",
      glow: "0 0 30px rgba(79, 70, 229, 0.3)"
    },
    {
      to: "/RobotSmall",
      title: "רובוט צב חכם Keyestudio",
      description: "הרכבה מכאנית מפורטת צעד-אחר-צעד, בקרת מנועים, חיישנים וניווט אוטונומי.",
      imgUrl: TURTLE_HERO,
      badges: ["KS0558 V3.0", "רובוטיקה", "ניווט"],
      gradient: "linear-gradient(135deg, #FF9900 0%, #FF5500 100%)",
      glow: "0 0 30px rgba(255, 153, 0, 0.3)"
    },
    {
      to: "/smarthouse",
      title: "בית חכם IoT",
      description: "בניית בית חכם אוטומטי, תכנות 13 חיישנים, מנועים, מסך LCD, RFID ותקשורת ענן.",
      imgUrl: SMARTHOUSE_HERO,
      badges: ["KS5009 ESP32", "חיישנים", "IoT Cloud"],
      gradient: "linear-gradient(135deg, #FF007A 0%, #FF758C 100%)",
      glow: "0 0 30px rgba(255, 0, 122, 0.3)"
    }
  ];

  // Filter tracks only for students who logged in with specific class code
  const visibleTracks = React.useMemo(() => {
    const allTracks = [
      ...learningTracks,
      ...customTracks.map(trk => ({
        to: `/track/custom/${trk.id || trk.trackId}`,
        title: trk.title,
        description: trk.description,
        imgUrl: trk.coverImage,
        badges: trk.badges || ['AI Custom', trk.targetBoard?.toUpperCase() || 'ESP32'],
        gradient: trk.gradient || 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
        glow: trk.glow || '0 0 30px rgba(16, 185, 129, 0.3)',
        trackKey: trk.id || trk.trackId
      }))
    ];

    // Teachers always see all tracks!
    if (currentUser) {
      return learningTracks;
    }
    // If student is logged in with assigned tracks, filter accordingly
    if (currentStudent && currentStudent.assignedTracks && !currentStudent.assignedTracks.includes('all')) {
      const assigned = currentStudent.assignedTracks;
      return allTracks.filter(track => {
        if (track.to === '/FreenoveCar' && assigned.includes('car')) return true;
        if (track.to === '/RobotSmall' && assigned.includes('turtle')) return true;
        if (track.to === '/smarthouse' && assigned.includes('house')) return true;
        if (track.trackKey && assigned.includes(track.trackKey)) return true;
        return false;
      });
    }
    return learningTracks;
  }, [currentUser, currentStudent, learningTracks, customTracks]);

  const devTools = [
    {
      to: "/builder",
      title: "סביבת פיתוח בלוקים",
      description: "סביבת פיתוח חופשית בבלוקים ל-Arduino ו-ESP32, כולל מחולל בלוקים ב-AI מובנה, קומפילציה וצריבה ישירה.",
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
          <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
          <line x1="12" y1="22.08" x2="12" y2="12"/>
        </svg>
      ),
      badges: ["Arduino Studio", "AI Block Builder", "ESP32 Flashing"],
      gradient: "linear-gradient(135deg, #4F46E5 0%, #3B82F6 100%)",
      glow: "0 0 30px rgba(79, 70, 229, 0.3)"
    },
    {
      to: "/WebBlocks",
      title: "פיתוח אתרים בבלוקים",
      description: "פיתוח אתרים ואפליקציות רשת בבלוקים, כולל מחולל בלוקי HTML/CSS/JS ב-AI ותצוגת Monaco Editor.",
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
          <line x1="8" y1="21" x2="16" y2="21"/>
          <line x1="12" y1="17" x2="12" y2="21"/>
        </svg>
      ),
      badges: ["HTML5 / CSS3", "AI Web Blocks", "Monaco Editor"],
      gradient: "linear-gradient(135deg, #0EA5E9 0%, #06B6D4 100%)",
      glow: "0 0 30px rgba(14, 165, 233, 0.3)"
    },
    {
      to: "/CodeEditor",
      title: "סביבת פיתוח ארדואינו",
      description: "עורך קוד מקצועי מבוסס VS Code לכתיבת קוד C++ ו-Arduino נקי עם שמירה והורדת קובצי .ino.",
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 18 22 12 16 6"/>
          <polyline points="8 6 2 12 8 18"/>
        </svg>
      ),
      badges: ["VS Code Engine", "C++ / Arduino", "Live Preview"],
      gradient: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
      glow: "0 0 30px rgba(99, 102, 241, 0.3)"
    }
  ];

  // If student is logged in, show the dedicated clean Classroom Track Selector
  if (currentStudent && !currentUser) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #090d16 0%, #1e1b4b 60%, #312e81 100%)',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        direction: 'rtl',
        fontFamily: "'Rubik', system-ui, -apple-system, sans-serif"
      }}>
        {/* Top Navbar */}
        <header style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px 36px',
          background: 'rgba(15, 23, 42, 0.65)',
          borderBottom: '1px solid rgba(129, 140, 248, 0.2)',
          backdropFilter: 'blur(16px)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <span style={{
              fontSize: '0.95rem',
              fontWeight: '800',
              padding: '8px 18px',
              borderRadius: '30px',
              background: 'rgba(99, 102, 241, 0.2)',
              border: '1px solid rgba(129, 140, 248, 0.4)',
              color: '#c7d2fe',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              כיתה: <b style={{ color: '#ffffff' }}>{currentStudent.className}</b>
            </span>

            <span style={{
              fontSize: '0.95rem',
              fontWeight: '800',
              padding: '8px 18px',
              borderRadius: '30px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(52, 211, 153, 0.35)',
              color: '#a7f3d0',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              תלמיד: <b style={{ color: '#ffffff' }}>{currentStudent.studentName}</b>
            </span>

            {currentStudent.teacherName && (
              <span style={{ fontSize: '0.88rem', color: '#94a3b8', fontWeight: '600' }}>
                מורה: {currentStudent.teacherName}
              </span>
            )}
          </div>

          <button
            onClick={handleLogout}
            style={{
              padding: '9px 20px',
              borderRadius: '14px',
              border: '1.5px solid rgba(239, 68, 68, 0.4)',
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#fca5a5',
              fontWeight: '800',
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 15px rgba(239, 68, 68, 0.15)',
              transition: 'all 0.2s'
            }}
          >
            יציאה מכיתה
          </button>
        </header>

        {/* Main Content Area */}
        <main style={{
          flex: 1,
          maxWidth: '1200px',
          width: '100%',
          margin: '0 auto',
          padding: '48px 24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          boxSizing: 'border-box'
        }}>
          {/* Welcome Banner */}
          <div style={{ textAlign: 'center', marginBottom: '40px', maxWidth: '750px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 22px',
              borderRadius: '30px',
              background: 'rgba(129, 140, 248, 0.15)',
              border: '1px solid rgba(129, 140, 248, 0.35)',
              color: '#a5b4fc',
              fontSize: '0.92rem',
              fontWeight: '800',
              marginBottom: '18px'
            }}>
              מרחב הלמידה והפרויקטים של הכיתה
            </div>

            <h1 style={{
              fontSize: 'clamp(2rem, 3.8vw, 3rem)',
              fontWeight: '900',
              margin: '0 0 14px 0',
              background: 'linear-gradient(135deg, #ffffff 0%, #c7d2fe 60%, #38bdf8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              lineHeight: '1.25'
            }}>
              {visibleTracks.length === 1 
                ? `שלום ${currentStudent.studentName}, הפרויקט שלך מוכן להתחלה`
                : `שלום ${currentStudent.studentName}, בחר פרויקט להתחלה`}
            </h1>

            <p style={{
              fontSize: '1.12rem',
              color: '#cbd5e1',
              margin: 0,
              lineHeight: '1.7',
              fontWeight: '400'
            }}>
              {visibleTracks.length === 1 
                ? `המורה שלך שייך לכיתה את הפרויקט הבא. לחץ על כניסה לפרויקט כדי לפתוח את שיעורי ה-CAD, סביבת הבלוקים והקוד:`
                : `המורה שלך שייך לכיתה ${visibleTracks.length} מסלולי למידה והרכבה מעשיים. לחץ על הפרויקט שברצונך ללמוד כדי לפתוח את שיעורי ה-CAD, הבלוקים והקוד:`}
            </p>
          </div>

          {/* Cards Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: visibleTracks.length === 1 ? '1fr' : `repeat(auto-fit, minmax(340px, 1fr))`,
            gap: '32px',
            width: '100%',
            maxWidth: visibleTracks.length === 1 ? '480px' : visibleTracks.length === 2 ? '900px' : '1150px'
          }}>
            {visibleTracks.map((mod, index) => (
              <div
                key={index}
                style={{
                  background: 'rgba(15, 23, 42, 0.75)',
                  border: '2px solid rgba(129, 140, 248, 0.3)',
                  borderRadius: '26px',
                  overflow: 'hidden',
                  boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
                  backdropFilter: 'blur(20px)',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.3s ease',
                  boxSizing: 'border-box'
                }}
              >
                {/* Prototype Image Container */}
                {mod.imgUrl && (
                  <div style={{
                    width: '100%',
                    height: '240px',
                    background: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px',
                    boxSizing: 'border-box',
                    borderBottom: '1.5px solid rgba(129, 140, 248, 0.2)'
                  }}>
                    <img
                      src={mod.imgUrl}
                      alt={mod.title}
                      style={{
                        maxWidth: '90%',
                        maxHeight: '90%',
                        objectFit: 'contain',
                        display: 'block'
                      }}
                    />
                  </div>
                )}

                <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
                    {mod.badges.map((badge, bIdx) => (
                      <span
                        key={bIdx}
                        style={{
                          fontSize: '0.78rem',
                          fontWeight: '800',
                          padding: '4px 10px',
                          borderRadius: '8px',
                          background: 'rgba(99, 102, 241, 0.2)',
                          color: '#a5b4fc',
                          border: '1px solid rgba(129, 140, 248, 0.3)'
                        }}
                      >
                        {badge}
                      </span>
                    ))}
                  </div>

                  <h3 style={{
                    fontSize: '1.5rem',
                    fontWeight: '800',
                    color: '#ffffff',
                    margin: '0 0 10px 0'
                  }}>
                    {mod.title}
                  </h3>

                  <p style={{
                    fontSize: '0.98rem',
                    color: '#cbd5e1',
                    lineHeight: '1.65',
                    margin: '0 0 24px 0',
                    flex: 1
                  }}>
                    {mod.description}
                  </p>

                  <Link
                    to={mod.to}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '15px 24px',
                      borderRadius: '16px',
                      background: mod.gradient || 'linear-gradient(135deg, #4F46E5 0%, #7E22CE 100%)',
                      color: '#ffffff',
                      textDecoration: 'none',
                      fontWeight: '800',
                      fontSize: '1.05rem',
                      boxShadow: '0 10px 25px rgba(79, 70, 229, 0.4)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <span>כניסה לפרויקט</span>
                    <span>←</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </main>

        {/* Footer */}
        <footer style={{
          padding: '18px 24px',
          textAlign: 'center',
          fontSize: '0.85rem',
          color: '#64748b',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          background: 'rgba(15, 23, 42, 0.5)'
        }}>
          SmartStart Web Platform © {new Date().getFullYear()} - מרחב למידה לכיתה
        </footer>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Header Navbar (Transparent, Seamless) */}
      <header className="app-header" style={{ display: 'flex', justifyContent: 'flex-start', background: 'transparent', borderBottom: 'none', boxShadow: 'none', padding: '18px 32px' }}>
        {/* Navigation & Red Logout Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {currentUser ? (
            <>
              <Link 
                to="/teacher" 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                  color: 'white',
                  padding: '9px 18px',
                  borderRadius: '14px',
                  textDecoration: 'none',
                  fontWeight: '700',
                  fontSize: '0.9rem',
                  boxShadow: '0 4px 14px rgba(37,99,235,0.25)'
                }}
              >
                מרחב מורה
              </Link>

              <button
                onClick={handleLogout}
                style={{
                  padding: '9px 18px',
                  borderRadius: '14px',
                  border: '1.5px solid #fecaca',
                  background: '#fef2f2',
                  color: '#dc2626',
                  fontWeight: '800',
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 10px rgba(220,38,38,0.06)',
                  transition: 'all 0.2s'
                }}
              >
                התנתק
              </button>
            </>
          ) : currentStudent ? (
            <>
              <span style={{
                fontSize: '0.9rem',
                fontWeight: '800',
                padding: '8px 16px',
                borderRadius: '12px',
                background: '#eff6ff',
                color: '#1d4ed8',
                border: '1.5px solid #bfdbfe',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                כיתה: <b>{currentStudent.className}</b> | תלמיד: <b>{currentStudent.studentName}</b>
              </span>

              <button
                onClick={handleLogout}
                style={{
                  padding: '9px 18px',
                  borderRadius: '14px',
                  border: '1.5px solid #fecaca',
                  background: '#fef2f2',
                  color: '#dc2626',
                  fontWeight: '800',
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 10px rgba(220,38,38,0.06)',
                  transition: 'all 0.2s'
                }}
              >
                יציאה מכיתה
              </button>
            </>
          ) : (
            <Link 
              to="/" 
              style={{
                padding: '9px 20px',
                borderRadius: '14px',
                background: '#4f46e5',
                color: '#ffffff',
                textDecoration: 'none',
                fontWeight: '700',
                fontSize: '0.9rem',
                boxShadow: '0 4px 14px rgba(79,70,229,0.3)'
              }}
            >
              כניסה / הרשמה
            </Link>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        {/* Personalized Welcome Greeting */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '10px',
          padding: '8px 22px',
          background: 'linear-gradient(135deg, rgba(238, 242, 255, 0.9) 0%, rgba(224, 231, 255, 0.9) 100%)',
          border: '1.5px solid rgba(199, 210, 254, 0.85)',
          borderRadius: '30px',
          boxShadow: '0 4px 15px rgba(79, 70, 229, 0.08)',
          marginBottom: '22px'
        }}>
          <span style={{
            fontSize: '1.15rem',
            fontWeight: '800',
            color: '#0f172a',
            letterSpacing: '-0.2px'
          }}>
            שלום, <b style={{ color: '#4338ca' }}>
              {currentUser ? (currentUser.fullName || currentUser.username) : currentStudent ? currentStudent.studentName : 'אורח'}
            </b>
          </span>
          <span style={{
            fontSize: '0.78rem',
            padding: '3px 10px',
            borderRadius: '12px',
            background: '#dcfce7',
            color: '#15803d',
            fontWeight: '800'
          }}>
            {currentUser ? 'מרחב מורה פעיל' : currentStudent ? `כיתת ${currentStudent.className}` : 'מרחב למידה פעיל'}
          </span>
        </div>

        <h1 className="hero-title">
          גלה, בנה וחקור את <br />
          <span className="hero-title-gradient">עולם הרובוטיקה והתכנות</span>
        </h1>
        <p className="hero-subtitle">
          ממשק אינטראקטיבי המשלב מסלולי למידה מובנים, סביבות פיתוח בבלוקים ל-Arduino ובניית אתרים,
          עם מחולל AI מובנה וצריבה ישירה לרכיבים.
        </p>

        {/* Quick Stats Bar */}
        <div className="stats-bar">
          <div className="stat-item">
            <span className="stat-number">3</span>
            <span className="stat-label">מסלולי לימוד</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <span className="stat-number">4</span>
            <span className="stat-label">סביבות פיתוח</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <span className="stat-number">100+</span>
            <span className="stat-label">בלוקים ורכיבים</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <span className="stat-number">100%</span>
            <span className="stat-label">אינטראקטיבי</span>
          </div>
        </div>
      </section>

      {/* SECTION 1: LEARNING TRACKS */}
      <section className="modules-section">
        <div className="section-header">
          <h2 className="section-title">
            <div className="section-title-bar" style={{ background: 'linear-gradient(180deg, #FF007A 0%, #FF9900 100%)' }}></div>
            מסלולי למידה מודרכים
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.95rem', marginTop: '4px' }}>
            מסלולי למידה מובנים צעד-אחר-צעד עם תרגול מעשי וסימולציות חומרה
          </p>
        </div>

        <div className="cards-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', marginBottom: '48px' }}>
          {visibleTracks.map((mod, index) => (
            <Link 
              key={index} 
              to={mod.to} 
              className="feature-card"
              style={{
                '--card-gradient': mod.gradient,
                '--card-glow': mod.glow
              }}
            >
              {/* FULL COMPLETED PROTOTYPE IMAGE PREVIEW BANNER (CLEAN WHITE BG & SHARP CONTAINED IMAGE) */}
              {mod.imgUrl && (
                <div 
                  style={{ 
                    width: '100%', 
                    height: '210px', 
                    borderRadius: '18px', 
                    overflow: 'hidden', 
                    marginBottom: '18px', 
                    background: '#ffffff',
                    border: '1.5px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '16px',
                    boxSizing: 'border-box',
                    boxShadow: '0 4px 16px rgba(15,23,42,0.04)'
                  }}
                >
                  <img 
                    src={mod.imgUrl} 
                    alt={mod.title}
                    style={{ 
                      maxWidth: '92%', 
                      maxHeight: '92%', 
                      objectFit: 'contain',
                      objectPosition: 'center',
                      display: 'block'
                    }}
                  />
                </div>
              )}

              <div className="card-content">
                <h3 className="card-title" style={{ fontSize: '1.35rem', fontWeight: '800', marginBottom: '8px' }}>{mod.title}</h3>
                <p className="card-description">{mod.description}</p>
              </div>

              <div className="card-action">
                <span className="action-btn-text">
                  כניסה למסלול
                  <span className="arrow-icon">←</span>
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* SECTION 1.5: AI CUSTOM TRACKS (מסלולי למידה אישיים שנוצרו ב-AI) */}
        <div className="section-header" style={{ marginTop: '36px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 className="section-title">
                <div className="section-title-bar" style={{ background: 'linear-gradient(180deg, #059669 0%, #10B981 100%)' }}></div>
                מסלולי למידה אישיים (AI)
              </h2>
              <p style={{ color: '#64748b', fontSize: '0.95rem', marginTop: '4px' }}>
                מסלולי למידה והרכבה שנוצרו באמצעות סוכן ה-AI, משיכת מדריכים מהאינטרנט והעלאת קבצים
              </p>
            </div>

            <Link
              to="/custom-track-creator"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
                color: '#ffffff',
                textDecoration: 'none',
                fontWeight: '800',
                fontSize: '0.92rem',
                boxShadow: '0 4px 15px rgba(16, 185, 129, 0.28)',
                transition: 'all 0.2s ease'
              }}
            >
              <span>+ צור מסלול למידה חדש ב-AI</span>
            </Link>
          </div>
        </div>

        <div className="cards-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', marginBottom: '48px' }}>
          {customTracks.map((trk, index) => (
            <Link
              key={index}
              to={`/track/custom/${trk.id || trk.trackId}`}
              className="feature-card"
              style={{
                position: 'relative',
                '--card-gradient': trk.gradient || 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
                '--card-glow': trk.glow || '0 0 30px rgba(16, 185, 129, 0.25)'
              }}
            >
              {/* Delete Button */}
              <button
                type="button"
                onClick={(e) => handleDeleteCustomTrack(e, trk.id || trk.trackId, trk.title)}
                title="מחק מסלול זה"
                style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  zIndex: 10,
                  background: 'rgba(255, 255, 255, 0.92)',
                  border: '1.5px solid #fca5a5',
                  borderRadius: '10px',
                  padding: '5px 10px',
                  color: '#dc2626',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: '800',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  transition: 'all 0.2s',
                  fontFamily: 'inherit'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#dc2626';
                  e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.92)';
                  e.currentTarget.style.color = '#dc2626';
                }}
              >
                <span>🗑️</span>
                <span>מחק</span>
              </button>

              {trk.coverImage && (
                <div 
                  style={{ 
                    width: '100%', 
                    height: '210px', 
                    borderRadius: '18px', 
                    overflow: 'hidden', 
                    marginBottom: '18px', 
                    background: '#ffffff',
                    border: '1.5px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '16px',
                    boxSizing: 'border-box',
                    boxShadow: '0 4px 16px rgba(15,23,42,0.04)'
                  }}
                >
                  <img 
                    src={trk.coverImage} 
                    alt={trk.title}
                    style={{ 
                      maxWidth: '92%', 
                      maxHeight: '92%', 
                      objectFit: 'contain',
                      objectPosition: 'center',
                      display: 'block'
                    }}
                  />
                </div>
              )}

              <div className="card-content">
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                  {trk.badges?.map((b, bIdx) => (
                    <span key={bIdx} className="tag-badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#059669', border: '1px solid rgba(16, 185, 129, 0.25)' }}>{b}</span>
                  ))}
                </div>
                <h3 className="card-title" style={{ fontSize: '1.35rem', fontWeight: '800', marginBottom: '8px' }}>{trk.title}</h3>
                <p className="card-description">{trk.description}</p>
              </div>

              <div className="card-action">
                <span className="action-btn-text" style={{ color: '#059669' }}>
                  כניסה למסלול
                  <span className="arrow-icon">←</span>
                </span>
              </div>
            </Link>
          ))}

          {/* Action Card to create new Track */}
          <Link
            to="/custom-track-creator"
            className="feature-card"
            style={{
              border: '2px dashed rgba(16, 185, 129, 0.45)',
              background: 'rgba(240, 253, 244, 0.6)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: '36px 24px',
              minHeight: '260px',
              textDecoration: 'none',
              borderRadius: '24px'
            }}
          >
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              fontWeight: '800',
              marginBottom: '14px'
            }}>
              +
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', margin: '0 0 6px 0' }}>
              צור מסלול חדש ב-AI
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#64748b', margin: 0, maxWidth: '280px' }}>
              הגדר רכיבים, העלה תמונות או הדבק קישור לאתר מדריך וה-AI ייצור מסלול שלם
            </p>
          </Link>
        </div>

        {/* SECTION 2: DEVELOPER TOOLS */}
        <div className="section-header" style={{ marginTop: '20px' }}>
          <h2 className="section-title">
            <div className="section-title-bar" style={{ background: 'linear-gradient(180deg, #4F46E5 0%, #00F260 100%)' }}></div>
            סביבות פיתוח וכלים
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.95rem', marginTop: '4px' }}>
            סביבות פיתוח חופשיות ל-Arduino ובניית אתרים עם מחולל בלוקים ב-AI מובנה, עריכת קוד C++ וצריבה
          </p>
        </div>

        <div className="cards-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
          {devTools.map((mod, index) => (
            <Link 
              key={index} 
              to={mod.to} 
              className="feature-card"
              style={{
                '--card-gradient': mod.gradient,
                '--card-glow': mod.glow
              }}
            >
              <div className="card-top">
                <div className="card-icon-box">{mod.icon}</div>
                <div className="card-tags">
                  {mod.badges.map((badge, bIdx) => (
                    <span key={bIdx} className="tag-badge">{badge}</span>
                  ))}
                </div>
              </div>

              <div className="card-content">
                <h3 className="card-title">{mod.title}</h3>
                <p className="card-description">{mod.description}</p>
              </div>

              <div className="card-action">
                <span className="action-btn-text">
                  כניסה לסביבה
                  <span className="arrow-icon">←</span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="app-footer">
        <div>SmartStart Web Platform © {new Date().getFullYear()} - כל הזכויות שמורות</div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        {/* 🔐 Root is the clean Registration / Login Portal */}
        <Route path="/" element={<AuthPage />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/register" element={<AuthPage />} />

        {/* 🚀 Interactive Learning Tracks & Studio */}
        <Route path="/tracks" element={<Home />} />
        <Route path="/home" element={<Home />} />

        <Route path="/custom-track-creator" element={<CustomTrackCreator />} />
        <Route path="/track/custom/:id" element={<CustomTrackStudio />} />

        <Route path="/teacher" element={<TeacherDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/smarthouse" element={<Smarthouse />} />
        <Route path="/builder" element={<Builder />} />
        <Route path="/RobotSmall" element={<RobotSmall />} />
        <Route path="/SrobotBuilder" element={<SrobotBuilder />} />
        <Route path="/CodeToBlock" element={<CodeToBlock />} />
        <Route path="/WebBlocks" element={<WebBlocks />} />
        <Route path="/CodeEditor" element={<CodeEditorPage />} />
        <Route path="/FreenoveCar" element={<FreenoveCar />} />
      </Routes>
    </Router>
  );
}

export default App;