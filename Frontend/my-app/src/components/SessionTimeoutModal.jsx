// components/SessionTimeoutModal.jsx
import React from 'react';
import { Modal, Button } from 'react-bootstrap';

export default function SessionTimeoutModal({ show, timeLeft, onStay, onLogout }) {
  const safe = Math.max(0, Number.isFinite(timeLeft) ? timeLeft : 0);
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  const formatted = `${m}:${s.toString().padStart(2, '0')}`;

  return (
    <>
      <Modal
        show={show}
        backdrop="static"
        keyboard={false}
        centered
        dir="rtl"
        animation={false}
        dialogClassName="session-pop"
      >
        <Modal.Header>
          <Modal.Title>انتهاء الجلسة</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          سيتم تسجيل خروجك تلقائيًا خلال <b>{formatted}</b> بسبب عدم النشاط.
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
