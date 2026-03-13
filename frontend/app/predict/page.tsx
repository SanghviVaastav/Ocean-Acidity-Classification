'use client';
// frontend/app/predict/page.tsx
// Route: http://localhost:3000/predict
// Calls: POST /api/predict   POST /api/predict/batch   GET /api/health

import { useEffect, useRef, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

// ⬇️ Change these fields to match YOUR PredictionRequest schema
const FIELDS = [
  { key:'lat',                      label:'Latitude',                placeholder:'e.g. 34.5' },
  { key:'lon',                      label:'Longitude',               placeholder:'e.g. -120.2' },
  { key:'SST',                      label:'Sea Surface Temp',        placeholder:'e.g. 15.2' },
  { key:'WOA_SSS',                  label:'WOA Salinity',            placeholder:'e.g. 33.5' },
  { key:'NCEP_SLP',                 label:'NCEP Sea Level Pressure', placeholder:'e.g. 1015.2' },
  { key:'ETOPO2_depth',             label:'ETOPO2 Depth',            placeholder:'e.g. 2500' },
  { key:'dist_to_land',             label:'Distance to Land',        placeholder:'e.g. 50' },
  { key:'PPPP',                     label:'PPPP',                    placeholder:'e.g. 0.5' },
  { key:'xCO2water_SST_dry',        label:'xCO2 Water SST Dry',      placeholder:'e.g. 400.1' },
  { key:'shipping_proxy',           label:'Shipping Proxy',          placeholder:'e.g. 0.8' },
  { key:'is_coastal',               label:'Is Coastal (0/1)',        placeholder:'e.g. 1' },
  { key:'shipping_intensity',       label:'Shipping Intensity',      placeholder:'e.g. 4.2' },
  { key:'month_sin',                label:'Month Sin',               placeholder:'e.g. 0.5' },
  { key:'month_cos',                label:'Month Cos',               placeholder:'e.g. 0.866' },
  { key:'day_of_year',              label:'Day of Year',             placeholder:'e.g. 150' },
  { key:'abs_lat',                  label:'Absolute Latitude',       placeholder:'e.g. 34.5' },
  { key:'hemisphere',               label:'Hemisphere (1=N, -1=S)',  placeholder:'e.g. 1' },
  { key:'SST_salinity_interaction', label:'SST Salinity Int.',       placeholder:'e.g. 509.2' },
  { key:'pressure_diff',            label:'Pressure Diff',           placeholder:'e.g. -1.2' },
  { key:'fCO2_per_SST',             label:'fCO2 per SST',            placeholder:'e.g. 26.5' },
];

export default function PredictPage() {
  const [health,  setHealth]  = useState<{status:string;version:string}|null>(null);
  const [vals,    setVals]    = useState<Record<string,string>>({});
  const [sRes,    setSRes]    = useState<string|null>(null);
  const [sErr,    setSErr]    = useState<string|null>(null);
  const [sLoad,   setSLoad]   = useState(false);
  const [bRes,    setBRes]    = useState<(string|number)[]|null>(null);
  const [bErr,    setBErr]    = useState<string|null>(null);
  const [bLoad,   setBLoad]   = useState(false);
  const [fname,   setFname]   = useState<string|null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(()=>{ fetch(`${API}/api/health`).then(r=>r.json()).then(setHealth).catch(()=>{}); },[]);

  const runSingle = async () => {
    setSErr(null); setSRes(null); setSLoad(true);
    const body: Record<string,number> = {};
    FIELDS.forEach(f=>{ body[f.key]=parseFloat(vals[f.key]??'0'); });
    try {
      const r = await fetch(`${API}/api/predict`,{ method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
      const d = await r.json();
      r.ok ? setSRes(String(d.prediction)) : setSErr(d.detail??'Prediction failed');
    } catch(e:any){ setSErr(e.message); }
    setSLoad(false);
  };

  const runBatch = async () => {
    if (!fileRef.current?.files?.[0]) return;
    setBErr(null); setBRes(null); setBLoad(true);
    const form = new FormData();
    form.append('file', fileRef.current.files[0]);
    try {
      const r = await fetch(`${API}/api/predict/batch`,{ method:'POST', body:form });
      const d = await r.json();
      r.ok ? setBRes(d.predictions) : setBErr(d.detail??'Batch failed');
    } catch(e:any){ setBErr(e.message); }
    setBLoad(false);
  };

  const pc=(p:string)=>p.toLowerCase().includes('acid')?'#ff1744':p.toLowerCase().includes('normal')?'#00e676':'#ffd600';

  const I: React.CSSProperties = { width:'100%',background:'#050e1a',border:'1px solid #0d2035',borderRadius:7,padding:'8px 12px',color:'#b8d4e8',fontFamily:"'IBM Plex Mono',monospace",fontSize:'0.78rem',outline:'none' };
  const B=(dis:boolean):React.CSSProperties=>({ background:dis?'rgba(0,212,255,.04)':'rgba(0,212,255,.1)',border:'1px solid #00d4ff',borderRadius:8,color:dis?'#3d6680':'#00d4ff',fontFamily:"'IBM Plex Mono',monospace",fontSize:'0.7rem',padding:'10px 22px',cursor:dis?'not-allowed':'pointer',opacity:dis?.5:1,transition:'all .15s',fontWeight:700 });

  return (
    <div style={{ minHeight:'100vh',background:'#050e1a',fontFamily:"'IBM Plex Mono',monospace",color:'#b8d4e8',padding:32 }}>
      <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;700&family=Unbounded:wght@900&display=swap" rel="stylesheet"/>
      <style>{`@keyframes _b{0%,100%{opacity:1}50%{opacity:.2}}`}</style>

      {/* Header */}
      <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:28 }}>
        <div>
          <div style={{ fontFamily:'Unbounded',fontSize:'1.4rem',fontWeight:900,color:'#00d4ff',marginBottom:4 }}>Ocean<span style={{ color:'#b8d4e8' }}>Acid</span> Predictor</div>
          <div style={{ fontSize:'0.6rem',color:'#3d6680',letterSpacing:'0.12em',textTransform:'uppercase' }}>Ocean Acidity Classification</div>
        </div>
        <div style={{ display:'flex',flexDirection:'column',alignItems:'flex-end',gap:8 }}>
          <div style={{ display:'flex',alignItems:'center',gap:7,background:health?.status==='ok'?'rgba(0,230,118,.08)':'rgba(255,23,68,.08)',border:`1px solid ${health?.status==='ok'?'rgba(0,230,118,.3)':'rgba(255,23,68,.3)'}`,borderRadius:20,padding:'5px 14px',fontSize:'0.62rem',color:health?.status==='ok'?'#00e676':'#ff1744' }}>
            <span style={{ width:8,height:8,borderRadius:'50%',display:'inline-block',background:health?.status==='ok'?'#00e676':'#ff1744',animation:'_b 1.5s infinite' }}/>
            {health?`API ${health.status.toUpperCase()} · v${health.version}`:'API OFFLINE'}
          </div>
          <div style={{ display:'flex',gap:8 }}>
            <a href="/map"     style={{ fontSize:'0.62rem',color:'#00d4ff',textDecoration:'none',padding:'5px 12px',border:'1px solid #0d2035',borderRadius:7 }}>🗺 Map</a>
            <a href="/history" style={{ fontSize:'0.62rem',color:'#3d6680',textDecoration:'none',padding:'5px 12px',border:'1px solid #0d2035',borderRadius:7 }}>📋 History</a>
          </div>
        </div>
      </div>

      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:24 }}>

        {/* Single */}
        <div style={{ background:'#071525',border:'1px solid #0d2035',borderRadius:12,padding:24 }}>
          <div style={{ fontFamily:'Unbounded',fontSize:'0.82rem',fontWeight:700,marginBottom:16 }}>Single Prediction</div>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16 }}>
            {FIELDS.map(f=>(
              <div key={f.key}>
                <label style={{ fontSize:'0.58rem',letterSpacing:'0.14em',color:'#3d6680',textTransform:'uppercase',marginBottom:5,display:'block' }}>{f.label}</label>
                <input style={I} type="number" step="any" placeholder={f.placeholder} value={vals[f.key]??''} onChange={e=>setVals(p=>({...p,[f.key]:e.target.value}))}/>
              </div>
            ))}
          </div>
          <button onClick={runSingle} disabled={sLoad} style={B(sLoad)}>{sLoad?'Classifying…':'Run Prediction →'}</button>
          {sRes&&<div style={{ marginTop:14,padding:'12px 16px',borderRadius:10,background:`${pc(sRes)}18`,border:`1px solid ${pc(sRes)}44` }}><div style={{ fontSize:'0.55rem',color:'#3d6680',letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:4 }}>Result</div><div style={{ fontSize:'1.2rem',fontWeight:700,color:pc(sRes) }}>{sRes}</div></div>}
          {sErr&&<div style={{ marginTop:12,padding:'9px 12px',borderRadius:8,background:'rgba(255,23,68,.1)',border:'1px solid rgba(255,23,68,.3)',color:'#ff1744',fontSize:'0.7rem' }}>⚠ {sErr}</div>}
        </div>

        {/* Batch */}
        <div style={{ background:'#071525',border:'1px solid #0d2035',borderRadius:12,padding:24 }}>
          <div style={{ fontFamily:'Unbounded',fontSize:'0.82rem',fontWeight:700,marginBottom:12 }}>Batch Prediction (CSV)</div>
          <div style={{ marginBottom:14,fontSize:'0.67rem',color:'#3d6680',lineHeight:1.6 }}>
            Upload a <code style={{ color:'#00d4ff' }}>.csv</code> with 20 columns.<br/>
            <code style={{ color:'#b8d4e8' }}><a href="/template.csv" download style={{color:'#ff1744', textDecoration:'underline'}}>Download Template CSV</a></code>
          </div>
          <div onClick={()=>fileRef.current?.click()} style={{ border:`2px dashed ${fname?'#00d4ff':'#0d2035'}`,borderRadius:10,padding:'26px 20px',textAlign:'center',cursor:'pointer',marginBottom:14,transition:'border-color .15s' }} onMouseEnter={e=>(e.currentTarget.style.borderColor='#00d4ff')} onMouseLeave={e=>(e.currentTarget.style.borderColor=fname?'#00d4ff':'#0d2035')}>
            <div style={{ fontSize:'1.8rem',marginBottom:6 }}>📂</div>
            <div style={{ fontSize:'0.72rem',color:fname?'#00d4ff':'#3d6680' }}>{fname??'Click to select CSV'}</div>
          </div>
          <input ref={fileRef} type="file" accept=".csv" style={{ display:'none' }} onChange={e=>setFname(e.target.files?.[0]?.name??null)}/>
          <button onClick={runBatch} disabled={bLoad||!fname} style={B(bLoad||!fname)}>{bLoad?'Processing…':'Run Batch →'}</button>
          {bErr&&<div style={{ marginTop:12,padding:'9px 12px',borderRadius:8,background:'rgba(255,23,68,.1)',border:'1px solid rgba(255,23,68,.3)',color:'#ff1744',fontSize:'0.7rem' }}>⚠ {bErr}</div>}
          {bRes&&<div style={{ marginTop:14 }}><div style={{ fontSize:'0.55rem',color:'#3d6680',letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:8 }}>{bRes.length} Results</div><div style={{ maxHeight:180,overflowY:'auto',display:'flex',flexWrap:'wrap',gap:6 }}>{bRes.map((p,i)=><span key={i} style={{ padding:'3px 10px',borderRadius:5,fontSize:'0.65rem',fontWeight:700,background:`${pc(String(p))}18`,color:pc(String(p)),border:`1px solid ${pc(String(p))}44` }}>#{i+1} {p}</span>)}</div></div>}
        </div>
      </div>
    </div>
  );
}