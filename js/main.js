/**
 * Anunay Brini — Personal Portfolio
 * Optical-Illusion Page Transitions, Dynamic Portfolio Loader, Mobile Menu & Contact Form
 */

document.addEventListener('DOMContentLoaded', () => {
  // ============================================================
  // 1. OPTICAL ILLUSION PAGE TRANSITIONS
  // ============================================================
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

  revealPage();

  // Ensure browser Back/Forward navigation never leaves the overlay closed
  window.addEventListener('pageshow', (e) => {
    if (e.persisted && illusionOverlay) {
      illusionOverlay.classList.remove('is-entering', 'is-leaving');
      illusionOverlay.classList.add('is-revealed');
    }
  });

  // Intercept internal page navigations for the kinetic optical illusion
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
  // 2. DYNAMIC PORTFOLIO HYDRATION (from Backend API or Static JSON)
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

    // 2a. Profile & Hero Hydration
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

    // Disciplines Row (single-line)
    const detailRow = document.querySelector('.header-detail-row') || document.querySelector('.project-detail');
    if (detailRow && Array.isArray(p.disciplines) && p.disciplines.length) {
      detailRow.innerHTML = p.disciplines
        .map(d => `<h5>${escapeHtml(d)}</h5>`)
        .join('<span class="bullet-dot">&bull;</span>');
    }

    // About Section on Home
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

    // Stats Section
    const statsGrid = document.querySelector('.grid-numbers');
    if (statsGrid && Array.isArray(p.stats) && p.stats.length) {
      statsGrid.innerHTML = p.stats.map(s => `
        <div class="${s.featured ? 'number-cell-feature' : 'number-cell'}">
          <div class="number-large">${escapeHtml(s.value)}</div>
          <div class="heading-normal">${escapeHtml(s.label)}</div>
        </div>
      `).join('');
    }

    // 2b. Roles & Journey Hydration
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

    // 2c. Projects Hydration
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
            ${proj.repoUrl ? `
            <div class="project-links-row">
              <a href="${escapeHtml(proj.repoUrl)}" target="_blank" rel="noopener noreferrer" class="project-link">
                <span>GitHub Repository</span>
                <span class="link-arrow">&#8599;</span>
              </a>
            </div>` : ''}
          </div>
        </div>
      `).join('');
    }

    // 2d. Achievements Hydration
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

    // 2e. Technical Interests Hydration
    const intGrid = document.querySelector('#Interests .service-grid');
    if (intGrid && Array.isArray(data.interests)) {
      intGrid.innerHTML = data.interests.map(item => `
        <div class="service-card w-inline-block">
          <div class="margin-bottom-24"><h4>${escapeHtml(item.title)}</h4></div>
          <div class="paragraph-large">${escapeHtml(item.description)}</div>
        </div>
      `).join('');
    }
  }

  hydratePortfolio();

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
  // 4. SMOOTH SCROLL FOR SAME-PAGE ANCHOR LINKS
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
  // 5. CONTACT FORM SUBMISSION (Backend API + Static Fallback)
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
