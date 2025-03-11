import { Input } from "./input"

interface TimePickerProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export function TimePicker({ value, onChange, disabled }: TimePickerProps) {
  return (
    <Input
      type="time"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="w-32"
    />
  )
} 