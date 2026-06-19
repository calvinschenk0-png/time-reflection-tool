'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { timeToMinutes, minutesToTime, shiftDate, weekStartOf, todayStr } from '@/lib/time'
import { Node, Contact, Entry } from './types'

export type LogDayProps = {
  date: string
  weekStart: string
  settings: any
  nodes: Node[]
  contacts: Contact[]
  initialEntries: any[]
  initialEntryContacts: { entry_id: string; contact_id: string }[]
}

export function useLogDay({ date, weekStart, settings, nodes, contacts, initialEntries, initialEntryContacts }: LogDayProps) {
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
  const [allContacts, setAllContacts] = useState<Contact[]>(contacts)

  const expectedMinutes = settings?.expected_workday_minutes ?? 480
  const selected = entries.find(e => e.id === selectedId) ?? null

  // The 7 dates of the visible week
  const weekDates = Array.from({ length: 7 }, (_, i) => shiftDate(weekStart, i))

  function entriesForDay(d: string) {
    return entries.filter(e => e.entry_date === d)
  }

  // Add a block to a given day, starting after that day's last block
  async function addEntry(targetDate: string) {
    const dayEntries = entriesForDay(targetDate).sort((a, b) => timeToMinutes(a.end_time) - timeToMinutes(b.end_time))
    const lastEnd = dayEntries.length ? timeToMinutes(dayEntries[dayEntries.length - 1].end_time) : 9 * 60
    const start = Math.min(lastEnd, 24 * 60 - 30)
    const end = Math.min(start + 30, 24 * 60)

    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase.from('time_entries').insert({
      user_id: user!.id,
      entry_date: targetDate,
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

  // Commit a drag: new time and possibly a new day
  function commitDrag(id: string, startMin: number, endMin: number, newDate: string) {
    updateEntry(id, { start_time: minutesToTime(startMin), end_time: minutesToTime(endMin), entry_date: newDate })
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

  function goToWeek(newWeekStart: string) {
    setSelectedId(null)
    router.push(`/log?date=${newWeekStart}`)
  }

  function goToDate(newDate: string) {
    setSelectedId(null)
    router.push(`/log?date=${newDate}`)
  }

  // Which day a desktop "+ Add entry" should target: today if it's in view, else the week start
  const defaultDay = weekDates.includes(todayStr()) ? todayStr() : weekStart

  return {
    date, weekStart, weekDates, defaultDay, expectedMinutes,
    contacts: allContacts, setAllContacts,
    entries, entriesForDay, selectedId, setSelectedId, allNodes, setAllNodes, selected,
    addEntry, updateEntry, commitDrag, deleteEntry, toggleContact,
    goToWeek, goToDate,
  }
}

export type LogDayState = ReturnType<typeof useLogDay>
