import React from 'react';

const Layout = ({ children }) => {
  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f0f0f0' }}>
      {children}
    </div>
  );
};

export default Layout;