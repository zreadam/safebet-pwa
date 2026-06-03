// Screens.jsx — Paris (Mes paris), Ligues, Quêtes, Profil
const { useState: useStateS } = React;

function MyBets({ balance }) {
  const [filter, setFilter] = useStateS('Tous');
  const filters = ['Tous','En cours','Gagnés','Perdus'];
  const map = { 'En cours':'prog','Gagnés':'won','Perdus':'lost' };
  const list = filter==='Tous' ? BETS : BETS.filter(b=>b.status===map[filter]);
  return (
    <div className="screen">
      <div className="appbar"><h1 className="page-title">Mes paris</h1><Bluff value={balance} /></div>
      <div className="pad">
        <div className="metrics">
          <div className="metric"><div className="ml">Solde</div><div className="mv">{balance} B</div></div>
          <div className="metric"><div className="ml">Gain total</div><div className="mv pos">+87 B</div></div>
          <div className="metric"><div className="ml">Réussite</div><div className="mv">64%</div></div>
        </div>
      </div>
      <div className="pills" style={{marginTop:16}}>
        {filters.map(f=><div key={f} className={'pill'+(f===filter?' active':'')} onClick={()=>setFilter(f)}>{f}</div>)}
      </div>
      <div className="pad" style={{marginTop:14, display:'flex', flexDirection:'column', gap:10}}>
        {list.map(b=>
          <div key={b.id} className={'card bet '+b.status}>
            <div className="bt">
              <div><h3>{b.match}</h3><div className="typ">{b.type} · cote {b.cote}</div></div>
              <span className={'badge '+(b.status==='won'?'bg-won':b.status==='lost'?'bg-lost':'bg-prog')}>{b.label}</span>
            </div>
            <div className="bm"><span>Mise : <b>{b.mise}</b></span><span style={{color:b.status==='won'?'var(--emerald-600)':b.status==='lost'?'var(--error)':'var(--fg-2)'}}>{b.status==='lost'?'Perdu' :'Gain'} : <b style={{color:'inherit'}}>{b.gain}</b></span></div>
          </div>)}
      </div>
      <div className="pad" style={{marginTop:16}}>
        <div className="lockcard">
          <div className="card" style={{padding:'28px 16px', textAlign:'center'}}>
            <div style={{font:'600 15px/1 var(--font-body)',color:'var(--fg-2)'}}>Graphique d'évolution du solde</div>
          </div>
          <div className="veil"><i className="ti ti-lock"></i><span>Graphique Premium</span></div>
        </div>
      </div>
      <div className="spacer-nav"></div>
    </div>
  );
}

function Leagues({ balance }) {
  return (
    <div className="screen">
      <div className="appbar"><h1 className="page-title">Ligues</h1><Bluff value={balance} /></div>
      <div className="pad">
        <div className="card" style={{overflow:'hidden', marginBottom:16}}>
          <div className="league-card" style={{borderBottom:'1px solid var(--border-light)'}}>
            <div className="lcrest" style={{background:LEAGUE.c}}>LB</div>
            <div className="li"><h3>{LEAGUE.name}</h3><p>{LEAGUE.members} membres · Saison en cours</p></div>
            <span className="badge bg-won">PRIVÉE</span>
          </div>
          {LEAGUE.table.map(r=>
            <div key={r.rk} className={'rank-row'+(r.me?' me':'')}>
              <span className="rk">{r.medal||r.rk}</span>
              <span className="av" style={{background:r.av}}>{r.nm[0]}</span>
              <span className="nm">{r.nm}{r.me&&' · toi'}</span>
              <span className="bal">{r.bal} B</span>
              <span className={'chg '+(r.chg[0]==='+'?'up':'down')}>{r.chg}</span>
            </div>)}
        </div>

        <div className="section-head" style={{margin:'0 0 10px'}}><h2 style={{fontSize:17}}>Activité</h2></div>
        <div className="card" style={{overflow:'hidden', marginBottom:16}}>
          {LEAGUE.feed.map((f,i)=>
            <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'12px 14px',borderBottom:i<LEAGUE.feed.length-1?'1px solid var(--border-light)':'none'}}>
              <span style={{fontSize:18}}>{f.e}</span>
              <span style={{font:'500 13px/1.3 var(--font-body)',color:'var(--fg-1)'}}>{f.t}</span>
            </div>)}
        </div>

        <div className="lockcard">
          <button className="btn btn-premium"><i className="ti ti-plus"></i>Créer une ligue privée</button>
        </div>
        <p style={{font:'var(--text-micro)',color:'var(--fg-3)',textAlign:'center',marginTop:10}}>Les ligues privées sont une fonctionnalité Premium</p>
      </div>
      <div className="spacer-nav"></div>
    </div>
  );
}

function Quests({ balance }) {
  return (
    <div className="screen">
      <div className="appbar"><h1 className="page-title">Quêtes</h1><Bluff value={balance} /></div>
      <div className="pad">
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:16}}>
          <span className="badge bg-won" style={{fontSize:12,padding:'6px 12px'}}><i className="ti ti-bolt"></i> +8B aujourd'hui</span>
        </div>
        <div className="section-head" style={{margin:'0 0 10px'}}><h2 style={{fontSize:17}}>Quotidiennes</h2><span className="sub">Reset dans 14h 32min</span></div>
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          {QUESTS.map(q=>
            <div key={q.id} className={'card'} style={{padding:14, ...(q.done?{background:'var(--emerald-50)',borderColor:'var(--emerald-100)'}:{}), position:'relative'}}>
              <div className="qtop"><span className="qtitle"><i className={'ti '+(q.premium?'ti-lock':'ti-bolt')} style={q.premium?{color:'var(--amber-500)'}:{}}></i>{q.title}{q.premium&&<span className="badge bg-prem" style={{marginLeft:6}}>Premium</span>}</span><span className="rew">{q.rew}</span></div>
              <div className="qdesc" style={{minHeight:0,marginBottom:q.done?0:10}}>{q.desc}</div>
              {q.done
                ? <div className="qcheck"><i className="ti ti-circle-check"></i>Complété</div>
                : <><div className="bar"><div className="fill" style={{width:(q.prog/q.total*100)+'%'}}></div></div>
                    <div className="qfoot"><span>{q.prog}/{q.total}</span><span>Reset {q.reset}</span></div></>}
              {q.premium && <div className="veil" style={{position:'absolute',inset:0,background:'rgba(249,250,251,.55)',borderRadius:'var(--radius-card)'}}></div>}
            </div>)}
        </div>
      </div>
      <div className="spacer-nav"></div>
    </div>
  );
}

function Profile({ balance, dark, onToggleDark }) {
  return (
    <div className="screen">
      <div className="appbar"><h1 className="page-title">Profil</h1></div>
      <div className="pad">
        <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:8,padding:'8px 0 20px'}}>
          <div style={{width:84,height:84,borderRadius:'50%',background:'var(--emerald-500)',display:'flex',alignItems:'center',justifyContent:'center',font:'700 32px/1 var(--font-display)',color:'#fff',position:'relative'}}>
            L<span style={{position:'absolute',bottom:0,right:0,width:28,height:28,borderRadius:'50%',background:'#fff',border:'1px solid var(--border-light)',display:'flex',alignItems:'center',justifyContent:'center'}}><i className="ti ti-pencil" style={{fontSize:15,color:'var(--fg-2)'}}></i></span>
          </div>
          <h2 style={{margin:'6px 0 0',font:'600 22px/1 var(--font-display)',color:'var(--fg-1)'}}>Lucas_92</h2>
          <div style={{display:'flex',gap:8,alignItems:'center'}}><span className="badge bg-free">Free</span><Bluff value={balance} /></div>
        </div>

        <div className="metrics" style={{gridTemplateColumns:'repeat(2,1fr)'}}>
          <div className="metric"><div className="ml">Total paris</div><div className="mv">48</div></div>
          <div className="metric"><div className="ml">Réussite</div><div className="mv pos">64%</div></div>
          <div className="metric"><div className="ml">Meilleur gain</div><div className="mv">85 B</div></div>
          <div className="metric"><div className="ml">Série</div><div className="mv">🔥 4</div></div>
        </div>

        <div style={{marginTop:18}}>
          <button className="btn btn-premium"><i className="ti ti-crown"></i>Passe au Premium · 4,99€/mois</button>
        </div>

        <div className="settings" style={{marginTop:18}}>
          <div className="set-row"><i className="ti ti-moon lead"></i><span className="sl2">Mode sombre</span>
            <div className={'toggle'+(dark?' on':'')} onClick={onToggleDark}><span className="knob"></span></div>
          </div>
          <div className="set-row"><i className="ti ti-bell lead"></i><span className="sl2">Notifications</span><div className="toggle on"><span className="knob"></span></div></div>
          <div className="set-row"><i className="ti ti-world lead"></i><span className="sl2">Langue</span><span style={{font:'500 14px/1 var(--font-body)',color:'var(--fg-3)'}}>Français</span><i className="ti ti-chevron-right chev"></i></div>
          <div className="set-row"><i className="ti ti-crown lead"></i><span className="sl2">Abonnement</span><i className="ti ti-chevron-right chev"></i></div>
          <div className="set-row" style={{borderBottom:'none'}}><i className="ti ti-logout lead" style={{color:'var(--error)'}}></i><span className="sl2" style={{color:'var(--error)'}}>Déconnexion</span></div>
        </div>
      </div>
      <div className="spacer-nav"></div>
    </div>
  );
}

Object.assign(window, { MyBets, Leagues, Quests, Profile });
