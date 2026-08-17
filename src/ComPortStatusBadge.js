import React, { useState, useEffect } from 'react';
import { getActiveServerUrl } from './serverPort';

function ComPortStatusBadge({ currentPort, onSelectPort, board = 'esp32' }) {
  const [isConnected, setIsConnected] = useState(false);
  const [detectedBoardName, setDetectedBoardName] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [serverOffline, setServerOffline] = useState(false);

  const scanPorts = async () => {
    setIsScanning(true);
    let foundPort = null;
    let boardName = 'ESP32 / Arduino';
    let isOffline = false;

    try {
      const baseUrl = await getActiveServerUrl();
      const res = await fetch(`${baseUrl}/ports`);
      const data = await res.json();
      setServerOffline(false);

      if (data && data.ports && data.ports.length > 0) {
        foundPort = data.ports[0].port;
        boardName = data.ports[0].board || 'ESP32 Dev Module';
      }
    } catch (e) {
      isOffline = true;
      setServerOffline(true);
    }

    // 2. Check Web Serial API (Chrome/Edge)
    if (!foundPort && typeof navigator !== 'undefined' && 'serial' in navigator) {
      try {
        const serialPorts = await navigator.serial.getPorts();
        if (serialPorts && serialPorts.length > 0) {
          foundPort = currentPort || 'COM4';
          boardName = 'ESP32 (Web Serial)';
        }
      } catch (e) {
        console.log('Web Serial check error:', e);
      }
    }

    if (foundPort) {
      setIsConnected(true);
      setDetectedBoardName(boardName);
      if (onSelectPort) {
        onSelectPort(foundPort);
      }
    } else {
      setIsConnected(false);
      setDetectedBoardName('');
    }

    setIsScanning(false);
  };

  useEffect(() => {
    scanPorts();
    const interval = setInterval(scanPorts, 6000);
    return () => clearInterval(interval);
  }, [currentPort]);

  const handleRequestWebSerialPort = async () => {
    if (typeof navigator !== 'undefined' && 'serial' in navigator) {
      try {
        const port = await navigator.serial.requestPort();
        if (port) {
          setIsConnected(true);
          setDetectedBoardName('ESP32 (Web Serial USB)');
          alert(`✅ יציאת USB חומרה חוברה בהצלחה בדפדפן!`);
        }
      } catch (err) {
        console.log('User cancelled Web Serial port picker');
      }
    } else {
      scanPorts();
    }
  };

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', direction: 'rtl' }}>
      {/* STATUS BADGE */}
      <div 
        onClick={handleRequestWebSerialPort}
        title="לחץ לפתיחת חלונית חיבור USB בדפדפן"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 12px',
          borderRadius: '20px',
          background: isConnected ? '#f0fdf4' : serverOffline ? '#fffbe6' : '#fef2f2',
          border: isConnected ? '1.5px solid #22c55e' : serverOffline ? '1.5px solid #f59e0b' : '1.5px solid #ef4444',
          color: isConnected ? '#15803d' : serverOffline ? '#b45309' : '#b91c1c',
          fontSize: '0.82rem',
          fontWeight: 'bold',
          cursor: 'pointer',
          boxShadow: isConnected ? '0 0 10px rgba(34,197,94,0.2)' : 'none',
          transition: 'all 0.3s ease'
        }}
      >
        <span 
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: isConnected ? '#22c55e' : serverOffline ? '#f59e0b' : '#ef4444',
            boxShadow: isConnected ? '0 0 8px #22c55e' : 'none',
            display: 'inline-block'
          }} 
        />
        <span>
          {isConnected 
            ? `🟢 מחובר: ${board.toUpperCase()} (${currentPort})` 
            : serverOffline
            ? `⚠️ שרת 3001 כבוי (לחץ לחיבור USB)`
            : `🔴 לא זוהה לוח מחובר ב-USB`}
        </span>
      </div>

      {/* WEB SERIAL MANUAL CONNECT BUTTON */}
      <button
        onClick={handleRequestWebSerialPort}
        style={{
          padding: '4px 10px',
          borderRadius: '8px',
          border: '1px solid #3b82f6',
          background: '#eff6ff',
          color: '#1d4ed8',
          fontSize: '0.8rem',
          fontWeight: 'bold',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px'
        }}
      >
        <span>🔌 חבר USB בדפדפן</span>
      </button>

      {/* REFRESH BUTTON */}
      <button
        onClick={scanPorts}
        disabled={isScanning}
        style={{
          padding: '4px 10px',
          borderRadius: '8px',
          border: '1px solid #cbd5e1',
          background: '#ffffff',
          color: '#475569',
          fontSize: '0.8rem',
          fontWeight: 'bold',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px'
        }}
      >
        <span>{isScanning ? '⏳ סורק...' : '🔄 רענן'}</span>
      </button>
    </div>
  );
}

export default ComPortStatusBadge;
