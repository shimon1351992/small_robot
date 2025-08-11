import React, { useState, useEffect } from 'react';
import MonacoEditor from 'react-monaco-editor';
import SrobotBuilder from './SrobotBuilder';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import BlocklyBuilder from './BlocklyBuilder';
import './App.css'; // ייבוא קובץ CSS (אופציונלי)

function RobotSmall() {
  const [page, setPage] = useState(null);
  const [slideIdx, setSlideIdx] = useState(0);
  const [minuts, setMinuts] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [timerColor, setTimerColor] = useState('black');
  const [arduinoCode, setArduinoCode] = useState('// כתוב את קוד הארדואינו שלך כאן\n');
  const [showCode, setShowCode] = useState(false);
  const [fileName, setFileName] = useState('my_arduino_code.ino');
  const [result, setResult] = useState('');
  const [showPuzzle, setShowPuzzle] = useState(false);
const [showCodeEditor, setShowCodeEditor] = useState(false); // State for code editor
const [showTextEditor, setShowTextEditor] = useState(false);


  const backgrounds = {
    picto: 'linear-gradient(200deg, #77bafb 10%, #8bc5f7 90%)',
    app: 'linear-gradient(200deg,rgb(203, 247, 196) 10%,rgb(226, 235, 168) 90%)',
    build: 'linear-gradient(200deg, #eee5d6 10%, #ddd3b8 90%)'
  };

  useEffect(() => {
    document.body.style.overflow = 'auto';
  }, []);

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      if (seconds > 0) {
        setSeconds(prev => prev - 1);
      } else {
        if (minuts > 0) {
          setMinuts(prev => prev - 1);
          setSeconds(59);
        } else {
          clearInterval(interval);
          setIsActive(false);
          setSeconds(0);
          setMinuts(0);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, seconds, minuts]);

  useEffect(() => {
    setTimerColor(minuts === 0 ? 'red' : '#e67e22');
  }, [minuts]);

  const toggleTimer = () => {
    if (!isActive) {
      setMinuts(pages[page][slideIdx].time);
      setSeconds(0);
    }
    setIsActive(!isActive);
  };

  const handleReset = () => {
    setIsActive(false);
    setMinuts(10);
    setSeconds(0);
  };

  const pages = {
    picto: [
      { images: ['https://i.imgur.com/JM7I3q8.png'], time: 3 },
      { title: "איך לעבור בין השקופיות", content: "jvjvjvjhvvhvhhkv" },
      { title: "סיום ההסבר", content: "זהו חלק זה מסביר את תהליך כתיבת קוד עם בלוקים בפיקטובוקס." }
    ],
    app: [
      { images: ['https://i.imgur.com/aQbl3i2.png'], time: 1 },
     
      { images: ['https://i.imgur.com/1LqI7fa.png'], time: 17 },
      { images: ['https://i.imgur.com/oWF3QyD.png'], time: 18 },
      { images: ['https://i.imgur.com/pkiQJAJ.png'], time: 19 },
      { images: ['https://i.imgur.com/QAq0kD2.png'], time: 20 },
      { images: ['https://i.imgur.com/lSkv33H.png'], time: 21 },
      { images: ['https://i.imgur.com/HIWaNGQ.png'], time: 22 },
      { images: ['https://i.imgur.com/re6nXHq.png'], time: 23 },
      { images: ['https://i.imgur.com/0v0cBDX.png'], time: 24 },
      { images: ['https://i.imgur.com/sQdEpXT.png'], time: 25 },
      { images: ['https://i.imgur.com/JJh0h8T.png'], time: 26 },
      { images: ['https://i.imgur.com/F466zlo.png'], time: 27 },
      { images: ['https://i.imgur.com/lvpgagt.png'], time: 28 },
      { images: ['https://i.imgur.com/xQRgQhy.png'], time: 29 },
      { images: ['https://i.imgur.com/9erWAdi.png'], time: 30 },
      { images: ['https://i.imgur.com/ZOXCSiF.png'], time: 31 },
      { images: ['https://i.imgur.com/LkRMHw2.png'], time: 32 },
      { images: ['https://i.imgur.com/S23AznF.png'], time: 33 },
      { images: ['https://i.imgur.com/8ccDusv.png'], time: 34 },
      { images: ['https://i.imgur.com/yrynGMm.png'], time: 35 },
      { images: ['https://i.imgur.com/ZcKL84x.png'], time: 36 },
      { images: ['https://i.imgur.com/ZBUqbYo.png'], time: 37 },
      { images: ['https://i.imgur.com/ev1yI8W.png'], time: 38 },
      { images: ['https://i.imgur.com/ksez3Rb.png'], time: 39 },
      { images: ['https://i.imgur.com/iuaWxQk.png'], time: 40 },
      { images: ['https://i.imgur.com/eXXmoZq.png'], time: 41 },
      { images: ['https://i.imgur.com/mSTs6f2.png'], time: 42 },
      { images: ['https://i.imgur.com/hy1pJe5.png'], time: 43 },
      { images: ['https://i.imgur.com/T0hHE9z.png'], time: 44 },
      { images: ['https://i.imgur.com/I7P3ZiX.png'], time: 45 },
      { images: ['https://i.imgur.com/g8Vr6Sc.png'], time: 46 },
      { images: ['https://i.imgur.com/oEQthu4.png'], time: 47 },
      { images: ['https://i.imgur.com/oiv1IdY.png'], time: 48 },
      { images: ['https://i.imgur.com/Y4NiZhs.png'], time: 49 },
      { images: ['https://i.imgur.com/8lKZvb4.png'], time: 50 },
      { images: ['https://i.imgur.com/fQqVZtj.png'], time: 51 },
      { images: ['https://i.imgur.com/8PawjLX.png'], time: 52 },
      { images: ['https://i.imgur.com/qnc8ykH.png'], time: 53 },
      { images: ['https://i.imgur.com/pefUEVj.png'], time: 54 },
      { images: ['https://i.imgur.com/bmpHpJQ.png'], time: 55 },
      { images: ['https://i.imgur.com/Nreovqp.png'], time: 56 },
      { images: ['https://i.imgur.com/OQolmnX.png'], time: 57 },
      { images: ['https://i.imgur.com/iFadFrT.png'], time: 58 },
      { images: ['https://i.imgur.com/rL9Zk6D.png'], time: 59 },
      { images: ['https://i.imgur.com/UBZoXhB.png'], time: 60 },
      { images: ['https://i.imgur.com/HVt73Gt.png'], time: 61 },
      { images: ['https://i.imgur.com/3UTZko3.png'], time: 62 },
      { images: ['https://i.imgur.com/KGg1yI3.png'], time: 63 },
      { images: ['https://i.imgur.com/82KFRju.png'], time: 64 },
      { images: ['https://i.imgur.com/kOeaSVm.png'], time: 65 },
      { images: ['https://i.imgur.com/kOeaSVm.png'], time: 66 },
      { images: ['https://i.imgur.com/VjGzioi.png'], time: 67 },
      { images: ['https://i.imgur.com/CO1q40G.png'], time: 68 },
      { images: ['https://i.imgur.com/NiBRKUA.png'], time: 69 },
      { images: ['https://i.imgur.com/jFWiIFS.png'], time: 70 },
      { images: ['https://i.imgur.com/Ywk8IM4.png'], time: 71 },
      { images: ['https://i.imgur.com/M8qp8W0.png'], time: 72 },
      { images: ['https://i.imgur.com/3UVfQZ8.png'], time: 73 },
      { images: ['https://i.imgur.com/hzKbOO3.png'], time: 74 },
      { images: ['https://i.imgur.com/syr0V5s.png'], time: 76 },
      { images: ['https://i.imgur.com/fJbITwC.png'], time: 77 },
      { images: ['https://i.imgur.com/hAdFi1j.png'], time: 78 },
      { images: ['https://i.imgur.com/CPNt1tm.png'], time: 79 },
      { images: ['https://i.imgur.com/dXMIh90.png'], time: 80 },
      { images: ['https://i.imgur.com/2a4kms1.png'], time: 81 },
      { images: ['https://i.imgur.com/Vzj6AJp.png'], time: 82 },
      { images: ['https://i.imgur.com/WXi9myD.png'], time: 83 },
      { images: ['https://i.imgur.com/QEOcg8J.png'], time: 84 },
      { images: ['https://i.imgur.com/CqR2Ipk.png'], time: 85 },
      { images: ['https://i.imgur.com/EecxHQs.png'], time: 86 },
      { images: ['https://i.imgur.com/67ur8ur.png'], time: 88 },
      { images: ['https://i.imgur.com/YUJXw81.png'], time: 89 },
      { images: ['https://i.imgur.com/sPuUvwx.png'], time: 90 },
      { images: ['https://i.imgur.com/FEkIMpb.png'], time: 91 },
      { images: ['https://i.imgur.com/fzKqz7N.png'], time: 92 },
      { images: ['https://i.imgur.com/rSo5ZOK.png'], time: 93 },
      { images: ['https://i.imgur.com/XuDbb8A.png'], time: 94 },
      { images: ['https://i.imgur.com/YEbQOLd.png'], time: 95 },
      { images: ['https://i.imgur.com/MnCy5TN.png'], time: 96 },
      { images: ['https://i.imgur.com/pbwZRcB.png'], time: 97 },
      { images: ['https://i.imgur.com/IcwM5Ck.png'], time: 98 },
      { images: ['https://i.imgur.com/TQtCsFO.png'], time: 100 },
      { images: ['https://i.imgur.com/cE5SIKq.png'], time: 101 },
      { images: ['https://i.imgur.com/yAqSMoY.png'], time: 102 },
      { images: ['https://i.imgur.com/g2gkXGl.png'], time: 103 },
      { images: ['https://i.imgur.com/V21ZPQ0.png'], time: 104 },
      { images: ['https://i.imgur.com/Uv92s0N.png'], time: 105 },
      { images: ['https://i.imgur.com/XO5iI9k.png'], time: 106 },
      { images: ['https://i.imgur.com/ftvE9xB.png'], time: 107 },
      { images: ['https://i.imgur.com/frEvz2q.png'], time: 108 },
      { images: ['https://i.imgur.com/wKiFoAt.png'], time: 109 }
    ],
    build: [
      { images: ['https://i.imgur.com/UBJrv0O.png'], time: 3 },
      { images: ['https://i.imgur.com/3l5qX0W.png'], time: 5 },
      { images: ['https://i.imgur.com/UaLakcN.png'], time: 7 },
      { images: ['https://i.imgur.com/G3ID4Ws.png'], time: 4 },
      { images: ['https://i.imgur.com/TLal7PU.png'], time: 6 },
      { images: ['https://i.imgur.com/QBe0SNz.png'], time: 8 },
      { images: ['https://i.imgur.com/dThaHWr.png'], time: 10 },
      { images: ['https://i.imgur.com/017sUOZ.png'], time: 12 },
      { images: ['https://i.imgur.com/hGVigr2.png'], time: 14 },
      { images: ['https://i.imgur.com/UN1sxFp.png'], time: 16 },
      { images: ['https://i.imgur.com/O1PmiVZ.png'], time: 18 },
      { images: ['https://i.imgur.com/bBDxpga.png'], time: 20 },
      { images: ['https://i.imgur.com/HO9LuTa.png'], time: 9 },
      { images: ['https://i.imgur.com/5fcjWHg.png'], time: 8 },
      { images: ['https://i.imgur.com/pYk0C30.png'], time: 7 },
      { images: ['https://i.imgur.com/0Wdh0V2.png'], time: 6 },
      { images: ['https://i.imgur.com/e7ogn6M.png'], time: 5 },
      { images: ['https://i.imgur.com/vFIV4oP.png'], time: 4 },
      { images: ['https://i.imgur.com/j2iaxGs.png'], time: 3 },
      { images: ['https://i.imgur.com/KKoXloj.png'], time: 2 },
      { images: ['https://i.imgur.com/hamJ0zO.png'], time: 10 },
      { images: ['https://i.imgur.com/SraR0Aq.png'], time: 9 },
      { images: ['https://i.imgur.com/yZzpd6A.png'], time: 8 },
      { images: ['https://i.imgur.com/Af6iKbD.png'], time: 7 },
      { images: ['https://i.imgur.com/V7zoMGP.png'], time: 6 },
      { images: ['https://i.imgur.com/2lJFbyu.png'], time: 5 },
      { images: ['https://i.imgur.com/i3FRQii.png'], time: 4 },
      { images: ['https://i.imgur.com/WbkHJeV.png'], time: 3 },
      { images: ['https://i.imgur.com/fYq05L3.png'], time: 2 },
      { images: ['https://i.imgur.com/grRrRtY.png'], time: 1 },
      { images: ['https://i.imgur.com/U11qEwZ.png'], time: 4 },
      { images: ['https://i.imgur.com/I24INc1.png'], time: 6 },
      { images: ['https://i.imgur.com/fkqanmD.png'], time: 8 },
      { images: ['https://i.imgur.com/K54hVRH.png'], time: 10 },
      { images: ['https://i.imgur.com/uG21B6C.png'], time: 12 },
      { images: ['https://i.imgur.com/QAPhPgu.png'], time: 15 }
    ]
  };

  const handlePageChange = (pageName) => {
    setPage(pageName);
    setSlideIdx(0);
  };

  const handleNext = () => {
    if (page && slideIdx < pages[page].length - 1) {
      setSlideIdx(slideIdx + 1);
      setMinuts(pages[page][slideIdx + 1].time);
      setSeconds(0);
      setIsActive(false);
    }
  };

  const handlePrev = () => {
    if (page && slideIdx > 0) {
      setSlideIdx(slideIdx - 1);
      setMinuts(pages[page][slideIdx - 1].time);
      setSeconds(0);
      setIsActive(false);
    }
  };

  const handleDownload = () => {
    try {
      const blob = new Blob([arduinoCode], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName.endsWith('.ino') ? fileName : `${fileName}.ino`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("שגיאה בהורדת הקוד:", error);
      alert("שגיאה בהורדת הקוד. אנא נסה שוב.");
    }
  };

  const compileCode = async () => {
    try {
      setResult('מנסה להתחבר...');
      const response = await fetch('http://localhost:3001/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: arduinoCode }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setResult(data.output);
    } catch (error) {
      console.error("שגיאה בהתקשרות לשרת:", error);
      setResult('שגיאה בהתקשרות לשרת');
    }
  };
  
const openBuilderInNewTab = async () => {
  try {
    const response = await fetch(process.env.PUBLIC_URL + '/toolbox.json');

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
      alert(new Error(`HTTP error! status: ${response.status}`))
    }

    const data = await response.json();
    console.log("Toolbox data loaded:", data);

    const toolboxParam = encodeURIComponent(JSON.stringify(data));
    const url = `/SrobotBuilder?toolboxrobot=${toolboxParam}`;
    console.log("Generated URL:", url);

    // Pause for a short amount of time
    await new Promise(resolve => setTimeout(resolve, 50));

    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.style.display = 'none';
        // Pause for a short amount of time
        await new Promise(resolve => setTimeout(resolve, 50));

    document.body.appendChild(link);
            // Pause for a short amount of time
        await new Promise(resolve => setTimeout(resolve, 50));

    link.click();
                // Pause for a short amount of time
        await new Promise(resolve => setTimeout(resolve, 50));

    document.body.removeChild(link);
                    // Pause for a short amount of time
        await new Promise(resolve => setTimeout(resolve, 50));
  } catch (error) {
    console.error("Fetch error:", error);
    alert("Failed to load toolbox configuration. Check the console for details.");
  }
};

   return (
    <div className="app-container" style={{
      fontFamily: 'Arial, sans-serif',
      padding: '20px',
      background: backgrounds[page] || 'linear-gradient(135deg,#eee5d6 0%,#eee5d6 100%)',
      overflowY: 'auto',
      maxHeight: '100vh',
      minHeight: '100vh',
      textAlign: 'center'
    }}>

      {/* כפתור עורך קוד */}
      <div className="floating-button" style={{
        position: 'fixed',
        top: '10px',
        right: '35px',
        zIndex: 999,
        borderRadius: '50%',
        backgroundColor: '#2980b9',
        width: '50px',
        height: '50px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        cursor: 'pointer',
        border: '2px solid #fff',
        fontSize: '1.5em',
        color: '#fff'
      }} onClick={() => setShowTextEditor(true)} title="פתח עורך קוד">
        🚀
      </div>

      {/* מודל עורך קוד */}
      {showTextEditor && (
        <div className="code-modal" style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '90%',
          maxWidth: '1200px',
          height: '80vh',
          backgroundColor: 'white',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '12px',
          overflow: 'hidden'
        }}>
          {/* חלק עליון - כפתורים, שם קובץ, קימפול */}
          <div className="modal-header" style={{
            padding: '10px 20px',
            backgroundColor: '#f1f1f1',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #ccc'
          }}>
            <div style={{ fontWeight: 'bold', fontSize: '1.2em' }}>עריכת קוד וחרוט</div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button onClick={() => { alert('הקוד נשמר!'); setShowTextEditor(false); }} style={{ padding: '8px 16px', backgroundColor: '#2980b9', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>שמור וצא</button>
              <button onClick={() => setShowTextEditor(false)} style={{ padding: '8px 16px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>סגור</button>
              <button onClick={handleDownload} style={{ padding: '8px 16px', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>הורד קוד</button>
            </div>
            <div style={{ marginTop: '10px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <input type="text" value={fileName} onChange={(e) => setFileName(e.target.value)} placeholder="הזן שם לקובץ..." style={{ padding: '8px', flex: '1', minWidth: '200px', borderRadius: '4px', border: '1px solid #ccc' }} />
              <button onClick={compileCode} style={{ padding: '8px 16px', backgroundColor: '#16a085', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>קמפל את הקוד</button>
            </div>
          </div>

          {/* תוצאות הקימפול */}
          {result && (
            <div className="compile-results" style={{ margin: '10px', padding: '10px', background: '#eee', borderRadius: '8px', maxHeight: '150px', overflow: 'auto' }}>
              <h4>תוצאות ההרצה:</h4>
              <pre style={{ whiteSpace: 'pre-wrap' }}>{result}</pre>
            </div>
          )}

          {/* עורך מונאקו */}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <MonacoEditor
              height="100%"
              width="100%"
              language="cpp"
              theme="vs-light"
              value={arduinoCode}
              onChange={(val) => setArduinoCode(val)}
              options={{
                automaticLayout: true,
                lineNumbers: 'on',
                readOnly: false,
                cursorStyle: 'line',
                wordWrap: 'on',
                wrapping: 'on',
                wrappingIndent: 'indent'
              }}
            />
          </div>
        </div>
      )}


{/* כפתור עורך קוד */}
<div className="floating-button" style={{
  position: 'fixed',
  top: '150px',
  right: '35px',
  zIndex: 999,
  borderRadius: '50%',
  backgroundColor: '#a7f09fff',
  width: '50px',
  height: '50px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
  cursor: 'pointer',
  border: '2px solid #fff',
  fontSize: '1.5em',
  color: '#fff'
}} onClick={() => setShowCode(true)} title="פתח עורך טקסט">
  ❓
</div>

{/* מודל עורך טקסט */}
{showCode && (
  <div className="code-modal" style={{
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '90%',
    maxWidth: '1200px',
    height: '80vh',
    backgroundColor: 'white',
    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    borderRadius: '12px',
    overflow: 'hidden'
  }}>
    {/* חלק עליון - כפתורים, שם קובץ, קימפול */}
    <div className="modal-header" style={{
      padding: '10px 20px',
      backgroundColor: '#f1f1f1',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: '1px solid #ccc'
    }}>
      <div style={{ fontWeight: 'bold', fontSize: '1.2em' }}>עורך טקסט</div>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button onClick={() => { alert('התוכן נשמר!'); setShowCode(false); }} style={{ padding: '8px 16px', backgroundColor: '#2980b9', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>שמור וצא</button>
        <button onClick={() => setShowCode(false)} style={{ padding: '8px 16px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>סגור</button>
      </div>
      
    </div>

    {/* תוצאות הקימפול */}
    {result && (
      <div className="compile-results" style={{ margin: '10px', padding: '10px', background: '#eee', borderRadius: '8px', maxHeight: '150px', overflow: 'auto' }}>
        <h4>תוצאות ההרצה:</h4>
        <pre style={{ whiteSpace: 'pre-wrap' }}>{result}</pre>
      </div>
    )}


    
   {/* עורך BlocklyBuilder */}
    <div style={{ flex: 1, overflow: 'hidden' }}>
      <BlocklyBuilder
        height="100%"
        width="100%"
        // Assuming BlocklyBuilder uses similar props for options
        options={{
          toolbox: '<xml></xml>', // Example toolbox XML, adjust as needed
          grid: {
            spacing: 20,
            length: 3,
            colour: '#ccc',
            snap: true,
          },
          trashcan: true,
          zoom: {
            controls: true,
            wheel: true,
            startScale: 1.0,
            maxScale: 3,
            minScale: 0.3,
            scaleSpeed: 1.2,
          },
        }}
    
      />
    </div>
  </div>
)}

      {/* כפתור עורך בלוקים (פאזל) */}
      <div className="floating-button" style={{
        position: 'fixed',
        top: '80px',
        right: '35px',
        zIndex: 999,
        borderRadius: '50%',
        backgroundColor: '#e67e22',
        width: '50px',
        height: '50px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        cursor: 'pointer',
        border: '2px solid #fff',
        fontSize: '1.5em',
        color: '#fff'
      }} onClick={openBuilderInNewTab} title="פתח עורך בלוקים">
        🧩
      </div>

      {/* כפתורי ניווט לעמודים */}
      <div className="page-navigation" style={{ marginBottom: '50px' }}>
        <button onClick={() => handlePageChange('picto')} style={{ margin: '10px', padding: '15px 20px', fontSize: '16px', backgroundColor: '#2980b9', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', boxShadow: '0 4px 8px rgba(0,0,0,0.2)', transition: 'background-color 0.3s' }} onMouseOver={(e) => e.target.style.backgroundColor = '#3498db'} onMouseOut={(e) => e.target.style.backgroundColor = '#2980b9'}>PictoBlocks</button>
        <button onClick={() => handlePageChange('app')} style={{ margin: '10px', padding: '15px 20px', fontSize: '16px', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', boxShadow: '0 4px 8px rgba(0,0,0,0.2)', transition: '' }} onMouseOver={(e) => e.target.style.backgroundColor = '#2ecc71'} onMouseOut={(e) => e.target.style.backgroundColor = '#27ae60'}>AppInventor</button>
        <button onClick={() => handlePageChange('build')} style={{ margin: '10px', padding: '15px 20px', fontSize: '16px', backgroundColor: '#e67e22', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', boxShadow: '0 4px 8px rgba(0,0,0,0.2)', transition: 'background-color 0.3s' }} onMouseOver={(e) => e.target.style.backgroundColor = '#d35400'} onMouseOut={(e) => e.target.style.backgroundColor = '#e67e22'}>בנייה של ערכה</button>
      </div>

      {/* תצוגת השקופיות */}
      {page && (
        <div className="slide-container" style={{ display: 'flex', flexDirection: 'column', padding: '20px', width: '90%', margin: '0 auto', background: backgrounds[page] || 'linear-gradient(135deg,#eee5d6 0%,#eee5d6 100%)', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', height: "1000px" }}>

          {/* רכיב בחירת עמוד + טיימר */}
          <div className="slide-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '20px 30px', background: backgrounds[page] || 'linear-gradient(135deg,#eee5d6 0%,#eee5d6 100%)', borderRadius: '12px', boxShadow: '0 4px 8px rgba(0,0,0,0.2)', boxSizing: 'border-box', marginBottom: '20px', position: 'relative' }}>
            <div className="timer" onClick={toggleTimer} style={{ cursor: 'pointer', backgroundColor: timerColor, boxShadow: '0 0 15px rgba(0, 0, 0, 0.3)', borderRadius: '10%', width: '200px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3em', userSelect: 'none', flexShrink: 0 }}>
              {`${minuts.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`}
            </div>

            <div className="page-selector" style={{ display: 'flex', alignItems: 'center', position: 'absolute', right: '30px' }}>
              <label htmlFor="pageSelect" style={{ marginLeft: '10px', marginRight: '15px', fontSize: '1.3em', fontWeight: 'bold', color: '#fff', textShadow: '1px 1px 3px rgba(0,0,0,0.3)', }}>

              </label>
              <select id="pageSelect" value={slideIdx} onChange={(e) => { const newIdx = parseInt(e.target.value, 10); if (!isNaN(newIdx) && pages[page] && pages[page][newIdx]) { setSlideIdx(newIdx); setMinuts(pages[page][newIdx].time); setSeconds(0); } }} style={{ padding: '10px 15px', fontSize: '1.2em', borderRadius: '8px', border: '2px solid #fff', background: backgrounds[page] || 'linear-gradient(135deg,#eee5d6 0%,#eee5d6 100%)', boxShadow: '0 4px 8px rgba(0,0,0,0.2)', outline: 'none', transition: 'all 0.3s ease', cursor: 'pointer', }}>
                {pages[page]?.map((slide, index) => (
                  <option key={index} value={index}>עמוד {index + 1}</option>
                ))}
              </select>
            </div>
          </div>

          {/* תצוגת שקופית (תמונה/וידאו) */}
          <div className="slide-display" style={{ width: '100%', height: '700px', margin: '10px auto', position: 'relative', overflow: 'hidden' }}>
            {pages[page][slideIdx].images && pages[page][slideIdx].images.length > 0 && (
              <img src={pages[page][slideIdx].images[0]} alt={pages[page][slideIdx].title} style={{ width: '100%', height: '700px', objectFit: 'contain', left: 0, top: 0, position: 'absolute', }} />
            )}
            {pages[page][slideIdx].type === 'video' && (
              <video controls style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '700px', objectFit: 'contain' }}>
                <source src={pages[page][slideIdx].videoSrc} type="video/mp4" />
              </video>
            )}
          </div>

          {/* כפתורי ניווט */}
          <div className="slide-navigation" style={{ marginTop: '30px' }}>
            <button onClick={handlePrev} disabled={slideIdx === 0} style={{ padding: '10px 20px', fontSize: '16px', margin: '0 10px', border: 'none', borderRadius: '6px', backgroundColor: '#bdc3c7', cursor: slideIdx === 0 ? 'not-allowed' : 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', transition: 'background-color 0.3s' }}>חזרה</button>
            <button onClick={handleNext} disabled={slideIdx === pages[page].length - 1} style={{ padding: '10px 20px', fontSize: '16px', margin: '0 10px', border: 'none', borderRadius: '6px', backgroundColor: '#27ae60', color: 'white', cursor: slideIdx === pages[page].length - 1 ? 'not-allowed' : 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', transition: 'background-color 0.3s' }}>המשך</button>
          </div>
        </div>
      )}
    </div>
  );
}


export default RobotSmall;