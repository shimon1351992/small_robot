import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { getActiveServerUrl } from './serverPort';

// Hardware components list
const HARDWARE_COMPONENTS = [
  'חיישן מרחק אולטרסוני (HC-SR04)',
  'מנוע סרוו (SG90 / MG995)',
  'מסך LCD 1602 I2C',
  'מסך OLED 0.96 I2C',
  'חיישן טמפרטורה ולחות (DHT11/DHT22)',
  'מודול ג\'ויסטיק כפול (JoyStick)',
  'חיישן תנועה PIR',
  'חיישן זיהוי קו (Line Follower)',
  'מודול ממסר (Relay Module)',
  'חיישן RFID (RC522)',
  'זמזם פאסיבי/אקטיבי (Buzzer)',
  'חיישן גז ועשן (MQ-2)',
  'משאבת מים 5V',
  'חיישן לחות אדמה',
  'סוללת Li-ion 18650',
  'מנועי DC וגיר'
];

// Software modules list
const SOFTWARE_FEATURES = [
  'עיצוב ממשק משתמש (HTML5 / CSS3)',
  'אינטראקטיביות ואירועים (JavaScript)',
  'מניפולציית DOM ואלמנטים דינמיים',
  'גרפיקה וציור ב-HTML Canvas',
  'שמירת נתונים מקומית (LocalStorage)',
  'תקשורת שרת ו-REST API (Fetch/Axios)',
  'לוגיקת משחק ובדיקת התנגשויות',
  'אפקטים קוליים וצלילים (Web Audio)',
  'טפסים ואימות קלט משתמש',
  'עיצוב רספונסיבי למובייל ולמחשב',
  'מבני נתונים ואלגוריתמיקה בסיסית',
  'פיתוח לוגיקה בעזרת בלוקים (Blockly)'
];

export default function CustomTrackCreator() {
  const navigate = useNavigate();

  // Project Type: null (Selection screen), 'hardware_software', or 'software_only'
  const [projectType, setProjectType] = useState(null);

  // Active Wizard Tab (1: Details, 2: Components/Tech, 3: Media & URL, 4: AI Prompt)
  const [activeStep, setActiveStep] = useState(1);

  // Common Form State
  const [projectTitle, setProjectTitle] = useState('');
  const [difficulty, setDifficulty] = useState('חטיבת ביניים / תיכון');
  const [chaptersCount, setChaptersCount] = useState(3);
  const [userPrompt, setUserPrompt] = useState('');

  // Hardware Specific
  const [targetBoard, setTargetBoard] = useState('esp32');
  const [selectedHwComponents, setSelectedHwComponents] = useState([
    'חיישן מרחק אולטרסוני (HC-SR04)',
    'מנוע סרוו (SG90 / MG995)'
  ]);

  // Software Specific
  const [softwareStack, setSoftwareStack] = useState('web'); // 'web', 'cpp_logic', 'blockly'
  const [selectedSwFeatures, setSelectedSwFeatures] = useState([
    'עיצוב ממשק משתמש (HTML5 / CSS3)',
    'אינטראקטיביות ואירועים (JavaScript)'
  ]);

  const [customInput, setCustomInput] = useState('');

  // Web Scraping State
  const [docUrl, setDocUrl] = useState('');
  const [scrapeInstructions, setScrapeInstructions] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  const [scrapedData, setScrapedData] = useState(null);
  const [scrapeError, setScrapeError] = useState('');

  // File & Image Upload State
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  // Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [genStepMessage, setGenStepMessage] = useState('');
  const [generatedTrack, setGeneratedTrack] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Toggle Hardware Component
  const toggleHwComponent = (comp) => {
    if (selectedHwComponents.includes(comp)) {
      setSelectedHwComponents(selectedHwComponents.filter(c => c !== comp));
    } else {
      setSelectedHwComponents([...selectedHwComponents, comp]);
    }
  };

  // Toggle Software Feature
  const toggleSwFeature = (feat) => {
    if (selectedSwFeatures.includes(feat)) {
      setSelectedSwFeatures(selectedSwFeatures.filter(f => f !== feat));
    } else {
      setSelectedSwFeatures([...selectedSwFeatures, feat]);
    }
  };

  // Add Custom Item
  const handleAddCustomItem = (e) => {
    if (e) e.preventDefault();
    if (!customInput.trim()) return;
    if (projectType === 'hardware_software') {
      if (!selectedHwComponents.includes(customInput.trim())) {
        setSelectedHwComponents([...selectedHwComponents, customInput.trim()]);
      }
    } else {
      if (!selectedSwFeatures.includes(customInput.trim())) {
        setSelectedSwFeatures([...selectedSwFeatures, customInput.trim()]);
      }
    }
    setCustomInput('');
  };

  // 1. Scrape URL
  const handleScrapeUrl = async () => {
    if (!docUrl.trim()) return;
    setIsScraping(true);
    setScrapeError('');
    try {
      const serverUrl = await getActiveServerUrl();
      const res = await axios.post(`${serverUrl}/api/ai/scrape-url`, { url: docUrl.trim() });
      if (res.data && res.data.success) {
        setScrapedData(res.data);
        if (!projectTitle && res.data.title) {
          setProjectTitle(res.data.title.substring(0, 60));
        }
      } else {
        setScrapeError(res.data.error || 'שגיאה בקריאת האתר');
      }
    } catch (err) {
      setScrapeError(err.response?.data?.error || err.message || 'שגיאה בתקשורת עם השרת');
    } finally {
      setIsScraping(false);
    }
  };

  // 2. Upload Files
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploading(true);
    try {
      const serverUrl = await getActiveServerUrl();
      for (const file of files) {
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const res = await axios.post(`${serverUrl}/api/ai/upload-media`, {
              fileName: file.name,
              fileType: file.type,
              base64Data: reader.result
            });
            if (res.data && res.data.success) {
              setUploadedFiles(prev => [...prev, {
                url: res.data.url,
                fileName: file.name,
                size: (file.size / 1024).toFixed(1) + ' KB',
                type: file.type
              }]);
            }
          } catch (err) {
            console.error('Error uploading file:', err);
          }
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.error('Failed to get server url for upload:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = (index) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  // 3. Generate Track via AI
  const handleGenerateTrack = async () => {
    if (!projectTitle.trim() && !docUrl.trim() && !userPrompt.trim()) {
      setErrorMessage('נא להזין שם פרויקט, רעיון או קישור לאתר!');
      return;
    }

    setErrorMessage('');
    setIsGenerating(true);
    setGeneratedTrack(null);

    const stepMessages = projectType === 'hardware_software' ? [
      'מנתח את רכיבי החומרה והדרישות...',
      'מעבד מידע ממקורות התיעוד והתמונות...',
      'בונה שלבי הרכבה מכאנית מפורטים ורשימות ברגים...',
      'כותב קוד C++ מלא, פונקציות בקרה וספריות...',
      'מייצר מבנה פרקים, שיעורים ומשימות למידה...',
      'מסיים ומעצב את מסלול הלמידה האישי...'
    ] : [
      'מנתח את ארכיטקטורת התוכנה והפיצ\'רים...',
      'מעבד מידע ממקורות התיעוד ודפי העיצוב...',
      'בונה שלבי פיתוח תוכנה ותרגול שלב-אחר-שלב...',
      'כותב קוד מלא, פונקציות לוגיקה וממשק משתמש...',
      'מייצר מבנה פרקים ומשימות קוד אינטראקטיביות...',
      'מסיים ומעצב את מסלול התוכנה האישי...'
    ];

    let stepIdx = 0;
    setGenStepMessage(stepMessages[0]);
    const timer = setInterval(() => {
      stepIdx = (stepIdx + 1) % stepMessages.length;
      setGenStepMessage(stepMessages[stepIdx]);
    }, 2500);

    try {
      const serverUrl = await getActiveServerUrl();
      const isHw = projectType === 'hardware_software';
      const res = await axios.post(`${serverUrl}/api/ai/generate-track`, {
        title: projectTitle.trim(),
        projectType,
        targetBoard: isHw ? targetBoard : softwareStack,
        components: isHw ? selectedHwComponents : selectedSwFeatures,
        difficulty,
        chaptersCount,
        docUrl: docUrl.trim(),
        prompt: `${isHw ? '[פרויקט חומרה ותוכנה משולב] ' : '[פרויקט תוכנה בלבד ללא רכיבי חומרה פיזיים] '}${userPrompt.trim()}`,
        scrapedData,
        scrapeInstructions: scrapeInstructions.trim(),
        uploadedMedia: uploadedFiles
      });

      clearInterval(timer);

      if (res.data && res.data.success && res.data.track) {
        setGeneratedTrack(res.data.track);
      } else {
        setErrorMessage(res.data?.error || 'חלה שגיאה ביצירת המסלול');
      }
    } catch (err) {
      clearInterval(timer);
      setErrorMessage(err.response?.data?.error || err.message || 'שגיאה ביצירת המסלול בשרת');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8fafc',
      color: '#0f172a',
      direction: 'rtl',
      fontFamily: "'Rubik', system-ui, -apple-system, sans-serif",
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Top Header */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '18px 36px',
        background: '#ffffff',
        borderBottom: '2px solid #e2e8f0',
        boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => {
              if (projectType !== null && !generatedTrack) {
                setProjectType(null);
              } else {
                navigate('/tracks');
              }
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              borderRadius: '14px',
              border: '2px solid #cbd5e1',
              background: '#f1f5f9',
              color: '#1e293b',
              fontWeight: '800',
              fontSize: '0.95rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontFamily: 'inherit'
            }}
          >
            <span>←</span>
            <span>{projectType !== null && !generatedTrack ? 'חזרה לבחירת סוג פרויקט' : 'חזרה לעמוד הראשי'}</span>
          </button>
          <h2 style={{ fontSize: '1.35rem', fontWeight: '900', color: '#0f172a', margin: 0 }}>
            מחולל מסלולי למידה ב-AI
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{
            fontSize: '0.88rem',
            padding: '7px 16px',
            borderRadius: '20px',
            background: '#ecfdf5',
            border: '1.5px solid #a7f3d0',
            color: '#047857',
            fontWeight: '900'
          }}>
            Google Gemini 3.5 Engine
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main style={{
        flex: 1,
        maxWidth: '1050px',
        width: '100%',
        margin: '0 auto',
        padding: '40px 24px',
        boxSizing: 'border-box'
      }}>
        {/* ========================================================================= */}
        {/* SCREEN 0: PROJECT TYPE SELECTOR (חומרה ותוכנה VS תוכנה בלבד) */}
        {/* ========================================================================= */}
        {projectType === null ? (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <span style={{
                display: 'inline-block',
                padding: '6px 18px',
                borderRadius: '20px',
                background: '#e0e7ff',
                color: '#4338ca',
                fontSize: '0.9rem',
                fontWeight: '900',
                marginBottom: '12px'
              }}>
                שלב ראשון • בחירת תחום
              </span>
              <h1 style={{ fontSize: '2.4rem', fontWeight: '900', color: '#0f172a', margin: '0 0 12px 0', lineHeight: '1.25' }}>
                איזה סוג פרויקט תרצה ליצור?
              </h1>
              <p style={{ color: '#64748b', fontSize: '1.15rem', margin: 0, fontWeight: '500' }}>
                בחר את אופי הפרויקט והסוכן החכם יתאים עבורך את שדות ההגדרה, שלבי הלמידה והקוד.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
              {/* Option 1: Hardware & Software */}
              <div
                onClick={() => {
                  setProjectType('hardware_software');
                  setActiveStep(1);
                }}
                style={{
                  background: '#ffffff',
                  borderRadius: '24px',
                  border: '2.5px solid #e2e8f0',
                  padding: '36px',
                  cursor: 'pointer',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
                  transition: 'all 0.25s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#2563eb';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 16px 36px rgba(37,99,235,0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.04)';
                }}
              >
                <div>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '18px',
                    background: '#eff6ff',
                    border: '2px solid #bfdbfe',
                    color: '#2563eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2rem',
                    marginBottom: '20px'
                  }}>
                    🤖
                  </div>

                  <h3 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#0f172a', margin: '0 0 10px 0' }}>
                    פרויקט חומרה ותוכנה
                  </h3>
                  <p style={{ color: '#64748b', fontSize: '1rem', lineHeight: '1.6', margin: '0 0 20px 0', fontWeight: '500' }}>
                    מסלול משולב לרובוטיקה, IoT וארדואינו הכולל בחירת בקר (ESP32 / Arduino), חיישנים ומנועים, שלבי הרכבה מכאנית, שרטוטי חיבורים וקוד C++.
                  </p>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '28px' }}>
                    {['ESP32 / Arduino', 'חיישנים ומנועים', 'שלבי הרכבה וברגים', 'קוד C++ וצריבה'].map((badge, i) => (
                      <span key={i} style={{ fontSize: '0.82rem', fontWeight: '800', padding: '4px 12px', borderRadius: '10px', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>
                        ✓ {badge}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  style={{
                    width: '100%',
                    padding: '16px',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                    color: '#ffffff',
                    fontWeight: '900',
                    fontSize: '1.1rem',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    boxShadow: '0 4px 14px rgba(37,99,235,0.3)'
                  }}
                >
                  <span>בחר במסלול חומרה ותוכנה</span>
                  <span>←</span>
                </button>
              </div>

              {/* Option 2: Software Only */}
              <div
                onClick={() => {
                  setProjectType('software_only');
                  setActiveStep(1);
                }}
                style={{
                  background: '#ffffff',
                  borderRadius: '24px',
                  border: '2.5px solid #e2e8f0',
                  padding: '36px',
                  cursor: 'pointer',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
                  transition: 'all 0.25s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#059669';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 16px 36px rgba(5,150,105,0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.04)';
                }}
              >
                <div>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '18px',
                    background: '#ecfdf5',
                    border: '2px solid #a7f3d0',
                    color: '#059669',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2rem',
                    marginBottom: '20px'
                  }}>
                    💻
                  </div>

                  <h3 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#0f172a', margin: '0 0 10px 0' }}>
                    פרויקט תוכנה בלבד
                  </h3>
                  <p style={{ color: '#64748b', fontSize: '1rem', lineHeight: '1.6', margin: '0 0 20px 0', fontWeight: '500' }}>
                    מסלול פיתוח תוכנה טהור (ללא רכיבי חומרה או ברגים) כגון אתרי אינטרנט אינטראקטיביים, אפליקציות Web, משחקים, או לוגיקת קוד ואלגוריתמיקה בבלוקים.
                  </p>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '28px' }}>
                    {['HTML5 / CSS / JavaScript', 'לוגיקת משחק ו-Canvas', 'פיתוח בבלוקים / קוד', 'ללא צורך בחומרה'].map((badge, i) => (
                      <span key={i} style={{ fontSize: '0.82rem', fontWeight: '800', padding: '4px 12px', borderRadius: '10px', background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }}>
                        ✓ {badge}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  style={{
                    width: '100%',
                    padding: '16px',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                    color: '#ffffff',
                    fontWeight: '900',
                    fontSize: '1.1rem',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    boxShadow: '0 4px 14px rgba(5,150,105,0.3)'
                  }}
                >
                  <span>בחר במסלול תוכנה בלבד</span>
                  <span>←</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* SCREEN 1: ADAPTIVE WIZARD (מותאם לפי חומרה או תוכנה) */
          /* ========================================================================= */
          <div>
            {/* Banner Header */}
            <div style={{ textAlign: 'center', marginBottom: '36px' }}>
              <span style={{
                display: 'inline-block',
                padding: '6px 18px',
                borderRadius: '20px',
                background: projectType === 'hardware_software' ? '#eff6ff' : '#ecfdf5',
                color: projectType === 'hardware_software' ? '#1d4ed8' : '#047857',
                fontSize: '0.9rem',
                fontWeight: '900',
                marginBottom: '12px',
                border: `1.5px solid ${projectType === 'hardware_software' ? '#bfdbfe' : '#a7f3d0'}`
              }}>
                {projectType === 'hardware_software' ? '🤖 מסלול חומרה ותוכנה משולב' : '💻 מסלול תוכנה בלבד'}
              </span>
              <h1 style={{ fontSize: '2.3rem', fontWeight: '900', color: '#0f172a', margin: '0 0 10px 0', lineHeight: '1.25' }}>
                {projectType === 'hardware_software' ? 'הגדר פרויקט חומרה וה-AI ייצור עבורך מסלול מלא' : 'הגדר פרויקט תוכנה וה-AI ייצור עבורך מסלול קוד שלם'}
              </h1>
              <p style={{ color: '#64748b', fontSize: '1.1rem', margin: 0, fontWeight: '500' }}>
                {projectType === 'hardware_software'
                  ? 'הזן את רכיבי הפרויקט, הדבק קישור למדריך או העלה תמונות הרכבה. המערכת תבנה עבורך שיעורי הרכבה, רשימות ברגים וקוד C++ מלא!'
                  : 'הגדר את נושא האפליקציה, הטכנולוגיות והפיצ\'רים. המערכת תבנה עבורך מסלול תכנות שלב-אחר-שלב עם קוד מלא ופרויקטים מעשיים!'}
              </p>
            </div>

            {/* Step Navigation Tabs */}
            <div style={{
              display: 'flex',
              background: '#ffffff',
              borderRadius: '18px',
              padding: '8px',
              border: '2px solid #e2e8f0',
              marginBottom: '28px',
              boxShadow: '0 4px 15px rgba(0,0,0,0.03)'
            }}>
              {[
                { step: 1, label: projectType === 'hardware_software' ? '1. פרטי הפרויקט והבקר' : '1. פרטי הפרויקט והשפה' },
                { step: 2, label: projectType === 'hardware_software' ? '2. רכיבים וחיישנים' : '2. פיצ\'רים וטכנולוגיות' },
                { step: 3, label: '3. קישור אתר ותמונות' },
                { step: 4, label: '4. דגשים וייצור ב-AI' }
              ].map(s => (
                <button
                  key={s.step}
                  type="button"
                  onClick={() => setActiveStep(s.step)}
                  style={{
                    flex: 1,
                    padding: '14px 12px',
                    borderRadius: '14px',
                    border: 'none',
                    background: activeStep === s.step ? (projectType === 'hardware_software' ? '#2563eb' : '#059669') : 'transparent',
                    color: activeStep === s.step ? '#ffffff' : '#475569',
                    fontWeight: '900',
                    fontSize: '1rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontFamily: 'inherit',
                    boxShadow: activeStep === s.step ? '0 4px 12px rgba(0,0,0,0.15)' : 'none'
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Step Card Container */}
            <div style={{
              background: '#ffffff',
              borderRadius: '24px',
              border: '2px solid #e2e8f0',
              padding: '40px',
              boxShadow: '0 10px 35px rgba(0,0,0,0.04)',
              marginBottom: '28px'
            }}>
              {/* STEP 1: Basic Details */}
              {activeStep === 1 && (
                <div>
                  <h3 style={{
                    fontSize: '1.4rem',
                    fontWeight: '900',
                    color: '#0f172a',
                    marginBottom: '24px',
                    paddingBottom: '12px',
                    borderBottom: '2px solid #f1f5f9'
                  }}>
                    {projectType === 'hardware_software' ? 'פרטי הפרויקט ובקר היעד' : 'פרטי הפרויקט וסביבת הפיתוח'}
                  </h3>

                  {/* Field 1: Project Title */}
                  <div style={{ marginBottom: '24px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '1.05rem',
                      fontWeight: '900',
                      color: '#0f172a',
                      marginBottom: '10px'
                    }}>
                      שם הפרויקט / המסלול: <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      placeholder={projectType === 'hardware_software' ? "לדוגמה: רובוט זרוע חכמה 4 צירים עם ג'ויסטיק" : "לדוגמה: משחק חלל אינטראקטיבי ב-JavaScript"}
                      value={projectTitle}
                      onChange={(e) => setProjectTitle(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '16px 20px',
                        borderRadius: '16px',
                        border: '2px solid #cbd5e1',
                        fontSize: '1.05rem',
                        fontWeight: '600',
                        color: '#0f172a',
                        outline: 'none',
                        boxSizing: 'border-box',
                        fontFamily: 'inherit',
                        background: '#ffffff'
                      }}
                    />
                  </div>

                  {/* Field 2: Target Board (HW) OR Software Stack (SW) */}
                  {projectType === 'hardware_software' ? (
                    <div style={{ marginBottom: '26px' }}>
                      <label style={{
                        display: 'block',
                        fontSize: '1.05rem',
                        fontWeight: '900',
                        color: '#0f172a',
                        marginBottom: '10px'
                      }}>
                        סוג בקר היעד (Microcontroller):
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                        {[
                          { id: 'esp32', name: 'ESP32 Dev Module' },
                          { id: 'uno', name: 'Arduino Uno R3' },
                          { id: 'esp8266', name: 'ESP8266 NodeMCU' }
                        ].map(b => (
                          <button
                            key={b.id}
                            type="button"
                            onClick={() => setTargetBoard(b.id)}
                            style={{
                              padding: '16px 14px',
                              borderRadius: '16px',
                              border: targetBoard === b.id ? '2.5px solid #2563eb' : '2px solid #e2e8f0',
                              background: targetBoard === b.id ? '#eff6ff' : '#f8fafc',
                              color: targetBoard === b.id ? '#1d4ed8' : '#334155',
                              fontWeight: '900',
                              fontSize: '1rem',
                              cursor: 'pointer',
                              fontFamily: 'inherit',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            {b.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div style={{ marginBottom: '26px' }}>
                      <label style={{
                        display: 'block',
                        fontSize: '1.05rem',
                        fontWeight: '900',
                        color: '#0f172a',
                        marginBottom: '10px'
                      }}>
                        סביבת פיתוח ושפת תכנות:
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                        {[
                          { id: 'web', name: 'HTML5 / CSS3 / JavaScript' },
                          { id: 'blockly', name: 'סביבת בלוקים (Blockly Web)' },
                          { id: 'cpp_logic', name: 'אלגוריתמיקה ולוגיקה (C++)' }
                        ].map(s => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => setSoftwareStack(s.id)}
                            style={{
                              padding: '16px 14px',
                              borderRadius: '16px',
                              border: softwareStack === s.id ? '2.5px solid #059669' : '2px solid #e2e8f0',
                              background: softwareStack === s.id ? '#ecfdf5' : '#f8fafc',
                              color: softwareStack === s.id ? '#047857' : '#334155',
                              fontWeight: '900',
                              fontSize: '1rem',
                              cursor: 'pointer',
                              fontFamily: 'inherit',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            {s.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Field 3 & 4: Difficulty & Chapters */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '1.05rem',
                        fontWeight: '900',
                        color: '#0f172a',
                        marginBottom: '10px'
                      }}>
                        רמת קושי:
                      </label>
                      <select
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '16px 18px',
                          borderRadius: '16px',
                          border: '2px solid #cbd5e1',
                          fontSize: '1rem',
                          fontWeight: '700',
                          color: '#0f172a',
                          background: '#ffffff',
                          outline: 'none',
                          boxSizing: 'border-box',
                          fontFamily: 'inherit'
                        }}
                      >
                        <option value="בית ספר יסודי (בסיסי)">בית ספר יסודי (בסיסי)</option>
                        <option value="חטיבת ביניים / תיכון">חטיבת ביניים / תיכון (סטנדרטי)</option>
                        <option value="תיכון מתקדם / מגמת הנדסה">תיכון מתקדם / מגמת הנדסה</option>
                      </select>
                    </div>

                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '1.05rem',
                        fontWeight: '900',
                        color: '#0f172a',
                        marginBottom: '10px'
                      }}>
                        מספר פרקים במסלול:
                      </label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {[2, 3, 4, 5].map(n => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => setChaptersCount(n)}
                            style={{
                              flex: 1,
                              padding: '15px 8px',
                              borderRadius: '14px',
                              border: chaptersCount === n ? `2.5px solid ${projectType === 'hardware_software' ? '#2563eb' : '#059669'}` : '2px solid #e2e8f0',
                              background: chaptersCount === n ? (projectType === 'hardware_software' ? '#eff6ff' : '#ecfdf5') : '#f8fafc',
                              color: chaptersCount === n ? (projectType === 'hardware_software' ? '#1d4ed8' : '#047857') : '#334155',
                              fontWeight: '900',
                              fontSize: '1rem',
                              cursor: 'pointer',
                              fontFamily: 'inherit'
                            }}
                          >
                            {n} פרקים
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '36px' }}>
                    <button
                      type="button"
                      onClick={() => setActiveStep(2)}
                      style={{
                        padding: '14px 36px',
                        borderRadius: '16px',
                        background: projectType === 'hardware_software' ? '#2563eb' : '#059669',
                        color: '#ffffff',
                        fontWeight: '900',
                        fontSize: '1.05rem',
                        border: 'none',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        boxShadow: '0 4px 14px rgba(0,0,0,0.2)'
                      }}
                    >
                      {projectType === 'hardware_software' ? 'המשך לבחירת רכיבים ←' : 'המשך לבחירת פיצ\'רים ←'}
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: Hardware Components OR Software Modules */}
              {activeStep === 2 && (
                <div>
                  <h3 style={{
                    fontSize: '1.4rem',
                    fontWeight: '900',
                    color: '#0f172a',
                    marginBottom: '8px'
                  }}>
                    {projectType === 'hardware_software' ? 'בחירת רכיבים, מנועים וחיישנים' : 'בחירת פיצ\'רים, מודולים וטכנולוגיות'}
                  </h3>
                  <p style={{ color: '#64748b', fontSize: '1rem', fontWeight: '500', marginBottom: '24px' }}>
                    {projectType === 'hardware_software' ? 'סמן את הרכיבים שייכללו במסלול הלימוד:' : 'סמן את היכולות שייבנו במהלך פיתוח התוכנה:'}
                  </p>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '24px' }}>
                    {(projectType === 'hardware_software' ? HARDWARE_COMPONENTS : SOFTWARE_FEATURES).map((item, idx) => {
                      const isSelected = projectType === 'hardware_software'
                        ? selectedHwComponents.includes(item)
                        : selectedSwFeatures.includes(item);
                      const activeColor = projectType === 'hardware_software' ? '#2563eb' : '#059669';
                      const activeBg = projectType === 'hardware_software' ? '#eff6ff' : '#ecfdf5';
                      const activeTextColor = projectType === 'hardware_software' ? '#1d4ed8' : '#047857';

                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => projectType === 'hardware_software' ? toggleHwComponent(item) : toggleSwFeature(item)}
                          style={{
                            padding: '12px 18px',
                            borderRadius: '14px',
                            border: isSelected ? `2.5px solid ${activeColor}` : '2px solid #e2e8f0',
                            background: isSelected ? activeBg : '#f8fafc',
                            color: isSelected ? activeTextColor : '#334155',
                            fontSize: '0.95rem',
                            fontWeight: isSelected ? '900' : '700',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            fontFamily: 'inherit'
                          }}
                        >
                          {isSelected ? '✓ ' : '+ '}
                          {item}
                        </button>
                      );
                    })}
                  </div>

                  {/* Add Custom Item */}
                  <div style={{ marginBottom: '28px' }}>
                    <label style={{ display: 'block', fontSize: '1.05rem', fontWeight: '900', color: '#0f172a', marginBottom: '10px' }}>
                      {projectType === 'hardware_software' ? 'הוספת רכיב אישי נוסף:' : 'הוספת פיצ\'ר / מודול אישי נוסף:'}
                    </label>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <input
                        type="text"
                        placeholder={projectType === 'hardware_software' ? "הזן שם רכיב או מודול..." : "הזן פיצ'ר, ספרייה או יכולת..."}
                        value={customInput}
                        onChange={(e) => setCustomInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddCustomItem(e)}
                        style={{
                          flex: 1,
                          padding: '14px 18px',
                          borderRadius: '14px',
                          border: '2px solid #cbd5e1',
                          fontSize: '1rem',
                          fontWeight: '600',
                          color: '#0f172a',
                          outline: 'none',
                          fontFamily: 'inherit'
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomItem}
                        style={{
                          padding: '14px 26px',
                          borderRadius: '14px',
                          background: '#f1f5f9',
                          border: '2px solid #cbd5e1',
                          color: '#1e293b',
                          fontWeight: '900',
                          fontSize: '0.95rem',
                          cursor: 'pointer',
                          fontFamily: 'inherit'
                        }}
                      >
                        הוסף לפרויקט
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '36px' }}>
                    <button
                      type="button"
                      onClick={() => setActiveStep(1)}
                      style={{ padding: '14px 28px', borderRadius: '16px', background: '#f1f5f9', color: '#334155', fontWeight: '800', fontSize: '1rem', border: '2px solid #cbd5e1', cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                      → חזרה
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveStep(3)}
                      style={{ padding: '14px 36px', borderRadius: '16px', background: projectType === 'hardware_software' ? '#2563eb' : '#059669', color: '#ffffff', fontWeight: '900', fontSize: '1.05rem', border: 'none', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(0,0,0,0.2)' }}
                    >
                      המשך למקורות מידע וקבצים ←
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: Documentation URL & File Upload */}
              {activeStep === 3 && (
                <div>
                  <h3 style={{
                    fontSize: '1.4rem',
                    fontWeight: '900',
                    color: '#0f172a',
                    marginBottom: '8px'
                  }}>
                    משיכת מידע מקישור והעלאת קבצים
                  </h3>
                  <p style={{ color: '#64748b', fontSize: '1rem', fontWeight: '500', marginBottom: '24px' }}>
                    יש לך דף תיעוד, מדריך, צילומי מסך או תמונות? הסוכן ישלוף משם את הטקסט והתמונות:
                  </p>

                  {/* Web URL & Custom Extraction Instructions */}
                  <div style={{ marginBottom: '26px', background: '#f8fafc', padding: '26px', borderRadius: '20px', border: '2px solid #e2e8f0' }}>
                    <div style={{ marginBottom: '20px' }}>
                      <label style={{
                        display: 'block',
                        fontSize: '1.05rem',
                        fontWeight: '900',
                        color: '#0f172a',
                        marginBottom: '10px'
                      }}>
                        קישור למדריך אינטרנט / דף תיעוד (Web URL):
                      </label>
                      <input
                        type="url"
                        placeholder="https://... הדבק קישור למדריך פרויקט, GitHub, Keyestudio או דף תיעוד"
                        value={docUrl}
                        onChange={(e) => setDocUrl(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '15px 18px',
                          borderRadius: '14px',
                          border: '2px solid #cbd5e1',
                          fontSize: '1rem',
                          fontWeight: '600',
                          color: '#0f172a',
                          outline: 'none',
                          direction: 'ltr',
                          fontFamily: 'inherit',
                          background: '#ffffff',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    {/* Targeted Extraction Instructions */}
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '0.95rem',
                        fontWeight: '900',
                        color: '#334155',
                        marginBottom: '8px'
                      }}>
                        🎯 מה תרצה שהסוכן ימשוך ויתמקד בו מהאתר? (הנחיה מדויקת לסוכן):
                      </label>
                      <textarea
                        rows={3}
                        placeholder="לדוגמה: אני רוצה שתמשוך את כל שלבי ההרכבה שיש שם, את כל התמונות שיש שם, את הטקסט, ומזה תבנה את כל הפרויקט..."
                        value={scrapeInstructions}
                        onChange={(e) => setScrapeInstructions(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '14px 18px',
                          borderRadius: '14px',
                          border: '2px solid #cbd5e1',
                          fontSize: '0.95rem',
                          fontWeight: '600',
                          color: '#0f172a',
                          outline: 'none',
                          boxSizing: 'border-box',
                          fontFamily: 'inherit',
                          background: '#ffffff',
                          resize: 'vertical'
                        }}
                      />
                      <div style={{ marginTop: '10px', fontSize: '0.86rem', color: '#059669', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>✨</span>
                        <span>הסוכן יגש ישירות לקישור זה בלחיצה על יצירת הפרויקט, ישלוף את כל התמונות וההסברים וירכיב מהם את מסלול הלימוד המלא.</span>
                      </div>
                    </div>
                  </div>

                  {/* Drag & Drop File Upload */}
                  <div style={{ marginBottom: '24px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '1.05rem',
                      fontWeight: '900',
                      color: '#0f172a',
                      marginBottom: '10px'
                    }}>
                      העלאת תמונות, סקיצות עיצוב ומדריכי PDF:
                    </label>
                    <div style={{
                      border: '2.5px dashed #cbd5e1',
                      borderRadius: '18px',
                      padding: '28px',
                      textAlign: 'center',
                      background: '#f8fafc',
                      cursor: 'pointer',
                      position: 'relative'
                    }}>
                      <input
                        type="file"
                        multiple
                        accept="image/*,application/pdf"
                        onChange={handleFileUpload}
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                      />
                      <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📁</div>
                      <div style={{ fontSize: '1.05rem', fontWeight: '900', color: '#1e293b', marginBottom: '4px' }}>
                        גרור קבצים לכאן או לחץ לבחירת קבצים
                      </div>
                      <div style={{ fontSize: '0.88rem', color: '#64748b', fontWeight: '600' }}>
                        תומך בתמונות PNG, JPG, WEBP וקובצי PDF
                      </div>
                    </div>

                    {/* Uploaded files list */}
                    {uploadedFiles.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px', marginTop: '14px' }}>
                    {uploadedFiles.map((file, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', borderRadius: '12px', background: '#f1f5f9', border: '1.5px solid #cbd5e1' }}>
                        {file.type?.includes('image') ? (
                          <img src={file.url} alt="Thumbnail" style={{ width: '42px', height: '42px', borderRadius: '8px', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '42px', height: '42px', borderRadius: '8px', background: '#ef4444', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '0.8rem' }}>PDF</div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.88rem', fontWeight: '800', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.fileName}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600' }}>{file.size}</div>
                        </div>
                        <button type="button" onClick={() => handleRemoveFile(idx)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.2rem', fontWeight: 'bold' }}>×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '36px' }}>
                <button
                  type="button"
                  onClick={() => setActiveStep(2)}
                  style={{ padding: '14px 28px', borderRadius: '16px', background: '#f1f5f9', color: '#334155', fontWeight: '800', fontSize: '1rem', border: '2px solid #cbd5e1', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  → חזרה
                </button>
                <button
                  type="button"
                  onClick={() => setActiveStep(4)}
                  style={{ padding: '14px 36px', borderRadius: '16px', background: projectType === 'hardware_software' ? '#2563eb' : '#059669', color: '#ffffff', fontWeight: '900', fontSize: '1.05rem', border: 'none', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(0,0,0,0.2)' }}
                >
                  המשך לדגשים וייצור ב-AI ←
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Custom Instructions & Generation */}
          {activeStep === 4 && (
            <div>
              <h3 style={{
                fontSize: '1.4rem',
                fontWeight: '900',
                color: '#0f172a',
                marginBottom: '8px'
              }}>
                דגשים והנחיות מיוחדות ל-AI
              </h3>
              <p style={{ color: '#64748b', fontSize: '1rem', fontWeight: '500', marginBottom: '20px' }}>
                תוכל לרשום כל דגש פדגוגי או טכני שתרצה שה-AI ישלב בשיעורים:
              </p>

              <div style={{ marginBottom: '26px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '1.05rem',
                  fontWeight: '900',
                  color: '#0f172a',
                  marginBottom: '10px'
                }}>
                  הנחיות ודגשים חופשיים:
                </label>
                <textarea
                  rows={4}
                  placeholder={projectType === 'hardware_software' ? "למשל: 'אני רוצה שפרק 2 יתמקד בבדיקת חיבורי החיישנים בטרמינל, ובפרק 3 יהיה פרויקט אוטונומי מלא...'" : "למשל: 'אני רוצה שפרק 1 יתמקד בעיצוב ה-UI ב-CSS, פרק 2 בלוגיקת ה-JavaScript, ופרק 3 בהוספת שמירה ב-LocalStorage...'"}
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '16px 20px',
                    borderRadius: '16px',
                    border: '2px solid #cbd5e1',
                    fontSize: '1.05rem',
                    fontWeight: '600',
                    color: '#0f172a',
                    outline: 'none',
                    boxSizing: 'border-box',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              {/* Summary Box */}
              <div style={{ background: '#f8fafc', padding: '22px', borderRadius: '18px', border: '2px solid #e2e8f0', marginBottom: '26px' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '1.05rem', fontWeight: '900', color: '#0f172a' }}>
                  סיכום פרטי המסלול שייווצר:
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', fontSize: '0.95rem', color: '#334155' }}>
                  <div><b>סוג מסלול:</b> {projectType === 'hardware_software' ? '🤖 חומרה ותוכנה משולב' : '💻 תוכנה בלבד'}</div>
                  <div><b>שם פרויקט:</b> {projectTitle || 'פרויקט אישי'}</div>
                  <div><b>סביבה / בקר:</b> {projectType === 'hardware_software' ? targetBoard.toUpperCase() : softwareStack.toUpperCase()}</div>
                  <div><b>פרקים:</b> {chaptersCount} פרקים</div>
                </div>
              </div>

              {errorMessage && (
                <div style={{ padding: '14px 20px', borderRadius: '14px', background: '#fef2f2', color: '#dc2626', border: '2px solid #fecaca', marginBottom: '24px', fontWeight: '800', fontSize: '0.95rem' }}>
                  ⚠️ {errorMessage}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => setActiveStep(3)}
                  style={{ padding: '14px 28px', borderRadius: '16px', background: '#f1f5f9', color: '#334155', fontWeight: '800', fontSize: '1rem', border: '2px solid #cbd5e1', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  → חזרה
                </button>

                <button
                  type="button"
                  onClick={handleGenerateTrack}
                  disabled={isGenerating}
                  style={{
                    padding: '18px 48px',
                    borderRadius: '18px',
                    background: isGenerating ? '#94a3b8' : (projectType === 'hardware_software' ? 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)' : 'linear-gradient(135deg, #059669 0%, #10b981 100%)'),
                    color: '#ffffff',
                    fontWeight: '900',
                    fontSize: '1.2rem',
                    border: 'none',
                    cursor: isGenerating ? 'not-allowed' : 'pointer',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.25)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontFamily: 'inherit'
                  }}
                >
                  {isGenerating ? (
                    <>
                      <div style={{ width: '22px', height: '22px', border: '3px solid #ffffff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                      <span>{genStepMessage || 'מייצר מסלול ב-AI...'}</span>
                    </>
                  ) : (
                    <>
                      <span>🚀 צור מסלול למידה מלא ב-AI</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Generated Track Preview Box */}
        {generatedTrack && (
          <div style={{
            background: '#ffffff',
            border: '2.5px solid #10b981',
            borderRadius: '24px',
            padding: '40px',
            boxShadow: '0 12px 40px rgba(16, 185, 129, 0.12)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '28px' }}>
              <div>
                <span style={{ fontSize: '0.88rem', fontWeight: '900', padding: '5px 14px', borderRadius: '12px', background: '#ecfdf5', color: '#047857', border: '1.5px solid #a7f3d0', display: 'inline-block', marginBottom: '10px' }}>
                  ✓ המסלול נוצר ונשמר בהצלחה במערכת!
                </span>
                <h2 style={{ fontSize: '2rem', fontWeight: '900', color: '#0f172a', margin: 0 }}>
                  {generatedTrack.title}
                </h2>
                <p style={{ color: '#475569', fontSize: '1.05rem', fontWeight: '500', margin: '8px 0 0 0' }}>
                  {generatedTrack.description}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <Link
                  to={`/track/custom/${generatedTrack.id || generatedTrack.trackId}`}
                  style={{
                    padding: '16px 32px',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                    color: '#ffffff',
                    fontWeight: '900',
                    fontSize: '1.05rem',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 16px rgba(16, 185, 129, 0.35)',
                    fontFamily: 'inherit'
                  }}
                >
                  <span>כניסה למסלול עכשיו</span>
                  <span>←</span>
                </Link>

                <button
                  type="button"
                  onClick={() => navigate('/tracks')}
                  style={{
                    padding: '16px 24px',
                    borderRadius: '16px',
                    background: '#f1f5f9',
                    border: '2px solid #cbd5e1',
                    color: '#1e293b',
                    fontWeight: '800',
                    fontSize: '1rem',
                    cursor: 'pointer',
                    fontFamily: 'inherit'
                  }}
                >
                  חזרה לעמוד הראשי
                </button>
              </div>
            </div>

            {/* Chapters Breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {generatedTrack.chapters?.map((ch, chIdx) => (
                <div key={chIdx} style={{ background: '#f8fafc', borderRadius: '18px', border: '2px solid #e2e8f0', padding: '22px' }}>
                  <h4 style={{ fontSize: '1.15rem', fontWeight: '900', color: '#0f172a', margin: '0 0 14px 0' }}>
                    {ch.title}
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
                    {ch.lessons?.map((les, lIdx) => (
                      <div key={lIdx} style={{ background: '#ffffff', borderRadius: '12px', border: '1.5px solid #e2e8f0', padding: '14px' }}>
                        <div style={{ fontSize: '0.95rem', fontWeight: '800', color: '#0f172a', marginBottom: '6px' }}>
                          {les.title}
                        </div>
                        {les.partsNeeded && (
                          <div style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: '600', marginBottom: '6px' }}>
                            <b>חלקים:</b> {les.partsNeeded.slice(0, 3).join(', ')}
                          </div>
                        )}
                        <div style={{ fontSize: '0.82rem', color: '#2563eb', fontWeight: '800' }}>
                          {les.isAssemblyStep ? 'מדריך הרכבה מכאנית' : 'שיעור תכנות ובקרה'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
          </div>
        )}
      </main>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
