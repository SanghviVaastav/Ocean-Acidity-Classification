'use client';
// frontend/app/history/page.tsx
// Route: http://localhost:3000/history
// Calls: GET /api/history?skip=0&limit=10

import { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
const LIMIT = 10;

interface Log { id:number; input_data:string; prediction:string; created_at?:string; }

export default function HistoryPage() {
  const [logs,    setLogs]    = useState<Log[]>([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(0);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string|null>(null);

  useEffect(()=>{
    setLoading(true);
    fetch(`${API}/api/history?skip=${page*LIMIT}&limit=${LIMIT}`)
      .then(r=>{ if(!r.ok) throw new Error(r.statusText); return r.json(); })
      .then(d=>{ setLogs(d.logs); setTotal(d.total); setLoading(false); })
      .catch(e=>{ setError(e.message); setLoading(false); });
  },[page]);

  const totalPages = Math.ceil(total/LIMIT);
  const pc=(p:string)=>p.toLowerCase().includes('acid')?'#ff1744':p.toLowerCase().includes('normal')?'#00e676':'#ffd600';

  return (
    <div style={{ minHeight:'100vh',background:'#050e1a',fontFamily:"'IBM Plex Mono',monospace",color:'#b8d4e8',padding:32 }}>
      <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;700&family=Unbounded:wght@900&display=swap" rel="stylesheet"/>

      <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:24 }}>
        <div>
          <div style={{ fontFamily:'Unbounded',fontSize:'1.4rem',fontWeight:900,color:'#00d4ff',marginBottom:4 }}>Prediction History</div>
          <div style={{ fontSize:'0.6rem',color:'#3d6680',letterSpacing:'0.12em',textTransform:'uppercase' }}>{total} total records in database</div>
        </div>
        <div style={{ display:'flex',gap:8 }}>
          <a href="/map"     style={{ fontSize:'0.62rem',color:'#00d4ff',textDecoration:'none',padding:'6px 12px',border:'1px solid #0d2035',borderRadius:7 }}>🗺 Map</a>
          <a href="/predict" style={{ fontSize:'0.62rem',color:'#3d6680',textDecoration:'none',padding:'6px 12px',border:'1px solid #0d2035',borderRadius:7 }}>🔬 Predict</a>
        </div>
      </div>

      {loading&&<div style={{ color:'#3d6680',fontSize:'0.75rem' }}>Loading…</div>}
      {error  &&<div style={{ color:'#ff1744',fontSize:'0.75rem' }}>⚠ {error}</div>}

      {!loading&&!error&&(
        <>
          <div style={{ overflowX:'auto',border:'1px solid #0d2035',borderRadius:10 }}>
            <table style={{ width:'100%',borderCollapse:'collapse' }}>
              <thead>
                <tr>{['#','Input Data','Prediction','Logged At'].map(h=>(
                  <th key={h} style={{ padding:'10px 14px',textAlign:'left',fontSize:'0.58rem',letterSpacing:'0.14em',textTransform:'uppercase',color:'#3d6680',borderBottom:'1px solid #0d2035' }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {logs.map(log=>(
                  <tr key={log.id} onMouseEnter={e=>(e.currentTarget.style.background='rgba(0,212,255,.04)')} onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
                    <td style={{ padding:'10px 14px',fontSize:'0.7rem',borderBottom:'1px solid #0d2035',color:'#3d6680',width:40 }}>{log.id}</td>
                    <td style={{ padding:'10px 14px',fontSize:'0.68rem',borderBottom:'1px solid #0d2035',maxWidth:360,wordBreak:'break-all' }}><code style={{ color:'#b8d4e8' }}>{log.input_data}</code></td>
                    <td style={{ padding:'10px 14px',fontSize:'0.7rem',borderBottom:'1px solid #0d2035' }}><span style={{ padding:'3px 10px',borderRadius:5,fontWeight:700,fontSize:'0.65rem',background:`${pc(log.prediction)}18`,color:pc(log.prediction),border:`1px solid ${pc(log.prediction)}44` }}>{log.prediction}</span></td>
                    <td style={{ padding:'10px 14px',fontSize:'0.68rem',borderBottom:'1px solid #0d2035',color:'#3d6680',whiteSpace:'nowrap' }}>{log.created_at?new Date(log.created_at).toLocaleString():'—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display:'flex',alignItems:'center',justifyContent:'flex-end',gap:10,marginTop:14 }}>
            <span style={{ fontSize:'0.6rem',color:'#3d6680' }}>Page {page+1} of {totalPages||1}</span>
            {(['← Prev','Next →'] as const).map((label,i)=>{
              const dis = i===0 ? page===0 : page>=totalPages-1;
              return <button key={label} onClick={()=>setPage(p=>p+(i===0?-1:1))} disabled={dis} style={{ background:'transparent',border:'1px solid #0d2035',borderRadius:6,color:dis?'#1a3a55':'#b8d4e8',fontFamily:"'IBM Plex Mono',monospace",fontSize:'0.65rem',padding:'6px 14px',cursor:dis?'not-allowed':'pointer',opacity:dis?.4:1 }}>{label}</button>;
            })}
          </div>
        </>
      )}
    </div>
  );
}