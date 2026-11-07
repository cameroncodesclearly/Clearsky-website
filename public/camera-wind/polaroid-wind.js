/* Reusable Polaroid Wind component */
/* Clear Sky site adaptation: the section background is transparent (the page's
   own sky shows through) and its paper-noise overlay is off (the site's film
   grain covers that). Everything else is the approved handoff build. */
/* Unbranded instant camera. Fully ejects every print, then follows a continuous leaf-like flight. */
(() => {
  'use strict';
  const sharedAssetBase=new URL('assets/',document.currentScript.src).href;
  function mount(root,options={}){
  if(!root)return;
  root.csCameraDemo?.destroy();
  const stage=root.querySelector('.cs-stage'),wrap=root.querySelector('.cs-stage-wrap');
  const camera=root.querySelector('.cs-camera'),layer=root.querySelector('.cs-photo-layer');
  const status=root.querySelector('[data-status]');
  const flightLayer=root.querySelector('.cs-flight-layer');
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  const defaultPhotos=['02-polaroid-portrait','03-polaroid-landscape','07-polaroid-portrait','05-polaroid-landscape','09-polaroid-portrait','11-polaroid-landscape','16-polaroid-portrait','19-polaroid-landscape','37-polaroid-landscape','42-polaroid-portrait','43-polaroid-portrait','45-polaroid-portrait','04-polaroid-portrait','21-polaroid-landscape'];
  const assetBase=options.assetBase||sharedAssetBase;
  const source=options.photos?.length?options.photos:defaultPhotos;
  const photos=source.map(entry=>{
    const value=typeof entry==='string'?{src:entry}:entry;
    const src=value.src.match(/^(data:|https?:|\/)/)?value.src:new URL(value.src.includes('.')?value.src:value.src+'.jpg',assetBase).href;
    const photo={src,orientation:value.orientation||(value.src.includes('landscape')?'landscape':'portrait')};
    const preload=new Image();preload.onload=()=>{if(!value.orientation)photo.orientation=preload.naturalWidth>preload.naturalHeight?'landscape':'portrait';};preload.src=src;return photo;
  });
  const interval=Math.max(1800,Number(options.interval)||2200);
  let index=0,removed=false,paused=false,inView=true,timer=null,scale=1;
  const active=new Set();
  const ambient=new Set();
  function resize(){const mobile=wrap.clientWidth<=600;const width=mobile?480:1200;scale=Math.min(wrap.clientWidth/width,1.45);stage.style.width=width+'px';stage.style.transform=`translateX(-50%) scale(${scale})`;wrap.style.height=440*scale+'px';}
  const ro=new ResizeObserver(resize);ro.observe(wrap);resize();
  const transform=(x,y,r,tilt=0,s=1)=>`translate3d(${x}px,${y}px,0) rotate(${r}deg) skewY(${tilt}deg) scale(${s})`;
  const smooth=t=>t*t*t*(t*(t*6-15)+10);
  function snap(manual=false){
    if(removed||(!manual&&(paused||!inView||document.hidden||reduced.matches))||active.size>=7)return;
    const photo=photos[index++%photos.length],landscape=photo.orientation==='landscape';
    const width=landscape?150:120,height=landscape?width*1146/1462:width*1446/1012;
    const mobile=wrap.clientWidth<=600;
    const camX=mobile?18:65,camY=40;
    const x=camX+122.5-width/2,slotY=camY+168;
    const printY=slotY+17;
    const sleeve=document.createElement('div');sleeve.className='cs-print-sleeve';
    Object.assign(sleeve.style,{left:(x-24)+'px',top:slotY+'px',width:(width+48)+'px',height:(height+70)+'px'});
    const card=document.createElement('div');card.className='cs-flying-photo'+(landscape?' landscape':'');
    const image=document.createElement('img');image.src=photo.src;image.alt='';card.append(image);sleeve.append(card);layer.append(sleeve);
    const emulsion=document.createElement('div');emulsion.className='cs-emulsion';card.append(emulsion);
    const state={animation:null,effects:[],cancel(){this.animation?.cancel();for(const a of this.effects)a.cancel();card.remove();sleeve.remove();active.delete(this);}};active.add(state);
    if(!reduced.matches){
      // WAAPI effects survive the print's reparenting: the emulsion never flashes white again in flight.
      state.effects.push(emulsion.animate([
        {opacity:1,backgroundColor:'#f5f0e5',offset:0},
        {opacity:.99,backgroundColor:'#eee8db',offset:.13},
        {opacity:.92,backgroundColor:'#ded7c2',offset:.32},
        {opacity:.63,backgroundColor:'#e4d6bb',offset:.55},
        {opacity:.25,backgroundColor:'#efe4d1',offset:.78},
        {opacity:0,backgroundColor:'#f5f0e5',offset:1}
      ],{duration:5000,easing:'linear',fill:'forwards'}));
      state.effects.push(image.animate([
        {filter:'grayscale(1) sepia(.42) saturate(.1) contrast(.42) brightness(1.45) blur(1.2px)',offset:0},
        {filter:'grayscale(.9) sepia(.34) saturate(.25) contrast(.58) brightness(1.28) blur(.8px)',offset:.3},
        {filter:'grayscale(.4) sepia(.22) saturate(.65) contrast(.82) brightness(1.08) blur(.25px)',offset:.65},
        {filter:'grayscale(0) sepia(0) saturate(1) contrast(1) brightness(1) blur(0px)',offset:1}
      ],{duration:5300,easing:'linear',fill:'forwards'}));
    }else emulsion.remove();
    const run=async()=>{
      try{
        if(!reduced.matches){
          camera.animate([{transform:'rotate(-3deg)'},{transform:'rotate(-3.6deg) translateY(2px)',offset:.25},{transform:'rotate(-3deg)'}],{duration:550,easing:'ease-in-out'});
          const rays=camera.querySelector('.cs-flash-rays');
          state.effects.push(rays.animate([{opacity:0},{opacity:1,offset:.18},{opacity:0}],{duration:230,easing:'steps(3,end)'}));
          const flash=camera.querySelector('.cs-flash');
          state.effects.push(flash.animate([{fill:'#f5e8b8'},{fill:'#fffdf0',offset:.2},{fill:'#f5e8b8'}],{duration:230}));
          // A clipped sleeve begins at the slot: nothing can peek out above the camera.
          state.animation=card.animate([{transform:transform(24,-height,-3)},{transform:transform(24,17,-3)}],{duration:1750,easing:'cubic-bezier(.22,.55,.35,1)',fill:'forwards'});
          if(paused||!inView||document.hidden)state.animation.pause();
          await state.animation.finished;
        }
        if(!card.isConnected)return;
        // Release the clipping sleeve after ejection. Both photo layers stay permanently behind the camera.
        flightLayer.append(card);sleeve.remove();state.animation?.cancel();card.style.transform=transform(x,printY,-3);
        if(reduced.matches){state.animation=card.animate([{opacity:1},{opacity:1}],{duration:5000,fill:'forwards'});}
        else{
          const frames=[];const variation=(index%3-1)*7;
          const endX=(mobile?480:1200)+250;
          for(let i=0;i<=240;i++){
            const t=i/240,flight=t,q=.18*flight+.82*smooth(flight);
            const envelope=Math.sin(Math.PI*flight);
            const px=x+(endX-x)*q+20*Math.sin(flight*Math.PI*3)*envelope;
            // Gentle rising arc plus continuous vertical eddies. Analytic tangents never stop at waypoints.
            // Keep the release level until the whole frame is horizontally clear of the camera.
            const clearance=smooth(Math.max(0,Math.min(1,(px-(camX+245+12))/120)));
            const py=printY+clearance*(-28*q+Math.sin(flight*Math.PI*4)*16*envelope+variation*envelope);
            const roll=-3+clearance*(Math.sin(flight*Math.PI*5)*10*envelope+12*q);
            const tilt=clearance*Math.sin(flight*Math.PI*5+0.6)*2.5*envelope;
            frames.push({offset:t,transform:transform(px,py,roll,tilt,1-.12*q),opacity:1});
          }
          state.animation=card.animate(frames,{duration:10500+(index%3)*300,easing:'linear',fill:'forwards'});
        }
        if(paused||!inView||document.hidden)state.animation.pause();
        await state.animation.finished;state.cancel();
      }catch{state.cancel();}
    };run();if(index%4===0&&!reduced.matches)driftLeaf();if(manual)status.textContent='Photo snapped.';
  }
  function driftLeaf(){
    if(ambient.size)return;
    const leaf=document.createElement('div');leaf.className='cs-leaf';
    leaf.innerHTML='<svg viewBox="0 0 36 44" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M28 3C7 8 0 24 13 33C25 41 34 24 28 3Z" fill="#d9b435"/><path d="M8 42Q14 26 28 3M17 24L9 21M20 18L28 17M13 32L24 28"/></svg>';
    root.querySelector('.cs-wind-layer').append(leaf);
    const end=(wrap.clientWidth<=600?480:1200)+60,frames=[];
    for(let i=0;i<=90;i++){const t=i/90;frames.push({offset:t,transform:transform(270+(end-270)*t,120+Math.sin(t*Math.PI*4)*38,Math.sin(t*Math.PI*5)*38+180*t)});}
    const animation=leaf.animate(frames,{duration:8000,easing:'steps(96,end)',fill:'forwards'});ambient.add(animation);
    animation.finished.then(()=>{ambient.delete(animation);leaf.remove();}).catch(()=>{ambient.delete(animation);leaf.remove();});
  }
  function sync(){clearInterval(timer);timer=null;const hold=paused||!inView||document.hidden;root.classList.toggle('is-paused',hold);root.classList.toggle('is-reduced',reduced.matches);for(const s of active){for(const a of [s.animation,...s.effects]){if(hold)a?.pause();else a?.play();}}for(const a of ambient){if(hold)a.pause();else a.play();}if(!hold&&!reduced.matches)timer=setInterval(()=>snap(),interval);}
  camera.onclick=()=>snap(true);
  const observer=new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;sync();},{threshold:.1});observer.observe(root);
  const visibility=()=>sync();document.addEventListener('visibilitychange',visibility);
  const preferenceChange=()=>{for(const s of [...active])s.cancel();for(const a of ambient)a.cancel();sync();};
  reduced.addEventListener('change',preferenceChange);
  root.csCameraDemo={snap:()=>snap(true),pause:()=>{paused=true;sync();},resume:()=>{paused=false;sync();},destroy:()=>{removed=true;clearTimeout(startup);clearInterval(timer);reduced.removeEventListener('change',preferenceChange);observer.disconnect();ro.disconnect();document.removeEventListener('visibilitychange',visibility);for(const s of [...active])s.cancel();for(const a of ambient)a.cancel();}};
  sync();const startup=setTimeout(()=>snap(),400);
  return root.csCameraDemo;
  }
  window.ClearSkyPolaroid={mount};

})();

(() => {
 const base=new URL('assets/',document.currentScript.src).href;
 const markup="<section class=\"cs-camera-section\" aria-label=\"Camera printing photos that drift away in the wind\">\n  \n  <div class=\"cs-stage-wrap\"><div class=\"cs-stage\">\n    \n    \n    \n    <div class=\"cs-wind-layer\" aria-hidden=\"true\"><svg class=\"cs-sketch-wind\" viewBox=\"0 0 1200 440\" fill=\"none\"><g class=\"cs-wind-frame frame-a\"><path d=\"M360 144q50-13 104-3m17 2 27 1M610 345q62 12 120-2m19-5 20-5M850 105q66-19 108-4\"/><path d=\"M930 300q45-22 72-4q10 11-5 15q-13 1-13-8\"/></g><g class=\"cs-wind-frame frame-b\"><path d=\"M369 146q48-15 107-3m16 2 28 1M622 347q63 10 122-7m18-6 19-5M862 106q62-20 111-3\"/><path d=\"M941 301q42-23 72-3q10 12-7 15q-13-1-12-9\"/></g><g class=\"cs-wind-frame frame-c\"><path d=\"M379 143q50-13 107-1m17 2 27 1M633 344q64 10 120-8m20-6 18-6M873 103q66-17 110-2\"/><path d=\"M952 298q44-22 71-2q11 12-6 14q-13-1-13-8\"/></g></svg></div><div class=\"cs-photo-layer\" aria-hidden=\"true\"></div><div class=\"cs-flight-layer\" aria-hidden=\"true\"></div>\n    <button class=\"cs-camera\" type=\"button\" aria-label=\"Snap a Polaroid photo\">\n      <svg viewBox=\"0 0 360 305\" role=\"img\" aria-label=\"Hand-drawn instant camera\">\n        <defs><pattern id=\"cs-hatch\" width=\"7\" height=\"7\" patternUnits=\"userSpaceOnUse\" patternTransform=\"rotate(24)\"><path d=\"M0 0V7\" stroke=\"currentColor\" stroke-width=\".8\" opacity=\".18\"/></pattern></defs>\n        <g class=\"cs-camera-art\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\">\n          <path class=\"cs-body\" d=\"M60 65 L71 29 Q173 20 277 31 L292 71 L324 100 L321 246 Q185 258 39 245 L35 101Z\"/>\n          <path d=\"M60 65 Q163 55 292 71 M71 29 L81 63 M277 31 L269 67\"/>\n          <path class=\"cs-body\" d=\"M35 101 Q176 88 324 100 L321 246 Q176 254 39 245Z\"/>\n          <path d=\"M42 105 Q175 94 315 105 M46 242 Q186 250 315 240\" opacity=\".45\" stroke-width=\"1.2\"/>\n          <path fill=\"url(#cs-hatch)\" d=\"M40 162L91 159L98 237L43 237Z\" stroke=\"none\"/>\n          <path class=\"cs-paper\" d=\"M114 116 Q174 80 230 119 Q263 157 234 202 Q196 238 145 216 Q104 196 108 153Z\"/>\n          <path d=\"M126 120 Q174 94 218 120 Q251 155 226 191 Q195 225 152 205 Q119 188 120 153Z\"/>\n          <path class=\"cs-lens\" d=\"M137 143 Q158 113 193 125 Q229 138 222 174 Q209 209 174 201 Q134 199 134 162Z\"/>\n          <path d=\"M144 149 Q153 129 170 131 M150 145L157 138 M213 174Q206 194 188 194\" stroke=\"var(--cs-paper)\" stroke-width=\"2\"/>\n          <path class=\"cs-paper\" d=\"M56 113L91 112L92 142L57 143Z\"/><path d=\"M63 118L85 118L85 136L64 137Z\"/>\n          <path class=\"cs-flash\" d=\"M244 111L303 114L302 144L244 141Z\"/>\n          <path d=\"M250 118L297 121 M250 124L297 127 M250 130L296 133\" opacity=\".5\" stroke-width=\"1\"/>\n          <path d=\"M263 166L292 167L291 190L264 189Z\"/><circle cx=\"278\" cy=\"178\" r=\"4\"/>\n          <path class=\"cs-slot\" d=\"M87 231Q181 226 277 231L279 246Q183 240 86 246Z\"/>\n          <path d=\"M80 259Q179 251 283 260 M67 267Q185 261 299 269\" opacity=\".5\" stroke-width=\"1.4\"/>\n          <path class=\"cs-paper\" d=\"M92 54L123 53L126 65L91 67Z\"/>\n        </g>\n        \n      <g class=\"cs-flash-rays\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.7\" stroke-linecap=\"round\"><path d=\"M310 108l22-10M310 124l27 4M299 99l7-21M281 96l-4-19\"/></g></svg>\n    </button>\n    \n    \n    \n  </div></div>\n  <p class=\"cs-sr-only\" role=\"status\" aria-live=\"polite\" data-status></p>\n</section>",styles=".cs-camera-section,.cs-camera-section *{box-sizing:border-box}.cs-camera-section{--cs-ink:#263f4d;--cs-paper:#f9edce;--cs-camera-fill:#d9b435;--cs-sky:transparent;position:relative;background:var(--cs-sky);color:var(--cs-ink);isolation:isolate;overflow:hidden}.cs-camera-section:after{content:\"\";position:absolute;inset:0;pointer-events:none;z-index:60;opacity:0;background-image:url(\"data:image/svg+xml,%3Csvg viewBox='0 0 170 170' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.7' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' opacity='.55' filter='url(%23n)'/%3E%3C/svg%3E\")}.cs-stage-wrap{width:100%;position:relative;height:440px;overflow:hidden}.cs-stage{width:1200px;height:440px;position:absolute;left:50%;transform-origin:top center}.cs-camera{position:absolute;left:65px;top:40px;width:245px;height:208px;border:0;padding:0;background:transparent;color:var(--cs-ink);z-index:30;cursor:pointer;transform:rotate(-3deg);transform-origin:50% 80%;-webkit-tap-highlight-color:transparent}.cs-camera:focus-visible{outline:2px dashed var(--cs-ink);outline-offset:10px;border-radius:20px}.cs-camera svg{width:100%;height:100%;overflow:visible}.cs-camera-art{stroke-width:2.4;fill:none}.cs-paper{fill:var(--cs-paper)}.cs-body{fill:var(--cs-camera-fill)}.cs-lens,.cs-slot{fill:var(--cs-ink)}.cs-flash{fill:#f5e8b8}.cs-flash-rays{opacity:0}.cs-photo-layer{position:absolute;inset:0;z-index:20;pointer-events:none}.cs-print-sleeve{position:absolute;overflow:hidden;pointer-events:none}.cs-flying-photo{position:absolute;top:0;left:0;width:120px;will-change:transform;transform-origin:50% 25%;filter:drop-shadow(4px 10px 8px #42382126)}.cs-flying-photo.landscape{width:150px}.cs-flying-photo img{display:block;width:100%;height:auto;backface-visibility:hidden}.cs-emulsion{position:absolute;inset:3.87% 5.53% 13.14%;background:#f5f0e5;pointer-events:none}.cs-flying-photo.landscape .cs-emulsion{inset:4.89% 3.83% 16.58%}.cs-camera-section.is-paused *{animation-play-state:paused!important}.cs-camera-section.is-reduced .cs-emulsion{position:absolute;inset:3.87% 5.53% 13.14%;background:#f5f0e5;pointer-events:none}.cs-flying-photo.landscape .cs-emulsion{inset:4.89% 3.83% 16.58%}.cs-sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}@media(max-width:600px){.cs-camera{left:18px;top:40px}}@media(prefers-reduced-motion:reduce){.cs-emulsion{position:absolute;inset:3.87% 5.53% 13.14%;background:#f5f0e5;pointer-events:none}.cs-flying-photo.landscape .cs-emulsion{inset:4.89% 3.83% 16.58%}}\n\n.cs-flight-layer{position:absolute;inset:0;z-index:20;pointer-events:none}\n\n.cs-flash-rays{opacity:0;filter:drop-shadow(0 0 5px #fff1b7)}.cs-wind-layer{position:absolute;inset:0;z-index:8;pointer-events:none}.cs-sketch-wind{position:absolute;inset:0;width:1200px;height:440px;stroke:var(--cs-ink);stroke-width:1.5;stroke-linecap:round;opacity:.3}.cs-wind-frame{animation:cs-wind-frames 1.05s steps(1,end) infinite;opacity:0}.cs-wind-frame.frame-b{animation-delay:-.35s}.cs-wind-frame.frame-c{animation-delay:-.7s}.cs-leaf{position:absolute;width:28px;height:36px;will-change:transform;color:var(--cs-ink)}.cs-leaf svg{width:100%;height:100%;overflow:visible}@keyframes cs-wind-frames{0%{opacity:1}33.333%,100%{opacity:0}}@media(prefers-reduced-motion:reduce){.cs-sketch-wind{display:none}}\n";
 const collections=window.ClearSkyPolaroidCollections||{"team": ["02-polaroid-portrait", "04-polaroid-portrait", "05-polaroid-landscape", "09-polaroid-portrait", "16-polaroid-portrait", "42-polaroid-portrait", "43-polaroid-portrait", "45-polaroid-portrait"], "production": ["03-polaroid-landscape", "07-polaroid-portrait", "19-polaroid-landscape", "37-polaroid-landscape"], "gear": ["11-polaroid-landscape", "21-polaroid-landscape", "03-polaroid-landscape", "37-polaroid-landscape"]};
 class PolaroidWind extends HTMLElement {
  static get observedAttributes(){return ['collection','photos','interval'];}
  constructor(){super();this.attachShadow({mode:'open'});}
  connectedCallback(){this.render();}
  disconnectedCallback(){this._animation?.destroy();this._animation=null;}
  attributeChangedCallback(){if(this.isConnected)this.render();}
  set photos(value){this._photos=value;if(this.isConnected)this.render();}
  get photos(){return this._photos;}
  render(){
   this._animation?.destroy();
   this.shadowRoot.innerHTML='<style>:host{display:block;min-width:0}'+styles+'</style>'+markup;
   let photos=this._photos;
   if(!photos&&this.hasAttribute('photos')){try{photos=JSON.parse(this.getAttribute('photos'));}catch{console.warn('polaroid-wind: photos must be a JSON array.');}}
   if(!Array.isArray(photos))photos=collections[this.getAttribute('collection')||'team']||collections.team;
   this._animation=window.ClearSkyPolaroid.mount(this.shadowRoot.querySelector('.cs-camera-section'),{photos,assetBase:base,interval:this.getAttribute('interval')});
  }
 }
 if(!customElements.get('polaroid-wind'))customElements.define('polaroid-wind',PolaroidWind);
})();
