import React from 'react';
import { Modal, Button } from 'react-bootstrap';

export default function SessionTimeoutModal({ show, timeLeft, onStay, onLogout }) {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formatted = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  return (
    <Modal show={show} backdrop="static" centered dir="rtl">
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
  );
}
