import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Lock, ArrowUpRight, ArrowDownRight } from 'lucide-react'

interface DataCellProps {
  value: string
  isBreach: boolean
  reason?: string
  editable: boolean
  disabled?: boolean
  onSave: (value: string, reason?: string) => void
  threshold: number
  type: 'availability' | 'volume'
  changeValue?: number | null
}

export function DataCell({
  value,
  isBreach,
  reason,
  editable,
  disabled = false,
  onSave,
  threshold,
  type,
  changeValue,
}: DataCellProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value === '—' ? '' : value)
  const [editReason, setEditReason] = useState(reason || '')

  const handleSave = () => {
    if (!editValue) {
      setIsEditing(false)
      return
    }

    // Check if breach requires reason
    let willBreach = false
    if (type === 'availability') {
      const numVal = parseFloat(editValue.replace('%', ''))
      willBreach = !isNaN(numVal) && numVal < threshold
    }

    if (willBreach && !editReason.trim()) {
      toast.error('Please provide a reason for the threshold breach')
      return
    }

    onSave(editValue, editReason || undefined)
    setIsEditing(false)
  }

  // Display for disabled/locked cells
  if (disabled) {
    return (
      <div
        className={cn(
          'text-[10px] font-bold px-2 py-1 rounded-md opacity-20 cursor-not-allowed uppercase tracking-wider',
          'bg-muted/30 text-muted-foreground',
        )}
        title="Cannot edit future months"
      >
        <Lock className="h-3 w-3" />
      </div>
    )
  }

  if (!editable) {
    return (
      <div
        className={cn(
          'text-[11px] font-bold px-2 py-1 rounded-md tabular-nums transition-all border border-transparent',
          isBreach
            ? 'bg-red-500/10 text-red-600 border-red-500/20'
            : 'text-muted-foreground/80',
        )}
        title={reason || undefined}
      >
        {value}
        {isBreach && (
          <div className="h-1 w-full bg-red-500 rounded-full mt-0.5" />
        )}
      </div>
    )
  }

  if (isEditing) {
    return (
      <div className="space-y-1.5 p-1 bg-background border border-primary/20 rounded-lg shadow-md animate-in zoom-in-95 duration-200 z-50 min-w-[120px]">
        <Input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          className="h-8 text-[11px] text-center w-full font-bold tabular-nums border-primary/20"
          placeholder={type === 'availability' ? '99.5%' : '10000'}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave()
            if (e.key === 'Escape') setIsEditing(false)
          }}
          autoFocus
        />
        <Textarea
          value={editReason}
          onChange={(e) => setEditReason(e.target.value)}
          className="h-16 text-[10px] resize-none border-primary/10"
          placeholder="Reason for breach..."
        />
        <div className="flex gap-1.5">
          <Button
            size="sm"
            className="h-7 text-[10px] flex-1 font-bold uppercase tracking-widest"
            onClick={handleSave}
          >
            Apply
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-[10px] font-bold"
            onClick={() => setIsEditing(false)}
          >
            Cancel
          </Button>
        </div>
      </div>
    )
  }

  return (
    <button
      className={cn(
        'text-[11px] font-bold px-2 py-1.5 rounded-md w-full transition-all tabular-nums border border-transparent',
        'hover:bg-primary/10 hover:border-primary/20 cursor-pointer hover:scale-105 active:scale-95 group/cell',
        isBreach
          ? 'bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-500/20'
          : 'text-foreground group-hover/cell:text-primary',
      )}
      onClick={() => setIsEditing(true)}
      title={
        reason ||
        (isBreach
          ? 'Threshold Breach - Click to edit reason'
          : 'Click to edit data')
      }
    >
      <span className="relative">
        {value}
        {type === 'volume' && changeValue != null && (
          <span
            className={cn(
              'absolute -top-2 -right-3 text-[8px] font-bold',
              changeValue > 0 ? 'text-green-600' : 'text-red-500',
            )}
          >
            {changeValue > 0 ? (
              <ArrowUpRight className="h-2 w-2" />
            ) : (
              <ArrowDownRight className="h-2 w-2" />
            )}
          </span>
        )}
      </span>
      {isBreach && (
        <div className="h-0.5 w-full bg-red-500 rounded-full mt-1.5" />
      )}
    </button>
  )
}
