import React, { useState, useEffect, useRef } from 'react';
import { getActiveServerUrl } from './serverPort';
import { SUPERBOT_H_CODE, SUPERBOT_CPP_CODE } from './superbotCode';
import { flashESP32FromBrowser } from './espWebFlasher';

function FlashingModal({ isOpen, onClose, mode = 'flash', board = 'esp32', comPort = 'COM3', filename = 'superbot_car.ino', code = '' }) {
  const [step, setStep] = useState(1); // 1: Compile, 2: Connect, 3: Flash, 4: Complete
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState([]);
  const [isFinished, setIsFinished] = useState(false);
  const [isError, setIsError] = useState(false);
  const [showCodePreview, setShowCodePreview] = useState(true);
  const abortControllerRef = useRef(null);
  const terminalRef = useRef(null);

  // Auto-scroll terminal log to bottom
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  const addLog = (msg) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setProgress(0);
      setLogs([]);
      setIsFinished(false);
      setIsError(false);
      return;
    }

    let isSubscribed = true;
    abortControllerRef.current = new AbortController();

    const runArduinoIdeFlashingProcess = async () => {
      setStep(1);
      setProgress(10);
      setIsError(false);
      setIsFinished(false);

      addLog(`🚀 [Arduino IDE Pipeline] מתחיל תהליך ${mode === 'flash' ? 'קומפילציה וצריבה' : 'קומפילציה'}...`);
      addLog(`📄 קובץ: ${filename} | לוח: ${board.toUpperCase()} | יציאה: ${comPort}`);

      try {
        const baseUrl = await getActiveServerUrl();
        const isLocalServer = baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1');

        if (mode === 'flash' && !isLocalServer) {
          // Cloud Server Mode: Compile in Cloud -> Flash in Browser via Web Serial
          addLog(`☁️ מחובר לשרת ענן (${baseUrl}). מתחיל קומפילציה בענן וצריבה ישירה דרך ה-USB בדפדפן...`);
          await handleWebSerialFlash();
          return;
        }

        const endpoint = mode === 'flash' ? `${baseUrl}/upload` : `${baseUrl}/compile`;
        const payload = { 
          code, 
          board, 
          port: comPort,
          headerCode: SUPERBOT_H_CODE,
          cppCode: SUPERBOT_CPP_CODE 
        };

        addLog(`📡 מחובר לשרת מקומי בכתובת ${baseUrl}. משגר בקשה לבאקנד...`);

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: abortControllerRef.current.signal
        });

        if (!isSubscribed) return;

        const data = await response.json();

        if (data.success) {
          setStep(3);
          setProgress(95);

          if (data.output) {
            const lines = data.output.split('\n');
            lines.forEach(line => {
              if (line.trim()) addLog(line.trim());
            });
          }

          setProgress(100);
          setStep(4);
          setIsFinished(true);
          addLog(`🎉 [Arduino IDE] הפעולה הושלמה בהצלחה 100%!`);
        } else {
          setStep(4);
          setProgress(100);
          setIsFinished(true);
          setIsError(true);

          addLog(`❌ התקבל כשל בביצוע הקומפילציה / הצריבה מהשרת:`);
          if (data.output) {
            const lines = data.output.split('\n');
            lines.forEach(line => {
              if (line.trim()) addLog(`❌ ${line.trim()}`);
            });
          }
          if (navigator.serial) {
            addLog(`💡 ניתן לצרוב ישירות דרך הדפדפן בלחיצה על הכפתור הכחול למטה ⬇️`);
          }
        }
      } catch (err) {
        if (!isSubscribed) return;

        if (err.name === 'AbortError') {
          addLog(`🚫 תהליך הצריבה בוטל לבקשת המשתמש.`);
          return;
        }

        setStep(4);
        setProgress(100);
        setIsFinished(true);
        setIsError(true);

        addLog(`❌ שרת ה-USB המקומי אינו זמין (שרת ענן אינו יכול לצרוב ישירות ל-USB מקומי).`);
        if (navigator.serial) {
          addLog(`🔌 לחץ על "צרוב דרך הדפדפן (Web Serial API)" למטה לצריבה ישירה מהירה דרך ה-USB.`);
        } else {
          addLog(`💡 לצריבה מקומית דרך השרת: פתח טרמינל במחשב והקש: npm run server`);
        }
      }
    };

    runArduinoIdeFlashingProcess();

    return () => {
      isSubscribed = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [isOpen, mode, board, comPort, filename, code]);

  const handleWebSerialFlash = async () => {
    if (!navigator.serial) {
      alert('דפדפן זה אינו תומך ב-Web Serial API. אנא פתח את האתר בדפדפן Google Chrome או Microsoft Edge.');
      return;
    }

    try {
      setIsError(false);
      setIsFinished(false);
      setProgress(10);
      setStep(1);

      addLog('🚀 [Web Serial Pipeline] מתחיל תהליך קומפילציה וצריבה אמיתית מתוך הדפדפן...');
      addLog('📡 שולח את קוד ה-C++ לקומפילציה בשרת לקבלת קובץ בינארי (.bin)...');

      const baseUrl = await getActiveServerUrl();
      const compileRes = await fetch(`${baseUrl}/compile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          board,
          headerCode: SUPERBOT_H_CODE,
          cppCode: SUPERBOT_CPP_CODE
        })
      });

      const compileData = await compileRes.json();
      if (!compileData.success || !compileData.binBase64) {
        throw new Error(compileData.output || 'הקומפילציה בשרת נכשלה.');
      }

      addLog('✅ הקומפילציה הושלמה בהצלחה! הקובץ הבינארי מוכן.');
      setStep(2);
      setProgress(25);

      setStep(3);
      await flashESP32FromBrowser({
        binBase64: compileData.binBase64,
        bootloaderBase64: compileData.bootloaderBase64,
        partitionsBase64: compileData.partitionsBase64,
        baudRate: 115200,
        onLog: (msg) => addLog(msg),
        onProgress: (pct) => setProgress(25 + Math.round(pct * 0.75))
      });

      setStep(4);
      setProgress(100);
      setIsFinished(true);
      setIsError(false);
    } catch (err) {
      setStep(4);
      setProgress(100);
      setIsFinished(true);
      setIsError(true);
      addLog(`❌ שגיאה בצריבת Web Serial: ${err.message}`);
    }
  };

  const handleCancelFlashing = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsFinished(true);
    setIsError(true);
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] 🚫 תהליך הצריבה בוטל.`]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      onClick={isFinished ? onClose : undefined}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        display: 'flex',
        alignItems: 'center',
        justify: 'center',
        zIndex: 999999,
        backdropFilter: 'blur(8px)',
        direction: 'rtl',
        margin: 0,
        padding: 0
      }}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '90%',
          maxWidth: '750px',
          background: '#0f172a',
          borderRadius: '24px',
          border: '1.5px solid #334155',
          boxShadow: '0 25px 70px rgba(0,0,0,0.7)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          color: '#ffffff',
          margin: 'auto'
        }}
      >
        {/* HEADER BAR */}
        <div style={{ padding: '20px 28px', background: '#1e293b', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: mode === 'flash' ? 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)' : 'linear-gradient(135deg, #059669 0%, #10b981 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
              {mode === 'flash' ? '🚀' : '⚙️'}
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0, color: '#ffffff' }}>
                {mode === 'flash' ? 'תהליך צריבת קוד לרובוט (Arduino IDE Console)' : 'תהליך קומפילציית הקוד (C++)'}
              </h3>
              <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '3px' }}>
                יציאה: <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>{comPort}</span> | לוח: <span style={{ color: '#a855f7', fontWeight: 'bold' }}>{board.toUpperCase()}</span> | קובץ: <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>{filename}</span>
              </div>
            </div>
          </div>

          {isFinished ? (
            <button 
              onClick={onClose}
              style={{ background: '#334155', border: 'none', color: '#ffffff', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}
            >
              ✕
            </button>
          ) : (
            <button
              onClick={handleCancelFlashing}
              style={{
                padding: '6px 14px',
                borderRadius: '10px',
                border: '1px solid #ef4444',
                background: '#450a0a',
                color: '#f87171',
                fontSize: '0.82rem',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              🚫 ביטול צריבה
            </button>
          )}
        </div>

        {/* STEP PROCESS INDICATOR BADGES */}
        <div style={{ padding: '16px 28px', background: '#0f172a', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-around', alignItems: 'center', gap: '8px' }}>
          <div style={{ opacity: step >= 1 ? 1 : 0.4, display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 'bold', color: step === 1 ? '#38bdf8' : '#94a3b8' }}>
            <span>⚙️ 1. קומפילציה</span>
          </div>
          <span style={{ color: '#334155' }}>➔</span>

          {mode === 'flash' && (
            <>
              <div style={{ opacity: step >= 2 ? 1 : 0.4, display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 'bold', color: step === 2 ? '#38bdf8' : '#94a3b8' }}>
                <span>🔌 2. חיבור לפורט</span>
              </div>
              <span style={{ color: '#334155' }}>➔</span>

              <div style={{ opacity: step >= 3 ? 1 : 0.4, display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 'bold', color: step === 3 ? '#38bdf8' : '#94a3b8' }}>
                <span>⚡ 3. צריבה לזיכרון</span>
              </div>
              <span style={{ color: '#334155' }}>➔</span>
            </>
          )}

          <div style={{ opacity: step >= 4 ? 1 : 0.4, display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 'bold', color: isError ? '#ef4444' : step === 4 ? '#10b981' : '#94a3b8' }}>
            <span>{isError ? '❌ שגיאה' : '🎉 4. סיום ואיפוס'}</span>
          </div>
        </div>

        {/* PROGRESS BAR & PERCENTAGE */}
        <div style={{ padding: '24px 28px', background: '#1e293b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.9rem', color: isError ? '#f87171' : '#cbd5e1', fontWeight: 'bold' }}>
              {isError ? '❌ התרחשה שגיאה בצריבה' : isFinished ? '🎉 התהליך הושלם בהצלחה!' : 'מבצע צריבה ללוח... אנא המתן'}
            </span>
            <span style={{ fontSize: '1.2rem', fontWeight: '800', color: isError ? '#ef4444' : isFinished ? '#10b981' : '#38bdf8' }}>
              {progress}%
            </span>
          </div>

          <div style={{ width: '100%', height: '14px', background: '#0f172a', borderRadius: '8px', overflow: 'hidden', border: '1px solid #334155', position: 'relative' }}>
            <div 
              style={{ 
                width: `${progress}%`, 
                height: '100%', 
                background: isError 
                  ? 'linear-gradient(90deg, #ef4444 0%, #b91c1c 100%)'
                  : isFinished 
                  ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)' 
                  : 'linear-gradient(90deg, #38bdf8 0%, #6366f1 100%)', 
                transition: 'width 0.4s ease-in-out',
                boxShadow: isError ? '0 0 15px rgba(239,68,68,0.5)' : '0 0 15px rgba(56,189,248,0.5)'
              }} 
            />
          </div>
        </div>

        {/* CODE PREVIEW INSPECTOR TOGGLE & PANEL */}
        <div style={{ background: '#090d16', borderTop: '1px solid #1e293b', borderBottom: '1px solid #1e293b' }}>
          <div 
            onClick={() => setShowCodePreview(!showCodePreview)}
            style={{ 
              padding: '10px 20px', 
              background: '#0f172a', 
              cursor: 'pointer', 
              display: 'flex', 
              justify: 'space-between', 
              alignItems: 'center', 
              fontSize: '0.85rem',
              fontWeight: 'bold',
              color: '#38bdf8'
            }}
          >
            <span>📄 הקוד המדויק שנשלח כעת לצריבה ב-ESP32 ({filename}):</span>
            <span style={{ fontSize: '0.8rem', background: '#1e293b', padding: '3px 10px', borderRadius: '6px', color: '#cbd5e1' }}>
              {showCodePreview ? '🔽 הסתר קוד' : '👁️ הצג קוד מעודכן'}
            </span>
          </div>

          {showCodePreview && (
            <div style={{ padding: '12px 20px', maxHeight: '180px', overflowY: 'auto', background: '#020617', fontFamily: 'Consolas, Monaco, monospace', fontSize: '0.8rem', color: '#a7f3d0', direction: 'ltr', textAlign: 'left', borderTop: '1px solid #1e293b' }}>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {code || '// לא נשלח קוד'}
              </pre>
            </div>
          )}
        </div>

        {/* RAW ARDUINO IDE CONSOLE TERMINAL LOGS */}
        <div 
          ref={terminalRef}
          style={{ 
            height: '240px', 
            background: '#020617', 
            padding: '16px 20px', 
            fontFamily: 'Consolas, Monaco, monospace', 
            fontSize: '0.85rem', 
            overflowY: 'auto',
            borderTop: '1px solid #1e293b',
            direction: 'ltr',
            textAlign: 'left'
          }}
        >
          {logs.map((log, idx) => (
            <div 
              key={idx} 
              style={{ 
                lineHeight: '1.6', 
                color: log.includes('❌') || log.includes('Error') || log.includes('failed')
                  ? '#f87171' 
                  : log.includes('✅') || log.includes('🎉') || log.includes('OK') || log.includes('הצלחה')
                  ? '#4ade80' 
                  : log.includes('🚀') || log.includes('⚙️') || log.includes('🔌') 
                  ? '#38bdf8' 
                  : '#94a3b8' 
              }}
            >
              {log}
            </div>
          ))}
          {!isFinished && (
            <div style={{ color: '#38bdf8', marginTop: '4px', animation: 'pulse 1s infinite' }}>
              > Executing arduino-cli compile and upload... _
            </div>
          )}
        </div>

        {/* FOOTER ACTIONS */}
        <div style={{ padding: '16px 28px', background: '#1e293b', borderTop: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
            {isFinished ? (isError ? '❌ בדוק את חיבור ה-USB והפעלת השרת' : '✅ הלוח מוכן להפעלה בשטח!') : '⚠️ נא לא לנתק את כבל ה-USB בזמן הצריבה'}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {isError && (
              <button
                onClick={handleWebSerialFlash}
                style={{
                  padding: '8px 16px',
                  borderRadius: '10px',
                  border: '1px solid #3b82f6',
                  background: '#1d4ed8',
                  color: '#ffffff',
                  fontWeight: 'bold',
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                🔌 צרוב דרך הדפדפן (Web Serial API)
              </button>
            )}

            {!isFinished && (
              <button
                onClick={handleCancelFlashing}
                style={{
                  padding: '8px 16px',
                  borderRadius: '10px',
                  border: '1px solid #ef4444',
                  background: '#450a0a',
                  color: '#f87171',
                  fontWeight: 'bold',
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                🚫 ביטול צריבה
              </button>
            )}

            <button
              onClick={onClose}
              disabled={!isFinished}
              style={{
                padding: '10px 24px',
                borderRadius: '12px',
                border: 'none',
                background: isError ? '#ef4444' : isFinished ? '#10b981' : '#334155',
                color: isFinished ? '#ffffff' : '#64748b',
                fontWeight: '800',
                fontSize: '0.95rem',
                cursor: isFinished ? 'pointer' : 'not-allowed',
                boxShadow: isFinished ? (isError ? '0 4px 15px rgba(239,68,68,0.3)' : '0 4px 15px rgba(16,185,129,0.3)') : 'none'
              }}
            >
              {isFinished ? (isError ? 'סגור ונסה שוב' : '👍 סגור ואשר') : 'מקמפל ומבצע צריבה...'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default FlashingModal;
