import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { createList, db } from '../db'

export default function ListPicker({
  value,
  onChange,
}: {
  value: string[] // list ids
  onChange: (ids: string[]) => void
}) {
  const [newName, setNewName] = useState('')
  const lists = useLiveQuery(() => db.lists.orderBy('createdAt').toArray(), [], [])

  const toggle = (id: string) =>
    onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id])

  const create = async () => {
    const name = newName.trim()
    if (!name) return
    const id = await createList(name)
    setNewName('')
    onChange([...value, id])
  }

  return (
    <div className="field">
      <label className="field__label">Lists</label>
      <div className="chips">
        {lists.map((l) => (
          <button
            key={l.id}
            type="button"
            className={'chip' + (value.includes(l.id) ? ' chip--on' : '')}
            onClick={() => toggle(l.id)}
          >
            {l.name}
          </button>
        ))}
        {lists.length === 0 && <span className="muted">No lists yet — create one below.</span>}
      </div>
      <div className="row">
        <input
          className="input"
          value={newName}
          placeholder="New list name"
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && create()}
        />
        <button type="button" className="btn btn--ghost" onClick={create}>
          Add
        </button>
      </div>
    </div>
  )
}
