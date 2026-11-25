/**
 * Anunay Brini — Personal Portfolio
 * 10-Second Technical Coding Intro, Optical-Illusion Page & Scroll Transitions, Dynamic Portfolio Loader
 */

document.addEventListener('DOMContentLoaded', () => {
  // ============================================================
  // 1. 10-SECOND UNIQUE KINETIC CANVAS, SVG & CIPHER INTRO
  // ============================================================
  const techIntro = document.getElementById('tech-code-intro');
  const canvas = document.getElementById('intro-neural-canvas');
  const eyebrowEl = document.getElementById('intro-cipher-eyebrow');
  const nameEl = document.getElementById('intro-cipher-name');
  const rolesEl = document.getElementById('intro-cipher-roles');
  const metaLineEl = document.getElementById('intro-meta-line');
  const timerReadoutEl = document.getElementById('tech-timer-readout');
  const progressFillEl = document.getElementById('tech-progress-fill');
  const percentLabelEl = document.getElementById('tech-percent-label');
  const stageLabelEl = document.getElementById('tech-stage-label');
  const skipBtn = document.getElementById('tech-intro-skip');
  const illusionOverlay = document.getElementById('page-illusion-overlay');

  function revealPage() {
    if (!illusionOverlay) return;
    requestAnimationFrame(() => {
      setTimeout(() => {
        illusionOverlay.classList.remove('is-entering', 'is-leaving');
        illusionOverlay.classList.add('is-revealed');
      }, 60);
    });
  }

  function scrambleText(target, progress) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&*+=';
    const lockedCount = Math.floor(target.length * Math.max(0, Math.min(1, progress)));
    let out = '';
    for (let i = 0; i < target.length; i++) {
      if (target[i] === ' ') {
        out += ' ';
      } else if (i < lockedCount) {
        out += target[i];
      } else {
        out += chars[Math.floor(Math.random() * chars.length)];
      }
    }
    return out;
  }

  function runTechIntro() {
    const DURATION_MS = 10000;
    const seen = sessionStorage.getItem('portfolio_tech_intro_seen') === 'true';

    if (!techIntro || seen) {
      if (techIntro) techIntro.classList.add('is-done');
      revealPage();
      return;
    }

    if (illusionOverlay) {
      illusionOverlay.classList.remove('is-entering');
      illusionOverlay.classList.add('is-revealed');
    }

    // Setup Neural Constellation Canvas
    const ctx = canvas ? canvas.getContext('2d') : null;
    let width = 0;
    let height = 0;
    const mouse = { x: -9999, y: -9999 };
    const codeTokens = ['0xFF', 'render()', 'api/v2', 'matrix[]', 'rag.init()', 'ui/ux', 'scale(1)'];
    const nodes = [];

    function resizeCanvas() {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('mousemove', (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    }, { passive: true });

    const nodeCount = window.innerWidth < 768 ? 36 : 70;
    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 1.1,
        vy: (Math.random() - 0.5) * 1.1,
        isRed: i % 5 === 0,
        token: i % 10 === 0 ? codeTokens[(i / 10) % codeTokens.length] : ''
      });
    }

    const startTime = performance.now();
    let finished = false;

    function finishIntro() {
      if (finished) return;
      finished = true;
      sessionStorage.setItem('portfolio_tech_intro_seen', 'true');
      window.removeEventListener('resize', resizeCanvas);
      if (illusionOverlay) {
        illusionOverlay.classList.remove('is-revealed');
        illusionOverlay.classList.add('is-entering');
      }
      techIntro.classList.add('is-done');
      setTimeout(() => {
        revealPage();
      }, 140);
    }

    if (skipBtn) {
      skipBtn.addEventListener('click', finishIntro);
    }

    function drawCanvas(ratio) {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);

      // Subtle architectural blueprint grid
      ctx.strokeStyle = 'rgba(17, 17, 17, 0.04)';
      ctx.lineWidth = 1;
      const step = 48;
      for (let x = 0; x < width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      const cx = width / 2;
      const cy = height / 2;
      const converge = ratio > 0.72 ? (ratio - 0.72) / 0.28 : 0;

      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        n.x += n.vx;
        n.y += n.vy;

        if (n.x < 0 || n.x > width) n.vx *= -1;
        if (n.y < 0 || n.y > height) n.vy *= -1;

        // Subtle attraction toward center in final 2.8s
        if (converge > 0) {
          n.x += (cx - n.x) * 0.025 * converge;
          n.y += (cy - n.y) * 0.025 * converge;
        }

        // Mouse repulsion
        const dxm = n.x - mouse.x;
        const dym = n.y - mouse.y;
        const distM = Math.hypot(dxm, dym);
        if (distM < 120 && distM > 0) {
          n.x += (dxm / distM) * 2.2;
          n.y += (dym / distM) * 2.2;
        }

        // Connect nearby nodes
        for (let j = i + 1; j < nodes.length; j++) {
          const m = nodes[j];
          const dist = Math.hypot(n.x - m.x, n.y - m.y);
          if (dist < 145) {
            const alpha = (1 - dist / 145) * 0.28;
            ctx.strokeStyle = (n.isRed || m.isRed)
              ? `rgba(230, 57, 41, ${alpha * 1.4})`
              : `rgba(17, 17, 17, ${alpha})`;
            ctx.lineWidth = (n.isRed || m.isRed) ? 1.2 : 0.8;
            ctx.beginPath();
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(m.x, m.y);
            ctx.stroke();
          }
        }

        // Draw node
        ctx.fillStyle = n.isRed ? '#e63929' : '#111111';
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.isRed ? 3 : 2, 0, Math.PI * 2);
        ctx.fill();

        if (n.token) {
          ctx.fillStyle = n.isRed ? 'rgba(230, 57, 41, 0.75)' : 'rgba(17, 17, 17, 0.45)';
          ctx.font = '10px "Courier New", monospace';
          ctx.fillText(n.token, n.x + 7, n.y + 3);
        }
      }
    }

    function tick(now) {
      if (finished) return;
      const elapsed = Math.min(now - startTime, DURATION_MS);
      const ratio = elapsed / DURATION_MS;
      const sec = (elapsed / 1000).toFixed(1).padStart(4, '0');
      const pct = Math.min(100, Math.round(ratio * 100));

      if (timerReadoutEl) timerReadoutEl.textContent = `${sec}s / 10.0s`;
      if (progressFillEl) progressFillEl.style.width = `${pct}%`;
      if (percentLabelEl) percentLabelEl.textContent = `${pct}%`;

      drawCanvas(ratio);

      // Act 1 -> Act 2 -> Act 3 Cipher & Stage Choreography
      if (ratio < 0.35) {
        if (stageLabelEl) stageLabelEl.textContent = 'CONSTRUCTING NEURAL MESH';
        if (eyebrowEl) eyebrowEl.textContent = scrambleText('SYSTEM_ARCHITECT', ratio / 0.35);
        if (nameEl) nameEl.textContent = scrambleText('ANUNAY BRINI', ratio * 0.4);
      } else if (ratio < 0.72) {
        const subRatio = (ratio - 0.35) / 0.37;
        if (stageLabelEl) stageLabelEl.textContent = 'DECODING IDENTITY CIPHER';
        if (eyebrowEl) eyebrowEl.textContent = 'SYSTEM_ARCHITECT';
        if (nameEl) nameEl.textContent = scrambleText('ANUNAY BRINI', subRatio);
        if (rolesEl) rolesEl.textContent = scrambleText('FULL STACK  |  UI/UX  |  GRAPHIC DESIGN  |  ML', subRatio);
        if (subRatio > 0.5 && metaLineEl) metaLineEl.classList.add('is-shown');
      } else {
        if (stageLabelEl) stageLabelEl.textContent = ratio > 0.9 ? 'ENTERING WORKSPACE' : 'CONVERGING ARCHITECTURE';
        if (nameEl) nameEl.textContent = 'ANUNAY BRINI';
        if (rolesEl) rolesEl.textContent = 'FULL STACK  |  UI/UX  |  GRAPHIC DESIGN  |  ML';
        if (metaLineEl) metaLineEl.classList.add('is-shown');
      }

      if (elapsed >= DURATION_MS) {
        finishIntro();
      } else {
        requestAnimationFrame(tick);
      }
    }

    requestAnimationFrame(tick);
  }

  runTechIntro();

  // ============================================================
  // 2. OPTICAL ILLUSION PAGE TRANSITIONS (BETWEEN PAGES)
  // ============================================================
  window.addEventListener('pageshow', (e) => {
    if (e.persisted && illusionOverlay) {
      illusionOverlay.classList.remove('is-entering', 'is-leaving');
      illusionOverlay.classList.add('is-revealed');
    }
  });

  document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (!link || !illusionOverlay) return;

    const href = link.getAttribute('href');
    if (
      !href ||
      href.startsWith('#') ||
      href.startsWith('mailto:') ||
      href.startsWith('tel:') ||
      link.target === '_blank'
    ) {
      return;
    }

    let targetUrl;
    try {
      targetUrl = new URL(link.href, window.location.href);
    } catch {
      return;
    }

    if (targetUrl.origin !== window.location.origin) return;
    if (targetUrl.pathname === window.location.pathname && targetUrl.hash) return;

    e.preventDefault();
    illusionOverlay.classList.remove('is-revealed', 'is-entering');
    illusionOverlay.classList.add('is-leaving');

    setTimeout(() => {
      window.location.href = targetUrl.href;
    }, 520);
  });

  // ============================================================
  // 3. SCROLL-TRIGGERED OPTICAL ILLUSION TRANSITIONS
  // ============================================================
  const scrollBar = document.createElement('div');
  scrollBar.className = 'scroll-illusion-bar';
  document.body.appendChild(scrollBar);

  window.addEventListener('scroll', () => {
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? Math.min(100, (window.scrollY / docHeight) * 100) : 0;
    scrollBar.style.width = `${pct}%`;
  }, { passive: true });

  let scrollObserver = null;

  function setupScrollIllusions() {
    const targets = document.querySelectorAll(
      '.project-item, .award-card, .achievement-card, .service-card, .number-cell, .number-cell-feature, .section-about .container, .section-contact .container'
    );

    if (!('IntersectionObserver' in window)) {
      targets.forEach(el => el.classList.add('is-visible'));
      return;
    }

    if (scrollObserver) scrollObserver.disconnect();

    scrollObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          scrollObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -24px 0px' });

    targets.forEach((el, idx) => {
      if (!el.classList.contains('scroll-illusion-item')) {
        el.classList.add('scroll-illusion-item');
        el.style.transitionDelay = `${(idx % 3) * 0.06}s`;
      }
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.92) {
        el.classList.add('is-visible');
      } else {
        scrollObserver.observe(el);
      }
    });
  }

  setupScrollIllusions();

  // ============================================================
  // 4. DYNAMIC PORTFOLIO HYDRATION (from Backend API or Static JSON)
  // ============================================================
  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  async function hydratePortfolio() {
    const apiBase = window.location.protocol === 'file:' ? 'http://localhost:3000' : '';
    let data = null;
    try {
      const apiRes = await fetch(`${apiBase}/api/portfolio`, { cache: 'no-store' });
      if (apiRes.ok) {
        data = await apiRes.json();
      }
    } catch {
      // Backend not running; fall back to static JSON
    }

    if (!data) {
      try {
        const jsonRes = await fetch('data/portfolio.json', { cache: 'no-store' });
        if (jsonRes.ok) {
          data = await jsonRes.json();
        }
      } catch {
        return;
      }
    }

    if (!data) return;

    const p = data.profile || {};
    const heroWrapper = document.querySelector('.hero-text-wrapper');
    if (heroWrapper && p.greeting) {
      const h1s = heroWrapper.querySelectorAll('h1');
      if (h1s[0]) h1s[0].textContent = p.greeting;
      if (h1s[1]) h1s[1].textContent = p.roleLine1 || '';
      if (h1s[2]) h1s[2].textContent = p.roleLine2 || '';
      if (h1s[3]) {
        h1s[3].innerHTML = `BASED IN <span class="header-location">${escapeHtml(p.locationCity || '')}<br/>${escapeHtml(p.locationCountry || '')}</span>`;
      }
    }

    const heroImg = document.querySelector('.hero-image');
    if (heroImg && p.heroImage) heroImg.src = p.heroImage;

    const aboutImg = document.querySelector('.about-profile-image');
    if (aboutImg && p.heroImage) aboutImg.src = p.heroImage;

    const detailRow = document.querySelector('.header-detail-row') || document.querySelector('.project-detail');
    if (detailRow && Array.isArray(p.disciplines) && p.disciplines.length) {
      detailRow.innerHTML = p.disciplines
        .map(d => `<h5>${escapeHtml(d)}</h5>`)
        .join('<span class="bullet-dot">&bull;</span>');
    }

    const aboutSection = document.getElementById('About');
    if (aboutSection) {
      const h2 = aboutSection.querySelector('h2');
      if (h2 && p.aboutHeadline) h2.textContent = p.aboutHeadline;
      const h4 = aboutSection.querySelector('.grid-title-wrapper h4');
      if (h4 && p.aboutSubheadline) h4.textContent = p.aboutSubheadline;
      const bio = aboutSection.querySelector('.grid-title-wrapper .paragraph-large');
      if (bio && p.aboutBio) bio.textContent = p.aboutBio;
      const detailVals = aboutSection.querySelectorAll('.detail-wrapper h5');
      if (detailVals.length >= 4) {
        if (p.education) detailVals[0].textContent = p.education;
        if (p.college) detailVals[1].textContent = p.college;
        if (p.degreePeriod) detailVals[2].textContent = p.degreePeriod;
        if (p.graduationYear) detailVals[3].textContent = p.graduationYear;
      }
    }

    const statsGrid = document.querySelector('.grid-numbers');
    if (statsGrid && Array.isArray(p.stats) && p.stats.length) {
      statsGrid.innerHTML = p.stats.map(s => `
        <div class="${s.featured ? 'number-cell-feature' : 'number-cell'}">
          <div class="number-large">${escapeHtml(s.value)}</div>
          <div class="heading-normal">${escapeHtml(s.label)}</div>
        </div>
      `).join('');
    }

    const journeyGrid = document.querySelector('#Journey .card-grid');
    if (journeyGrid && Array.isArray(data.journey)) {
      journeyGrid.innerHTML = data.journey.map((j, idx) => `
        <div class="award-card w-inline-block">
          <div class="card-content">
            <div class="number-block"><p class="paragraph-large">${escapeHtml(j.number || String(idx + 1).padStart(2, '0'))}</p></div>
            <div class="card-content-text">
              <h5 class="award-heading">${escapeHtml(j.title)}</h5>
              <p class="paragraph-large">${escapeHtml(j.description)}</p>
            </div>
          </div>
          <div class="date-detail-wrapper">
            <div class="paragraph-regular">${escapeHtml(j.company)}</div>
            <div class="paragraph-regular">${escapeHtml(j.period)}</div>
          </div>
        </div>
      `).join('');
    }

    const projectsGrid = document.querySelector('.project-list-custom');
    if (projectsGrid && Array.isArray(data.projects)) {
      projectsGrid.innerHTML = data.projects.map(proj => `
        <div role="listitem" class="project-item w-dyn-item">
          <div class="project-image-base">
            <img alt="${escapeHtml(proj.title)}" src="${escapeHtml(proj.image)}" width="460" loading="lazy" class="project-image"/>
          </div>
          <div class="project-content">
            <div class="badge-category"><div class="project-category-text">${escapeHtml(proj.category)}</div></div>
            <h2>${escapeHtml(proj.title)}</h2>
            <p class="paragraph-large">${escapeHtml(proj.description)}</p>
            <div class="project-focus-box">
              <div class="focus-title">${escapeHtml(proj.focusTitle || 'Focus Areas:')}</div>
              <div class="focus-tags">
                ${(proj.focusTags || []).map(tag => `<span class="tech-tag">${escapeHtml(tag)}</span>`).join('')}
              </div>
              ${proj.techStack ? `<div class="tech-stack-line"><strong>Technology:</strong> ${escapeHtml(proj.techStack)}</div>` : ''}
            </div>
            ${(proj.liveUrl || proj.repoUrl) ? `
            <div class="project-links-row">
              ${proj.liveUrl ? `
              <a href="${escapeHtml(proj.liveUrl)}" target="_blank" rel="noopener noreferrer" class="project-link project-link-live">
                <span>Live Website</span>
                <span class="link-arrow">&#8599;</span>
              </a>` : ''}
              ${proj.repoUrl ? `
              <a href="${escapeHtml(proj.repoUrl)}" target="_blank" rel="noopener noreferrer" class="project-link">
                <span>GitHub Repository</span>
                <span class="link-arrow">&#8599;</span>
              </a>` : ''}
            </div>` : ''}
          </div>
        </div>
      `).join('');
    }

    const achGrid = document.getElementById('achievements-grid');
    if (achGrid && Array.isArray(data.achievements)) {
      achGrid.innerHTML = data.achievements.map(a => `
        <div class="achievement-card">
          <div class="achievement-meta"><span>${escapeHtml(a.issuer)}</span><span>${escapeHtml(a.year)}</span></div>
          <h4>${escapeHtml(a.title)}</h4>
          <p>${escapeHtml(a.description)}</p>
        </div>
      `).join('');
    }

    const intGrid = document.querySelector('#Interests .service-grid');
    if (intGrid && Array.isArray(data.interests)) {
      intGrid.innerHTML = data.interests.map(item => `
        <div class="service-card w-inline-block">
          <div class="margin-bottom-24"><h4>${escapeHtml(item.title)}</h4></div>
          <div class="paragraph-large">${escapeHtml(item.description)}</div>
        </div>
      `).join('');
    }

    // Re-bind scroll illusions for newly hydrated cards
    setupScrollIllusions();
  }

  hydratePortfolio();

  // ============================================================
  // 5. MOBILE MENU TOGGLE
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
  // 6. SMOOTH SCROLL FOR SAME-PAGE ANCHOR LINKS
  // ============================================================
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
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
  // 7. CONTACT FORM SUBMISSION
  // ============================================================
  const contactForm = document.getElementById('contact-form');
  const successMsg = document.getElementById('form-success');

  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = contactForm.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<div>Sending...</div>';
      }

      const payload = {
        name: (document.getElementById('Name-Form') || {}).value || '',
        email: (document.getElementById('Email-Form') || {}).value || '',
        subject: (document.getElementById('Subject-Form') || {}).value || '',
        message: (document.getElementById('Message-Form') || {}).value || ''
      };

      const contactApiBase = window.location.protocol === 'file:' ? 'http://localhost:3000' : '';
      try {
        await fetch(`${contactApiBase}/api/contact`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } catch {
        // Static mode fallback
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
      }, 450);
    });
  }
});
