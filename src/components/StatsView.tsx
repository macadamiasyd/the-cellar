'use client'

import { useMemo } from 'react'
import type { Wine } from '@/lib/types'
import { getDrinkStatus } from '@/lib/types'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts'

function count<T>(arr: T[], key: (item: T) => string | null | undefined, top = 12) {
  const map: Record<string, number> = {}
  for (const item of arr) {
    const k = key(item) ?? 'Unknown'
    map[k] = (map[k] ?? 0) + 1
  }
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, top)
    .map(([name, value]) => ({ name, value }))
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl p-4 flex flex-col" style={{ background: 'var(--parchment)', border: '1px solid var(--border)' }}>
      <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>{label}</span>
      <span className="text-3xl font-bold mt-1" style={{ color: 'var(--wine)' }}>{value}</span>
      {sub && <span className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>{sub}</span>}
    </div>
  )
}

function Chart({ data, title, color = 'var(--wine)' }: { data: { name: string; value: number }[]; title: string; color?: string }) {
  return (
    <div className="rounded-xl p-4" style={{ background: 'var(--parchment)', border: '1px solid var(--border)' }}>
      <h3 className="font-semibold mb-3 text-sm" style={{ color: 'var(--ink)' }}>{title}</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16, top: 0, bottom: 0 }}>
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11, fill: 'var(--muted)' }} />
          <Tooltip
            contentStyle={{ background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
            itemStyle={{ color: 'var(--ink)' }}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {data.map((_, i) => <Cell key={i} fill={i === 0 ? 'var(--wine)' : i === 1 ? 'var(--wine-light)' : 'var(--wine-pale)'} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function VintageChart({ wines }: { wines: Wine[] }) {
  const data = useMemo(() => {
    const map: Record<number, number> = {}
    for (const w of wines) {
      map[w.vintage] = (map[w.vintage] ?? 0) + w.quantity
    }
    return Object.entries(map)
      .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
      .map(([name, value]) => ({ name, value }))
  }, [wines])

  return (
    <div className="rounded-xl p-4" style={{ background: 'var(--parchment)', border: '1px solid var(--border)' }}>
      <h3 className="font-semibold mb-3 text-sm" style={{ color: 'var(--ink)' }}>Bottles by Vintage</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ left: 0, right: 8, top: 0, bottom: 8 }}>
          <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--muted)' }} interval={2} angle={-45} textAnchor="end" height={40} />
          <YAxis hide />
          <Tooltip
            contentStyle={{ background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
          />
          <Bar dataKey="value" fill="var(--wine)" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default function StatsView({ wines }: { wines: Wine[] }) {
  const totalBottles = wines.reduce((s, w) => s + w.quantity, 0)
  const totalValue = wines.reduce((s, w) => s + ((w.price ?? 0) * w.quantity), 0)
  const drinkNow = wines.filter(w => getDrinkStatus(w) === 'now').reduce((s, w) => s + w.quantity, 0)
  const avgPrice = wines.filter(w => w.price).reduce((s, w, _, a) => s + w.price! / a.length, 0)

  const grapeData = useMemo(() => count(wines, w => w.grape?.split(',')[0].trim()), [wines])
  const regionData = useMemo(() => count(wines, w => w.region), [wines])
  const producerData = useMemo(() => count(wines, w => w.producer, 10), [wines])
  const typeData = useMemo(() => count(wines, w => w.type), [wines])
  const storageData = useMemo(() => count(wines, w => w.storage_location), [wines])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Wines" value={wines.length} />
        <StatCard label="Bottles" value={totalBottles} />
        <StatCard label="Est. Value" value={`$${totalValue.toLocaleString()}`} sub="AUD" />
        <StatCard label="Drink Now" value={drinkNow} sub="bottles at peak" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Avg Price" value={`$${Math.round(avgPrice)}`} sub="per bottle" />
        <StatCard label="Rated 5★" value={wines.filter(w => w.rating === 5).reduce((s, w) => s + w.quantity, 0)} sub="bottles" />
        <StatCard label="Producers" value={new Set(wines.map(w => w.producer)).size} />
        <StatCard label="Regions" value={new Set(wines.map(w => w.region).filter(Boolean)).size} />
      </div>
      <VintageChart wines={wines} />
      <div className="grid lg:grid-cols-2 gap-4">
        <Chart data={producerData} title="Top Producers (wines)" />
        <Chart data={grapeData} title="Grape Varieties" color="var(--gold)" />
        <Chart data={regionData} title="Regions" />
        <Chart data={typeData} title="Wine Types" />
        <Chart data={storageData} title="Storage Locations" />
      </div>
    </div>
  )
}
