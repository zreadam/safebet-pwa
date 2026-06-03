// Dashboard.jsx — Accueil screen + MatchCard
function MatchCard({ m, onOpen }) {
  const live = m.state === 'live';
  const done = m.state === 'done';
  const inner = (
    <div className={'match' + (live ? ' live' : '')} onClick={()=>!m.locked && onOpen(m)}>
      <div className="mtop">
        <CompTag code={m.comp} />
        {live && <span className="live-b"><span className="d"></span>LIVE {m.min}</span>}
        {done && <span className="badge bg-won">Terminé</span>}
        {m.state==='soon' && <span className="badge bg-prog">{m.date} · {m.time}</span>}
      </div>
      <div className="teams">
        <div className="team"><Crest code={m.home} /><span>{CLUBS[m.home].name}</span></div>
        <div className="mscore">
          {(live||done) ? <>{m.hs} – {m.as}{live && <small>{m.min}</small>}</> : <>{m.time}<small>{m.date}</small></>}
        </div>
        <div className="team"><Crest code={m.away} /><span>{CLUBS[m.away].name}</span></div>
      </div>
      <div className="cotes">
        {['1','N','2'].map((k,i)=>
          <div key={k} className={'cote'+(live&&i===0?' sel':'')}>
            <span className="k">{k}</span><span className="v">{m.cotes[i].toFixed(2)}</span>
          </div>)}
      </div>
    </div>
  );
  if (m.locked) return (
    <div className="lockcard">{inner}
      <div className="veil"><i className="ti ti-lock"></i><span>Match Premium</span></div>
    </div>
  );
  return inner;
}

function Dashboard({ balance, onOpenMatch }) {
  return (
    <div className="screen">
      <div className="appbar">
        <div className="brand"><span className="mk"><i className="ti ti-shield-check"></i></span><span className="nm">Safebet</span></div>
        <div className="actions">
          <Bluff value={balance} />
          <button className="iconbtn"><i className="ti ti-bell"></i><span className="ndot"></span></button>
        </div>
      </div>

      <div className="section">
        <div className="section-head"><h2>Matchs du jour</h2><span className="sub">Mar. 2 juin</span></div>
        <div className="pad" style={{display:'flex',flexDirection:'column',gap:12}}>
          {MATCHES.map(m => <MatchCard key={m.id} m={m} onOpen={onOpenMatch} />)}
        </div>
      </div>

      <div className="section">
        <div className="section-head"><h2>Tes quêtes du jour</h2><a href="#">Voir tout</a></div>
        <div className="hscroll">
          {QUESTS.slice(0,3).map(q =>
            <div key={q.id} className={'quest'+(q.done?' done':'')}>
              <div className="qtop"><span className="qtitle"><i className="ti ti-bolt"></i>{q.title}</span><span className="rew">{q.rew}</span></div>
              <div className="qdesc">{q.desc}</div>
              {q.done
                ? <div className="qcheck"><i className="ti ti-circle-check"></i>Complété</div>
                : <><div className="bar"><div className="fill" style={{width:(q.prog/q.total*100)+'%'}}></div></div>
                    <div className="qfoot"><span>{q.prog}/{q.total}</span><span>Reset {q.reset}</span></div></>}
            </div>)}
        </div>
      </div>

      <div className="section">
        <div className="section-head"><h2>Tes compétitions</h2></div>
        <div className="pills">
          {['Toutes','Ligue 1','Champions Lg','Premier Lg','La Liga','Serie A'].map((p,i)=>
            <div key={p} className={'pill'+(i===1?' active':'')}>{p}</div>)}
        </div>
      </div>

      <div className="section">
        <div className="section-head"><h2>Ta ligue</h2><a href="#">Voir</a></div>
        <div className="pad">
          <div className="card" style={{overflow:'hidden'}}>
            <div className="league-card" style={{borderBottom:'1px solid var(--border-light)'}}>
              <div className="lcrest" style={{background:LEAGUE.c}}>LB</div>
              <div className="li"><h3>{LEAGUE.name}</h3><p>{LEAGUE.members} membres · Tu es {LEAGUE.rank}ᵉ</p></div>
              <span className="badge bg-won">PRIVÉE</span>
            </div>
            {LEAGUE.table.slice(0,3).map(r=>
              <div key={r.rk} className={'rank-row'+(r.me?' me':'')}>
                <span className="rk">{r.medal||r.rk}</span>
                <span className="av" style={{background:r.av}}>{r.nm[0]}</span>
                <span className="nm">{r.nm}</span>
                <span className="bal">{r.bal} B</span>
              </div>)}
          </div>
        </div>
      </div>
      <div className="spacer-nav"></div>
    </div>
  );
}

Object.assign(window, { Dashboard, MatchCard });
