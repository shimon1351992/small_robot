import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import * as Blockly from 'blockly';
import { javascriptGenerator } from "blockly/javascript";
import MonacoEditor from 'react-monaco-editor';
import { registerAllBlocks, addBlockToRegistry } from './blockRegistry';

// ===== הגדרות בלוקים ראשוניים =====

// בלוק כפתור
Blockly.Blocks["html_button"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("כפתור עם טקסט:")
      .appendField(new Blockly.FieldTextInput("לחץ עלי"), "LABEL");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(230);
    this.setTooltip("יוצר כפתור HTML");
  },
};
javascriptGenerator["html_button"] = function (block) {
  const label = block.getFieldValue("LABEL");
  return `<button>${label}</button>\n`;
};

// בלוק טקסט
Blockly.Blocks["html_text"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("טקסט:")
      .appendField(new Blockly.FieldTextInput("שלום עולם"), "TEXT");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(160);
    this.setTooltip("יוצר פסקה עם טקסט");
  },
};
javascriptGenerator["html_text"] = function (block) {
  const text = block.getFieldValue("TEXT");
  return `<p>${text}</p>\n`;
};

// בלוק קלט
Blockly.Blocks["html_input"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("תיבת קלט עם placeholder:")
      .appendField(new Blockly.FieldTextInput("הכנס טקסט..."), "PLACEHOLDER");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(120);
    this.setTooltip("יוצר תיבת קלט");
  },
};
javascriptGenerator["html_input"] = function (block) {
  const placeholder = block.getFieldValue("PLACEHOLDER");
  return `<input type="text" placeholder="${placeholder}" />\n`;
};

function WebBlocks() {
  const blocklyDiv = useRef(null);
  const workspace = useRef(null);
  const [code, setCode] = useState("<!-- קוד HTML שנבנה מהבלוקים בלייב -->\n");
  const [toolboxConfiguration, setToolboxConfiguration] = useState(null);
  const [isToolboxLoaded, setIsToolboxLoaded] = useState(false);

  // AI Web Block Generator State
  const [showAIGeneratorModal, setShowAIGeneratorModal] = useState(false);
  const [inlineAiPrompt, setInlineAiPrompt] = useState('');
  const [isGeneratingInlineBlock, setIsGeneratingInlineBlock] = useState(false);

  useEffect(() => {
    registerAllBlocks();
    const fetchToolbox = async () => {
      try {
        const response = await fetch("toolbox.json");
        const data = await response.json();
        setToolboxConfiguration(data);
        setIsToolboxLoaded(true);
      } catch (error) {
        console.error("Error loading toolbox:", error);
      }
    };
    fetchToolbox();
  }, []);

  useEffect(() => {
    if (isToolboxLoaded && toolboxConfiguration && blocklyDiv.current) {
      if (!workspace.current) {
        workspace.current = Blockly.inject(blocklyDiv.current, {
          toolbox: toolboxConfiguration,
          scrollbars: true,
          zoom: { controls: true, wheel: true },
        });

        workspace.current.addChangeListener(() => {
          const generated = javascriptGenerator.workspaceToCode(workspace.current);
          setCode(generated);
        });
      }
    }

    return () => {
      if (workspace.current) {
        try {
          workspace.current.dispose();
          workspace.current = null;
        } catch (e) {}
      }
    };
  }, [toolboxConfiguration, isToolboxLoaded]);

  // Inline AI Web Block Generator Handler
  const handleGenerateWebBlockInline = () => {
    if (!inlineAiPrompt.trim()) return;
    setIsGeneratingInlineBlock(true);

    setTimeout(() => {
      const generatedId = `ai_web_block_${Date.now()}`;
      
      let htmlSnippet = `<div className="custom-widget">\n  <h3>${inlineAiPrompt}</h3>\n</div>`;
      if (inlineAiPrompt.includes('טופס') || inlineAiPrompt.includes('הרשמה')) {
        htmlSnippet = `<form class="signup-form">\n  <label>שם:</label>\n  <input type="text" name="fullname" placeholder="הכנס שם..." />\n  <label>אימייל:</label>\n  <input type="email" name="email" placeholder="name@example.com" />\n  <button type="submit">הרשם 🚀</button>\n</form>`;
      } else if (inlineAiPrompt.includes('תמונה') || inlineAiPrompt.includes('העלאה')) {
        htmlSnippet = `<div class="upload-container">\n  <input type="file" accept="image/*" />\n</div>`;
      }

      const newBlock = {
        id: generatedId,
        name: inlineAiPrompt.length > 28 ? inlineAiPrompt.substring(0, 28) + '...' : inlineAiPrompt,
        type: 'statement',
        color: '#ea580c',
        tooltip: `בלוק HTML ב-AI: ${inlineAiPrompt}`,
        code: htmlSnippet,
        category: 'HTML / Web',
        language: 'HTML / CSS'
      };

      addBlockToRegistry(newBlock);

      if (workspace.current) {
        try {
          const created = workspace.current.newBlock(generatedId);
          created.initSvg();
          created.render();
          created.moveBy(40, 40);
        } catch (e) {
          console.error(e);
        }
      }

      setIsGeneratingInlineBlock(false);
      setInlineAiPrompt('');
      setShowAIGeneratorModal(false);
      alert(`🎉 הבלוק בשפת HTML נוצר והתווסף לסביבת העבודה!`);
    }, 600);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#f8fafc", direction: "rtl" }}>
      {/* סרגל כלים עליון מעוצב */}
      <div className="builder-header-toolbar" style={{ padding: '12px 24px', background: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
        <div className="builder-brand-group">
          <Link to="/" className="builder-btn" style={{ textDecoration: 'none' }}>
            🏠 דף הבית
          </Link>
          <span className="builder-brand-title" style={{ marginRight: '12px' }}>
            🌐 סטודיו לבניית אתרים (WebBlocks Studio)
          </span>
        </div>

        <div className="builder-controls-wrapper" style={{ gap: '10px' }}>
          <button 
            onClick={() => setShowAIGeneratorModal(true)} 
            className="builder-btn"
            style={{ background: '#fff7ed', border: '1px solid #ffedd5', color: '#c2410c', fontWeight: '800' }}
          >
            ✨ מחולל בלוקי HTML ב-AI
          </button>
        </div>
      </div>

      {/* אזור העבודה המרכזי */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* חלון הבלוקים */}
        <div ref={blocklyDiv} style={{ flex: 1, height: "100%" }} />

        {/* צד ימין: עורך Monaco לקוד HTML */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", borderRight: "1px solid #e2e8f0" }}>
          <div style={{ padding: "8px 16px", background: "#0f172a", color: "#38bdf8", fontSize: "0.85rem", fontWeight: "bold" }}>
            💻 קוד HTML / CSS שנבנה בלייב:
          </div>
          <div style={{ flex: 1 }}>
            <MonacoEditor
              height="100%"
              language="html"
              theme="vs-dark"
              value={code}
              options={{
                selectOnLineNumbers: true,
                readOnly: false,
                wordWrap: 'on',
                scrollBeyondLastLine: false,
                minimap: { enabled: true },
              }}
              onChange={(newValue) => setCode(newValue)}
            />
          </div> 
        </div>
      </div>

      {/* מודל מחולל בלוקים ב-AI מובנה בסביבת לבניית אתרים */}
      {showAIGeneratorModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, backdropFilter: 'blur(4px)' }}>
          <div style={{ background: '#ffffff', padding: '28px', borderRadius: '20px', width: '520px', maxWidth: '92%', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>✨ מחולל בלוקי HTML ב-AI</h3>
              <button onClick={() => setShowAIGeneratorModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#64748b' }}>✕</button>
            </div>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '16px' }}>
              תאר בשפה חופשית את בלוק האתר שתרצה ליצור (טופס, כפתור, העלאת תמונה), וסוכן ה-AI ייצר ויזריק אותו ל-WebBlocks!
            </p>
            <textarea 
              value={inlineAiPrompt} 
              onChange={(e) => setInlineAiPrompt(e.target.value)} 
              placeholder="לדוגמה: צור בלוק HTML לבניית טופס הרשמה מלא עם שם ואימייל..." 
              className="builder-input-field" 
              style={{ width: '100%', height: '90px', marginBottom: '20px', boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setShowAIGeneratorModal(false)} className="builder-btn">ביטול</button>
              <button onClick={handleGenerateWebBlockInline} className="builder-btn builder-btn-hero" disabled={isGeneratingInlineBlock}>
                {isGeneratingInlineBlock ? '⏳ מייצר בלוק...' : '✨ צור ויצא לסטודיו'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WebBlocks;
