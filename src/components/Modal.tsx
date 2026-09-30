import { AnimatePresence, motion } from 'motion/react'
import { X } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

// On phones a modal is a bottom sheet by default, which suits forms (close to the thumb and the keyboard).
// `centered` floats it in the middle of the screen instead, for short read-only dialogs.
export function Modal({
  open,
  onClose,
  title,
  centered = false,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  centered?: boolean
  children: ReactNode
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // Rendered into <body> rather than in place: a parent with a backdrop-filter (the frosted panels)
  // would otherwise become the frame for this fixed overlay, pinning and clipping the dialog inside it.
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className={`fixed inset-0 z-40 flex justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4 ${centered ? 'items-center p-4' : 'items-end'}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={`max-h-[90dvh] w-full max-w-md overflow-y-auto border border-line bg-surface p-5 shadow-2xl sm:rounded-3xl ${centered ? 'rounded-3xl' : 'rounded-t-3xl'}`}
            initial={centered ? { y: 16, scale: 0.96, opacity: 0 } : { y: 60, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={centered ? { y: 16, scale: 0.96, opacity: 0 } : { y: 60, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">{title}</h2>
              <button onClick={onClose} className="rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-ink" aria-label="Close">
                <X size={18} />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
