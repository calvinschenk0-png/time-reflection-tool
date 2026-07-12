'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, SectionHeading, PrimaryButton, SecondaryButton, DangerButton, Input, ColorDot, Divider } from '@/components/ui'
import { seedDefaultCategories } from '@/lib/defaultCategories'

type Node = {
  id: string
  name: string
  level: 'area' | 'category'
  parent_id: string | null
  color: string | null
  is_archived: boolean
}

const COLORS = ['#2563eb', '#7c3aed', '#16a34a', '#d97706', '#dc2626', '#0891b2', '#be185d', '#059669']

export default function CategoriesTab({ initialNodes }: { initialNodes: Node[] }) {
  const supabase = createClient()
  const [nodes, setNodes] = useState<Node[]>(initialNodes)
  const [adding, setAdding] = useState<null | { level: 'area' | 'category'; parentId: string | null }>(null)
  const [form, setForm] = useState({ name: '', color: COLORS[0] })
  const [saving, setSaving] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [showArchived, setShowArchived] = useState(false)

  const areas = nodes.filter(n => n.level === 'area' && !n.is_archived)
  const archived = nodes.filter(n => n.is_archived)

  function categoriesFor(areaId: string) {
    return nodes.filter(n => n.level === 'category' && n.parent_id === areaId && !n.is_archived)
  }

  function areaName(id: string | null) {
    return nodes.find(n => n.id === id)?.name ?? 'a deleted area'
  }

  async function save() {
    if (!form.name.trim()) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()

    const payload: any = {
      user_id: user!.id,
      name: form.name.trim(),
      level: adding!.level,
      parent_id: adding!.parentId,
    }
    if (adding!.level === 'category') {
      payload.color = form.color
    }

    const { data } = await supabase.from('hierarchy_nodes').insert(payload).select().single()
    if (data) setNodes(n => [...n, data])
    setAdding(null)
    setForm({ name: '', color: COLORS[0] })
    setSaving(false)
  }

  async function archive(id: string) {
    await supabase.from('hierarchy_nodes').update({ is_archived: true }).eq('id', id)
    setNodes(n => n.map(node => node.id === id ? { ...node, is_archived: true } : node))
  }

  async function restore(id: string) {
    await supabase.from('hierarchy_nodes').update({ is_archived: false }).eq('id', id)
    setNodes(n => n.map(node => node.id === id ? { ...node, is_archived: false } : node))
  }

  async function hardDelete(node: Node) {
    const label = node.level === 'area' ? 'area (and any categories inside it)' : 'category'
    if (!confirm(`Permanently delete this ${label}? This cannot be undone.`)) return

    const { error } = await supabase.from('hierarchy_nodes').delete().eq('id', node.id)

    if (error) {
      // The database blocks deletion when logged time still references this node.
      alert("Can't delete — this category has logged time against it. Archive it instead so the history stays intact.")
      return
    }

    // Remove the node (and, for an area, its now-cascade-deleted categories) from the UI
    setNodes(n => n.filter(x => x.id !== node.id && x.parent_id !== node.id))
  }

  async function restoreDefaults() {
    setRestoring(true)
    const { data: { user } } = await supabase.auth.getUser()
    await seedDefaultCategories(supabase, user!.id)
    const { data } = await supabase.from('hierarchy_nodes').select('*').eq('user_id', user!.id).order('created_at')
    setNodes(data ?? [])
    setRestoring(false)
  }

  function cancel() {
    setAdding(null)
    setForm({ name: '', color: COLORS[0] })
  }

  return (
    <div>
      <p style={{ color: '#666', fontSize: 12, marginBottom: 16, lineHeight: 1.5 }}>
        These are starting points, not fixed categories. Rename, delete, or add your own to fit how you actually spend your time.
      </p>

      {areas.length === 0 && !adding && (
        <Card>
          <p style={{ color: '#999', fontSize: 13, marginBottom: 16 }}>
            No areas yet. An area is the highest level of your life — your broadest, top-level category, like Work, Health, or Family.
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <PrimaryButton onClick={() => setAdding({ level: 'area', parentId: null })}>
              + Add area
            </PrimaryButton>
            <SecondaryButton onClick={restoreDefaults} disabled={restoring}>
              {restoring ? 'Restoring…' : 'Restore defaults'}
            </SecondaryButton>
          </div>
        </Card>
      )}

      {areas.map(area => {
        const addingHere = adding?.level === 'category' && adding.parentId === area.id
        return (
          <Card key={area.id}>
            {/* Area header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 600, color: '#111', flex: 1 }}>
                {area.name}
              </span>
              <DangerButton onClick={() => archive(area.id)}>Archive</DangerButton>
            </div>

            {/* Categories */}
            <div style={{ paddingLeft: 20 }}>
              {categoriesFor(area.id).map((cat, i, arr) => (
                <div key={cat.id}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0' }}>
                    <ColorDot color={cat.color ?? '#ccc'} />
                    <span style={{ fontSize: 13, fontWeight: 500, color: '#111', flex: 1 }}>{cat.name}</span>
                    <DangerButton onClick={() => archive(cat.id)}>Archive</DangerButton>
                  </div>
                  {i < arr.length - 1 && <Divider />}
                </div>
              ))}

              {addingHere ? (
                /* Inline category form — nested inside the area card, tinted by selected color */
                <div style={{
                  marginTop: 12,
                  background: form.color + '14',
                  border: `1px solid ${form.color}40`,
                  borderRadius: 12,
                  padding: 16,
                }}>
                  <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 600, color: '#111', marginBottom: 6 }}>
                    New category
                  </p>
                  <p style={{ color: '#666', fontSize: 12, marginBottom: 12, lineHeight: 1.5 }}>
                    Categories are sub-groups within an area. Use them to track how much time you spend on the different parts of a broader area.
                  </p>
                  <Input
                    label="Category name"
                    value={form.name}
                    onChange={v => setForm(f => ({ ...f, name: v }))}
                    placeholder="e.g. Exercise, Meetings, Family time…"
                  />
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontSize: 12, color: '#666', marginBottom: 8, fontWeight: 500 }}>
                      Color (shown on the calendar)
                    </label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {COLORS.map(c => (
                        <button
                          key={c}
                          onClick={() => setForm(f => ({ ...f, color: c }))}
                          style={{
                            width: 26, height: 26, borderRadius: 6, background: c,
                            border: 'none', cursor: 'pointer',
                            outline: form.color === c ? `3px solid ${c}` : 'none',
                            outlineOffset: 2,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <PrimaryButton onClick={save} disabled={saving || !form.name.trim()}>
                      {saving ? 'Saving…' : 'Save'}
                    </PrimaryButton>
                    <SecondaryButton onClick={cancel}>Cancel</SecondaryButton>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setAdding({ level: 'category', parentId: area.id })}
                  style={{ fontSize: 12, color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 0', fontWeight: 500 }}
                >
                  + Add category
                </button>
              )}
            </div>
          </Card>
        )
      })}

      {/* New area form — its own card */}
      {adding?.level === 'area' && (
        <Card style={{ background: '#eef3ff' }}>
          <SectionHeading>New area</SectionHeading>
          <p style={{ color: '#666', fontSize: 12, marginBottom: 12, lineHeight: 1.5 }}>
            An area is the highest level of your life — your broadest, top-level category. Think Work, Health, Relationships, or Home.
          </p>
          <Input
            label="Area name"
            value={form.name}
            onChange={v => setForm(f => ({ ...f, name: v }))}
            placeholder="e.g. Work, Health & Fitness, Relationships…"
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <PrimaryButton onClick={save} disabled={saving || !form.name.trim()}>
              {saving ? 'Saving…' : 'Save'}
            </PrimaryButton>
            <SecondaryButton onClick={cancel}>Cancel</SecondaryButton>
          </div>
        </Card>
      )}

      {adding?.level !== 'area' && areas.length > 0 && (
        <div style={{ display: 'flex', gap: 8 }}>
          <PrimaryButton onClick={() => setAdding({ level: 'area', parentId: null })} style={{ flex: 1 }}>
            + Add area
          </PrimaryButton>
          <SecondaryButton onClick={restoreDefaults} disabled={restoring}>
            {restoring ? 'Restoring…' : 'Restore defaults'}
          </SecondaryButton>
        </div>
      )}

      {/* Archived section */}
      {archived.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <button
            onClick={() => setShowArchived(s => !s)}
            style={{ fontSize: 12, color: '#999', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', fontWeight: 500 }}
          >
            {showArchived ? '▾' : '▸'} Archived ({archived.length})
          </button>

          {showArchived && (
            <Card style={{ marginTop: 8 }}>
              <p style={{ fontSize: 12, color: '#999', marginBottom: 12 }}>
                Archived items are hidden from logging but keep their history. Restore one to use it again.
              </p>
              {archived.map((node, i) => (
                <div
                  key={node.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0',
                    borderBottom: i < archived.length - 1 ? '1px solid #e4e4e7' : 'none',
                  }}
                >
                  {node.level === 'category' && <ColorDot color={node.color ?? '#ccc'} />}
                  <span style={{ fontSize: 13, color: '#666', flex: 1 }}>
                    {node.name}
                    <span style={{ fontSize: 11, color: '#bbb', marginLeft: 8 }}>
                      {node.level === 'area' ? 'Area' : `Category · ${areaName(node.parent_id)}`}
                    </span>
                  </span>
                  <button
                    onClick={() => restore(node.id)}
                    style={{ fontSize: 12, color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
                  >
                    Restore
                  </button>
                  <button
                    onClick={() => hardDelete(node)}
                    style={{ fontSize: 12, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
