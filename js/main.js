/**
 * Anunay Brini — Personal Portfolio
 * Core Interactive Scripts: Theme Manager, Evasive Cyber Intro, Mobile Menu, Form Handlers
 */

document.addEventListener('DOMContentLoaded', () => {

  // ============================================================
  // 1. THEME SWITCHER (Dark Red/Black/White <-> Light Mode)
  // ============================================================
  const themeToggleBtns = document.querySelectorAll('#theme-toggle');
  
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('portfolio_theme', theme);
    
    document.querySelectorAll('.theme-toggle-text').forEach(el => {
      el.textContent = theme === 'dark' ? 'Dark' : 'Light';
    });
  }

  // Load stored theme or default to 'dark'
  const currentTheme = localStorage.getItem('portfolio_theme') || 'dark';
  applyTheme(currentTheme);

  themeToggleBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const current = document.body.getAttribute('data-theme') || 'dark';
      const nextTheme = current === 'dark' ? 'light' : 'dark';
      applyTheme(nextTheme);
    });
  });

  // ============================================================
  // 2. CYBERPUNK INTERACTIVE EVASIVE INTRO ANIMATION
  // ============================================================
  const introOverlay = document.getElementById('cyber-intro-overlay');
  const evasiveBtn = document.getElementById('evasive-btn');
  const evasiveArena = document.getElementById('evasive-arena');
  const evasiveHint = document.getElementById('evasive-hint');
  const dynamicLog = document.getElementById('cyber-dynamic-log');
  const btnText = document.getElementById('btn-text');
  const btnIcon = document.getElementById('btn-icon');
  const bypassBtn = document.getElementById('bypass-intro-btn');
  const replayBtn = document.getElementById('replay-intro-btn');

  // Check URL parameters (e.g. index.html?intro=replay)
  const urlParams = new URLSearchParams(window.location.search);
  const forceReplay = urlParams.get('intro') === 'replay';

  let dodgeCount = 0;
  const maxDodges = 3;
  let isUnlocked = false;

  // Web Audio Synthesizer for self-contained, futuristic sci-fi sound effects
  function playCyberSound(type) {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      if (type === 'dodge') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(540 + (dodgeCount * 140), ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.12);
      } else if (type === 'grant') {
        // High-tech authorization chord
        [587, 880, 1174].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + (idx * 0.08));
          gain.gain.setValueAtTime(0.1, ctx.currentTime + (idx * 0.08));
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35 + (idx * 0.08));
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + (idx * 0.08));
          osc.stop(ctx.currentTime + 0.35 + (idx * 0.08));
        });
      } else if (type === 'open') {
        // Aperture iris swoosh
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(280, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.45);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.45);
      }
    } catch (err) {
      // Audio optional / graceful silent fallback
    }
  }

  // Tactical Alert & Evasion Logs
  const evasionLogs = [
    {
      log: '> ALERT 01: TRAJECTORY VECTOR SHIFTED // NICE TRY!',
      btn: 'ACCESS DENIED: RE-TARGET',
      hint: '[SYSTEM DEFENSE ACTIVE: 2 COUNTERMEASURES REMAINING]'
    },
    {
      log: '> ALERT 02: QUANTUM FIREWALL DEFLECTION ENGAGED // VELOCITY +40%',
      btn: 'EVASION 02: ALMOST HAD IT',
      hint: '[FIREWALL OSCILLATION DETECTED: 1 DEFLECTION REMAINING]'
    },
    {
      log: '> ALERT 03: CORE COHERENCE FAILING // SECURITY MATRIX COLLAPSED!',
      btn: 'OVERLOAD IMMINENT...',
      hint: '[CRITICAL BYPASS: STABILIZING QUANTUM VECTOR...]'
    }
  ];

  function dodgeButton() {
    if (isUnlocked || !evasiveArena || !evasiveBtn) return;

    if (dodgeCount < maxDodges) {
      const logData = evasionLogs[dodgeCount];
      dodgeCount++;

      playCyberSound('dodge');

      // Calculate safe arena bounds
      const arenaRect = evasiveArena.getBoundingClientRect();
      const btnRect = evasiveBtn.getBoundingClientRect();

      const maxX = Math.max(30, (arenaRect.width - btnRect.width) / 2 - 15);
      const maxY = Math.max(20, (arenaRect.height - btnRect.height) / 2 - 10);

      // Pick quadrant opposite or away from current
      const signX = (dodgeCount % 2 === 1) ? 1 : -1;
      const signY = (dodgeCount === 2) ? -1 : 1;

      const randomX = signX * (Math.random() * (maxX - 25) + 25);
      const randomY = signY * (Math.random() * (maxY - 15) + 15);

      evasiveBtn.style.transform = `translate(${randomX}px, ${randomY}px)`;

      if (dynamicLog) dynamicLog.textContent = logData.log;
      if (btnText) btnText.textContent = logData.btn;
      if (evasiveHint) evasiveHint.textContent = logData.hint;

      // After 3 dodges, grant access!
      if (dodgeCount >= maxDodges) {
        setTimeout(() => {
          unlockAccess();
        }, 600);
      }
    }
  }

  function unlockAccess() {
    isUnlocked = true;
    playCyberSound('grant');

    // Smoothly center the button
    evasiveBtn.style.transform = 'translate(0px, 0px)';
    evasiveBtn.classList.add('unlocked');

    if (btnIcon) btnIcon.textContent = '🔓';
    if (btnText) btnText.textContent = 'ACCESS GRANTED — CLICK TO ENTER';
    if (dynamicLog) {
      dynamicLog.className = 'cyber-log-line success';
      dynamicLog.textContent = '> CLEARANCE AUTHORIZED // ROOT PERMISSIONS GRANTED';
    }
    if (evasiveHint) {
      evasiveHint.style.color = '#4ade80';
      evasiveHint.textContent = '[SECURITY OVERRIDE COMPLETE: CLICK BUTTON TO ENTER ARCHIVE]';
    }
  }

  function openPortfolio() {
    if (!introOverlay) return;
    playCyberSound('open');

    // Cinematic aperture opening
    introOverlay.classList.add('exit-aperture');

    // Remember in session
    sessionStorage.setItem('portfolio_intro_seen', 'true');

    setTimeout(() => {
      introOverlay.classList.add('hidden');
    }, 750);
  }

  if (introOverlay && evasiveBtn) {
    // Check if user already saw intro in this tab (unless forced replay)
    const introSeen = sessionStorage.getItem('portfolio_intro_seen');
    if (introSeen === 'true' && !forceReplay) {
      introOverlay.classList.add('hidden');
    }

    // Dodging listeners on mouseenter & touchstart
    evasiveBtn.addEventListener('mouseenter', () => {
      if (!isUnlocked) dodgeButton();
    });

    evasiveBtn.addEventListener('touchstart', (e) => {
      if (!isUnlocked) {
        e.preventDefault();
        dodgeButton();
      }
    }, { passive: false });

    // Click to enter
    evasiveBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (isUnlocked) {
        openPortfolio();
      } else {
        dodgeButton();
      }
    });

    if (bypassBtn) {
      bypassBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openPortfolio();
      });
    }

    if (replayBtn) {
      replayBtn.addEventListener('click', (e) => {
        e.preventDefault();
        // Reset state
        dodgeCount = 0;
        isUnlocked = false;
        evasiveBtn.classList.remove('unlocked');
        evasiveBtn.style.transform = 'translate(0px, 0px)';
        if (btnIcon) btnIcon.textContent = '🔒';
        if (btnText) btnText.textContent = 'INITIALIZE ACCESS';
        if (dynamicLog) {
          dynamicLog.className = 'cyber-log-line accent';
          dynamicLog.textContent = '> FIREWALL ACTIVE: INITIALIZE CHALLENGE HANDSHAKE...';
        }
        if (evasiveHint) {
          evasiveHint.style.color = '#e63929';
          evasiveHint.textContent = '[HOVER / TAP BUTTON TO INITIATE CLEARANCE OVERRIDE]';
        }
        introOverlay.classList.remove('exit-aperture');
        introOverlay.classList.remove('hidden');
        sessionStorage.removeItem('portfolio_intro_seen');
      });
    }
  }

  // ============================================================
  // 3. MOBILE MENU TOGGLE
  // ============================================================
  const menuToggle = document.getElementById('menu-toggle') || document.querySelector('.menu-button');
  const menuWrap = document.querySelector('.w-nav-menu') || document.querySelector('.menu-wrap');

  if (menuToggle && menuWrap) {
    menuToggle.addEventListener('click', () => {
      const isOpen = menuWrap.classList.contains('active') || menuWrap.style.display === 'block';
      if (isOpen) {
        menuWrap.classList.remove('active');
        menuWrap.style.display = 'none';
        menuToggle.setAttribute('aria-expanded', 'false');
      } else {
        menuWrap.classList.add('active');
        menuWrap.style.display = 'block';
        menuToggle.setAttribute('aria-expanded', 'true');
      }
    });

    menuWrap.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        if (window.innerWidth <= 991) {
          menuWrap.classList.remove('active');
          menuWrap.style.display = 'none';
          menuToggle.setAttribute('aria-expanded', 'false');
        }
      });
    });
  }

  // ============================================================
  // 4. SMOOTH SCROLL FOR ANCHOR LINKS
  // ============================================================
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId && targetId !== '#') {
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          e.preventDefault();
          targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      }
    });
  });

  // ============================================================
  // 5. CONTACT FORM FEEDBACK
  // ============================================================
  const contactForm = document.getElementById('contact-form');
  const successMsg = document.getElementById('form-success');

  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const submitBtn = contactForm.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<div>Sending...</div>';
      }

      setTimeout(() => {
        contactForm.reset();
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<div>Send Message</div>';
        }
        if (successMsg) {
          successMsg.style.display = 'block';
          successMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 700);
    });
  }
});
