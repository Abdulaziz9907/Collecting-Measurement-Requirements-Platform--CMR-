import React from 'react';
import { Modal, Button } from 'react-bootstrap';
import useTranslation from '../hooks/useTranslation';
import { useLanguage } from '../context/LanguageContext';

export default function SessionTimeoutModal({ show, timeLeft, onStay, onLogout }) {
  const m = Math.floor(Math.max(0, timeLeft) / 60);
  const s = Math.max(0, timeLeft) % 60;
  const formatted = `${m}:${s.toString().padStart(2, '0')}`;
  const t = useTranslation();
  const { language } = useLanguage();

  return (
    <>
      <Modal
        show={show}
        backdrop="static"
        keyboard={false}
        centered
        dir={language === 'ar' ? 'rtl' : 'ltr'}
        animation={false}
        dialogClassName="session-pop"
      >
        <Modal.Header>
          <Modal.Title>{t('sessionTimeoutTitle')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {t('sessionTimeoutBody')} {formatted} {t('sessionTimeoutBodyTail')}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onLogout}>{t('sessionLogoutNow')}</Button>
          <Button variant="primary" onClick={onStay}>{t('sessionStay')}</Button>
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
