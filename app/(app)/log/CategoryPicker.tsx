'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Node } from './types'
import FieldHeading from './FieldHeading'

const COLORS = ['#2563eb', '#7c3aed', '#16a34a', '#d97706', '#dc2626', '#0891b2', '#be185d', '#059669']

export default function CategoryPicker({ nodes, selectedCategoryId, onPick, onNodesChanged }: {
  nodes: Node[]
  selectedCategoryId: string | null
  onPick: (id: string | null) => void
  onNodesChanged: (nodes: Node[]) => void
}) {
  const supabase = createClient()
  const areas = nodes.filter(n => n.level === 'area' && !n.is_archived)
  const categories = nodes.filter(n => n.level === 'category' && !n.is_archived)
  const selectedCat = nodes.find(n => n.id === selectedCategoryId) ?? null

  const [areaId, setAreaId] = useState<string | null>(selectedCat?.parent_id ?? null)
  const selectedArea = areas.find(a => a.id === areaId) ?? null

  // Area picker UI
  const [aOpen, setAOpen] = useState(false)
  const [aQuery, setAQuery] = useState('')
  const [aCreating, setACreating] = useState(false)
  const [aName, setAName] = useState('')

  // Category picker UI
  const [cOpen, setCOpen] = useState(false)
  const [cQuery, setCQuery] = useState('')
  const [cCreating, setCCreating] = useState(false)
  const [cName, setCName] = useState('')
  const [cColor, setCColor] = useState(COLORS[0])
  const [cDup, setCDup] = useState<string | null>(null)

  async function getUser() { const { data: { user } } = await supabase.auth.getUser(); return user }

  function pickArea(id: string) {
    setAreaId(id)
    if (selectedCat && selectedCat.parent_id !== id) onPick(null)
    setAOpen(false); setAQuery(''); setACreating(false); setAName('')
  }
  async function createArea() {
    const name = aName.trim(); if (!name) return
    const user = await getUser()
    const { data } = await supabase.from('hierarchy_nodes').insert({ user_id: user!.id, name, level: 'area', parent_id: null }).select().single()
    if (data) { onNodesChanged([...nodes, data]); pickArea(data.id) }
  }

  function pickCategory(id: string) {
    onPick(id); setCOpen(false); setCQuery(''); setCCreating(false); setCName(''); setCDup(null)
  }
  async function createCategory() {
    const name = cName.trim(); if (!name || !areaId) return
    const similar = categories.find(c => c.parent_id === areaId && (
      c.name.toLowerCase() === name.toLowerCase() ||
      c.name.toLowerCase().includes(name.toLowerCase()) ||
      name.toLowerCase().includes(c.name.toLowerCase())
    ))
    if (similar && cDup !== similar.name) { setCDup(similar.name); return }
    const user = await getUser()
    const { data } = await supabase.from('hierarchy_nodes').insert({ user_id: user!.id, name, level: 'category', parent_id: areaId, color: cColor }).select().single()
    if (data) { onNodesChanged([...nodes, data]); pickCategory(data.id) }
  }

  const areaMatches = areas.filter(a => a.name.toLowerCase().includes(aQuery.toLowerCase()))
  const catMatches = categories.filter(c => c.parent_id === areaId && c.name.toLowerCase().includes(cQuery.toLowerCase()))

  return (
    <div>
      {/* AREA */}
      <FieldHeading label="Area" settingsTab="Categories" />
      <div style={{ marginBottom: 14 }}>
        {aCreating ? (
          <div style={createBox}>
            <input autoFocus value={aName} onChange={e => setAName(e.target.value)} placeholder="Area name" style={inputStyle} />
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button onClick={createArea} disabled={!aName.trim()} style={saveBtn}>Save</button>
              <button onClick={() => { setACreating(false); setAName('') }} style={cancelBtn}>Cancel</button>
            </div>
          </div>
        ) : selectedArea && !aOpen ? (
          <button onClick={() => setAOpen(true)} style={selectedBox}>
            <span style={{ fontSize: 13, fontWeight: 500, color: '#111' }}>{selectedArea.name}</span>
            <span style={{ fontSize: 11, color: '#999' }}>change</span>
          </button>
        ) : (
          <div>
            <input autoFocus value={aQuery} onChange={e => { setAQuery(e.target.value); setAOpen(true) }} onFocus={() => setAOpen(true)} placeholder="Type an area…" style={inputStyle} />
            {aOpen && (
              <div style={listBox}>
                {areaMatches.map(a => (
                  <button key={a.id} onClick={() => pickArea(a.id)} style={optionRow}>
                    <span style={{ fontSize: 13, color: '#111' }}>{a.name}</span>
                  </button>
                ))}
                {areaMatches.length === 0 && <div style={emptyRow}>No matches</div>}
                <button onClick={() => { setACreating(true); setAName(aQuery) }} style={{ ...optionRow, color: '#2563eb', fontWeight: 600, borderTop: '1px solid #f0f0f0' }}>
                  + New area{aQuery ? ` “${aQuery}”` : ''}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CATEGORY */}
      <FieldHeading label="Category" settingsTab="Categories" />
      {!areaId ? (
        <div style={{ fontSize: 12, color: '#999', padding: '9px 12px', border: '1px dashed #e4e4e7', borderRadius: 10 }}>
          Select an area first
        </div>
      ) : cCreating ? (
        <div style={{ ...createBox, background: cColor + '14', border: `1px solid ${cColor}40` }}>
          <input autoFocus value={cName} onChange={e => { setCName(e.target.value); setCDup(null) }} placeholder="Category name" style={inputStyle} />
          <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
            {COLORS.map(c => (
              <button key={c} onClick={() => setCColor(c)} style={{ width: 22, height: 22, borderRadius: 5, background: c, border: 'none', cursor: 'pointer', outline: cColor === c ? `2px solid ${c}` : 'none', outlineOffset: 2 }} />
            ))}
          </div>
          {cDup && <p style={dupStyle}>You already have “{cDup}”. Click Save again to add anyway.</p>}
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button onClick={createCategory} disabled={!cName.trim()} style={saveBtn}>Save</button>
            <button onClick={() => { setCCreating(false); setCName(''); setCDup(null) }} style={cancelBtn}>Cancel</button>
          </div>
        </div>
      ) : selectedCat && !cOpen ? (
        <button onClick={() => setCOpen(true)} style={{ ...selectedBox, borderColor: selectedCat.color ?? '#e4e4e7' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: selectedCat.color ?? '#999' }} />
            <span style={{ fontSize: 13, fontWeight: 500, color: '#111' }}>{selectedCat.name}</span>
          </span>
          <span style={{ fontSize: 11, color: '#999' }}>change</span>
        </button>
      ) : (
        <div>
          <input autoFocus value={cQuery} onChange={e => { setCQuery(e.target.value); setCOpen(true) }} onFocus={() => setCOpen(true)} placeholder="Type a category…" style={inputStyle} />
          {cOpen && (
            <div style={listBox}>
              {catMatches.map(c => (
                <button key={c.id} onClick={() => pickCategory(c.id)} style={optionRow}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 9, height: 9, borderRadius: 3, background: c.color ?? '#999' }} />
                    <span style={{ fontSize: 13, color: '#111' }}>{c.name}</span>
                  </span>
                </button>
              ))}
              {catMatches.length === 0 && <div style={emptyRow}>No matches in this area</div>}
              <button onClick={() => { setCCreating(true); setCName(cQuery) }} style={{ ...optionRow, color: '#2563eb', fontWeight: 600, borderTop: '1px solid #f0f0f0' }}>
                + New category{cQuery ? ` “${cQuery}”` : ''}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

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
