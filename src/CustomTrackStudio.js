import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import * as Blockly from 'blockly';
import { javascriptGenerator } from 'blockly/javascript';
import MonacoEditor from 'react-monaco-editor';
import 'blockly/javascript';
import axios from 'axios';
import { registerAllBlocks } from './blockRegistry';
import AIBlockGeneratorModal from './AIBlockGeneratorModal';
import FlashingModal from './FlashingModal';
import SendCodeModal from './SendCodeModal';
import ComPortStatusBadge from './ComPortStatusBadge';
import { getActiveServerUrl } from './serverPort';

registerAllBlocks();

export default function CustomTrackStudio() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [track, setTrack] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Lesson state
  const [selectedLessonId, setSelectedLessonId] = useState('welcome');
  const [completedLessons, setCompletedLessons] = useState({});

  // Code state
  const [code, setCode] = useState('// טוען קוד...');

  // Modals
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isFlashingModalOpen, setIsFlashingModalOpen] = useState(false);
  const [isSendCodeModalOpen, setIsSendCodeModalOpen] = useState(false);
  const [zoomImageSrc, setZoomImageSrc] = useState(null);

  // 1. Fetch Track Data
  useEffect(() => {
    async function loadTrack() {
      setIsLoading(true);
      setError('');
      try {
        const serverUrl = await getActiveServerUrl();
        const res = await axios.get(`${serverUrl}/api/custom-tracks/${id}`);
        if (res.data && res.data.success && res.data.track) {
          const t = res.data.track;
          setTrack(t);
          setSelectedLessonId('welcome');
        } else {
          setError('המסלול לא נמצא במערכת');
        }
      } catch (err) {
        setError(err.response?.data?.error || 'שגיאה בטעינת המסלול מהשרת');
      } finally {
        setIsLoading(false);
      }
    }
    loadTrack();
  }, [id]);

  // Compute flattened lessons and active lesson
  const allLessons = [];
  let totalLessonsCount = 0;
  if (track && track.chapters) {
    track.chapters.forEach(ch => {
      (ch.lessons || []).forEach(l => {
        allLessons.push({ ...l, chapterTitle: ch.title });
        totalLessonsCount++;
      });
    });
  }

  const isWelcomePage = selectedLessonId === 'welcome';
  const currentLesson = isWelcomePage 
    ? { isWelcomePage: true, title: track?.title, description: track?.description }
    : (allLessons.find(l => l.id === selectedLessonId) || allLessons[0] || {});

  const currentChapter = {
    title: currentLesson.chapterTitle || track?.chapters?.[0]?.title || 'פרק 1'
  };

  // Sync Code on Lesson Change
  useEffect(() => {
    if (currentLesson && !currentLesson.isWelcomePage) {
      setCode(currentLesson.code || `// קוד C++ עבור שיעור ${currentLesson.id}\nvoid setup() {\n  Serial.begin(115200);\n}\n\nvoid loop() {\n}`);
    }
  }, [selectedLessonId]);

  // Next Lesson Handler
  const handleNextLesson = () => {
    if (isWelcomePage) {
      if (allLessons.length > 0) {
        setSelectedLessonId(allLessons[0].id);
      }
      return;
    }

    // Mark current done
    setCompletedLessons(prev => ({ ...prev, [selectedLessonId]: true }));

    // Find index
    const currentIdx = allLessons.findIndex(l => l.id === selectedLessonId);
    if (currentIdx !== -1 && currentIdx + 1 < allLessons.length) {
      setSelectedLessonId(allLessons[currentIdx + 1].id);
    } else {
      alert('🎉 כל הכבוד! השלמת את כל השיעורים במסלול!');
    }
  };

  const handleGoBack = () => {
    if (!isWelcomePage) {
      setSelectedLessonId('welcome');
    } else {
      navigate('/tracks');
    }
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Rubik', sans-serif" }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '44px', height: '44px', border: '3px solid #2563eb', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px auto' }}></div>
          <div style={{ fontSize: '1.25rem', fontWeight: '800' }}>טוען את מסלול הלמידה...</div>
        </div>
      </div>
    );
  }

  if (error || !track) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Rubik', sans-serif", direction: 'rtl' }}>
        <div style={{ textAlign: 'center', maxWidth: '440px', padding: '32px', background: '#ffffff', borderRadius: '24px', border: '2px solid #e2e8f0', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>⚠️</div>
          <div style={{ fontSize: '1.4rem', fontWeight: '900', marginBottom: '8px' }}>שגיאה בטעינת המסלול</div>
          <div style={{ color: '#64748b', marginBottom: '24px' }}>{error || 'המסלול המבוקש לא קיים'}</div>
          <button onClick={() => navigate('/tracks')} style={{ padding: '12px 28px', borderRadius: '14px', background: '#2563eb', color: '#fff', border: 'none', fontWeight: '800', cursor: 'pointer', fontFamily: 'inherit' }}>
            חזרה למסך הראשי
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: '#f8fafc',
      direction: 'rtl',
      overflow: 'hidden',
      position: 'relative',
      fontFamily: "'Rubik', system-ui, -apple-system, sans-serif"
    }}>
      {/* 🌟 TOP STUDIO NAVBAR (HIDDEN ON WELCOME LANDING) */}
      {!isWelcomePage && (
        <div style={{
          padding: '12px 28px',
          background: '#ffffff',
          borderBottom: '1.5px solid #e2e8f0',
          boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={() => setSelectedLessonId('welcome')}
              style={{
                textDecoration: 'none',
                background: '#f1f5f9',
                border: '1.5px solid #cbd5e1',
                borderRadius: '12px',
                padding: '8px 16px',
                color: '#1e293b',
                fontWeight: '800',
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>🏠 דף הפתיחה</span>
            </button>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '1.15rem', fontWeight: '900', color: '#0f172a' }}>
                ⚡ עורך קוד וצריבה ללוח ({track.targetBoard?.toUpperCase() || 'ESP32'} / C++)
              </span>
              <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: '600' }}>
                {track.title} | {currentChapter.title} - {currentLesson.title}
              </span>
            </div>
          </div>

          {/* Action Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ComPortStatusBadge />

            <span style={{ padding: '6px 14px', borderRadius: '10px', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', fontWeight: '800', fontSize: '0.84rem' }}>
              ✨ מנוי פעיל
            </span>

            <button 
              onClick={() => setIsAiModalOpen(true)}
              style={{
                padding: '8px 16px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                color: '#ffffff',
                border: 'none',
                fontWeight: '800',
                fontSize: '0.86rem',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(99,102,241,0.25)'
              }}
            >
              ✨ מחולל AI לבלוקים
            </button>

            <button
              onClick={() => setIsFlashingModalOpen(true)}
              style={{
                padding: '8px 18px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                color: '#ffffff',
                border: 'none',
                fontWeight: '900',
                fontSize: '0.88rem',
                cursor: 'pointer',
                boxShadow: '0 2px 10px rgba(16,185,129,0.3)'
              }}
            >
              🚀 צרוב ללוח
            </button>

            <button
              onClick={() => setIsSendCodeModalOpen(true)}
              style={{
                padding: '8px 16px',
                borderRadius: '12px',
                background: '#f1f5f9',
                border: '1.5px solid #cbd5e1',
                color: '#334155',
                fontWeight: '800',
                fontSize: '0.86rem',
                cursor: 'pointer'
              }}
            >
              💾 שמור הגשה
            </button>
          </div>
        </div>
      )}

      {/* 🔙 TOP-LEFT CLEAN BACK BUTTON (FOR WELCOME LANDING) */}
      {isWelcomePage && (
        <button
          onClick={handleGoBack}
          style={{
            position: 'fixed',
            top: '24px',
            left: '24px',
            zIndex: 9999,
            padding: '12px 24px',
            borderRadius: '16px',
            background: 'rgba(255, 255, 255, 0.15)',
            border: '1.5px solid rgba(255, 255, 255, 0.3)',
            color: '#ffffff',
            fontSize: '1rem',
            fontWeight: '900',
            cursor: 'pointer',
            backdropFilter: 'blur(16px)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)',
            transition: 'all 0.25s ease',
            fontFamily: "'Rubik', sans-serif"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
            e.currentTarget.style.transform = 'translateY(-2px) scale(1.03)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
          }}
        >
          <span style={{ fontSize: '1.2rem', lineHeight: '1' }}>←</span>
          <span>חזרה</span>
        </button>
      )}

      {/* MAIN CONTENT AREA */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        
        {/* 📜 SIDEBAR: ALL LESSONS TRACKER (HIDDEN ON WELCOME LANDING) */}
        {!isWelcomePage && (
          <div style={{ width: '340px', background: '#ffffff', borderLeft: '1.5px solid #e2e8f0', display: 'flex', flexDirection: 'column', overflowY: 'auto', flexShrink: 0 }}>
            <div style={{ padding: '18px 20px', background: '#0f172a', color: '#ffffff' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '900', margin: 0 }}>
                תוכנית השיעורים ({track.title})
              </h3>
              <div style={{ fontSize: '0.82rem', color: '#818cf8', marginTop: '4px', fontWeight: '700' }}>
                {Object.keys(completedLessons).length} מתוך {totalLessonsCount} שיעורים הושלמו
              </div>
            </div>

            <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {track.chapters?.map((ch, chIdx) => (
                <div key={chIdx} style={{ borderRadius: '14px', background: '#f8fafc', border: '1.5px solid #e2e8f0', overflow: 'hidden' }}>
                  <div style={{ padding: '10px 14px', background: '#f1f5f9', fontWeight: '900', fontSize: '0.88rem', color: '#334155' }}>
                    {ch.title}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {ch.lessons?.map((les, lIdx) => {
                      const isSelected = les.id === selectedLessonId;
                      const isDone = completedLessons[les.id];
                      return (
                        <button
                          key={lIdx}
                          onClick={() => setSelectedLessonId(les.id)}
                          style={{
                            padding: '11px 14px',
                            textAlign: 'right',
                            background: isSelected ? '#e0e7ff' : '#ffffff',
                            border: 'none',
                            borderBottom: '1px solid #f1f5f9',
                            borderRight: isSelected ? '4px solid #4f46e5' : 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            fontSize: '0.85rem',
                            fontWeight: isSelected ? '900' : '600',
                            color: isSelected ? '#4338ca' : '#475569',
                            fontFamily: 'inherit'
                          }}
                        >
                          <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {les.title}
                          </span>
                          {isDone && <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 📺 CENTER LESSON CONTENT (FULL WIDTH ON WELCOME LANDING) */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', padding: isWelcomePage ? '0' : '24px' }}>
          
          {/* ========================================================================= */}
          {/* 🌌 WELCOME LANDING VIEW (PROTOTYPE SHOWCASE + 3 FEATURES) */}
          {/* ========================================================================= */}
          {isWelcomePage ? (
            <div style={{
              width: '100%',
              minHeight: '100vh',
              background: 'linear-gradient(135deg, #090d16 0%, #1e1b4b 50%, #4f46e5 100%)',
              color: '#ffffff',
              padding: '48px 32px',
              direction: 'rtl',
              boxSizing: 'border-box'
            }}>
              <div style={{ maxWidth: '1350px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '40px' }}>
                
                {/* HERO BANNER & SHOWCASE */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: '36px', alignItems: 'center' }}>
                  <div>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 20px',
                      borderRadius: '30px',
                      background: 'rgba(129, 140, 248, 0.15)',
                      border: '1px solid rgba(129, 140, 248, 0.3)',
                      color: '#a5b4fc',
                      fontSize: '0.9rem',
                      fontWeight: '900',
                      marginBottom: '20px'
                    }}>
                      ✨ ברוכים הבאים לעולם הרובוטיקה והפיתוח
                    </div>

                    <h1 style={{
                      fontSize: 'clamp(2.2rem, 4vw, 3.5rem)',
                      fontWeight: '900',
                      lineHeight: '1.2',
                      margin: '0 0 18px 0',
                      color: '#ffffff'
                    }}>
                      {track.title}
                    </h1>

                    <p style={{
                      fontSize: '1.15rem',
                      color: '#cbd5e1',
                      lineHeight: '1.8',
                      margin: '0 0 32px 0',
                      fontWeight: '400'
                    }}>
                      {track.welcomePage?.welcomeText || track.description}
                    </p>

                    <button 
                      onClick={handleNextLesson}
                      style={{
                        padding: '18px 42px',
                        borderRadius: '16px',
                        background: 'linear-gradient(135deg, #4F46E5 0%, #7E22CE 100%)',
                        color: '#ffffff',
                        border: 'none',
                        fontWeight: '900',
                        fontSize: '1.15rem',
                        cursor: 'pointer',
                        boxShadow: '0 12px 35px rgba(79, 70, 229, 0.45)',
                        transition: 'all 0.3s ease',
                        fontFamily: 'inherit'
                      }}
                    >
                      🚀 היכנס לעולם הרובוטיקה והתחל בהרכבה צעד-אחר-צעד ➔
                    </button>
                  </div>

                  {/* HERO PROTOTYPE SHOWCASE CARD (CLEAN WHITE BG) */}
                  <div style={{
                    background: '#ffffff',
                    border: '2.5px solid rgba(199, 210, 254, 0.9)',
                    borderRadius: '28px',
                    overflow: 'hidden',
                    boxShadow: '0 25px 65px rgba(0,0,0,0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    height: '370px',
                    padding: '24px 20px',
                    boxSizing: 'border-box'
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: '16px',
                      right: '16px',
                      zIndex: 3,
                      background: 'rgba(15, 23, 42, 0.88)',
                      border: '1px solid rgba(129, 140, 248, 0.4)',
                      padding: '6px 14px',
                      borderRadius: '12px',
                      fontSize: '0.82rem',
                      color: '#c7d2fe',
                      fontWeight: '800',
                      backdropFilter: 'blur(10px)'
                    }}>
                      📸 דגם מוגמר סופי - {track.title}
                    </div>

                    {track.coverImage ? (
                      <img 
                        src={track.coverImage} 
                        alt={track.title}
                        style={{ maxWidth: '88%', maxHeight: '88%', objectFit: 'contain' }}
                      />
                    ) : (
                      <div style={{ fontSize: '4rem' }}>🤖</div>
                    )}
                  </div>
                </div>

                {/* 3-4 FEATURE CARDS */}
                {track.welcomePage?.features && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                    {track.welcomePage.features.map((f, i) => (
                      <div key={i} style={{ background: 'rgba(255, 255, 255, 0.08)', backdropFilter: 'blur(16px)', borderRadius: '20px', padding: '24px', border: '1px solid rgba(255, 255, 255, 0.15)' }}>
                        <h4 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', fontWeight: '900', color: '#38bdf8' }}>
                          {f.title}
                        </h4>
                        <p style={{ margin: 0, fontSize: '0.92rem', color: '#cbd5e1', lineHeight: '1.6' }}>
                          {f.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* ========================================================================= */
            /* 🛠️ LESSON VIEW (MATCHING FREENOVECAR IMAGE 3 EXACTLY) */
            /* ========================================================================= */
            <div style={{ width: '100%', maxWidth: '1450px', margin: '0 auto' }}>
              
              {/* Title Card */}
              <div style={{ background: '#ffffff', padding: '24px 32px', borderRadius: '24px', border: '1.5px solid #cbd5e1', boxShadow: '0 4px 20px rgba(15,23,42,0.04)', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '0.9rem', padding: '6px 14px', borderRadius: '12px', background: '#e0e7ff', color: '#4f46e5', fontWeight: '900' }}>
                    {currentChapter.title}
                  </span>
                  <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: '800' }}>שיעור {currentLesson.id}</span>
                </div>
                <h2 style={{ fontSize: '1.8rem', fontWeight: '900', color: '#0f172a', margin: 0 }}>
                  {currentLesson.title}
                </h2>
              </div>

              {/* CODING MISSION CHALLENGE VIEW (MATCHING IMAGE 2 EXACTLY) */}
              {(currentLesson.isCodingMission || currentLesson.neededBlocks || currentLesson.goal) ? (
                <div style={{ background: '#ffffff', padding: '28px 32px', borderRadius: '24px', border: '1.5px solid #cbd5e1', boxShadow: '0 6px 24px rgba(15,23,42,0.04)', marginBottom: '28px' }}>
                  <h4 style={{ fontSize: '1.3rem', fontWeight: '900', color: '#0f172a', margin: '0 0 10px 0' }}>
                    🎯 משימת התכנות בשיעור זה:
                  </h4>
                  <p style={{ color: '#334155', fontSize: '1.05rem', margin: '0 0 24px 0', fontWeight: '600', lineHeight: '1.6' }}>
                    {currentLesson.goal || currentLesson.description || 'בנה את אלגוריתם הבקרה בעזרת הבלוקים המצורפים ובדוק את פעולת הקוד.'}
                  </p>

                  {/* 2-COLUMN SPLIT: BLOCKS NEEDED & LIVE C++ TARGET */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px', marginBottom: '24px' }}>
                    
                    {/* COLUMN 1: BLOCKS NEEDED (BLUE BORDER CHIPS) */}
                    <div style={{ background: '#f8fafc', padding: '22px', borderRadius: '20px', border: '1.5px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
                      <h4 style={{ fontSize: '1.1rem', fontWeight: '900', color: '#4338ca', margin: '0 0 8px 0' }}>
                        🧩 הבלוקים הנדרשים לבניית המשימה:
                      </h4>
                      <p style={{ fontSize: '0.88rem', color: '#64748b', margin: '0 0 16px 0', fontWeight: '500' }}>
                        גרור את הבלוקים הללו בסביבת הפיתוח וחבר אותם בסדר הנכון למילוי הקוד:
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                        {(currentLesson.neededBlocks || ['תוכנית רובוט', 'סע קדימה (מהירות: 200)', 'המתן (1000 ms)', 'עצור מנועים']).map((bName, idx) => (
                          <span 
                            key={idx} 
                            style={{ 
                              padding: '10px 18px', 
                              borderRadius: '14px', 
                              background: '#ffffff', 
                              color: '#1e1b4b', 
                              fontSize: '0.92rem', 
                              fontWeight: '800', 
                              border: '2px solid #6366f1',
                              boxShadow: '0 4px 12px rgba(99,102,241,0.08)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            {bName}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* COLUMN 2: C++ TARGET CODE STRUCTURE PREVIEW */}
                    <div style={{ background: '#0f172a', padding: '22px', borderRadius: '20px', direction: 'ltr', textAlign: 'left', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ color: '#38bdf8', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '12px', borderBottom: '1px solid #1e293b', paddingBottom: '8px' }}>
                        💻 קוד C++ המיועד להיווצר בלייב:
                      </div>
                      <pre style={{ margin: 0, color: '#f1f5f9', fontSize: '0.9rem', fontFamily: 'monospace', whiteSpace: 'pre-wrap', flex: 1, lineHeight: '1.6' }}>
                        {currentLesson.codeTemplate || currentLesson.code || `void setup() {\n  bot.begin();\n}\nvoid loop() {\n}`}
                      </pre>
                    </div>

                  </div>

                  {/* OPEN WORKSPACE IN STANDALONE BROWSER WINDOW BUTTON */}
                  <button 
                    onClick={() => setIsAiModalOpen(true)}
                    style={{ 
                      padding: '16px 32px', 
                      fontSize: '1.05rem', 
                      fontWeight: '900',
                      background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', 
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '16px',
                      cursor: 'pointer',
                      boxShadow: '0 10px 25px rgba(99,102,241,0.3)',
                      fontFamily: 'inherit',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    🧪 פתח את סביבת העבודה לתרגול המשימה בחלונית חדשה ↗
                  </button>
                </div>
              ) : (
                /* ASSEMBLY LESSON VIEW (MATCHING IMAGE 1 & IMAGE 3) */
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(420px, 1.2fr) minmax(360px, 1fr)', gap: '28px', marginBottom: '28px' }}>
                  
                  {/* COLUMN 1: CAD IMAGE / DIAGRAM BOX */}
                  <div style={{ background: '#ffffff', padding: '28px', borderRadius: '24px', border: '1.5px solid #cbd5e1', boxShadow: '0 6px 24px rgba(15,23,42,0.04)', textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <h4 style={{ fontSize: '1.1rem', fontWeight: '900', color: '#0f172a', margin: 0 }}>
                        📐 תמונת CAD / שרטוט הרכבה:
                      </h4>
                      {currentLesson.imageUrl && (
                        <button 
                          onClick={() => setZoomImageSrc(currentLesson.imageUrl)} 
                          style={{ padding: '8px 18px', fontSize: '0.85rem', background: '#f5f3ff', color: '#4338ca', fontWeight: '900', border: '1.5px solid #c7d2fe', borderRadius: '10px', cursor: 'pointer', fontFamily: 'inherit' }}
                        >
                          🔍 הגדל מסך מלא
                        </button>
                      )}
                    </div>

                    <div style={{ 
                      background: '#ffffff', 
                      padding: '16px', 
                      borderRadius: '16px', 
                      border: '2px solid #cbd5e1', 
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: '380px'
                    }}>
                      {currentLesson.imageUrl ? (
                        <img 
                          src={currentLesson.imageUrl} 
                          alt={currentLesson.title}
                          style={{ maxWidth: '100%', borderRadius: '12px', objectFit: 'contain', maxHeight: '480px' }}
                        />
                      ) : (
                        /* Schematic / CAD Graphic Fallback */
                        <div style={{ width: '100%', height: '340px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', borderRadius: '14px', border: '1.5px dashed #cbd5e1', padding: '20px', boxSizing: 'border-box' }}>
                          <svg width="90" height="90" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '16px' }}>
                            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                            <line x1="8" y1="21" x2="16" y2="21"/>
                            <line x1="12" y1="17" x2="12" y2="21"/>
                          </svg>
                          <h4 style={{ margin: '0 0 6px 0', fontSize: '1.1rem', fontWeight: '900', color: '#1e293b' }}>
                            {currentLesson.title}
                          </h4>
                          <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b', textAlign: 'center', maxWidth: '360px' }}>
                            שלב הרכבה והגדרת קוד עבור {track.targetBoard?.toUpperCase() || 'ESP32'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* COLUMN 2: PARTS NEEDED & STEP INSTRUCTIONS */}
                  <div style={{ background: '#ffffff', padding: '28px', borderRadius: '24px', border: '1.5px solid #cbd5e1', boxShadow: '0 6px 24px rgba(15,23,42,0.04)' }}>
                    {currentLesson.partsNeeded && currentLesson.partsNeeded.length > 0 && (
                      <div style={{ marginBottom: '24px' }}>
                        <h4 style={{ fontSize: '1.15rem', fontWeight: '900', color: '#0f172a', marginBottom: '14px' }}>
                          🔩 רכיבים וברגים נדרשים:
                        </h4>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                          {currentLesson.partsNeeded.map((part, idx) => (
                            <span key={idx} style={{ padding: '8px 16px', borderRadius: '12px', background: '#f1f5f9', color: '#1e293b', fontSize: '0.92rem', fontWeight: '900', border: '1.5px solid #cbd5e1' }}>
                              ✓ {part}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <h4 style={{ fontSize: '1.15rem', fontWeight: '900', color: '#0f172a', marginBottom: '14px' }}>
                      📝 הוראות הרכבה צעד-אחר-צעד:
                    </h4>
                    <ol style={{ paddingRight: '22px', margin: 0, color: '#334155', fontSize: '1rem', lineHeight: '2.0' }}>
                      {(currentLesson.instructions || ['עקוב אחר הוראות השלב והקוד המצורף.']).map((inst, idx) => (
                        <li key={idx} style={{ marginBottom: '12px', fontWeight: '600' }}>{inst}</li>
                      ))}
                    </ol>
                  </div>
                </div>
              )}

              {/* MONACO CODE EDITOR SECTION */}
              <div style={{ background: '#ffffff', borderRadius: '24px', border: '1.5px solid #cbd5e1', boxShadow: '0 6px 24px rgba(15,23,42,0.04)', overflow: 'hidden', marginBottom: '28px' }}>
                <div style={{ padding: '14px 24px', background: '#0f172a', color: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '0.95rem', fontWeight: '900', color: '#38bdf8' }}>
                      📄 קוד תוכנית Arduino / C++ עבור השיעור (firmware.ino)
                    </span>
                  </div>

                  <button
                    onClick={() => setIsAiModalOpen(true)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '10px',
                      background: 'rgba(99,102,241,0.2)',
                      border: '1px solid #818cf8',
                      color: '#c7d2fe',
                      fontSize: '0.82rem',
                      fontWeight: '800',
                      cursor: 'pointer',
                      fontFamily: 'inherit'
                    }}
                  >
                    מחולל בלוקים ב-AI
                  </button>
                </div>

                <div style={{ height: '320px', direction: 'ltr' }}>
                  <MonacoEditor
                    language="cpp"
                    theme="vs-dark"
                    value={code}
                    onChange={(newCode) => setCode(newCode)}
                    options={{
                      fontSize: 14,
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      tabSize: 2
                    }}
                  />
                </div>
              </div>

              {/* BOTTOM NAVIGATION BUTTON */}
              <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '40px' }}>
                <button
                  onClick={handleNextLesson}
                  style={{
                    padding: '18px 48px',
                    borderRadius: '18px',
                    background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
                    color: '#ffffff',
                    fontWeight: '900',
                    fontSize: '1.2rem',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 10px 30px rgba(37,99,235,0.35)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontFamily: 'inherit'
                  }}
                >
                  <span>✨ סיימתי את השיעור! עבור לשיעור הבא</span>
                  <span>←</span>
                </button>
              </div>

            </div>
          )}
        </div>
      </div>

      {/* ZOOM IMAGE MODAL */}
      {zoomImageSrc && (
        <div
          onClick={() => setZoomImageSrc(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.85)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            cursor: 'pointer'
          }}
        >
          <img src={zoomImageSrc} alt="Zoom" style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: '16px', background: '#fff', padding: '16px' }} />
        </div>
      )}

      {/* Flashing Modal */}
      {isFlashingModalOpen && (
        <FlashingModal
          isOpen={isFlashingModalOpen}
          onClose={() => setIsFlashingModalOpen(false)}
          codeToFlash={code}
          targetBoard={track.targetBoard || 'esp32'}
        />
      )}

      {/* Send Code Modal */}
      {isSendCodeModalOpen && (
        <SendCodeModal
          isOpen={isSendCodeModalOpen}
          onClose={() => setIsSendCodeModalOpen(false)}
          activeTrack={track.id || track.trackId}
          currentLessonId={currentLesson.id || '1.0'}
          currentLessonTitle={currentLesson.title}
          generatedCode={code}
        />
      )}

      {/* AI Block Generator Modal */}
      {isAiModalOpen && (
        <AIBlockGeneratorModal
          isOpen={isAiModalOpen}
          onClose={() => setIsAiModalOpen(false)}
          onBlockCreated={(newBlock) => {
            alert(`בלוק "${newBlock.title || 'מותאם אישית'}" נוצר בהצלחה!`);
            setIsAiModalOpen(false);
          }}
        />
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
