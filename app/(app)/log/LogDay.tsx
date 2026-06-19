'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PageShell, PrimaryButton, SecondaryButton } from '@/components/ui'
import { formatDateLabel, shiftDate, timeToMinutes, minutesToTime, formatDuration } from '@/lib/time'
import { Node, Contact, Entry } from './types'
import Timeline from './Timeline'
import EntryEditor from './EntryEditor'

export default function LogDay({ date, settings, nodes, contacts, initialEntries, initialEntryContacts, loggedDay }: {
  date: string
  settings: any
  nodes: Node[]
  contacts: Contact[]
  initialEntries: any[]
  initialEntryContacts: { entry_id: string; contact_id: string }[]
  loggedDay: any
}) {
  const supabase = createClient()
  const router = useRouter()

  // Build initial entry state with contact links attached
  const [entries, setEntries] = useState<Entry[]>(() =>
    initialEntries.map(e => ({
      ...e,
      contactIds: initialEntryContacts.filter(ec => ec.entry_id === e.id).map(ec => ec.contact_id),
    }))
  )
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [allNodes, setAllNodes] = useState<Node[]>(nodes)
  const [finished, setFinished] = useState<boolean>(loggedDay?.status === 'finished')
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const update = () => setIsMobile(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  const expectedMinutes = settings?.expected_workday_minutes ?? 480
  const totalLogged = useMemo(() => entries.reduce((sum, e) => sum + e.duration_minutes, 0), [entries])

  const selected = entries.find(e => e.id === selectedId) ?? null

  // ── Add a new block, starting right after the last one ──
  async function addEntry() {
    const sorted = [...entries].sort((a, b) => timeToMinutes(a.end_time) - timeToMinutes(b.end_time))
    const lastEnd = sorted.length ? timeToMinutes(sorted[sorted.length - 1].end_time) : 9 * 60
    const start = Math.min(lastEnd, 24 * 60 - 30)
    const end = Math.min(start + 30, 24 * 60)

    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase.from('time_entries').insert({
      user_id: user!.id,
      entry_date: date,
      start_time: minutesToTime(start),
      end_time: minutesToTime(end),
      duration_minutes: end - start,
      hierarchy_node_id: null,
      note: null,
    }).select().single()

    if (error) {
      if (error.message.includes('null value') && error.message.includes('hierarchy_node_id')) {
        alert('Database needs an update before draft blocks can be saved. Please run migration 04 in Supabase, then try again.')
      } else {
        alert('Could not add entry: ' + error.message)
      }
      return
    }

    if (data) {
      const entry: Entry = { ...data, contactIds: [] }
      setEntries(es => [...es, entry])
      setSelectedId(entry.id)
    }
  }

  // ── Patch an entry both in state and DB ──
  async function updateEntry(id: string, patch: Partial<Entry>) {
    setEntries(es => es.map(e => e.id === id ? { ...e, ...patch } : e))

    const dbPatch: any = { ...patch }
    delete dbPatch.contactIds  // contacts handled separately
    if (patch.start_time || patch.end_time) {
      const e = entries.find(x => x.id === id)!
      const start = timeToMinutes(patch.start_time ?? e.start_time)
      const end = timeToMinutes(patch.end_time ?? e.end_time)
      dbPatch.duration_minutes = Math.max(0, end - start)
      setEntries(es => es.map(x => x.id === id ? { ...x, duration_minutes: dbPatch.duration_minutes } : x))
    }
    if (Object.keys(dbPatch).length) {
      await supabase.from('time_entries').update(dbPatch).eq('id', id)
    }
  }

  async function deleteEntry(id: string) {
    await supabase.from('time_entries').delete().eq('id', id)
    setEntries(es => es.filter(e => e.id !== id))
    if (selectedId === id) setSelectedId(null)
  }

  async function toggleContact(entryId: string, contactId: string) {
    const entry = entries.find(e => e.id === entryId)!
    const has = entry.contactIds.includes(contactId)
    if (has) {
      await supabase.from('entry_contacts').delete().eq('entry_id', entryId).eq('contact_id', contactId)
      setEntries(es => es.map(e => e.id === entryId ? { ...e, contactIds: e.contactIds.filter(c => c !== contactId) } : e))
    } else {
      await supabase.from('entry_contacts').insert({ entry_id: entryId, contact_id: contactId })
      setEntries(es => es.map(e => e.id === entryId ? { ...e, contactIds: [...e.contactIds, contactId] } : e))
    }
  }

  // ── Finish / reopen day ──
  const gapsAndDrafts = useMemo(() => {
    const drafts = entries.filter(e => !e.hierarchy_node_id).length
    const sorted = [...entries].sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time))
    let gaps = 0
    for (let i = 1; i < sorted.length; i++) {
      if (timeToMinutes(sorted[i].start_time) > timeToMinutes(sorted[i - 1].end_time)) gaps++
    }
    return { drafts, gaps }
  }, [entries])

  async function finishDay() {
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('logged_days').upsert(
      { user_id: user!.id, day_date: date, status: 'finished', finished_at: new Date().toISOString() },
      { onConflict: 'user_id,day_date' }
    )
    setFinished(true)
  }

  async function reopenDay() {
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('logged_days').upsert(
      { user_id: user!.id, day_date: date, status: 'in_progress', finished_at: null },
      { onConflict: 'user_id,day_date' }
    )
    setFinished(false)
  }

  function goToDate(newDate: string) {
    setSelectedId(null)
    router.push(`/log?date=${newDate}`)
  }

  return (
    <PageShell>
      {/* Date header with prev/next */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <button onClick={() => goToDate(shiftDate(date, -1))} style={navArrow}>‹</button>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 700, color: '#111' }}>
            {formatDateLabel(date)}
          </h1>
          <p style={{ fontSize: 12, color: '#999' }}>
            {formatDuration(totalLogged)} logged of {formatDuration(expectedMinutes)}
          </p>
        </div>
        <button onClick={() => goToDate(shiftDate(date, 1))} style={navArrow}>›</button>
      </div>

      {/* Split layout */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
        {/* Left: timeline */}
        <div>
          <Timeline
            entries={entries}
            nodes={allNodes}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
          <button onClick={addEntry} style={addBtn}>+ Add entry</button>
        </div>

        {/* Right: editor (desktop side panel) */}
        {!isMobile && (
          <div>
            {selected ? (
              <EntryEditor
                key={selected.id}
                entry={selected}
                nodes={allNodes}
                contacts={contacts}
                onUpdate={updateEntry}
                onDelete={deleteEntry}
                onToggleContact={toggleContact}
                onNodesChanged={setAllNodes}
              />
            ) : (
              <div style={{ background: '#f4f4f5', borderRadius: 20, padding: 24, color: '#999', fontSize: 13, textAlign: 'center' }}>
                Tap a block to edit it, or “+ Add entry” to start.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Finish day */}
      <div style={{ marginTop: 20 }}>
        {finished ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <span style={{ fontSize: 13, color: '#16a34a', fontWeight: 600 }}>✓ Day finished</span>
            <SecondaryButton onClick={reopenDay}>Reopen</SecondaryButton>
          </div>
        ) : (
          <div>
            {(gapsAndDrafts.gaps > 0 || gapsAndDrafts.drafts > 0) && (
              <p style={{ fontSize: 12, color: '#d97706', marginBottom: 8, textAlign: 'center' }}>
                {[
                  gapsAndDrafts.gaps > 0 ? `${gapsAndDrafts.gaps} gap${gapsAndDrafts.gaps > 1 ? 's' : ''}` : null,
                  gapsAndDrafts.drafts > 0 ? `${gapsAndDrafts.drafts} draft${gapsAndDrafts.drafts > 1 ? 's' : ''}` : null,
                ].filter(Boolean).join(' · ')} — you can still finish.
              </p>
            )}
            <PrimaryButton onClick={finishDay} style={{ width: '100%' }}>
              Finish logging day
            </PrimaryButton>
          </div>
        )}
      </div>

      {/* Mobile: slide-up sheet */}
      {isMobile && selected && (
        <>
          <div onClick={() => setSelectedId(null)} style={sheetBackdrop} />
          <div style={sheet}>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
              <div style={{ width: 36, height: 4, borderRadius: 99, background: '#ddd' }} />
            </div>
            <EntryEditor
              key={selected.id}
              entry={selected}
              nodes={allNodes}
              contacts={contacts}
              onUpdate={updateEntry}
              onDelete={(id) => { deleteEntry(id); setSelectedId(null) }}
              onToggleContact={toggleContact}
              onNodesChanged={setAllNodes}
            />
          </div>
        </>
      )}
    </PageShell>
  )
}

const navArrow: React.CSSProperties = {
  width: 36, height: 36, borderRadius: 99, border: '1px solid #e4e4e7',
  background: '#fff', color: '#666', fontSize: 18, cursor: 'pointer',
}

const addBtn: React.CSSProperties = {
  width: '100%', marginTop: 10, padding: '10px', borderRadius: 10,
  border: '1px dashed #c4c4c8', background: '#fff', color: '#2563eb',
  fontSize: 13, fontWeight: 600, cursor: 'pointer',
}

const sheetBackdrop: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 40,
}

const sheet: React.CSSProperties = {
  position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 50,
  background: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
  maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 -8px 30px rgba(0,0,0,0.15)',
  padding: '0 16px 24px',
}
