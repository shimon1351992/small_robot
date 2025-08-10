import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import Smarthouse from './Smarthouse';
import Builder from './Builder';
import RobotSmall from './RobotSmall';
import SrobotBuilder from './SrobotBuilder';
import CodeToBlock from './CodeToBlock';

function Home() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)',
      fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
      padding: '20px'
    }}>
      <h1 style={{ fontSize: '3em', marginBottom: '20px', color: '#fff', textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>ברוך הבא לממשק הפיתוח</h1>
      <p style={{ fontSize: '1.3em', color: '#fff', marginBottom: '40px', textShadow: '1px 1px 3px rgba(0,0,0,0.2)' }}>בחר עמוד כדי להיכנס:</p>
      
      {/* תפריט ניווט מעוצב ומרשים */}
      <div style={{
        display: 'flex',
        gap: '25px',
        flexWrap: 'wrap',
        padding: '20px',
        background: 'linear-gradient(145deg, #ffffff, #e0e0e0)',
        borderRadius: '20px',
        boxShadow: '0 15px 30px rgba(0,0,0,0.1)',
        backdropFilter: 'blur(10px)'
      }}>
        {/* <StyledLink to="/" label="עמוד הבית" color="#6a11cb" hoverColor="#2575fc" /> */}
        <StyledLink to="/smarthouse" label="בית חכם " color="#ff416c" hoverColor="#ff4b2b" />
        {/* <StyledLink to="/builder" label="Builder" color="#43cea2" hoverColor="#185a9d" /> */}
        <StyledLink to="/RobotSmall" label="רובוט" color="#f7971e" hoverColor="#ffd200" />
         <StyledLink to="/CodeToBlock" label="CodeToBlock" color="#3fea3fff" hoverColor="#5642f3ff" />
      </div>
    </div>
  );
}

// קומפוננטה עם עיצוב הקישור
function StyledLink({ to, label, color, hoverColor }) {
  const [hover, setHover] = React.useState(false);
  return (
    <Link
      to={to}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: '15px 30px',
        background: `linear-gradient(135deg, ${color} 0%, ${hover ? hoverColor : '#fff' })`,
        color: '#fff',
        borderRadius: '12px',
        boxShadow: hover ? '0 8px 16px rgba(0,0,0,0.2)' : '0 4px 8px rgba(0,0,0,0.1)',
        fontSize: '1.2em',
        fontWeight: '600',
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        textDecoration: 'none',
        textShadow: '1px 1px 3px rgba(0,0,0,0.3)'
      }}
    >
      {label}
    </Link>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        {/* עמוד הבית עם תפריט מעודכן ומעוצב */}
        <Route path="/" element={<Home />} />
        {/* שאר העמודים */}
        <Route path="/smarthouse" element={<Smarthouse />} />
        <Route path="/builder" element={<Builder />} />
        <Route path="/RobotSmall" element={<RobotSmall />} />
        <Route path="/SrobotBuilder" element={<SrobotBuilder />} />
        <Route path="/CodeToBlock" element={<CodeToBlock />} />
      </Routes>
    </Router>
  );
}

export default App;