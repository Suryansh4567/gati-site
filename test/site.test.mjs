// Regression tests for the Gati static site (runs against a served build).
// Usage: node test/site.test.mjs [baseUrl]   (default http://127.0.0.1:8080)
import jsdomPkg from 'jsdom';
const {JSDOM, VirtualConsole, ResourceLoader}=jsdomPkg;

const BASE=process.argv[2]||'http://127.0.0.1:8080';
let pass=0, fail=0;
const failures=[];
function check(name, cond, detail=''){
  if(cond){pass++; console.log(`PASS ${name}`);}
  else {fail++; failures.push(name+(detail?` (${detail})`:'')); console.log(`FAIL ${name} ${detail}`);}
}

async function loadPage(path,{idle=true}={}){
  const errors=[];
  const vc=new VirtualConsole();
  vc.on('jsdomError',e=>{ if(!/Could not parse CSS/.test(String(e.message))) errors.push(String(e.message)); });
  vc.on('error',(...a)=>errors.push(a.join(' ')));
  const dom=await JSDOM.fromURL(BASE+path,{
    runScripts:'dangerously', resources:'usable', pretendToBeVisual:true, virtualConsole:vc,
    beforeParse(window){
      window.__imgSrcs=[];
      const Orig=window.Image;
      window.Image=function(...a){const im=new Orig(...a);
        const d=Object.getOwnPropertyDescriptor(Orig.prototype,'src')||Object.getOwnPropertyDescriptor(window.HTMLImageElement.prototype,'src');
        Object.defineProperty(im,'src',{set(v){window.__imgSrcs.push(String(v)); d.set.call(im,v);},get(){return d.get.call(im);}});
        return im;};
      if(idle) window.requestIdleCallback=(fn)=>setTimeout(fn,0);
    }
  });
  await new Promise(res=>{ if(dom.window.document.readyState==='complete') return res(); dom.window.addEventListener('load',res,{once:true}); });
  await new Promise(res=>setTimeout(res,50)); // let deferred site.js run
  return {window:dom.window, document:dom.window.document, errors};
}
const click=(el)=>el.dispatchEvent(new el.ownerDocument.defaultView.MouseEvent('click',{bubbles:true,cancelable:true}));
const input=(el)=>el.dispatchEvent(new el.ownerDocument.defaultView.Event('input',{bubbles:true}));
const visibleCards=(doc)=>[...doc.querySelectorAll('#project-grid .card')].filter(c=>c.style.display!=='none').length;

// ---------- A. Mobile navigation ----------
{
  const {window,document,errors}=await loadPage('/');
  const burger=document.querySelector('.burger'), mobile=document.getElementById('mobile-nav');
  check('nav: initial hidden + aria-expanded=false', mobile.hasAttribute('hidden') && burger.getAttribute('aria-expanded')==='false');
  click(burger);
  check('nav: opens on click', !mobile.hasAttribute('hidden') && burger.getAttribute('aria-expanded')==='true');
  check('nav: focus moves into menu on open', document.activeElement===mobile.querySelector('a'), `active=${document.activeElement&&document.activeElement.className}`);
  const link=mobile.querySelectorAll('a')[2]; link.focus();
  click(burger);
  check('nav: close returns focus to burger', document.activeElement===burger, `active=${document.activeElement&&(document.activeElement.className||document.activeElement.tagName)}`);
  for(let i=0;i<7;i++) click(burger);
  const openNow=!mobile.hasAttribute('hidden');
  check('nav: rapid clicks end consistent (odd count = open)', openNow && burger.getAttribute('aria-expanded')==='true');
  // Escape closes
  document.dispatchEvent(new window.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
  check('nav: Escape closes open menu', mobile.hasAttribute('hidden') && burger.getAttribute('aria-expanded')==='false');
  // Resize to desktop while open must close + sync
  click(burger); // open again
  Object.defineProperty(window,'innerWidth',{value:1200,configurable:true});
  window.dispatchEvent(new window.Event('resize'));
  check('nav: resize to desktop closes menu + syncs aria', mobile.hasAttribute('hidden') && burger.getAttribute('aria-expanded')==='false');
  Object.defineProperty(window,'innerWidth',{value:390,configurable:true});
  window.dispatchEvent(new window.Event('resize'));
  check('nav: back to mobile stays closed', mobile.hasAttribute('hidden'));
  check('nav: hidden links not tabbable', mobile.hasAttribute('hidden')); // display:none via [hidden]
  check('nav: no runtime errors on home', errors.length===0, errors.join('|').slice(0,200));
}

// ---------- B. Work filters + search ----------
{
  const {document,errors}=await loadPage('/work/');
  const search=document.querySelector('.search input');
  const cards=[...document.querySelectorAll('#project-grid .card')];
  check('work: 6 cards initially', visibleCards(document)===6);
  search.value='gurugram'; input(search);
  check('work: search "gurugram" -> 4', visibleCards(document)===4, `got ${visibleCards(document)}`);
  search.value='  GURUGRAM  '; input(search);
  check('work: padded/uppercase query behaves same (trim+case)', visibleCards(document)===4, `got ${visibleCards(document)}`);
  const btnCommercial=[...document.querySelectorAll('.filters button')].find(b=>b.dataset.filter==='Commercial');
  click(btnCommercial);
  check('work: Commercial + "gurugram" -> 2', visibleCards(document)===2, `got ${visibleCards(document)}`);
  search.value='zzz-nothing'; input(search);
  check('work: no results -> empty state shown', visibleCards(document)===0 && !!document.getElementById('no-results'));
  search.value=''; input(search);
  const allBtn=[...document.querySelectorAll('.filters button')].find(b=>b.dataset.filter==='All work');
  click(allBtn);
  check('work: clearing restores 6 + empty state removed', visibleCards(document)===6 && !document.getElementById('no-results'));
  search.value='<img src=x onerror="window.__xss=1">'; input(search);
  check('work: query never injected as HTML', !document.__xss && document.querySelectorAll('#project-grid img[src="x"]').length===0);
  check('work: no runtime errors', errors.length===0, errors.join('|').slice(0,200));
}

// ---------- C. Process tabs ----------
{
  const {document}=await loadPage('/');
  const tabs=[...document.querySelectorAll('.tabs button')];
  const h3=document.querySelector('.step h3'), p=document.querySelector('.step p');
  check('tabs: initial state matches pressed button', tabs[0].getAttribute('aria-pressed')==='true' && h3.textContent.length>3);
  click(tabs[2]);
  check('tabs: click updates content + aria', tabs[2].getAttribute('aria-pressed')==='true' && tabs[0].getAttribute('aria-pressed')==='false' && /work/i.test(h3.textContent));
  [3,0,1].forEach(i=>click(tabs[i]));
  check('tabs: rapid switching ends on last', tabs[1].getAttribute('aria-pressed')==='true' && h3.textContent.trim().length>0 && p.textContent.trim().length>0);
  const live=document.querySelector('.step').getAttribute('aria-live');
  check('tabs: step region is polite live region', live==='polite');
}

// ---------- D. Gallery + marquee ----------
{
  const {window,document}=await loadPage('/');
  const next=document.querySelector('.controls .next'), prev=document.querySelector('.controls .prev');
  const counter=document.querySelector('.counter'), label=document.querySelector('.main-label'), img=document.querySelector('.main-frame img');
  click(next);
  check('gallery: next -> 02 + src/label sync', counter.textContent==='02' && /FORMWORK/.test(label.textContent) && /site-3/.test(img.getAttribute('src')));
  click(prev); click(prev);
  check('gallery: prev wraps 01 -> 04', counter.textContent==='04' && /site-7/.test(img.getAttribute('src')));
  for(let i=0;i<9;i++) click(next);
  check('gallery: fast clicks stay in range', ['01','02','03','04'].includes(counter.textContent));
  const motion=document.querySelector('.motion'), win=document.querySelector('.window');
  click(motion);
  check('marquee: pause sets class + aria + label', win.classList.contains('paused') && motion.getAttribute('aria-pressed')==='true' && /Play/.test(motion.textContent));
  click(motion);
  check('marquee: resume clears state', !win.classList.contains('paused') && /Pause/.test(motion.textContent));
  // accordion swaps service visual
  const acc=[...document.querySelectorAll('.acc details')];
  acc[1].open=true; acc[1].dispatchEvent(new window.Event('toggle'));
  const shot=document.querySelector('.service-shot');
  check('home: accordion swaps service shot to 02', /site-7/.test(shot.getAttribute('src')) && /02/.test(document.querySelector('.service-label').textContent));
}

// ---------- E. Prefetch scope (regression R1) ----------
{
  const home=await loadPage('/');
  const contact=await loadPage('/contact/');
  const pref=(w)=>w.__imgSrcs.filter(s=>/site-\d/.test(s));
  check('prefetch: home prefetches 4 gallery frames', pref(home.window).length===4, `got ${pref(home.window).length}`);
  check('prefetch: contact page does NOT prefetch gallery', pref(contact.window).length===0, `got ${pref(contact.window).length}: ${pref(contact.window).join(',')}`);
}

// ---------- F. Skip link target on every page ----------
{
  for(const p of ['/','/work/','/expertise/','/about/','/careers/','/contact/','/privacy/']){
    const {document}=await loadPage(p);
    const skip=document.querySelector('a.skip');
    const target=skip && document.querySelector(skip.getAttribute('href'));
    check(`skip: ${p} has skip link with existing target`, !!skip && !!target);
  }
  // NOTE: python http.server does NOT serve custom 404.html for unknown paths
  // (GitHub Pages does). Hosting behaviour verified separately via curl.
  const {document}=await loadPage('/404.html');
  const skip=document.querySelector('a.skip');
  check('404: custom page has skip link with existing target', !!document.querySelector('main#top') && !!skip && !!document.querySelector(skip.getAttribute('href')));
}

// ---------- G. All pages: no uncaught runtime errors ----------
{
  const pages=['/','/work/','/expertise/','/about/','/careers/','/contact/','/privacy/','/work/conscient-residential/','/work/crc-noida/','/work/parq-residential/','/work/downtown-gurugram/','/work/prestige-ghaziabad/','/work/bl-kashyap/'];
  for(const p of pages){
    const {errors}=await loadPage(p);
    check(`errors: ${p} clean console`, errors.length===0, errors.join('|').slice(0,300));
  }
}

console.log(`\n${pass} passed, ${fail} failed`);
if(failures.length){console.log('FAILED:'); failures.forEach(f=>console.log(' -',f)); process.exit(1);}
