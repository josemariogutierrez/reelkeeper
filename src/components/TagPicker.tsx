import { useState } from 'react'
import { useData } from '../data/store'

export default function TagPicker({
  value,
  onChange,
}: {
  value: string[] // tag names
  onChange: (names: string[]) => void
}) {
  const [input, setInput] = useState('')
  const { tags } = useData()

  const add = (raw: string) => {
    const name = raw.trim().toLowerCase()
    if (!name || value.includes(name)) return
    onChange([...value, name])
    setInput('')
  }
  const remove = (name: string) => onChange(value.filter((n) => n !== name))

  const suggestions = tags
    .map((t) => t.name)
    .filter((n) => !value.includes(n) && (!input || n.includes(input.toLowerCase())))
    .slice(0, 8)

  return (
    <div className="field">
      <label className="field__label">Tags</label>
      <div className="chips">
        {value.map((name) => (
          <button key={name} className="chip chip--on" onClick={() => remove(name)} type="button">
            #{name} <span className="chip__x">×</span>
          </button>
        ))}
      </div>
      <input
        className="input"
        value={input}
        placeholder="Add a tag, press Enter"
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault()
            add(input)
          }
        }}
      />
      {suggestions.length > 0 && (
        <div className="chips chips--suggest">
          {suggestions.map((n) => (
            <button key={n} className="chip" type="button" onClick={() => add(n)}>
              #{n}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
