import React from 'react';

export default function PageContainer({ children }) {
  return (
    <div
      dir="rtl"
      style={{
        fontFamily: 'Noto Sans Arabic, system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        backgroundColor: '#f6f8fb',
      }}
    >
      <style>{`
        :root {
          --radius: 14px;
          --shadow: 0 10px 24px rgba(16, 24, 40, 0.08);
          --shadow-hover: 0 12px 28px rgba(16, 24, 40, 0.12);
          --surface: #ffffff;
          --surface-muted: #fbfdff;
          --stroke: #eef2f7;
          --text: #0b2440;
        }
      `}</style>
      {children}
    </div>
  );
}
