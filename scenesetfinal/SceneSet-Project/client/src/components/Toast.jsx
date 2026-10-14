import { useEffect } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(onClose, 4200);
    return () => window.clearTimeout(timer);
  }, [toast, onClose]);
  if (!toast) return null;
  const Icon = toast.type === 'error' ? AlertCircle : CheckCircle2;
  return (
    <div className={`toast toast-${toast.type || 'success'}`} role="status">
      <Icon size={19} />
      <span>{toast.message}</span>
      <button className="icon-button toast-close" onClick={onClose} aria-label="Close message"><X size={16} /></button>
    </div>
  );
}
