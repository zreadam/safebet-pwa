// Onboarding.jsx — blob-expand intro + 4 steps
const { useState: useStateOB } = React;

function Onboarding({ onDone }) {
  const [step, setStep] = useStateOB(1);
  const [comps, setComps] = useStateOB(['L1']);
  const [settled, setSettled] = useStateOB(false);
  const total = 4;

  // Safety: after the intro animation window, drop the animations so the
  // visible end-state always shows even if a browser throttles rAF.
  React.useEffect(() => { const t = setTimeout(() => setSettled(true), 1100); return () => clearTimeout(t); }, []);

  const toggleComp = (k) => setComps(c => c.includes(k) ? c.filter(x=>x!==k) : [...c, k]);

  const Prog = () => (
    <div className="ob-prog">
      {Array.from({length: total}).map((_,i) =>
        <span key={i} className={'ob-seg' + (i < step ? ' on' : '')}></span>)}
    </div>
  );

  return (
    <div className={'onboard' + (settled ? ' settled' : '')}>
      <div className="ob-bg">
        <div className="ob-content" key={step}>
          <Prog />

          {step === 1 && <>
            <div className="ob-logo">
              <span className="mk"><i className="ti ti-shield-check"></i></span>
            </div>
            <h1 className="ob-h1" style={{marginTop:18}}>Parie avec tes amis.<br/>Sans risque.</h1>
            <p className="ob-sub">Crée ton profil pour commencer</p>
            <div style={{marginTop:22, display:'flex', flexDirection:'column', gap:12}}>
              <input className="ob-input" placeholder="Ton pseudo" defaultValue="Lucas_92" />
              <input className="ob-input" placeholder="🇫🇷  France" />
            </div>
            <div className="ob-spacer"></div>
            <button className="ob-btn" onClick={()=>setStep(2)}>Continuer <i className="ti ti-arrow-right"></i></button>
            <button className="ob-skip" onClick={()=>onDone()}>Passer l'intro</button>
          </>}

          {step === 2 && <>
            <h1 className="ob-h1" style={{marginTop:24}}>Tes compétitions</h1>
            <p className="ob-sub">On mettra tes matchs en avant</p>
            <div className="chip-grid" style={{marginTop:22}}>
              {[['L1','Ligue 1','#10B981'],['UCL','Champions Lg','#0a1a5e'],['PL','Premier Lg','#3d195b'],['LIGA','La Liga','#e01a22'],['SA','Serie A','#0067b1'],['CDM','Coupe du Monde','#f59e0b']].map(([k,n,c])=>
                <div key={k} className={'chip'+(comps.includes(k)?' sel':'')} onClick={()=>toggleComp(k)}>
                  <span className="cl" style={{background:c}}>{k[0]}</span>{n}
                </div>)}
            </div>
            <div className="ob-spacer"></div>
            <button className="ob-btn" onClick={()=>setStep(3)}>Continuer <i className="ti ti-arrow-right"></i></button>
            <button className="ob-skip" onClick={()=>setStep(3)}>Passer cette étape</button>
          </>}

          {step === 3 && <>
            <h1 className="ob-h1" style={{marginTop:24}}>Crée ton compte</h1>
            <p className="ob-sub">Sauvegarde ton solde et tes ligues</p>
            <div style={{marginTop:22, display:'flex', flexDirection:'column', gap:12}}>
              <button className="ob-btn" style={{borderColor:'rgba(255,255,255,.8)', background:'#fff', color:'#374151'}}>
                <span style={{width:18,height:18,borderRadius:'50%',background:'conic-gradient(#EA4335 0 25%,#FBBC05 25% 50%,#34A853 50% 75%,#4285F4 75% 100%)'}}></span>
                Continuer avec Google
              </button>
              <div style={{display:'flex',alignItems:'center',gap:10,color:'rgba(255,255,255,.9)',font:'600 12px/1 var(--font-body)'}}>
                <span style={{flex:1,height:1,background:'rgba(255,255,255,.5)'}}></span>OU<span style={{flex:1,height:1,background:'rgba(255,255,255,.5)'}}></span>
              </div>
              <input className="ob-input" placeholder="Email" defaultValue="lucas@safebet.fr" />
              <input className="ob-input" type="password" placeholder="Mot de passe" defaultValue="azerty12" />
            </div>
            <div className="ob-spacer"></div>
            <button className="ob-btn" onClick={()=>setStep(4)}>Créer mon compte <i className="ti ti-arrow-right"></i></button>
          </>}

          {step === 4 && <>
            <div className="ob-logo" style={{marginTop:20}}>
              <span className="mk"><i className="ti ti-confetti" style={{color:'#10B981'}}></i></span>
            </div>
            <h1 className="ob-h1" style={{marginTop:18}}>Bienvenue sur Safebet !</h1>
            <p className="ob-sub">Ton solde de départ est prêt</p>
            <div className="ob-card" style={{marginTop:22}}>
              <div className="ob-bigb"><span className="coin">B</span>50</div>
              <p style={{margin:'8px 0 0', font:'500 13px/1.4 var(--font-body)', color:'var(--fg-2)'}}>50 Bluffs offerts pour te lancer</p>
            </div>
            <div className="ob-spacer"></div>
            <button className="ob-btn" onClick={()=>onDone()}>Découvrir Safebet <i className="ti ti-arrow-right"></i></button>
          </>}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Onboarding });
