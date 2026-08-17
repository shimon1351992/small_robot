import React, { useEffect, useRef, useState } from 'react';
import * as Blockly from 'blockly';
import { javascriptGenerator } from 'blockly/javascript';
import 'blockly/javascript';
import { 
  registerAllBlocks, 
  registerSingleBlock, 
  addBlockToRegistry
} from './blockRegistry';

// Supported Programming Languages
const SUPPORTED_LANGUAGES = [
  { id: 'C++ / Arduino', name: '🤖 C++ / Arduino', defaultColor: '#4338ca' },
  { id: 'HTML / CSS', name: '🌐 HTML / CSS', defaultColor: '#ea580c' },
  { id: 'JavaScript', name: '⚡ JavaScript', defaultColor: '#ca8a04' },
  { id: 'Python', name: '🐍 Python', defaultColor: '#0284c7' },
  { id: 'Java', name: '☕ Java', defaultColor: '#b45309' },
  { id: 'C#', name: '♯ C# (.NET)', defaultColor: '#059669' },
  { id: 'SQL', name: '🗄️ SQL / Database', defaultColor: '#7c3aed' }
];

// 5 Core Structural Categories
const CORE_BLOCK_CATEGORIES = [
  { 
    id: 'statement', 
    name: '⚡ בלוק פקודה בודדת / פעולה (Action Statement)', 
    desc: 'בלוק פקודה קלאסי (שקע עליון ותחתון) לביצוע פעולה, קוד HTML או סקריפט',
    defaultColor: '#ea580c'
  },
  { 
    id: 'value_input', 
    name: '🔌 בלוק מקבל מידע ומחזיר ערך (Value + Port Input)', 
    desc: 'שן יציאה משמאל (מחזיר ערך) + שקע קלט מימין לקבלת פורט/פין (לחיישני חומרה)',
    defaultColor: '#4338ca'
  },
  { 
    id: 'multi_input', 
    name: '📊 בלוק תצוגה / פלט מרובה (Multi-Input Display Block)', 
    desc: 'בלוק פקודה המכיל מספר שורות קלט מימין (להצגת נתונים/חיישנים)',
    defaultColor: '#059669'
  },
  { 
    id: 'function_def', 
    name: '📦 בלוק הגדרת פונקציה / מיכל קוד (Function Container)', 
    desc: 'בלוק עטוף המכיל חלל פנימי לרצף בלוקים שמבוצעים יחד',
    defaultColor: '#7e22ce'
  },
  { 
    id: 'function_call', 
    name: '📞 בלוק קריאה לפונקציה (Function Call Block)', 
    desc: 'בלוק פקודה בודד שמפעיל פונקציה שהוגדרה מראש',
    defaultColor: '#9333ea'
  }
];

const COLOR_SWATCHES = [
  { name: 'כתום HTML', value: '#ea580c' },
  { name: 'סגול פונקציות', value: '#7e22ce' },
  { name: 'כחול חיישנים', value: '#4338ca' },
  { name: 'ירוק תצוגה', value: '#059669' },
  { name: 'צהוב מנועים', value: '#d97706' },
  { name: 'אינדיגו סטודיו', value: '#4f46e5' }
];

// Extract Clean Title from Raw Code or Prompt
function extractCleanBlockTitle(prompt, language) {
  // Check if prompt contains <title> tag
  const titleMatch = prompt.match(/<title>(.*?)<\/title>/i);
  if (titleMatch && titleMatch[1]) {
    return `🌐 ${titleMatch[1].trim()}`;
  }

  // Check if prompt starts with raw code
  if (prompt.includes('<!DOCTYPE') || prompt.includes('<html') || prompt.includes('<div') || prompt.includes('<form')) {
    return '🌐 אפליקציית HTML/CSS מותאמת';
  }

  if (prompt.includes('def ') || prompt.includes('import ')) {
    return '🐍 סקריפט Python מותאם';
  }

  if (prompt.includes('function') || prompt.includes('const ') || prompt.includes('let ')) {
    return '⚡ פונקציית JavaScript';
  }

  return prompt.length > 28 ? prompt.substring(0, 28) + '...' : prompt;
}

// Universal AI Multi-Line Code Synthesizer
function synthesizeAICode(prompt, language) {
  // If user provided raw full code directly in prompt (HTML/Python/JS), use it directly!
  if (prompt.includes('<!DOCTYPE') || prompt.includes('<html') || prompt.includes('<div') || prompt.includes('def ') || prompt.includes('function')) {
    // Strip user's instruction prefix if present (e.g. "צור לי בלוק שמתאים לכל הקוד...")
    let cleanCode = prompt;
    const codeStartIdx = prompt.search(/(<!DOCTYPE|<html|<div|<form|def |function |public class)/i);
    if (codeStartIdx >= 0) {
      cleanCode = prompt.substring(codeStartIdx);
    }
    // Remove trailing instruction text after code
    const instructIdx = cleanCode.lastIndexOf('צור לי בלוק');
    if (instructIdx > 0) {
      cleanCode = cleanCode.substring(0, instructIdx).trim();
    }
    return cleanCode;
  }

  const p = prompt.toLowerCase();
  
  if (language === 'HTML / CSS' || p.includes('html') || p.includes('טופס') || p.includes('תמונה') || p.includes('אתר')) {
    if (p.includes('טופס') || p.includes('הרשמה') || p.includes('form')) {
      return `<form class="smart-signup-form" action="/submit" method="POST">
  <h2>טופס הרשמה אינטראקטיבי</h2>
  <div className="form-group">
    <label>שם מלא:</label>
    <input type="text" name="fullname" placeholder="הכנס שם מלא..." required />
  </div>
  <div className="form-group">
    <label>כתובת אימייל:</label>
    <input type="email" name="email" placeholder="name@example.com" required />
  </div>
  <button type="submit" class="submit-btn">הרשם עכשיו 🚀</button>
</form>`;
    } else if (p.includes('תמונה') || p.includes('קובץ') || p.includes('upload')) {
      return `<div className="image-uploader-box">
  <label for="imgInput" class="upload-label">📁 בחר תמונה להעלאה:</label>
  <input type="file" id="imgInput" accept="image/*" onchange="previewImage(event)" />
  <div id="previewContainer"></div>
</div>`;
    } else {
      return `<div className="custom-card-widget">
  <h3 className="card-title">${prompt}</h3>
  <p className="card-text">תוכן אינטראקטיבי שנוצר ב-HTML/CSS</p>
  <button class="btn-primary">לחץ כאן</button>
</div>`;
    }
  }

  if (language === 'Python' || p.includes('python') || p.includes('פייתון')) {
    return `import requests

def download_image_from_url(image_url="https://example.com/image.jpg"):
    try:
        response = requests.get(image_url, timeout=10)
        if response.status_code == 200:
            with open("downloaded.jpg", 'wb') as f:
                f.write(response.content)
            print("Image saved successfully!")
            return True
    except Exception as e:
        print(f"Error: {e}")
        return False`;
  }

  if (language === 'JavaScript' || p.includes('javascript') || p.includes('js')) {
    return `function showInteractiveAlert(message = "${prompt}") {
  alert("✨ הודעה: " + message);
  console.log("Alert displayed:", message);
}`;
  }

  return `// ${prompt}
void handleCustomHardwareAction() {
  int sensorVal = analogRead(A0);
  if (sensorVal > 500) {
    digitalWrite(LED_BUILTIN, HIGH);
  }
}`;
}

// =============================================================
// COMPONENT: LIVE REAL SVG BLOCKLY BLOCK PREVIEW
// =============================================================
function LiveBlockPreview({ blockData }) {
  const previewDivRef = useRef(null);
  const previewWorkspaceRef = useRef(null);

  useEffect(() => {
    if (!blockData || !previewDivRef.current) return;

    registerSingleBlock(blockData);

    if (previewWorkspaceRef.current) {
      try {
        previewWorkspaceRef.current.dispose();
        previewWorkspaceRef.current = null;
      } catch (e) {
        console.error(e);
      }
    }

    try {
      const ws = Blockly.inject(previewDivRef.current, {
        readOnly: false,
        scrollbars: false,
        trashcan: false,
        zoom: { controls: false, wheel: false, startScale: 1.1 }
      });

      ws.clear();
      const newBlock = ws.newBlock(blockData.id);
      newBlock.initSvg();
      newBlock.render();
      newBlock.moveBy(25, 25);

      previewWorkspaceRef.current = ws;
    } catch (err) {
      console.error('Failed to render live block preview:', err);
    }

    return () => {
      if (previewWorkspaceRef.current) {
        try {
          previewWorkspaceRef.current.dispose();
          previewWorkspaceRef.current = null;
        } catch (e) {}
      }
    };
  }, [blockData]);

  if (!blockData) return null;

  const typeMatched = CORE_BLOCK_CATEGORIES.find(c => c.id === blockData.type);

  return (
    <div style={{
      background: '#ffffff',
      borderRadius: '16px',
      border: '1.5px solid #cbd5e1',
      padding: '20px',
      boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
      marginTop: '20px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
        <h4 style={{ fontSize: '1rem', fontWeight: '800', color: '#0f172a' }}>
          🧩 תצוגת הבלוק הפיזית ב-Blockly (Real Physical SVG Shape):
        </h4>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8rem', padding: '4px 10px', borderRadius: '12px', background: '#e0e7ff', color: '#4f46e5', fontWeight: 'bold' }}>
            שפה: {blockData.language || 'C++ / Arduino'}
          </span>
          <span style={{ fontSize: '0.8rem', padding: '4px 10px', borderRadius: '12px', background: '#f1f5f9', color: '#334155', fontWeight: 'bold' }}>
            סוג: {typeMatched ? typeMatched.name.split(' ')[1] : blockData.type}
          </span>
        </div>
      </div>

      {/* SVG Workspace Canvas Preview */}
      <div 
        ref={previewDivRef} 
        style={{
          width: '100%',
          height: '160px',
          background: '#f8fafc',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          position: 'relative',
          overflow: 'hidden'
        }}
      ></div>

      {/* Dynamic Multi-line Code Snippet per Selected Language */}
      <div style={{ marginTop: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#475569' }}>
            💻 קוד <span style={{ color: '#4f46e5', fontWeight: '800' }}>{blockData.language || 'C++ / Arduino'}</span> שייווצר מהבלוק:
          </label>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
            {(blockData.code || '').split('\n').length} שורות קוד
          </span>
        </div>
        <div style={{ background: '#0f172a', padding: '14px 18px', borderRadius: '12px', direction: 'ltr', textAlign: 'left', maxHeight: '220px', overflowY: 'auto' }}>
          <pre style={{ margin: 0, fontSize: '0.85rem', color: '#38bdf8', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
            {blockData.code || '// No code defined'}
          </pre>
        </div>
      </div>
    </div>
  );
}

// =============================================================
// MAIN STUDIO COMPONENT
// =============================================================
function CodeToBlock() {
  const [activeTab, setActiveTab] = useState('ai');
  const [selectedLanguage, setSelectedLanguage] = useState('C++ / Arduino');

  // Projects State
  const [projects, setProjects] = useState(() => {
    const saved = localStorage.getItem('codetoblock_projects');
    return saved ? JSON.parse(saved) : [
      {
        id: 'proj_default',
        name: 'פרויקט פיתוח מולטי-שפתי',
        description: 'אוסף בלוקים מותאמים אישית לשפת C++, HTML, Java, Python ו-JS',
        category: 'Multi-Language',
        blocks: [
          {
            id: 'html_signup_form',
            name: '🖼️ טופס הרשמה (HTML)',
            type: 'statement',
            color: '#ea580c',
            tooltip: 'רכיב טופס הרשמה מלא ב-HTML',
            code: `<form class="signup-form">\n  <label>שם:</label>\n  <input type="text" name="name" />\n  <button type="submit">הרשם</button>\n</form>`,
            category: 'HTML / Web',
            language: 'HTML / CSS',
            createdAt: '2026-07-30'
          }
        ]
      }
    ];
  });

  const [activeProjectId, setActiveProjectId] = useState('proj_default');

  // AI Generator Agent State
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiBlockType, setAiBlockType] = useState('statement');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiLog, setAiLog] = useState('');

  // Active Preview Block Data
  const [activePreviewBlock, setActivePreviewBlock] = useState(null);

  // Manual Designer Advanced State
  const [manualName, setManualName] = useState('');
  const [manualType, setManualType] = useState('statement');
  const [manualLanguage, setManualLanguage] = useState('C++ / Arduino');
  const [manualColor, setManualColor] = useState('#4338ca');
  const [manualInputLabel, setManualInputLabel] = useState('מספר פורט');
  const [manualLinesCount, setManualLinesCount] = useState(2);
  const [manualHasFieldInput, setManualHasFieldInput] = useState(false);
  const [manualFieldDefault, setManualFieldDefault] = useState('100');
  const [manualTooltip, setManualTooltip] = useState('');
  const [manualCode, setManualCode] = useState('');
  const [manualCategory, setManualCategory] = useState('כללי');

  useEffect(() => {
    registerAllBlocks();
  }, []);

  useEffect(() => {
    localStorage.setItem('codetoblock_projects', JSON.stringify(projects));
  }, [projects]);

  const activeProject = projects.find(p => p.id === activeProjectId) || projects[0];

  // AI Block Generator Agent
  const handleAIGenerate = (promptToUse) => {
    const prompt = promptToUse || aiPrompt;
    if (!prompt.trim()) {
      alert('נא להזין תיאור או קוד לבלוק שתרצה ליצור!');
      return;
    }

    setIsGenerating(true);
    setAiLog(`🤖 מנתח את הקוד/פרומפט ומזהה שפה ומבנה...`);

    setTimeout(() => {
      let detectedLang = selectedLanguage;
      if (prompt.includes('<!DOCTYPE') || prompt.includes('<html') || prompt.includes('<div') || prompt.includes('HTML') || prompt.includes('אתר')) {
        detectedLang = 'HTML / CSS';
      } else if (prompt.includes('def ') || prompt.includes('Python')) {
        detectedLang = 'Python';
      } else if (prompt.includes('function') || prompt.includes('JavaScript') || prompt.includes('JS')) {
        detectedLang = 'JavaScript';
      }

      // Auto-detect block type: Raw code or web blocks default to 'statement' (No Port Number!)
      let finalBlockType = aiBlockType;
      const isRawCode = prompt.includes('<!DOCTYPE') || prompt.includes('<html') || prompt.includes('<div') || prompt.includes('def ');
      if (isRawCode || detectedLang === 'HTML / CSS' || detectedLang === 'JavaScript' || detectedLang === 'Python') {
        if (aiBlockType === 'value_input') {
          finalBlockType = 'statement';
        }
      }

      setAiLog(`⚙️ מפיק קוד ${detectedLang} ונקה שדות חומרה...`);

      setTimeout(() => {
        const generatedId = `ai_block_${Date.now()}`;
        const cleanTitle = extractCleanBlockTitle(prompt, detectedLang);
        const generatedCodeSnippet = synthesizeAICode(prompt, detectedLang);

        const defaultColor = detectedLang === 'HTML / CSS' ? '#ea580c' : detectedLang === 'Python' ? '#0284c7' : detectedLang === 'JavaScript' ? '#ca8a04' : '#4f46e5';

        const newBlock = {
          id: generatedId,
          name: cleanTitle,
          type: finalBlockType,
          color: defaultColor,
          hasFieldInput: false,
          tooltip: `בלוק AI בשפת ${detectedLang}: ${cleanTitle}`,
          code: generatedCodeSnippet,
          category: detectedLang,
          language: detectedLang,
          createdAt: new Date().toLocaleDateString('he-IL')
        };

        addBlockToRegistry(newBlock);

        setProjects(prev => prev.map(p => {
          if (p.id === activeProjectId) {
            return { ...p, blocks: [newBlock, ...(p.blocks || [])] };
          }
          return p;
        }));

        setActivePreviewBlock(newBlock);
        setIsGenerating(false);
        setAiLog('');
        setAiPrompt('');
      }, 700);
    }, 600);
  };

  // Live Manual Preview Update
  useEffect(() => {
    if (activeTab === 'manual' && manualName.trim()) {
      const tempBlock = {
        id: 'manual_preview_temp',
        name: manualName,
        type: manualType,
        color: manualColor,
        inputLabel: manualInputLabel,
        inputLinesCount: manualLinesCount,
        hasFieldInput: manualHasFieldInput,
        fieldDefault: manualFieldDefault,
        tooltip: manualTooltip,
        code: manualCode,
        category: manualCategory,
        language: manualLanguage
      };
      setActivePreviewBlock(tempBlock);
    }
  }, [manualName, manualType, manualColor, manualInputLabel, manualLinesCount, manualHasFieldInput, manualFieldDefault, manualTooltip, manualCode, manualCategory, manualLanguage, activeTab]);

  // Manual Block Handler
  const handleManualCreate = () => {
    if (!manualName.trim()) {
      alert('נא להזין שם לבלוק!');
      return;
    }
    const newBlock = {
      id: `manual_block_${Date.now()}`,
      name: manualName,
      type: manualType,
      color: manualColor,
      inputLabel: manualInputLabel,
      inputLinesCount: manualLinesCount,
      hasFieldInput: manualHasFieldInput,
      fieldDefault: manualFieldDefault,
      tooltip: manualTooltip || 'בלוק מותאם אישית',
      code: manualCode || '// Custom code\n',
      category: manualCategory,
      language: manualLanguage,
      createdAt: new Date().toLocaleDateString('he-IL')
    };

    addBlockToRegistry(newBlock);

    setProjects(prev => prev.map(p => {
      if (p.id === activeProjectId) {
        return { ...p, blocks: [newBlock, ...(p.blocks || [])] };
      }
      return p;
    }));

    setManualName('');
    setManualTooltip('');
    setManualCode('');
    alert(`🎉 הבלוק נוצר בהצלחה!`);
    setActiveTab('library');
  };

  // Export Project Blocks to Main Studio
  const handleExportToMainStudio = () => {
    if (!activeProject || !activeProject.blocks.length) {
      alert('אין בלוקים בפרויקט הנוכחי לייצוא!');
      return;
    }
    localStorage.setItem('userCustomBlocks', JSON.stringify(activeProject.blocks));
    alert(`🚀 ${activeProject.blocks.length} בלוקים מתוך הפרויקט "${activeProject.name}" ייוצאו בהצלחה לסביבות הפיתוח הראשיות!`);
  };

  // Delete Block Handler
  const handleDeleteBlock = (blockId) => {
    if (window.confirm('האם למחוק בלוק זה?')) {
      setProjects(prev => prev.map(p => {
        if (p.id === activeProjectId) {
          return { ...p, blocks: p.blocks.filter(b => b.id !== blockId) };
        }
        return p;
      }));
    }
  };

  return (
    <div className="codetoblock-wrapper">
      {/* Header Bar */}
      <div className="codetoblock-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a' }}>
            🧩 מחולל הבלוקים החכם (CodeToBlock AI Studio)
          </span>
          <span style={{ fontSize: '0.8rem', padding: '4px 12px', borderRadius: '12px', background: '#e0e7ff', color: '#4f46e5', fontWeight: 'bold' }}>
            פרויקט: {activeProject?.name}
          </span>
        </div>

        {/* Navigation Tabs */}
        <div className="codetoblock-nav-tabs">
          <button 
            className={`codetoblock-tab-btn ${activeTab === 'ai' ? 'active' : ''}`}
            onClick={() => setActiveTab('ai')}
          >
            ✨ מחולל AI
          </button>
          <button 
            className={`codetoblock-tab-btn ${activeTab === 'projects' ? 'active' : ''}`}
            onClick={() => setActiveTab('projects')}
          >
            📁 ניהול פרויקטים
          </button>
          <button 
            className={`codetoblock-tab-btn ${activeTab === 'manual' ? 'active' : ''}`}
            onClick={() => setActiveTab('manual')}
          >
            🛠️ יוצר ידני
          </button>
          <button 
            className={`codetoblock-tab-btn ${activeTab === 'library' ? 'active' : ''}`}
            onClick={() => setActiveTab('library')}
          >
            📦 ספריית הבלוקים שלי ({activeProject?.blocks?.length || 0})
          </button>
        </div>

        <div>
          <button onClick={handleExportToMainStudio} className="builder-btn builder-btn-hero">
            🚀 ייצא לסביבות הבלוקים הראשיות
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ padding: '32px 24px', flex: 1, maxWidth: '1200px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        
        {/* TAB 1: MULTI-LANGUAGE & STRUCTURAL AI GENERATOR */}
        {activeTab === 'ai' && (
          <div className="ai-generator-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0f172a' }}>
                ✨ סוכן AI ליצירת בלוקים בכל שפה, קוד מותאם ומבנה
              </h2>

              {/* Target Programming Language Selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#475569' }}>שפת יעד:</span>
                <select 
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="builder-select-box"
                  style={{ background: '#f5f3ff', borderColor: '#818cf8', fontWeight: 'bold', color: '#4338ca' }}
                >
                  {SUPPORTED_LANGUAGES.map(lang => (
                    <option key={lang.id} value={lang.id}>{lang.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Suggestion Chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
              <span style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 'bold', alignSelf: 'center' }}>הצעות מהירות:</span>
              <button onClick={() => { setSelectedLanguage('HTML / CSS'); handleAIGenerate('צור בלוק HTML לבניית טופס הרשמה מלא עם שם ואימייל'); }} className="ai-suggestion-chip">
                🖼️ HTML: טופס הרשמה מלא
              </button>
              <button onClick={() => { setSelectedLanguage('Python'); handleAIGenerate('צור בלוק Python שמוריד תמונה מכתובת URL ומקבל URL כקלט'); }} className="ai-suggestion-chip">
                🐍 Python: הורדת תמונה מ-URL
              </button>
              <button onClick={() => { setSelectedLanguage('JavaScript'); handleAIGenerate('צור בלוק JS שמציג חלון התראה אינטראקטיבי'); }} className="ai-suggestion-chip">
                ⚡ JS: חלון התראה
              </button>
            </div>

            {/* Visual Structural Category Selector in AI Tab */}
            <div style={{ marginBottom: '20px', background: '#f8fafc', padding: '14px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
                🧱 בחר את סוג המבנה של הבלוק:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
                {CORE_BLOCK_CATEGORIES.map(cat => (
                  <div 
                    key={cat.id}
                    onClick={() => setAiBlockType(cat.id)}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: aiBlockType === cat.id ? `2px solid ${cat.defaultColor}` : '1px solid #cbd5e1',
                      background: aiBlockType === cat.id ? '#f5f3ff' : '#ffffff',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ fontWeight: '800', fontSize: '0.85rem', color: cat.defaultColor, marginBottom: '4px' }}>
                      {cat.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', lineHeight: '1.3' }}>
                      {cat.desc}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Prompt Input Box */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '20px' }}>
              <textarea 
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="הדבק כאן קוד מלא (HTML/CSS/JS/Python/Java) או תיאור חופשי ליצירת בלוק מותאם..."
                style={{
                  flex: 1,
                  padding: '14px 18px',
                  borderRadius: '12px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.9rem',
                  fontFamily: 'monospace',
                  outline: 'none',
                  boxSizing: 'border-box',
                  height: '70px',
                  resize: 'vertical'
                }}
              />
              <button 
                onClick={() => handleAIGenerate()} 
                disabled={isGenerating}
                className="builder-btn builder-btn-hero"
                style={{ padding: '14px 28px', fontSize: '0.95rem', flexShrink: 0, height: '70px' }}
              >
                {isGenerating ? '⏳ מייצר...' : '✨ צור בלוק ב-AI'}
              </button>
            </div>

            {/* AI Log Progress Status */}
            {aiLog && (
              <div style={{ padding: '12px 18px', borderRadius: '10px', background: '#eff6ff', color: '#1e40af', fontSize: '0.9rem', fontWeight: 'bold' }}>
                {aiLog}
              </div>
            )}

            {/* LIVE REAL SVG BLOCKLY BLOCK PREVIEW */}
            {activePreviewBlock && (
              <LiveBlockPreview blockData={activePreviewBlock} />
            )}
          </div>
        )}

        {/* TAB 3: ADVANCED MANUAL BLOCK DESIGNER */}
        {activeTab === 'manual' && (
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            <div className="ai-generator-panel" style={{ flex: 1, minWidth: '340px', margin: 0 }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#0f172a', marginBottom: '16px' }}>
                🛠️ מעבדת יצירת בלוקים ידנית (Any Language & Code Length)
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>שם הבלוק:</label>
                    <input 
                      type="text" 
                      value={manualName} 
                      onChange={(e) => setManualName(e.target.value)} 
                      className="builder-input-field" 
                      style={{ width: '100%' }}
                      placeholder="לדוגמה: טופס הרשמה ב-HTML / הדגמת קלט ופלט"
                    />
                  </div>

                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>שפת תכנות:</label>
                    <select 
                      value={manualLanguage} 
                      onChange={(e) => setManualLanguage(e.target.value)} 
                      className="builder-select-box"
                      style={{ width: '100%', fontWeight: 'bold', color: '#4f46e5' }}
                    >
                      {SUPPORTED_LANGUAGES.map(lang => (
                        <option key={lang.id} value={lang.id}>{lang.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>סוג מבנה הבלוק:</label>
                  <select 
                    value={manualType} 
                    onChange={(e) => {
                      setManualType(e.target.value);
                      const matched = CORE_BLOCK_CATEGORIES.find(c => c.id === e.target.value);
                      if (matched) setManualColor(matched.defaultColor);
                    }} 
                    className="builder-select-box"
                    style={{ width: '100%', fontWeight: 'bold', color: '#4338ca' }}
                  >
                    {CORE_BLOCK_CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                {/* COLOR PALETTE SWATCHES */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '6px' }}>בחר צבע לבלוק:</label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                    {COLOR_SWATCHES.map(swatch => (
                      <button
                        key={swatch.value}
                        type="button"
                        onClick={() => setManualColor(swatch.value)}
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          background: swatch.value,
                          border: manualColor === swatch.value ? '3px solid #0f172a' : '1px solid #cbd5e1',
                          cursor: 'pointer',
                          transform: manualColor === swatch.value ? 'scale(1.15)' : 'scale(1)'
                        }}
                        title={swatch.name}
                      />
                    ))}
                    <input 
                      type="color" 
                      value={manualColor} 
                      onChange={(e) => setManualColor(e.target.value)} 
                      style={{ width: '36px', height: '30px', borderRadius: '6px', border: '1px solid #cbd5e1', cursor: 'pointer' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>
                    קוד <span style={{ color: '#4f46e5', fontWeight: 'bold' }}>{manualLanguage}</span> (בכל אורך שתרצה):
                  </label>
                  <textarea 
                    value={manualCode} 
                    onChange={(e) => setManualCode(e.target.value)} 
                    className="builder-input-field" 
                    style={{ width: '100%', height: '110px', fontFamily: 'monospace', direction: 'ltr', textAlign: 'left' }}
                    placeholder={manualLanguage === 'HTML / CSS' ? '<div className="container">...' : 'def main():\n  pass'}
                  />
                </div>

                <button onClick={handleManualCreate} className="builder-btn builder-btn-hero">
                  ➕ צור בלוק חדש
                </button>
              </div>
            </div>

            {/* LIVE REAL SVG PREVIEW PANEL */}
            <div style={{ flex: 1, minWidth: '340px' }}>
              {activePreviewBlock && (
                <LiveBlockPreview blockData={activePreviewBlock} />
              )}
            </div>
          </div>
        )}

        {/* TAB 4: MY CUSTOM BLOCK LIBRARY */}
        {activeTab === 'library' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0f172a' }}>
                📦 ספריית הבלוקים של {activeProject?.name} ({activeProject?.blocks?.length || 0})
              </h2>
              <button onClick={() => setActiveTab('ai')} className="builder-btn builder-btn-hero">
                ✨ צור בלוק נוסף ב-AI
              </button>
            </div>

            {(!activeProject?.blocks || activeProject.blocks.length === 0) ? (
              <div style={{ padding: '60px 20px', background: '#fff', borderRadius: '20px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                <span style={{ fontSize: '3rem', display: 'block', marginBottom: '12px' }}>🧩</span>
                <h3 style={{ color: '#0f172a', marginBottom: '6px' }}>עדיין אין בלוקים בפרויקט זה</h3>
                <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '20px' }}>השתמש בסוכן ה-AI כדי ליצור בלוקים מותאמים אישית בקלות ובמהירות!</p>
                <button onClick={() => setActiveTab('ai')} className="builder-btn builder-btn-hero">
                  ✨ מעבר למחולל ה-AI
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
                {activeProject.blocks.map((block) => (
                  <div key={block.id} className="custom-block-card">
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '6px' }}>
                        <span style={{ 
                          fontSize: '0.8rem', 
                          padding: '4px 10px', 
                          borderRadius: '8px', 
                          background: block.color || '#ea580c', 
                          color: '#ffffff', 
                          fontWeight: '800' 
                        }}>
                          {block.language || 'C++ / Arduino'}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                          {(block.code || '').split('\n').length} שורות קוד
                        </span>
                      </div>

                      <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
                        {block.name}
                      </h3>

                      <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '12px' }}>
                        {block.tooltip}
                      </p>

                      <div style={{ background: '#0f172a', padding: '10px 14px', borderRadius: '10px', direction: 'ltr', textAlign: 'left', marginBottom: '16px', maxHeight: '140px', overflowY: 'auto' }}>
                        <pre style={{ margin: 0, fontSize: '0.82rem', color: '#38bdf8', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                          {block.code}
                        </pre>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button 
                        onClick={() => handleDeleteBlock(block.id)} 
                        className="builder-btn"
                        style={{ color: '#ef4444', borderColor: '#fca5a5' }}
                      >
                        🗑️ מחק
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

export default CodeToBlock;