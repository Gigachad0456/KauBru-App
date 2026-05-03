interface Props {
  open: boolean
  message: string
  onConfirm: () => void
  onCancel: () => void
}

export default function Confirm({ open, message, onConfirm, onCancel }: Props) {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
    >
      <div className="glass p-6 w-full max-w-sm text-center">
        <div className="text-3xl mb-3">⚠️</div>
        <p className="text-white font-semibold mb-1">Are you sure?</p>
        <p className="text-gray-400 text-sm mb-5">{message}</p>
        <div className="flex gap-3 justify-center">
          <button className="btn-ghost" onClick={onCancel}>Cancel</button>
          <button className="btn-danger" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  )
}
