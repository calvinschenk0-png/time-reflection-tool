'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Node } from './types'

const COLORS = ['#2563eb', '#7c3aed', '#16a34a', '#d97706', '#dc2626', '#0891b2', '#be185d', '#059669']

export default function WorkstreamPicker({ nodes, selectedId, onPick, onNodesChanged }: {
  nodes: Node[]
  selectedId: string | null
  onPick: (workstreamId: string) => void
  onNodesChanged: (nodes: Node[]) => void
}) {
  const supabase = createClient()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newProject, setNewProject] = useState('')
  const [newColor, setNewColor] = useState(COLORS[0])
  const [duplicate, setDuplicate] = useState<string | null>(null)

  const projects = nodes.filter(n => n.level === 'project' && !n.is_archived)
  const workstreams = nodes.filter(n => n.level === 'workstream' && !n.is_archived)

  const selected = nodes.find(n => n.id === selectedId) ?? null
  const selectedProject = selected ? nodes.find(n => n.id === selected.parent_id) : null

  const matches = workstreams.filter(w => w.name.toLowerCase().includes(query.toLowerCase()))

  function projectName(parentId: string | null) {
    return nodes.find(n => n.id === parentId)?.name ?? ''
  }

  function startCreate() {
    setCreating(true)
    setNewName(query)
    setNewProject(projects[0]?.id ?? '')
    setDuplicate(null)
  }

  async function saveNew() {
    const trimmed = newName.trim()
    if (!trimmed || !newProject) return

    // Fuzzy duplicate guard
    const similar = workstreams.find(w =>
      w.name.toLowerCase() === trimmed.toLowerCase() ||
      w.name.toLowerCase().includes(trimmed.toLowerCase()) ||
      trimmed.toLowerCase().includes(w.name.toLowerCase())
    )
    if (similar && duplicate !== similar.name) {
      setDuplicate(similar.name)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase.from('hierarchy_nodes').insert({
      user_id: user!.id,
      name: trimmed,
      level: 'workstream',
      parent_id: newProject,
      color: newColor,
    }).select().single()

    if (data) {
      onNodesChanged([...nodes, data])
      onPick(data.id)
      reset()
    }
  }

  function reset() {
    setCreating(false)
    setNewName('')
    setQuery('')
    setOpen(false)
    setDuplicate(null)
  }

  // ── Creation mini-form ──
  if (creating) {
    return (
      <div style={{ background: newColor + '14', border: `1px solid ${newColor}40`, borderRadius: 10, padding: 12 }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: '#111', marginBottom: 8 }}>New workstream</p>

        {projects.length === 0 ? (
          <p style={{ fontSize: 12, color: '#dc2626' }}>
            Create a project first in Settings → Categories.
          </p>
        ) : (
          <>
            <input
              value={newName}
              onChange={e => { setNewName(e.target.value); setDuplicate(null) }}
              placeholder="Workstream name"
              style={inputStyle}
            />
            <select value={newProject} onChange={e => setNewProject(e.target.value)} style={{ ...inputStyle, marginTop: 8 }}>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
              {COLORS.map(c => (
                <button key={c} onClick={() => setNewColor(c)}
                  style={{ width: 22, height: 22, borderRadius: 5, background: c, border: 'none', cursor: 'pointer', outline: newColor === c ? `2px solid ${c}` : 'none', outlineOffset: 2 }} />
              ))}
            </div>
            {duplicate && (
              <p style={{ fontSize: 11, color: '#92400e', background: '#fef3c7', borderRadius: 6, padding: '6px 8px', marginTop: 8 }}>
                You already have “{duplicate}”. Click Save again to add anyway.
              </p>
            )}
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button onClick={saveNew} disabled={!newName.trim()} style={saveBtn}>Save</button>
              <button onClick={reset} style={cancelBtn}>Cancel</button>
            </div>
          </>
        )}
      </div>
    )
  }

  // ── Selected display ──
  if (selected && !open) {
    return (
      <button onClick={() => setOpen(true)} style={{ ...selectedBox, borderColor: selected.color ?? '#e4e4e7' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 10, height: 10, borderRadius: 3, background: selected.color ?? '#999' }} />
          <span style={{ fontSize: 13, fontWeight: 500, color: '#111' }}>{selected.name}</span>
        </div>
        {selectedProject && <span style={{ fontSize: 11, color: '#999' }}>{selectedProject.name}</span>}
      </button>
    )
  }

  // ── Typeahead ──
  return (
    <div>
      <input
        autoFocus
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        placeholder="Type a workstream…"
        style={inputStyle}
      />
      {open && (
        <div style={{ border: '1px solid #e4e4e7', borderRadius: 10, marginTop: 4, overflow: 'hidden' }}>
          {matches.map(w => (
            <button
              key={w.id}
              onClick={() => { onPick(w.id); reset() }}
              style={optionRow}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 9, height: 9, borderRadius: 3, background: w.color ?? '#999' }} />
                <span style={{ fontSize: 13, color: '#111' }}>{w.name}</span>
              </div>
              <span style={{ fontSize: 11, color: '#999' }}>{projectName(w.parent_id)}</span>
            </button>
          ))}
          {matches.length === 0 && (
            <div style={{ padding: '10px 12px', fontSize: 12, color: '#999' }}>No matches</div>
          )}
          <button onClick={startCreate} style={{ ...optionRow, color: '#2563eb', fontWeight: 600, borderTop: '1px solid #f0f0f0' }}>
            + New workstream{query ? ` “${query}”` : ''}
          </button>
        </div>
      )}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', border: '1px solid #e4e4e7', borderRadius: 10, padding: '9px 12px',
  fontSize: 13, color: '#111', background: '#fff', outline: 'none', fontFamily: "'Inter', sans-serif",
}
const selectedBox: React.CSSProperties = {
  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  border: '1px solid', borderRadius: 10, padding: '9px 12px', background: '#fff', cursor: 'pointer',
}
const optionRow: React.CSSProperties = {
  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '9px 12px', background: '#fff', border: 'none', cursor: 'pointer', textAlign: 'left',
}
const saveBtn: React.CSSProperties = {
  background: '#111', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
}
const cancelBtn: React.CSSProperties = {
  background: '#fff', color: '#666', border: '1px solid #e4e4e7', borderRadius: 8, padding: '7px 14px', fontSize: 12, cursor: 'pointer',
}
