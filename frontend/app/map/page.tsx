'use client';
// frontend/app/map/page.tsx
// Route: http://localhost:3000/map
// ⚠️ ssr:false is REQUIRED — Leaflet needs window/document

import dynamic from 'next/dynamic';

const OceanMap = dynamic(() => import('@/components/OceanMap'), {
  ssr: false,
  loading: () => (
    <div style={{ height:'100vh', display:'flex', alignItems:'center',
                  justifyContent:'center', background:'#050e1a',
                  flexDirection:'column', gap:16,
                  fontFamily:"'IBM Plex Mono',monospace", color:'#3d6680' }}>
      <div style={{ fontSize:'3rem' }}>🌊</div>
      <div style={{ fontSize:'0.75rem', letterSpacing:'0.16em' }}>INITIALISING MAP…</div>
    </div>
  ),
});

export default function MapPage() {
  return <OceanMap />;
}