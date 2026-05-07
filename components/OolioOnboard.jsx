"use client";
import { useState, useRef, useEffect } from "react";

const SK={u:"oo-u4",k:"oo-k4",a:"oo-a4",cl:"oo-cl4",qz:"oo-qz4",pr:"oo-pr4",doc:"oo-doc4"};
const DA=[
  {id:"1",email:"olivia.mayes@oolio.com",name:"Olivia Mayes",password:"oolio2025",role:"admin"},
  {id:"2",email:"bridget.gilmour@oolio.com",name:"Bridget Gilmour",password:"oolio2025",role:"admin"},
];

const SEED_CL=[
  {id:"c1",topic:"Products",title:"Complete the Oolio One product overview",desc:"Understand all Oolioverse modules: POS, Payments, Online Ordering, Kiosk, Loyalty, KDS, Reporting, Order Manager, Gift Cards."},
  {id:"c2",topic:"Products",title:"Learn the six POS brands & their strengths",desc:"Oolio One (cloud), OrderMate (fine dining), Bepoz (pubs/clubs/enterprise), Swiftpos (stadia), Deliverit (QSR/delivery), Idealpos (clubs/retail)."},
  {id:"c3",topic:"Products",title:"Understand the Oolio Way pitch",desc:"17 apps to 7 to 3. Be able to explain the value proposition to a prospect in under 2 minutes."},
  {id:"c4",topic:"Products",title:"Review the hardware range",desc:"POS Terminal, Tablets (TAP ON GLASS 8.7/11/14 inch), mPOS, Payments Terminal. Know specs and use cases."},
  {id:"c5",topic:"Tools",title:"Set up HubSpot access and complete CRM walkthrough",desc:"Log in, review your pipeline, understand deal stages, create a test contact, and run a sequence."},
  {id:"c6",topic:"Tools",title:"Set up UKG and submit a test leave request",desc:"Access UKG, find the My Time Off tile, review your leave balances, and understand the approval workflow."},
  {id:"c7",topic:"Tools",title:"Join all relevant Teams channels",desc:"Oolio One Q&A channels and OM & One | All channels. Know which channel to use for which topic."},
  {id:"c8",topic:"Tools",title:"Bookmark the training and installations calendar",desc:"Access the SyncMatters calendar for upcoming installs and training sessions."},
  {id:"c9",topic:"Process",title:"Shadow a customer demo with a senior BDM",desc:"Sit in on at least one live prospect demo. Take notes on positioning, objection handling, and demo flow."},
  {id:"c10",topic:"Process",title:"Review the Oolio pricing guide",desc:"Understand Core vs Full Service, device pricing, integration add-ons, and how to build a proposal."},
  {id:"c11",topic:"Process",title:"Complete your first prospect research brief",desc:"Use the prospect research process to generate a pre-meeting brief for an upcoming meeting."},
  {id:"c12",topic:"Process",title:"Deliver a mock Oolio Way pitch to your manager",desc:"Present the full Oolio value proposition including the 17 to 7 to 3 story, Oolioverse, and why Oolio Pay."},
];

const SEED_QZ=[{id:"q1",title:"Oolio Products Fundamentals",desc:"Test your knowledge of the Oolio product suite and brand portfolio.",questions:[
  {id:"q1a",type:"mc",q:"Which Oolio POS brand is purpose-built for stadiums and large-format venues?",opts:["OrderMate","Bepoz","Swiftpos","Deliverit"],ans:2},
  {id:"q1b",type:"mc",q:"What is the monthly price of Oolio Full Service per venue?",opts:["$80/month","$120/month","$150/month","$200/month"],ans:2},
  {id:"q1c",type:"tf",q:"Oolio One allows venues to use any third-party payment processor alongside Oolio Pay.",ans:false},
  {id:"q1d",type:"mc",q:"The Oolio Way reduces a venue tech stack from 17 apps down to how many in Phase 2?",opts:["7","5","3","1"],ans:2},
  {id:"q1e",type:"tf",q:"OolioPay offers next-business-day settlements with hospitality trading days running 5am to 4:59am.",ans:true},
  {id:"q1f",type:"mc",q:"Which POS brand is strongest for fine dining and premium restaurant groups?",opts:["Idealpos","OrderMate","Deliverit","Bepoz"],ans:1},
]}];

const SEED_DOC=[
  {id:"d1",title:"Oolio Pricing Guide 2025",cat:"Sales",desc:"Full pricing breakdown for Oolio Core and Full Service plans.",url:"",type:"PDF"},
  {id:"d2",title:"The Oolio Way Presentation",cat:"Sales",desc:"Customer-facing deck covering the Oolio ecosystem and value proposition.",url:"",type:"PPTX"},
];

function sG(k){try{const v=localStorage.getItem(k);return v?JSON.parse(v):null;}catch{return null;}}
function sS(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch{}}

const P="#673AB6",P2="#5E35B1",P3="#3023AE",BG="#FAF8FC";
const lbl={fontSize:11,fontWeight:700,color:P,textTransform:"uppercase",letterSpacing:"0.06em",display:"block",marginBottom:5};
const inp={width:"100%",padding:"10px 14px",border:"2px solid rgba(103,58,182,0.12)",borderRadius:10,fontSize:13,fontFamily:"inherit",outline:"none",background:"#FAFAFD",boxSizing:"border-box"};
const btnS=(active)=>({padding:"10px 16px",borderRadius:10,border:"none",background:active?`linear-gradient(135deg,${P},${P2})`:"transparent",color:active?"white":"#888",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit",transition:"all 0.15s",whiteSpace:"nowrap"});
const card={padding:"14px 16px",background:"white",borderRadius:12,border:"1px solid rgba(103,58,182,0.08)",marginBottom:8,position:"relative"};

const PROMPT=`You are Oolio Onboard, the friendly and energetic onboarding assistant for new BDM/Sales team members at Oolio Group — an Australian hospitality technology company. Purpose: "Facilitating Celebration." Be concise, enthusiastic, helpful. End every response with a brief AI disclaimer like "Just a heads up — my answers are AI-generated, so always double-check with your manager or team member if unsure!"

KEY KNOWLEDGE: 6 POS brands: Oolio One (cloud, modern hospitality), OrderMate (fine dining), Bepoz (pubs/clubs/enterprise), Swiftpos (stadia/large enterprise), Deliverit (QSR/delivery), Idealpos (clubs/retail). Oolio Way: 17 apps to 7 to 3. Pricing: Core $80/mo, Full Service $150/mo. Devices: POS $30, mPOS $20, Kiosk $30, KDS $20, Menu Board $10. OolioPay mandatory with Oolio One, next-day settlements, QR fallback, store-and-forward. Integrations: SevenRooms (two-way), NowBookIt, OpenTable, Xero, MYOB, Deputy, Tanda, CTB&Co, Supy, Restoke.ai, Doshii, Deliverect. CEO: Kris Satish. Head of Sales: Bridget Gilmour. 24/7/365 support. ARCA founding member. 590+ Oolians globally. Oolio Giving: Peter Mac Cancer Foundation, 100% matched.

TEAMS: Oolio One Q&A (General, BackOffice, Discounts/Loyalty, Integrations, Kitchen Ops/KDS, Online Store, POS Software, Products/Menus, Releases, Reports, Workshops). OM & One All (General, OM Accounts/Software/Quick Response, OPOS Marketing/Movement/Tech/Tickets/Values, Red Alerts).

TOOLS: HubSpot (CRM), UKG (HR/leave: My Time Off tile, select type, dates, submit, manager approves), Teams. Training calendar: https://migratemycrm.syncmatters.com/calendah/2893-a750a924715d51a7d72b070c567c2d03125651bca299a003f09b1aa1c683dfff/show`;

function fmt(t){return t.replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/\*(.*?)\*/g,'<em>$1</em>').replace(/\n\n/g,'<br/><br/>').replace(/\n- /g,'<br/>• ').replace(/\n/g,'<br/>');}

function Login({onLogin}){
  const[e,setE]=useState("");const[p,setP]=useState("");const[err,setErr]=useState("");
  const go=()=>{const users=sG(SK.u)||DA;const u=users.find(u=>u.email.toLowerCase()===e.toLowerCase().trim()&&u.password===p);u?onLogin(u):setErr("Email or password not recognised.");};
  return(
    <div style={{height:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:`linear-gradient(160deg,${P},${P3},#1a0d4e)`,fontFamily:"'DM Sans',system-ui,sans-serif"}}>
      <div style={{width:"100%",maxWidth:400,padding:"0 20px"}}>
        <div style={{textAlign:"center",marginBottom:36}}>
          <div style={{width:64,height:64,borderRadius:"50%",background:"rgba(255,255,255,0.12)",display:"inline-flex",alignItems:"center",justifyContent:"center",marginBottom:16,border:"2px solid rgba(255,255,255,0.2)",fontSize:28}}>🟣</div>
          <div style={{fontFamily:"'Fraunces',serif",fontSize:26,fontWeight:700,color:"white"}}>Oolio Onboard</div>
          <div style={{fontSize:13,color:"rgba(255,255,255,0.5)",marginTop:4}}>Sales Team Onboarding Platform</div>
        </div>
        <div style={{background:"rgba(255,255,255,0.07)",borderRadius:18,padding:"28px 24px",border:"1px solid rgba(255,255,255,0.1)"}}>
          <label style={{...lbl,color:"rgba(255,255,255,0.5)"}}>Email</label>
          <input value={e} onChange={x=>{setE(x.target.value);setErr("");}} placeholder="your.name@oolio.com" style={{...inp,background:"rgba(255,255,255,0.06)",border:"2px solid rgba(255,255,255,0.12)",color:"white",marginBottom:14}} onKeyDown={x=>x.key==="Enter"&&go()}/>
          <label style={{...lbl,color:"rgba(255,255,255,0.5)"}}>Password</label>
          <input value={p} onChange={x=>{setP(x.target.value);setErr("");}} type="password" placeholder="Enter password" style={{...inp,background:"rgba(255,255,255,0.06)",border:"2px solid rgba(255,255,255,0.12)",color:"white",marginBottom:8}} onKeyDown={x=>x.key==="Enter"&&go()}/>
          {err&&<div style={{fontSize:12,color:"#FF8A8A",marginBottom:6}}>{err}</div>}
          <div style={{height:10}}/>
          <button onClick={go} style={{width:"100%",padding:"12px",borderRadius:10,border:"none",background:"white",color:P,fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"inherit"}}>Sign In</button>
        </div>
      </div>
    </div>
  );
}

export default function OolioOnboard(){
  const[user,setUser]=useState(null);
  const[view,setView]=useState("chat");
  const[admin,setAdmin]=useState(false);
  const[adminTab,setAdminTab]=useState("dash");
  const[msgs,setMsgs]=useState([{role:"assistant",content:"**Hello Oolian! 👋 How can I help you today?**\n\nI'm your Onboarding Buddy! Ask me about products, pricing, tools, processes, or anything Oolio.\n\n🟣 Brands · 💳 Products · 💰 Pricing · 🛠️ Tools · 📖 Lingo\n\nFire away! 🚀"}]);
  const[input,setInput]=useState("");
  const[loading,setLoading]=useState(false);
  const[kb,setKb]=useState([]);
  const[cl,setCl]=useState([]);
  const[qz,setQz]=useState([]);
  const[docs,setDocs]=useState([]);
  const[prog,setProg]=useState({checks:{},quizzes:{}});
  const[act,setAct]=useState([]);
  const[users,setUsers]=useState([]);
  const[activeQuiz,setActiveQuiz]=useState(null);
  const[qAns,setQAns]=useState({});
  const[qDone,setQDone]=useState(false);
  const[nCl,setNCl]=useState({topic:"Products",title:"",desc:""});
  const[nDoc,setNDoc]=useState({title:"",cat:"Sales",desc:"",url:"",type:"PDF"});
  const[nQz,setNQz]=useState({title:"",desc:"",questions:[]});
  const[nQ,setNQ]=useState({type:"mc",q:"",opts:["","","",""],ans:0});
  const[nUser,setNUser]=useState({name:"",email:"",password:"",role:"user"});
  const[nKb,setNKb]=useState({topic:"",content:""});
  const chatRef=useRef(null);
  const inputRef=useRef(null);

  useEffect(()=>{
    if(!sG(SK.u))sS(SK.u,DA);setUsers(sG(SK.u)||DA);
    setKb(sG(SK.k)||[]);
    const c=sG(SK.cl);setCl(c||SEED_CL);if(!c)sS(SK.cl,SEED_CL);
    const q=sG(SK.qz);setQz(q||SEED_QZ);if(!q)sS(SK.qz,SEED_QZ);
    const d=sG(SK.doc);setDocs(d||SEED_DOC);if(!d)sS(SK.doc,SEED_DOC);
    setAct(sG(SK.a)||[]);
  },[]);

  useEffect(()=>{if(user){const p=sG(SK.pr);setProg(p?.[user.id]||{checks:{},quizzes:{}});}},[user]);
  useEffect(()=>{if(chatRef.current)chatRef.current.scrollTop=chatRef.current.scrollHeight;},[msgs,loading]);

  const save=(key,val,setter)=>{setter(val);sS(key,val);};
  const saveProg=(np)=>{setProg(np);const all=sG(SK.pr)||{};all[user.id]=np;sS(SK.pr,all);};
  const logAct=(q)=>{const a=[...act,{userName:user.name,userEmail:user.email,question:q,timestamp:new Date().toISOString()}].slice(-500);setAct(a);sS(SK.a,a);};

  const send=async()=>{
    if(!input.trim()||loading)return;
    const q=input.trim();setInput("");
    const nm=[...msgs,{role:"user",content:q}];setMsgs(nm);setLoading(true);logAct(q);
    try{
      let sys=PROMPT;
      if(kb.length>0)sys+="\n\nCUSTOM KNOWLEDGE (PRIORITY):\n"+kb.map(e=>e.topic+": "+e.content).join("\n");
      sys+="\n\nCurrent user: "+user.name;
      const am=nm.filter((_,i)=>i>0).map(m=>({role:m.role,content:m.content}));
      const r=await fetch("/api/chat",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({system:sys,messages:am})
      });
      const d=await r.json();
      if(d.error)setMsgs(p=>[...p,{role:"assistant",content:"⚠️ "+d.error}]);
      else setMsgs(p=>[...p,{role:"assistant",content:d.content||"Hmm, try again!"}]);
    }catch(e){setMsgs(p=>[...p,{role:"assistant",content:"⚠️ Connection error: "+e.message}]);}
    setLoading(false);inputRef.current?.focus();
  };

  const toggleCheck=(id)=>{saveProg({...prog,checks:{...prog.checks,[id]:!prog.checks[id]}});};
  const checkPct=cl.length>0?Math.round(Object.values(prog.checks).filter(Boolean).length/cl.length*100):0;

  const submitQuiz=(quiz)=>{
    const score=quiz.questions.reduce((s,q)=>((q.type==="mc"&&qAns[q.id]===q.ans)||(q.type==="tf"&&qAns[q.id]===q.ans))?s+1:s,0);
    saveProg({...prog,quizzes:{...prog.quizzes,[quiz.id]:{score,total:quiz.questions.length,pct:Math.round(score/quiz.questions.length*100),date:new Date().toLocaleDateString("en-AU")}}});
    setQDone(true);
  };

  const topicKW=["pos","pricing","leave","ordermate","bepoz","swiftpos","deliverit","idealpos","oolio one","kds","loyalty","payments","hardware","integrations","training","surcharging","kiosk","qr","reporting"];
  const topicCounts={};act.forEach(a=>{topicKW.forEach(kw=>{if(a.question.toLowerCase().includes(kw))topicCounts[kw]=(topicCounts[kw]||0)+1;});});
  const topTopics=Object.entries(topicCounts).sort((a,b)=>b[1]-a[1]).slice(0,10);
  const userCounts={};act.forEach(a=>{userCounts[a.userName]=(userCounts[a.userName]||0)+1;});
  const topUsers=Object.entries(userCounts).sort((a,b)=>b[1]-a[1]).slice(0,8);

  if(!user)return<Login onLogin={setUser}/>;
  const isAdmin=user.role==="admin";
  const navBtn=(id,label,icon)=><button key={id} onClick={()=>{setView(id);setAdmin(false);setActiveQuiz(null);setQDone(false);}} style={{padding:"10px 0",background:"none",border:"none",color:view===id&&!admin?P:"#999",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',system-ui,sans-serif",display:"flex",flexDirection:"column",alignItems:"center",gap:4,flex:1}}><span style={{fontSize:18}}>{icon}</span>{label}</button>;

  return(
    <div style={{height:"100vh",display:"flex",flexDirection:"column",fontFamily:"'DM Sans',system-ui,sans-serif",background:BG,color:"#1a1a2e",overflow:"hidden"}}>
      {/* HEADER */}
      <div style={{background:`linear-gradient(135deg,${P},${P3})`,padding:"12px 20px",display:"flex",alignItems:"center",gap:12,flexShrink:0}}>
        <div style={{width:36,height:36,borderRadius:"50%",background:"rgba(255,255,255,0.12)",display:"flex",alignItems:"center",justifyContent:"center",border:"2px solid rgba(255,255,255,0.25)",flexShrink:0,fontSize:16}}>🟣</div>
        <div style={{flex:1}}><div style={{fontFamily:"'Fraunces',serif",fontSize:16,fontWeight:700,color:"white"}}>Oolio Onboard</div><div style={{fontSize:11,color:"rgba(255,255,255,0.5)"}}>Hi {user.name.split(" ")[0]} · Sales Onboarding</div></div>
        {isAdmin&&<button onClick={()=>{setAdmin(!admin);setAdminTab("dash");}} style={{padding:"6px 12px",borderRadius:8,border:"1px solid rgba(255,255,255,0.2)",background:admin?"rgba(255,255,255,0.15)":"transparent",color:"white",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>⚙️ Admin</button>}
        <button onClick={()=>setUser(null)} style={{padding:"6px 10px",borderRadius:8,border:"1px solid rgba(255,255,255,0.12)",background:"transparent",color:"rgba(255,255,255,0.6)",fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>Sign Out</button>
      </div>

      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        {/* CHAT */}
        {!admin&&view==="chat"&&<><div ref={chatRef} style={{flex:1,overflowY:"auto",padding:16,display:"flex",flexDirection:"column",gap:12}}>
          {msgs.map((m,i)=><div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start",gap:8}}>
            {m.role==="assistant"&&<div style={{width:28,height:28,borderRadius:"50%",background:`linear-gradient(135deg,${P},${P2})`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:12,color:"white",fontWeight:700,marginTop:2}}>O</div>}
            <div style={{maxWidth:"78%",padding:"10px 14px",borderRadius:m.role==="user"?"14px 14px 3px 14px":"14px 14px 14px 3px",background:m.role==="user"?`linear-gradient(135deg,${P},${P2})`:"white",color:m.role==="user"?"white":"#1a1a2e",fontSize:13,lineHeight:1.6,boxShadow:"0 1px 4px rgba(0,0,0,0.04)",border:m.role==="user"?"none":"1px solid rgba(103,58,182,0.06)"}} dangerouslySetInnerHTML={{__html:fmt(m.content)}}/>
          </div>)}
          {loading&&<div style={{display:"flex",gap:8}}><div style={{width:28,height:28,borderRadius:"50%",background:`linear-gradient(135deg,${P},${P2})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"white",fontWeight:700}}>O</div><div style={{padding:"12px 16px",borderRadius:"14px 14px 14px 3px",background:"white",display:"flex",gap:5}}>{[0,1,2].map(j=><div key={j} style={{width:6,height:6,borderRadius:"50%",background:P,opacity:0.3,animation:`bounce 1.2s ${j*0.15}s infinite`}}/>)}</div></div>}
        </div>
        <div style={{padding:"10px 16px 14px",background:"white",borderTop:"1px solid rgba(103,58,182,0.04)",flexShrink:0}}>
          <div style={{display:"flex",gap:8,background:"#F4F2F7",borderRadius:12,padding:"4px 4px 4px 14px"}}>
            <input ref={inputRef} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Ask me anything..." disabled={loading} style={{flex:1,border:"none",outline:"none",background:"transparent",fontSize:14,fontFamily:"inherit",padding:"8px 0"}}/>
            <button onClick={send} disabled={loading||!input.trim()} style={{width:38,height:38,borderRadius:10,border:"none",background:input.trim()?`linear-gradient(135deg,${P},${P2})`:"#D4D0DA",color:"white",cursor:input.trim()?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M22 2L11 13M22 2L15 22L11 13L2 9L22 2Z"/></svg></button>
          </div>
          <div style={{textAlign:"center",fontSize:10,color:"#ccc",marginTop:6}}>AI-powered · Always verify with your team</div>
        </div></>}

        {/* CHECKLIST */}
        {!admin&&view==="checklist"&&<div style={{flex:1,overflowY:"auto",padding:20}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}><div><div style={{fontFamily:"'Fraunces',serif",fontSize:20,fontWeight:700,color:P}}>My Onboarding</div><div style={{fontSize:12,color:"#999",marginTop:2}}>BDM / Sales Checklist</div></div><div style={{textAlign:"center"}}><div style={{fontSize:28,fontWeight:700,color:P}}>{checkPct}%</div><div style={{fontSize:10,color:"#999"}}>Complete</div></div></div>
          <div style={{height:8,background:"rgba(103,58,182,0.08)",borderRadius:4,marginBottom:24,overflow:"hidden"}}><div style={{height:"100%",width:`${checkPct}%`,background:`linear-gradient(90deg,${P},#03A9F4)`,borderRadius:4,transition:"width 0.5s"}}/></div>
          {["Products","Tools","Process"].map(topic=>{const items=cl.filter(c=>c.topic===topic);if(!items.length)return null;const done=items.filter(c=>prog.checks[c.id]).length;return<div key={topic} style={{marginBottom:24}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}><div style={{fontSize:14,fontWeight:700}}>📂 {topic}</div><div style={{fontSize:11,color:"#999"}}>{done}/{items.length}</div></div>{items.map(c=><div key={c.id} onClick={()=>toggleCheck(c.id)} style={{...card,display:"flex",gap:12,cursor:"pointer",borderColor:prog.checks[c.id]?"rgba(74,222,128,0.3)":"rgba(103,58,182,0.08)",background:prog.checks[c.id]?"rgba(74,222,128,0.03)":"white"}}><div style={{width:22,height:22,borderRadius:6,border:`2px solid ${prog.checks[c.id]?"#4ADE80":P}`,background:prog.checks[c.id]?"#4ADE80":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,color:"white",fontSize:14,fontWeight:700}}>{prog.checks[c.id]?"✓":""}</div><div><div style={{fontSize:13,fontWeight:600,color:prog.checks[c.id]?"#666":"#1a1a2e",textDecoration:prog.checks[c.id]?"line-through":"none"}}>{c.title}</div><div style={{fontSize:12,color:"#999",marginTop:3,lineHeight:1.4}}>{c.desc}</div></div></div>)}</div>;})}
        </div>}

        {/* QUIZZES */}
        {!admin&&view==="quiz"&&<div style={{flex:1,overflowY:"auto",padding:20}}>
          {!activeQuiz?<><div style={{fontFamily:"'Fraunces',serif",fontSize:20,fontWeight:700,color:P,marginBottom:16}}>Knowledge Quizzes</div>{qz.map(q=>{const r=prog.quizzes[q.id];return<div key={q.id} style={{...card,cursor:"pointer"}} onClick={()=>{setActiveQuiz(q);setQAns({});setQDone(false);}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{fontSize:14,fontWeight:600}}>{q.title}</div><div style={{fontSize:12,color:"#999",marginTop:3}}>{q.questions.length} questions</div></div>{r?<div style={{fontSize:22,fontWeight:700,color:r.pct>=80?"#4ADE80":r.pct>=50?"#F59E0B":"#EF4444"}}>{r.pct}%</div>:<div style={{padding:"6px 14px",borderRadius:8,background:"rgba(103,58,182,0.08)",color:P,fontSize:12,fontWeight:600}}>Start</div>}</div></div>;})}{qz.length===0&&<div style={{textAlign:"center",padding:40,color:"#bbb"}}>No quizzes yet</div>}</>:<><button onClick={()=>{setActiveQuiz(null);setQDone(false);}} style={{background:"none",border:"none",color:P,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit",marginBottom:12,padding:0}}>← Back</button><div style={{fontFamily:"'Fraunces',serif",fontSize:18,fontWeight:700,color:P,marginBottom:12}}>{activeQuiz.title}</div>{qDone&&<div style={{padding:14,background:prog.quizzes[activeQuiz.id]?.pct>=80?"rgba(74,222,128,0.08)":"rgba(239,68,68,0.06)",borderRadius:12,marginBottom:16}}><div style={{fontSize:16,fontWeight:700,color:prog.quizzes[activeQuiz.id]?.pct>=80?"#16A34A":"#DC2626"}}>Score: {prog.quizzes[activeQuiz.id]?.score}/{prog.quizzes[activeQuiz.id]?.total} ({prog.quizzes[activeQuiz.id]?.pct}%)</div></div>}{activeQuiz.questions.map((q,qi)=>{const isRight=qDone&&((q.type==="mc"&&qAns[q.id]===q.ans)||(q.type==="tf"&&qAns[q.id]===q.ans));const isWrong=qDone&&qAns[q.id]!==undefined&&!isRight;return<div key={q.id} style={{...card,marginBottom:14,borderColor:isRight?"rgba(74,222,128,0.3)":isWrong?"rgba(239,68,68,0.2)":"rgba(103,58,182,0.08)"}}><div style={{fontSize:13,fontWeight:600,marginBottom:10}}>{qi+1}. {q.q}</div>{q.type==="mc"&&q.opts.map((o,oi)=>{const sel=qAns[q.id]===oi;const cor=qDone&&oi===q.ans;return<div key={oi} onClick={()=>!qDone&&setQAns({...qAns,[q.id]:oi})} style={{padding:"9px 14px",borderRadius:8,border:`2px solid ${cor?"#4ADE80":sel&&isWrong?"#EF4444":sel?P:"rgba(103,58,182,0.1)"}`,marginBottom:6,cursor:qDone?"default":"pointer",fontSize:13,fontWeight:sel?600:400,display:"flex",alignItems:"center",gap:8}}><div style={{width:18,height:18,borderRadius:"50%",border:`2px solid ${sel?P:"#ddd"}`,background:sel?P:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{sel&&<div style={{width:8,height:8,borderRadius:"50%",background:"white"}}/>}</div>{o}</div>;})}{q.type==="tf"&&[true,false].map(v=>{const sel=qAns[q.id]===v;const cor=qDone&&v===q.ans;return<div key={String(v)} onClick={()=>!qDone&&setQAns({...qAns,[q.id]:v})} style={{padding:"9px 14px",borderRadius:8,border:`2px solid ${cor?"#4ADE80":sel&&isWrong?"#EF4444":sel?P:"rgba(103,58,182,0.1)"}`,marginBottom:6,cursor:qDone?"default":"pointer",fontSize:13,fontWeight:sel?600:400,display:"flex",alignItems:"center",gap:8}}><div style={{width:18,height:18,borderRadius:4,border:`2px solid ${sel?P:"#ddd"}`,background:sel?P:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,color:"white",fontSize:11}}>{sel?"✓":""}</div>{v?"True":"False"}</div>;})}</div>;})}{!qDone&&<button onClick={()=>submitQuiz(activeQuiz)} disabled={Object.keys(qAns).length<activeQuiz.questions.length} style={{width:"100%",padding:12,borderRadius:10,border:"none",background:Object.keys(qAns).length>=activeQuiz.questions.length?`linear-gradient(135deg,${P},${P2})`:"#D4D0DA",color:"white",fontWeight:600,fontSize:14,cursor:Object.keys(qAns).length>=activeQuiz.questions.length?"pointer":"default",fontFamily:"inherit"}}>Submit ({Object.keys(qAns).length}/{activeQuiz.questions.length})</button>}</>}
        </div>}

        {/* DOCS */}
        {!admin&&view==="docs"&&<div style={{flex:1,overflowY:"auto",padding:20}}>
          <div style={{fontFamily:"'Fraunces',serif",fontSize:20,fontWeight:700,color:P,marginBottom:16}}>Document Library</div>
          {["Sales","Product","Training","Process","Other"].map(cat=>{const items=docs.filter(d=>d.cat===cat);if(!items.length)return null;return<div key={cat} style={{marginBottom:20}}><div style={{fontSize:13,fontWeight:700,marginBottom:8}}>📁 {cat}</div>{items.map(d=><div key={d.id} style={{...card,display:"flex",alignItems:"center",gap:12}}><div style={{width:40,height:40,borderRadius:10,background:"rgba(103,58,182,0.06)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:10,fontWeight:700,color:P}}>{d.type}</div><div style={{flex:1,minWidth:0}}><div style={{fontSize:13,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{d.title}</div><div style={{fontSize:11,color:"#999",marginTop:2}}>{d.desc}</div></div>{d.url?<a href={d.url} target="_blank" rel="noopener noreferrer" style={{padding:"6px 12px",borderRadius:8,background:"rgba(103,58,182,0.08)",color:P,fontSize:11,fontWeight:600,textDecoration:"none",flexShrink:0}}>Open ↗</a>:<span style={{fontSize:11,color:"#ccc"}}>No link</span>}</div>)}</div>;})}
          {docs.length===0&&<div style={{textAlign:"center",padding:40,color:"#bbb"}}>No documents yet</div>}
        </div>}

        {/* ADMIN */}
        {admin&&isAdmin&&<div style={{flex:1,overflowY:"auto",padding:20}}>
          <div style={{display:"flex",gap:4,marginBottom:16,flexWrap:"wrap"}}>{[["dash","📊 Activity"],["kb","🧠 Knowledge"],["clist","✅ Checklists"],["quiz","🎯 Quizzes"],["docmgr","📄 Docs"],["usrs","👥 Users"]].map(([id,l])=><button key={id} onClick={()=>setAdminTab(id)} style={btnS(adminTab===id)}>{l}</button>)}</div>

          {adminTab==="dash"&&<div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:20}}>{[["Queries",act.length],["Users",Object.keys(userCounts).length],["KB",kb.length]].map(([l,v],i)=><div key={i} style={{padding:16,background:"rgba(103,58,182,0.04)",borderRadius:12,textAlign:"center"}}><div style={{fontSize:24,fontWeight:700,color:P}}>{v}</div><div style={{fontSize:10,color:"#999"}}>{l}</div></div>)}</div><div style={lbl}>Top Users</div>{topUsers.map(([n,c],i)=><div key={i} style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}><div style={{flex:1,fontSize:13,fontWeight:600}}>{n}</div><div style={{width:100,height:6,background:"rgba(103,58,182,0.08)",borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:`${(c/(topUsers[0]?.[1]||1))*100}%`,background:P,borderRadius:3}}/></div><div style={{fontSize:12,fontWeight:700,color:P,width:30,textAlign:"right"}}>{c}</div></div>)}<div style={{height:16}}/><div style={lbl}>Top Topics</div><div style={{display:"flex",flexWrap:"wrap",gap:6}}>{topTopics.map(([t,c],i)=><div key={i} style={{padding:"5px 11px",borderRadius:100,background:"rgba(103,58,182,0.06)",fontSize:11,fontWeight:600,color:P}}>{t} <span style={{background:P,color:"white",borderRadius:100,padding:"1px 6px",fontSize:9,marginLeft:4}}>{c}</span></div>)}</div><div style={{height:16}}/><div style={lbl}>Recent</div>{act.slice(-8).reverse().map((a,i)=><div key={i} style={{padding:"6px 8px",fontSize:12,borderRadius:4,marginBottom:2,background:i%2===0?"rgba(103,58,182,0.02)":"transparent"}}><span style={{fontWeight:600,color:P}}>{a.userName}</span> <span style={{color:"#888"}}>{a.question.slice(0,80)}</span></div>)}</div>}

          {adminTab==="kb"&&<div><input value={nKb.topic} onChange={e=>setNKb({...nKb,topic:e.target.value})} placeholder="Topic / Question" style={{...inp,marginBottom:8}}/><textarea value={nKb.content} onChange={e=>setNKb({...nKb,content:e.target.value})} placeholder="Correct answer..." style={{...inp,minHeight:60,resize:"vertical",marginBottom:8}}/><button onClick={()=>{if(!nKb.topic.trim()||!nKb.content.trim())return;save(SK.k,[...kb,{topic:nKb.topic.trim(),content:nKb.content.trim(),author:user.name,date:new Date().toLocaleDateString("en-AU")}],setKb);setNKb({topic:"",content:""});}} style={{...btnS(true),width:"100%",marginBottom:16}}>Add Knowledge</button>{kb.map((e,i)=><div key={i} style={card}><div style={{fontSize:13,fontWeight:600,paddingRight:28}}>{e.topic}</div><div style={{fontSize:12,color:"#666",marginTop:3}}>{e.content}</div><div style={{fontSize:10,color:"#aaa",marginTop:4}}>{e.author} · {e.date}</div><button onClick={()=>save(SK.k,kb.filter((_,j)=>j!==i),setKb)} style={{position:"absolute",top:12,right:12,background:"rgba(220,50,50,0.06)",border:"none",color:"#DC3232",borderRadius:6,width:24,height:24,cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button></div>)}</div>}

          {adminTab==="clist"&&<div><div style={{display:"flex",gap:6,marginBottom:8}}>{["Products","Tools","Process"].map(t=><button key={t} onClick={()=>setNCl({...nCl,topic:t})} style={{...btnS(nCl.topic===t),fontSize:11,padding:"7px 14px"}}>{t}</button>)}</div><input value={nCl.title} onChange={e=>setNCl({...nCl,title:e.target.value})} placeholder="Task title" style={{...inp,marginBottom:8}}/><textarea value={nCl.desc} onChange={e=>setNCl({...nCl,desc:e.target.value})} placeholder="Description" style={{...inp,minHeight:50,resize:"vertical",marginBottom:8}}/><button onClick={()=>{if(!nCl.title.trim())return;save(SK.cl,[...cl,{id:"c"+Date.now(),topic:nCl.topic,title:nCl.title.trim(),desc:nCl.desc.trim()}],setCl);setNCl({...nCl,title:"",desc:""});}} style={{...btnS(true),width:"100%",marginBottom:16}}>Add Task</button>{["Products","Tools","Process"].map(t=>{const items=cl.filter(c=>c.topic===t);if(!items.length)return null;return<div key={t}><div style={{fontSize:13,fontWeight:700,marginBottom:8}}>📂 {t} ({items.length})</div>{items.map(c=><div key={c.id} style={card}><div style={{fontSize:13,fontWeight:600,paddingRight:28}}>{c.title}</div><div style={{fontSize:11,color:"#888",marginTop:3}}>{c.desc}</div><button onClick={()=>save(SK.cl,cl.filter(x=>x.id!==c.id),setCl)} style={{position:"absolute",top:12,right:12,background:"rgba(220,50,50,0.06)",border:"none",color:"#DC3232",borderRadius:6,width:24,height:24,cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button></div>)}<div style={{height:12}}/></div>;})}</div>}

          {adminTab==="quiz"&&<div><div style={{...card,background:"rgba(103,58,182,0.02)",border:"1.5px solid rgba(103,58,182,0.1)"}}><input value={nQz.title} onChange={e=>setNQz({...nQz,title:e.target.value})} placeholder="Quiz title" style={{...inp,marginBottom:8}}/><input value={nQz.desc} onChange={e=>setNQz({...nQz,desc:e.target.value})} placeholder="Description" style={{...inp,marginBottom:10}}/><div style={lbl}>Add Question</div><div style={{display:"flex",gap:6,marginBottom:8}}>{["mc","tf"].map(t=><button key={t} onClick={()=>setNQ({...nQ,type:t,opts:t==="mc"?["","","",""]:[],ans:t==="tf"?true:0})} style={{...btnS(nQ.type===t),fontSize:11,padding:"6px 12px"}}>{t==="mc"?"Multiple Choice":"True / False"}</button>)}</div><input value={nQ.q} onChange={e=>setNQ({...nQ,q:e.target.value})} placeholder="Question" style={{...inp,marginBottom:8}}/>{nQ.type==="mc"&&nQ.opts.map((o,i)=><div key={i} style={{display:"flex",gap:6,marginBottom:6}}><input value={o} onChange={e=>{const no=[...nQ.opts];no[i]=e.target.value;setNQ({...nQ,opts:no});}} placeholder={`Option ${i+1}`} style={{...inp,flex:1}}/><button onClick={()=>setNQ({...nQ,ans:i})} style={{padding:"8px 10px",borderRadius:8,border:`2px solid ${nQ.ans===i?"#4ADE80":"rgba(103,58,182,0.1)"}`,background:nQ.ans===i?"rgba(74,222,128,0.08)":"transparent",color:nQ.ans===i?"#16A34A":"#999",fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>{nQ.ans===i?"✓ Correct":"Mark"}</button></div>)}{nQ.type==="tf"&&<div style={{display:"flex",gap:8,marginBottom:8}}>{[true,false].map(v=><button key={String(v)} onClick={()=>setNQ({...nQ,ans:v})} style={{...btnS(nQ.ans===v),flex:1,fontSize:12}}>{v?"True":"False"}{nQ.ans===v?" ✓":""}</button>)}</div>}<button onClick={()=>{if(!nQ.q.trim())return;setNQz({...nQz,questions:[...nQz.questions,{id:"qq"+Date.now(),type:nQ.type,q:nQ.q.trim(),opts:nQ.type==="mc"?nQ.opts:[],ans:nQ.ans}]});setNQ({type:"mc",q:"",opts:["","","",""],ans:0});}} style={{...btnS(true),width:"100%",marginBottom:6}}>Add Question ({nQz.questions.length})</button>{nQz.questions.map((q,i)=><div key={i} style={{fontSize:12,padding:"5px 8px",background:"rgba(103,58,182,0.03)",borderRadius:6,marginBottom:3,display:"flex",justifyContent:"space-between"}}><span>{i+1}. {q.q.slice(0,45)}...</span><button onClick={()=>setNQz({...nQz,questions:nQz.questions.filter((_,j)=>j!==i)})} style={{background:"none",border:"none",color:"#DC3232",cursor:"pointer"}}>✕</button></div>)}<div style={{height:8}}/><button onClick={()=>{if(!nQz.title.trim()||!nQz.questions.length)return;save(SK.qz,[...qz,{id:"qz"+Date.now(),title:nQz.title.trim(),desc:nQz.desc.trim(),questions:nQz.questions}],setQz);setNQz({title:"",desc:"",questions:[]});}} style={{width:"100%",padding:11,borderRadius:10,border:"none",background:nQz.title.trim()&&nQz.questions.length?`linear-gradient(90deg,${P},#03A9F4)`:"#D4D0DA",color:"white",fontWeight:700,fontSize:13,cursor:nQz.title.trim()&&nQz.questions.length?"pointer":"default",fontFamily:"inherit"}}>Publish Quiz</button></div><div style={{height:16}}/><div style={lbl}>Published ({qz.length})</div>{qz.map(q=><div key={q.id} style={card}><div style={{fontSize:13,fontWeight:600,paddingRight:28}}>{q.title}</div><div style={{fontSize:11,color:"#888",marginTop:3}}>{q.questions.length} questions</div><button onClick={()=>save(SK.qz,qz.filter(x=>x.id!==q.id),setQz)} style={{position:"absolute",top:12,right:12,background:"rgba(220,50,50,0.06)",border:"none",color:"#DC3232",borderRadius:6,width:24,height:24,cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button></div>)}</div>}

          {adminTab==="docmgr"&&<div><input value={nDoc.title} onChange={e=>setNDoc({...nDoc,title:e.target.value})} placeholder="Document title" style={{...inp,marginBottom:8}}/><input value={nDoc.desc} onChange={e=>setNDoc({...nDoc,desc:e.target.value})} placeholder="Description" style={{...inp,marginBottom:8}}/><input value={nDoc.url} onChange={e=>setNDoc({...nDoc,url:e.target.value})} placeholder="Link (SharePoint, Drive, Dropbox...)" style={{...inp,marginBottom:8}}/><div style={{display:"flex",gap:4,marginBottom:8,flexWrap:"wrap"}}>{["Sales","Product","Training","Process","Other"].map(c=><button key={c} onClick={()=>setNDoc({...nDoc,cat:c})} style={{...btnS(nDoc.cat===c),fontSize:10,padding:"6px 10px"}}>{c}</button>)}</div><div style={{display:"flex",gap:4,marginBottom:8}}>{["PDF","PPTX","DOCX","XLSX","Link"].map(t=><button key={t} onClick={()=>setNDoc({...nDoc,type:t})} style={{...btnS(nDoc.type===t),fontSize:10,padding:"6px 10px"}}>{t}</button>)}</div><button onClick={()=>{if(!nDoc.title.trim())return;save(SK.doc,[...docs,{id:"d"+Date.now(),...nDoc,title:nDoc.title.trim(),desc:nDoc.desc.trim()}],setDocs);setNDoc({title:"",cat:"Sales",desc:"",url:"",type:"PDF"});}} style={{...btnS(true),width:"100%",marginBottom:16}}>Add Document</button>{docs.map(d=><div key={d.id} style={{...card,display:"flex",alignItems:"center",gap:10}}><div style={{flex:1,minWidth:0}}><div style={{fontSize:13,fontWeight:600}}>{d.title}</div><div style={{fontSize:10,color:"#999"}}>{d.cat} · {d.type}</div></div><button onClick={()=>save(SK.doc,docs.filter(x=>x.id!==d.id),setDocs)} style={{background:"rgba(220,50,50,0.06)",border:"none",color:"#DC3232",borderRadius:6,width:24,height:24,cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>✕</button></div>)}</div>}

          {adminTab==="usrs"&&<div><div style={{...card,background:"rgba(103,58,182,0.02)",border:"1.5px solid rgba(103,58,182,0.1)",marginBottom:16}}><input value={nUser.name} onChange={e=>setNUser({...nUser,name:e.target.value})} placeholder="Full name" style={{...inp,marginBottom:8}}/><input value={nUser.email} onChange={e=>setNUser({...nUser,email:e.target.value})} placeholder="email@oolio.com" style={{...inp,marginBottom:8}}/><input value={nUser.password} onChange={e=>setNUser({...nUser,password:e.target.value})} placeholder="Password" style={{...inp,marginBottom:8}}/><div style={{display:"flex",gap:8,marginBottom:10}}>{["user","admin"].map(r=><button key={r} onClick={()=>setNUser({...nUser,role:r})} style={{...btnS(nUser.role===r),flex:1,fontSize:11}}>{r==="admin"?"🔑 Admin":"👤 User"}</button>)}</div><button onClick={()=>{if(!nUser.name.trim()||!nUser.email.trim()||!nUser.password.trim())return;const nu=[...users,{id:Date.now().toString(),...nUser,name:nUser.name.trim(),email:nUser.email.trim()}];sS(SK.u,nu);setUsers(nu);setNUser({name:"",email:"",password:"",role:"user"});}} style={{...btnS(true),width:"100%"}}>Add User</button></div>{users.map(u=><div key={u.id} style={{...card,display:"flex",alignItems:"center",gap:10}}><div style={{width:32,height:32,borderRadius:"50%",background:u.role==="admin"?`linear-gradient(135deg,${P},${P2})`:"#E0D8ED",color:u.role==="admin"?"white":P,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0}}>{u.name.split(" ").map(n=>n[0]).join("")}</div><div style={{flex:1}}><div style={{fontSize:13,fontWeight:600}}>{u.name}</div><div style={{fontSize:11,color:"#999"}}>{u.email}</div></div><button onClick={()=>{if(u.id===user.id)return;const nu=users.map(x=>x.id===u.id?{...x,role:x.role==="admin"?"user":"admin"}:x);sS(SK.u,nu);setUsers(nu);}} style={{padding:"3px 8px",borderRadius:6,border:"1px solid rgba(103,58,182,0.15)",background:u.role==="admin"?"rgba(103,58,182,0.08)":"transparent",color:P,fontSize:10,fontWeight:700,cursor:u.id===user.id?"default":"pointer",opacity:u.id===user.id?0.5:1,fontFamily:"inherit",textTransform:"uppercase"}}>{u.role}</button>{u.id!==user.id&&<button onClick={()=>{const nu=users.filter(x=>x.id!==u.id);sS(SK.u,nu);setUsers(nu);}} style={{background:"rgba(220,50,50,0.06)",border:"none",color:"#DC3232",borderRadius:6,width:24,height:24,cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>}</div>)}</div>}
        </div>}
      </div>

      {!admin&&<div style={{display:"flex",borderTop:"1px solid rgba(103,58,182,0.06)",background:"white",flexShrink:0,padding:"4px 0 6px"}}>{navBtn("chat","Chat","💬")}{navBtn("checklist","Onboarding","✅")}{navBtn("quiz","Quizzes","🎯")}{navBtn("docs","Documents","📄")}</div>}
      <style>{`@keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-4px)}}::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:rgba(103,58,182,0.1);border-radius:3px}input::placeholder,textarea::placeholder{color:#aaa}`}</style>
    </div>
  );
}
