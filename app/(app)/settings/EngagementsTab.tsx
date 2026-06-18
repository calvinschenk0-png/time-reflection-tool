'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, SectionHeading, PrimaryButton, SecondaryButton, DangerButton, Input, ColorDot, Divider } from '@/components/ui'

type Node = {
  id: string
  name: string
  level: 'engagement' | 'workstream' | 'deliverable'
  parent_id: string | null
  engagement_type: string | null
  charge_code: string | null
  color: string | null
  is_archived: boolean
}

const ENGAGEMENT_TYPES = ['project', 'internal_initiative', 'coaching', 'training', 'pto', 'travel', 'other']
const COLORS = ['#2563eb', '#7c3aed', '#16a34a', '#d97706', '#dc2626', '#0891b2', '#be185d', '#059669']

export default function EngagementsTab({ initialEngagements }: { initialEngagements: Node[] }) {
  const supabase = createClient()
  const [nodes, setNodes] = useState<Node[]>(initialEngagements)
  const [adding, setAdding] = useState<null | { level: 'engagement' | 'workstream' | 'deliverable'; parentId: string | null }>(null)
  const [form, setForm] = useState({ name: '', engagement_type: 'project', color: COLORS[0], charge_code: '' })
  const [saving, setSaving] = useState(false)

  const engagements = nodes.filter(n => n.level === 'engagement' && !n.is_archived)

  function workstreamsFor(engagementId: string) {
    return nodes.filter(n => n.level === 'workstream' && n.parent_id === engagementId && !n.is_archived)
  }

  function deliverablesFor(workstreamId: string) {
    return nodes.filter(n => n.level === 'deliverable' && n.parent_id === workstreamId && !n.is_archived)
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
    if (adding!.level === 'engagement') {
      payload.engagement_type = form.engagement_type
      payload.color = form.color
      payload.charge_code = form.charge_code || null
    }

    const { data } = await supabase.from('hierarchy_nodes').insert(payload).select().single()
    if (data) setNodes(n => [...n, data])
    setAdding(null)
    setForm({ name: '', engagement_type: 'project', color: COLORS[0], charge_code: '' })
    setSaving(false)
  }

  async function archive(id: string) {
    await supabase.from('hierarchy_nodes').update({ is_archived: true }).eq('id', id)
    setNodes(n => n.map(node => node.id === id ? { ...node, is_archived: true } : node))
  }

  // Find parent engagement color for a workstream/deliverable
  function colorFor(node: Node): string {
    if (node.level === 'engagement') return node.color ?? '#999'
    const parent = nodes.find(n => n.id === node.parent_id)
    if (!parent) return '#999'
    if (parent.level === 'engagement') return parent.color ?? '#999'
    return colorFor(parent)
  }

  return (
    <div>
      {engagements.length === 0 && !adding && (
        <Card>
          <p style={{ color: '#999', fontSize: 13, marginBottom: 16 }}>
            No engagements yet. Add your first one — an engagement is a top-level project or initiative (e.g. "Horizon", "Internal Ops", "Training").
          </p>
          <PrimaryButton onClick={() => setAdding({ level: 'engagement', parentId: null })}>
            + Add engagement
          </PrimaryButton>
        </Card>
      )}

      {engagements.map(eng => (
        <Card key={eng.id}>
          {/* Engagement header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <ColorDot color={eng.color ?? '#999'} />
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 600, color: '#111', flex: 1 }}>{eng.name}</span>
            <span style={{ fontSize: 11, color: '#999', background: '#e9e9eb', borderRadius: 6, padding: '2px 7px' }}>{eng.engagement_type?.replace('_', ' ')}</span>
            {eng.charge_code && <span style={{ fontSize: 11, color: '#999' }}>{eng.charge_code}</span>}
            <DangerButton onClick={() => archive(eng.id)}>Archive</DangerButton>
          </div>

          {/* Workstreams */}
          <div style={{ paddingLeft: 20 }}>
            {workstreamsFor(eng.id).map(ws => (
              <div key={ws.id}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0' }}>
                  <div style={{ width: 2, height: 16, borderRadius: 99, background: eng.color ?? '#ccc', flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: 500, color: '#111', flex: 1 }}>{ws.name}</span>
                  <DangerButton onClick={() => archive(ws.id)}>Archive</DangerButton>
                </div>

                {/* Deliverables */}
                <div style={{ paddingLeft: 16 }}>
                  {deliverablesFor(ws.id).map(del => (
                    <div key={del.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0' }}>
                      <div style={{ width: 4, height: 4, borderRadius: 99, background: '#ccc', flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: '#555', flex: 1 }}>{del.name}</span>
                      <DangerButton onClick={() => archive(del.id)}>Archive</DangerButton>
                    </div>
                  ))}
                  <button
                    onClick={() => setAdding({ level: 'deliverable', parentId: ws.id })}
                    style={{ fontSize: 11, color: '#999', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0' }}
                  >
                    + Add deliverable
                  </button>
                </div>
                <Divider />
              </div>
            ))}
            <button
              onClick={() => setAdding({ level: 'workstream', parentId: eng.id })}
              style={{ fontSize: 12, color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', fontWeight: 500 }}
            >
              + Add workstream
            </button>
          </div>
        </Card>
      ))}

      {/* Add form */}
      {adding && (
        <Card style={{ border: '2px solid #2563eb' }}>
          <SectionHeading>
            New {adding.level}
            {adding.level === 'workstream' && ` under ${nodes.find(n => n.id === adding.parentId)?.name}`}
            {adding.level === 'deliverable' && ` under ${nodes.find(n => n.id === adding.parentId)?.name}`}
          </SectionHeading>
          <Input
            label="Name"
            value={form.name}
            onChange={v => setForm(f => ({ ...f, name: v }))}
            placeholder={adding.level === 'engagement' ? 'e.g. Horizon' : adding.level === 'workstream' ? 'e.g. Executive PMO' : 'e.g. SteerCo Deck'}
          />

          {adding.level === 'engagement' && (
            <>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, color: '#666', marginBottom: 6, fontWeight: 500 }}>Type</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {ENGAGEMENT_TYPES.map(t => (
                    <button
                      key={t}
                      onClick={() => setForm(f => ({ ...f, engagement_type: t }))}
                      style={{
                        padding: '5px 10px', fontSize: 12, borderRadius: 8, cursor: 'pointer',
                        background: form.engagement_type === t ? '#111' : '#e9e9eb',
                        color: form.engagement_type === t ? '#fff' : '#555',
                        border: 'none', fontWeight: form.engagement_type === t ? 600 : 400,
                      }}
                    >
                      {t.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, color: '#666', marginBottom: 6, fontWeight: 500 }}>Colour</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => setForm(f => ({ ...f, color: c }))}
                      style={{
                        width: 24, height: 24, borderRadius: 6, background: c, border: 'none', cursor: 'pointer',
                        outline: form.color === c ? `3px solid ${c}` : 'none',
                        outlineOffset: 2,
                      }}
                    />
                  ))}
                </div>
              </div>

              <Input
                label="Charge code (optional)"
                value={form.charge_code}
                onChange={v => setForm(f => ({ ...f, charge_code: v }))}
                placeholder="e.g. HZN-001"
              />
            </>
          )}

          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <PrimaryButton onClick={save} disabled={saving || !form.name.trim()}>
              {saving ? 'Saving…' : 'Save'}
            </PrimaryButton>
            <SecondaryButton onClick={() => { setAdding(null); setForm({ name: '', engagement_type: 'project', color: COLORS[0], charge_code: '' }) }}>
              Cancel
            </SecondaryButton>
          </div>
        </Card>
      )}

      {!adding && engagements.length > 0 && (
        <PrimaryButton onClick={() => setAdding({ level: 'engagement', parentId: null })} style={{ width: '100%' }}>
          + Add engagement
        </PrimaryButton>
      )}
    </div>
  )
}
