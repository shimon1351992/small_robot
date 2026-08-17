import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import MonacoEditor from 'react-monaco-editor';
import FlashingModal from './FlashingModal';
import ComPortStatusBadge from './ComPortStatusBadge';

function CodeEditorPage() {
  const [code, setCode] = useState(`// 🚀 עורך קוד וצריבה ללוח ESP32 / Arduino
#include <Arduino.h>

void setup() {
  Serial.begin(115200);
  pinMode(2, OUTPUT); // LED מובנה בפין 2
  Serial.println("System Initialized!");
}

void loop() {
  digitalWrite(2, HIGH);
  delay(1000);
  digitalWrite(2, LOW);
  delay(1000);
}
`);
  const [selectedBoard, setSelectedBoard] = useState('esp32');
  const [comPort, setComPort] = useState('COM3');
  const [filename, setFilename] = useState('my_arduino_code.ino');
  const [compileResult, setCompileResult] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showFlashingModal, setShowFlashingModal] = useState(false);
  const [flashingMode, setFlashingMode] = useState('flash');

  const handleCompile = async () => {
    setFlashingMode('compile');
    setShowFlashingModal(true);
  };

  const handleUpload = async () => {
    setFlashingMode('flash');
    setShowFlashingModal(true);
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc', direction: 'rtl', overflow: 'hidden' }}>
      {/* סרגל עליון */}
      <div className="builder-header-toolbar" style={{ padding: '12px 24px', background: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
        <div className="builder-brand-group">
          <Link to="/" className="builder-btn" style={{ textDecoration: 'none' }}>
            🏠 דף הבית
          </Link>
          <span className="builder-brand-title" style={{ marginRight: '12px' }}>
            ⚡ עורך קוד וצריבה ללוח (ESP32 / Arduino)
          </span>
        </div>

        {/* שורת כפתורים והגדרות חומרה */}
        <div className="builder-controls-wrapper" style={{ gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#475569' }}>בחר לוח:</span>
            <select 
              value={selectedBoard} 
              onChange={(e) => setSelectedBoard(e.target.value)}
              className="builder-select-box"
            >
              <option value="esp32">🔥 ESP32 Dev Module</option>
              <option value="esp32s3">⚡ ESP32-S3</option>
              <option value="uno">🤖 Arduino Uno</option>
              <option value="nano">🔹 Arduino Nano</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#475569' }}>יציאה:</span>
            <select 
              value={comPort} 
              onChange={(e) => setComPort(e.target.value)} 
              className="builder-select-box"
              style={{ padding: '4px 8px' }}
            >
              {Array.from({ length: 20 }, (_, i) => `COM${i + 1}`).map(port => (
                <option key={port} value={port}>{port}</option>
              ))}
            </select>
            <ComPortStatusBadge currentPort={comPort} onSelectPort={setComPort} board={selectedBoard} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <input 
              type="text" 
              value={filename} 
              onChange={(e) => setFilename(e.target.value)} 
              className="builder-input-field"
              style={{ width: '150px' }}
            />
          </div>

          <button onClick={handleDownload} className="builder-btn">
            📥 הורד קוד (.ino)
          </button>
          <button onClick={handleCompile} className="builder-btn builder-btn-primary" disabled={isProcessing}>
            ⚙️ קמפל קוד
          </button>
          <button onClick={handleUpload} className="builder-btn builder-btn-hero" disabled={isProcessing}>
            🚀 צרוב ל-ESP32 / לוח
          </button>
        </div>
      </div>

      {/* עורך קוד Monaco בגודל מלא */}
      <div style={{ flex: 1, width: '100%', position: 'relative' }}>
        <MonacoEditor
          width="100%"
          height="100%"
          language="cpp"
          theme="vs-light"
          value={code}
          onChange={(newCode) => setCode(newCode)}
          options={{
            selectOnLineNumbers: true,
            readOnly: false,
            wordWrap: 'on',
            fontSize: 14,
            minimap: { enabled: true }
          }}
        />
      </div>

      {/* 🚀 FLASHING & COMPILATION PROCESS MODAL */}
      <FlashingModal 
        isOpen={showFlashingModal}
        onClose={() => setShowFlashingModal(false)}
        mode={flashingMode}
        board={selectedBoard}
        comPort={comPort}
        filename={filename}
        code={code}
      />
    </div>
  );
}

export default CodeEditorPage;
