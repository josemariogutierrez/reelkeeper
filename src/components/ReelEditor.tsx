import { useEffect, useMemo, useState } from 'react'
import { useData } from '../data/store'
import type { Reel, ReelLocation } from '../types'
import ListPicker from './ListPicker'
import TagPicker from './TagPicker'
import LocationEditor from './LocationEditor'

/** Edits title/note/lists/tags/location for a reel and persists changes inline. */
export default function ReelEditor({ reel }: { reel: Reel }) {
  const { tags, updateReel, setReelLists, setReelTagsByName } = useData()
  const [title, setTitle] = useState(reel.title ?? '')
  const [note, setNote] = useState(reel.note ?? '')

  useEffect(() => {
    setTitle(reel.title ?? '')
    setNote(reel.note ?? '')
  }, [reel.id]) // re-sync when editing a different reel

  const tagNames = useMemo(() => {
    const byId = new Map(tags.map((t) => [t.id, t.name]))
    return reel.tagIds.map((id) => byId.get(id)).filter(Boolean) as string[]
  }, [tags, reel.tagIds])

  return (
    <div className="editor">
      <div className="field">
        <label className="field__label">Title</label>
        <input
          className="input"
          value={title}
          placeholder="e.g. Best birria tacos"
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => updateReel(reel.id, { title: title.trim() || undefined })}
        />
      </div>

      <ListPicker value={reel.listIds} onChange={(ids) => setReelLists(reel.id, ids)} />

      <TagPicker value={tagNames} onChange={(names) => setReelTagsByName(reel.id, names)} />

      <LocationEditor
        value={reel.location}
        onChange={(loc: ReelLocation | undefined) => updateReel(reel.id, { location: loc })}
      />

      <div className="field">
        <label className="field__label">Note</label>
        <textarea
          className="input textarea"
          value={note}
          placeholder="Anything you want to remember…"
          onChange={(e) => setNote(e.target.value)}
          onBlur={() => updateReel(reel.id, { note: note.trim() || undefined })}
        />
      </div>
    </div>
  )
}
