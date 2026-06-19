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

  const projects = nodes.filter(n => n.level === 'project' && !n.is_archived)

  function workstreamsFor(projectId: string) {
    return nodes.filter(n => n.level === 'workstream' && n.parent_id === projectId && !n.is_archived)
  }

  function colorFor(node: Node): string {
    if (node.level === 'project') return node.color ?? '#999'
    const parent = nodes.find(n => n.id === node.parent_id)
    return parent?.color ?? '#999'
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
    if (adding!.level === 'project') {
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

  function cancel() {
    setAdding(null)
    setForm({ name: '', color: COLORS[0] })
  }

  return (
    <div>
      {projects.length === 0 && !adding && (
        <Card>
          <p style={{ color: '#999', fontSize: 13, marginBottom: 16 }}>
            No projects yet. A project is a primary category of work — something like a client engagement, an internal initiative, or a standing responsibility.
          </p>
          <PrimaryButton onClick={() => setAdding({ level: 'project', parentId: null })}>
            + Add project
          </PrimaryButton>
        </Card>
      )}

      {projects.map(project => (
        <Card key={project.id}>
          {/* Project header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <ColorDot color={project.color ?? '#999'} />
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
                  <div style={{ width: 2, height: 16, borderRadius: 99, background: project.color ?? '#ccc', flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: 500, color: '#111', flex: 1 }}>{ws.name}</span>
                  <DangerButton onClick={() => archive(ws.id)}>Archive</DangerButton>
                </div>
                {i < arr.length - 1 && <Divider />}
              </div>
            ))}

            <button
              onClick={() => setAdding({ level: 'workstream', parentId: project.id })}
              style={{ fontSize: 12, color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 0', fontWeight: 500 }}
            >
              + Add workstream
            </button>
          </div>
        </Card>
      ))}

      {/* Add form */}
      {adding && (
        <Card style={{ background: '#eef3ff' }}>
          <SectionHeading>
            {adding.level === 'project'
              ? 'New project'
              : `New workstream under "${nodes.find(n => n.id === adding.parentId)?.name}"`}
          </SectionHeading>

          <Input
            label={adding.level === 'project' ? 'Project name' : 'Workstream name'}
            value={form.name}
            onChange={v => setForm(f => ({ ...f, name: v }))}
            placeholder={adding.level === 'project' ? 'e.g. Client A, Internal Ops…' : 'e.g. Executive PMO, Training…'}
          />

          {adding.level === 'project' && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, color: '#666', marginBottom: 8, fontWeight: 500 }}>
                Color (used in charts)
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
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <PrimaryButton onClick={save} disabled={saving || !form.name.trim()}>
              {saving ? 'Saving…' : 'Save'}
            </PrimaryButton>
            <SecondaryButton onClick={cancel}>Cancel</SecondaryButton>
          </div>
        </Card>
      )}

      {!adding && projects.length > 0 && (
        <PrimaryButton onClick={() => setAdding({ level: 'project', parentId: null })} style={{ width: '100%' }}>
          + Add project
        </PrimaryButton>
      )}
    </div>
  )
}
