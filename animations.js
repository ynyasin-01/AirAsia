(function(){
  'use strict';
  const jobs=new WeakMap();
  const reduced=()=>window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.airasiaCrossfade=function(img,url,alt){
    const previous=jobs.get(img);
    if(previous){previous.loader.onload=previous.loader.onerror=null;if(previous.animation)previous.animation.cancel();if(previous.layer)previous.layer.remove();}
    const job={loader:new Image(),layer:null,animation:null};jobs.set(img,job);
    function apply(src){
      if(jobs.get(img)!==job)return;
      const old=img.cloneNode(false);
      old.removeAttribute('id');old.removeAttribute('onerror');old.alt='';old.setAttribute('aria-hidden','true');old.classList.add('destination-fade-layer');
      const canAnimate=!reduced()&&img.complete&&img.naturalWidth>0&&img.getAttribute('src')!==src&&typeof old.animate==='function';
      if(canAnimate){
        const css=getComputedStyle(img);
        Object.assign(old.style,{position:'absolute',left:img.offsetLeft+'px',top:img.offsetTop+'px',width:img.offsetWidth+'px',height:img.offsetHeight+'px',margin:'0',objectFit:css.objectFit,objectPosition:css.objectPosition,borderRadius:css.borderRadius});
        img.after(old);job.layer=old;
      }
      img.onerror=null;img.src=src;img.alt=alt;
      if(canAnimate){job.animation=old.animate([{opacity:1},{opacity:0}],{duration:420,easing:'ease-in-out',fill:'forwards'});job.animation.onfinish=()=>{old.remove();job.layer=null;};}
    }
    job.loader.onload=()=>apply(url);
    job.loader.onerror=()=>apply('assets/destination.svg');
    job.loader.src=url;
  };
  window.airasiaSuccess=function(container){
    const badge=document.createElement('div');badge.className='booking-success';badge.setAttribute('role','status');
    badge.innerHTML='<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="19" pathLength="1"/><path d="m14 24 7 7 14-15" pathLength="1"/></svg><span>Demo booking confirmed</span>';
    container.prepend(badge);
  };
})();
