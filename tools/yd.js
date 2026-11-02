(function(){
  var root=document.documentElement;
  function cur(){return root.getAttribute('data-theme')==='light'?'light':'dark';}
  function label(){document.querySelectorAll('.yd-theme').forEach(function(a){var t=cur()==='light'?a.getAttribute('data-d'):a.getAttribute('data-l');if(a.textContent!==t)a.textContent=t;var pr=String(cur()==='light');if(a.getAttribute('aria-pressed')!==pr)a.setAttribute('aria-pressed',pr);});}
  function save(t){try{localStorage.setItem('yd-theme',t);}catch(e){}}
  document.addEventListener('click',function(ev){
    var t=ev.target.closest&&ev.target.closest('.yd-theme');
    if(t){ev.preventDefault();var n=cur()==='light'?'dark':'light';root.setAttribute('data-theme',n);save(n);label();return;}
    var p=ev.target.closest&&ev.target.closest('.yd-play, .et_pb_video_overlay');
    if(p){var box=p.closest('.et_pb_video');var d=box&&box.querySelector('.yd-drive');
      if(d){ev.preventDefault();ev.stopPropagation();load(d);var o=box.querySelector('.et_pb_video_overlay');if(o)o.style.display='none';}return;}
    var a=ev.target.closest&&ev.target.closest('a[href]');
    if(a&&cur()==='light'){var h=a.getAttribute('href');if(h&&!/^(https?:|\/\/|#|mailto:|javascript:)/.test(h)&&!/theme=/.test(h)&&!/\.(jpe?g|png|gif|webp|pdf|mp4)$/i.test(h)){a.setAttribute('href',h+(h.indexOf('?')<0?'?':'&')+'theme=light');}}
  },true);
  function load(d){if(d.firstChild)return;var f=document.createElement('iframe');f.src='https://drive.google.com/file/d/'+d.getAttribute('data-drive')+'/preview';f.allow='autoplay; fullscreen';f.setAttribute('allowfullscreen','');f.title='Video';d.appendChild(f);}
  document.querySelectorAll('.yd-drive').forEach(function(d){var box=d.closest('.et_pb_video');if(!box||!box.querySelector('.et_pb_video_overlay'))load(d);});
  label();
  // Divi clones the menu for mobile after load; relabel when it does
  var mo=new MutationObserver(function(){if(false){label();mo.disconnect();}});mo.observe(document.body,{childList:true,subtree:true});
})();
