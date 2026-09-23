var ICONS={pause:'<svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5h3v14H8zM13 5h3v14h-3z"/></svg>',play:'<svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4l13 8-13 8z"/></svg>'};(function(){
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
 if(burger&&mobile){burger.addEventListener('click',function(){var open=mobile.hasAttribute('hidden');if(open)mobile.removeAttribute('hidden');else mobile.setAttribute('hidden','');burger.setAttribute('aria-expanded',open?'true':'false');burger.setAttribute('aria-label',open?'Close menu':'Open menu');});}
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
})();