import { useState } from 'react'
import { Calendar, Clock, X, ChevronLeft, ChevronRight } from 'lucide-react'

const HE_DAYS = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳']
const HE_MONTHS = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר']

type Props = {
  /** ISO string or empty string */
  value?: string
  /** Called with ISO string, or empty string when cleared */
  onChange?: (iso: string) => void
  /** Hide time selection (date only) */
  dateOnly?: boolean
}

export default function DateTimePicker({ value = '', onChange, dateOnly }: Props) {
  const now = new Date()
  const selected = value ? new Date(value) : null

  const [viewYear, setViewYear] = useState(selected?.getFullYear() ?? now.getFullYear())
  const [viewMonth, setViewMonth] = useState(selected?.getMonth() ?? now.getMonth())
  const [selectedTime, setSelectedTime] = useState(
    selected ? `${String(selected.getHours()).padStart(2, '0')}:${String(selected.getMinutes()).padStart(2, '0')}` : '20:00'
  )
  const [customTime, setCustomTime] = useState(false)

  function buildDate(year: number, month: number, day: number, time: string): string {
    const [h, m] = time.split(':').map(Number)
    return new Date(year, month, day, h, m).toISOString()
  }

  function selectDay(day: number) {
    const time = dateOnly ? '00:00' : selectedTime
    onChange?.(buildDate(viewYear, viewMonth, day, time))
  }

  function selectTime(time: string) {
    setSelectedTime(time)
    setCustomTime(false)
    if (selected) {
      onChange?.(buildDate(selected.getFullYear(), selected.getMonth(), selected.getDate(), time))
    }
  }

  function selectPreset(daysFromNow: number) {
    const d = new Date(now)
    d.setDate(d.getDate() + daysFromNow)
    const time = dateOnly ? '00:00' : selectedTime
    onChange?.(buildDate(d.getFullYear(), d.getMonth(), d.getDate(), time))
    setViewYear(d.getFullYear())
    setViewMonth(d.getMonth())
  }

  // Calendar helpers
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()

  const isToday = (day: number) => viewYear === now.getFullYear() && viewMonth === now.getMonth() && day === now.getDate()
  const isSelected = (day: number) => selected && viewYear === selected.getFullYear() && viewMonth === selected.getMonth() && day === selected.getDate()
  const isPast = (day: number) => new Date(viewYear, viewMonth, day) < new Date(now.getFullYear(), now.getMonth(), now.getDate())

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  return (
    <div className="bg-[#0a0a0f] border border-white/10 rounded-xl p-2.5 space-y-2 w-[250px]">
      {/* Quick presets */}
      <div className="flex flex-wrap gap-1">
        {[
          { label: 'היום', days: 0 },
          { label: 'מחר', days: 1 },
          { label: 'עוד שבוע', days: 7 },
        ].map(p => (
          <button key={p.label} onClick={() => selectPreset(p.days)}
            className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors">{p.label}</button>
        ))}
        {selected && (
          <button onClick={() => onChange?.('')}
            className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors flex items-center gap-1 mr-auto">
            <X size={8} /> נקה
          </button>
        )}
      </div>

      {/* Mini calendar */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <button onClick={prevMonth} className="p-0.5 rounded hover:bg-white/10 text-gray-500 hover:text-white transition-colors"><ChevronRight size={11} /></button>
          <span className="text-[10px] font-semibold text-white">{HE_MONTHS[viewMonth]} {viewYear}</span>
          <button onClick={nextMonth} className="p-0.5 rounded hover:bg-white/10 text-gray-500 hover:text-white transition-colors"><ChevronLeft size={11} /></button>
        </div>
        <div className="grid grid-cols-7">
          {HE_DAYS.map(d => (
            <div key={d} className="text-center text-[8px] text-gray-600 py-0.5">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {Array.from({ length: firstDayOfMonth }, (_, i) => <div key={`p-${i}`} />)}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1
            const past = isPast(day)
            const sel = isSelected(day)
            const today = isToday(day)
            return (
              <button key={day} onClick={() => !past && selectDay(day)} disabled={past}
                className={`h-5.5 rounded text-[10px] font-medium transition-all
                  ${sel ? 'bg-blue-600 text-white' : ''}
                  ${today && !sel ? 'text-blue-400 ring-1 ring-blue-500/30' : ''}
                  ${!sel && !today && !past ? 'text-gray-400 hover:bg-white/10' : ''}
                  ${past ? 'text-gray-700/50 cursor-not-allowed' : ''}`}
              >{day}</button>
            )
          })}
        </div>
      </div>

      {/* Time dropdown */}
      {!dateOnly && (
        <div>
          <p className="text-[9px] text-gray-500 mb-1 flex items-center gap-1"><Clock size={8} /> שעה</p>
          <select
            value={selectedTime}
            onChange={e => selectTime(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-[11px] text-white font-mono outline-none focus:border-blue-500/50 transition-colors appearance-none cursor-pointer"
            dir="ltr"
          >
            {Array.from({ length: 48 }, (_, i) => {
              const h = String(Math.floor(i / 2)).padStart(2, '0')
              const m = i % 2 === 0 ? '00' : '30'
              return `${h}:${m}`
            }).map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      )}

      {/* Live preview */}
      {selected && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded px-2 py-1 flex items-center gap-1">
          <Calendar size={9} className="text-blue-400 shrink-0" />
          <span className="text-[10px] text-blue-300 font-medium">
            {selected.toLocaleString('he-IL', {
              weekday: 'long', day: '2-digit', month: 'long',
              ...(dateOnly ? {} : { hour: '2-digit', minute: '2-digit' }),
            })}
          </span>
        </div>
      )}
    </div>
  )
}
