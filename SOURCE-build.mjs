// Builds the static Gati website. No server, database, login or on-site form.
// Contact flow: WhatsApp / Call / Email only.
//
// Desktop / PC pass (this revision):
//  1. Gallery + founder images were ~2.6x the size they are ever displayed at.
//     They are pre-resized to 2x their widest rendered box, and two unreferenced
//     gallery images (site-4, site-8) were removed. Build no longer ships them.
//  2. Every image below the first screen is now lazy; only the hero, the logo
//     and the client marquee stay eager. (The marquee is transform-animated —
//     lazy loading there leaves gaps, so it is deliberately kept eager.)
//  3. Real social preview: purpose-built 1200x630 JPEG instead of the .webp
//     below-the-fold first project shot (WhatsApp/LinkedIn do not render webp).
//  4. Fonts are preloaded, so desktop text stops swapping after first paint.
//  5. Project-page hero image gets fetchpriority=high + correct dimensions.
//  6. Width/height on every image now match the real file (no layout shift).
import {mkdirSync,writeFileSync,copyFileSync,readdirSync,statSync,unlinkSync,existsSync} from 'node:fs';
import {join,dirname,resolve} from 'node:path';

const BASE=process.env.BASE_PATH??'/gati-site';
const OUT=process.env.OUT_DIR??'build';
const P={
  primary:'+91 99101 44422',
  secondary:'+91 97290 73771',
  email:'gatiinfraprojects.pvtltd@gmail.com',
  address:'A-89, A1-Block, Chhattarpur Extension, New Delhi – 110074',
  region:'Delhi NCR & Haryana'
};
const waNumber=P.primary.replace(/\D/g,'');
const tels=P.primary.replace(/[^+\d]/g,'');
const tel2=P.secondary.replace(/[^+\d]/g,'');
const wa=(text)=>`https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`;
const u=(p)=>`${BASE}/${p}`.replace(/\/+/g,'/');

const services=[
 {id:'rcc',n:'01',title:'RCC structural execution',short:'The strength behind the structure.',body:'From the first footing to the top slab. Our in-house shuttering, reinforcement and concreting teams work from the drawings and the realities of the site.',items:['Foundation to top slab','Shuttering & formwork','Reinforcement & bar bending','Concreting & structural execution'],image:'site-3',alt:'Reinforcement work on a Gati project site'},
 {id:'civil',n:'02',title:'Civil & infrastructure works',short:'Everything that connects a project.',body:'Practical civil work around and beyond the building — site development, roads, boundary walls and drainage for private and institutional requirements.',items:['Site development & levelling','Roads & pavements','Boundary walls','Drainage & sewerage'],image:'site-7',alt:'Concrete placement at a project site'},
 {id:'renovation',n:'03',title:'Renovation & maintenance',short:'Make what exists work better.',body:'Considered repairs, careful upgrades and regular maintenance, working with existing spaces to address structural needs and improve everyday use.',items:['Structural repairs','Waterproofing & painting','Interior upgrades & flooring','Ongoing property maintenance'],image:'site-2',alt:'Construction work in progress on a building'},
 {id:'homes',n:'04',title:'Independent homes',short:'Your plans. Built into a place.',body:'Independent houses and kothis, from foundation work through finishing — starting with the requirements of your plot and the way the home needs to work.',items:['Independent houses & kothis','Foundation & structural works','Space planning coordination','Finishing & handover'],image:'parq',alt:'Residential project visual from the company website'}
];
const projects=[
 {slug:'conscient-residential',title:'Conscient Residential',category:'Residential',location:'Gurugram',status:'Completed',scope:'RCC structural execution',image:'conscient',visual:true,body:['RCC structural execution for a residential development in Gurugram. Our role sits at the core of the building: carrying the structural scope from drawings into coordinated work on site.','A residential assignment within our wider execution portfolio across Delhi NCR.']},
 {slug:'crc-noida',title:'CRC Development',category:'Residential',location:'Noida, Uttar Pradesh',status:'Ongoing',scope:'RCC structural works',image:'crc',visual:false,body:['Structural works for a residential development near Pari Chowk, Noida. Gati’s scope is focused on RCC execution and the on-ground coordination that brings the structure together.']},
 {slug:'parq-residential',title:'Parq Residential',category:'Residential',location:'Sector 80, Gurugram',status:'Completed',scope:'RCC structural & civil works',image:'parq',visual:true,body:['RCC structural and civil works for the Parq residential development in Sector 80, Gurugram.','An assignment that brings the structural teams and civil capabilities together around a clearly defined residential construction scope.']},
 {slug:'downtown-gurugram',title:'Downtown Commercial',category:'Commercial',location:'DLF Cyber City, Gurugram',status:'Completed',scope:'Civil & structural works',image:'downtown',visual:true,body:['Civil and structural works for the Downtown commercial development at DLF Cyber City, Gurugram.','Commercial spaces rely on a well-executed structure. This project forms part of the work supporting that essential stage.']},
 {slug:'prestige-ghaziabad',title:'The Prestige Project',category:'Residential',location:'Shyam Vihar, Ghaziabad',status:'Ongoing',scope:'RCC structural execution',image:'prestige',visual:false,body:['RCC structural execution for a residential project in Shyam Vihar, Ghaziabad. The assignment reflects a focus on the structure, the site teams and the practical coordination between them.']},
 {slug:'bl-kashyap',title:'B L Kashyap Project',category:'Commercial',location:'Aero City, Gurugram',status:'Ongoing',scope:'Construction workforce deployment',image:'bl-kashyap',visual:false,body:['Construction workforce deployment for a B L Kashyap project at Aero City, Gurugram.','Our role supports the people and execution requirements on site — bringing construction teams into the wider project workflow.']}
];
const partnerSize={1:[253,113],2:[200,163],3:[150,40],4:[270,148],5:[131,18],6:[144,88],7:[360,202],8:[180,220]};
const partners=[['Shapoorji Pallonji',7],['B L Kashyap',2],['Conscient',3],['CRC',4],['Parq by Conscient',6],['Prestige Group',8],['GMR Aerocity',1],['Downtown',5]];
const founders=[
 {name:'Parveen Saini',image:'parveen-saini',text:'Focused on quality execution and strong client relationships across Delhi NCR.'},
 {name:'Udaybhan Malik',image:'udaybhan-malik',text:'Focused on dependable project delivery and long-term working relationships.'},
 {name:'Amit Deshwal',image:'amit-deshwal',text:'Brings hands-on RCC structural execution and on-ground project experience.'}
];
const steps=[
 {label:'DISCUSS',title:'Start with a conversation.',body:'Share the drawings, location and what the project needs. We listen before we propose.'},
 {label:'REVIEW',title:'Understand the site.',body:'An engineer reviews the site and requirements. Scope, resources and the way forward become clear.'},
 {label:'EXECUTE',title:'Get to work.',body:'Teams bring the plan to the ground, with site coordination and progress updates along the way.'},
 {label:'HAND OVER',title:'Finish with a walkthrough.',body:'Review the completed scope together and close the loop on the details before handover.'}
];
const gallery=Array.from({length:8},(_,i)=>`site-${i+1}`);
// Only these image files are ever referenced by a page. Anything else in
// assets/images is a working file and is not published.
const USED_IMAGES=[...new Set([
 ...services.map(s=>s.image),
 ...projects.map(p=>p.image),
 ...founders.map(f=>f.image),
 ...['site-1','site-2','site-3','site-5','site-6','site-7']
])].map(n=>n+'.webp');
// Real pixel size of each published image. Keeping these in step with the files
// means the browser reserves the right box before the bytes arrive (no shift).
const SERVICE_DIM={'site-3':[1240,572],'site-7':[1240,572],'site-2':[1240,572],'parq':[800,323]};
const FOUNDER_DIM={'parveen-saini':[810,540],'udaybhan-malik':[810,608],'amit-deshwal':[810,810]};
const PROJECT_DIM={'conscient':[1280,720],'crc':[800,450],'parq':[800,323],'downtown':[1280,620],'prestige':[1200,700],'bl-kashyap':[818,570]};
const roles=[
 {title:'Shuttering Carpenter',type:'Full-time · On site',body:'Work with the RCC execution team on residential and commercial sites. Prepare and install formwork, and coordinate with reinforcement and site teams.',requirements:['Relevant shuttering and formwork experience','Ability to work from site instructions and drawings','Attention to alignment, finishing and site safety']},
 {title:'Bar Bender / Fitter',type:'Full-time · On site',body:'Support reinforcement work on active project sites. Read drawings, prepare steel and work closely with the structural execution team.',requirements:['Experience in bar bending and reinforcement','Ability to read basic structural drawings','A careful, collaborative approach to site work']},
 {title:'Site Supervisor',type:'Full-time · On site',body:'Coordinate day-to-day site activity, communicate with labour teams and support quality and safety checks across the assigned work.',requirements:['Previous construction site supervision experience','Clear communication and team coordination','Understanding of site quality and safety practices']},
 {title:'General Helper',type:'Full-time · On site',body:'Assist site teams with materials, loading, unloading and everyday construction support, with room to learn and grow with the team.',requirements:['Willingness to work on construction sites','Ability to follow site and safety instructions','A dependable, team-first attitude']}
];
const faqs=[
 ['What kinds of projects do you take on?','The core is RCC structural execution for residential and commercial projects, alongside civil infrastructure work, renovations and independent home construction. Share your requirements so we can discuss the fit.'],
 ['Where do you work?','Work spans Gurugram, Delhi NCR and Haryana, including projects in Noida and Ghaziabad.'],
 ['How do I get in touch?','Use the WhatsApp button anywhere on this page, call the numbers listed, or email the team. Nothing is collected or stored on this website.'],
 ['How do I apply for a job with the team?','Open the careers page and use the WhatsApp button on the role you are interested in. You can attach your CV or documents directly in the WhatsApp chat.']
];
const aboutCopy=['Gati Infra Project Buildcon works with builders, developers and organisations on residential and commercial construction across Delhi NCR and Haryana.','RCC structural execution is at the centre of what we do. In-house shuttering, reinforcement and site teams work from the foundation to the top slab, supported by wider civil and construction capabilities.','The best working relationships are built in the everyday details: understanding the drawings, communicating clearly and staying involved on the ground.'];

const css=`@font-face{font-family:Manrope;src:url("${u('assets/fonts/Manrope.woff2')}") format('woff2');font-weight:200 800;font-display:swap}
@font-face{font-family:'IBM Plex Mono';src:url("${u('assets/fonts/IBMPlexMono.woff2')}") format('woff2');font-weight:400;font-display:swap}
:root{--paper:#f5f5ef;--ink:#1c2a36;--muted:#5f6d69;--line:#d9dfd8;--accent:#12d8b0;--dark-line:#40525b;--soft:#a8b9b7;--mono:'IBM Plex Mono',monospace}
*{box-sizing:border-box}html{scroll-behavior:smooth;scroll-padding-top:92px}body{margin:0;background:var(--paper);color:var(--ink);font-family:Manrope,Arial,sans-serif;-webkit-font-smoothing:antialiased;overflow-x:clip}
a{color:inherit;text-decoration:none}button{font:inherit;color:inherit;background:none;border:0;cursor:pointer;padding:0}img{display:block;max-width:100%}h1,h2,h3,p,figure,dl,dd{margin:0}
a:focus-visible,button:focus-visible,summary:focus-visible{outline:2px solid #04856e;outline-offset:4px}::selection{background:var(--accent)}
.container{width:min(1280px,calc(100% - 96px));margin:0 auto}.mono{font:10px/1.6 var(--mono);letter-spacing:1.2px}
.eyebrow{font:10px/1.6 var(--mono);letter-spacing:1.25px;text-transform:uppercase;display:flex;align-items:center;gap:12px;color:#55645d}.eyebrow i{display:block;width:21px;height:2px;background:var(--accent)}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:28px;min-height:60px;padding:18px 30px;background:var(--ink);color:var(--paper);border:1px solid var(--ink);font-size:15px;font-weight:600;transition:background .2s}
.btn:hover{background:#2f4a48}.btn.wa{background:#128c5a;border-color:#128c5a;color:#fff}.btn.wa:hover{background:#0f7549}.btn.small{min-height:48px;padding:13px 22px;font-size:13px;gap:18px}
.btn svg{transition:transform .2s}.btn:hover svg{transform:translate(2px,-2px)}
.text-link{display:inline-flex;align-items:center;gap:20px;justify-content:space-between;font-size:13px;font-weight:600;padding:6px 0;border-bottom:1px solid #7b8b83}
.text-link svg{transition:transform .2s}.text-link:hover svg{transform:translate(2px,-2px)}.text-link.light{color:var(--paper);border-color:#5c7173}
.utility{height:28px;background:var(--ink);color:#bcc9c6;font:8px/1 var(--mono);letter-spacing:1.1px}.utility .container{display:flex;align-items:center;justify-content:space-between;height:100%}.utility a{display:flex;align-items:center;gap:9px;color:#e2eae4;font-size:9px}
header.site{position:sticky;top:0;z-index:50;background:var(--paper);border-bottom:1px solid var(--line)}.head{height:86px;display:flex;align-items:center;justify-content:space-between;gap:24px}.head img{width:196px;height:auto}
nav.main{display:flex;gap:34px;margin-left:auto;margin-right:38px}nav.main a{font-size:12px;font-weight:500;padding:10px 0;position:relative}nav.main a:after{content:'';position:absolute;left:0;bottom:1px;height:2px;width:0;background:var(--accent);transition:width .2s}nav.main a:hover:after,nav.main a[aria-current=page]:after{width:22px}
.burger{display:none;padding:8px}.mobile{display:none}
.hero{display:grid;grid-template-columns:1fr 1.02fr;gap:54px;align-items:start;padding:44px 0 42px}
.hero h1{font-size:clamp(66px,7.4vw,108px);font-weight:500;line-height:1.04;letter-spacing:-6px;margin:26px 0 0 -4px}.hero h1 span{display:block}.hero p.lead{font-size:15px;line-height:1.85;color:var(--muted);white-space:pre-line;margin-top:28px;max-width:500px}
.hero-actions{display:flex;align-items:center;gap:28px;margin-top:29px;flex-wrap:wrap}
.signoff{display:flex;align-items:center;gap:16px;margin-top:50px}.signoff .mono{font-size:8px}.signoff p{font-size:10px;color:#8b948c;margin-top:6px}
.cross{position:relative;width:29px;height:29px;border:1px solid #c6d3c9;flex-shrink:0}.cross:before,.cross:after{content:'';position:absolute;background:#75907d}.cross:before{width:13px;height:1px;top:13px;left:7px}.cross:after{width:1px;height:13px;left:13px;top:7px}
.frame{position:relative;height:clamp(360px,33vw,478px);overflow:hidden;background:#dbe2d6}.frame img{width:100%;height:100%;object-fit:cover;object-position:56% center;animation:in .4s ease-out}
.frame-tag{position:absolute;left:20px;bottom:20px;background:rgba(245,245,239,.94);padding:9px 12px;font:7px/1.5 var(--mono);letter-spacing:1px;display:flex;gap:8px;align-items:center}.frame-tag i{width:5px;height:5px;background:#259a7d;border-radius:50%}
.gallery-bar{display:flex;align-items:center;justify-content:space-between;gap:14px;padding-top:17px}.gallery-bar .mono{font-size:7px;color:#5f6d69}.gallery-bar p{font-size:10px;margin-top:6px;color:#55645d}
.controls{display:flex;align-items:center;gap:5px}.controls .mono{font-size:9px;margin-right:8px}.controls .mono i{font-style:normal;color:#939b92;margin-left:5px}.controls button{width:29px;height:29px;border:1px solid #cdd6cb;display:grid;place-items:center}.controls button:hover{background:#e3eadf}
.partners{background:#fff;border-top:1px solid var(--line);border-bottom:1px solid var(--line)}.partners .container{display:flex;align-items:center;gap:40px;min-height:133px}
.partners .label{flex:0 0 176px;border-right:1px solid var(--line);padding-right:26px}.partners .label .mono{font-size:10px}.partners .label p{font-size:10px;line-height:1.6;color:var(--muted);margin-top:5px}
.motion{display:flex;align-items:center;gap:5px;font-size:8px;color:#8d9891;margin-top:4px}.motion:hover{color:var(--ink)}
.window{flex:1;overflow:hidden;mask-image:linear-gradient(to right,transparent,#000 4%,#000 96%,transparent)}.track{display:flex;width:max-content;animation:marquee 43s linear infinite}.set{display:flex;align-items:center;gap:56px;padding-right:56px}
.window:hover .track,.window.paused .track{animation-play-state:paused}.logo{width:122px;height:68px;display:grid;place-items:center}.logo img{max-width:122px;max-height:56px;object-fit:contain;opacity:.7}.logo:hover img{opacity:1}
section.block{padding:100px 0 94px}.head-row{display:flex;align-items:flex-end;justify-content:space-between;gap:32px;margin-bottom:42px}
h2.big{font-size:clamp(38px,4.3vw,58px);font-weight:500;line-height:1.1;letter-spacing:-2.8px;margin-top:18px}.aside{font-size:13px;line-height:1.85;color:var(--muted);margin-bottom:4px}
.grid-ft{display:grid;grid-template-columns:1.32fr 1fr;grid-auto-rows:min-content;gap:32px 34px}.card{display:flex;flex-direction:column;min-width:0}.card .shot{display:block;position:relative;overflow:hidden;background:#dce3dd;aspect-ratio:1.65}.card .caption{display:flex}
.card.small .shot{aspect-ratio:1.55}.card img{width:100%;height:100%;object-fit:cover;filter:saturate(.76);transition:transform .7s,filter .7s}.card:hover img{transform:scale(1.03);filter:saturate(1)}
.card.tall{grid-row:span 2;display:flex;flex-direction:column}.card.tall .shot{flex:1;min-height:400px;aspect-ratio:auto}
.chips{position:absolute;top:16px;left:16px;right:16px;display:flex;justify-content:space-between;gap:10px}.chip{background:rgba(245,245,239,.95);padding:8px 10px;font:8px/1.4 var(--mono);letter-spacing:.8px}.chip.live{display:flex;gap:5px;align-items:center}.chip.live i{width:4px;height:4px;border-radius:50%;background:#139778}
.kind{position:absolute;left:15px;bottom:13px;font:7px var(--mono);color:#fff;background:rgba(28,42,54,.55);padding:5px 8px;letter-spacing:.6px}
.arrow{position:absolute;right:16px;bottom:16px;width:44px;height:44px;background:var(--paper);display:grid;place-items:center;transform:translateY(64px);transition:transform .3s}.card:hover .arrow{transform:none}
.caption{display:flex;justify-content:space-between;gap:14px;padding-top:16px}.caption h3{font-size:21px;font-weight:600;letter-spacing:-.8px}.card.tall .caption h3{font-size:26px}.caption p{font-size:10px;line-height:1.7;color:var(--muted);margin-top:6px}.caption p span{padding:0 5px;color:#a4aea5}
.note{display:flex;justify-content:space-between;gap:20px;margin-top:32px;padding-top:20px;border-top:1px solid var(--line)}.note .mono{font-size:8px;color:#5f6d69}.note p{font-size:10px;color:var(--muted)}
.dark{background:var(--ink);color:var(--paper)}.dark .eyebrow{color:var(--soft)}.dark .aside{color:#93a9a8}
.split{display:grid;grid-template-columns:1.1fr 1fr;gap:88px;align-items:start}
.acc{border-top:1px solid var(--dark-line)}.acc details{border-bottom:1px solid var(--dark-line)}.acc summary{list-style:none;display:flex;align-items:center;gap:18px;padding:26px 0;cursor:pointer;color:#b3c2bd;font-size:25px;letter-spacing:-.7px}
.acc summary::-webkit-details-marker{display:none}.acc summary .mono{font-size:10px;color:#8b9e99}.acc summary .mark{margin-left:auto;font-size:22px;color:var(--accent)}
.acc details[open] summary{color:var(--paper)}.acc .body{padding:0 12px 26px 38px}.acc .body p{font-size:13px;line-height:1.9;color:#a3b5ae;max-width:440px}
.acc .body ul{list-style:none;padding:0;margin:18px 0 0;display:flex;flex-wrap:wrap;gap:8px}.acc .body li{font:9px var(--mono);letter-spacing:.6px;border:1px solid #46595c;padding:7px 10px;color:#c3d2cc}
.acc .body a{margin-top:20px;font-size:11px}
.visual img{width:100%;height:350px;object-fit:cover;filter:saturate(.55)}.visual .mono{display:block;font-size:8px;color:#8ba29b;margin-top:20px}.visual p{font-size:16px;margin-top:8px}
.tabs{display:grid;grid-template-columns:repeat(4,1fr);gap:0;margin-top:64px}.tabs button{text-align:left;color:#aab8ad}.tabs .num{font-size:74px;line-height:1;letter-spacing:-4px;display:block;transition:color .2s}.tabs .lbl{display:block;font:9px var(--mono);letter-spacing:1.5px;margin-top:22px;color:#5f6d69}.tabs .rule{display:block;height:1px;background:#c6d3c6;margin-top:22px;position:relative}.tabs .rule i{position:absolute;left:0;top:-3px;width:7px;height:7px;background:#b5c9b9}
.tabs button[aria-pressed=true]{color:var(--ink)}.tabs button[aria-pressed=true] .rule{background:var(--accent)}.tabs button[aria-pressed=true] .rule i{background:var(--accent);width:9px;height:9px;top:-4px}.tabs button[aria-pressed=true] .lbl{color:var(--ink)}.tabs button:hover .num{color:#4f7f6d}
.step{display:grid;grid-template-columns:1fr 1.03fr 50px;gap:44px;padding-top:34px;min-height:118px;align-items:start}.step h3{font-size:25px;letter-spacing:-.8px}.step p{font-size:13px;line-height:1.9;color:var(--muted)}.step svg{color:#88a892}
.people{border-top:1px solid var(--line);display:grid;grid-template-columns:1.05fr 1fr;gap:82px;align-items:center;padding-top:86px;padding-bottom:104px}.people img{width:100%;height:390px;object-fit:cover;object-position:48% center;filter:saturate(.66)}.people .mono{display:block;font-size:8px;color:#5f6d69;margin-top:13px}
.people h2{font-size:46px;letter-spacing:-2.4px;line-height:1.1;margin-bottom:24px}.people p{font-size:13px;line-height:1.95;color:var(--muted);margin-top:15px;max-width:452px}
.cta{background:var(--accent);padding:64px 0}.cta .eyebrow{color:#24564a}.cta .eyebrow i{background:#2a6b5d}.cta .row{display:flex;align-items:center;justify-content:space-between;gap:18px;margin-top:22px}.cta h2{font-size:clamp(38px,5.6vw,70px);line-height:1.04;letter-spacing:-3.6px;font-weight:500}.cta p{font-size:12px;color:#265c4c;margin-top:26px}
.cta .buttons{display:flex;gap:12px;flex-wrap:wrap;margin-top:28px}.cta .btn{background:var(--ink);color:var(--paper);border-color:var(--ink)}.cta .btn.ghost{background:transparent;color:var(--ink);border-color:#23765f}
footer.site{background:var(--ink);color:var(--paper);padding:66px 0 22px}.f-top{display:grid;grid-template-columns:1.4fr .75fr 1.2fr;gap:72px;padding-bottom:50px}.f-top img{width:218px}.f-top .brand p{font-size:11px;line-height:1.9;color:#98ada7;margin-top:22px;max-width:286px}
.f-links{display:flex;flex-direction:column;gap:11px}.f-links .mono,.f-contact .mono{color:#809a92;font-size:8px;letter-spacing:1.2px;margin-bottom:11px}.f-links a{font-size:12px;color:#d8e2d7}.f-links a:hover{color:var(--accent)}
.f-contact .big{font-size:25px;letter-spacing:-.7px;display:flex;align-items:center;gap:14px}.f-contact .mail{display:block;font-size:11px;color:#aabcb3;margin-top:14px;overflow-wrap:anywhere}.f-contact p{font-size:11px;line-height:1.85;color:#aabcb3;margin-top:14px;max-width:330px}
.f-bottom{border-top:1px solid #3c514b;padding-top:22px;display:flex;align-items:center;justify-content:space-between;gap:18px}.f-bottom p{font-size:8px;color:#7c948b}.f-bottom div{display:flex;gap:22px;font-size:9px;color:#b6c8bc}.f-bottom a:hover{color:var(--accent)}
.intro{padding:60px 0 52px}.intro h1{font-size:clamp(52px,6.2vw,86px);line-height:1.04;letter-spacing:-4.5px;margin-top:26px}.intro .row{display:flex;justify-content:space-between;align-items:flex-end;gap:54px;margin-top:26px}.intro .row p{max-width:310px;font-size:13px;line-height:1.85;color:var(--muted);margin-bottom:6px}
.filters{display:flex;align-items:center;justify-content:space-between;gap:20px;border-top:1px solid var(--line);border-bottom:1px solid var(--line);padding:18px 0;margin-bottom:36px}.filters .set{display:flex;gap:28px;flex-wrap:wrap}.filters button{font-size:12px;color:#7b8980;display:flex;gap:6px;align-items:center}.filters button b{font:8px var(--mono);font-weight:400}.filters button[aria-pressed=true]{color:var(--ink);font-weight:700}.filters button[aria-pressed=true]:before{content:'';width:5px;height:5px;border-radius:50%;background:var(--accent)}
.search{display:flex;align-items:center;gap:10px}.search input{border:0;background:none;outline:0;font-size:11px;padding:8px;width:190px;font-family:inherit;color:inherit}.search:focus-within{outline:1px solid #079d80;outline-offset:2px}
.grid-all{display:grid;grid-template-columns:1fr 1fr;gap:44px 34px}.grid-all .shot{aspect-ratio:1.45}
.service{display:grid;grid-template-columns:1fr 1fr;gap:88px;align-items:center;padding:64px 0;border-top:1px solid var(--line);scroll-margin-top:88px}.service:nth-child(even) .txt{order:2}.service h2{font-size:42px;letter-spacing:-2px;line-height:1.14;margin:24px 0 20px;max-width:400px}.service .num{font-size:9px;color:#83988a}.service .txt p{font-size:13px;line-height:1.9;color:var(--muted);max-width:445px}
.service ul{list-style:none;padding:0;margin:24px 0}.service li{display:flex;gap:14px;font-size:13px;padding:9px 0;border-bottom:1px solid #e1e6de;max-width:412px}.service li span{color:#2d9a7c}
.service figure img{width:100%;height:372px;object-fit:cover;filter:saturate(.7)}.service figcaption{font:7px var(--mono);color:var(--muted);margin-top:13px}
.about-img img{width:100%;height:478px;object-fit:cover;filter:saturate(.68)}.about-img{position:relative}.about-img .mono{position:absolute;left:20px;bottom:20px;background:var(--paper);padding:9px 12px;font-size:8px}
.story{display:grid;grid-template-columns:.75fr 1.25fr;gap:78px;padding:88px 0}.story h2{font-size:50px;letter-spacing:-2.6px;line-height:1.1;margin-bottom:26px}.story p{font-size:14px;line-height:1.95;color:var(--muted);max-width:626px;margin-bottom:15px}
.founders{background:#e7ece4;padding:96px 0}.f-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:32px}.f-grid .ph{height:348px;background:#d4ddd2;overflow:hidden}.f-grid .ph img{width:100%;height:100%;object-fit:cover;object-position:center 22%;filter:grayscale(1)}.f-grid h3{font-size:24px;letter-spacing:-.8px;margin-top:21px}.f-grid .mono{display:block;font-size:8px;color:#4a5854;margin-top:9px}.f-grid p{font-size:12px;line-height:1.85;color:var(--muted);margin-top:14px;max-width:336px}
.join{display:flex;align-items:center;justify-content:space-between;gap:24px;padding:84px 0}.join h2{font-size:46px;letter-spacing:-2.4px;line-height:1.1}
.role{display:grid;grid-template-columns:44px 1fr 210px;gap:26px;align-items:start;border-top:1px solid var(--line);padding:28px 0}.role:last-of-type{border-bottom:1px solid var(--line)}.role .idx{font:10px var(--mono);color:#879e8d;padding-top:6px}.role h3{font-size:26px;letter-spacing-1px}.role h3{letter-spacing:-1px}.role .meta{display:flex;gap:20px;font-size:10px;color:var(--muted);margin-top:13px}.role .meta span{display:flex;gap:6px;align-items:center}.role p.body{font-size:12px;line-height:1.9;color:var(--muted);margin-top:15px;max-width:600px}
.role ul{list-style:none;padding:0;margin:14px 0 0;display:flex;flex-wrap:wrap;gap:8px}.role li{font:9px var(--mono);border:1px solid var(--line);padding:6px 9px;color:#5f6d69}
.role .apply{justify-self:end;margin-top:6px}
.contact-grid{display:grid;grid-template-columns:1fr 1fr;gap:76px;padding:66px 0 78px}.contact-grid h1{font-size:64px;letter-spacing:-3.4px;line-height:1.05;margin:26px 0 0}.contact-grid .lead{font-size:13px;line-height:1.9;color:var(--muted);margin-top:25px;max-width:400px}
.cards{display:grid;gap:14px;margin-top:34px}.way{display:grid;grid-template-columns:44px 1fr auto;gap:16px;align-items:center;border:1px solid var(--line);padding:20px;background:#fff;transition:border-color .2s}.way:hover{border-color:#7fae94}.way .ic{width:44px;height:44px;display:grid;place-items:center;background:#e5f1e7;color:#20724f}.way strong{font-size:15px;display:block}.way span{font-size:11px;color:var(--muted);display:block;margin-top:5px;overflow-wrap:anywhere}
.address{margin-top:34px;padding-top:24px;border-top:1px solid var(--line)}.address p{font-size:12px;line-height:1.9;color:var(--muted);margin-top:11px;max-width:320px}
.other{background:var(--ink);color:var(--paper);padding:44px}.other h2{font-size:28px;letter-spacing:-1.2px;margin-bottom:20px}.other .mono{font-size:8px;color:#8ea8a2}.other a{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:15px 0;border-top:1px solid var(--dark-line);font-size:13px}.other a:last-child{border-bottom:1px solid var(--dark-line)}.other a:hover{color:var(--accent)}
.other p{font-size:11px;line-height:1.9;color:#9fb3ad;margin-top:20px}
.faq{display:grid;grid-template-columns:.8fr 1.2fr;gap:88px;padding:24px 0 92px}.faq h2{font-size:44px;letter-spacing:-2.2px;line-height:1.1}.faq details{border-bottom:1px solid var(--line);padding:20px 0}.faq summary{list-style:none;display:flex;justify-content:space-between;gap:16px;font-size:14px;font-weight:600;cursor:pointer}.faq summary::-webkit-details-marker{display:none}.faq summary span{font-size:20px;font-weight:400}.faq details[open] summary span{transform:rotate(45deg)}.faq details p{font-size:12px;line-height:1.95;color:var(--muted);margin-top:18px;padding-right:26px}
.prose{max-width:1010px;padding-bottom:86px}.prose h1{font-size:70px;letter-spacing:-3.6px;line-height:1.05;margin-top:24px}.prose .content{max-width:730px;margin:52px 0 0 auto}.prose h2{font-size:24px;letter-spacing-.7px;margin:34px 0 14px}.prose h2{letter-spacing:-.7px}.prose p{font-size:13px;line-height:1.95;color:var(--muted)}.prose a{text-decoration:underline;overflow-wrap:anywhere}
.credit{font-size:10px;line-height:1.85;color:#5f6d69;margin-top:30px;max-width:800px}
.missing{max-width:800px;margin:0 auto;padding:60px 30px}.missing img{width:186px;margin-bottom:66px}.missing h1{font-size:58px;letter-spacing:-3px;line-height:1.08;margin:22px 0}.missing p{font-size:13px;color:var(--muted);line-height:1.9;margin-bottom:26px}
.sticky-wa{position:fixed;right:22px;bottom:22px;z-index:60;display:flex;align-items:center;gap:10px;background:#128c5a;color:#fff;padding:14px 18px;font-size:12px;font-weight:600;box-shadow:0 10px 30px rgba(14,74,47,.28)}.sticky-wa:hover{background:#0f7549}
@keyframes in{from{opacity:.55}to{opacity:1}}@keyframes marquee{to{transform:translateX(-50%)}}
@media(max-width:1100px){.container{width:calc(100% - 64px)}nav.main{gap:22px;margin-right:12px}.hero{gap:30px}.hero h1{font-size:clamp(64px,7.4vw,86px);letter-spacing:-4.6px}.split{gap:48px}.people{gap:48px}.f-top{gap:34px}.intro .row p{max-width:260px;font-size:12px}.contact-grid{gap:36px}.contact-grid h1{font-size:52px}.faq{gap:50px}}
@media(max-width:980px){nav.main{gap:18px}.head img{width:168px}.grid-ft{gap:28px}.step{grid-template-columns:1fr 1fr;gap:26px}.step svg{display:none}.service{gap:46px}.service h2{font-size:36px}.f-grid{gap:24px}.role{grid-template-columns:30px 1fr 200px;gap:20px}.apply{white-space:nowrap}}
@media(max-width:860px){.hero{grid-template-columns:1fr;gap:34px;padding-top:34px}.hero h1{font-size:70px}.frame{height:392px}.grid-ft{grid-template-columns:1fr}.card.tall{grid-row:auto;display:block}.card.tall .shot{min-height:0;aspect-ratio:1.35}.split{grid-template-columns:1fr;gap:36px}.people{grid-template-columns:1fr;gap:34px;padding-top:64px;padding-bottom:70px}.people img{height:340px}.tabs{grid-template-columns:repeat(2,1fr);gap:26px 0}.grid-all{grid-template-columns:1fr}.service{grid-template-columns:1fr;gap:32px}.service:nth-child(even) .txt{order:0}.story{grid-template-columns:1fr;gap:36px}.f-grid{grid-template-columns:1fr;gap:32px}.contact-grid{grid-template-columns:1fr;gap:40px}.faq{grid-template-columns:1fr;gap:36px}.f-top{grid-template-columns:1fr 1fr;gap:34px 26px}.f-top .brand{grid-column:1/-1}.intro .row{display:block}.intro .row p{margin-top:22px;max-width:420px}.prose .content{margin-left:0}.prose h1{font-size:54px}.join{display:block}.join .btn{margin-top:26px}}
@media(max-width:680px){.btn{font-size:11px;min-height:48px;padding:13px 16px;gap:14px}.btn.small{font-size:11px;min-height:44px;padding:12px 16px}html{scroll-padding-top:78px}.container{width:calc(100% - 40px)}.utility{height:24px;font-size:6px}.utility .container span:first-child{display:none}.head{height:72px}.head img{width:162px}nav.main,.head .btn{display:none}.burger{display:grid;place-items:center}.mobile{display:flex;flex-direction:column;padding:6px 20px 20px;border-top:1px solid var(--line)}.mobile[hidden]{display:none}@media(min-width:861px){.mobile{display:none!important}}.skip{position:absolute;left:-9999px;top:10px;z-index:200;background:var(--ink);color:#f5f5ef;padding:12px 18px;font-size:13px}.skip:focus{left:10px}.mobile a{display:flex;align-items:center;gap:16px;padding:17px 2px;border-bottom:1px solid var(--line);font-size:17px}.mobile a .mono{font-size:10px;color:#5f6d69}.mobile a svg{margin-left:auto}
.hero{padding-top:30px}.hero h1{font-size:57px;letter-spacing:-3.6px}.hero p.lead{font-size:13px}.hero-actions{gap:22px}.hero-actions .btn{font-size:11px;min-height:46px;padding:13px 15px;gap:16px}.hero-actions .text-link{font-size:11px}.signoff{display:none}.frame{height:330px}.gallery-bar{flex-wrap:wrap;gap:10px}.gallery-bar .mono{font-size:6px}.gallery-bar p{font-size:8px;max-width:200px}.controls .mono{font-size:7px}.controls button{width:26px;height:26px}
.partners .container{min-height:140px;gap:16px}.partners .label{flex:0 0 100px;padding-right:12px}.partners .label .mono{font-size:8px}.partners .label p{font-size:8px}.motion{font-size:7px}.logo{width:100px;height:54px}.logo img{max-width:100px;max-height:44px}.set{gap:30px;padding-right:30px}
section.block{padding:60px 0 58px}.head-row{margin-bottom:28px;gap:22px;align-items:flex-start}.head-row .aside{display:none}h2.big{font-size:39px;letter-spacing:-2px;margin-top:15px}.head-row .text-link{font-size:9px;white-space:nowrap;margin-top:36px}
.card .shot{aspect-ratio:1.45}.caption h3{font-size:21px}.caption p{font-size:10px}.arrow{display:none}.note{display:block;margin-top:26px;padding-top:16px}.note .mono{font-size:6px}.note p{font-size:9px;margin-top:7px}
.tabs .num{font-size:48px;letter-spacing:-2.6px}.tabs .lbl{font-size:7px;margin-top:16px}.step{display:block;padding-top:26px;min-height:140px}.step h3{font-size:23px}.step p{font-size:12px;margin-top:14px;max-width:380px}
.people h2{font-size:37px;letter-spacing:-1.9px}.people p{font-size:12px}.cta{padding:44px 0}.cta h2{font-size:42px;letter-spacing:-2.4px}.cta .row{margin-top:20px}.cta .buttons{gap:10px;margin-top:24px}.cta .btn{font-size:11px;min-height:48px;padding:13px 16px;gap:14px}.cta p{font-size:10px}
footer.site{padding-top:42px}.f-top{grid-template-columns:1fr;gap:32px;padding-bottom:30px}.f-top img{width:200px}.f-links{flex-direction:row;flex-wrap:wrap;gap:10px 22px}.f-links .mono{flex:0 0 100%}.f-contact .big{font-size:21px}.f-bottom{display:block}.f-bottom div{margin-top:15px;justify-content:space-between}.f-bottom p{font-size:7px}
.intro{padding-top:38px;padding-bottom:32px}.intro h1{font-size:50px;letter-spacing:-2.9px}.intro .row p{font-size:12px}.filters{display:block;padding:16px 0;margin-bottom:24px}.filters .set{gap:20px}.filters button{font-size:10px}.search{margin-top:12px;border-top:1px solid var(--line);padding-top:6px;justify-content:space-between;width:100%}.search input{width:80%;padding:10px 0}
.grid-all{gap:28px}.service{padding:42px 0;gap:26px}.service h2{font-size:35px}.service figure img{height:268px}.service li{font-size:12px;max-width:none}.about-img img{height:308px}.story{padding:44px 0 38px}.story h2{font-size:39px;letter-spacing:-1.9px}.story p{font-size:12px}.founders{padding:60px 0}.f-grid .ph{height:360px}.role{grid-template-columns:24px 1fr;gap:10px 14px;padding:22px 0}.role h3{font-size:23px}.role .meta{font-size:8px;gap:12px;flex-wrap:wrap}.role p.body{font-size:11px}.role .apply{grid-column:2;justify-self:start;margin-top:12px}.contact-grid{padding:38px 0 46px}.contact-grid h1{font-size:52px;letter-spacing:-2.9px}.contact-grid .lead{font-size:12px}.way{grid-template-columns:40px 1fr;padding:17px}.way .ic{width:40px;height:40px}.way strong{font-size:14px}.way span{font-size:10px}.way svg:last-child{grid-column:2;justify-self:end;margin-top:-24px}.other{padding:26px 22px}.other h2{font-size:24px}.faq{padding-bottom:56px}.faq h2{font-size:38px}.faq summary{font-size:12px}.faq details p{font-size:11px}.prose h1{font-size:48px}.prose .content{margin-top:36px}.prose h2{font-size:22px;margin-top:28px}.prose p{font-size:12px}.sticky-wa{right:14px;bottom:14px;padding:12px 15px;font-size:11px;gap:8px}}
@media(max-width:380px){.container{width:calc(100% - 32px)}.hero h1{font-size:50px;letter-spacing:-3.3px}.frame{height:300px}.head img{width:154px}h2.big{font-size:35px}.contact-grid h1{font-size:47px}.intro h1{font-size:46px}.prose h1{font-size:43px}}
@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}*,*::before,*::after{animation:none!important;transition:none!important}.window{overflow-x:auto}.set[aria-hidden=true]{display:none}.track{transform:none!important}}
@media(min-width:861px){:root{--muted:#4a5854;--soft:#b9c8c5}.mono{font-size:12px}.eyebrow{font-size:12px;color:#3f4e48}.utility{font-size:10px}.utility a{font-size:12px}.lead{font-size:18px;max-width:560px}.hero-actions .text-link{font-size:14px}.note .mono{font-size:10px;color:#5f6d69}.note p{font-size:14px}.frame-tag{font-size:10px}.controls .mono{font-size:12px}.gallery-bar .mono{font-size:10px;color:#5f6d69}.gallery-bar p{font-size:14px}.motion{font-size:11px}.partners .label .mono{font-size:12px}.partners .label p{font-size:14px}.caption p{font-size:13px}.caption p span{color:#8a948c}.kind{font-size:9px}.credit{font-size:13px}.head-row .text-link{font-size:14px}.acc summary .mono{font-size:12px}.acc .body p{font-size:15px;color:#c3d1cb;max-width:500px}.acc .body a{font-size:13px}.acc li,.chips span{font-size:11px}.tabs .lbl{font-size:11px;color:#4a5854}.step p{font-size:15px}.step h3{font-size:27px}.people .mono{font-size:11px;color:#5f6d69}.people p{font-size:15px}.cta p{font-size:14px}.signoff .mono{font-size:11px}.signoff p{font-size:14px}.f-top .brand p{font-size:14px;color:#b4c4be;max-width:320px}.f-links .mono,.f-contact .mono{font-size:11px;color:#9fb1ab}.f-links a{font-size:14px}.f-contact p,.f-contact .mail{font-size:14px}.f-bottom p{font-size:11px;color:#9fb1ab}.f-bottom div{font-size:12px}.filters button{font-size:14px}.search input{font-size:14px}.service .num{font-size:12px}.service .txt p{font-size:15px}.service li{font-size:14px}.service figcaption{font-size:11px;color:#6b7a75}.about-img .mono,.visual .mono{font-size:11px}.story p{font-size:16px}.f-grid .mono{font-size:11px;color:#4a5854}.f-grid p{font-size:14px}.other .mono{font-size:11px}.other p{font-size:14px}.role .idx{font-size:12px}.role .meta{font-size:13px}.role p.body{font-size:14px}.role li{font-size:11px}.way span{font-size:13px}.faq details p{font-size:14px}.faq summary{font-size:16px}.contact-grid .lead{font-size:16px;max-width:460px}.aside{font-size:15px}.dark .aside,.split .aside{color:#b4c6c1}.acc summary .mono{color:#8fa39b}nav.main a{font-size:15px;padding:14px 0}nav.main{gap:36px}.utility{height:34px}.utility a{font-size:11px;padding:8px 0}.f-links a{font-size:15px;padding:5px 0;display:inline-block}.f-contact .mail{padding:4px 0;display:inline-block}.f-bottom a{padding:6px 0;display:inline-block}.motion{font-size:11px;padding:6px 0}.acc li{font-size:11px;padding:7px 10px}.filters button b{font-size:11px}.chips span{font-size:11px}.kind{font-size:10px}.counter,.controls i{font-size:12px}.hero-actions .btn{font-size:15px;min-height:60px;padding:18px 30px}.filters button{padding:6px 0}.f-contact a{padding:4px 0;display:inline-block}}
`;

const icons={
 arrow:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg>',
 big:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg>',
 whatsapp:'<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.32 4.96L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2Zm0 18.02c-1.5 0-2.97-.4-4.25-1.16l-.3-.18-3.12.82.83-3.04-.2-.31a8.1 8.1 0 0 1-1.24-4.32c0-4.54 3.7-8.23 8.24-8.23 2.2 0 4.27.86 5.83 2.41a8.19 8.19 0 0 1 2.41 5.83c0 4.54-3.69 8.23-8.2 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.8-.23-.09-.39-.13-.56.12-.16.25-.64.8-.79.97-.14.16-.29.18-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.39-1.72-.14-.25-.01-.39.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.41.08-.16.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.83-.2-.48-.41-.42-.56-.42h-.48c-.16 0-.43.06-.65.31-.23.25-.86.84-.86 2.04 0 1.2.87 2.36.99 2.52.12.16 1.72 2.62 4.16 3.67.58.25 1.04.4 1.39.51.59.19 1.12.16 1.55.1.47-.07 1.45-.59 1.66-1.17.2-.57.2-1.06.14-1.17-.06-.11-.22-.17-.47-.29Z"/></svg>',
 phone:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.5 2.1L8 9.6a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.8.3 1.7.5 2.6.6a2 2 0 0 1 1.7 2Z"/></svg>',
 mail:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 6 10-6"/></svg>',
 pin:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>',
 brief:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
 pause:'<svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5h3v14H8zM13 5h3v14h-3z"/></svg>',
 play:'<svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4l13 8-13 8z"/></svg>',
 left:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
 right:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>',
 search:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
 menu:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>'
};
const logoMark=(light)=>`<img src="${u(light?'assets/brand/logo-light.png':'assets/brand/logo.png')}" width="196" height="57" alt="${light?'Gati Infra Project Buildcon':'Gati Infra Project Buildcon Pvt Ltd'}">`;

const nav=[['Home','index.html'],['Our work','work/index.html'],['Expertise','expertise/index.html'],['About Gati','about/index.html'],['Careers','careers/index.html'],['Contact','contact/index.html']];

const LIVE=process.env.LIVE_URL??'https://suryansh4567.github.io/gati-site';
function head({title,description,slug='',page}){
 const path=slug?`/${slug}/`:'/';
 return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title><meta name="description" content="${description}"><meta name="robots" content="noindex,follow">
<meta property="og:title" content="${title}"><meta property="og:description" content="${description}"><meta property="og:type" content="website">
<link rel="canonical" href="${LIVE}${path}"><meta property="og:url" content="${LIVE}${path}"><meta property="og:image" content="${LIVE}/assets/brand/og-image.jpg"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="Gati Infra Project Buildcon — RCC and civil construction, Delhi NCR &amp; Haryana"><meta property="og:site_name" content="Gati Infra Project Buildcon"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="${LIVE}/assets/brand/og-image.jpg"><meta name="theme-color" content="#1c2a36">
<link rel="icon" href="${u('assets/brand/favicon.svg')}"><link rel="icon" href="${u('assets/brand/favicon-192.png')}" sizes="192x192" type="image/png"><link rel="apple-touch-icon" href="${u('assets/brand/favicon-192.png')}">
<link rel="preload" href="${u('assets/fonts/Manrope.woff2')}" as="font" type="font/woff2" crossorigin><link rel="preload" href="${u('assets/fonts/IBMPlexMono.woff2')}" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${u('assets/site.css')}">
<script defer src="${u('assets/site.js')}"></script></head><body data-page="${page}"><a class="skip" href="#top">Skip to content</a>
<div class="utility"><div class="container"><span>RCC &amp; CIVIL CONSTRUCTION · ${P.region.toUpperCase()}</span><a href="tel:${tels}">${P.primary}${icons.arrow}</a></div></div>
<header class="site"><div class="container head"><a href="${u('index.html')}" aria-label="Gati home">${logoMark(false)}</a>
<nav class="main" aria-label="Main navigation">${nav.slice(1).map(([label,href])=>`<a href="${u(href)}"${page===href.split('/')[0]?` aria-current="page"`:''}>${label}</a>`).join('')}</nav>
<a class="btn small" href="${wa('Hello Gati, I would like to discuss a construction requirement.')}" target="_blank" rel="noopener">WhatsApp us ${icons.whatsapp}</a>
<button class="burger" aria-expanded="false" aria-controls="mobile-nav" aria-label="Open menu">${icons.menu}</button></div>
<nav class="mobile" id="mobile-nav" aria-label="Mobile navigation" hidden>${nav.map(([label,href],i)=>`<a href="${u(href)}"><span class="mono">0${i+1}</span>${label}${icons.arrow}</a>`).join('')}</nav></header>`;
}
const footer=`<footer class="site"><div class="container"><div class="f-top">
<div class="brand"><a href="${u('index.html')}" aria-label="Gati home">${logoMark(true)}</a><p>The work is our word.<br>RCC &amp; civil construction across ${P.region}.</p></div>
<div class="f-links"><span class="mono">EXPLORE</span><a href="${u('work/index.html')}">Our work</a><a href="${u('expertise/index.html')}">Our expertise</a><a href="${u('about/index.html')}">About Gati</a><a href="${u('careers/index.html')}">Work with us</a><a href="${u('contact/index.html')}">Contact</a></div>
<div class="f-contact"><span class="mono">START A CONVERSATION</span><a class="big" href="tel:${tels}">${P.primary}${icons.arrow}</a><a class="big" href="tel:${tel2}">${P.secondary}</a><a class="mail" href="mailto:${P.email}">${P.email}</a><p>${P.address}</p><p><a href="${wa('Hello Gati, I have a question.')}" target="_blank" rel="noopener">Message us on WhatsApp ↗</a></p></div></div>
<div class="f-bottom"><p>© ${new Date().getFullYear()} Gati Infra Project Buildcon Pvt Ltd</p><div><a href="${u('privacy/index.html')}">Privacy note</a><a href="#top">BACK TO TOP ↑</a></div></div></div></footer>
<a class="sticky-wa" href="${wa('Hello Gati, I would like to discuss a project.')}" target="_blank" rel="noopener" aria-label="Start a WhatsApp conversation">${icons.whatsapp}<span>WhatsApp</span></a>
</body></html>`;
const projectCard=(p)=>{
 const href=u('work/'+p.slug+'/index.html');
 return `<a class="card${p.tall?' tall':''}" href="${href}"><span class="shot"><img src="${u('assets/images/'+p.image+'.webp')}" alt="${p.title}, ${p.location}" loading="lazy" decoding="async" width="${PROJECT_DIM[p.image][0]}" height="${PROJECT_DIM[p.image][1]}">
 <span class="chips"><span class="chip">${p.category.toUpperCase()}</span><span class="chip live"><i></i>${p.status.toUpperCase()}</span></span>
 <span class="kind">${p.visual?'PROJECT VISUAL':'PROJECT PHOTO'}</span><span class="arrow">${icons.big}</span></span>
 <span class="caption"><span><h3>${p.title}</h3><p>${p.location}<span>/</span>${p.scope}</p></span>${icons.arrow}</span></a>`;
};
const sectionHead=(eyebrow,h2,aside,extra='')=>`<div class="head-row"><div><div class="eyebrow"><i></i>${eyebrow}</div><h2 class="big">${h2}</h2></div>${aside||extra}</div>`;

// Home
const home=`<main id="top">
<section class="container hero"><div>
<div class="eyebrow"><i></i>RCC &amp; CIVIL CONSTRUCTION</div>
<h1><span>The work</span><span>comes first.</span></h1>
<p class="lead">RCC structures, civil works and hands-on execution.
For builders and developers across ${P.region}.</p>
<div class="hero-actions"><a class="btn" href="${u('work/index.html')}">Explore our work ${icons.arrow}</a><a class="btn wa" href="${wa('Hello Gati, I would like to discuss a construction project.')}" target="_blank" rel="noopener">WhatsApp ${icons.whatsapp}</a></div>
<div class="signoff"><span class="cross"></span><div><span class="mono">FROM FOUNDATION TO TOP SLAB</span><p>The structure. The people. The follow-through.</p></div></div>
</div><div>
<div class="frame main-frame"><img class="shot-main" src="${u('assets/images/site-1.webp')}" alt="Construction site photograph from the Gati gallery" width="1240" height="571" fetchpriority="high" decoding="async"><span class="frame-tag"><i></i>ENGINEERED ON PAPER. BUILT ON SITE.</span></div>
<div class="gallery-bar"><div><span class="mono main-label">RCC REINFORCEMENT / ON SITE</span><p class="main-text">The details carry the bigger picture.</p></div>
<div class="controls"><span class="mono"><b class="counter">01</b><i>/ 04</i></span><button class="prev" aria-label="Previous photograph">${icons.left}</button><button class="next" aria-label="Next photograph">${icons.right}</button></div></div>
</div></section>

<section class="partners" aria-label="Selected clients"><div class="container"><div class="label"><span class="mono">GOOD COMPANY.</span><p>Some of the names in our working story.</p><button class="motion" aria-pressed="false">${icons.pause}<span>Pause motion</span></button></div>
<div class="window"><div class="track">${[0,1].map(copy=>`<div class="set"${copy?` aria-hidden="true"`:''}>${partners.map(([name,id])=>`<div class="logo" title="${name}"><img src="${u('assets/partners/partner-'+id+'.png')}" width="${partnerSize[id][0]}" height="${partnerSize[id][1]}" alt="${copy?'':name}" loading="eager" decoding="async"></div>`).join('')}</div>`).join('')}</div></div></div></section>

<section class="container block"><div class="head-row"><div><div class="eyebrow"><i></i>01 / SELECTED WORK</div><h2 class="big">The proof is<br>in the projects.</h2></div><a class="text-link" href="${u('work/index.html')}">View all projects ${icons.arrow}</a></div>
<div class="grid-ft">${[0,1,2].map(i=>projectCard({...projects[i],tall:i===0})).join('')}</div>
<div class="note"><span class="mono">RESIDENTIAL / COMMERCIAL / INFRASTRUCTURE</span><p>Our role, clearly defined. Our work, on the ground.</p></div></section>

<section class="dark block"><div class="container"><div class="head-row"><div><div class="eyebrow"><i></i>02 / WHAT WE BRING</div><h2 class="big">One team.<br>The whole structure.</h2></div><p class="aside">Specialist execution, without<br>unnecessary layers in between.</p></div>
<div class="split"><div class="acc">${services.map((s,i)=>`<details${i===0?' open':''} name="service"><summary><span class="mono">${s.n}</span>${s.title}<span class="mark">${i===0?'−':'+'}</span></summary><div class="body"><p>${s.body}</p><ul>${s.items.map(x=>`<li>${x}</li>`).join('')}</ul><a class="text-link light" href="${wa(`Hello Gati, I would like to discuss ${s.title.toLowerCase()}.`)}" target="_blank" rel="noopener">Discuss this on WhatsApp ${icons.arrow}</a></div></details>`).join('')}</div>
<div class="visual"><img class="service-shot" src="${u('assets/images/site-3.webp')}" alt="${services[0].alt}" width="${SERVICE_DIM[services[0].image][0]}" height="${SERVICE_DIM[services[0].image][1]}"><span class="mono service-label">THE SCOPE / 01</span><p class="service-line">${services[0].short}</p></div></div></div></section>

<section class="container block"><div class="head-row"><div><div class="eyebrow"><i></i>03 / HOW THE WORK HAPPENS</div><h2 class="big">A clear way<br>from plan to place.</h2></div><p class="aside">Four considered steps.<br>One shared understanding.</p></div>
<div class="tabs" role="group" aria-label="Process steps">${steps.map((s,i)=>`<button aria-pressed="${i===0}" data-step="${i}"><span class="num">0${i+1}</span><span class="lbl">${s.label}</span><span class="rule"><i></i></span></button>`).join('')}</div>
<div class="step" aria-live="polite"><h3>${steps[0].title}</h3><p>${steps[0].body}</p>${icons.big}</div></section>

<section class="container people"><div><img src="${u('assets/images/site-5.webp')}" alt="Members of the construction team from the Gati site gallery" loading="lazy" decoding="async" width="1280" height="591"><span class="mono">THE PEOPLE BEHIND THE PROGRESS</span></div>
<div><div class="eyebrow"><i></i>04 / THE GATI WAY</div><h2>Hands-on people.<br>Accountable work.</h2>
<p>We are a construction company built around the people who actually do the work. Our founders stay close to the execution, our teams stay close to the drawings, and our focus stays on the project.</p>
<p>No distant layers. Just people who know the site and understand their part in it.</p>
<a class="text-link" href="${u('about/index.html')}">Get to know Gati ${icons.arrow}</a></div></section>

<section class="cta"><div class="container"><div class="eyebrow"><i></i>THE NEXT GOOD PROJECT STARTS HERE</div>
<div class="row"><h2>Have a drawing?<br>Let’s make it real.</h2></div>
<div class="buttons"><a class="btn wa" href="${wa('Hello Gati, I would like to discuss a project. Here are my requirements:')}" target="_blank" rel="noopener">Message on WhatsApp ${icons.whatsapp}</a><a class="btn ghost" href="tel:${tels}">Call ${P.primary}</a></div>
<p>A conversation first. A considered way forward.</p></div></section>
</main>`;

// Work
const workCards=projects.map(p=>projectCard(p)).join('');
const work=`<main id="top">
<section class="container intro"><div class="eyebrow"><i></i>OUR WORK / BUILT ON THE GROUND</div>
<div class="row"><h1>A portfolio<br>with substance.</h1><p>Residential structures, commercial developments and the work that brings them together.</p></div></section>
<section class="container" style="padding-bottom:84px">
<div class="filters"><div class="set" role="group" aria-label="Filter projects">
${['All work','Residential','Commercial','Ongoing'].map((f,i)=>`<button aria-pressed="${i===0}" data-filter="${f}">${f}<b>${projects.filter(p=>f==='All work'||p.category===f||p.status===f).length}</b></button>`).join('')}</div>
<label class="search">${icons.search}<input type="search" placeholder="Find a project or place" aria-label="Search projects"></label></div>
<div class="grid-all" id="project-grid">${workCards}</div>
<p class="credit">Project scopes and status are drawn from the company’s published portfolio. Project visuals are labelled separately from site photography. Gati is presented as an execution contractor, not as the developer of every building shown.</p>
</section>
<section class="cta"><div class="container"><div class="eyebrow"><i></i>DISCUSS SOMETHING SIMILAR</div><div class="row"><h2>Tell us about<br>your project.</h2></div>
<div class="buttons"><a class="btn wa" href="${wa('Hello Gati, I saw your project portfolio and would like to discuss my project.')}" target="_blank" rel="noopener">WhatsApp ${icons.whatsapp}</a><a class="btn ghost" href="tel:${tels}">Call ${P.primary}</a></div></div></section>
</main>`;

// Expertise
const expertise=`<main id="top">
<section class="container intro"><div class="eyebrow"><i></i>OUR EXPERTISE</div><div class="row"><h1>The whole scope.<br>Handled with care.</h1><p>Specialist RCC execution at the core. Practical civil, renovation and residential capabilities around it.</p></div></section>
<div class="container">${services.map(s=>`<section class="service" id="${s.id}"><div class="txt"><span class="mono num">${s.n} / OUR EXPERTISE</span><h2>${s.title}</h2><p>${s.body}</p><ul>${s.items.map(x=>`<li><span>↗</span>${x}</li>`).join('')}</ul><a class="text-link" href="${wa(`Hello Gati, I need help with ${s.title.toLowerCase()}.`)}" target="_blank" rel="noopener">Ask about this on WhatsApp ${icons.arrow}</a></div>
<figure><img src="${u('assets/images/'+s.image+'.webp')}" alt="${s.alt}" loading="lazy" decoding="async" width="${SERVICE_DIM[s.image][0]}" height="${SERVICE_DIM[s.image][1]}"><figcaption>${s.id==='homes'?'<span>PROJECT VISUAL</span>':'<span>SITE PHOTOGRAPH</span>'} / ${s.short.toUpperCase()}</figcaption></figure></section>`).join('')}</div>
<section class="cta"><div class="container"><div class="eyebrow"><i></i>SHARE THE REQUIREMENT</div><div class="row"><h2>Send the scope.<br>We’ll take it from there.</h2></div>
<div class="buttons"><a class="btn wa" href="${wa('Hello Gati, here is my project scope:')}" target="_blank" rel="noopener">WhatsApp the details ${icons.whatsapp}</a><a class="btn ghost" href="mailto:${P.email}?subject=Project%20enquiry">Email us</a></div></div></section>
</main>`;

// About
const about=`<main id="top">
<section class="container intro"><div class="eyebrow"><i></i>GATI INFRA PROJECT BUILDCON</div><div class="row"><h1>A hands-on<br>kind of company.</h1><p>Close to the site. Close to the team. Focused on the work that needs to get done.</p></div></section>
<section class="container about-img"><img width="1600" height="738" loading="lazy" decoding="async" src="${u('assets/images/site-6.webp')}" alt="RCC construction site and execution teams"><span class="mono">ON-SITE EXECUTION / GATI SITE GALLERY</span></section>
<section class="container story"><div><div class="eyebrow"><i></i>OUR STARTING POINT</div></div><div><h2>Honest work is<br>a good foundation.</h2>${aboutCopy.map(p=>`<p>${p}</p>`).join('')}</div></section>
<section class="founders"><div class="container"><div class="head-row"><div><div class="eyebrow"><i></i>THE PEOPLE LEADING THE WORK</div><h2 class="big">Founders.<br>Still hands-on.</h2></div><p class="aside">Three founding partners.<br>A shared responsibility to the work.</p></div>
<div class="f-grid">${founders.map(f=>`<article><div class="ph"><img src="${u('assets/images/'+f.image+'.webp')}" alt="${f.name}" loading="lazy" decoding="async" width="${FOUNDER_DIM[f.image][0]}" height="${FOUNDER_DIM[f.image][1]}"></div><h3>${f.name}</h3><span class="mono">FOUNDER &amp; DIRECTOR</span><p>${f.text}</p></article>`).join('')}</div></div></section>
<section class="container join"><div><div class="eyebrow"><i></i>GOOD WORK NEEDS GOOD PEOPLE</div><h2>Bring your skill<br>to the next site.</h2></div><a class="btn" href="${u('careers/index.html')}">Explore open roles ${icons.arrow}</a></section>
<section class="cta"><div class="container"><div class="eyebrow"><i></i>WORK WITH GATI</div><div class="row"><h2>Start with<br>a conversation.</h2></div>
<div class="buttons"><a class="btn wa" href="${wa('Hello Gati, I would like to work with you.')}" target="_blank" rel="noopener">WhatsApp ${icons.whatsapp}</a><a class="btn ghost" href="tel:${tels}">Call ${P.primary}</a></div></div></section>
</main>`;

// Careers
const careers=`<main id="top">
<section class="container intro"><div class="eyebrow"><i></i>WORK WITH US</div><div class="row"><h1>Your skill.<br>Our next chapter.</h1><p>Good construction starts with the right people. Bring your experience, your attention to detail and your willingness to work as a team.</p></div></section>
<section class="container" style="padding-bottom:80px">
<div class="head-row"><div><div class="eyebrow"><i></i>FIND YOUR PLACE ON THE TEAM</div><h2 class="big">Open roles</h2></div><p class="aside">${P.region} · On-site roles<br>Apply directly on WhatsApp</p></div>
${roles.map((r,i)=>`<article class="role"><span class="idx">0${i+1}</span><div><h3>${r.title}</h3><div class="meta"><span>${icons.pin}${P.region}</span><span>${icons.brief}${r.type}</span></div><p class="body">${r.body}</p><ul>${r.requirements.map(x=>`<li>${x}</li>`).join('')}</ul></div>
<a class="btn wa small apply" href="${wa(`Hello Gati, I would like to apply for the ${r.title} role. My experience and CV: `)}" target="_blank" rel="noopener">Apply on WhatsApp ${icons.whatsapp}</a></article>`).join('')}
<p class="credit">Send your CV or documents directly in the WhatsApp chat. This website does not collect or store applications. Salary, accommodation and site details are discussed with the team directly.</p>
</section>
<section class="cta"><div class="container"><div class="eyebrow"><i></i>A DIRECT LINE TO THE TEAM</div><div class="row"><h2>Questions about<br>a role? Ask us.</h2></div>
<div class="buttons"><a class="btn wa" href="${wa('Hello Gati, I have a question about working with you.')}" target="_blank" rel="noopener">WhatsApp ${icons.whatsapp}</a><a class="btn ghost" href="tel:${tel2}">Call ${P.secondary}</a></div></div></section>
</main>`;

// Contact
const contact=`<main id="top">
<section class="container contact-grid"><div>
<div class="eyebrow"><i></i>LET’S GET THE CONVERSATION STARTED</div>
<h1>Tell us what<br>you’re building.</h1>
<p class="lead">Share the scope, the drawings or simply where you are in the process. Everything here goes straight to the team — WhatsApp, a call or an email.</p>
<div class="address"><span class="mono">FIND US</span><p>${P.address}</p><a class="text-link" href="https://www.google.com/maps/search/?api=1&amp;query=${encodeURIComponent(P.address)}" target="_blank" rel="noopener">Open in Google Maps ${icons.arrow}</a></div>
</div>
<div>
<div class="cards">
<a class="way" href="${wa('Hello Gati, I would like to discuss a project. Details: ')}" target="_blank" rel="noopener"><span class="ic">${icons.whatsapp}</span><span><strong>WhatsApp — fastest reply</strong><span>${P.primary} · share drawings, photos or documents</span></span>${icons.arrow}</a>
<a class="way" href="tel:${tels}"><span class="ic">${icons.phone}</span><span><strong>Call the team</strong><span>${P.primary}</span></span>${icons.arrow}</a>
<a class="way" href="tel:${tel2}"><span class="ic">${icons.phone}</span><span><strong>Second number</strong><span>${P.secondary}</span></span>${icons.arrow}</a>
<a class="way" href="mailto:${P.email}?subject=Project%20enquiry&amp;body=Hello%20Gati%2C%0A%0AI%20would%20like%20to%20discuss%3A%20"><span class="ic">${icons.mail}</span><span><strong>Email</strong><span>${P.email}</span></span>${icons.arrow}</a>
</div>
<div class="other"><span class="mono">WORKING HOURS</span><h2>Mon – Sat · 9:00 to 19:00</h2>
<a href="${u('careers/index.html')}">Looking for a job? See open roles ${icons.arrow}</a>
<a href="${wa('Hello Gati, I want to share my project drawings.')}" target="_blank" rel="noopener">Already have drawings? Send them now ${icons.whatsapp}</a>
<p>This website does not use a form, cookie or database. Your message stays in your own WhatsApp, phone or email app — nothing is stored here.</p></div>
</div></section>
<section class="container faq"><div><div class="eyebrow"><i></i>A FEW USEFUL ANSWERS</div><h2>Before we<br>get started.</h2></div>
<div>${faqs.map(([q,a])=>`<details><summary>${q}<span>+</span></summary><p>${a}</p></details>`).join('')}</div></section>
</main>`;

// Privacy
const privacy=`<main id="top"><section class="container prose">
<div class="eyebrow"><i></i>PRIVACY / A CLEAR UNDERSTANDING</div>
<h1>Nothing is<br>collected here.</h1>
<div class="content">
<h2>No forms, no database</h2><p>This website is a set of static pages. It has no enquiry form, no job-application form, no login, no cookies and no database. Nothing you type or tap is stored by this website.</p>
<h2>WhatsApp, phone and email</h2><p>When you tap a WhatsApp, call or email button, the conversation opens in your own app. Anything you share — a message, drawing, photo, CV or document — is handled by that service and by the Gati team, not by this site. WhatsApp and email providers have their own privacy terms.</p>
<h2>No tracking</h2><p>There are no advertising trackers, analytics scripts or third-party embeds on this website. Fonts and images are served from this site itself.</p>
<h2>Questions or removal requests</h2><p>To ask about a message you have already sent, or to request that your details be removed from the team’s records, contact ${P.email} or call ${P.primary}.</p>
<h2>Website credits</h2><p class="credit">Design and build by the Gati web project. Company information, project scopes and imagery are supplied references and not independently verified. Manrope and IBM Plex Mono are used under the SIL Open Font License; licence texts are available under <a href="${u('assets/fonts/Manrope-LICENSE.txt')}">Manrope</a> and <a href="${u('assets/fonts/IBMPlexMono-LICENSE.txt')}">IBM Plex Mono</a>.</p>
</div></section></main>`;

const js=`(function(){
 var frames=[
  {src:'assets/images/site-1.webp',label:'RCC REINFORCEMENT / ON SITE',text:'The details carry the bigger picture.',alt:'Reinforcement work from the Gati site gallery'},
  {src:'assets/images/site-3.webp',label:'FORMWORK / SLAB PREPARATION',text:'Precision starts before the concrete.',alt:'Formwork and slab preparation on site'},
  {src:'assets/images/site-5.webp',label:'PEOPLE / SKILL / COORDINATION',text:'Good work starts with good people.',alt:'Construction team members on site'},
  {src:'assets/images/site-7.webp',label:'EXECUTION / ON THE GROUND',text:'Progress you can stand on.',alt:'Concrete placement at a project site'}
 ];
 var img=document.querySelector('.main-frame img'),label=document.querySelector('.main-label'),text=document.querySelector('.main-text'),counter=document.querySelector('.counter'),i=0;
 function show(n){if(!img)return;i=(n+frames.length)%frames.length;img.src=BASE+frames[i].src;img.alt=frames[i].alt;label.textContent=frames[i].label;text.textContent=frames[i].text;counter.textContent='0'+(i+1);}
 var prev=document.querySelector('.controls .prev'),next=document.querySelector('.controls .next');
 if(prev)prev.addEventListener('click',function(){show(i-1);});if(next)next.addEventListener('click',function(){show(i+1);});
 var motion=document.querySelector('.motion'),track=document.querySelector('.track');
 if(motion&&track){motion.addEventListener('click',function(){var paused=track.parentElement.classList.toggle('paused');motion.setAttribute('aria-pressed',paused?'true':'false');motion.querySelector('span').textContent=paused?'Play motion':'Pause motion';motion.firstElementChild.outerHTML=paused?ICONS.play:ICONS.pause;});}
 var burger=document.querySelector('.burger'),mobile=document.getElementById('mobile-nav');
 if(burger&&mobile){burger.addEventListener('click',function(){var open=mobile.hasAttribute('hidden');if(open)mobile.removeAttribute('hidden');else mobile.setAttribute('hidden','');burger.setAttribute('aria-expanded',open?'true':'false');burger.setAttribute('aria-label',open?'Close menu':'Open menu');if(open){var first=mobile.querySelector('a');if(first)first.focus();}});}
 if(window.requestIdleCallback&&frames.length){window.requestIdleCallback(function(){frames.forEach(function(f){var im=new Image();im.src=BASE+f.src;});});}
 var buttons=[].slice.call(document.querySelectorAll('.tabs button'));
 if(buttons.length){var head=document.querySelector('.step h3'),body=document.querySelector('.step p');
  buttons.forEach(function(b){b.addEventListener('click',function(){buttons.forEach(function(x){x.setAttribute('aria-pressed','false');});b.setAttribute('aria-pressed','true');var step=STEPS[Number(b.dataset.step)];head.textContent=step.title;body.textContent=step.body;});});}
 var acc=document.querySelectorAll('.acc details');
 [].forEach.call(acc,function(d){d.addEventListener('toggle',function(){var mark=d.querySelector('.mark');if(!mark)return;mark.textContent=d.open?'−':'+';});});
 var filterButtons=[].slice.call(document.querySelectorAll('.filters button')),search=document.querySelector('.search input'),cards=[].slice.call(document.querySelectorAll('#project-grid .card')),active='All work';
 function apply(){var q=(search&&search.value||'').toLowerCase();var shown=0;
  cards.forEach(function(card){var data=CARDS[card.getAttribute('href')];var matchFilter=active==='All work'||data.category===active||data.status===active;var matchText=!q||(data.text||'').indexOf(q)>-1;var visible=matchFilter&&matchText;card.style.display=visible?'':'none';if(visible)shown++;});
  var empty=document.getElementById('no-results');if(shown===0&&!empty&&cards.length){var p=document.createElement('p');p.id='no-results';p.className='credit';p.textContent='No projects match that search. Try another place, or reset the filters.';document.getElementById('project-grid').after(p);}else if(shown>0&&empty)empty.remove();}
 filterButtons.forEach(function(b){b.addEventListener('click',function(){active=b.dataset.filter;filterButtons.forEach(function(x){x.setAttribute('aria-pressed','false');});b.setAttribute('aria-pressed','true');apply();});});
 if(search)search.addEventListener('input',apply);
 var svc=document.querySelector('.acc'),shot=document.querySelector('.service-shot'),svcLabel=document.querySelector('.service-label'),svcLine=document.querySelector('.service-line');
 if(svc&&shot){svc.addEventListener('toggle',function(e){var d=e.target;if(!d.open||!SERVICES[d.querySelector('summary .mono').textContent.trim()])return;var data=SERVICES[d.querySelector('summary .mono').textContent.trim()];shot.src=BASE+data.image;shot.alt=data.alt;shot.style.filter=data.saturate;svcLabel.textContent='THE SCOPE / '+data.n;svcLine.textContent=data.short;},true);}
})();`;

const stepsJson=JSON.stringify(steps);
const servicesJson=JSON.stringify(Object.fromEntries(services.map(s=>[s.n,{n:s.n,short:s.short,image:'assets/images/'+s.image+'.webp',alt:s.alt,saturate:s.id==='homes'?'saturate(1)':'saturate(.55)'}])));
const cardsJson=JSON.stringify(Object.fromEntries(projects.flatMap(p=>{const data={category:p.category,status:p.status,text:`${p.title} ${p.location} ${p.scope}`.toLowerCase()};return [[u('work/'+p.slug+'/index.html'),data],['work/'+p.slug+'/index.html',data]];})));
const boot=`<script>var BASE=${JSON.stringify(BASE+'/')};var STEPS=${stepsJson};var SERVICES=${servicesJson};var CARDS=${cardsJson};</script>`;
const orgSchema=`<script type="application/ld+json">${JSON.stringify({'@context':'https://schema.org','@type':'Organization',name:'Gati Infra Project Buildcon Pvt Ltd',url:LIVE+'/',logo:LIVE+'/assets/brand/logo.png',telephone:tels,email:P.email,address:{'@type':'PostalAddress',streetAddress:'A-89, A1-Block, Chhattarpur Extension',addressLocality:'New Delhi',postalCode:'110074',addressCountry:'IN'},areaServed:P.region,contactPoint:[{'@type':'ContactPoint',telephone:tels,contactType:'customer service'},{'@type':'ContactPoint',telephone:tel2,contactType:'customer service'}]})}</script>`;

function page({title,description,slug,body,schema}){
 const dir=slug?join(OUT,slug):OUT;
 mkdirSync(dir,{recursive:true});
 let h=head({title,description,slug,page:slug.split('/')[0]||'index'});
 if(schema)h=h.replace('</head>',schema+'</head>');
 const html=h+body+footer;
 writeFileSync(join(dir,'index.html'),html.replace('</body></html>',boot+'</body></html>'));
}

// Write pages
mkdirSync(OUT,{recursive:true});
page({title:'Gati — The work comes first.',description:`RCC structural execution, civil works and hands-on construction across ${P.region}. Talk to the team on WhatsApp, call or email.`,slug:'',body:home,schema:orgSchema});
page({title:'Our work | Gati',description:'Residential and commercial project portfolio — RCC structural execution and civil works across Delhi NCR and Haryana.',slug:'work',body:work});
page({title:'Our expertise | Gati',description:'RCC structural execution, civil and infrastructure works, renovation and maintenance, and independent home construction.',slug:'expertise',body:expertise});
page({title:'About Gati',description:'A hands-on construction company: founders, approach and working philosophy.',slug:'about',body:about});
page({title:'Careers | Gati',description:'Open site roles across Delhi NCR. Apply directly on WhatsApp.',slug:'careers',body:careers});
page({title:'Contact | Gati',description:`WhatsApp ${P.primary}, call the team or send an email. Office in Chhattarpur Extension, New Delhi.`,slug:'contact',body:contact});
page({title:'Privacy | Gati',description:'This website collects nothing: no forms, cookies, database or tracking.',slug:'privacy',body:privacy});
for(const p of projects){
 const body=`<main id="top"><section class="container intro"><a class="text-link" href="${u('work/index.html')}" style="margin-bottom:30px">← All projects</a>
 <div class="eyebrow"><i></i>${p.category.toUpperCase()} / ${p.status.toUpperCase()}</div>
 <div class="row"><h1>${p.title}</h1><p>${p.location}<br>${p.scope}</p></div></section>
 <div class="container"><img src="${u('assets/images/'+p.image+'.webp')}" alt="${p.title}, ${p.location}" width="${PROJECT_DIM[p.image][0]}" height="${PROJECT_DIM[p.image][1]}" fetchpriority="high" decoding="async" style="width:100%;max-height:620px;object-fit:cover;object-position:center 30%">
 <p class="credit">${p.visual?'PROJECT VISUAL':'PROJECT PHOTO'} / COMPANY PORTFOLIO</p></div>
 <section class="container story"><div><div class="eyebrow"><i></i>THE WORK IN CONTEXT</div></div><div><h2>A considered part<br>of the bigger picture.</h2>${p.body.map(x=>`<p>${x}</p>`).join('')}
 <div style="margin-top:26px"><a class="btn wa" href="${wa(`Hello Gati, I would like to discuss a project similar to ${p.title} (${p.location}).`)}" target="_blank" rel="noopener">Discuss a similar project ${icons.whatsapp}</a></div></div></section>
 <section class="container" style="padding:10px 0 74px"><div class="grid-all">${projects.filter(x=>x.slug!==p.slug).slice(0,2).map(x=>projectCard(x)).join('')}</div></section>
 <section class="cta"><div class="container"><div class="eyebrow"><i></i>NEXT STEP</div><div class="row"><h2>Send us<br>your drawings.</h2></div>
 <div class="buttons"><a class="btn wa" href="${wa('Hello Gati, I would like to share my project drawings.')}" target="_blank" rel="noopener">WhatsApp ${icons.whatsapp}</a><a class="btn ghost" href="tel:${tels}">Call ${P.primary}</a></div></div></section></main>`;
 page({title:`${p.title} | Gati`,description:`${p.scope} — ${p.location}. ${p.body[0].slice(0,120)}`,slug:'work/'+p.slug,body});
}
mkdirSync(join(OUT,'assets'),{recursive:true});
writeFileSync(join(OUT,'assets','site.css'),css);
writeFileSync(join(OUT,'assets','site.js'),`var ICONS={pause:'${icons.pause.replace(/'/g,"\\'")}',play:'${icons.play.replace(/'/g,"\\'")}'};`+js);
mkdirSync(join(OUT,'assets','brand'),{recursive:true});
writeFileSync(join(OUT,'assets','brand','favicon.svg'),`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#1c2a36"/><path d="m18 17 15 15-15 15" fill="none" stroke="#12d8b0" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><path d="m32 17 15 15-15 15" fill="none" stroke="#1fa2ff" stroke-opacity=".65" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>`);
writeFileSync(join(OUT,'robots.txt'),'User-agent: *\nDisallow: /\n');
writeFileSync(join(OUT,'.nojekyll'),'');
writeFileSync(join(OUT,'404.html'),head({title:'Page not found | Gati',description:'This page could not be found.',page:'404'})+`<main class="missing"><a href="${u('index.html')}">${logoMark(false)}</a><h1>Not every path<br>leads to a project.</h1><p>This page may have moved. Head back to solid ground.</p><a class="btn" href="${u('index.html')}">Back to the homepage ${icons.arrow}</a></main></body></html>`);
for(const dir of ['partners','fonts','brand']){
 mkdirSync(join(OUT,'assets',dir),{recursive:true});
 for(const file of readdirSync(join('assets',dir)))copyFileSync(join('assets',dir,file),join(OUT,'assets',dir,file));
}
// Publish only the images the templates actually reference, and prune anything
// already sitting in the output that is no longer part of the build.
mkdirSync(join(OUT,'assets','images'),{recursive:true});
const missing=USED_IMAGES.filter(f=>!existsSync(join('assets','images',f)));
if(missing.length)throw new Error('Missing image(s) referenced by the templates: '+missing.join(', '));
for(const file of USED_IMAGES)copyFileSync(join('assets','images',file),join(OUT,'assets','images',file));
for(const file of readdirSync(join(OUT,'assets','images'))){
 if(!USED_IMAGES.includes(file))unlinkSync(join(OUT,'assets','images',file));
}
if(resolve(OUT)!==resolve('.'))writeFileSync(join(OUT,'README.md'),`# Gati website — static frontend only\n\nNo server, database, login or on-site form. Every call to action opens WhatsApp, the phone dialler or an email app.\n\n## Pages\nHome, Our work, six project pages, Expertise, About, Careers, Contact and Privacy.\n\n## Editing content\nCompany details and phone numbers live at the top of \`build.mjs\` (\`P\`). Projects, services, careers and copy are plain objects in the same file. Run \`node build.mjs\` to rebuild into \`build/\`.\n\n## Hosting\nUpload the contents of \`build/\` to any static host. GitHub Pages needs no server; the asset paths use the \`BASE_PATH\` value from the build (default \`/gati-preview\`).\n\n## Not included\nNo enquiries, applications, resumes or personal data are collected or stored. Visitors continue the conversation in their own WhatsApp, phone or email app.\n\nCompany details, project scopes and imagery are supplied references, not independently verified claims. Client marks belong to their respective owners.\n`);
console.log('Built static website into '+OUT+'/');
console.log('Pages: home, work (+'+projects.length+' projects), expertise, about, careers, contact, privacy, 404');
console.log('Contact actions: WhatsApp / call / email only');
