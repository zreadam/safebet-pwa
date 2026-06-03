// App.jsx — phone shell, router, bottom nav
const { useState: useStateApp } = React;

function StatusBar() {
  return (
    <div className="statusbar">
      <span>9:41</span>
      <span className="right"><i className="ti ti-signal-4g"></i><i className="ti ti-wifi"></i><i className="ti ti-battery-3"></i></span>
    </div>
  );
}

function BottomNav({ tab, setTab }) {
  const tabs = [['home','Accueil','home'],['paris','Paris','ticket'],['ligues','Ligues','trophy'],['quetes','Quêtes','star'],['profil','Profil','user']];
  return (
    <div className="bottomnav">
      {tabs.map(([k,l,ic])=>
        <button key={k} className={'tab'+(tab===k?' active':'')} onClick={()=>setTab(k)}>
          <span className="ic"><i className={'ti ti-'+ic}></i></span><span>{l}</span>
        </button>)}
    </div>
  );
}

function App() {
  const [onboarding, setOnboarding] = useStateApp(true);
  const [tab, setTab] = useStateApp('home');
  const [match, setMatch] = useStateApp(null);
  const [dark, setDark] = useStateApp(false);
  const balance = '124.50';

  return (
    <div className="phone" data-theme={dark ? 'dark' : 'light'}>
      <div className="notch"></div>
      <StatusBar />

      {tab==='home'   && <Dashboard balance={balance} onOpenMatch={setMatch} />}
      {tab==='paris'  && <MyBets balance={balance} />}
      {tab==='ligues' && <Leagues balance={balance} />}
      {tab==='quetes' && <Quests balance={balance} />}
      {tab==='profil' && <Profile balance={balance} dark={dark} onToggleDark={()=>setDark(d=>!d)} />}

      <BottomNav tab={tab} setTab={setTab} />

      {match && <MatchDetail m={match} onClose={()=>setMatch(null)} />}
      {onboarding && <Onboarding onDone={()=>setOnboarding(false)} />}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
