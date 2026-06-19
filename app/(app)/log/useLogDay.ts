'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { timeToMinutes, minutesToTime } from '@/lib/time'
import { Node, Contact, Entry } from './types'

export type LogDayProps = {
  date: string
  settings: any
  nodes: Node[]
  contacts: Contact[]
  initialEntries: any[]
  initialEntryContacts: { entry_id: string; contact_id: string }[]
  loggedDay: any
}

// All log-day state and actions live here, shared by the desktop and mobile views.
export function useLogDay({ date, settings, nodes, contacts, initialEntries, initialEntryContacts, loggedDay }: LogDayProps) {
  const supabase = createClient()
  const router = useRouter()

  const [entries, setEntries] = useState<Entry[]>(() =>
    initialEntries.map(e => ({
      ...e,
      contactIds: initialEntryContacts.filter(ec => ec.entry_id === e.id).map(ec => ec.contact_id),
    }))
  )
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [allNodes, setAllNodes] = useState<Node[]>(nodes)
  const [finished, setFinished] = useState<boolean>(loggedDay?.status === 'finished')

  const expectedMinutes = settings?.expected_workday_minutes ?? 480
  const totalLogged = useMemo(() => entries.reduce((sum, e) => sum + e.duration_minutes, 0), [entries])
  const selected = entries.find(e => e.id === selectedId) ?? null

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

  async function updateEntry(id: string, patch: Partial<Entry>) {
    setEntries(es => es.map(e => e.id === id ? { ...e, ...patch } : e))

    const dbPatch: any = { ...patch }
    delete dbPatch.contactIds
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

  function commitTimes(id: string, startMin: number, endMin: number) {
    updateEntry(id, { start_time: minutesToTime(startMin), end_time: minutesToTime(endMin) })
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

  return {
    date, contacts, expectedMinutes, totalLogged,
    entries, selectedId, setSelectedId, allNodes, setAllNodes,
    selected, finished, gapsAndDrafts,
    addEntry, updateEntry, commitTimes, deleteEntry, toggleContact,
    finishDay, reopenDay, goToDate,
  }
}

export type LogDayState = ReturnType<typeof useLogDay>
