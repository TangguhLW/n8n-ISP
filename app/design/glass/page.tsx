'use client';
import { useState } from 'react';
import { AppleLiquidGlassButton, type GlassMaterial } from '../../../components/ui/AppleLiquidGlassButton';
import { AppleLiquidGlassPanel } from '../../../components/ui/AppleLiquidGlassPanel';

export default function GlassStudy() {
  const [clicked,setClicked]=useState(false),[loading,setLoading]=useState(false),[fallback,setFallback]=useState(false);
  return <main className={`material-study dark ${fallback?'no-backdrop':''}`}>
    <p className="eyebrow">ATH / Material study</p><h1>Liquid Glass</h1>
    <p className="muted">Studi komponen berdasarkan deskripsi referensi: kapsul milky dan panel smoky. Permukaan ini menggunakan pendekatan CSS berlapis.</p>
    <div className="material-scenes">
      <div className="material-scene milky-scene"><AppleLiquidGlassButton onClick={()=>setClicked(!clicked)} aria-pressed={clicked}>{clicked?'Started':'Get started'}</AppleLiquidGlassButton><span className="study-label">A / Milky capsule · 166 × 46</span></div>
      <div className="material-scene smoky-scene"><AppleLiquidGlassPanel><p className="eyebrow">ATH workspace</p><h2>Smoky glass</h2><p>Cahaya lingkungan melewati permukaan yang tenang.</p></AppleLiquidGlassPanel><span className="study-label">B / Smoky floating surface</span></div>
    </div>
    <div className="material-controls"><AppleLiquidGlassButton width="auto" loading={loading} onClick={()=>{setLoading(true);setTimeout(()=>setLoading(false),1000);}}>{loading?'Memproses…':'Uji loading'}</AppleLiquidGlassButton><AppleLiquidGlassButton disabled>Disabled</AppleLiquidGlassButton><button onClick={()=>setFallback(!fallback)} aria-pressed={fallback}>Fallback {fallback?'aktif':'nonaktif'}</button><a href="/">Kembali ke dashboard</a></div>
    <div className="preset-grid">{(['milky','smoky','clear','elevated'] as GlassMaterial[]).map(material=><AppleLiquidGlassPanel key={material} material={material} data-testid={`preset-${material}`}><h2>{material}</h2><p>ATH Liquid Glass</p></AppleLiquidGlassPanel>)}</div>
  </main>;
}
