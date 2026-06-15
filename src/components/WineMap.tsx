'use client'

import 'leaflet/dist/leaflet.css'
import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet.heat'
import type { MapRegion } from '@/lib/map-data'

function markerRadius(bottleCount: number): number {
  return Math.max(12, Math.min(40, 8 + Math.sqrt(bottleCount) * 5))
}

function makeIcon(region: MapRegion): L.DivIcon {
  const r = markerRadius(region.bottleCount)
  const d = Math.round(r * 2)
  const fontSize = r > 18 ? 13 : 11
  return L.divIcon({
    className: 'wine-marker',
    html: `<div style="width:${d}px;height:${d}px;border-radius:50%;background:rgba(107,26,42,0.8);border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:${fontSize}px;line-height:1;">${region.bottleCount}</div>`,
    iconSize: [d, d],
    iconAnchor: [r, r],
  })
}

function HeatLayer({ regions, max }: { regions: MapRegion[]; max: number }) {
  const map = useMap()
  useEffect(() => {
    const points: [number, number, number][] = regions.map(r => [r.lat, r.lng, r.bottleCount])
    const layer = L.heatLayer(points, {
      radius: 40,
      blur: 30,
      maxZoom: 8,
      max: max || 1,
      gradient: {
        0.2: '#EDE6D6',
        0.4: '#D4A853',
        0.6: '#C97080',
        0.8: '#8B2A3E',
        1.0: '#6B1A2A',
      },
    })
    layer.addTo(map)
    return () => {
      layer.remove()
    }
  }, [map, regions, max])
  return null
}

interface Props {
  regions: MapRegion[]
  center: [number, number]
  zoom: number
  onRegionClick: (region: MapRegion) => void
}

export default function WineMap({ regions, center, zoom, onRegionClick }: Props) {
  const max = regions.reduce((m, r) => Math.max(m, r.bottleCount), 0)
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      scrollWheelZoom
      style={{ height: '100%', width: '100%', background: 'var(--cream)' }}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
      />
      <HeatLayer regions={regions} max={max} />
      {regions.map(region => (
        <Marker
          key={`${region.lat},${region.lng}`}
          position={[region.lat, region.lng]}
          icon={makeIcon(region)}
          eventHandlers={{ click: () => onRegionClick(region) }}
        >
          <Tooltip direction="top" offset={[0, -6]}>
            {region.name} · {region.bottleCount} bottle{region.bottleCount === 1 ? '' : 's'}
          </Tooltip>
        </Marker>
      ))}
    </MapContainer>
  )
}
