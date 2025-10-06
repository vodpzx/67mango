/* Advanced script.js
   - Particle field with dark-blue / black variance and glow
   - background video & audio activation (on first click)
   - media controls: play/pause ambient audio & toggle video visibility
   - navigation, contact form draft, and flip-card navigation
*/

(() => {
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));

  // footer year
  document.getElementById('year').textContent = new Date().getFullYear();

  /* ===== NAVIGATION ===== */
  const navLinks = $$('.nav-link');
  const sections = $$('.section');

  function setActive(targetId){
    navLinks.forEach(btn => btn.classList.toggle('active', btn.dataset.target === targetId));
  }

  navLinks.forEach(btn => {
    btn.addEventListener('click', () => {
      const t = btn.dataset.target;
      const el = document.getElementById(t);
      if(!el) return;
      el.scrollIntoView({behavior:'smooth', block:'start'});
      el.focus({preventScroll:true});
      setActive(t);
      try { history.replaceState && history.replaceState(null, '', '#'+t); } catch(e){}
    });
  });

  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if(e.isIntersecting) setActive(e.target.id);
    });
  }, { threshold: 0.45 });

  sections.forEach(s => observer.observe(s));

  /* ===== FLIP CARDS click-to-navigate ===== */
  $$('.flip-card').forEach(card => {
    card.addEventListener('click', () => {
      const t = card.dataset.target;
      const el = document.getElementById(t);
      if(el){ el.scrollIntoView({behavior:'smooth', block:'start'}); el.focus({preventScroll:true}); }
    });
    card.addEventListener('keypress', (e) => { if(e.key === 'Enter') card.click(); });
  });

  /* ===== CONTACT FORM (local draft + mailto fallback) ===== */
  const form = $('#contact-form');
  const status = $('#form-status');
  const saveBtn = $('#save-draft');
  const draftKey = 'contactDraft_v2';

  // restore draft
  try {
    const raw = localStorage.getItem(draftKey);
    if(raw){
      const data = JSON.parse(raw);
      if(data) {
        $('#name').value = data.name || '';
        $('#email').value = data.email || '';
        $('#message').value = data.message || '';
        status.textContent = 'Draft restored.';
      }
    }
  } catch(e){}

  saveBtn.addEventListener('click', () => {
    const payload = { name: $('#name').value, email: $('#email').value, message: $('#message').value };
    localStorage.setItem(draftKey, JSON.stringify(payload));
    status.textContent = 'Draft saved locally.';
  });

  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    status.textContent = '';
    const name = $('#name').value.trim(), email = $('#email').value.trim(), message = $('#message').value.trim();

    if(name.length < 2) { status.textContent = 'Name must be at least 2 characters.'; return; }
    if(!/^\S+@\S+\.\S+$/.test(email)) { status.textContent = 'Please enter a valid email.'; return; }
    if(message.length < 10) { status.textContent = 'Message must be at least 10 characters.'; return; }

    // store local history
    try {
      const hist = JSON.parse(localStorage.getItem('contactHistory_v2') || '[]');
      hist.unshift({name, email, message, date:new Date().toISOString()});
      localStorage.setItem('contactHistory_v2', JSON.stringify(hist.slice(0,20)));
    } catch(e){}

    // open mail client fallback
    const subject = encodeURIComponent('67 Archive submission: ' + name);
    const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`);
    window.location.href = `mailto:example@archive.local?subject=${subject}&body=${body}`;
    status.textContent = 'Opening mail client as fallback...';
  });

  /* ===== MEDIA: video & audio activation ===== */
  const bgVid = $('#bgVideo');
  const ambient = $('#ambient-audio');
  const audioToggle = $('#audio-toggle');
  const videoToggle = $('#video-toggle');
  let userInteracted = false;

  // If no audio source, hide the control
  (function checkMedia(){
    // check for audio source tag
    const audioSources = ambient.querySelectorAll('source');
    const audioPresent = Array.from(audioSources).some(s => s.getAttribute('src'));
    if(!audioPresent) audioToggle.style.display = 'none';
    // hide video toggle if no video
    const vidSource = bgVid.querySelectorAll('source');
    const videoPresent = Array.from(vidSource).some(s => s.getAttribute('src'));
    if(!videoPresent) videoToggle.style.display = 'none';
  })();

  // first user click: unmute video & autoplay audio if present
  function onFirstInteraction() {
    if(userInteracted) return;
    userInteracted = true;

    // unmute video and ensure it's playing if present
    if(bgVid && bgVid.querySelectorAll('source').length) {
      bgVid.muted = false;
      bgVid.play().catch(()=>{ /* ignore */ });
      bgVid.style.display = ''; // ensure it's visible (CSS sets visible by default)
    }

    // autoplay ambient if present and the control is in 'play' state
    if(ambient && ambient.querySelectorAll('source').length) {
      ambient.play().then(()=> {
        audioToggle.textContent = '⏸';
        audioToggle.setAttribute('aria-pressed','true');
      }).catch(()=>{ /* autoplay blocked — user can press play */ });
    }
  }

  // attach one-time event listener for first interaction
  window.addEventListener('pointerdown', onFirstInteraction, { once: true, passive: true });
  window.addEventListener('keydown', onFirstInteraction, { once: true, passive: true });

  // audio toggle
  audioToggle.addEventListener('click', () => {
    if(!ambient) return;
    if(ambient.paused){
      ambient.play().then(() => {
        audioToggle.textContent = '⏸';
        audioToggle.setAttribute('aria-pressed','true');
      }).catch(()=> {
        // user gesture required — simulate by informing
        alert('Click anywhere on the page to enable audio playback.');
      });
    } else {
      ambient.pause();
      audioToggle.textContent = '▶';
      audioToggle.setAttribute('aria-pressed','false');
    }
  });

  // video toggle: hide/show visual video (particles remain)
  videoToggle.addEventListener('click', () => {
    if(!bgVid) return;
    if(bgVid.style.display === 'none' || getComputedStyle(bgVid).display === 'none'){
      bgVid.style.display = '';
      videoToggle.textContent = '🎞';
    } else {
      bgVid.style.display = 'none';
      videoToggle.textContent = '🖼';
    }
  });

  // also a small sample-play button on the intro
  const playSample = $('#play-sample');
  if(playSample){
    playSample.addEventListener('click', () => {
      if(ambient && ambient.querySelectorAll('source').length) {
        ambient.play().catch(()=>{ alert('Click anywhere first to allow audio playback.'); });
        audioToggle.textContent = '⏸';
        audioToggle.setAttribute('aria-pressed','true');
      } else {
        alert('No ambient audio file found (ambient.mp3). Place ambient.mp3 in the project folder.');
      }
    });
  }

  /* ===== PARTICLES (dark-blue + black mix) ===== */
  const canvas = document.getElementById('bg-canvas');
  const ctx = canvas.getContext('2d');
  let DPR = Math.max(1, window.devicePixelRatio || 1);
  let width = 0, height = 0;
  let particles = [];
  const BASE_COUNT = 110;

  function resizeCanvas(){
    DPR = Math.max(1, window.devicePixelRatio || 1);
    width = Math.ceil(window.innerWidth);
    height = Math.ceil(window.innerHeight);
    canvas.width = width * DPR;
    canvas.height = height * DPR;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(DPR,0,0,DPR,0,0);
  }

  function rand(min, max){ return Math.random()*(max-min)+min; }
  function choose(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

  function createParticles(){
    particles = [];
    const pal = [
      {h:210, s:'88%', l: '50%'}, // vivid blue
      {h:230, s:'72%', l: '36%'}, // deep blue
      {h:191, s:'40%', l: '24%'}, // teal-dark
      {h:240, s:'20%', l: '8%'}   // almost black-blue
    ];
    for(let i=0;i<BASE_COUNT;i++){
      const p = {
        x: rand(0, width),
        y: rand(0, height),
        vx: rand(-0.18, 0.18),
        vy: rand(-0.12, 0.12),
        size: rand(0.75, 3.2),
        hueObj: choose(pal),
        life: rand(80, 420),
        t: Math.random()*Math.PI*2,
        alpha: rand(0.5, 1)
      };
      particles.push(p);
    }
  }

  let last = performance.now();
  function step(now){
    const dt = Math.min(40, now - last) / 16.666;
    last = now;

    // subtle dim layer
    ctx.clearRect(0,0,width, height);
    ctx.fillStyle = 'rgba(2,2,6,0.15)';
    ctx.fillRect(0,0,width, height);

    // procedural light grid overlay
    const radial = ctx.createRadialGradient(width*0.15, height*0.12, 0, width*0.15, height*0.12, Math.max(width,height)*0.8);
    radial.addColorStop(0, 'rgba(80,140,255,0.02)');
    radial.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = radial;
    ctx.fillRect(0,0,width,height);

    // update and draw particles
    for(let i=0;i<particles.length;i++){
      const p = particles[i];
      p.t += 0.0025 * dt;
      // gentle perlin-like motion (sinusoidal)
      p.x += p.vx * dt + Math.sin(p.t*1.3) * 0.12;
      p.y += p.vy * dt + Math.cos(p.t*1.1) * 0.09;

      // wrap edges
      if(p.x < -30) p.x = width + 30;
      if(p.x > width + 30) p.x = -30;
      if(p.y < -30) p.y = height + 30;
      if(p.y > height + 30) p.y = -30;

      // soft halo
      const sizeHalo = p.size * 12;
      const {h,s,l} = p.hueObj;
      const g = ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,sizeHalo);
      g.addColorStop(0, `hsla(${h},${s},${l},${0.12 * p.alpha})`);
      g.addColorStop(0.5, `hsla(${h},${s},${l},${0.05 * p.alpha})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(p.x, p.y, sizeHalo, 0, Math.PI*2);
      ctx.fill();

      // small bright core
      ctx.beginPath();
      ctx.fillStyle = `hsla(${h},${s},${l},${0.9 * p.alpha})`;
      ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
      ctx.fill();
    }

    // line linking with color gradient between pair
    for(let i=0;i<particles.length;i++){
      for(let j = i+1; j<particles.length; j++){
        const a = particles[i], b = particles[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const d = Math.hypot(dx, dy);
        if(d < 140){
          const mix = 1 - d/140;
          // mix hues proportionally
          const h = Math.round((a.hueObj.h * mix + b.hueObj.h * (1-mix)));
          ctx.beginPath();
          ctx.strokeStyle = `rgba(100,170,255,${0.04 * mix})`;
          ctx.lineWidth = 1 * Math.min(1.3, mix + 0.2);
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(step);
  }

  // mouse interaction: spawn small burst particles
  window.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    for(let i=0;i<2;i++){
      const p = {
        x: mx + rand(-6,6), y: my + rand(-6,6),
        vx: rand(-0.6,0.6), vy: rand(-0.6,0.6), size: rand(0.9,2.6),
        hueObj: choose([{h:200,s:'80%',l:'48%'},{h:230,s:'78%',l:'36%'}]),
        life: rand(40,160), t: Math.random()*Math.PI*2, alpha: rand(0.8,1)
      };
      particles.push(p);
      if(particles.length > 260) particles.shift();
    }
  });

  // initialize particle canvas
  function initParticles(){
    resizeCanvas();
    createParticles();
    last = performance.now();
    requestAnimationFrame(step);
  }

  window.addEventListener('resize', () => {
    resizeCanvas();
  });

  // respects reduced motion
  if(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    // static subtle background for reduced motion
    canvas.style.background = 'radial-gradient(circle at 20% 30%, rgba(80,140,255,0.02), transparent 10%), radial-gradient(circle at 80% 70%, rgba(80,50,255,0.02), transparent 10%)';
  } else {
    initParticles();
  }

})();
