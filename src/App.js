
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const electron = window.require ? window.require('electron') : null;
const ipcRenderer = electron ? electron.ipcRenderer : null;

const API_URL = "http://188.124.37.192:5000";

const TEXTS = {
  Russian: { main:"ГЛАВНАЯ", db:"БАЗА ДАННЫХ", play:"ИГРАТЬ", in:"ВХОД", reg:"РЕГИСТРАЦИЯ", cont:"ПРОДОЛЖИТЬ", check:"ПРОВЕРИТЬ ОБНОВЛЕНИЕ", exit:"ВЫЙТИ", logged:"АККАУНТ:", find:"ПОИСК", levels:"ЛИДЕРЫ", drop:"ДРОП", enhance:"УСИЛЕНИЕ", ph_u:"ЛОГИН", ph_p:"ПАРОЛЬ", s_item:"ПРЕДМЕТ", s_mon:"МОНСТР", s_loc:"ЛОКАЦИЯ", s_scroll:"СВИТОК", h_lvl:"УРОВЕНЬ", h_class:"КЛАСС", h_power:"СИЛА", h_chance:"ШАНС %", s_name: "ИМЯ" },
  Korean: { main:"메인", db:"데이터베이스", play:"게임 시작", in:"로그인", reg:"회원가입", cont:"계속하다", check:"업데이트 확인", exit:"로그아ут", logged:"계정:", find:"검색", levels:"랭킹", drop:"드롭", enhance:"강화", ph_u:"아이디", ph_p:"비밀번호", s_item:"아이템", s_mon:"몬스터", s_loc:"지역", s_scroll:"주문서", h_lvl:"레벨", h_class:"직업", h_power:"전투력", h_chance:"확률 %", s_name: "이름" },
  Chinese: { main:"主页", db:"数据库", play:"开始游戏", in:"登录", reg:"注册", cont:"继续", check:"检查更新", exit:"登出", logged:"登录身份:", find:"查找", levels:"排行榜", drop:"掉落", enhance:"强化", ph_u:"用户名", ph_p:"密码", s_item:"物品", s_mon:"怪物", s_loc:"地点", s_scroll:"卷轴", h_lvl:"等级", h_class:"职业", h_power:"战力", h_chance:"几率 %", s_name: "名称" }
};

function App() {
  const [lang, setLang] = useState(localStorage.getItem('v36_lang') || 'Russian');
  const [theme, setTheme] = useState(localStorage.getItem('v36_theme') || 'dark');
  const [clientPath, setClientPath] = useState(localStorage.getItem('v36_path') || '');
  const [user, setUser] = useState(null);
  const [login, setLogin] = useState("");
  const [pass, setPass] = useState("");
  const [isReg, setIsReg] = useState(false);
  const [activeTab, setActiveTab] = useState('main');
  const [dbTab, setDbTab] = useState('levels');
  const [leaderMode, setLeaderMode] = useState('lv');
  const [dbData, setDbData] = useState([]);
  const [serverInfo, setServerInfo] = useState({ online: false, players: 0 });
  const [progress, setProgress] = useState(100);
  const [authError, setAuthError] = useState("");

  const [sItem, setSItem] = useState("");
  const [sMon, setSMon] = useState("");
  const [sLoc, setSLoc] = useState("");
  const [sScroll, setSScroll] = useState("");

  const t = TEXTS[lang];

  useEffect(() => {
    localStorage.setItem('v36_lang', lang);
    localStorage.setItem('v36_theme', theme);
    localStorage.setItem('v36_path', clientPath);
    document.documentElement.setAttribute('data-theme', theme);
  }, [lang, theme, clientPath]);

  useEffect(() => {
    if(ipcRenderer) {
      ipcRenderer.on('selected-client-path', (e, path) => setClientPath(path));
    }
    return () => { if(ipcRenderer) ipcRenderer.removeAllListeners('selected-client-path'); }
  }, []);

  useEffect(() => {
    const check = async () => {
      try {
        const res = await axios.get(`${API_URL}/server/status?t=${Date.now()}`, { timeout: 3000 });
        if (res.data && res.data.online === true) setServerInfo({ online: true, players: res.data.players });
        else setServerInfo({ online: false, players: 0 });
      } catch { setServerInfo({ online: false, players: 0 }); }
    };
    check(); setInterval(check, 10000);
  }, []);

  const handleLaunch = () => {
      if(!clientPath) return alert("Выберите папку игры 📂");
      if(ipcRenderer) ipcRenderer.send('launch-game', { username: user.username, lang, clientPath });
  };

  const handleAuth = async () => {
    setAuthError("");
    try {
      const ep = isReg ? 'register' : 'login';
      const res = await axios.post(`${API_URL}/${ep}`, {username: login, password: pass});
      if(res.data.success) {
        if(isReg) { alert("Успешно!"); setIsReg(false); }
        else setUser({username: login});
      }
    } catch(e) { setAuthError(e.response?.data?.error || "Ошибка сервера"); }
  };

  const loadDb = async () => {
    setDbData([]);
    try {
      let url = "";
      if(dbTab==='levels') url = leaderMode==='lv' ? `/leaderboard/levels?lang=${lang}` : `/leaderboard/power?lang=${lang}`;
      if(dbTab==='drop') url = `/droplist?lang=${lang}&iname=${sItem}&mname=${sMon}&place=${sLoc}`;
      if(dbTab==='enhance') url = `/enhancement?lang=${lang}&iname=${sItem}&scroll=${sScroll}`;
      const res = await axios.get(`${API_URL}${url}`);
      setDbData(res.data.data || []);
    } catch {}
  };

  useEffect(() => { if(activeTab==='db') loadDb(); }, [activeTab, dbTab, leaderMode, lang]);

  const headers = () => {
    if (dbTab === 'levels') return leaderMode === 'lv' ? ["ИМЯ", t.h_class, t.h_lvl] : ["ИМЯ", t.h_class, t.h_power];
    if (dbTab === 'drop') return [t.s_item, t.s_mon, t.s_loc];
    if (dbTab === 'enhance') return [t.s_item, t.s_scroll, t.h_chance];
    return [];
  };

  return (
    <div className="app-shell">
      <div className="drag-zone">
        <button className="win-btn min" onClick={() => ipcRenderer && ipcRenderer.send('window-minimize')}></button>
        <button className="win-btn close" onClick={() => ipcRenderer && ipcRenderer.send('window-close')}></button>
      </div>

      {!user ? (
        <div className="auth-overlay">
          <div className="auth-box-static">
            <div className="auth-turbo">TURBO</div>
            <div className="auth-switcher">
                <div className={`switch-btn ${!isReg?'active':''}`} onClick={()=>setIsReg(false)}>{t.in}</div>
                <div className={`switch-btn ${isReg?'active':''}`} onClick={()=>setIsReg(true)}>{t.reg}</div>
            </div>
            <input className="auth-in" placeholder={t.ph_u} value={login} onChange={e=>setLogin(e.target.value)} />
            <input className="auth-in" type="password" placeholder={t.ph_p} value={pass} onChange={e=>setPass(e.target.value)} />
            {authError && <div style={{color:'#ff4757', fontSize:11, marginBottom:10}}>{authError}</div>}
            <button className="btn-continue" onClick={handleAuth}>{t.cont}</button>
            <div style={{marginTop:40, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
               <select className="auth-in" style={{width:'auto', padding:'5px 10px', margin:0, fontSize:11, height:30}} value={lang} onChange={e=>setLang(e.target.value)}>
                  <option value="Russian">RU</option><option value="Korean">KR</option><option value="Chinese">CN</option>
               </select>
               <div style={{cursor:'pointer', fontSize:24}} onClick={()=>setTheme(theme==='light'?'dark':'light')}>{theme==='light'?'☀️':'🌙'}</div>
            </div>
          </div>
        </div>
      ) : (
        <React.Fragment>
          <div className="sidebar">
            <div className="brand">TURBO</div>
            <nav className="nav-menu">
              <div className={`nav-btn ${activeTab==='main'?'active':''}`} onClick={()=>setActiveTab('main')}>{t.main}</div>
              <div className={`nav-btn ${activeTab==='db'?'active':''}`} onClick={()=>setActiveTab('db')}>{t.db}</div>
            </nav>
            <div className="sidebar-footer">
               <div className="account-box">
                  <div className="acc-row">
                      <span className="acc-label">{t.logged}</span>
                      <span className="acc-user">{user.username}</span>
                  </div>
                  <button className="btn-exit-v36" onClick={()=>setUser(null)}>{t.exit}</button>
               </div>
            </div>
          </div>

          <div className="content-area">
            <div className="header-row">
              <div className="sec-title">{t[activeTab]}</div>
              <div style={{display:'flex', gap:15, alignItems:'center'}}>
                 <div className="srv-pill">
                    <div className={`dot ${serverInfo.online?'dot-on':'dot-off'}`}></div>
                    {serverInfo.online ? 'ONLINE' : 'OFFLINE'} | {serverInfo.players}
                 </div>
                 <div style={{cursor:'pointer', fontSize:20}} onClick={()=>setTheme(theme==='light'?'dark':'light')}>{theme==='light'?'☀️':'🌙'}</div>
              </div>
            </div>

            {activeTab==='main' && (
              <div className="dash-layout">
                <div className="card">
                   <div style={{flex:1}}></div> 
                   <div style={{display:'flex', gap:10, marginTop:'auto'}}>
                      <button className="btn-play-v25" style={{flex:2}} onClick={handleLaunch}>{t.play}</button>
                      <button className="btn-util" style={{fontSize:20}} onClick={() => ipcRenderer && ipcRenderer.send('open-settings', clientPath)}>⚙️</button>
                   </div>
                </div>
                <div className="card">
                   <div style={{fontWeight:800, fontSize:14, marginBottom:10}}>КЛИЕНТ</div>
                   <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:10}}>
                      <div style={{flex:1, fontSize:10, color:'var(--muted)', background:'var(--bg-app)', padding:8, borderRadius:8, border:'1px solid var(--border)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
                         {clientPath || 'Путь не указан'}
                      </div>
                      <button className="btn-util" style={{width:40, height:35, fontSize:16}} onClick={() => ipcRenderer && ipcRenderer.send('select-client-path')}>📂</button>
                   </div>
                   <button className="btn-check-update" onClick={()=>setProgress(0)}>{t.check}</button>
                   <div style={{background:'var(--bg-app)', height:8, borderRadius:4, overflow:'hidden'}}>
                      <div style={{width:progress+'%', height:'100%', background:'var(--primary)'}}></div>
                   </div>
                </div>
              </div>
            )}

            {activeTab==='db' && (
              <div className="db-wrap">
                <div className="db-tabs">
                  {['levels','drop','enhance'].map(k => (
                    <div key={k} className={`db-pill ${dbTab===k?'active':''}`} onClick={()=>setDbTab(k)}>{t[k]}</div>
                  ))}
                </div>
                <div className="search-v23">
                   {dbTab==='levels' && (
                        <div className="toggle-group" style={{marginLeft:0, border:'1px solid var(--border)', padding:4, borderRadius:10, background:'var(--bg-side)'}}>
                           <div className={`toggle-btn ${leaderMode==='lv'?'active':''}`} onClick={()=>setLeaderMode('lv')}>{t.h_lvl}</div>
                           <div className={`toggle-btn ${leaderMode==='power'?'active':''}`} onClick={()=>setLeaderMode('power')}>{t.h_power}</div>
                        </div>
                   )}
                   {dbTab==='drop' && (
                      <React.Fragment>
                        <input className="in-v22" placeholder={t.s_item} value={sItem} onChange={e=>setSItem(e.target.value)} onKeyDown={e=>e.key==='Enter'&&loadDb()}/>
                        <input className="in-v22" placeholder={t.s_mon} value={sMon} onChange={e=>setSMon(e.target.value)} onKeyDown={e=>e.key==='Enter'&&loadDb()}/>
                        <input className="in-v22" placeholder={t.s_loc} value={sLoc} onChange={e=>setSLoc(e.target.value)} onKeyDown={e=>e.key==='Enter'&&loadDb()}/>
                        <button className="btn-play-v25" style={{flex:'none', padding:'0 25px', fontSize:12, height:40}} onClick={loadDb}>{t.find}</button>
                      </React.Fragment>
                   )}
                   {dbTab==='enhance' && (
                      <React.Fragment>
                        <input className="in-v22" placeholder={t.s_item} value={sItem} onChange={e=>setSItem(e.target.value)} onKeyDown={e=>e.key==='Enter'&&loadDb()}/>
                        <input className="in-v22" placeholder={t.s_scroll} value={sScroll} onChange={e=>setSScroll(e.target.value)} onKeyDown={e=>e.key==='Enter'&&loadDb()}/>
                        <button className="btn-play-v25" style={{flex:'none', padding:'0 25px', fontSize:12, height:40}} onClick={loadDb}>{t.find}</button>
                      </React.Fragment>
                   )}
                </div>
                <div className="table-container">
                   <div className="table-head"><table className="table-core"><thead><tr>{(dbTab === 'levels' ? (leaderMode === 'lv' ? ["ИМЯ", t.h_class, t.h_lvl] : ["ИМЯ", t.h_class, t.h_power]) : (dbTab === 'drop' ? [t.s_item, t.s_mon, t.s_loc] : [t.s_item, t.s_scroll, t.h_chance])).map((h,idx) => <th key={idx}>{h}</th>)}</tr></thead></table></div>
                   <div className="table-body"><table className="table-core"><tbody>{dbData.map((r,i) => (<tr key={i}>{Object.values(r).map((v,j)=><td key={j}>{v}</td>)}</tr>))}</tbody></table></div>
                </div>
              </div>
            )}
          </div>
        </React.Fragment>
      )}
    </div>
  );
}
export default App;
