import React from 'react';
import { Modal, Button } from 'react-bootstrap';

export default function SessionTimeoutModal({ show, timeLeft, onStay, onLogout }) {
  const m = Math.floor(Math.max(0, timeLeft) / 60);
  const s = Math.max(0, timeLeft) % 60;
  const formatted = `${m}:${s.toString().padStart(2, '0')}`;

  return (
    <>
      <Modal
        show={show}
        backdrop="static"     // لا تُغلق بالضغط خارج
        keyboard={false}      // لا تُغلق بـ ESC
        centered
        dir="rtl"
        animation={false}     // نستخدم أنيميشننا الخاص
        dialogClassName="session-pop"
      >
        <Modal.Header>
          <Modal.Title>انتهاء الجلسة</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          سيتم تسجيل خروجك تلقائيًا خلال {formatted} بسبب عدم النشاط.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onLogout}>تسجيل الخروج الآن</Button>
          <Button variant="primary" onClick={onStay}>متابعة الجلسة</Button>
        </Modal.Footer>
      </Modal>

      <style>{`
        .modal.show .modal-dialog.session-pop {
          animation: sessionPop .18s cubic-bezier(.2,.8,.2,1);
        }
        @keyframes sessionPop {
          from { transform: translateY(10px) scale(.98); opacity: 0; }
          to   { transform: translateY(0)   scale(1);    opacity: 1; }
        }
      `}</style>
    </>
  );
}
