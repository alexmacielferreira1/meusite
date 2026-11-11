/** Procedural decorative art, independent of external assets and client content. */
export function Art({kind}:{kind:string}) {
 return <div className={`fm-art fm-art-${kind}`} aria-hidden="true">
  {kind==="wave"?<svg viewBox="0 0 600 400" preserveAspectRatio="none">{Array.from({length:22},(_,i)=><path key={i} d={`M-20 ${130+i*7} C130 ${-60+i*15} 330 ${500-i*10} 620 ${100+i*8}`} fill="none" stroke="currentColor" strokeWidth="2" opacity={0.2+i/40}/>)}</svg>:kind==="type"?<span className="fm-type-art">Aa<br/>↗</span>:<>{Array.from({length:kind==="particles"?18:5},(_,i)=><i key={i} style={{"--i":i} as React.CSSProperties}/>)}</>}
 </div>;
}
