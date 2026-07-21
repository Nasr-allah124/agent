import { useEffect } from 'react';
import { AlertCircle, X } from 'lucide-react';

export default function Toast({ message, onClose }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-card border border-danger/30 rounded-xl shadow-2xl max-w-sm">
      <AlertCircle size={16} className="text-danger flex-shrink-0" />
      <p className="text-xs text-foreground flex-1">{message}</p>
      <button onClick={onClose} className="p-1 hover:bg-muted rounded-lg transition-colors flex-shrink-0">
        <X size={12} className="text-muted-foreground" />
      </button>
    </div>
  );
}