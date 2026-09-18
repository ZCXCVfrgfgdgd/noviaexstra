import React,{useEffect,useMemo,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {ArrowLeft,CheckCheck,ChevronRight,Globe2,LogIn,LogOut,Menu,MessageCircle,MoreHorizontal,Plus,Search,Send,Settings,Star,UserPlus,X,Gift} from 'lucide-react';
import {createClient} from '@supabase/supabase-js';
import './styles.css';

const SUPABASE_URL=import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase=SUPABASE_URL&&SUPABASE_KEY?createClient(SUPABASE_URL,SUPABASE_KEY):null;

const seed=[
 {id:'local-max',name:'Max',username:'@max',email:'max@novia.local',avatar:'M'},
 {id:'local-alex',name:'Alex',username:'@alex',email:'alex@novia.local',avatar:'A'},
 {id:'local-nova',name:'Nova',username:'@nova',email:'nova@novia.local',avatar:'N'},
 {id:'local-luna',name:'Luna',username:'@luna',email:'luna@novia.local',avatar:'L'}
];
const localAccounts=()=>JSON.parse(localStorage.getItem('novia-accounts')||'null')||seed;
const saveAccounts=a=>localStorage.setItem('novia-accounts',JSON.stringify(a));
const localMessages=()=>JSON.parse(localStorage.getItem('novia-messages')||'{}');
const saveMessages=m=>localStorage.setItem('novia-messages',JSON.stringify(m));
const localGifts=()=>JSON.parse(localStorage.getItem('novia-gifts')||'null')||[
 {id:'box',name:'NOVIA Box',icon:'🎁',price:50},{id:'crystal',name:'Crystal',icon:'💎',price:100},{id:'moon',name:'Moon',icon:'🌙',price:250},{id:'rocket',name:'Nova Rocket',icon:'🚀',price:500},{id:'crown',name:'Royal Crown',icon:'👑',price:1000}
];
function Avatar({user,size=''}){return user?.avatar_url||user?.avatar?.startsWith('http')?<img className={`avatar ${size}`} src={user.avatar_url||user.avatar}/>:<div className={`avatar avatar-fallback ${size}`}>{user?.avatar||user?.name?.[0]||'?'}</div>}
function Toast({text}){return text?<div className="toast">✓ {text}</div>:null}

function Auth({onAuth}){
 const [mode,setMode]=useState('login'),[method,setMethod]=useState('email'),[value,setValue]=useState(''),[password,setPassword]=useState(''),[name,setName]=useState(''),[username,setUsername]=useState(''),[code,setCode]=useState(''),[otp,setOtp]=useState(false),[error,setError]=useState(''),[loading,setLoading]=useState(false);
 const submit=async e=>{e.preventDefault();setError('');setLoading(true);try{
  if(supabase){
   if(method==='phone'){
    if(!otp){const {error}=await supabase.auth.signInWithOtp({phone:value});if(error)throw error;setOtp(true);return;}
    const {data,error}=await supabase.auth.verifyOtp({phone:value,token:code,type:'sms'});if(error)throw error;if(!data.user)throw new Error('Не удалось войти.');
    const uname=(username||value.replace(/\D/g,'').slice(-8)||`user${Date.now()}`).replace(/^@/,'');
    const profile={id:data.user.id,name:name||'NOVIA User',username:'@'+uname};
    await supabase.from('profiles').upsert(profile,{onConflict:'id'});onAuth(data.user);return;
   }
   if(mode==='register'){
    if(!name||!username)throw new Error('Укажи имя и @username.');
    const uname=username.replace(/^@/,'').replace(/\s/g,'');if(!uname)throw new Error('Некорректный username.');
    const {data,error}=await supabase.auth.signUp({email:value,password});if(error)throw error;
    if(data.user){const {error:pe}=await supabase.from('profiles').upsert({id:data.user.id,name,username:'@'+uname},{onConflict:'id'});if(pe)throw pe;}
    if(data.session)onAuth(data.user);else setError('Аккаунт создан. Подтверди email и затем войди.');return;
   }
   const {data,error}=await supabase.auth.signInWithPassword({email:value,password});if(error)throw error;onAuth(data.user);return;
  }
  const accounts=localAccounts();
  if(method==='phone')throw new Error('Телефон работает в Supabase-режиме.');
  if(mode==='register'){const u='@'+username.replace(/^@/,'').replace(/\s/g,'');if(!name||!value||password.length<6||!username)throw new Error('Заполни все поля.');if(accounts.some(x=>x.username.toLowerCase()===u.toLowerCase()))throw new Error('Username уже занят.');const user={id:'local-'+Date.now(),name,username:u,email:value,password,avatar:name[0].toUpperCase()};saveAccounts([...accounts,user]);onAuth(user);}else{const user=accounts.find(x=>x.email===value&&x.password===password);if(!user)throw new Error('Неверный email или пароль.');onAuth(user);}
 }catch(err){setError(err.message||'Ошибка')}finally{setLoading(false)}};
 return <div className="auth-shell"><div className="auth-card"><div className="auth-logo"><span>N</span><b>NOVIA</b></div><h1>{mode==='login'?'С возвращением':'Создать аккаунт'}</h1><p>{supabase?'Настоящая авторизация NOVIA':'Локальный режим разработки'}</p><div className="auth-tabs"><button className={method==='email'?'chosen':''} onClick={()=>{setMethod('email');setOtp(false)}}>Email</button><button className={method==='phone'?'chosen':''} onClick={()=>setMethod('phone')}>Телефон</button></div><form onSubmit={submit}>
 {mode==='register'&&<><label>Имя<input value={name} onChange={e=>setName(e.target.value)} placeholder="Max"/></label><label>Username<input value={username} onChange={e=>setUsername(e.target.value.replace(/\s/g,''))} placeholder="@username"/></label></>}
 <label>{method==='email'?'Email':'Телефон'}<input value={value} onChange={e=>setValue(e.target.value)} placeholder={method==='email'?'you@example.com':'+380...'} required/></label>
 {method==='email'&&!otp&&<label>Пароль<input type="password" value={password} onChange={e=>setPassword(e.target.value)} minLength="6" required/></label>}
 {method==='phone'&&otp&&<label>Код из SMS<input value={code} onChange={e=>setCode(e.target.value)} inputMode="numeric" maxLength="6" required/></label>}
 {error&&<div className="error">{error}</div>}<button className="primary auth-submit" disabled={loading}>{loading?'Подождите…':method==='phone'?(otp?'Подтвердить код':'Получить код'):mode==='login'?'Войти':'Зарегистрироваться'} <LogIn size={17}/></button>
 </form><button className="auth-switch" onClick={()=>{setMode(mode==='login'?'register':'login');setError('');setOtp(false)}}>{mode==='login'?'Нет аккаунта? Создать':'Уже есть аккаунт? Войти'}</button>{!supabase&&<small className="demo-note">Для реального режима задай VITE_SUPABASE_URL и VITE_SUPABASE_PUBLISHABLE_KEY в Vercel.</small>}</div></div>
}

function App(){
 const [user,setUser]=useState(null),[profile,setProfile]=useState(null),[page,setPage]=useState('chats'),[search,setSearch]=useState(''),[active,setActive]=useState(null),[current,setCurrent]=useState(null),[messages,setMsgs]=useState([]),[message,setMessage]=useState(''),[users,setUsers]=useState([]),[gifts]=useState(localGifts()),[show,setShow]=useState(null),[toast,setToast]=useState(''),[theme,setTheme]=useState(localStorage.getItem('novia-theme')||'dark'),[conversationId,setConversationId]=useState(null);
 useEffect(()=>{document.documentElement.dataset.theme=theme;localStorage.setItem('novia-theme',theme)},[theme]);
 useEffect(()=>{if(!supabase){const id=localStorage.getItem('novia-session');if(id)setUser(localAccounts().find(x=>x.id===id)||null);return;} supabase.auth.getSession().then(({data})=>{if(data.session)setUser(data.session.user)});const {data:{subscription}}=supabase.auth.onAuthStateChange((_e,s)=>setUser(s?.user||null));return()=>subscription.unsubscribe()},[]);
 useEffect(()=>{if(!user)return;if(!supabase){setProfile(user);setUsers(localAccounts().filter(x=>x.id!==user.id));return;} (async()=>{let {data}=await supabase.from('profiles').select('*').eq('id',user.id).single();if(!data){await supabase.from('profiles').insert({id:user.id,name:user.email?.split('@')[0]||'NOVIA User',username:'@'+(user.email?.split('@')[0]||'user')});({data}=await supabase.from('profiles').select('*').eq('id',user.id).single())}setProfile({...user,...data});await searchUsers('');})();},[user]);
 useEffect(()=>{if(!supabase||!conversationId)return;let alive=true;(async()=>{const {data,error}=await supabase.from('messages').select('*').eq('conversation_id',conversationId).order('created_at');if(!error&&alive)setMsgs(data||[]);})();const channel=supabase.channel('messages-'+conversationId).on('postgres_changes',{event:'INSERT',schema:'public',table:'messages',filter:`conversation_id=eq.${conversationId}`},payload=>setMsgs(prev=>prev.some(x=>x.id===payload.new.id)?prev:[...prev,payload.new])).subscribe();return()=>{alive=false;supabase.removeChannel(channel)}},[conversationId]);
 async function searchUsers(q){if(!supabase)return setUsers(localAccounts().filter(x=>x.id!==user?.id&&(x.name+' '+x.username).toLowerCase().includes(q.toLowerCase())));const term=q.trim().replace(/^@/,'');let query=supabase.from('profiles').select('*').neq('id',user.id).limit(30);if(term)query=query.or(`username.ilike.%${term}%,name.ilike.%${term}%`);const {data}=await query;if(data)setUsers(data)}
 useEffect(()=>{if(search)searchUsers(search);else if(supabase&&user)searchUsers('')},[search]);
 async function openChat(u){setCurrent(u);setActive(u.id);setSearch('');if(!supabase){setConversationId(null);return;}const {data,error}=await supabase.rpc('get_or_create_direct_conversation',{target_user_id:u.id});if(error){setToast(error.message);return;}setConversationId(data)}
 async function send(){const text=message.trim();if(!text||!current)return;if(!supabase){const m=localMessages(),key=[user.id,current.id].sort().join('__');const arr=m[key]||[];arr.push({id:Date.now(),sender_id:user.id,text,created_at:new Date().toISOString()});m[key]=arr;saveMessages(m);setMsgs(arr);setMessage('');return;}const {error}=await supabase.from('messages').insert({conversation_id:conversationId,sender_id:user.id,text});if(error)setToast(error.message);else setMessage('')}
 async function sendGift(g){if(!current)return;if(!supabase){const m=localMessages(),key=[user.id,current.id].sort().join('__');const arr=m[key]||[];arr.push({id:Date.now(),sender_id:user.id,text:`🎁 ${g.name}`,gift:g,created_at:new Date().toISOString()});m[key]=arr;saveMessages(m);setMsgs(arr);setShow(null);return;}const {error}=await supabase.from('messages').insert({conversation_id:conversationId,sender_id:user.id,text:`🎁 ${g.name}`,gift:g});if(error)setToast(error.message);else setShow(null)}
 async function logout(){if(supabase)await supabase.auth.signOut();localStorage.removeItem('novia-session');setUser(null);setCurrent(null);setMsgs([])}
 if(!user)return <Auth onAuth={u=>{if(!supabase)localStorage.setItem('novia-session',u.id);setUser(u)}}/>;
 const me=profile||user;const results=users.filter(u=>(u.name+' '+u.username).toLowerCase().includes(search.toLowerCase()));
 return <div className="app-shell"><aside className="sidebar"><div className="brand"><div className="brand-mark">N</div><span>NOVIA</span></div><button className="profile-mini" onClick={()=>setPage('settings')}><Avatar user={me}/><div><b>{me.name}</b><small>{me.username||''}</small></div><ChevronRight size={16}/></button><nav>{[['chats',MessageCircle,'Чаты'],['posts',Globe2,'Публичные'],['stars',Star,'NOVIA STARS'],['settings',Settings,'Настройки']].map(([id,I,l])=><button key={id} className={page===id?'active':''} onClick={()=>setPage(id)}><I size={19}/>{l}</button>)}</nav><div className="sidebar-bottom"><div className="balance-mini"><Star size={16}/> 1 250 Stars</div><button className="logout-btn" onClick={logout}><LogOut size={15}/> Выйти</button></div></aside><main className="main"><header className="mobile-header"><Menu size={20}/><b>NOVIA</b></header>
 {page==='chats'&&<div className="chat-layout"><section className={`chat-list-panel ${active?'hide-mobile':''}`}><div className="section-head"><div><h1>Чаты</h1><small>{supabase?'Supabase · реальные аккаунты':'Локальный режим'}</small></div><button className="round-btn" onClick={()=>setShow('new')}><Plus/></button></div><div className="search"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Найти @username, имя…"/></div><div className="user-results">{search&&results.map(u=><button className="user-result" key={u.id} onClick={()=>openChat(u)}><Avatar user={u}/><div><b>{u.name}</b><small>{u.username}</small></div><MessageCircle size={16}/></button>)}{search&&!results.length&&<p className="muted">Пользователь не найден</p>}</div></section><section className={`chat-window ${active?'show-mobile':''}`}>{!current?<div className="empty"><MessageCircle size={42}/><h2>Выберите диалог</h2><p>Найдите человека по @username.</p></div>:<><div className="chat-top"><button className="back-mobile icon-btn" onClick={()=>setActive(null)}><ArrowLeft/></button><Avatar user={current}/><div><b>{current.name}</b><small>{current.username}</small></div><div className="top-actions"><button className="icon-btn"><MoreHorizontal/></button></div></div><div className="messages">{messages.map(m=><div key={m.id} className={`message-row ${m.sender_id===user.id?'mine':''}`}><div className="bubble">{m.gift&&<div className="chat-gift"><span>{m.gift.icon||'🎁'}</span><b>{m.gift.name}</b></div>}<div>{m.text}</div><span>{new Date(m.created_at).toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'})} {m.sender_id===user.id&&<CheckCheck size={13}/>}</span></div></div>)}</div><div className="composer"><button className="icon-btn" onClick={()=>setShow('gift')}><Gift/></button><input value={message} onChange={e=>setMessage(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder="Написать сообщение…"/><button className="send-btn" onClick={send}><Send size={18}/></button></div></>}</section></div>}
 {page==='posts'&&<Page title="Публичные"><article className="post"><b>Публичные посты</b><p className="post-text">Лента NOVIA готова для подключения таблицы posts.</p></article></Page>}
 {page==='stars'&&<Page title="NOVIA STARS"><div className="stars-hero"><div><span className="eyebrow">ВНУТРЕННЯЯ ВАЛЮТА</span><h1>⭐ NOVIA STARS</h1><p>Подарки и цифровые предметы.</p></div><div className="balance-card"><small>Баланс</small><strong>⭐ 1 250</strong></div></div><div className="gift-grid">{gifts.map(g=><div className="gift-card" key={g.id}><div className="gift-art">{g.icon}</div><b>{g.name}</b><span>⭐ {g.price}</span></div>)}</div></Page>}
 {page==='settings'&&<Page title="Настройки"><div className="settings-card"><h2>Аккаунт</h2><div className="account-line"><Avatar user={me} size="xl"/><div><h3>{me.name}</h3><p>{me.username}</p><small>{me.email||user.email||user.phone||''}</small></div></div><button className="secondary" onClick={()=>setTheme(theme==='dark'?'light':'dark')}>Тема: {theme==='dark'?'тёмная':'светлая'}</button></div></Page>}
 </main>{show==='gift'&&<Modal onClose={()=>setShow(null)}><h2>Подарок</h2><div className="gift-grid compact">{gifts.map(g=><button className="gift-card" key={g.id} onClick={()=>sendGift(g)}><div className="gift-art">{g.icon}</div><b>{g.name}</b><span>⭐ {g.price}</span></button>)}</div></Modal>}{show==='new'&&<Modal onClose={()=>setShow(null)}><h2>Новый чат</h2><div className="search"><Search size={17}/><input autoFocus placeholder="@username" onChange={e=>searchUsers(e.target.value)}/></div>{results.map(u=><button className="user-result" key={u.id} onClick={()=>{openChat(u);setShow(null)}}><Avatar user={u}/><div><b>{u.name}</b><small>{u.username}</small></div><ChevronRight/></button>)}</Modal>}<Toast text={toast}/></div>
}
function Page({title,children}){return <div className="page"><div className="page-head"><div><h1>{title}</h1><p>NOVIA</p></div></div>{children}</div>}
function Modal({children,onClose}){return <div className="modal-backdrop" onMouseDown={e=>e.target===e.currentTarget&&onClose()}><div className="modal">{children}<button className="icon-btn modal-close" onClick={onClose}><X/></button></div></div>}
createRoot(document.getElementById('root')).render(<App/>);
