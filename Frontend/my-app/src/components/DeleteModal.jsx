import React from 'react';
import { Modal, Button } from 'react-bootstrap';

export default function DeleteModal({ show, onHide, onConfirm }) {
  return (
    <Modal show={show} onHide={onHide} centered dir="rtl">
      <Modal.Header closeButton closeVariant="white" className="bg-danger text-white">
        <Modal.Title>تأكيد الحذف</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="mb-0">هل أنت متأكد أنك تريد حذف هذا العنصر؟ هذا الإجراء لا يمكن التراجع عنه.</p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          إلغاء
        </Button>
        <Button variant="danger" id="confirmDelete" onClick={onConfirm}>
          حذف
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
