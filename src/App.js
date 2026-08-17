import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import './App.css';
import Smarthouse from './Smarthouse';
import Builder from './Builder';
import RobotSmall from './RobotSmall';
import SrobotBuilder from './SrobotBuilder';
import CodeToBlock from './CodeToBlock';
import WebBlocks from './WebBlocks';
import CodeEditorPage from './CodeEditorPage';
import FreenoveCar from './FreenoveCar';

import { CAR_4WD_HERO, SMARTHOUSE_HERO, TURTLE_HERO } from './projectImages';

function Home() {
  const learningTracks = [
    {
      to: "/FreenoveCar",
      title: "🏎️ רובוט מכונית 4WD",
      description: "הרכבה וכיול 4WD Pro, מנוע סרוו Pan-Tilt, מעקב אחר קו, עקיפת מכשולים ושליטה ב-Wi-Fi.",
      icon: "🏎️",
      imgUrl: CAR_4WD_HERO,
      badges: ["4WD Pro", "ESP32", "Wi-Fi & App"],
      gradient: "linear-gradient(135deg, #4F46E5 0%, #7E22CE 100%)",
      glow: "0 0 30px rgba(79, 70, 229, 0.3)"
    },
    {
      to: "/RobotSmall",
      title: "🤖 רובוט צב חכם",
      description: "הרכבה מכאנית מפורטת צעד-אחר-צעד, בקרת מנועים, חיישנים וניווט אוטונומי.",
      icon: "🤖",
      imgUrl: TURTLE_HERO,
      badges: ["KS0558 V3.0", "רובוטיקה", "ניווט"],
      gradient: "linear-gradient(135deg, #FF9900 0%, #FF5500 100%)",
      glow: "0 0 30px rgba(255, 153, 0, 0.3)"
    },
    {
      to: "/smarthouse",
      title: "🏡 בית חכם IoT",
      description: "בניית בית חכם אוטומטי, תכנות 13 חיישנים, מנועים, מסך LCD, RFID ותקשורת ענן.",
      icon: "🏡",
      imgUrl: SMARTHOUSE_HERO,
      badges: ["KS5009 ESP32", "חיישנים", "IoT Cloud"],
      gradient: "linear-gradient(135deg, #FF007A 0%, #FF758C 100%)",
      glow: "0 0 30px rgba(255, 0, 122, 0.3)"
    }
  ];

  const devTools = [
    {
      to: "/builder",
      title: "סטודיו לפיתוח ארדואינו (Arduino & ESP32 Studio)",
      description: "סביבת פיתוח חופשית בבלוקים ל-Arduino ו-ESP32, כולל מחולל בלוקים ב-AI מובנה, קומפילציה וצריבה ישירה.",
      icon: "🤖",
      badges: ["Arduino Studio", "AI Block Builder", "ESP32 Flashing"],
      gradient: "linear-gradient(135deg, #4F46E5 0%, #3B82F6 100%)",
      glow: "0 0 30px rgba(79, 70, 229, 0.3)"
    },
    {
      to: "/WebBlocks",
      title: "סטודיו לבניית אתרים (WebBlocks Studio)",
      description: "פיתוח אתרים ואפליקציות רשת בבלוקים, כולל מחולל בלוקי HTML/CSS/JS ב-AI ותצוגת Monaco Editor.",
      icon: "🌐",
      badges: ["HTML5 / CSS3", "AI Web Blocks", "Monaco Editor"],
      gradient: "linear-gradient(135deg, #7F00FF 0%, #E100FF 100%)",
      glow: "0 0 30px rgba(127, 0, 255, 0.3)"
    },
    {
      to: "/CodeEditor",
      title: "עורך קוד וצריבה ללוח (Arduino Code Flasher)",
      description: "עורך קוד טקסטואלי C++ / Arduino בגודל מלא, כולל קומפילציה וצריבה ישירה ל-ESP32 / Arduino.",
      icon: "🚀",
      badges: ["C++ / Arduino", "ESP32 Flasher", "Monaco Editor"],
      gradient: "linear-gradient(135deg, #FF007A 0%, #7F00FF 100%)",
      glow: "0 0 30px rgba(255, 0, 122, 0.3)"
    },
    {
      to: "/CodeToBlock",
      title: "מעבדת הבלוקים וה-AI (CodeToBlock AI Hub)",
      description: "אזור ניהול פרויקטים מרכזי, יצירת בלוקים מולטי-שפתיים ב-AI ותצוגת SVG פיזית בלייב.",
      icon: "🧩",
      badges: ["AI Block Hub", "Custom Projects", "Multi-Language"],
      gradient: "linear-gradient(135deg, #00F260 0%, #0575E6 100%)",
      glow: "0 0 30px rgba(0, 242, 96, 0.3)"
    }
  ];

  return (
    <div className="app-container">
      {/* Header Navbar */}
      <header className="app-header">
        <Link to="/" className="brand-logo">
          <div className="brand-logo-icon">🚀</div>
          <span className="brand-text">SmartStart</span>
        </Link>
        <div className="header-status-badge">
          <span className="status-dot"></span>
          מערכת פעילה | סביבת פיתוח
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-pill-tag">
          <span>✨</span> פלטפורמת הלמידה והפיתוח המתקדמת לרובוטיקה וקוד
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
            🎓 מסלולי למידה מודרכים
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.95rem', marginTop: '4px' }}>
            מסלולי למידה מובנים צעד-אחר-צעד עם תרגול מעשי וסימולציות חומרה
          </p>
        </div>

        <div className="cards-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', marginBottom: '48px' }}>
          {learningTracks.map((mod, index) => (
            <Link 
              key={index} 
              to={mod.to} 
              className="feature-card"
              style={{
                '--card-gradient': mod.gradient,
                '--card-glow': mod.glow
              }}
            >


              {/* FULL COMPLETED PROTOTYPE IMAGE PREVIEW BANNER */}
              {mod.imgUrl && (
                <div 
                  style={{ 
                    width: '100%', 
                    height: '210px', 
                    borderRadius: '18px', 
                    overflow: 'hidden', 
                    marginBottom: '16px', 
                    background: '#ffffff',
                    border: '1.5px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '12px',
                    boxShadow: '0 4px 16px rgba(15,23,42,0.05)',
                    position: 'relative'
                  }}
                >
                  <img 
                    src={mod.imgUrl} 
                    alt={mod.title}
                    style={{ 
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      objectPosition: 'center',
                      borderRadius: '12px'
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

        {/* SECTION 2: DEVELOPER TOOLS */}
        <div className="section-header" style={{ marginTop: '20px' }}>
          <h2 className="section-title">
            <div className="section-title-bar" style={{ background: 'linear-gradient(180deg, #4F46E5 0%, #00F260 100%)' }}></div>
            🛠️ כלי עבודה וסביבות פיתוח
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
        <div>פלטפורמת למידה ופיתוח אינטראקטיבית לרובוטיקה וקוד</div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
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