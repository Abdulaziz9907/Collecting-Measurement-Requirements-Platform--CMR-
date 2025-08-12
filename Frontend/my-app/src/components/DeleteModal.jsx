import React, { useEffect, useState } from 'react';
import { Modal, Button } from 'react-bootstrap';

export default function DeleteModal({
  show,
  onHide,
  onConfirm,
  subject = 'هذا العنصر',
  cascadeNote,              // نص تحذير مخصّص (اختياري)
  cascade = [],             // قائمة بالعناصر المرتبطة (اختياري)
  requireText,              // ✅ الاسم المطلوب كتابته للتأكيد (مثلاً اسم الجهة)
}) {
  const hasCascade = (cascadeNote && cascadeNote.trim()) || (cascade && cascade.length > 0);

  // تأكد من التطابق مع إزالة مسافات خفية فقط
  const clean = (s = '') =>
    String(s)
      .replace(/\u200f|\u200e|\ufeff/g, '') // remove hidden marks
      .trim();

  const [typed, setTyped] = useState('');
  useEffect(() => {
    if (show) setTyped(''); // reset when opening
  }, [show, requireText]);

  const needsTyping = typeof requireText === 'string' && requireText.trim().length > 0;
  const canConfirm = !needsTyping || clean(typed) === clean(requireText);

  return (
    <Modal show={show} onHide={onHide} centered dir="rtl">
      <Modal.Header className="bg-danger text-white">
        <Modal.Title>تأكيد الحذف</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <p className="mb-2">
          هل أنت متأكد أنك تريد حذف <strong>{subject}</strong>؟ هذا الإجراء لا يمكن التراجع عنه.
        </p>

        {hasCascade && (
          <div className="mt-2 p-2 rounded border border-warning bg-warning bg-opacity-10">
            <strong className="text-warning">تنبيه:</strong>
            <div className="mt-1 small">
              {cascadeNote ? (
                <span>{cascadeNote}</span>
              ) : (
                <>
                  <span>سيتم حذف العناصر المرتبطة التالية أيضًا:</span>
                  <ul className="mt-2 mb-0">
                    {cascade.map((c, i) => {
                      if (typeof c === 'string') return <li key={i}>{c}</li>;
                      const { label, count } = c || {};
                      return <li key={i}>{label}{typeof count === 'number' ? ` (${count})` : ''}</li>;
                    })}
                  </ul>
                </>
              )}
            </div>
          </div>
        )}

        {needsTyping && (
          <div className="mt-3">
            <div className="small text-muted mb-1">
              للتأكيد، اكتب اسم الجهة تمامًا كما يظهر:
            </div>
            <input
              className="form-control"
              placeholder={`اكتب: ${requireText}`}
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoFocus
            />
          </div>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          إلغاء
        </Button>
        <Button
          variant="danger"
          id="confirmDelete"
          onClick={onConfirm}
          disabled={!canConfirm}
          title={needsTyping && !canConfirm ? 'اكتب اسم الجهة لتفعيل الحذف' : 'حذف'}
        >
          حذف
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
