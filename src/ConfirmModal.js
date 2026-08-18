import React from 'react';

function ConfirmModal({
  isOpen,
  title = 'אישור פעולה',
  message = 'האם אתה בטוח שברצונך לבצע פעולה זו?',
  confirmText = 'אישור',
  cancelText = 'ביטול',
  type = 'danger', // 'danger' | 'primary' | 'success' | 'warning'
  icon = '🗑️',
  onConfirm,
  onCancel
}) {
  if (!isOpen) return null;

  const getConfirmStyle = () => {
    switch (type) {
      case 'danger':
        return {
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          boxShadow: '0 4px 14px rgba(239, 68, 68, 0.3)'
        };
      case 'success':
        return {
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
        };
      case 'warning':
        return {
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          boxShadow: '0 4px 14px rgba(245, 158, 11, 0.3)'
        };
      default:
        return {
          background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
          boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)'
        };
    }
  };

  const getIconBg = () => {
    switch (type) {
      case 'danger': return { bg: '#fef2f2', border: '#fecaca' };
      case 'success': return { bg: '#f0fdf4', border: '#bbf7d0' };
      case 'warning': return { bg: '#fffbeb', border: '#fde68a' };
      default: return { bg: '#eff6ff', border: '#bfdbfe' };
    }
  };

  const iconColors = getIconBg();

  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999999,
        backdropFilter: 'blur(6px)',
        direction: 'rtl',
        padding: '16px',
        animation: 'systemModalFadeIn 0.15s ease-out'
      }}
    >
      <style>{`
        @keyframes systemModalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes systemModalPop {
          from { opacity: 0; transform: scale(0.92) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '440px',
          background: '#ffffff',
          borderRadius: '24px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 25px 60px rgba(0,0,0,0.18)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: "'Rubik', 'Outfit', system-ui, -apple-system, sans-serif",
          animation: 'systemModalPop 0.22s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        <div style={{ padding: '24px 24px 18px 24px', textAlign: 'center' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: iconColors.bg,
              border: `1.5px solid ${iconColors.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.8rem',
              margin: '0 auto 16px auto'
            }}
          >
            {icon}
          </div>

          <h3 style={{ fontSize: '1.25rem', fontWeight: '800', margin: '0 0 8px 0', color: '#0f172a' }}>
            {title}
          </h3>

          <p style={{ fontSize: '0.94rem', color: '#475569', margin: 0, lineHeight: 1.5 }}>
            {message}
          </p>
        </div>

        <div
          style={{
            padding: '16px 24px',
            background: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'center',
            gap: '12px'
          }}
        >
          {cancelText && (
            <button
              type="button"
              onClick={onCancel}
              style={{
                flex: 1,
                padding: '11px 18px',
                borderRadius: '12px',
                border: '1.5px solid #cbd5e1',
                background: '#ffffff',
                color: '#334155',
                fontWeight: '700',
                fontSize: '0.92rem',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#ffffff'}
            >
              {cancelText}
            </button>
          )}

          <button
            type="button"
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: '11px 20px',
              borderRadius: '12px',
              border: 'none',
              color: '#ffffff',
              fontWeight: '800',
              fontSize: '0.94rem',
              cursor: 'pointer',
              ...getConfirmStyle()
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
