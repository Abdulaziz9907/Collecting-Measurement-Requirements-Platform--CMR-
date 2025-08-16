import React, { useEffect, useRef, useState } from 'react';
import { Modal, Button, Form, Spinner, InputGroup, Alert, Badge } from 'react-bootstrap';

export default function ForgotPasswordModal({ show, onHide, apiBase }) {
  const [step, setStep] = useState(1);

  // Fields
  const [username, setUsername] = useState('');
  const [email, setEmail]       = useState('');
  const [code, setCode]         = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [alert, setAlert]     = useState({ show: false, variant: '', message: '' });

  // Timers
  const [expiresAt, setExpiresAt]     = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [cooldown, setCooldown]       = useState(0);

  const codeInputRef = useRef(null);

  const resetForm = () => {
    setStep(1);
    setUsername(''); setEmail('');
    setCode(''); setNewPassword(''); setConfirmPassword('');
    setLoading(false);
    setAlert({ show: false, variant: '', message: '' });
    setExpiresAt(null); setSecondsLeft(0); setCooldown(0);
  };
  const handleClose = () => { resetForm(); onHide?.(); };
  const showAlert = (variant, message) => setAlert({ show: true, variant, message });

  // timers
  useEffect(() => {
    if (!expiresAt) return;
    const id = setInterval(() => {
      const secs = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
      setSecondsLeft(secs);
      if (secs === 0) clearInterval(id);
    }, 500);
    return () => clearInterval(id);
  }, [expiresAt]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  // helpers
  const maskEmail = (val) => {
    if (!val || !val.includes('@')) return val;
    const [local, domain] = val.split('@');
    const vis = local.slice(0, 2) || local;
    return `${vis}${'*'.repeat(Math.max(1, local.length - vis.length))}@${domain}`;
  };
  const validateEmail    = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const validatePassword = (v) => (v || '').length >= 8;
  const normalizeDigits  = (s) => {
    const m = { '٠':'0','١':'1','٢':'2','٣':'3','٤':'4','٥':'5','٦':'6','٧':'7','٨':'8','٩':'9',
                '۰':'0','۱':'1','۲':'2','۳':'3','۴':'4','۵':'5','۶':'6','۷':'7','۸':'8','۹':'9' };
    return (s || '').split('').map(ch => m[ch] ?? ch).join('');
  };
  const digitsOnly = (s) => normalizeDigits(s).replace(/\D/g, '');

  // API
  const sendResetCode = async () => {
    const uname = normalizeDigits(username.trim());
    const mail  = email.trim();
    if (!uname || !validateEmail(mail)) {
      showAlert('danger', 'الرجاء إدخال اسم المستخدم أو الرقم الوظيفي والبريد الإلكتروني بشكل صحيح');
      return;
    }
    setLoading(true); setAlert({ show: false, variant: '', message: '' });
    try {
      const res = await fetch(`${apiBase}/api/login/forgot`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: uname, email: mail })
      });
      const data = await res.json().catch(() => null);
      if (res.ok) {
showAlert('success', `تم إرسال رمز التحقق إلى ${maskEmail(mail)}, يرجى التحقق من ملف spam`);        setStep(2);
        setCooldown(60);
        setExpiresAt(Date.now() + 5 * 60 * 1000); // 5 minutes
        setTimeout(() => codeInputRef.current?.focus(), 0);
      } else if (res.status === 404) {
        showAlert('warning', 'المستخدم غير موجود أو البريد الإلكتروني غير مطابق');
      } else {
        showAlert('danger', data?.error || data?.message || 'تعذر إرسال الرمز');
      }
    } catch {
      showAlert('danger', 'خطأ في الإتصال. حاول مرة أخرى');
    } finally { setLoading(false); }
  };

  const verifyCode = async () => {
    const c = digitsOnly(code).slice(0, 6);
    if (c.length !== 6) {
      showAlert('warning', 'يرجى إدخال رمز مكون من 6 أرقام');
      return;
    }
    if (secondsLeft === 0) {
      showAlert('danger', 'انتهت صلاحية الرمز. أعد الإرسال');
      return;
    }
    setLoading(true); setAlert({ show: false, variant: '', message: '' });
    try {
      const res = await fetch(`${apiBase}/api/login/verify`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: normalizeDigits(username.trim()),
          email: email.trim(),
          code: c
        })
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.valid) {
        if (typeof data.secondsLeft === 'number') {
          setExpiresAt(Date.now() + data.secondsLeft * 1000);
        }
        setStep(3);
        showAlert('success', 'تم التحقق من الرمز. تابع لتعيين كلمة المرور.');
      } else {
        showAlert('danger', data?.message || 'رمز التحقق غير صحيح');
      }
    } catch {
      showAlert('danger', 'خطأ في الإتصال. حاول مرة أخرى');
    } finally { setLoading(false); }
  };

  const resendCode = async () => {
    if (cooldown > 0) return;
    setCode('');
    await sendResetCode();
  };

  const resetPassword = async () => {
    const pass = newPassword;
    const confirm = confirmPassword;
    if (!validatePassword(pass)) {
      showAlert('danger', 'كلمة المرور يجب أن تكون 8 أحرف على الأقل');
      return;
    }
    if (pass !== confirm) {
      showAlert('danger', 'كلمتا المرور غير متطابقتين');
      return;
    }
    const c = digitsOnly(code).slice(0, 6);
    setLoading(true); setAlert({ show: false, variant: '', message: '' });
    try {
      const res = await fetch(`${apiBase}/api/login/reset`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: normalizeDigits(username.trim()),
          email: email.trim(),
          code: c,
          newPassword: pass
        })
      });
      const data = await res.json().catch(() => null);
      if (res.ok) {
        showAlert('success', 'تم تغيير كلمة المرور بنجاح');
        setTimeout(handleClose, 1500);
      } else if (res.status === 400) {
        showAlert('danger', data?.message || 'الرمز غير صحيح أو منتهي الصلاحية');
        setStep(2);
      } else if (res.status === 404) {
        showAlert('warning', 'المستخدم غير موجود');
        setStep(1);
      } else {
        showAlert('danger', 'فشل في إعادة تعيين كلمة المرور');
      }
    } catch {
      showAlert('danger', 'خطأ في الإتصال. حاول مرة أخرى');
    } finally { setLoading(false); }
  };

  const getStepTitle = () =>
    step === 1 ? 'معلومات الحساب' : step === 2 ? 'رمز التحقق' : 'كلمة مرور جديدة';

  return (
    <Modal show={show} onHide={handleClose} centered size="md" backdrop="static" dir="rtl">
      <Modal.Header className="border-0 pb-2">
        <Modal.Title className="w-100 text-center">
          <h5 className="mb-0 fw-semibold">{getStepTitle()}</h5>
        </Modal.Title>
        <Button
          variant="link"
          className="btn-close p-0 ms-0 me-auto text-decoration-none"
          onClick={handleClose}
          disabled={loading}
          aria-label="إغلاق"
        />
      </Modal.Header>

      <Modal.Body className="px-4">
        {/* TOP notification banner */}
        {alert.show && (
          <Alert
            variant={alert.variant}
            className="mb-3 text-center rounded-3"
            dismissible={!loading}
            onClose={() => setAlert({ show: false, variant: '', message: '' })}
          >
            {alert.message}
          </Alert>
        )}

        {/* Progress Steps */}
        <div className="d-flex justify-content-center align-items-center mb-4">
          <Badge bg={step >= 1 ? "primary" : "light"} text={step >= 1 ? "white" : "dark"}
            className="rounded-circle me-2 d-flex align-items-center justify-content-center"
            style={{width: '32px', height: '32px', fontSize: '0.9rem'}}>1</Badge>
          <div className="flex-fill mx-2" style={{height: '2px', backgroundColor: step >= 2 ? '#0d6efd' : '#dee2e6'}} />
          <Badge bg={step >= 2 ? "primary" : "light"} text={step >= 2 ? "white" : "dark"}
            className="rounded-circle me-2 d-flex align-items-center justify-content-center"
            style={{width: '32px', height: '32px', fontSize: '0.9rem'}}>2</Badge>
          <div className="flex-fill mx-2" style={{height: '2px', backgroundColor: step >= 3 ? '#0d6efd' : '#dee2e6'}} />
          <Badge bg={step >= 3 ? "primary" : "light"} text={step >= 3 ? "white" : "dark"}
            className="rounded-circle d-flex align-items-center justify-content-center"
            style={{width: '32px', height: '32px', fontSize: '0.9rem'}}>3</Badge>
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <>
            <Form.Group className="mb-3">
              <Form.Label className="fw-medium">اسم المستخدم أو الرقم الوظيفي</Form.Label>
              <Form.Control
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="أدخل اسم المستخدم أو الرقم الوظيفي"
                disabled={loading}
                autoFocus
                size="md"
                className="rounded-3"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-medium">البريد الإلكتروني</Form.Label>
              <InputGroup size="md">
                <Form.Control
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  disabled={loading}
                  className="rounded-3"
                />
              </InputGroup>
            </Form.Group>

            <div className="text-center mb-4">
              <small className="text-muted">سنرسل لك رمز تحقق صالح لمدة 5 دقائق</small>
            </div>

            {/* Primary Bootstrap button */}
            <div className="d-grid">
              <Button
                variant="primary"
                size="md"
                onClick={sendResetCode}
                disabled={loading || !username.trim() || !validateEmail(email.trim())}
                className="rounded-3"
              >
                {loading ? (<><Spinner size="sm" className="me-2" />جاري الإرسال…</>) : 'إرسال رمز التحقق'}
              </Button>
            </div>
          </>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <>
            <div className="text-center mb-4">
              <p className="mb-2 text-muted">أدخل الرمز المرسل إلى</p>
              <p className="fw-semibold text-primary fs-6">{maskEmail(email)}</p>
            </div>

            <Form.Group className="mb-4">
              <Form.Label className="fw-medium">رمز التحقق</Form.Label>
              <Form.Control
                ref={codeInputRef}
                type="text"
                value={code}
                onChange={(e) => setCode(digitsOnly(e.target.value).slice(0, 6))}
                placeholder="••••••"
                maxLength={6}
                disabled={loading}
                autoFocus
                size="md"
                className="text-center fw-bold rounded-3"
                style={{letterSpacing: '0.5em', fontSize: '1.5rem'}}
              />
              {secondsLeft > 0 && secondsLeft <= 60 && (
                <div className="mt-2"><span className="badge bg-danger">آخر دقيقة</span></div>
              )}
            </Form.Group>

            <div className="d-flex justify-content-between align-items-center mb-4">
              <Button
                variant="outline-secondary"
                onClick={() => { setStep(1); setCode(''); }}
                disabled={loading}
                size="sm"
                className="rounded"
              >
                 رجوع
              </Button>

              <Button
                variant="link"
                onClick={async () => { if (cooldown === 0) await resendCode(); }}
                disabled={loading || cooldown > 0}
                size="sm"
                className="text-decoration-none"
              >
                {cooldown > 0 ? `إعادة الإرسال (${cooldown})` : 'إعادة إرسال'}
              </Button>
            </div>

            {/* Primary Bootstrap button */}
            <div className="d-grid">
              <Button
                variant="primary"
                size="lg"
                onClick={verifyCode}
                disabled={loading || code.length !== 6}
                className="rounded-3"
              >
                التحقق من الرمز
              </Button>
            </div>
          </>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <>
            <Form.Group className="mb-3">
              <Form.Label className="fw-medium">كلمة المرور الجديدة</Form.Label>
              <InputGroup size="md">
                <Form.Control
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="8 أحرف على الأقل"
                  disabled={loading}
                  autoFocus
                  className="rounded-3"
                />
              </InputGroup>
              <Form.Text className="text-muted">يفضل أن تحتوي على حروف وأرقام ورموز</Form.Text>
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label className="fw-medium">تأكيد كلمة المرور</Form.Label>
              <InputGroup size="md">
                <Form.Control
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="أعد إدخال كلمة المرور"
                  disabled={loading}
                  className="rounded-3"
                />
              </InputGroup>
              {confirmPassword && newPassword !== confirmPassword && (
                <Form.Text className="text-danger">كلمتا المرور غير متطابقتين</Form.Text>
              )}
            </Form.Group>

            <div className="d-flex justify-content-between align-items-center mb-4">
              <Button
                variant="outline-secondary"
                onClick={() => setStep(2)}
                disabled={loading}
                size="sm"
                className="rounded"
              >
                 رجوع
              </Button>
            </div>

            {/* Success Bootstrap button */}
            <div className="d-grid">
              <Button
                variant="primary"
                size="lg"
                onClick={resetPassword}
                disabled={loading || !validatePassword(newPassword) || newPassword !== confirmPassword}
                className="rounded-3"
              >
                {loading ? (<><Spinner size="sm" className="me-2" />جاري التحديث…</>) : 'تغيير كلمة المرور'}
              </Button>
            </div>
          </>
        )}
      </Modal.Body>

      <Modal.Footer className="border-0 pt-2 d-flex justify-content-end ms-2">
  
      </Modal.Footer>
    </Modal>
  );
}
