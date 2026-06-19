'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, SectionHeading, PrimaryButton, SecondaryButton, DangerButton, Input, ColorDot, Divider } from '@/components/ui'

type Node = {
  id: string
  name: string
  level: 'project' | 'workstream' | 'deliverable'
  parent_id: string | null
  color: string | null
  is_archived: boolean
}

const COLORS = ['#2563eb', '#7c3aed', '#16a34a', '#d97706', '#dc2626', '#0891b2', '#be185d', '#059669']

export default function CategoriesTab({ initialNodes }: { initialNodes: Node[] }) {
  const supabase = createClient()
  const [nodes, setNodes] = useState<Node[]>(initialNodes)
  const [adding, setAdding] = useState<null | { level: 'project' | 'workstream'; parentId: string | null }>(null)
  const [form, setForm] = useState({ name: '', color: COLORS[0] })
  const [saving, setSaving] = useState(false)
  const [showArchived, setShowArchived] = useState(false)

  const projects = nodes.filter(n => n.level === 'project' && !n.is_archived)
  const archived = nodes.filter(n => n.is_archived)

  function workstreamsFor(projectId: string) {
    return nodes.filter(n => n.level === 'workstream' && n.parent_id === projectId && !n.is_archived)
  }

  function projectName(id: string | null) {
    return nodes.find(n => n.id === id)?.name ?? 'a deleted project'
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
    if (adding!.level === 'workstream') {
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

  function cancel() {
    setAdding(null)
    setForm({ name: '', color: COLORS[0] })
  }

  return (
    <div>
      {projects.length === 0 && !adding && (
        <Card>
          <p style={{ color: '#999', fontSize: 13, marginBottom: 16 }}>
            No projects yet. A project is the highest level of work — your broadest, top-level category, like a client engagement, an internal initiative, or a standing responsibility.
          </p>
          <PrimaryButton onClick={() => setAdding({ level: 'project', parentId: null })}>
            + Add project
          </PrimaryButton>
        </Card>
      )}

      {projects.map(project => {
        const addingHere = adding?.level === 'workstream' && adding.parentId === project.id
        return (
          <Card key={project.id}>
            {/* Project header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 600, color: '#111', flex: 1 }}>
                {project.name}
              </span>
              <DangerButton onClick={() => archive(project.id)}>Archive</DangerButton>
            </div>

            {/* Workstreams */}
            <div style={{ paddingLeft: 20 }}>
              {workstreamsFor(project.id).map((ws, i, arr) => (
                <div key={ws.id}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0' }}>
                    <ColorDot color={ws.color ?? '#ccc'} />
                    <span style={{ fontSize: 13, fontWeight: 500, color: '#111', flex: 1 }}>{ws.name}</span>
                    <DangerButton onClick={() => archive(ws.id)}>Archive</DangerButton>
                  </div>
                  {i < arr.length - 1 && <Divider />}
                </div>
              ))}

              {addingHere ? (
                /* Inline workstream form — nested inside the project card, tinted by selected color */
                <div style={{
                  marginTop: 12,
                  background: form.color + '14',
                  border: `1px solid ${form.color}40`,
                  borderRadius: 12,
                  padding: 16,
                }}>
                  <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 600, color: '#111', marginBottom: 6 }}>
                    New workstream
                  </p>
                  <p style={{ color: '#666', fontSize: 12, marginBottom: 12, lineHeight: 1.5 }}>
                    Workstreams are sub-categories within a project. Use them to track how much time you spend on the different parts of a larger project.
                  </p>
                  <Input
                    label="Workstream name"
                    value={form.name}
                    onChange={v => setForm(f => ({ ...f, name: v }))}
                    placeholder="e.g. Project management, change management, system readiness…"
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
                  onClick={() => setAdding({ level: 'workstream', parentId: project.id })}
                  style={{ fontSize: 12, color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 0', fontWeight: 500 }}
                >
                  + Add workstream
                </button>
              )}
            </div>
          </Card>
        )
      })}

      {/* New project form — its own card */}
      {adding?.level === 'project' && (
        <Card style={{ background: '#eef3ff' }}>
          <SectionHeading>New project</SectionHeading>
          <p style={{ color: '#666', fontSize: 12, marginBottom: 12, lineHeight: 1.5 }}>
            A project is the highest level of work — your broadest, top-level category. Think of a client engagement, an internal initiative, or a standing responsibility.
          </p>
          <Input
            label="Project name"
            value={form.name}
            onChange={v => setForm(f => ({ ...f, name: v }))}
            placeholder="e.g. Client A, Internal Initiatives, Admin…"
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <PrimaryButton onClick={save} disabled={saving || !form.name.trim()}>
              {saving ? 'Saving…' : 'Save'}
            </PrimaryButton>
            <SecondaryButton onClick={cancel}>Cancel</SecondaryButton>
          </div>
        </Card>
      )}

      {adding?.level !== 'project' && projects.length > 0 && (
        <PrimaryButton onClick={() => setAdding({ level: 'project', parentId: null })} style={{ width: '100%' }}>
          + Add project
        </PrimaryButton>
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
                  {node.level === 'workstream' && <ColorDot color={node.color ?? '#ccc'} />}
                  <span style={{ fontSize: 13, color: '#666', flex: 1 }}>
                    {node.name}
                    <span style={{ fontSize: 11, color: '#bbb', marginLeft: 8 }}>
                      {node.level === 'project' ? 'Project' : `Workstream · ${projectName(node.parent_id)}`}
                    </span>
                  </span>
                  <button
                    onClick={() => restore(node.id)}
                    style={{ fontSize: 12, color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
                  >
                    Restore
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
