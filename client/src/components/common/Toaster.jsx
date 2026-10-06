import { CheckCircle2, XCircle, Info, X } from 'lucide-react'
import useToastStore from '../../store/toastStore'

const STYLES = {
  success: { bg: '#F0FDF4', border: '#BBF7D0', color: '#166534', Icon: CheckCircle2 },
  error:   { bg: '#FEF2F2', border: '#FECACA', color: '#B91C1C', Icon: XCircle },
  info:    { bg: '#FFF7ED', border: '#FED7AA', color: '#9A3412', Icon: Info },
}

export default function Toaster() {
  const toasts = useToastStore((s) => s.toasts)
  const dismiss = useToastStore((s) => s.dismiss)

  return (
    <div className="bl-toaster" aria-live="polite">
      {toasts.map((t) => {
        const { bg, border, color, Icon } = STYLES[t.type] || STYLES.info
        return (
          <div
            key={t.id}
            role="status"
            className="bl-toast"
            style={{ backgroundColor: bg, border: `1px solid ${border}`, color }}
          >
            <Icon size={20} style={{ flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: 14, fontWeight: 600, lineHeight: 1.4 }}>{t.message}</span>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color, padding: 2, display: 'flex' }}
            >
              <X size={16} />
            </button>
          </div>
        )
      })}
    </div>
  )
}