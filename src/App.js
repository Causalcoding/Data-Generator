import { useState, useCallback } from "react";

// ─── Theme ────────────────────────────────────────────────────────────────────
const accent       = "#00D4AA";
const accentBlue   = "#7B8CDE";
const accentAmber  = "#F0A500";
const bg           = "#0A0E1A";
const surface      = "#111827";
const surfaceLight = "#1C2538";
const border       = "#1F2D45";
const textPrimary  = "#F0F4FF";
const textSecondary= "#8899BB";

// ─── External Model Constants ─────────────────────────────────────────────────
const EXT_CHANNELS = ["conference","detailing","e_mails","rebates","social_media","webinar"];

// ─── Pharma Channel Library ───────────────────────────────────────────────────
const PHARMA_CHANNEL_LIBRARY = {
  "Digital & Remote": ["e_detailing","email_blasts","webinar","virtual_meetings","banner_ads","search_ads","programmatic","social_media","patient_portal"],
  "Field Force":      ["detailing","lunch_and_learn","speaker_programs","medical_education","nurse_educator","field_reimbursement"],
  "Events & CME":     ["conference","symposium","advisory_board","CME_events","congress","roundtable"],
  "Patient & DTC":    ["DTC_TV","DTC_digital","patient_support","copay_card","patient_apps","OOH"],
  "Trade & Access":   ["rebates","formulary_support","sample_drops","GPO_contracts","pull_through","payer_education"],
  "Medical Affairs":  ["MSL_visits","publications","HEOR","KOL_engagement","medical_grants"],
};
const ALL_PHARMA_CHANNELS = Object.values(PHARMA_CHANNEL_LIBRARY).flat();
const CUSTOM_CHANNELS_KEY = "mmx_custom_channels_v1";

function loadStoredChannels() {
  try { return JSON.parse(localStorage.getItem(CUSTOM_CHANNELS_KEY) || "[]"); } catch{ return []; }
}
function saveStoredChannels(arr) {
  try { localStorage.setItem(CUSTOM_CHANNELS_KEY, JSON.stringify(arr)); } catch{}
}
const EQUATIONS    = { conference:"EXP",detailing:"EXP",e_mails:"EXP",rebates:"LIN",social_media:"EXP",webinar:"EXP" };
const RC_DEFAULTS  = {
  conference:   {ShortTermA:42.95,Curvature:0.0413,mROI:2.65,AdstockMonths:3,DecayLambda:0.3},
  detailing:    {ShortTermA:48.71,Curvature:0.0494,mROI:2.41,AdstockMonths:3,DecayLambda:0.3},
  e_mails:      {ShortTermA:36.55,Curvature:0.0154,mROI:4.67,AdstockMonths:3,DecayLambda:0.3},
  rebates:      {ShortTermA:12.21,Curvature:1.0000,mROI:0.00,AdstockMonths:0,DecayLambda:0.0},
  social_media: {ShortTermA:29.35,Curvature:0.5025,mROI:4.06,AdstockMonths:3,DecayLambda:0.3},
  webinar:      {ShortTermA:34.65,Curvature:0.2044,mROI:3.24,AdstockMonths:3,DecayLambda:0.3},
};
const HCP_COUNT_BY_SEGMENT = {High:500,Low:329,Medium:471};
const TRX_LAGS_BY_SEGMENT  = {High:[0.086938,0.081709,0.049345],Low:[0.088434,0.067251,0.068371],Medium:[0.111169,0.063119,0.065146]};
const INTERCEPT_BY_SEGMENT = {High:51.842221,Low:49.116333,Medium:45.273283};

// ─── Shared Style Helpers ─────────────────────────────────────────────────────
const S = {
  app:          {fontFamily:"'DM Mono','Courier New',monospace",background:bg,minHeight:"100vh",color:textPrimary,padding:"24px",boxSizing:"border-box"},
  header:       {marginBottom:"28px",borderBottom:`1px solid ${border}`,paddingBottom:"18px`"},
  title:        {fontSize:"20px",fontWeight:"700",letterSpacing:"0.05em",color:textPrimary,margin:0,display:"flex",alignItems:"center",gap:"10px"},
  subtitle:     {fontSize:"12px",color:textSecondary,marginTop:"6px",letterSpacing:"0.02em"},
  badge:        (c=accent)=>({background:c,color:bg,fontSize:"10px",fontWeight:"700",padding:"3px 8px",borderRadius:"4px",letterSpacing:"0.1em"}),
  panel:        {background:surface,border:`1px solid ${border}`,borderRadius:"10px",padding:"20px"},
  sectionLabel: {fontSize:"10px",fontWeight:"700",letterSpacing:"0.15em",color:accent,textTransform:"uppercase",marginBottom:"12px",display:"block"},
  field:        {marginBottom:"13px"},
  label:        {display:"block",fontSize:"11px",color:textSecondary,marginBottom:"5px",letterSpacing:"0.04em"},
  input:        {width:"100%",background:surfaceLight,border:`1px solid ${border}`,borderRadius:"7px",color:textPrimary,padding:"10px 12px",fontSize:"13px",boxSizing:"border-box",outline:"none",fontFamily:"inherit"},
  checkBtn:     (active,c=accent)=>({padding:"5px 12px",borderRadius:"5px",border:`1px solid ${active?c:border}`,background:active?`${c}22`:"transparent",color:active?c:textSecondary,fontSize:"12px",cursor:"pointer",fontFamily:"inherit",transition:"all 0.15s"}),
  primaryBtn:   (c=accent)=>({width:"100%",padding:"12px",background:c,color:bg,border:"none",borderRadius:"8px",fontFamily:"inherit",fontWeight:"700",fontSize:"13px",letterSpacing:"0.08em",cursor:"pointer",marginTop:"8px"}),
  downloadBtn:  {padding:"5px 14px",border:`1px solid ${accent}`,borderRadius:"5px",background:"transparent",color:accent,fontSize:"11px",fontFamily:"inherit",cursor:"pointer",fontWeight:"600",letterSpacing:"0.05em"},
  th:           {textAlign:"left",padding:"5px 8px",borderBottom:`1px solid ${border}`,color:textSecondary,fontWeight:"600",whiteSpace:"nowrap"},
  td:           {padding:"4px 8px",borderBottom:`1px solid ${border}22`,color:textPrimary,whiteSpace:"nowrap"},
  divider:      {borderColor:border,margin:"14px 0"},
  grid2:        {display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"},
  mainGrid:     {display:"grid",gridTemplateColumns:"400px 1fr",gap:"28px",alignItems:"start"},
  stat:         {display:"inline-block",background:`${accent}15`,border:`1px solid ${accent}33`,borderRadius:"5px",padding:"3px 10px",fontSize:"11px",color:accent,marginRight:"8px",marginBottom:"8px"},
  backBtn:      {background:"none",border:`1px solid ${border}`,color:textSecondary,borderRadius:"6px",padding:"3px 10px",fontSize:"12px",cursor:"pointer",fontFamily:"inherit",marginRight:"4px"},
};

// ─── Utilities ────────────────────────────────────────────────────────────────
function generateMonths(start, end) {
  const months = [];
  let [sy,sm] = start.split("-").map(Number);
  const [ey,em] = end.split("-").map(Number);
  while (sy<ey||(sy===ey&&sm<=em)) { months.push(sy*100+sm); sm++; if(sm>12){sm=1;sy++;} }
  return months;
}
// Shift a YYYY-MM string back by N months
function shiftMonthBack(yyyymm, n) {
  let [y,m] = yyyymm.split("-").map(Number);
  m -= n;
  while (m <= 0) { m += 12; y--; }
  return `${y}-${String(m).padStart(2,"0")}`;
}
function toCSV(rows) {
  if (!rows.length) return "";
  const h = Object.keys(rows[0]);
  return [h.join(","), ...rows.map(r=>h.map(k=>{const v=r[k]??""; return String(v).includes(",")?`"${v}"`:v;}).join(","))].join("\n");
}
function downloadCSV(fn, rows) {
  const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([toCSV(rows)],{type:"text/csv"})); a.download=fn; a.click();
}
function rnd(min,max){return Math.random()*(max-min)+min;}

// ─── External Model Builders ──────────────────────────────────────────────────
function buildExtSales(cfg){
  const extStart = shiftMonthBack(cfg.startDate, cfg.nSalesLag);
  const modelingStartYM = parseInt(cfg.startDate.replace("-",""));
  return generateMonths(extStart, cfg.endDate).flatMap(ym=>
    cfg.segments.map(seg=>{
      const u=Math.round((cfg.salesUnits[seg]||100000)*(1+(Math.random()-0.5)*0.1));
      return{yearmonth:ym,Segment_column:seg,Sales_Unit:u,Unit_Price:cfg.unitPrice,Sales:u*cfg.unitPrice,Period_Type:ym<modelingStartYM?"Lag_Period":"Model_Period"};
    })
  );
}
function buildExtSpend(cfg){
  const extStart = shiftMonthBack(cfg.startDate, cfg.nSalesLag);
  const modelingStartYM = parseInt(cfg.startDate.replace("-",""));
  const rows=[];
  for(const seg of cfg.segments)for(const ch of cfg.channels)for(const ym of generateMonths(extStart,cfg.endDate)){
    const pu=Math.round((cfg.promoUnits[seg]?.[ch]||12000)*(1+(Math.random()-0.5)*0.08));
    // support flat, per-segment, or full matrix costs
    const uc = cfg.promoCostMatrix
      ? (cfg.promoCostMatrix[ch]?.[seg] ?? cfg.promoCosts?.[ch] ?? 30)
      : (cfg.promoCosts?.[ch] ?? 30);
    rows.push({Segment_column:seg,yearmonth:ym,Channel:ch,Promotional_units:pu,Promotion_Unit_Cost:parseFloat(uc).toFixed(6),Spend:(pu*parseFloat(uc)).toFixed(6),Period_Type:ym<modelingStartYM?"Lag_Period":"Model_Period"});
  }
  return rows;
}
function buildExtRC(cfg){
  const rows=[];
  for(const seg of cfg.segments)for(const ch of cfg.channels){
    const d=RC_DEFAULTS[ch];const lags=TRX_LAGS_BY_SEGMENT[seg];
    rows.push({Brand:cfg.brand,Level:seg,Channel:ch,ShortTermA:d.ShortTermA.toFixed(6),Curvature:d.Curvature.toFixed(6),TRx_lag_1:lags[0].toFixed(6),TRx_lag_2:lags[1].toFixed(6),TRx_lag_3:lags[2].toFixed(6),HCP_Count:HCP_COUNT_BY_SEGMENT[seg],Sales_Unit_Price:cfg.unitPrice,Equation:EQUATIONS[ch],Model_Granularity:"Monthly",Model_Time_Period:cfg.modelTimePeriod,ShortTerm_Impact:"",LongTermA:d.ShortTermA.toFixed(6),Historical_LT_Period:cfg.ltPeriod,Adjusted_Curvature:d.Curvature.toFixed(6),ScalarPredicedToActual:1,Intercept:INTERCEPT_BY_SEGMENT[seg].toFixed(6),Adstock_Type:"Lambda",Adstock_Months:d.AdstockMonths,Decay_Lambda:d.DecayLambda,PromotionalLag_coeff1:0,PromotionalLag_coeff2:0,PromotionalLag_coeff3:0,PromotionalLag_coeff4:0,PromotionalLag_coeff5:0,PromotionalLag_coeff6:0,Model_type:"Linear",Nsales_lag:cfg.nSalesLag,Modeling_start_date:cfg.startDate.split("-").reverse().join("-").replace(/(\d{4})-(\d{2})-(\d{2})/,"$3-$2-$1"),Modeling_end_date:cfg.endDate.split("-").reverse().join("-").replace(/(\d{4})-(\d{2})-(\d{2})/,"$3-$2-$1"),Control_variables:ch==="rebates"?1:0,Historical_Reach:100,mROI:d.mROI.toFixed(6)});
  }
  return rows;
}

// ─── Internal Model: Basic Model Builder ─────────────────────────────────────
function buildBasicModel(cfg) {
  const {nSegments,nHCP,nMonths,nChannels,nAdstock,noiseRatio,secondaryNoise,
         valueIntercept,valueAsymptote,valueLag,startMonth,
         distPoisson,distNormal,distFlat,trExp,trLog,trPower,trLinear,curvature} = cfg;

  // Normalize ratios
  const dSum=distPoisson+distNormal+distFlat||1;
  const tSum=trExp+trLog+trPower+trLinear||1;
  const distW=[distPoisson/dSum,distNormal/dSum,distFlat/dSum];
  const trW  =[trExp/tSum,trLog/tSum,trPower/tSum,trLinear/tSum];

  function pickDist(){ const r=Math.random(),cum=[distW[0],distW[0]+distW[1],1]; return cum.findIndex(x=>r<=x); }
  function pickTr()  { const r=Math.random();let c=0;for(let i=0;i<trW.length;i++){c+=trW[i];if(r<=c)return i;}return 0; }

  // HCPs, months, segments
  const hcps=Array.from({length:nHCP},(_,i)=>`HCP_${i+1}`);
  const [sy,sm]=startMonth.split("-").map(Number);
  let y=sy,m=sm;
  const months=Array.from({length:nMonths},()=>{const s=`${y}-${String(m).padStart(2,"0")}-01`;m++;if(m>12){m=1;y++;}return s;});
  const segs=Array.from({length:nSegments},(_,i)=>`SEG_${i+1}`);
  const channels=Array.from({length:nChannels},(_,i)=>`Ch_${i+1}`);

  // Assign HCPs to segments (geometric decay weighting)
  const segWeights=segs.map((_,i)=>Math.pow(0.7,i+1));
  const segCum=segWeights.map((w,i,a)=>a.slice(0,i+1).reduce((s,v)=>s+v,0)/segWeights.reduce((s,v)=>s+v,0));
  const hcpSeg={};
  hcps.forEach(h=>{const r=Math.random();hcpSeg[h]=segs[segCum.findIndex(c=>r<=c)]||segs[segs.length-1];});

  // Channel metadata
  const chDist=channels.map(()=>["Poisson","Normal","Flat"][pickDist()]);
  const chTr=channels.map(()=>["NEG_EXP","LOG","POWER","LINEAR"][pickTr()]);
  const chAdstock=channels.map(()=>parseFloat(rnd(0.1,0.9).toFixed(2)));

  // Channel means per segment
  const chMeans={};
  segs.forEach(seg=>{
    chMeans[seg]={};
    channels.forEach((ch,ci)=>{
      let base=rnd(1,5);
      if(chTr[ci]==="POWER"||chTr[ci]==="LINEAR") base=Math.sqrt(base);
      let m2=base;
      segs.forEach(s=>{if(!chMeans[s])chMeans[s]={};chMeans[s][ch]=m2;m2*=rnd(0.9,1.2);});
    });
  });

  // Asymptotes per segment/channel
  const chAsymp={};
  segs.forEach(seg=>{chAsymp[seg]={};channels.forEach(ch=>{chAsymp[seg][ch]=rnd(valueAsymptote*0.5,valueAsymptote*1.5);});});

  // Intercepts and lags per segment
  const segIntercept={};segs.forEach((s,i)=>segIntercept[s]=rnd(valueIntercept*(i===0?0.9:0.9),valueIntercept*(i===0?1.1:1.5)));
  const segLagSum={};segs.forEach((s,i)=>segLagSum[s]=Math.min(0.99,rnd(valueLag*0.9,valueLag*1.1)));

  // Build skeleton rows
  const rows=[];
  hcps.forEach(hcp=>{
    months.forEach(month=>{
      const seg=hcpSeg[hcp];
      const row={HCP_ID:hcp,Month_ID:month,Segment:seg};
      channels.forEach((ch,ci)=>{
        const mean=chMeans[seg][ch]||2;
        let val;
        if(chDist[ci]==="Poisson") val=Math.max(0,Math.round(mean+(Math.random()<0.5?1:-1)*Math.sqrt(mean)*Math.random()*2));
        else if(chDist[ci]==="Normal") val=Math.max(0,mean+mean*(Math.random()-0.5)*2);
        else val=2*mean*Math.random();
        row[ch]=parseFloat(val.toFixed(4));
      });
      rows.push(row);
    });
  });

  // Adstock per HCP-channel
  const hcpMonthIdx={};
  hcps.forEach(h=>{ hcpMonthIdx[h]={}; months.forEach((m,i)=>hcpMonthIdx[h][m]=i); });

  // Group rows by HCP for adstock
  const byHCP={};
  rows.forEach(r=>{if(!byHCP[r.HCP_ID])byHCP[r.HCP_ID]=[];byHCP[r.HCP_ID].push(r);});

  rows.forEach(r=>{
    const hRows=byHCP[r.HCP_ID];
    const mIdx=months.indexOf(r.Month_ID);
    channels.forEach((ch,ci)=>{
      let ads=0;
      for(let j=0;j<=nAdstock;j++){
        const srcIdx=mIdx-j;
        if(srcIdx>=0){ads+=(hRows[srcIdx]?.[ch]||0)*Math.pow(chAdstock[ci],j);}
      }
      r[ch+"_adstocked"]=parseFloat(ads.toFixed(4));
    });
  });

  // Transformation
  rows.forEach(r=>{
    const seg=r.Segment;
    channels.forEach((ch,ci)=>{
      const ads=r[ch+"_adstocked"];
      const meanA=chMeans[seg][ch]||1;
      const cv=curvature/meanA;
      let tr;
      if(chTr[ci]==="NEG_EXP")      tr=1-Math.exp(-ads*cv);
      else if(chTr[ci]==="LOG")      tr=Math.log(1+ads*cv);
      else if(chTr[ci]==="POWER")    tr=Math.pow(Math.max(0,ads),curvature);
      else                           tr=ads;
      r[ch+"_transformed"]=parseFloat(tr.toFixed(6));
      r[ch+"_final"]=parseFloat((tr*(chAsymp[seg][ch]||5)).toFixed(6));
    });
  });

  // Dependent variable (simplified: intercept + sum channel_final + noise, no actual lag solve)
  rows.forEach(r=>{
    const seg=r.Segment;
    const chSum=channels.reduce((s,ch)=>s+(r[ch+"_final"]||0),0);
    const baseVal=(segIntercept[seg]||valueIntercept)+chSum;
    const noise=(Math.random()-0.5)*2*noiseRatio*baseVal;
    const lagNoise=(Math.random()-0.5)*2*secondaryNoise*baseVal;
    r.Sales=Math.max(0,parseFloat((baseVal+noise+lagNoise).toFixed(4)));
    r.Channel_Contribution=parseFloat(chSum.toFixed(4));
    r.Intercept_Value=parseFloat((segIntercept[seg]||valueIntercept).toFixed(4));
  });

  // Build the two output files
  // File 1: Panel Data (HCP x Month with channels)
  const panelCols=["HCP_ID","Month_ID","Segment",...channels,...channels.map(c=>c+"_adstocked"),"Sales","Channel_Contribution","Intercept_Value"];
  const panelRows=rows.map(r=>{const o={};panelCols.forEach(c=>o[c]=r[c]??0);return o;});

  // File 2: RC / Config file (per segment x channel)
  const configRows=[];
  segs.forEach(seg=>{
    channels.forEach((ch,ci)=>{
      configRows.push({
        Segment:seg, Channel:ch, Distribution:chDist[ci], Transformation:chTr[ci],
        Adstock_Lambda:chAdstock[ci], Mean_Promo:parseFloat((chMeans[seg][ch]||0).toFixed(4)),
        Asymptote:parseFloat((chAsymp[seg][ch]||0).toFixed(4)),
        Intercept:parseFloat((segIntercept[seg]||0).toFixed(4)),
        LagSum:parseFloat((segLagSum[seg]||0).toFixed(4)),
        Curvature:curvature,
      });
    });
  });

  return {panelRows, configRows, meta:{nRows:rows.length,nCols:panelCols.length,segs,channels,chDist,chTr}};
}

// ─── Internal Model: DMA Builder ─────────────────────────────────────────────
function buildDMAPair(cfg) {
  const months=generateMonths(cfg.startDate,cfg.endDate);
  const dmas=Array.from({length:cfg.nDMA},(_,i)=>`DMA_${i+1}`);
  const channels=cfg.dmaChannels;

  const salesRows=[];
  const spendRows=[];

  dmas.forEach(dma=>{
    months.forEach(ym=>{
      const baseUnits=Math.round(rnd(cfg.minSales,cfg.maxSales));
      const noise=1+(Math.random()-0.5)*0.1;
      const units=Math.round(baseUnits*noise);
      salesRows.push({yearmonth:ym,DMA:dma,Sales_Unit:units,Unit_Price:cfg.unitPrice,Sales:units*cfg.unitPrice});

      channels.forEach(ch=>{
        const grp=Math.round(rnd(cfg.minSpend,cfg.maxSpend));
        const cost=parseFloat(rnd(10,60).toFixed(4));
        spendRows.push({yearmonth:ym,DMA:dma,Channel:ch,GRP:grp,Cost_Per_GRP:cost,Spend:parseFloat((grp*cost).toFixed(4))});
      });
    });
  });

  return {salesRows,spendRows};
}

// ─── Reusable UI ─────────────────────────────────────────────────────────────
function BackBtn({onBack,label="← Back"}){return <button style={S.backBtn} onClick={onBack}>{label}</button>;}
function SectionLabel({children,color=accent}){return <span style={{...S.sectionLabel,color}}>{children}</span>;}
function Divider(){return <hr style={S.divider}/>;}
function Field({label,children}){return <div style={S.field}><label style={S.label}>{label}</label>{children}</div>;}
function Input({value,onChange,type="text",step}){return <input style={S.input} type={type} step={step} value={value} onChange={e=>onChange(e.target.value)}/>;}
function NumInput({value,onChange,step=1}){return <Input type="number" step={step} value={value} onChange={v=>onChange(Number(v))}/>;}

function PreviewPanel({files,activeTab,setActiveTab,tabKeys}){
  if(!files) return(
    <div style={{...S.panel,textAlign:"center",padding:"60px 20px"}}>
      <div style={{fontSize:"40px",marginBottom:"16px",opacity:0.3}}>◈</div>
      <p style={{color:textSecondary,fontSize:"13px"}}>Configure settings and click<br/><strong style={{color:accent}}>GENERATE FILES</strong></p>
    </div>
  );
  const f=files[activeTab];
  return(
    <div style={S.panel}>
      <div style={{display:"flex",gap:"8px",marginBottom:"16px",flexWrap:"wrap"}}>
        {tabKeys.map(t=><button key={t} onClick={()=>setActiveTab(t)} style={{padding:"5px 16px",borderRadius:"6px",border:`1px solid ${activeTab===t?accent:border}`,background:activeTab===t?`${accent}22`:"transparent",color:activeTab===t?accent:textSecondary,fontSize:"12px",cursor:"pointer",fontFamily:"inherit",fontWeight:"700"}}>{t}</button>)}
      </div>
      {f&&<>
        <div style={{marginBottom:"12px"}}>
          <span style={S.stat}>Rows: <strong>{f.rows.length}</strong></span>
          <span style={S.stat}>Cols: <strong>{Object.keys(f.rows[0]||{}).length}</strong></span>
        </div>
        <div style={{display:"flex",justifyContent:"flex-end",marginBottom:"10px"}}>
          <button style={S.downloadBtn} onClick={()=>downloadCSV(f.label,f.rows)}>↓ {f.label}</button>
        </div>
        <div style={{overflowX:"auto",maxHeight:"220px",overflowY:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:"11px"}}>
            <thead><tr>{f.cols.map(c=><th key={c} style={S.th}>{c}</th>)}</tr></thead>
            <tbody>{f.rows.slice(0,40).map((r,i)=><tr key={i}>{f.cols.map(c=><td key={c} style={S.td}>{r[c]}</td>)}</tr>)}</tbody>
          </table>
          {f.rows.length>40&&<div style={{textAlign:"center",padding:"8px",color:textSecondary,fontSize:"11px"}}>Showing 40 of {f.rows.length} rows</div>}
        </div>
        <div style={{marginTop:"16px",borderTop:`1px solid ${border}`,paddingTop:"14px",display:"flex",gap:"10px",flexWrap:"wrap"}}>
          <span style={{...S.label,alignSelf:"center"}}>Download all:</span>
          {tabKeys.map(t=><button key={t} style={{...S.downloadBtn,borderColor:border,color:textSecondary}} onClick={()=>downloadCSV(files[t].label,files[t].rows)}>{files[t].label}</button>)}
        </div>
      </>}
    </div>
  );
}

// ─── SCREEN: Landing ──────────────────────────────────────────────────────────
function LandingScreen({onSelect}){
  const [hov,setHov]=useState(null);
  const opts=[
    {id:"external",label:"External Model",badge:"MMX",color:accent,icon:"⬡",desc:"Generate RC_File, Sales_File & Spend_File for external MMx model ingestion.",files:["RC_File.csv","Sales_File.csv","Spend_File.csv"],available:true},
    {id:"internal",label:"Internal Model",badge:"INT",color:accentBlue,icon:"◈",desc:"Generate synthetic datasets for internal model development and validation.",files:["Panel_Data.csv","Config_File.csv","DMA_Sales.csv","DMA_Spend.csv"],available:true},
  ];
  return(
    <div style={S.app}>
      <div style={{...S.header,paddingBottom:"18px"}}>
        <h1 style={S.title}><span style={S.badge()}>MMX</span>Model File Designer</h1>
        <p style={S.subtitle}>Select the model type to configure and generate sample data files</p>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"24px",maxWidth:"800px",margin:"60px auto 0"}}>
        {opts.map(opt=>{
          const isH=hov===opt.id;
          return(
            <div key={opt.id} onMouseEnter={()=>setHov(opt.id)} onMouseLeave={()=>setHov(null)} onClick={()=>opt.available&&onSelect(opt.id)}
              style={{background:isH?`${opt.color}0D`:surface,border:`1px solid ${isH?opt.color:border}`,borderRadius:"14px",padding:"32px 28px",cursor:opt.available?"pointer":"default",transition:"all 0.2s",position:"relative",overflow:"hidden"}}>
              <div style={{fontSize:"38px",marginBottom:"16px",color:opt.color,lineHeight:1}}>{opt.icon}</div>
              <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"12px"}}>
                <span style={S.badge(opt.color)}>{opt.badge}</span>
                <span style={{fontSize:"16px",fontWeight:"700"}}>{opt.label}</span>
              </div>
              <p style={{fontSize:"12px",color:textSecondary,lineHeight:"1.6",margin:"0 0 18px"}}>{opt.desc}</p>
              <div style={{display:"flex",flexWrap:"wrap",gap:"6px"}}>
                {opt.files.map(f=><span key={f} style={{fontSize:"10px",padding:"3px 8px",borderRadius:"4px",background:`${opt.color}18`,border:`1px solid ${opt.color}33`,color:opt.color}}>{f}</span>)}
              </div>
              {opt.available&&<div style={{marginTop:"22px",fontSize:"12px",color:opt.color,fontWeight:"700",letterSpacing:"0.08em",opacity:isH?1:0,transition:"opacity 0.2s"}}>SELECT & CONFIGURE →</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── SCREEN: Internal Sub-Options ─────────────────────────────────────────────
function InternalSubScreen({onSelect,onBack}){
  const [hov,setHov]=useState(null);
  const opts=[
    {id:"basicmodel",label:"Basic Model Dataset",badge:"BASIC",color:accentBlue,icon:"◫",desc:"Generate a fully synthetic HCP-level panel dataset with configurable segments, channels, adstock, transformations, and dependent variable — based on the internal model reference code.",files:["Panel_Data.csv","Config_File.csv"]},
    {id:"dma",label:"DMA Model Dataset Pair",badge:"DMA",color:accentAmber,icon:"⊞",desc:"Generate geographically-structured DMA-level Sales and Spend datasets with GRP data, suitable for geo-level marketing mix modeling.",files:["DMA_Sales.csv","DMA_Spend.csv"]},
  ];
  return(
    <div style={S.app}>
      <div style={{...S.header,paddingBottom:"18px"}}>
        <h1 style={S.title}><BackBtn onBack={onBack}/><span style={S.badge(accentBlue)}>INT</span>Internal Model — Select Dataset Type</h1>
        <p style={S.subtitle}>Choose the type of internal model dataset to generate</p>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"24px",maxWidth:"800px",margin:"50px auto 0"}}>
        {opts.map(opt=>{
          const isH=hov===opt.id;
          return(
            <div key={opt.id} onMouseEnter={()=>setHov(opt.id)} onMouseLeave={()=>setHov(null)} onClick={()=>onSelect(opt.id)}
              style={{background:isH?`${opt.color}0D`:surface,border:`1px solid ${isH?opt.color:border}`,borderRadius:"14px",padding:"30px 26px",cursor:"pointer",transition:"all 0.2s"}}>
              <div style={{fontSize:"36px",marginBottom:"14px",color:opt.color,lineHeight:1}}>{opt.icon}</div>
              <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"10px"}}>
                <span style={S.badge(opt.color)}>{opt.badge}</span>
                <span style={{fontSize:"15px",fontWeight:"700"}}>{opt.label}</span>
              </div>
              <p style={{fontSize:"12px",color:textSecondary,lineHeight:"1.6",margin:"0 0 16px"}}>{opt.desc}</p>
              <div style={{display:"flex",flexWrap:"wrap",gap:"6px"}}>
                {opt.files.map(f=><span key={f} style={{fontSize:"10px",padding:"3px 8px",borderRadius:"4px",background:`${opt.color}18`,border:`1px solid ${opt.color}33`,color:opt.color}}>{f}</span>)}
              </div>
              <div style={{marginTop:"20px",fontSize:"12px",color:opt.color,fontWeight:"700",letterSpacing:"0.08em",opacity:isH?1:0,transition:"opacity 0.2s"}}>CONFIGURE →</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Segment Type Presets ─────────────────────────────────────────────────────
const SEGMENT_PRESETS = {
  volume:      { label:"Drug Volume",    icon:"💊", desc:"Based on Rx/TRx prescribing volume", options:[["High","Medium","Low"],["High","Medium","Low","Very Low"],["Very High","High","Medium","Low","Very Low"]] },
  geography:   { label:"Geography",      icon:"🗺️", desc:"US states, regions or territories",   options:[["Northeast","Southeast","Midwest","Southwest","West"],["East","Central","West"],["NY","CA","TX","FL","IL","PA","OH","GA"]] },
  specialty:   { label:"HCP Specialty",  icon:"🩺", desc:"Physician specialty segments",        options:[["Cardiologist","Internist","GP","Neurologist"],["Oncologist","Hematologist","Internist","NP/PA"],["Rheumatologist","Dermatologist","GP","Specialist"]] },
  decile:      { label:"Decile / Tier",  icon:"📊", desc:"Decile or tier-based HCP segments",  options:[["Tier1","Tier2","Tier3"],["D1","D2","D3","D4","D5"],["Top20","Mid30","Low50"]] },
  alphanumeric:{ label:"Alphanumeric",   icon:"🔢", desc:"Generic coded segment identifiers",  options:[["SEG_A","SEG_B","SEG_C"],["S01","S02","S03","S04"],["GRP1","GRP2","GRP3","GRP4","GRP5"]] },
  custom:      { label:"Custom",         icon:"✏️", desc:"Define your own segment names",       options:[] },
};

function buildDefaultSalesUnits(segs){ return Object.fromEntries(segs.map((s,i)=>([s, Math.max(5000, Math.round(180000 * Math.pow(0.82, i)))]))); }
function buildDefaultPromoUnits(segs, channels){ return Object.fromEntries(segs.map((s,i)=>([s, Object.fromEntries(channels.map(ch=>([ch, Math.round(12000*Math.pow(0.75,i))])))  ]))); }

// ─── SCREEN: External Model Designer ─────────────────────────────────────────
function ExternalDesigner({onBack}){
  const defaultSegs = ["High","Medium","Low"];

  const [cfg,setCfg]=useState({
    brand:"brand", segments:[...defaultSegs], channels:[...EXT_CHANNELS],
    startDate:"2023-01", endDate:"2024-03", unitPrice:80, modelTimePeriod:12, nSalesLag:3, ltPeriod:36,
    salesUnits:buildDefaultSalesUnits(defaultSegs),
    promoUnits:buildDefaultPromoUnits(defaultSegs, EXT_CHANNELS),
    promoCosts:{conference:31.84,detailing:28.50,e_mails:5.20,rebates:45.00,social_media:12.00,webinar:18.00},
  });

  // Segment builder state
  const [segType,setSegType]   = useState("volume");
  const [nSegs,setNSegs]       = useState(3);
  const [customSegInput,setCustomSegInput] = useState("");
  const [customSegs,setCustomSegs]         = useState([]);
  const [chosenPreset,setChosenPreset]     = useState(0); // index into preset options[]

  // Channel builder state
  const [nChannels,setNChannels]             = useState(6);
  const [chMode,setChMode]                   = useState("library");  // "library" | "random" | "custom"
  const [customChInput,setCustomChInput]     = useState("");
  const [savedChannels,setSavedChannels]     = useState(loadStoredChannels);

  // Promo cost granularity
  const [costMode,setCostMode] = useState("channel"); // "channel" | "segment" | "matrix"

  // Accordion open/close state
  const [openSections,setOpenSections] = useState({identity:true,segments:false,channels:false,sales:false,promo:false});
  const toggleSection = (key) => setOpenSections(o=>({...o,[key]:!o[key]}));

  const [gen,setGen]=useState(null);
  const [tab,setTab]=useState("RC");

  const setN=(path,val)=>setCfg(c=>{const ks=path.split(".");const cl=JSON.parse(JSON.stringify(c));let o=cl;for(let i=0;i<ks.length-1;i++)o=o[ks[i]];o[ks[ks.length-1]]=isNaN(val)?val:Number(val);return cl;});

  // Derive available preset options filtered to nSegs
  const preset = SEGMENT_PRESETS[segType];
  const presetOptions = preset.options; // arrays of names

  // Apply segment selection to cfg
  const applySegments = useCallback((segs) => {
    setCfg(c => {
      const newSalesUnits = buildDefaultSalesUnits(segs);
      const newPromoUnits = buildDefaultPromoUnits(segs, c.channels);
      return { ...c, segments: segs, salesUnits: newSalesUnits, promoUnits: newPromoUnits };
    });
  }, []);

  // Apply channel list to cfg, rebuilding promoCosts and promoUnits
  const applyChannels = useCallback((chs) => {
    setCfg(c => {
      const newPromoCosts = Object.fromEntries(chs.map(ch => [ch, c.promoCosts?.[ch] ?? parseFloat((Math.random()*50+5).toFixed(2))]));
      const newPromoUnits = Object.fromEntries(c.segments.map(seg => [seg, Object.fromEntries(chs.map(ch => [ch, c.promoUnits?.[seg]?.[ch] ?? Math.round(8000 * Math.pow(0.75, c.segments.indexOf(seg)))]))]));
      return { ...c, channels: chs, promoCosts: newPromoCosts, promoUnits: newPromoUnits };
    });
  }, []);

  const randomPickChannels = useCallback((n) => {
    const pool = [...ALL_PHARMA_CHANNELS];
    const picked = [];
    while(picked.length < Math.min(n, pool.length)){
      const idx = Math.floor(Math.random() * pool.length);
      picked.push(pool.splice(idx,1)[0]);
    }
    // pad with generic if n > pool
    while(picked.length < n) picked.push(`Ch_${picked.length+1}`);
    return picked;
  }, []);


  const addCustomChannel = useCallback(() => {
    const v = customChInput.trim().replace(/\s+/g,"_");
    if(!v) return;
    const updated = cfg.channels.includes(v) ? cfg.channels : [...cfg.channels, v];
    applyChannels(updated);
    setNChannels(updated.length);
    // save to persistent memory
    if(!savedChannels.includes(v)){
      const next = [...savedChannels, v];
      setSavedChannels(next);
      saveStoredChannels(next);
    }
    setCustomChInput("");
  }, [customChInput, cfg.channels, savedChannels, applyChannels]);

  const removeChannel = useCallback((ch) => {
    const updated = cfg.channels.filter(x => x !== ch);
    applyChannels(updated);
    setNChannels(updated.length);
  }, [cfg.channels, applyChannels]);

  const toggleLibChannel = useCallback((ch) => {
    const updated = cfg.channels.includes(ch) ? cfg.channels.filter(x=>x!==ch) : [...cfg.channels, ch];
    applyChannels(updated);
    setNChannels(updated.length);
  }, [cfg.channels, applyChannels]);

  const deleteSavedChannel = (ch) => {
    const next = savedChannels.filter(x=>x!==ch);
    setSavedChannels(next);
    saveStoredChannels(next);
  };

  // When type or preset index changes, auto-apply if not custom
  const handleSegTypeChange = (type) => {
    setSegType(type);
    setChosenPreset(0);
    if(type !== "custom"){
      // keep current nSegs, regenerate names for new type
      applySegments(generateSegNames(type, nSegs));
    }
  };

  const handlePresetPick = (idx) => {
    setChosenPreset(idx);
    const opts = presetOptions[idx];
    setNSegs(opts.length);
    applySegments(opts);
  };

  // Generate segment names for any count 1-100 from a preset type
  const generateSegNames = (type, count) => {
    const prefixes = {
      volume:       (i,n) => { const labels=["Very High","High","Medium","Low","Very Low","Minimal"]; return i < labels.length ? labels[i] : `Vol_${i+1}`; },
      geography:    (i,n) => { const states=["NY","CA","TX","FL","IL","PA","OH","GA","NC","MI","NJ","VA","WA","AZ","MA","TN","IN","MO","MD","WI","CO","MN","SC","AL","LA","KY","OR","OK","CT","UT","IA","NV","AR","MS","KS","NM","NE","WV","ID","HI","NH","ME","RI","MT","DE","SD","ND","AK","VT","WY"]; return i < states.length ? states[i] : `GEO_${i+1}`; },
      specialty:    (i,n) => { const sp=["Cardiologist","Internist","GP","Neurologist","Oncologist","Rheumatologist","Dermatologist","Hematologist","NP_PA","Endocrinologist","Pulmonologist","Gastroenterologist","Nephrologist","Urologist","Psychiatrist"]; return i < sp.length ? sp[i] : `Specialty_${i+1}`; },
      decile:       (i,n) => n <= 10 ? `D${i+1}` : `Tier_${i+1}`,
      alphanumeric: (i,n) => n <= 26 ? `SEG_${String.fromCharCode(65+i)}` : `S${String(i+1).padStart(2,"0")}`,
    };
    const fn = prefixes[type] || ((i)=>`SEG_${i+1}`);
    return Array.from({length:count}, (_,i) => fn(i, count));
  };

  // For non-custom: generate names for any count 1-100
  const handleNSegsChange = (n) => {
    const capped = Math.max(1, Math.min(100, n));
    setNSegs(capped);
    if(segType === "custom"){
      // pad or trim custom list
      if(customSegs.length >= capped){
        applySegments(customSegs.slice(0, capped));
      } else {
        const padded = [...customSegs, ...Array.from({length:capped-customSegs.length},(_,i)=>`Custom_${customSegs.length+i+1}`)];
        applySegments(padded);
      }
    } else {
      applySegments(generateSegNames(segType, capped));
    }
  };

  const addCustomSeg = () => {
    const v = customSegInput.trim().replace(/\s+/g,"_");
    if(v && !customSegs.includes(v)){
      const next = [...customSegs, v];
      setCustomSegs(next);
      setNSegs(next.length);
      applySegments(next);
    }
    setCustomSegInput("");
  };
  const removeCustomSeg = (s) => {
    const next = customSegs.filter(x=>x!==s);
    setCustomSegs(next);
    setNSegs(next.length);
    applySegments(next);
  };

  // Initialise missing promoCost keys when mode or channels/segments change
  const getPromoCost = (ch, seg) => {
    if(costMode === "channel")  return cfg.promoCosts?.[ch]         ?? 30;
    if(costMode === "segment")  return cfg.promoCosts?.[seg]        ?? 30;
    if(costMode === "matrix")   return cfg.promoCosts?.[`${seg}__${ch}`] ?? 30;
    return 30;
  };
  const setPromoCost = (ch, seg, val) => {
    const key = costMode === "channel" ? ch : costMode === "segment" ? seg : `${seg}__${ch}`;
    setCfg(c => ({ ...c, promoCosts: { ...c.promoCosts, [key]: Number(val) } }));
  };

  const handleGen=useCallback(()=>{
    // Flatten promoCosts into per-channel costs for buildExtSpend
    const flatCosts = {};
    cfg.channels.forEach(ch => {
      cfg.segments.forEach(seg => {
        if(!flatCosts[ch]) flatCosts[ch] = {};
        flatCosts[ch][seg] = getPromoCost(ch, seg);
      });
    });
    setGen({
      sales: buildExtSales(cfg),
      spend: buildExtSpend({...cfg, promoCostMatrix: flatCosts}),
      rc:    buildExtRC(cfg),
    });
    setTab("RC");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[cfg, costMode]);

  const files=gen?{
    RC:    {label:"RC_File.csv",    rows:gen.rc,    cols:["Brand","Level","Channel","ShortTermA","Curvature","mROI","Equation","Adstock_Months","Decay_Lambda","Nsales_lag","Historical_LT_Period"]},
    Sales: {label:"Sales_File.csv", rows:gen.sales, cols:["yearmonth","Segment_column","Sales_Unit","Unit_Price","Sales","Period_Type"]},
    Spend: {label:"Spend_File.csv", rows:gen.spend, cols:["Segment_column","yearmonth","Channel","Promotional_units","Promotion_Unit_Cost","Spend","Period_Type"]},
  }:null;


  return(
    <div style={S.app}>
      <div style={{...S.header,paddingBottom:"18px"}}>
        <h1 style={S.title}><BackBtn onBack={onBack}/><span style={S.badge()}>MMX</span>External Model File Designer</h1>
        <p style={S.subtitle}>Configure inputs to generate RC_File · Sales_File · Spend_File</p>
      </div>
      <div style={S.mainGrid}>
        <div style={{...S.panel, maxHeight:"88vh", overflowY:"auto", padding:"0"}}>

          {/* ── Accordion Helper ── */}
          {[
            {
              key:"identity", label:"Model Identity", icon:"🏷️",
              summary:`${cfg.brand} · ${cfg.startDate} → ${cfg.endDate} · $${cfg.unitPrice}/unit`,
              content:(
                <div style={{padding:"16px 20px"}}>
                  <Field label="Brand Name"><Input value={cfg.brand} onChange={v=>setCfg(c=>({...c,brand:v}))}/></Field>
                  <div style={S.grid2}>
                    <Field label="Start (YYYY-MM)"><Input value={cfg.startDate} onChange={v=>setCfg(c=>({...c,startDate:v}))}/></Field>
                    <Field label="End (YYYY-MM)"><Input value={cfg.endDate} onChange={v=>setCfg(c=>({...c,endDate:v}))}/></Field>
                  </div>
                  <div style={S.grid2}>
                    <Field label="Unit Price ($)"><NumInput value={cfg.unitPrice} onChange={v=>setCfg(c=>({...c,unitPrice:v}))}/></Field>
                    <Field label="Model Period (mo)"><NumInput value={cfg.modelTimePeriod} onChange={v=>setCfg(c=>({...c,modelTimePeriod:v}))}/></Field>
                  </div>
                  <div style={S.grid2}>
                    <Field label="# Sales Lags">
                      <NumInput value={cfg.nSalesLag} onChange={v=>setCfg(c=>({...c,nSalesLag:Math.max(0,v)}))}/>
                      <span style={{fontSize:"10px",color:textSecondary,marginTop:"4px",display:"block"}}>
                        Extends back <strong style={{color:accent}}>{cfg.nSalesLag} mo</strong> → start: <strong style={{color:accent}}>{shiftMonthBack(cfg.startDate,cfg.nSalesLag)}</strong>
                      </span>
                    </Field>
                    <Field label="LT Period (months)">
                      <NumInput value={cfg.ltPeriod} onChange={v=>setCfg(c=>({...c,ltPeriod:Math.max(1,v)}))}/>
                      <span style={{fontSize:"10px",color:textSecondary,marginTop:"4px",display:"block"}}>
                        Typical: <strong style={{color:accent}}>24</strong> · <strong style={{color:accent}}>36</strong> · <strong style={{color:accent}}>48</strong>
                      </span>
                    </Field>
                  </div>
                </div>
              )
            },
            {
              key:"segments", label:"Segments", icon:"👥",
              summary:`${cfg.segments.length} segment${cfg.segments.length!==1?"s":""} · ${SEGMENT_PRESETS[segType]?.label} · ${cfg.segments.slice(0,3).join(", ")}${cfg.segments.length>3?" …":""}`,
              content:(
                <div style={{padding:"16px 20px"}}>
                  <span style={{...S.label, marginBottom:"8px"}}>SEGMENT TYPE</span>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6px",marginBottom:"14px"}}>
                    {Object.entries(SEGMENT_PRESETS).map(([key,p])=>(
                      <button key={key} onClick={()=>handleSegTypeChange(key)}
                        style={{padding:"8px 10px",borderRadius:"7px",border:`1px solid ${segType===key?accent:border}`,
                          background:segType===key?`${accent}18`:"transparent",cursor:"pointer",fontFamily:"inherit",
                          textAlign:"left",transition:"all 0.15s"}}>
                        <div style={{fontSize:"12px",marginBottom:"2px"}}>{p.icon} <span style={{color:segType===key?accent:textPrimary,fontWeight:"700",fontSize:"11px"}}>{p.label}</span></div>
                        <div style={{fontSize:"9px",color:textSecondary,lineHeight:"1.3"}}>{p.desc}</div>
                      </button>
                    ))}
                  </div>
                  <span style={{...S.label, marginBottom:"8px"}}>NUMBER OF SEGMENTS <span style={{color:accent,fontWeight:"700"}}>{nSegs}</span></span>
                  <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"6px"}}>
                    <input type="range" min={1} max={100} value={nSegs}
                      onChange={e=>handleNSegsChange(Number(e.target.value))}
                      style={{flex:1,accentColor:accent,cursor:"pointer"}}/>
                    <input type="number" min={1} max={100} value={nSegs}
                      onChange={e=>handleNSegsChange(Math.min(100,Math.max(1,Number(e.target.value))))}
                      style={{...S.input,width:"64px",textAlign:"center"}}/>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:"10px",color:textSecondary,marginBottom:"12px"}}>
                    <span>1</span><span>25</span><span>50</span><span>75</span><span>100</span>
                  </div>
                  <span style={{...S.label, marginBottom:"8px"}}>SEGMENT NAMES</span>
                  {segType !== "custom" ? (
                    <>
                      {presetOptions.length > 0 && (
                        <div style={{display:"flex",flexDirection:"column",gap:"6px",marginBottom:"12px"}}>
                          {presetOptions.map((opt,i)=>(
                            <button key={i} onClick={()=>handlePresetPick(i)}
                              style={{padding:"7px 12px",borderRadius:"6px",border:`1px solid ${chosenPreset===i?accent:border}`,
                                background:chosenPreset===i?`${accent}18`:"transparent",cursor:"pointer",fontFamily:"inherit",
                                display:"flex",alignItems:"center",gap:"8px",textAlign:"left"}}>
                              <span style={{width:"14px",height:"14px",borderRadius:"50%",border:`2px solid ${chosenPreset===i?accent:border}`,
                                display:"inline-flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                                {chosenPreset===i&&<span style={{width:"6px",height:"6px",borderRadius:"50%",background:accent,display:"block"}}/>}
                              </span>
                              <span style={{fontSize:"11px",color:chosenPreset===i?textPrimary:textSecondary}}>{opt.join(" · ")}</span>
                            </button>
                          ))}
                        </div>
                      )}
                      <div style={{display:"flex",flexWrap:"wrap",gap:"5px",marginBottom:"6px"}}>
                        {cfg.segments.map(s=>(
                          <span key={s} style={{fontSize:"11px",padding:"3px 10px",borderRadius:"20px",background:`${accent}18`,border:`1px solid ${accent}44`,color:accent,fontWeight:"600"}}>{s}</span>
                        ))}
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{display:"flex",gap:"8px",marginBottom:"10px"}}>
                        <input style={{...S.input,flex:1}} placeholder="Type segment name, press Enter…" value={customSegInput}
                          onChange={e=>setCustomSegInput(e.target.value)}
                          onKeyDown={e=>e.key==="Enter"&&addCustomSeg()}/>
                        <button onClick={addCustomSeg} style={{...S.primaryBtn(),width:"auto",padding:"8px 14px",marginTop:0}}>+ Add</button>
                      </div>
                      <div style={{display:"flex",flexWrap:"wrap",gap:"6px",marginBottom:"10px"}}>
                        {cfg.segments.map(s=>(
                          <span key={s} style={{fontSize:"11px",padding:"3px 10px",borderRadius:"20px",background:`${accent}18`,border:`1px solid ${accent}44`,color:accent,fontWeight:"600",display:"inline-flex",alignItems:"center",gap:"6px"}}>
                            {s}<span onClick={()=>removeCustomSeg(s)} style={{cursor:"pointer",opacity:0.7,fontWeight:"900",lineHeight:1}}>×</span>
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )
            },
            {
              key:"channels", label:"Channels", icon:"📡",
              summary:`${cfg.channels.length} channel${cfg.channels.length!==1?"s":""} · ${chMode} · ${cfg.channels.slice(0,3).join(", ")}${cfg.channels.length>3?" …":""}`,
              content:(
                <div style={{padding:"16px 20px"}}>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"6px",marginBottom:"14px"}}>
                    {[
                      {id:"library", icon:"📋", label:"Library"},
                      {id:"random",  icon:"🎲", label:"Random"},
                      {id:"custom",  icon:"✏️",  label:"Custom"},
                    ].map(m=>(
                      <button key={m.id} onClick={()=>{setChMode(m.id); if(m.id==="random") applyChannels(randomPickChannels(nChannels));}}
                        style={{padding:"8px 6px",borderRadius:"7px",border:`1px solid ${chMode===m.id?accent:border}`,
                          background:chMode===m.id?`${accent}18`:"transparent",cursor:"pointer",fontFamily:"inherit",textAlign:"center"}}>
                        <div style={{fontSize:"14px"}}>{m.icon}</div>
                        <div style={{fontSize:"10px",fontWeight:"700",color:chMode===m.id?accent:textSecondary,letterSpacing:"0.05em"}}>{m.label}</div>
                      </button>
                    ))}
                  </div>
                  {chMode === "random" && (
                    <div style={{marginBottom:"12px"}}>
                      <span style={{...S.label,marginBottom:"6px"}}>NUMBER OF CHANNELS <span style={{color:accent,fontWeight:"700"}}>{nChannels}</span></span>
                      <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"4px"}}>
                        <input type="range" min={1} max={50} value={nChannels}
                          onChange={e=>{const n=Number(e.target.value);setNChannels(n);applyChannels(randomPickChannels(n));}}
                          style={{flex:1,accentColor:accent,cursor:"pointer"}}/>
                        <input type="number" min={1} max={50} value={nChannels}
                          onChange={e=>{const n=Math.min(50,Math.max(1,Number(e.target.value)));setNChannels(n);applyChannels(randomPickChannels(n));}}
                          style={{...S.input,width:"58px",textAlign:"center"}}/>
                      </div>
                      <div style={{display:"flex",justifyContent:"space-between",fontSize:"10px",color:textSecondary,marginBottom:"8px"}}>
                        <span>1</span><span>12</span><span>25</span><span>37</span><span>50</span>
                      </div>
                      <button onClick={()=>applyChannels(randomPickChannels(nChannels))}
                        style={{fontSize:"10px",padding:"4px 12px",border:`1px solid ${border}`,borderRadius:"5px",background:"transparent",color:textSecondary,cursor:"pointer",fontFamily:"inherit"}}>
                        🔀 Re-randomize
                      </button>
                    </div>
                  )}
                  {chMode === "library" && (
                    <div style={{marginBottom:"10px"}}>
                      {Object.entries(PHARMA_CHANNEL_LIBRARY).map(([grp,chs])=>(
                        <div key={grp} style={{marginBottom:"10px"}}>
                          <div style={{fontSize:"10px",color:textSecondary,fontWeight:"700",letterSpacing:"0.08em",marginBottom:"5px"}}>{grp.toUpperCase()}</div>
                          <div style={{display:"flex",flexWrap:"wrap",gap:"5px"}}>
                            {chs.map(ch=>(
                              <button key={ch} onClick={()=>toggleLibChannel(ch)}
                                style={{...S.checkBtn(cfg.channels.includes(ch)),fontSize:"10px",padding:"3px 9px"}}>{ch}</button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {chMode === "custom" && (
                    <div style={{marginBottom:"10px"}}>
                      <div style={{display:"flex",gap:"8px",marginBottom:"8px"}}>
                        <input style={{...S.input,flex:1}} placeholder="Type channel name, press Enter…"
                          value={customChInput} onChange={e=>setCustomChInput(e.target.value)}
                          onKeyDown={e=>e.key==="Enter"&&addCustomChannel()}/>
                        <button onClick={addCustomChannel} style={{...S.primaryBtn(),width:"auto",padding:"8px 14px",marginTop:0}}>+ Add</button>
                      </div>
                      {savedChannels.length>0 && (
                        <div style={{marginBottom:"10px"}}>
                          <div style={{fontSize:"10px",color:accent,fontWeight:"700",letterSpacing:"0.08em",marginBottom:"5px"}}>💾 SAVED — click to add</div>
                          <div style={{display:"flex",flexWrap:"wrap",gap:"5px"}}>
                            {savedChannels.map(ch=>(
                              <span key={ch} style={{display:"inline-flex",alignItems:"center",gap:"5px",fontSize:"10px",padding:"3px 9px",borderRadius:"5px",background:`${accentBlue}18`,border:`1px solid ${accentBlue}33`,color:accentBlue}}>
                                <span style={{cursor:"pointer"}} onClick={()=>{if(!cfg.channels.includes(ch)){applyChannels([...cfg.channels,ch]);setNChannels(cfg.channels.length+1);}}}>{ch}</span>
                                <span style={{cursor:"pointer",opacity:0.6,fontWeight:"900"}} onClick={()=>deleteSavedChannel(ch)}>×</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  <div style={{background:`${accent}08`,border:`1px solid ${accent}22`,borderRadius:"7px",padding:"10px"}}>
                    <div style={{fontSize:"10px",color:accent,fontWeight:"700",letterSpacing:"0.08em",marginBottom:"7px"}}>ACTIVE CHANNELS ({cfg.channels.length})</div>
                    <div style={{display:"flex",flexWrap:"wrap",gap:"5px"}}>
                      {cfg.channels.map(ch=>(
                        <span key={ch} style={{fontSize:"10px",padding:"3px 8px",borderRadius:"20px",background:`${accent}18`,border:`1px solid ${accent}44`,color:accent,display:"inline-flex",alignItems:"center",gap:"5px"}}>
                          {ch}<span onClick={()=>removeChannel(ch)} style={{cursor:"pointer",opacity:0.6,fontWeight:"900",lineHeight:1}}>×</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )
            },
            {
              key:"sales", label:"Sales Units", icon:"💊",
              summary:`${cfg.segments.map(s=>`${s}: ${(cfg.salesUnits[s]||0).toLocaleString()}`).slice(0,2).join(" · ")}${cfg.segments.length>2?" …":""}`,
              content:(
                <div style={{padding:"16px 20px"}}>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}>
                    {cfg.segments.map(seg=>(
                      <div key={seg}>
                        <label style={{...S.label,marginBottom:"4px",fontSize:"10px"}}>{seg}</label>
                        <NumInput value={cfg.salesUnits[seg]||0} onChange={v=>setN(`salesUnits.${seg}`,v)}/>
                      </div>
                    ))}
                  </div>
                </div>
              )
            },
            {
              key:"promo", label:"Promo Unit Cost", icon:"💰",
              summary: costMode==="channel" ? `By channel · ${cfg.channels.slice(0,2).map(ch=>`${ch}: $${cfg.promoCosts?.[ch]??30}`).join(", ")}${cfg.channels.length>2?" …":""}` :
                       costMode==="segment" ? `By segment · ${cfg.segments.slice(0,2).map(s=>`${s}: $${cfg.promoCosts?.[s]??30}`).join(", ")}${cfg.segments.length>2?" …":""}` :
                       `Channel × Segment matrix · ${cfg.segments.length}×${cfg.channels.length} cells`,
              content:(
                <div style={{padding:"16px 20px"}}>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"6px",marginBottom:"16px"}}>
                    {[
                      {id:"channel", icon:"📡", label:"By Channel",   desc:"One cost per channel"},
                      {id:"segment", icon:"👥", label:"By Segment",   desc:"One cost per segment"},
                      {id:"matrix",  icon:"⊞",  label:"Ch × Seg",     desc:"Unique per combination"},
                    ].map(m=>(
                      <button key={m.id} onClick={()=>setCostMode(m.id)}
                        style={{padding:"9px 6px",borderRadius:"7px",border:`1px solid ${costMode===m.id?accent:border}`,
                          background:costMode===m.id?`${accent}18`:"transparent",cursor:"pointer",fontFamily:"inherit",textAlign:"center",transition:"all 0.15s"}}>
                        <div style={{fontSize:"16px",marginBottom:"3px"}}>{m.icon}</div>
                        <div style={{fontSize:"10px",fontWeight:"700",color:costMode===m.id?accent:textPrimary,marginBottom:"2px"}}>{m.label}</div>
                        <div style={{fontSize:"9px",color:textSecondary,lineHeight:"1.3"}}>{m.desc}</div>
                      </button>
                    ))}
                  </div>
                  {costMode === "channel" && (
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"8px"}}>
                      {cfg.channels.map(ch=>(
                        <div key={ch}>
                          <label style={{...S.label,marginBottom:"4px",fontSize:"10px"}}>{ch}</label>
                          <div style={{position:"relative"}}>
                            <span style={{position:"absolute",left:"10px",top:"50%",transform:"translateY(-50%)",color:textSecondary,fontSize:"12px"}}>$</span>
                            <input type="number" step="0.01" value={cfg.promoCosts?.[ch]??30}
                              onChange={e=>setPromoCost(ch,null,e.target.value)}
                              style={{...S.input,paddingLeft:"22px"}}/>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {costMode === "segment" && (
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"8px"}}>
                      {cfg.segments.map(seg=>(
                        <div key={seg}>
                          <label style={{...S.label,marginBottom:"4px",fontSize:"10px"}}>{seg}</label>
                          <div style={{position:"relative"}}>
                            <span style={{position:"absolute",left:"10px",top:"50%",transform:"translateY(-50%)",color:textSecondary,fontSize:"12px"}}>$</span>
                            <input type="number" step="0.01" value={cfg.promoCosts?.[seg]??30}
                              onChange={e=>setPromoCost(null,seg,e.target.value)}
                              style={{...S.input,paddingLeft:"22px"}}/>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {costMode === "matrix" && (
                    <div style={{overflowX:"auto",marginBottom:"8px"}}>
                      <table style={{width:"100%",borderCollapse:"collapse",fontSize:"11px"}}>
                        <thead>
                          <tr>
                            <th style={{...S.th,background:surfaceLight,position:"sticky",left:0,zIndex:1,minWidth:"80px"}}>Seg ╲ Ch</th>
                            {cfg.channels.map(ch=>(
                              <th key={ch} style={{...S.th,background:surfaceLight,textAlign:"center",padding:"5px 6px",fontSize:"9px"}}>
                                {ch.length>9?ch.slice(0,8)+"…":ch}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {cfg.segments.map(seg=>(
                            <tr key={seg}>
                              <td style={{...S.td,fontWeight:"700",color:accent,background:surfaceLight,position:"sticky",left:0,fontSize:"10px",padding:"4px 6px",whiteSpace:"nowrap"}}>
                                {seg.length>9?seg.slice(0,8)+"…":seg}
                              </td>
                              {cfg.channels.map(ch=>(
                                <td key={ch} style={{...S.td,padding:"3px 4px"}}>
                                  <input type="number" step="0.01"
                                    value={cfg.promoCosts?.[`${seg}__${ch}`]??30}
                                    onChange={e=>setPromoCost(ch,seg,e.target.value)}
                                    style={{width:"64px",background:surfaceLight,border:`1px solid ${border}`,borderRadius:"5px",
                                      color:textPrimary,padding:"4px 6px",fontSize:"11px",fontFamily:"inherit",outline:"none",boxSizing:"border-box"}}/>
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div style={{fontSize:"10px",color:textSecondary,marginTop:"6px"}}>💡 Each cell = cost ($) for that Segment × Channel</div>
                    </div>
                  )}
                </div>
              )
            },
          ].map(({key,label,icon,summary,content})=>(
            <div key={key} style={{borderBottom:`1px solid ${border}`}}>
              {/* Accordion Header */}
              <button onClick={()=>toggleSection(key)} style={{
                width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between",
                padding:"14px 20px", background:"transparent", border:"none", cursor:"pointer",
                fontFamily:"inherit", textAlign:"left", gap:"10px",
              }}>
                <div style={{display:"flex",alignItems:"center",gap:"10px",minWidth:0}}>
                  <span style={{fontSize:"16px",flexShrink:0}}>{icon}</span>
                  <div style={{minWidth:0}}>
                    <div style={{fontSize:"12px",fontWeight:"700",color:openSections[key]?accent:textPrimary,letterSpacing:"0.04em"}}>{label}</div>
                    {!openSections[key] && (
                      <div style={{fontSize:"10px",color:textSecondary,marginTop:"2px",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:"280px"}}>{summary}</div>
                    )}
                  </div>
                </div>
                <span style={{color:openSections[key]?accent:textSecondary,fontSize:"16px",flexShrink:0,transition:"transform 0.2s",transform:openSections[key]?"rotate(180deg)":"rotate(0deg)"}}>▾</span>
              </button>
              {/* Accordion Body */}
              {openSections[key] && content}
            </div>
          ))}

          {/* Generate Button */}
          <div style={{padding:"16px 20px"}}>
            <button style={{...S.primaryBtn(), marginTop:"0"}} onClick={handleGen} disabled={cfg.segments.length===0||cfg.channels.length===0}>
              ▶ GENERATE FILES
            </button>
          </div>
        </div>

        <PreviewPanel files={files} activeTab={tab} setActiveTab={setTab} tabKeys={["RC","Sales","Spend"]}/>
      </div>
    </div>
  );
}

// ─── SCREEN: Basic Model Designer ────────────────────────────────────────────
function BasicModelDesigner({onBack}){
  const [cfg,setCfg]=useState({nSegments:5,nHCP:500,nMonths:24,nChannels:6,nLags:3,nAdstock:3,noiseRatio:0.1,secondaryNoise:0.02,valueIntercept:20,valueAsymptote:5,valueLag:0.5,startMonth:"2020-01",curvature:1.0,distPoisson:0.5,distNormal:0.25,distFlat:0.25,trExp:0.5,trLog:0.25,trPower:0.2,trLinear:0.05});
  const [gen,setGen]=useState(null);
  const [tab,setTab]=useState("Panel");
  const [loading,setLoading]=useState(false);

  const s=(k,v)=>setCfg(c=>({...c,[k]:Number(v)}));

  const handleGen=useCallback(()=>{
    setLoading(true);
    setTimeout(()=>{
      try{
        const result=buildBasicModel(cfg);
        setGen(result);setTab("Panel");
      }catch(e){console.error(e);}
      setLoading(false);
    },50);
  },[cfg]);

  const files=gen?{
    Panel:{label:"Panel_Data.csv",rows:gen.panelRows,cols:["HCP_ID","Month_ID","Segment","Sales","Channel_Contribution","Intercept_Value"]},
    Config:{label:"Config_File.csv",rows:gen.configRows,cols:["Segment","Channel","Distribution","Transformation","Adstock_Lambda","Asymptote","Intercept","LagSum","Curvature"]},
  }:null;

  return(
    <div style={S.app}>
      <div style={{...S.header,paddingBottom:"18px"}}>
        <h1 style={S.title}><BackBtn onBack={onBack}/><span style={S.badge(accentBlue)}>BASIC</span>Basic Model Dataset Generator</h1>
        <p style={S.subtitle}>Synthetic HCP-level panel data with configurable channels, segments, adstock & response curves</p>
      </div>
      <div style={S.mainGrid}>
        <div style={{...S.panel,maxHeight:"85vh",overflowY:"auto"}}>
          <SectionLabel color={accentBlue}>Dataset Structure</SectionLabel>
          <div style={S.grid2}>
            <Field label="# Segments"><NumInput value={cfg.nSegments} onChange={v=>s("nSegments",v)}/></Field>
            <Field label="# HCPs"><NumInput value={cfg.nHCP} onChange={v=>s("nHCP",v)}/></Field>
            <Field label="# Months"><NumInput value={cfg.nMonths} onChange={v=>s("nMonths",v)}/></Field>
            <Field label="# Channels"><NumInput value={cfg.nChannels} onChange={v=>s("nChannels",v)}/></Field>
            <Field label="# Lags"><NumInput value={cfg.nLags} onChange={v=>s("nLags",v)}/></Field>
            <Field label="Adstock Months"><NumInput value={cfg.nAdstock} onChange={v=>s("nAdstock",v)}/></Field>
          </div>
          <Field label="Start Month (YYYY-MM)"><Input value={cfg.startMonth} onChange={v=>setCfg(c=>({...c,startMonth:v}))}/></Field>
          <Divider/>
          <SectionLabel color={accentBlue}>Model Parameters</SectionLabel>
          <div style={S.grid2}>
            <Field label="Intercept (low seg)"><NumInput step="0.1" value={cfg.valueIntercept} onChange={v=>s("valueIntercept",v)}/></Field>
            <Field label="Asymptote (low seg)"><NumInput step="0.1" value={cfg.valueAsymptote} onChange={v=>s("valueAsymptote",v)}/></Field>
            <Field label="Lag Sum (low seg)"><NumInput step="0.01" value={cfg.valueLag} onChange={v=>s("valueLag",v)}/></Field>
            <Field label="Curvature"><NumInput step="0.1" value={cfg.curvature} onChange={v=>s("curvature",v)}/></Field>
            <Field label="Primary Noise Ratio"><NumInput step="0.01" value={cfg.noiseRatio} onChange={v=>s("noiseRatio",v)}/></Field>
            <Field label="Secondary Noise"><NumInput step="0.01" value={cfg.secondaryNoise} onChange={v=>s("secondaryNoise",v)}/></Field>
          </div>
          <Divider/>
          <SectionLabel color={accentBlue}>Distribution Mix</SectionLabel>
          <div style={S.grid2}>
            <Field label="Poisson ratio"><NumInput step="0.05" value={cfg.distPoisson} onChange={v=>s("distPoisson",v)}/></Field>
            <Field label="Normal ratio"><NumInput step="0.05" value={cfg.distNormal} onChange={v=>s("distNormal",v)}/></Field>
            <Field label="Flat ratio"><NumInput step="0.05" value={cfg.distFlat} onChange={v=>s("distFlat",v)}/></Field>
          </div>
          <Divider/>
          <SectionLabel color={accentBlue}>Transformation Mix</SectionLabel>
          <div style={S.grid2}>
            <Field label="NEG_EXP ratio"><NumInput step="0.05" value={cfg.trExp} onChange={v=>s("trExp",v)}/></Field>
            <Field label="LOG ratio"><NumInput step="0.05" value={cfg.trLog} onChange={v=>s("trLog",v)}/></Field>
            <Field label="POWER ratio"><NumInput step="0.05" value={cfg.trPower} onChange={v=>s("trPower",v)}/></Field>
            <Field label="LINEAR ratio"><NumInput step="0.05" value={cfg.trLinear} onChange={v=>s("trLinear",v)}/></Field>
          </div>
          <button style={S.primaryBtn(accentBlue)} onClick={handleGen} disabled={loading}>
            {loading?"⏳ GENERATING...":"▶ GENERATE DATASET"}
          </button>
          {gen&&<div style={{marginTop:"12px",background:`${accentBlue}11`,border:`1px solid ${accentBlue}33`,borderRadius:"6px",padding:"10px",fontSize:"11px",color:textSecondary}}>
            <span style={{color:accentBlue,fontWeight:"700"}}>Generated:</span> {gen.meta.nRows.toLocaleString()} rows · {gen.meta.segs.length} segments · {gen.meta.channels.length} channels<br/>
            <span style={{color:accentBlue}}>Transforms:</span> {gen.meta.channels.map((ch,i)=>gen.meta.chTr[i]).join(", ")}
          </div>}
        </div>
        <PreviewPanel files={files} activeTab={tab} setActiveTab={setTab} tabKeys={["Panel","Config"]}/>
      </div>
    </div>
  );
}

// ─── SCREEN: DMA Model Designer ───────────────────────────────────────────────
function DMADesigner({onBack}){
  const [cfg,setCfg]=useState({nDMA:20,startDate:"2022-01",endDate:"2024-06",unitPrice:80,minSales:5000,maxSales:50000,minSpend:100,maxSpend:1500,dmaChannels:["TV","Digital","Print","OOH","Radio"]});
  const [gen,setGen]=useState(null);
  const [tab,setTab]=useState("Sales");
  const [newCh,setNewCh]=useState("");

  const files=gen?{Sales:{label:"DMA_Sales.csv",rows:gen.salesRows,cols:["yearmonth","DMA","Sales_Unit","Unit_Price","Sales"]},Spend:{label:"DMA_Spend.csv",rows:gen.spendRows,cols:["yearmonth","DMA","Channel","GRP","Cost_Per_GRP","Spend"]}}:null;

  const handleGen=useCallback(()=>{setGen(buildDMAPair(cfg));setTab("Sales");},[cfg]);

  const addCh=()=>{if(newCh.trim()&&!cfg.dmaChannels.includes(newCh.trim())){setCfg(c=>({...c,dmaChannels:[...c.dmaChannels,newCh.trim()]}));setNewCh("");}};
  const removeCh=ch=>setCfg(c=>({...c,dmaChannels:c.dmaChannels.filter(x=>x!==ch)}));

  return(
    <div style={S.app}>
      <div style={{...S.header,paddingBottom:"18px"}}>
        <h1 style={S.title}><BackBtn onBack={onBack}/><span style={S.badge(accentAmber)}>DMA</span>DMA Model Dataset Pair</h1>
        <p style={S.subtitle}>Generate DMA-level Sales & Spend files with GRP data for geo-level MMx modeling</p>
      </div>
      <div style={S.mainGrid}>
        <div style={S.panel}>
          <SectionLabel color={accentAmber}>DMA Structure</SectionLabel>
          <Field label="# DMA Geographies"><NumInput value={cfg.nDMA} onChange={v=>setCfg(c=>({...c,nDMA:Number(v)}))}/></Field>
          <div style={S.grid2}>
            <Field label="Start (YYYY-MM)"><Input value={cfg.startDate} onChange={v=>setCfg(c=>({...c,startDate:v}))}/></Field>
            <Field label="End (YYYY-MM)"><Input value={cfg.endDate} onChange={v=>setCfg(c=>({...c,endDate:v}))}/></Field>
          </div>
          <Field label="Unit Price ($)"><NumInput value={cfg.unitPrice} onChange={v=>setCfg(c=>({...c,unitPrice:Number(v)}))}/></Field>
          <Divider/>
          <SectionLabel color={accentAmber}>Sales Range (units/month)</SectionLabel>
          <div style={S.grid2}>
            <Field label="Min Sales"><NumInput value={cfg.minSales} onChange={v=>setCfg(c=>({...c,minSales:Number(v)}))}/></Field>
            <Field label="Max Sales"><NumInput value={cfg.maxSales} onChange={v=>setCfg(c=>({...c,maxSales:Number(v)}))}/></Field>
          </div>
          <Divider/>
          <SectionLabel color={accentAmber}>Spend Range (GRPs/month)</SectionLabel>
          <div style={S.grid2}>
            <Field label="Min GRP"><NumInput value={cfg.minSpend} onChange={v=>setCfg(c=>({...c,minSpend:Number(v)}))}/></Field>
            <Field label="Max GRP"><NumInput value={cfg.maxSpend} onChange={v=>setCfg(c=>({...c,maxSpend:Number(v)}))}/></Field>
          </div>
          <Divider/>
          <SectionLabel color={accentAmber}>Media Channels</SectionLabel>
          <div style={{display:"flex",flexWrap:"wrap",gap:"7px",marginBottom:"12px"}}>
            {cfg.dmaChannels.map(ch=>(
              <span key={ch} style={{...S.checkBtn(true,accentAmber),display:"inline-flex",alignItems:"center",gap:"6px"}}>
                {ch}<span onClick={()=>removeCh(ch)} style={{cursor:"pointer",opacity:0.7,fontWeight:"900"}}>×</span>
              </span>
            ))}
          </div>
          <div style={{display:"flex",gap:"8px"}}>
            <input style={{...S.input,flex:1}} placeholder="Add channel..." value={newCh} onChange={e=>setNewCh(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addCh()}/>
            <button onClick={addCh} style={{...S.primaryBtn(accentAmber),width:"auto",padding:"8px 16px",marginTop:0,whiteSpace:"nowrap"}}>+ Add</button>
          </div>
          <button style={S.primaryBtn(accentAmber)} onClick={handleGen}>▶ GENERATE FILES</button>
        </div>
        <PreviewPanel files={files} activeTab={tab} setActiveTab={setTab} tabKeys={["Sales","Spend"]}/>
      </div>
    </div>
  );
}

// ─── Root Router ──────────────────────────────────────────────────────────────
export default function App(){
  const [screen,setScreen]=useState("landing");

  if(screen==="external")     return <ExternalDesigner onBack={()=>setScreen("landing")}/>;
  if(screen==="internal")     return <InternalSubScreen onSelect={setScreen} onBack={()=>setScreen("landing")}/>;
  if(screen==="basicmodel")   return <BasicModelDesigner onBack={()=>setScreen("internal")}/>;
  if(screen==="dma")          return <DMADesigner onBack={()=>setScreen("internal")}/>;
  return <LandingScreen onSelect={setScreen}/>;
}
