/* Shared by the seat page (index.html) and the admin page: seat layout + the downloadable confirmation image. */
const L={};
/* 279 seats. Each block is [first seat no., last seat no., block width in seats, 'e' = pushed to the right / 's' = from the left] */
for(const r of'PON')L[r]=[[1,6,6,'s'],[7,14,8,'s'],[15,20,6,'s']];
for(const r of'MLKJ')L[r]=[[1,3,6,'e'],[4,11,8,'s'],[12,14,6,'s']];
L.I=[[1,3,6,'e'],[4,10,8,'s'],[11,13,6,'s']];
for(const r of'HGFEDCB')L[r]=[[1,6,6,'s'],[7,14,8,'s'],[15,20,6,'s']];
L.A=[[1,5,6,'e'],[6,5,8,'s'],[6,10,6,'s']];   // row A: A1-A5 left, none in the middle, A6-A10 right

const EV={title:'Avengers: Doomsday',year:'(2026)',date:'December 19, 2026',dateShort:'Dec 19, 2026',time:'1:00 PM',venue1:'A. Bichara Silverscreens',venue2:'Cinema 4'};
const seatSort=(x,y)=>x[0]===y[0]?parseInt(x.slice(1))-parseInt(y.slice(1)):x.charCodeAt(0)-y.charCodeAt(0);
function miniLayout(){            // same block layout as the big map, in "seat units"
  const pos=[],lab=[];let y=0,maxX=0;
  for(const[r,bs]of Object.entries(L)){
    if(r==='H')y+=.7;
    let x=1.5;lab.push({r,y});
    bs.forEach(([a,b,w,al])=>{const cnt=b-a+1,off=al==='e'?w-cnt:0;
      for(let i=0;i<cnt;i++)pos.push({id:r+(a+i),x:x+off+i,y});
      x+=w+1;maxX=Math.max(maxX,x-1)});
    y+=1}
  return{pos,lab,w:maxX,h:y}}

const loadImg=src=>new Promise(ok=>{const i=new Image();i.onload=()=>ok(i);i.onerror=()=>ok(null);i.src=src});
function rrect(x,px,py,w,h,r){x.beginPath();x.moveTo(px+r,py);x.arcTo(px+w,py,px+w,py+h,r);x.arcTo(px+w,py+h,px,py+h,r);x.arcTo(px,py+h,px,py,r);x.arcTo(px,py,px+w,py,r);x.closePath()}
async function makeImage(r){
  try{await Promise.all([document.fonts.load('700 40px Metropolis'),document.fonts.load('400 40px Metropolis')])}catch(_){}
  const art=await loadImg('confirm-bg.jpg?v=1'),W=900,seats=r.seats,n=seats.length;
  const F=(w,s)=>`${w} ${s}px Metropolis,"Trebuchet MS",Verdana,sans-serif`;
  const cols=3,cw=220,ch=124,cg=20,rows=Math.ceil(n/cols),m=miniLayout(),u=760/m.w,mapH=(m.h+1.9)*u;
  const yName=724,ySeats=822,seatsEnd=ySeats+rows*(ch+cg)-cg,yRef=seatsEnd+44,refH=200,yMapT=yRef+refH+64,yMap=yMapT+22,yFacts=yMap+mapH+50,H=yFacts+360;
  const c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');
  rrect(x,0,0,W,H,44);x.fillStyle='#050d09';x.fill();x.save();rrect(x,0,0,W,H,44);x.clip();
  if(art){x.save();x.beginPath();x.rect(0,0,W,560);x.clip();const k=Math.max(W/art.width,560/art.height),w=art.width*k,h=art.height*k;x.drawImage(art,(W-w)/2,(560-h)/2,w,h);x.restore()}
  const g=x.createLinearGradient(0,60,0,560);g.addColorStop(0,'rgba(5,13,9,0)');g.addColorStop(.55,'rgba(5,13,9,.72)');g.addColorStop(1,'#050d09');x.fillStyle=g;x.fillRect(0,0,W,560);
  const gl=x.createRadialGradient(W/2,H*.55,50,W/2,H*.55,H*.6);gl.addColorStop(0,'rgba(57,255,122,.06)');gl.addColorStop(1,'rgba(57,255,122,0)');x.fillStyle=gl;x.fillRect(0,420,W,H);
  x.restore();
  x.textAlign='center';x.textBaseline='alphabetic';
  x.fillStyle='#fff';x.shadowColor='rgba(57,255,122,.7)';x.shadowBlur=26;let fs=66;x.font=F(700,fs);
  while(x.measureText('AVENGERS: DOOMSDAY').width>800&&fs>40){fs-=2;x.font=F(700,fs)}
  x.fillText('AVENGERS: DOOMSDAY',W/2,452);x.shadowBlur=0;x.fillStyle='#9db3a8';x.font=F(400,32);x.fillText('(2026)   Seat reservation',W/2,498);
  x.strokeStyle='rgba(255,255,255,.26)';x.lineWidth=3;x.setLineDash([14,12]);x.beginPath();x.moveTo(70,540);x.lineTo(W-70,540);x.stroke();x.setLineDash([]);
  // confirmed badge
  x.shadowColor='rgba(57,255,122,.8)';x.shadowBlur=22;x.fillStyle='#39ff7a';x.beginPath();x.arc(W/2-168,612,28,0,7);x.fill();x.shadowBlur=0;
  x.strokeStyle='#03160b';x.lineWidth=7;x.lineCap='round';x.lineJoin='round';x.beginPath();x.moveTo(W/2-182,613);x.lineTo(W/2-173,622);x.lineTo(W/2-155,602);x.stroke();
  x.textAlign='left';x.fillStyle='#39ff7a';x.font=F(700,36);try{x.letterSpacing='3px'}catch(_){}x.fillText('SEATS RESERVED',W/2-124,625);try{x.letterSpacing='0px'}catch(_){}
  x.textAlign='center';x.fillStyle='#9db3a8';x.font=F(400,26);x.fillText('Reserved for',W/2,666);
  x.fillStyle='#fff';x.font=F(700,44);let nm=r.name;while(x.measureText(nm).width>780&&nm.length>1)nm=nm.slice(0,-1);x.fillText(nm===r.name?nm:nm.trim()+'…',W/2,yName+8);
  x.fillStyle='#9db3a8';x.font=F(400,26);x.fillText(n>1?'Your seats':'Your seat',W/2,ySeats-12);
  // seat chips
  seats.forEach((id,i)=>{const row=Math.floor(i/cols),inRow=Math.min(cols,n-row*cols),col=i%cols,left=(W-(inRow*cw+(inRow-1)*cg))/2,px=left+col*(cw+cg),py=ySeats+row*(ch+cg);
    x.save();x.shadowColor='rgba(57,255,122,.65)';x.shadowBlur=30;rrect(x,px,py,cw,ch,24);x.fillStyle='#39ff7a';x.fill();x.restore();
    x.fillStyle='#03160b';x.textAlign='center';x.font=F(700,70);x.fillText(id,px+cw/2,py+74);x.font=F(700,21);x.fillText('ROW '+id[0]+'  ·  SEAT '+id.slice(1),px+cw/2,py+105)});
  // reference
  rrect(x,70,yRef,760,refH,30);x.fillStyle='rgba(57,255,122,.08)';x.fill();x.strokeStyle='rgba(57,255,122,.7)';x.lineWidth=3;x.setLineDash([16,10]);x.stroke();x.setLineDash([]);
  x.textAlign='center';x.fillStyle='#9db3a8';x.font=F(400,26);x.fillText('Reference code',W/2,yRef+52);
  x.fillStyle='#fff';x.shadowColor='rgba(57,255,122,.55)';x.shadowBlur=18;let rf=104;x.font=F(700,rf);while(x.measureText(r.ref).width>700&&rf>36){rf-=4;x.font=F(700,rf)}
  x.fillText(r.ref,W/2,yRef+142);x.shadowBlur=0;
  // mini map
  x.fillStyle='#9db3a8';x.font=F(400,26);x.fillText("Where you'll sit",W/2,yMapT);
  const ox=70,set=new Set(seats);
  m.lab.forEach(l=>{x.fillStyle='#6d8579';x.font=F(700,Math.round(u*.5));x.textAlign='center';x.fillText(l.r,ox+.55*u,yMap+(l.y+.68)*u)});
  m.pos.forEach(p=>{const me=set.has(p.id),px=ox+(p.x+.06)*u,py=yMap+(p.y+.08)*u,pw=.88*u,ph=.8*u;
    if(me){x.save();x.shadowColor='#39ff7a';x.shadowBlur=14;rrect(x,px,py,pw,ph,u*.18);x.fillStyle='#39ff7a';x.fill();x.restore();x.lineWidth=2;x.strokeStyle='#fff';x.stroke();
      x.fillStyle='#03160b';x.font=F(700,Math.round(u*.43));x.textAlign='center';x.fillText(p.id,px+pw/2,py+ph*.68)}
    else{rrect(x,px,py,pw,ph,u*.18);x.fillStyle='#22332b';x.fill()}});
  const sy=yMap+m.h*u;x.beginPath();x.moveTo(ox+m.w*.12*u,sy+.55*u);x.quadraticCurveTo(ox+m.w*u/2,sy+.05*u,ox+m.w*.88*u,sy+.55*u);x.lineTo(ox+m.w*.88*u,sy+1.05*u);x.quadraticCurveTo(ox+m.w*u/2,sy+.55*u,ox+m.w*.12*u,sy+1.05*u);x.closePath();
  const sg=x.createLinearGradient(0,sy,0,sy+u);sg.addColorStop(0,'#d5dde0');sg.addColorStop(1,'#76828a');x.fillStyle=sg;x.fill();
  x.fillStyle='#6d8579';x.font=F(700,Math.round(u*.45));x.textAlign='center';try{x.letterSpacing='4px'}catch(_){}x.fillText('SCREEN',ox+m.w*u/2+2,sy+1.65*u);try{x.letterSpacing='0px'}catch(_){}
  // event facts
  x.strokeStyle='rgba(255,255,255,.26)';x.lineWidth=3;x.setLineDash([14,12]);x.beginPath();x.moveTo(70,yFacts-30);x.lineTo(W-70,yFacts-30);x.stroke();x.setLineDash([]);
  const lab=(t,px,py)=>{x.textAlign='left';x.fillStyle='#9db3a8';x.font=F(400,26);x.fillText(t,px,py)},val=(t,px,py)=>{x.textAlign='left';x.fillStyle='#fff';x.font=F(700,42);x.fillText(t,px,py)};
  lab('Date',70,yFacts+22);val(EV.dateShort,70,yFacts+72);lab('Time',500,yFacts+22);val(EV.time,500,yFacts+72);
  lab('Venue',70,yFacts+142);val(EV.venue1,70,yFacts+192);val(EV.venue2,70,yFacts+244);
  x.textAlign='center';x.fillStyle='#39ff7a';x.font=F(700,28);x.fillText('Show this image at the entrance',W/2,H-46);
  return c.toDataURL('image/png')}
