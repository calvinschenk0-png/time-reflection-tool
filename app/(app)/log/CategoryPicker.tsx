'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Node } from './types'

const COLORS = ['#2563eb', '#7c3aed', '#16a34a', '#d97706', '#dc2626', '#0891b2', '#be185d', '#059669']

export default function CategoryPicker({ nodes, selectedWorkstreamId, onPick, onNodesChanged }: {
  nodes: Node[]
  selectedWorkstreamId: string | null
  onPick: (id: string | null) => void
  onNodesChanged: (nodes: Node[]) => void
}) {
  const supabase = createClient()
  const projects = nodes.filter(n => n.level === 'project' && !n.is_archived)
  const workstreams = nodes.filter(n => n.level === 'workstream' && !n.is_archived)
  const selectedWs = nodes.find(n => n.id === selectedWorkstreamId) ?? null

  const [projectId, setProjectId] = useState<string | null>(selectedWs?.parent_id ?? null)
  const selectedProject = projects.find(p => p.id === projectId) ?? null

  // Project picker UI
  const [pOpen, setPOpen] = useState(false)
  const [pQuery, setPQuery] = useState('')
  const [pCreating, setPCreating] = useState(false)
  const [pName, setPName] = useState('')

  // Workstream picker UI
  const [wOpen, setWOpen] = useState(false)
  const [wQuery, setWQuery] = useState('')
  const [wCreating, setWCreating] = useState(false)
  const [wName, setWName] = useState('')
  const [wColor, setWColor] = useState(COLORS[0])
  const [wDup, setWDup] = useState<string | null>(null)

  async function getUser() { const { data: { user } } = await supabase.auth.getUser(); return user }

  function pickProject(id: string) {
    setProjectId(id)
    if (selectedWs && selectedWs.parent_id !== id) onPick(null)
    setPOpen(false); setPQuery(''); setPCreating(false); setPName('')
  }
  async function createProject() {
    const name = pName.trim(); if (!name) return
    const user = await getUser()
    const { data } = await supabase.from('hierarchy_nodes').insert({ user_id: user!.id, name, level: 'project', parent_id: null }).select().single()
    if (data) { onNodesChanged([...nodes, data]); pickProject(data.id) }
  }

  function pickWorkstream(id: string) {
    onPick(id); setWOpen(false); setWQuery(''); setWCreating(false); setWName(''); setWDup(null)
  }
  async function createWorkstream() {
    const name = wName.trim(); if (!name || !projectId) return
    const similar = workstreams.find(w => w.parent_id === projectId && (
      w.name.toLowerCase() === name.toLowerCase() ||
      w.name.toLowerCase().includes(name.toLowerCase()) ||
      name.toLowerCase().includes(w.name.toLowerCase())
    ))
    if (similar && wDup !== similar.name) { setWDup(similar.name); return }
    const user = await getUser()
    const { data } = await supabase.from('hierarchy_nodes').insert({ user_id: user!.id, name, level: 'workstream', parent_id: projectId, color: wColor }).select().single()
    if (data) { onNodesChanged([...nodes, data]); pickWorkstream(data.id) }
  }

  const projMatches = projects.filter(p => p.name.toLowerCase().includes(pQuery.toLowerCase()))
  const wsMatches = workstreams.filter(w => w.parent_id === projectId && w.name.toLowerCase().includes(wQuery.toLowerCase()))

  return (
    <div>
      {/* PROJECT */}
      <label style={lbl}>Project</label>
      <div style={{ marginBottom: 14 }}>
        {pCreating ? (
          <div style={createBox}>
            <input autoFocus value={pName} onChange={e => setPName(e.target.value)} placeholder="Project name" style={inputStyle} />
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button onClick={createProject} disabled={!pName.trim()} style={saveBtn}>Save</button>
              <button onClick={() => { setPCreating(false); setPName('') }} style={cancelBtn}>Cancel</button>
            </div>
          </div>
        ) : selectedProject && !pOpen ? (
          <button onClick={() => setPOpen(true)} style={selectedBox}>
            <span style={{ fontSize: 13, fontWeight: 500, color: '#111' }}>{selectedProject.name}</span>
            <span style={{ fontSize: 11, color: '#999' }}>change</span>
          </button>
        ) : (
          <div>
            <input autoFocus value={pQuery} onChange={e => { setPQuery(e.target.value); setPOpen(true) }} onFocus={() => setPOpen(true)} placeholder="Type a project…" style={inputStyle} />
            {pOpen && (
              <div style={listBox}>
                {projMatches.map(p => (
                  <button key={p.id} onClick={() => pickProject(p.id)} style={optionRow}>
                    <span style={{ fontSize: 13, color: '#111' }}>{p.name}</span>
                  </button>
                ))}
                {projMatches.length === 0 && <div style={emptyRow}>No matches</div>}
                <button onClick={() => { setPCreating(true); setPName(pQuery) }} style={{ ...optionRow, color: '#2563eb', fontWeight: 600, borderTop: '1px solid #f0f0f0' }}>
                  + New project{pQuery ? ` “${pQuery}”` : ''}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* WORKSTREAM */}
      <label style={lbl}>Workstream</label>
      {!projectId ? (
        <div style={{ fontSize: 12, color: '#999', padding: '9px 12px', border: '1px dashed #e4e4e7', borderRadius: 10 }}>
          Select a project first
        </div>
      ) : wCreating ? (
        <div style={{ ...createBox, background: wColor + '14', border: `1px solid ${wColor}40` }}>
          <input autoFocus value={wName} onChange={e => { setWName(e.target.value); setWDup(null) }} placeholder="Workstream name" style={inputStyle} />
          <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
            {COLORS.map(c => (
              <button key={c} onClick={() => setWColor(c)} style={{ width: 22, height: 22, borderRadius: 5, background: c, border: 'none', cursor: 'pointer', outline: wColor === c ? `2px solid ${c}` : 'none', outlineOffset: 2 }} />
            ))}
          </div>
          {wDup && <p style={dupStyle}>You already have “{wDup}”. Click Save again to add anyway.</p>}
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button onClick={createWorkstream} disabled={!wName.trim()} style={saveBtn}>Save</button>
            <button onClick={() => { setWCreating(false); setWName(''); setWDup(null) }} style={cancelBtn}>Cancel</button>
          </div>
        </div>
      ) : selectedWs && !wOpen ? (
        <button onClick={() => setWOpen(true)} style={{ ...selectedBox, borderColor: selectedWs.color ?? '#e4e4e7' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: selectedWs.color ?? '#999' }} />
            <span style={{ fontSize: 13, fontWeight: 500, color: '#111' }}>{selectedWs.name}</span>
          </span>
          <span style={{ fontSize: 11, color: '#999' }}>change</span>
        </button>
      ) : (
        <div>
          <input autoFocus value={wQuery} onChange={e => { setWQuery(e.target.value); setWOpen(true) }} onFocus={() => setWOpen(true)} placeholder="Type a workstream…" style={inputStyle} />
          {wOpen && (
            <div style={listBox}>
              {wsMatches.map(w => (
                <button key={w.id} onClick={() => pickWorkstream(w.id)} style={optionRow}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 9, height: 9, borderRadius: 3, background: w.color ?? '#999' }} />
                    <span style={{ fontSize: 13, color: '#111' }}>{w.name}</span>
                  </span>
                </button>
              ))}
              {wsMatches.length === 0 && <div style={emptyRow}>No matches in this project</div>}
              <button onClick={() => { setWCreating(true); setWName(wQuery) }} style={{ ...optionRow, color: '#2563eb', fontWeight: 600, borderTop: '1px solid #f0f0f0' }}>
                + New workstream{wQuery ? ` “${wQuery}”` : ''}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const lbl: React.CSSProperties = { display: 'block', fontSize: 12, color: '#666', marginBottom: 5, fontWeight: 500 }
const inputStyle: React.CSSProperties = {
  width: '100%', border: '1px solid #e4e4e7', borderRadius: 10, padding: '9px 12px',
  fontSize: 13, color: '#111', background: '#fff', outline: 'none', fontFamily: "'Inter', sans-serif", boxSizing: 'border-box',
}
const listBox: React.CSSProperties = { border: '1px solid #e4e4e7', borderRadius: 10, marginTop: 4, overflow: 'hidden' }
const optionRow: React.CSSProperties = {
  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '9px 12px', background: '#fff', border: 'none', cursor: 'pointer', textAlign: 'left',
}
const emptyRow: React.CSSProperties = { padding: '10px 12px', fontSize: 12, color: '#999' }
const selectedBox: React.CSSProperties = {
  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  border: '1px solid #e4e4e7', borderRadius: 10, padding: '9px 12px', background: '#fff', cursor: 'pointer',
}
const createBox: React.CSSProperties = { background: '#eef3ff', borderRadius: 10, padding: 12 }
const saveBtn: React.CSSProperties = { background: '#111', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }
const cancelBtn: React.CSSProperties = { background: '#fff', color: '#666', border: '1px solid #e4e4e7', borderRadius: 8, padding: '7px 14px', fontSize: 12, cursor: 'pointer' }
const dupStyle: React.CSSProperties = { fontSize: 11, color: '#92400e', background: '#fef3c7', borderRadius: 6, padding: '6px 8px', marginTop: 8 }
