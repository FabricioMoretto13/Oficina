import React from 'react';

export default function LoadingSpinner({ size = 40, color = '#2196f3', text = 'Carregando...' }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      textAlign: 'center'
    }}>
      <div style={{
        width: size,
        height: size,
        border: `4px solid ${color}20`,
        borderTop: `4px solid ${color}`,
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
        marginBottom: 16
      }} />
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      {text && (
        <p style={{
          margin: 0,
          color: '#666',
          fontSize: 14,
          fontWeight: 500
        }}>
          {text}
        </p>
      )}
    </div>
  );
}
