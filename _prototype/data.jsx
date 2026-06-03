// data.jsx — fake Safebet data + small primitives shared across screens
const { useState } = React;

// ---- club crest colors (no official logos delivered — neutral monograms) ----
const CLUBS = {
  PSG: { name: 'Paris SG', c: '#0b1b3a' },
  OM:  { name: 'Marseille', c: '#2faee0' },
  OL:  { name: 'Lyon', c: '#13294b' },
  ASM: { name: 'Monaco', c: '#cf1730' },
  RCL: { name: 'Lens', c: '#e01a22' },
  LOSC:{ name: 'Lille', c: '#e01e2c' },
  FCN: { name: 'Nantes', c: '#f9c810' },
  SRFC:{ name: 'Rennes', c: '#e23133' },
};
const COMPS = {
  L1: { name: 'Ligue 1', c: '#10B981' },
  UCL:{ name: 'Champions League', c: '#0a1a5e' },
  PL: { name: 'Premier League', c: '#3d195b' },
};

const MATCHES = [
  { id:'m1', comp:'L1', home:'PSG', away:'OM', state:'live', min:"67'", hs:2, as:1, cotes:[1.45,3.80,6.20] },
  { id:'m2', comp:'L1', home:'OL', away:'ASM', state:'soon', time:'21:00', date:"Auj.", cotes:[2.10,3.40,3.10] },
  { id:'m3', comp:'UCL', home:'LOSC', away:'RCL', state:'soon', time:'18:45', date:'Demain', cotes:[1.90,3.50,4.00], locked:true },
  { id:'m4', comp:'L1', home:'FCN', away:'SRFC', state:'done', hs:0, as:2, cotes:[2.80,3.20,2.40] },
];

const QUESTS = [
  { id:'q1', title:'Parieur actif', desc:'Pose 5 paris aujourd\u0027hui', rew:'+3B', prog:4, total:5, reset:'14h' },
  { id:'q2', title:'Premier pari', desc:'Pose ton tout premier pari du jour', rew:'+2B', done:true },
  { id:'q3', title:'Combiné gagnant', desc:'Gagne un combiné de 3 matchs', rew:'+8B', prog:1, total:3, reset:'14h', premium:true },
  { id:'q4', title:'Roi de la ligue', desc:'Termine n°1 de ta ligue cette semaine', rew:'+15B', prog:2, total:5, reset:'4j' },
];

const LEAGUE = {
  name:'Les Bluffeurs', members:12, rank:3, c:'#10B981',
  table:[
    { rk:1, nm:'Lucas_92', bal:'312.0', chg:'+24', av:'#f59e0b', medal:'🥇' },
    { rk:2, nm:'Sofiane', bal:'287.5', chg:'+12', av:'#3b82f6', medal:'🥈' },
    { rk:3, nm:'Toi', bal:'248.5', chg:'+31', av:'#10b981', me:true, medal:'🥉' },
    { rk:4, nm:'Marina', bal:'201.0', chg:'-8', av:'#ec4899' },
    { rk:5, nm:'Tom', bal:'176.5', chg:'-14', av:'#8b5cf6' },
  ],
  feed:[
    { t:'Lucas a gagné 24B sur PSG - OM', e:'🎉' },
    { t:'Tom a perdu son combiné de 5 matchs', e:'😬' },
    { t:'Marina a rejoint la ligue', e:'👋' },
  ],
};

const BETS = [
  { id:'b1', match:'PSG vs OM', type:'Score exact 2-1', cote:'8.50', mise:'10B', gain:'85B', status:'prog', label:'En cours' },
  { id:'b2', match:'Lyon vs Monaco', type:'Victoire Lyon', cote:'2.10', mise:'20B', gain:'42B', status:'won', label:'Gagné' },
  { id:'b3', match:'Nantes vs Rennes', type:'Plus de 2.5 buts', cote:'1.80', mise:'15B', gain:'0B', status:'lost', label:'Perdu' },
];

// ---- primitives ----
function Crest({ code, big }) {
  const club = CLUBS[code] || { name: code, c: '#9ca3af' };
  return <div className="crest" style={big ? { background: club.c, color:'#fff' } : { background: club.c+'22', color: club.c }}>{code}</div>;
}
function CompTag({ code }) {
  const c = COMPS[code] || { name: code, c: '#10B981' };
  return <span className="comp"><span className="lg" style={{ background: c.c }}>{code[0]}</span>{c.name}</span>;
}
function Bluff({ value }) {
  return <span className="bluff"><span className="coin">B</span>{value} B</span>;
}
function Icon({ n }) { return <i className={'ti ti-' + n}></i>; }

Object.assign(window, { CLUBS, COMPS, MATCHES, QUESTS, LEAGUE, BETS, Crest, CompTag, Bluff, Icon });
