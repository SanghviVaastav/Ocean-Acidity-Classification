'use client';
// frontend/components/OceanMap.tsx
// npm install leaflet && npm install --save-dev @types/leaflet

import { useEffect, useRef, useState, useCallback } from 'react';

type Status = 'safe' | 'vulnerable' | 'critical';
interface Station { id:number;name:string;region:string;lat:number;lng:number;ph:number;temp:number;salinity:number;depth:number;trend:number;status:Status; }
interface Zone    { id:number;name:string;status:Status;ph:number;coords:[number,number][]; }
interface Ship    { id:number;name:string;density:'high'|'medium'|'low';coords:[number,number][]; }
interface MapData { stations:Station[];zones:Zone[];shipping_routes:Ship[]; }
interface Summary { total_stations:number;critical:number;vulnerable:number;safe:number;avg_ph:number;min_ph:number;max_ph:number; }

const API   = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
const COLOR: Record<Status,string> = { safe:'#00e676', vulnerable:'#ffd600', critical:'#ff1744' };
const EMOJI: Record<Status,string> = { safe:'🟢', vulnerable:'🟡', critical:'🔴' };

export default function OceanMap() {
  const mapEl   = useRef<HTMLDivElement>(null);
  const mapInst = useRef<any>(null);
  const lgs     = useRef<Record<string,any>>({});

  const [data,    setData]    = useState<MapData|null>(null);
  const [summary, setSummary] = useState<Summary|null>(null);
  const [loading, setLoading] = useState(true);
  const [apiErr,  setApiErr]  = useState<string|null>(null);
  const [sel,     setSel]     = useState<Station|null>(null);
  const [layers,  setLayers]  = useState({ zones:true, stations:true, shipping:true, heatmap:true });

  // ── Fetch from FastAPI ──────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/map-data`).then(r=>{ if(!r.ok) throw new Error(r.statusText); return r.json(); }),
      fetch(`${API}/api/summary`).then(r =>{ if(!r.ok) throw new Error(r.statusText); return r.json(); }),
    ])
    .then(([md,sm])=>{ setData(md); setSummary(sm); setLoading(false); })
    .catch(e=>{ setApiErr(`API unreachable — ${e.message}`); setLoading(false); });
  }, []);

  // ── Build Leaflet once data is ready ────────────────────────────
  useEffect(() => {
    if (!data || !mapEl.current || mapInst.current) return;
    import('leaflet').then(L => {
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl:      'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl:    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });
      const map = L.map(mapEl.current!,{ center:[38,-90], zoom:4, zoomControl:false });
      mapInst.current = map;
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{ attribution:'© OpenStreetMap', maxZoom:18 }).addTo(map);
      L.control.zoom({ position:'bottomleft' }).addTo(map);

      const lgZ=L.layerGroup().addTo(map), lgS=L.layerGroup().addTo(map);
      const lgR=L.layerGroup().addTo(map), lgH=L.layerGroup().addTo(map);
      lgs.current = { zones:lgZ, stations:lgS, shipping:lgR, heatmap:lgH };

      // Zones
      data.zones.forEach(z => {
        const c=COLOR[z.status];
        L.polygon(z.coords,{ color:c,weight:2,opacity:.9,fillColor:c,fillOpacity:.18,dashArray:z.status==='critical'?'6,4':undefined })
         .bindPopup(`<div style="font-family:monospace;color:#b8d4e8;background:#071525;padding:2px">
            <b style="color:${c}">${EMOJI[z.status]} ${z.name}</b><br/>
            Status: <b style="color:${c}">${z.status.toUpperCase()}</b><br/>
            Avg pH: <b>${z.ph.toFixed(2)}</b></div>`).addTo(lgZ);
        const ctr=L.polygon(z.coords).getBounds().getCenter();
        L.marker(ctr,{ icon:L.divIcon({ className:'', iconSize:[0,0],
          html:`<div style="font-size:10px;font-weight:700;color:${c};text-shadow:0 1px 4px #000;white-space:nowrap;pointer-events:none">
                ${EMOJI[z.status]} ${z.status.toUpperCase()}<br><span style="font-size:9px;opacity:.75">pH ${z.ph.toFixed(2)}</span></div>`,
        }), interactive:false }).addTo(lgZ);
      });

      // Stations
      data.stations.forEach(s => {
        const c=COLOR[s.status];
        L.circleMarker([s.lat,s.lng],{ radius:18,color:c,weight:1,opacity:.3,fillOpacity:0 }).addTo(lgS);
        const dot=L.circleMarker([s.lat,s.lng],{ radius:10,color:c,weight:2.5,fillColor:c,fillOpacity:.35 })
          .bindPopup(`<div style="font-family:monospace;color:#b8d4e8;min-width:200px">
            <b style="color:${c}">${EMOJI[s.status]} ${s.name}</b><br/>
            <hr style="border-color:#0d2035"/>
            pH: <b style="color:${c}">${s.ph.toFixed(2)}</b> &nbsp; Temp: ${s.temp}°C<br/>
            Salinity: ${s.salinity} PSU &nbsp; Depth: ${s.depth}m<br/>
            Trend: <b style="color:${s.trend>0.01?'#ff1744':s.trend<-0.01?'#00e676':'#888'}">
              ${s.trend>0.01?'▲ +':'▼ '}${Math.abs(s.trend).toFixed(2)}/yr</b><br/>
            <div style="margin-top:6px;padding:3px;text-align:center;background:${c}22;color:${c};font-weight:700">
              ${s.status.toUpperCase()}</div></div>`);
        dot.on('click',()=>setSel(s));
        dot.addTo(lgS);
        L.marker([s.lat,s.lng],{ icon:L.divIcon({ className:'', iconSize:[0,0],
          html:`<div style="font-size:10px;font-weight:700;color:${c};text-shadow:0 1px 4px #000;
                transform:translate(-50%,-28px);pointer-events:none;white-space:nowrap">${s.ph.toFixed(2)}</div>`,
        }), interactive:false }).addTo(lgS);
      });

      // Shipping
      data.shipping_routes.forEach(r => {
        const w=r.density==='high'?3:r.density==='medium'?2:1.5;
        const o=r.density==='high'?.85:r.density==='medium'?.55:.3;
        L.polyline(r.coords,{ color:'#ff9100',weight:w,opacity:o,dashArray:r.density==='low'?'4,6':undefined })
         .bindPopup(`<div style="font-family:monospace;color:#b8d4e8">
            <b style="color:#ff9100">🚢 ${r.name}</b><br/>Density: <b style="color:#ff9100">${r.density.toUpperCase()}</b></div>`)
         .addTo(lgR);
        if(r.density==='high'){
          const mid=r.coords[Math.floor(r.coords.length/2)];
          L.marker(mid,{ icon:L.divIcon({ className:'', iconSize:[0,0],
            html:`<div style="font-size:14px;transform:translate(-50%,-50%);filter:drop-shadow(0 0 4px rgba(255,145,0,.8));pointer-events:none">🚢</div>`,
          }), interactive:false }).addTo(lgR);
        }
      });

      // Heatmap
      data.stations.forEach(s=>{
        L.circle([s.lat,s.lng],{ radius:s.status==='critical'?80000:s.status==='vulnerable'?60000:50000,
          color:'transparent',fillColor:COLOR[s.status],fillOpacity:.07,interactive:false }).addTo(lgH);
      });

      map.fitBounds([[23,-130],[65,-60]]);
    });
    return ()=>{ mapInst.current?.remove(); mapInst.current=null; };
  }, [data]);

  // ── Layer visibility ────────────────────────────────────────────
  useEffect(()=>{
    const map=mapInst.current; if(!map) return;
    (Object.keys(layers) as (keyof typeof layers)[]).forEach(k=>{
      const lg=lgs.current[k]; if(!lg) return;
      layers[k]?(!map.hasLayer(lg)&&map.addLayer(lg)):(map.hasLayer(lg)&&map.removeLayer(lg));
    });
  },[layers]);

  const toggle=useCallback((k:keyof typeof layers)=>setLayers(p=>({...p,[k]:!p[k]})),[]);
  const flyTo=(s:Station)=>{ mapInst.current?.setView([s.lat,s.lng],8,{animate:true}); setSel(s); };

  return (
    <div style={{ display:'flex',flexDirection:'column',height:'100vh',background:'#050e1a',fontFamily:"'IBM Plex Mono',monospace",color:'#b8d4e8' }}>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"/>
      <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;700&family=Unbounded:wght@900&display=swap" rel="stylesheet"/>
      <style>{`.leaflet-tile{filter:brightness(.5) saturate(.35) hue-rotate(195deg)!important}.leaflet-container{background:#020810!important}.leaflet-popup-content-wrapper{background:rgba(7,21,37,.97)!important;border:1px solid #0d2035!important;border-radius:10px!important;color:#b8d4e8}.leaflet-popup-tip{background:rgba(7,21,37,.97)!important}.leaflet-popup-content{margin:12px 14px!important}@keyframes _b{0%,100%{opacity:1}50%{opacity:.2}}`}</style>

      {/* TOP BAR */}
      <header style={{ height:54,background:'rgba(5,14,26,.97)',borderBottom:'1px solid #0d2035',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 24px',flexShrink:0,zIndex:1000 }}>
        <span style={{ fontFamily:'Unbounded',fontSize:'1rem',fontWeight:900,color:'#00d4ff',textShadow:'0 0 20px rgba(0,212,255,.4)' }}>
          Ocean<span style={{ color:'#b8d4e8' }}>Acid</span>
          <span style={{ fontFamily:'inherit',fontSize:'0.56rem',color:'#3d6680',fontWeight:400,marginLeft:10 }}>COASTAL pH DASHBOARD</span>
        </span>
        {summary&&<div style={{ display:'flex',gap:24 }}>
          {([{v:summary.critical,l:'Critical',c:'#ff1744'},{v:summary.vulnerable,l:'Vulnerable',c:'#ffd600'},{v:summary.safe,l:'Safe',c:'#00e676'},{v:summary.avg_ph,l:'Avg pH',c:'#00d4ff'}] as {v:number,l:string,c:string}[]).map(x=>(
            <div key={x.l} style={{ textAlign:'center',lineHeight:1.2 }}>
              <div style={{ fontSize:'0.95rem',fontWeight:700,color:x.c }}>{x.v}</div>
              <div style={{ fontSize:'0.5rem',letterSpacing:'0.12em',color:'#3d6680',textTransform:'uppercase' }}>{x.l}</div>
            </div>
          ))}
        </div>}
        <div style={{ display:'flex',alignItems:'center',gap:6,background:'rgba(0,230,118,.08)',border:'1px solid rgba(0,230,118,.25)',borderRadius:20,padding:'4px 12px',fontSize:'0.6rem',letterSpacing:'0.14em',color:'#00e676' }}>
          <span style={{ width:7,height:7,borderRadius:'50%',background:'#00e676',display:'inline-block',animation:'_b 1.5s infinite' }}/>LIVE
        </div>
      </header>

      <div style={{ display:'flex',flex:1,overflow:'hidden' }}>
        {/* MAP */}
        <div style={{ flex:1,position:'relative' }}>
          {loading&&<div style={{ position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',background:'#050e1a',zIndex:999,flexDirection:'column',gap:14 }}><div style={{ fontSize:'2.5rem' }}>🌊</div><div style={{ fontSize:'0.75rem',letterSpacing:'0.16em',color:'#3d6680' }}>LOADING MAP DATA…</div></div>}
          {apiErr&&<div style={{ position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',background:'#050e1a',zIndex:999,flexDirection:'column',gap:12,padding:24 }}><div style={{ fontSize:'2rem' }}>⚠️</div><div style={{ color:'#ff1744',fontSize:'0.78rem',textAlign:'center',maxWidth:340 }}>{apiErr}</div><div style={{ fontSize:'0.62rem',color:'#3d6680' }}>Run: <code style={{ color:'#00d4ff' }}>uvicorn app:app --reload --port 8000</code></div></div>}
          <div ref={mapEl} style={{ width:'100%',height:'100%' }}/>
          {/* Layer buttons */}
          <div style={{ position:'absolute',top:12,left:12,zIndex:500,display:'flex',flexDirection:'column',gap:6 }}>
            {([{k:'zones',l:'🟢 Acidity Zones'},{k:'stations',l:'📍 Stations'},{k:'shipping',l:'🚢 Shipping'},{k:'heatmap',l:'🌡 Heatmap'}] as {k:keyof typeof layers,l:string}[]).map(b=>(
              <button key={b.k} onClick={()=>toggle(b.k)} style={{ background:layers[b.k]?'rgba(0,212,255,.12)':'rgba(5,14,26,.9)',border:`1px solid ${layers[b.k]?'#00d4ff':'#0d2035'}`,borderRadius:8,color:layers[b.k]?'#00d4ff':'#3d6680',fontFamily:"'IBM Plex Mono',monospace",fontSize:'0.65rem',padding:'7px 12px',cursor:'pointer',backdropFilter:'blur(8px)',whiteSpace:'nowrap',transition:'all .15s' }}>{b.l}</button>
            ))}
          </div>
        </div>

        {/* SIDEBAR */}
        <div style={{ width:285,background:'#071525',borderLeft:'1px solid #0d2035',display:'flex',flexDirection:'column',overflow:'hidden',flexShrink:0 }}>
          <div style={{ padding:'14px 18px 10px',borderBottom:'1px solid #0d2035' }}>
            <div style={{ fontSize:'0.55rem',letterSpacing:'0.18em',color:'#3d6680',textTransform:'uppercase',marginBottom:3 }}>Monitoring Stations</div>
            <div style={{ fontSize:'0.8rem',fontWeight:700 }}>Sorted by pH (critical first)</div>
          </div>
          <div style={{ flex:1,overflowY:'auto' }}>
            {(data?.stations??[]).sort((a,b)=>a.ph-b.ph).map(s=>{
              const c=COLOR[s.status], active=sel?.id===s.id;
              return(
                <div key={s.id} onClick={()=>flyTo(s)} style={{ display:'flex',alignItems:'center',gap:10,padding:'9px 18px',cursor:'pointer',borderLeft:`3px solid ${active?'#00d4ff':'transparent'}`,background:active?'rgba(0,212,255,.07)':'transparent',transition:'background .15s' }}>
                  <div style={{ width:44,height:32,borderRadius:6,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',background:`${c}22`,color:c,border:`1px solid ${c}44`,fontSize:'0.72rem',fontWeight:700 }}>{s.ph.toFixed(2)}</div>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ fontSize:'0.78rem',fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis' }}>{s.name}</div>
                    <div style={{ fontSize:'0.6rem',color:'#3d6680',marginTop:1 }}>{s.region} · {s.temp}°C</div>
                  </div>
                  <span>{EMOJI[s.status]}</span>
                </div>
              );
            })}
          </div>
          {sel&&(
            <div style={{ borderTop:'1px solid #0d2035',padding:'13px 18px',flexShrink:0 }}>
              <div style={{ fontSize:'0.55rem',letterSpacing:'0.12em',color:'#3d6680',textTransform:'uppercase',marginBottom:7 }}>Selected</div>
              <div style={{ fontSize:'0.85rem',fontWeight:700,color:COLOR[sel.status],marginBottom:8 }}>{EMOJI[sel.status]} {sel.name}</div>
              {([['pH',sel.ph.toFixed(2)],['Temp',`${sel.temp}°C`],['Salinity',`${sel.salinity} PSU`],['Depth',`${sel.depth}m`]] as [string,string][]).map(([k,v])=>(
                <div key={k} style={{ display:'flex',justifyContent:'space-between',fontSize:'0.7rem',marginBottom:4 }}><span style={{ color:'#3d6680' }}>{k}</span><span style={{ fontWeight:600 }}>{v}</span></div>
              ))}
              <button onClick={()=>setSel(null)} style={{ marginTop:7,width:'100%',background:'transparent',border:'1px solid #0d2035',borderRadius:6,padding:'4px 0',color:'#3d6680',fontFamily:"'IBM Plex Mono',monospace",fontSize:'0.6rem',cursor:'pointer' }}>CLEAR ✕</button>
            </div>
          )}
          {/* Legend */}
          <div style={{ padding:'13px 18px',borderTop:'1px solid #0d2035',flexShrink:0 }}>
            <div style={{ fontSize:'0.55rem',letterSpacing:'0.14em',color:'#3d6680',textTransform:'uppercase',marginBottom:9 }}>Legend</div>
            {([{c:'#00e676',l:'🟢 SAFE',s:'pH ≥ 8.10'},{c:'#ffd600',l:'🟡 VULNERABLE',s:'pH 8.00–8.10'},{c:'#ff1744',l:'🔴 CRITICAL',s:'pH < 8.00'},{c:'#ff9100',l:'🚢 SHIPPING',s:'Maritime traffic'}] as {c:string,l:string,s:string}[]).map(x=>(
              <div key={x.l} style={{ display:'flex',gap:9,marginBottom:7,alignItems:'flex-start' }}>
                <div style={{ width:24,height:24,borderRadius:5,flexShrink:0,background:`${x.c}33`,border:`1px solid ${x.c}55` }}/>
                <div><div style={{ fontSize:'0.68rem',fontWeight:700 }}>{x.l}</div><div style={{ fontSize:'0.57rem',color:'#3d6680' }}>{x.s}</div></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* BOTTOM BAR */}
      <div style={{ height:44,background:'rgba(5,14,26,.97)',borderTop:'1px solid #0d2035',display:'flex',alignItems:'center',padding:'0 20px',gap:28,flexShrink:0,fontSize:'0.63rem' }}>
        {summary&&<>
          {([{c:'#ff1744',l:'CRITICAL',v:`${summary.critical} zones`},{c:'#ffd600',l:'VULNERABLE',v:`${summary.vulnerable} zones`},{c:'#00e676',l:'SAFE',v:`${summary.safe} zones`}] as {c:string,l:string,v:string}[]).map(x=>(
            <div key={x.l} style={{ display:'flex',alignItems:'center',gap:7 }}><div style={{ width:8,height:8,borderRadius:'50%',background:x.c }}/><span style={{ color:'#3d6680' }}>{x.l}:</span><span style={{ fontWeight:700 }}>{x.v}</span></div>
          ))}
          <div style={{ marginLeft:'auto',color:'#3d6680' }}>
            Min:<span style={{ color:'#ff1744',fontWeight:700,marginLeft:5 }}>{summary.min_ph}</span>
            <span style={{ margin:'0 8px' }}>·</span>
            Avg:<span style={{ color:'#ffd600',fontWeight:700,marginLeft:5 }}>{summary.avg_ph}</span>
            <span style={{ margin:'0 8px' }}>·</span>
            Max:<span style={{ color:'#00e676',fontWeight:700,marginLeft:5 }}>{summary.max_ph}</span>
          </div>
        </>}
      </div>
    </div>
  );
}