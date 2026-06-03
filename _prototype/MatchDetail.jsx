// MatchDetail.jsx — slide-up match page with selectable odds + sticky bet slip
const { useState: useStateMD } = React;

function MatchDetail({ m, onClose }) {
  const [tab, setTab] = useStateMD('Résultat');
  const [sel, setSel] = useStateMD(null); // {label, cote}
  const live = m.state === 'live';
  const done = m.state === 'done';

  const markets = {
    'Résultat': [
      { lbl: 'Victoire ' + CLUBS[m.home].name, opts: [['1', m.cotes[0]]] },
      { lbl: 'Match nul', opts: [['N', m.cotes[1]]] },
      { lbl: 'Victoire ' + CLUBS[m.away].name, opts: [['2', m.cotes[2]]] },
      { lbl: 'Double chance 1N', opts: [['1N', 1.22]] },
    ],
    'Buts': [
      { lbl: 'Plus de 2.5 buts', opts: [['Oui', 1.80],['Non', 1.95]] },
      { lbl: 'Les deux équipes marquent', opts: [['Oui', 1.65],['Non', 2.10]] },
      { lbl: 'Score exact 2-1', opts: [['2-1', 8.50]] },
    ],
    'Buteurs': [
      { lbl: 'Mbappé buteur', opts: [['Oui', 1.70]] },
      { lbl: 'Premier buteur — Aubameyang', opts: [['1er', 5.50]] },
    ],
    'Stats': null,
  };
  const tabs = live ? ['Résultat live','Buts','Stats'] : ['Résultat','Buts','Buteurs','Stats'];
  const rows = markets[tab.replace(' live','')] ?? markets['Résultat'];
  const isStats = tab === 'Stats';

  return (
    <div className="overlay">
      <div className="md-head">
        <div className="md-nav">
          <button className="iconbtn" onClick={onClose}><i className="ti ti-chevron-down"></i></button>
          {live ? <span className="live-b"><span className="d"></span>LIVE {m.min}</span>
                : <span className="badge bg-prog">{done?'Terminé':(m.date+' · '+m.time)}</span>}
          <button className="iconbtn"><i className="ti ti-heart"></i></button>
        </div>
        <div className="md-teams">
          <div className="team"><Crest code={m.home} big /><span style={{marginTop:6}}>{CLUBS[m.home].name}</span></div>
          <div className="md-mid">
            {(live||done) ? <div className="sc">{m.hs} – {m.as}</div> : <div className="sc" style={{fontSize:26}}>{m.time}</div>}
            <div className="st">{live ? m.min : (done ? 'Terminé' : m.date)}</div>
          </div>
          <div className="team"><Crest code={m.away} big /><span style={{marginTop:6}}>{CLUBS[m.away].name}</span></div>
        </div>
        <div className="md-meta">{COMPS[m.comp].name} · Parc des Princes, Paris</div>
      </div>

      <div className="md-tabs">
        {tabs.map(t => <div key={t} className={'md-tab'+(t===tab?' active':'')} onClick={()=>setTab(t)}>{t}</div>)}
      </div>

      <div className="screen pad" style={{paddingTop:4, paddingBottom: sel?96:24}}>
        {isStats ? (
          <div style={{paddingTop:10}}>
            {[['Possession',58,42],['Tirs',12,7],['Tirs cadrés',5,3],['Corners',6,2],['Fautes',9,13]].map(([l,a,b])=>{
              const tot=a+b; return (
              <div className="statline" key={l}>
                <div className="stop"><span>{a}{l==='Possession'?'%':''}</span><span style={{color:'var(--fg-3)',fontWeight:500,fontFamily:'var(--font-body)',fontSize:12}}>{l}</span><span>{b}{l==='Possession'?'%':''}</span></div>
                <div className="strack"><span className="sa" style={{width:(a/tot*100)+'%'}}></span><span className="sb" style={{width:(b/tot*100)+'%'}}></span></div>
              </div>);
            })}
          </div>
        ) : (
          <div>
            {live && <div style={{display:'flex',alignItems:'center',gap:6,margin:'12px 0 2px',font:'600 12px/1 var(--font-body)',color:'var(--amber-700)'}}><i className="ti ti-bolt"></i>Cotes en temps réel</div>}
            {rows.map(r=>
              <div className="bet-row" key={r.lbl}>
                <span className="lbl">{r.lbl}</span>
                <div className="opts">
                  {r.opts.map(([k,c])=>{
                    const id = r.lbl+'|'+k; const on = sel && sel.id===id;
                    return <div key={k} className={'cote opt'+(on?' sel':'')} onClick={()=>setSel(on?null:{id, label:r.lbl, k, cote:c})}>
                      <span className="k">{k}</span><span className="v">{c.toFixed(2)}</span>
                    </div>;
                  })}
                </div>
              </div>)}
          </div>
        )}
        {!isStats && <div className="swipe-dots"><span className="dot on"></span><span className="dot"></span><span className="dot"></span></div>}
      </div>

      {sel && <div className="slip">
        <div className="si"><div>{sel.label} · <b>{sel.cote.toFixed(2)}</b></div><div style={{color:'rgba(255,255,255,.7)',fontSize:11,marginTop:2}}>Mise 10B · Gain {(sel.cote*10).toFixed(0)}B</div></div>
        <button className="btn btn-primary" style={{width:'auto',height:40,padding:'0 18px',background:'var(--emerald-500)'}}>Parier</button>
      </div>}
    </div>
  );
}

Object.assign(window, { MatchDetail });
