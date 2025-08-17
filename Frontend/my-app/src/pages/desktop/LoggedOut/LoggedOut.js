import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LoggedOut() {
  const navigate = useNavigate();
  useEffect(() => {
    const t = setTimeout(() => navigate('/', { replace: true }), 3000);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <div className="d-flex justify-content-center align-items-center vh-100" dir="rtl">
      <div className="text-center">
        <h3 className="mb-3">تم تسجيل الخروج</h3>
        <p className="mb-3">سيتم تحويلك إلى صفحة الدخول.</p>
        <button className="btn btn-primary" onClick={() => navigate('/', { replace: true })}>
          العودة لتسجيل الدخول
        </button>
      </div>
    </div>
  );
}
