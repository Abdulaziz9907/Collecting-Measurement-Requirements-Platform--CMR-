import React, { useState } from 'react';
import { Modal, Button, Form, Spinner } from 'react-bootstrap';

export default function ForgotPasswordModal({ show, onHide, apiBase }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState(1);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const close = () => {
    onHide();
    setUsername('');
    setEmail('');
    setCode('');
    setNewPassword('');
    setStep(1);
    setMessage('');
    setLoading(false);
  };

  const sendResetCode = async () => {
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch(`${apiBase}/api/login/forgot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email })
      });
      if (res.ok) {
        setMessage('تم إرسال الرمز إلى بريدك الإلكتروني');
        setStep(2);
      } else {
        setMessage('فشل إرسال الرمز');
      }
    } catch {
      setMessage('خطأ في الشبكة');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch(`${apiBase}/api/login/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, code, newPassword })
      });
      if (res.ok) {
        setMessage('تم تغيير كلمة المرور');
        setTimeout(close, 1000);
      } else {
        setMessage('فشل إعادة التعيين');
      }
    } catch {
      setMessage('خطأ في الشبكة');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={close} centered>
      <Modal.Header closeButton>
        <Modal.Title>
          {step === 1 ? 'إعادة تعيين كلمة المرور' : 'أدخل الرمز وكلمة المرور الجديدة'}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {step === 1 ? (
          <>
            <Form.Group className="mb-3">
              <Form.Control
                type="text"
                placeholder="اسم المستخدم"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Control
                type="email"
                placeholder="البريد الإلكتروني"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </Form.Group>
          </>
        ) : (
          <>
            <Form.Group className="mb-3">
              <Form.Control
                type="text"
                placeholder="الرمز"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                disabled={loading}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Control
                type="password"
                placeholder="كلمة المرور الجديدة"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={loading}
              />
            </Form.Group>
          </>
        )}
        {message && <div className="global-error-message text-center">{message}</div>}
      </Modal.Body>
      <Modal.Footer>
        {step === 1 ? (
          <Button variant="primary" onClick={sendResetCode} disabled={loading}>
            {loading ? <Spinner animation="border" size="sm" /> : 'إرسال الرمز'}
          </Button>
        ) : (
          <Button variant="primary" onClick={resetPassword} disabled={loading}>
            {loading ? <Spinner animation="border" size="sm" /> : 'تغيير كلمة المرور'}
          </Button>
        )}
        <Button variant="secondary" onClick={close} disabled={loading}>
          إغلاق
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

