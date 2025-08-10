import React from 'react';

const Sidebar = () => {
  return (
    <div style={{
      width: '200px',
      padding: '10px',
      borderRight: '1px solid #ccc',
      backgroundColor: '#f9f9f9'
    }}>
      <h3>Components</h3>
      <ul style={{ listStyleType: 'none', padding: '0' }}>
        <li>Layout</li>
        <li>Button</li>
        <li>Label</li>
        <li>Bluetooth</li>
      </ul>
    </div>
  );
};

export default Sidebar;