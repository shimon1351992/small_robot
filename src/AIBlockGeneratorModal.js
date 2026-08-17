import React, { useState } from 'react';
import { addBlockToRegistry, getAllRegisteredBlocks } from './blockRegistry';

function AIBlockGeneratorModal({ isOpen, onClose, onBlockCreated }) {
  const [targetLanguage, setTargetLanguage] = useState('C++ / Arduino');
  const [selectedBlockType, setSelectedBlockType] = useState('statement');
  
  // Project / Category State
  const [selectedProject, setSelectedProject] = useState('🏎️ הנעת 4WD וזיווד Freenove');
  const [customProjectName, setCustomProjectName] = useState('');
  const [isCreatingNewProject, setIsCreatingNewProject] = useState(false);

  // Prompt State
  const [promptText, setPromptText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  // Existing Project / Category options
  const existingBlocks = getAllRegisteredBlocks();
  const projectCategoriesSet = new Set([
    '🏎️ הנעת 4WD וזיווד Freenove',
    '🏠 בית חכם',
    '🤖 רובוט',
    '⚡ ESP32',
    '🔥 Firebase',
    '🎮 בקרה',
    '🔁 לולאות',
    '🔢 מתמטיקה',
    '📝 טקסט'
  ]);

  existingBlocks.forEach(b => {
    if (b.project) projectCategoriesSet.add(b.project);
    if (b.category) projectCategoriesSet.add(b.category);
  });

  const projectCategories = Array.from(projectCategoriesSet);

  const handleQuickPrompt = (lang, text) => {
    setTargetLanguage(lang);
    setPromptText(text);
  };

  const handleGenerateBlock = () => {
    if (!promptText.trim()) {
      alert('נא להזין תיאור או קוד עבור הבלוק!');
      return;
    }

    const finalProjectName = isCreatingNewProject 
      ? (customProjectName.trim() || '🧩 פרויקט אישי חדש') 
      : selectedProject;

    setIsGenerating(true);

    setTimeout(() => {
      const blockId = `ai_custom_${Date.now()}`;
      
      let newBlock = {
        id: blockId,
        name: promptText.split('\n')[0].substring(0, 30) || 'בלוק AI חדש',
        type: selectedBlockType,
        color: selectedBlockType === 'value_input' ? '#4338ca' :
               selectedBlockType === 'multi_input' ? '#059669' :
               selectedBlockType === 'function_def' ? '#7e22ce' :
               selectedBlockType === 'function_call' ? '#9333ea' : '#ea580c',
        tooltip: promptText.substring(0, 60),
        code: promptText.includes('void') || promptText.includes('function') 
          ? promptText 
          : `// AI Generated Block (${targetLanguage})\n${promptText}\n`,
        project: finalProjectName,
        category: finalProjectName,
        language: targetLanguage,
        createdAt: new Date().toLocaleDateString('he-IL')
      };

      if (selectedBlockType === 'value_input') {
        newBlock.hasValueInput = true;
        newBlock.inputLabel = 'מספר פורט / פין:';
      } else if (selectedBlockType === 'multi_input') {
        newBlock.inputLinesCount = 4;
      }

      addBlockToRegistry(newBlock);
      setIsGenerating(false);

      if (onBlockCreated) {
        onBlockCreated(newBlock);
      }

      alert(`🎉 הבלוק נוצר בהצלחה והתווסף לקטגוריה "${finalProjectName}"!`);
      onClose();
    }, 800);
  };

  // Render Visual Block Preview Illustration Data
  const renderBlockPreviewIllustration = () => {
    switch (selectedBlockType) {
      case 'statement':
        return (
          <div style={{ background: '#fff7ed', border: '2px dashed #f97316', borderRadius: '20px', padding: '24px', textAlign: 'right' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: '800', padding: '4px 12px', background: '#ffedd5', color: '#c2410c', borderRadius: '10px' }}>
                ⚡ בלוק פקודה בודדת (Action Statement)
              </span>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>שקע עליון + שקע תחתון</span>
            </div>

            {/* Visual Vector Block Graphic */}
            <div style={{ background: '#ea580c', color: '#ffffff', borderRadius: '14px', padding: '16px 20px', fontWeight: '800', fontSize: '1rem', boxShadow: '0 8px 20px rgba(234, 88, 12, 0.25)', position: 'relative', margin: '10px 0' }}>
              <div style={{ position: 'absolute', top: '-8px', right: '30px', width: '24px', height: '8px', background: '#fff7ed', borderRadius: '0 0 4px 4px' }}></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span>⚡</span>
                <span>הפעל מנוע | כיוון: [ קדימה ] | מהירות: [ 200 ]</span>
              </div>
              <div style={{ position: 'absolute', bottom: '-8px', right: '30px', width: '24px', height: '8px', background: '#ea580c', borderRadius: '0 0 4px 4px' }}></div>
            </div>
            
            <p style={{ color: '#475569', fontSize: '0.85rem', margin: '12px 0 0 0', lineHeight: '1.5' }}>
              💡 <strong>שימוש:</strong> בלוק פקודה קלאסי שמתחבר למעלה ולמטה ברצף פקודות (למשל: נהיגה, הדלקת נורה, השהייה).
            </p>
          </div>
        );

      case 'value_input':
        return (
          <div style={{ background: '#eef2ff', border: '2px dashed #6366f1', borderRadius: '20px', padding: '24px', textAlign: 'right' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: '800', padding: '4px 12px', background: '#e0e7ff', color: '#3730a3', borderRadius: '10px' }}>
                🔌 בלוק מקבל מידע ומחזיר ערך (Value Input)
              </span>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>שן יציאה משמאל + שקע קלט מימין</span>
            </div>

            {/* Visual Vector Block Graphic */}
            <div style={{ background: '#4338ca', color: '#ffffff', borderRadius: '24px 14px 14px 24px', padding: '16px 20px', fontWeight: '800', fontSize: '0.95rem', boxShadow: '0 8px 20px rgba(67, 56, 202, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '10px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#a5b4fc', marginLeft: '-10px' }}></div>
                <span>🔌 קרא מרחק חיישן אולטרסוני</span>
              </div>
              <div style={{ background: '#312e81', padding: '6px 14px', borderRadius: '10px', fontSize: '0.85rem', border: '1px solid #6366f1' }}>
                פורט/פין: [ A0 ]
              </div>
            </div>
            
            <p style={{ color: '#475569', fontSize: '0.85rem', margin: '12px 0 0 0', lineHeight: '1.5' }}>
              💡 <strong>שימוש:</strong> מתחבר כשן יציאה לתוך בלוקים אחרים ומחזיר ערך (למשל: מדידת מרחק, קריאת טמפרטורה, מזהה תנועה).
            </p>
          </div>
        );

      case 'multi_input':
        return (
          <div style={{ background: '#ecfdf5', border: '2px dashed #10b981', borderRadius: '20px', padding: '24px', textAlign: 'right' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: '800', padding: '4px 12px', background: '#d1fae5', color: '#047857', borderRadius: '10px' }}>
                📊 בלוק תצוגה / פלט מרובה (Multi-Input Display)
              </span>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>שורות קלט מרובות</span>
            </div>

            {/* Visual Vector Block Graphic */}
            <div style={{ background: '#059669', color: '#ffffff', borderRadius: '14px', padding: '18px 22px', fontWeight: '800', fontSize: '0.95rem', boxShadow: '0 8px 20px rgba(5, 150, 105, 0.25)', margin: '10px 0' }}>
              <div style={{ marginBottom: '10px', fontSize: '1rem', borderBottom: '1px solid #34d399', paddingBottom: '6px' }}>
                📊 הצגת נתוני חיישנים במסך
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', background: '#047857', padding: '4px 10px', borderRadius: '8px' }}>
                  <span>תווית 1: חיישן אור</span>
                  <span style={{ background: '#064e3b', padding: '2px 8px', borderRadius: '6px' }}>[ input ]</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', background: '#047857', padding: '4px 10px', borderRadius: '8px' }}>
                  <span>תווית 2: חיישן גז</span>
                  <span style={{ background: '#064e3b', padding: '2px 8px', borderRadius: '6px' }}>[ input ]</span>
                </div>
              </div>
            </div>
            
            <p style={{ color: '#475569', fontSize: '0.85rem', margin: '12px 0 0 0', lineHeight: '1.5' }}>
              💡 <strong>שימוש:</strong> מציג מספר שורות קלט מימין להזנת שדות מרובים בבת אחת (כמו במסכי LCD או דוחות חיישנים).
            </p>
          </div>
        );

      case 'function_def':
        return (
          <div style={{ background: '#faf5ff', border: '2px dashed #a855f7', borderRadius: '20px', padding: '24px', textAlign: 'right' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: '800', padding: '4px 12px', background: '#f3e8ff', color: '#6b21a8', borderRadius: '10px' }}>
                📦 בלוק הגדרת פונקציה / מיכל קוד (Container)
              </span>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>חלל פנימי עטוף</span>
            </div>

            {/* Visual Vector Block Graphic */}
            <div style={{ background: '#7e22ce', color: '#ffffff', borderRadius: '14px', padding: '16px 20px', fontWeight: '800', fontSize: '0.95rem', boxShadow: '0 8px 20px rgba(126, 34, 206, 0.25)', margin: '10px 0' }}>
              <div style={{ marginBottom: '8px' }}>📦 void checkTemperature() &#123;</div>
              <div style={{ background: '#581c87', padding: '12px 16px', borderRadius: '10px', color: '#d8b4fe', margin: '8px 12px', border: '1px dashed #c084fc', fontSize: '0.85rem' }}>
                🧩 גרור בלוקים לתוך החלל הפנימי...
              </div>
              <div>&#125;</div>
            </div>
            
            <p style={{ color: '#475569', fontSize: '0.85rem', margin: '12px 0 0 0', lineHeight: '1.5' }}>
              💡 <strong>שימוש:</strong> עוטף רצף בלוקים בתוך פונקציה עם חלל פנימי פתוח (למשל: תנאים, לולאות, או פונקציות שירות).
            </p>
          </div>
        );

      case 'function_call':
        return (
          <div style={{ background: '#fdf4ff', border: '2px dashed #c084fc', borderRadius: '20px', padding: '24px', textAlign: 'right' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: '800', padding: '4px 12px', background: '#fae8ff', color: '#7e22ce', borderRadius: '10px' }}>
                📞 בלוק קריאה לפונקציה (Function Call Block)
              </span>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>הפעלה מהירה</span>
            </div>

            {/* Visual Vector Block Graphic */}
            <div style={{ background: '#9333ea', color: '#ffffff', borderRadius: '14px', padding: '16px 20px', fontWeight: '800', fontSize: '1rem', boxShadow: '0 8px 20px rgba(147, 51, 234, 0.25)', margin: '10px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>📞</span>
              <span>checkTemperature(); // הפעל פונקציית בדיקה</span>
            </div>
            
            <p style={{ color: '#475569', fontSize: '0.85rem', margin: '12px 0 0 0', lineHeight: '1.5' }}>
              💡 <strong>שימוש:</strong> פקודת זימון בודדת המפעילה פונקציה שהוגדרה מראש ברחבי הקוד.
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(15, 23, 42, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justify: 'center',
        zIndex: 99999,
        backdropFilter: 'blur(8px)',
        padding: '20px',
        boxSizing: 'border-box'
      }}
      onClick={onClose}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          margin: 'auto',
          background: '#ffffff',
          borderRadius: '24px',
          width: '800px',
          maxWidth: '92vw',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 25px 60px rgba(15, 23, 42, 0.35)',
          border: '1px solid #cbd5e1',
          padding: '32px',
          direction: 'rtl'
        }}
      >
        
        {/* HEADER BAR */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1.5px solid #f1f5f9', paddingBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '1.8rem' }}>✨</span>
            <div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                סוכן AI ליצירת בלוקים בכל שפה, קוד מותאם ומבנה
              </h3>
              <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                צור בלוקים מותאמים אישית ושייך אותם לפרויקטים בסרגל הכלים
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#475569' }}>שפת יעד:</span>
            <select 
              value={targetLanguage} 
              onChange={(e) => setTargetLanguage(e.target.value)}
              className="builder-select-box"
              style={{ padding: '6px 12px', fontWeight: 'bold', color: '#4338ca', borderRadius: '10px' }}
            >
              <option value="C++ / Arduino">C++ / Arduino 🤖</option>
              <option value="JavaScript">JavaScript ⚡</option>
              <option value="Python">Python 🐍</option>
              <option value="HTML / CSS">HTML / CSS 🖼️</option>
            </select>
            <button 
              onClick={onClose} 
              style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', color: '#64748b', fontWeight: 'bold', fontSize: '1rem' }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* QUICK SUGGESTIONS CHIPS */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '22px' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 'bold', color: '#64748b' }}>הצעות מהירות:</span>
          <button 
            onClick={() => handleQuickPrompt('HTML / CSS', '<form style="padding:20px"><input type="text" placeholder="שם"/><button>הרשמה</button></form>')}
            style={{ padding: '5px 12px', borderRadius: '16px', background: '#f8fafc', border: '1px solid #cbd5e1', fontSize: '0.8rem', cursor: 'pointer', color: '#334155' }}
          >
            🖼️ HTML: טופס הרשמה מלא
          </button>
          <button 
            onClick={() => handleQuickPrompt('Python', 'import urllib.request\nurllib.request.urlretrieve(url, "image.jpg")')}
            style={{ padding: '5px 12px', borderRadius: '16px', background: '#f8fafc', border: '1px solid #cbd5e1', fontSize: '0.8rem', cursor: 'pointer', color: '#334155' }}
          >
            🐍 Python: הורדת תמונה מ-URL
          </button>
          <button 
            onClick={() => handleQuickPrompt('JavaScript', 'alert("התראה מותאמת אישית!");')}
            style={{ padding: '5px 12px', borderRadius: '16px', background: '#f8fafc', border: '1px solid #cbd5e1', fontSize: '0.8rem', cursor: 'pointer', color: '#334155' }}
          >
            ⚡ JS: חלון התראה
          </button>
        </div>

        {/* PROJECT / CATEGORY SELECTION SECTION */}
        <div style={{ background: '#f8fafc', padding: '18px 22px', borderRadius: '18px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <label style={{ fontSize: '0.92rem', fontWeight: '800', color: '#0f172a' }}>
              📁 בחר פרויקט / קטגוריה עבור הבלוק הנוצר:
            </label>
            <button 
              onClick={() => setIsCreatingNewProject(!isCreatingNewProject)}
              style={{ background: 'none', border: 'none', color: '#4f46e5', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer' }}
            >
              {isCreatingNewProject ? '↩️ בחר פרויקט קיים' : '➕ צור פרויקט/קטגוריה חדשה'}
            </button>
          </div>

          {!isCreatingNewProject ? (
            <select 
              value={selectedProject} 
              onChange={(e) => setSelectedProject(e.target.value)}
              className="builder-select-box"
              style={{ width: '100%', padding: '10px 14px', fontSize: '0.92rem', fontWeight: 'bold', color: '#1e293b' }}
            >
              {projectCategories.map((cat, idx) => (
                <option key={idx} value={cat}>{cat}</option>
              ))}
            </select>
          ) : (
            <input 
              type="text" 
              value={customProjectName}
              onChange={(e) => setCustomProjectName(e.target.value)}
              placeholder="הכנס שם פרויקט חדש (למשל: 🌱 חממה חכמה, 🚀 רחפן ESP32)..."
              className="builder-input-field"
              style={{ width: '100%', padding: '10px 14px', fontSize: '0.92rem' }}
            />
          )}
        </div>

        {/* BLOCK TYPE DROPDOWN SELECTOR & BIG VISUAL PREVIEW AREA */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ fontSize: '0.95rem', fontWeight: '800', color: '#0f172a', display: 'block', marginBottom: '10px' }}>
            🧱 בחר את סוג המבנה של הבלוק מתוך הרשימה:
          </label>

          <select 
            value={selectedBlockType} 
            onChange={(e) => setSelectedBlockType(e.target.value)}
            className="builder-select-box"
            style={{ width: '100%', padding: '12px 16px', fontSize: '0.95rem', fontWeight: 'bold', color: '#4338ca', borderRadius: '14px', marginBottom: '16px', border: '2px solid #c7d2fe' }}
          >
            <option value="statement">⚡ בלוק פקודה בודדת / פעולה (Action Statement)</option>
            <option value="value_input">🔌 בלוק מקבל מידע ומחזיר ערך (Value + Port Input)</option>
            <option value="multi_input">📊 בלוק תצוגה / פלט מרובה (Multi-Input Display)</option>
            <option value="function_def">📦 בלוק הגדרת פונקציה / מיכל קוד (Function Container)</option>
            <option value="function_call">📞 בלוק קריאה לפונקציה (Function Call Block)</option>
          </select>

          {/* LARGE VISUAL BLOCK PREVIEW CANVAS */}
          {renderBlockPreviewIllustration()}
        </div>

        {/* PROMPT / CODE INPUT TEXTAREA */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ fontSize: '0.92rem', fontWeight: '800', color: '#0f172a', display: 'block', marginBottom: '8px' }}>
            📝 תיאור הבלוק או הקוד המיועד ({targetLanguage}):
          </label>
          <textarea 
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            placeholder="הדבק כאן קוד מלא (HTML/CSS/JS/Python/Java) או תיאור חופשי ליצירת בלוק מותאם..."
            className="builder-input-field"
            style={{ width: '100%', height: '110px', padding: '14px', fontSize: '0.92rem', boxSizing: 'border-box' }}
          />
        </div>

        {/* BOTTOM ACTION BUTTONS */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button onClick={onClose} className="builder-btn" style={{ padding: '12px 24px' }}>
            ביטול
          </button>
          <button 
            onClick={handleGenerateBlock} 
            className="builder-btn builder-btn-hero"
            disabled={isGenerating}
            style={{ padding: '12px 32px', fontSize: '1rem' }}
          >
            {isGenerating ? '⏳ מייצר בלוק ב-AI...' : '✨ צור בלוק ב-AI'}
          </button>
        </div>

      </div>
    </div>
  );
}

export default AIBlockGeneratorModal;
