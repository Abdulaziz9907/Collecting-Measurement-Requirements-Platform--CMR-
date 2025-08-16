import React, { useEffect, useState } from 'react';
import { Modal, Button } from 'react-bootstrap';

export default function DeleteModal({
  show,
  onHide,
  onConfirm,
  subject = 'هذا العنصر',
  cascadeNote,
  cascade = [],
  requireText,     // (اختياري) نص يجب كتابته حرفيًا للتأكيد
  requireCount,    // (اختياري) رقم (عدد العناصر) يجب كتابته للتأكيد – يدعم 123 و١٢٣
}) {
  const hasCascade = (cascadeNote && cascadeNote.trim()) || (cascade && cascade.length > 0);

  const clean = (s = '') =>
    String(s)
      .replace(/\u200f|\u200e|\ufeff/g, '')
      .trim();

  // تحويل أرقام عربية/فارسيّة إلى لاتينية
  const normalizeDigits = (str = '') => {
    const map = { '٠':'0','١':'1','٢':'2','٣':'3','٤':'4','٥':'5','٦':'6','٧':'7','٨':'8','٩':'9','۰':'0','۱':'1','۲':'2','۳':'3','۴':'4','۵':'5','۶':'6','۷':'7','۸':'8','۹':'9' };
    return String(str).replace(/[٠-٩۰-۹]/g, ch => map[ch] || ch);
  };

  const [typed, setTyped] = useState('');
  useEffect(() => {
    if (show) setTyped('');
  }, [show, requireText, requireCount]);

  const needsCount = Number.isFinite(requireCount) && requireCount > 0;
  const needsText  = typeof requireText === 'string' && requireText.trim().length > 0;

  let canConfirm = true;
  if (needsCount) {
    const asNumber = Number(normalizeDigits(clean(typed)));
    canConfirm = asNumber === Number(requireCount);
  } else if (needsText) {
    canConfirm = clean(typed) === clean(requireText);
  }

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

        {(needsCount || needsText) && (
          <div className="mt-3">
            <div className="small text-muted mb-1">
              {needsCount
                ? <>للتأكيد، اكتب <strong>عدد العناصر</strong> المراد حذفها: <strong>{requireCount}</strong></>
                : <>للتأكيد، اكتب النص التالي تمامًا كما يظهر:</>
              }
            </div>
            <input
              className="form-control"
              placeholder={needsCount ? `اكتب: ${requireCount}` : (requireText ? `اكتب: ${requireText}` : 'اكتب للتأكيد')}
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoFocus
              inputMode={needsCount ? 'numeric' : 'text'}
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
          disabled={!(canConfirm)}
          title={needsCount ? 'اكتب العدد الصحيح لتفعيل الحذف' : (needsText ? 'اكتب النص لتفعيل الحذف' : 'حذف')}
        >
          حذف
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
