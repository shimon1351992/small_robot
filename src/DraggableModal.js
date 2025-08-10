import React, { useRef, useState } from 'react';

const DraggableModal = ({ children }) => {
  const modalRef = useRef(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: window.innerWidth / 2 - 600, y: window.innerHeight / 2 - 300 });

  const onMouseDown = (e) => {
    const rect = modalRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const onMouseMove = (e) => {
    setPosition({
      x: e.clientX - dragOffset.x,
      y: e.clientY - dragOffset.y
    });
  };

  const onMouseUp = () => {
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  };

  return (
    <div
      ref={modalRef}
      style={{
        position: 'fixed',
        top: position.y,
        left: position.x,
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
      }}
    >
      {/* אזור לגרירה */}
      <div
        onMouseDown={onMouseDown}
        style={{
          padding: '10px 20px',
          backgroundColor: '#f1f1f1',
          cursor: 'move',
          userSelect: 'none'
        }}
      >
        גרור אותי
      </div>
      {children}
    </div>
  );
};

export default DraggableModal;