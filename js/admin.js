(function () {
  const TOKEN_KEY = 'portfolio_owner_token';
  let portfolioData = null;
  let authConfig = { authMode: 'email_password' };

  const loginView = document.getElementById('login-view');
  const dashboardView = document.getElementById('dashboard-view');
  const logoutBtn = document.getElementById('logout-btn');
  const loginForm = document.getElementById('login-form');
  const loginError = document.getElementById('login-error');
  const loginNotice = document.getElementById('login-notice');
  const toastBar = document.getElementById('toast-bar');

  // Optical Illusion Page Transition handler
  const illusionOverlay = document.getElementById('page-illusion-overlay');
  if (illusionOverlay) {
    requestAnimationFrame(() => {
      setTimeout(() => {
        illusionOverlay.classList.remove('is-entering');
        illusionOverlay.classList.add('is-revealed');
      }, 60);
    });
    document.querySelectorAll('a[data-illusion-link]').forEach(link => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (!href) return;
        e.preventDefault();
        illusionOverlay.classList.remove('is-revealed');
        illusionOverlay.classList.add('is-leaving');
        setTimeout(() => {
          window.location.href = href;
        }, 520);
      });
    });
  }

  function showToast(msg) {
    toastBar.textContent = msg;
    toastBar.style.display = 'block';
    setTimeout(() => {
      toastBar.style.display = 'none';
    }, 3000);
  }

  function getToken() {
    return localStorage.getItem(TOKEN_KEY) || '';
  }

  const API_BASE = window.location.protocol === 'file:' ? 'http://localhost:3000' : '';

  async function api(url, options = {}) {
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    let res;
    try {
      res = await fetch(`${API_BASE}${url}`, { ...options, headers });
    } catch {
      throw new Error('Backend server is not running. Double-click start-portfolio.bat or run "node server.js" in E:\\Portfolio.');
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
    return data;
  }

  function configureLoginFields(mode) {
    const emailWrap = document.getElementById('field-email-wrap');
    const phoneWrap = document.getElementById('field-phone-wrap');
    const otpWrap = document.getElementById('field-otp-wrap');
    const passWrap = document.getElementById('field-password-wrap');
    const desc = document.getElementById('auth-mode-desc');

    if (mode === 'email_password') {
      emailWrap.style.display = 'flex';
      phoneWrap.style.display = 'none';
      otpWrap.style.display = 'none';
      passWrap.style.display = 'flex';
      desc.textContent = `Sign in with owner email (${authConfig.emailHint || ''}) and password.`;
    } else if (mode === 'phone_otp') {
      emailWrap.style.display = 'none';
      phoneWrap.style.display = 'flex';
      otpWrap.style.display = 'flex';
      passWrap.style.display = 'none';
      desc.textContent = `Sign in with owner phone (${authConfig.phoneHint || ''}) and 6-digit OTP.`;
    } else {
      emailWrap.style.display = 'flex';
      phoneWrap.style.display = 'flex';
      otpWrap.style.display = 'flex';
      passWrap.style.display = 'flex';
      desc.textContent = 'Two-factor mode: enter email or phone, password, and 6-digit OTP.';
    }
  }

  async function init() {
    try {
      authConfig = await api('/api/auth/config');
      configureLoginFields(authConfig.authMode);
    } catch {
      loginError.textContent = 'Backend server is not running. Start it with "node server.js" to use the CMS.';
      loginError.style.display = 'block';
      return;
    }

    if (getToken()) {
      try {
        const me = await api('/api/auth/me');
        enterDashboard(me);
        return;
      } catch {
        localStorage.removeItem(TOKEN_KEY);
      }
    }
    loginView.style.display = 'block';
    dashboardView.style.display = 'none';
    logoutBtn.style.display = 'none';
  }

  document.getElementById('send-otp-btn').addEventListener('click', async () => {
    loginError.style.display = 'none';
    loginNotice.style.display = 'none';
    const phone = document.getElementById('login-phone').value.trim();
    try {
      const res = await api('/api/auth/send-otp', {
        method: 'POST',
        body: JSON.stringify({ phone })
      });
      if (res.localPreviewOtp) {
        loginNotice.textContent = `OTP sent. Local preview code: ${res.localPreviewOtp}`;
      } else {
        loginNotice.textContent = res.message || 'OTP sent to your phone.';
      }
      loginNotice.style.display = 'block';
    } catch (err) {
      loginError.textContent = err.message;
      loginError.style.display = 'block';
    }
  });

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.style.display = 'none';
    const payload = {
      email: document.getElementById('login-email').value.trim(),
      phone: document.getElementById('login-phone').value.trim(),
      otp: document.getElementById('login-otp').value.trim(),
      password: document.getElementById('login-password').value
    };
    try {
      const res = await api('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      localStorage.setItem(TOKEN_KEY, res.token);
      const me = await api('/api/auth/me');
      enterDashboard(me);
    } catch (err) {
      loginError.textContent = err.message;
      loginError.style.display = 'block';
    }
  });

  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem(TOKEN_KEY);
    window.location.reload();
  });

  async function enterDashboard(me) {
    loginView.style.display = 'none';
    dashboardView.style.display = 'block';
    logoutBtn.style.display = 'inline-flex';

    // Fill security settings
    document.getElementById('sec-mode').value = me.authMode || 'email_password';
    document.getElementById('sec-email').value = me.email || '';
    document.getElementById('sec-phone').value = me.phone || '';
    document.getElementById('sec-webhook').value = me.smsWebhookUrl || '';

    await loadAllData();
  }

  async function loadAllData() {
    portfolioData = await api('/api/portfolio');
    renderProjects();
    renderJourney();
    renderAchievements();
    renderInterests();
    fillProfileForm();
    loadMessages();
  }

  // Tabs
  document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
    });
  });

  // Image Upload Helper
  async function handleImageUpload(fileInput, targetInput) {
    const file = fileInput.files && fileInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const res = await api('/api/upload', {
          method: 'POST',
          body: JSON.stringify({ filename: file.name, dataUrl: reader.result })
        });
        targetInput.value = res.url;
        showToast('Image uploaded successfully.');
      } catch (err) {
        showToast(err.message);
      }
    };
    reader.readAsDataURL(file);
  }

  document.getElementById('proj-image-file').addEventListener('change', function () {
    handleImageUpload(this, document.getElementById('proj-image'));
  });
  document.getElementById('prof-image-file').addEventListener('change', function () {
    handleImageUpload(this, document.getElementById('prof-hero-image'));
  });

  // ---- PROJECTS ----
  function renderProjects() {
    const container = document.getElementById('projects-list');
    container.innerHTML = '';
    (portfolioData.projects || []).forEach(p => {
      const row = document.createElement('div');
      row.className = 'item-row';
      row.innerHTML = `
        <div class="item-row-info">
          <div class="item-row-meta">${escapeHtml(p.category)}</div>
          <h4>${escapeHtml(p.title)}</h4>
          <p class="item-row-desc">${escapeHtml(p.description)}</p>
        </div>
        <div class="item-row-actions">
          <button type="button" class="btn-sm" data-edit-proj="${p.id}">Edit</button>
          <button type="button" class="btn-sm btn-sm-danger" data-del-proj="${p.id}">Delete</button>
        </div>
      `;
      container.appendChild(row);
    });

    container.querySelectorAll('[data-edit-proj]').forEach(btn => {
      btn.addEventListener('click', () => {
        const p = portfolioData.projects.find(x => x.id === btn.dataset.editProj);
        if (!p) return;
        document.getElementById('project-form-title').textContent = 'Edit Project';
        document.getElementById('proj-id').value = p.id;
        document.getElementById('proj-title').value = p.title;
        document.getElementById('proj-category').value = p.category;
        document.getElementById('proj-desc').value = p.description;
        document.getElementById('proj-focus-title').value = p.focusTitle || 'Focus Areas:';
        document.getElementById('proj-tags').value = (p.focusTags || []).join(', ');
        document.getElementById('proj-stack').value = p.techStack || '';
        document.getElementById('proj-repo').value = p.repoUrl || '';
        document.getElementById('proj-image').value = p.image || '';
        document.getElementById('proj-cancel-btn').style.display = 'inline-flex';
      });
    });

    container.querySelectorAll('[data-del-proj]').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Delete this project?')) return;
        await api(`/api/projects/${btn.dataset.delProj}`, { method: 'DELETE' });
        showToast('Project deleted.');
        await loadAllData();
      });
    });
  }

  function resetProjectForm() {
    document.getElementById('project-form').reset();
    document.getElementById('proj-id').value = '';
    document.getElementById('project-form-title').textContent = 'Add New Project';
    document.getElementById('proj-cancel-btn').style.display = 'none';
  }

  document.getElementById('proj-cancel-btn').addEventListener('click', resetProjectForm);

  document.getElementById('project-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('proj-id').value;
    const payload = {
      title: document.getElementById('proj-title').value.trim(),
      category: document.getElementById('proj-category').value.trim(),
      description: document.getElementById('proj-desc').value.trim(),
      focusTitle: document.getElementById('proj-focus-title').value.trim() || 'Focus Areas:',
      focusTags: document.getElementById('proj-tags').value.split(',').map(s => s.trim()).filter(Boolean),
      techStack: document.getElementById('proj-stack').value.trim(),
      repoUrl: document.getElementById('proj-repo').value.trim(),
      image: document.getElementById('proj-image').value.trim() || 'images/project_gym.jpg'
    };
    if (id) {
      await api(`/api/projects/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
      showToast('Project updated.');
    } else {
      await api('/api/projects', { method: 'POST', body: JSON.stringify(payload) });
      showToast('Project added.');
    }
    resetProjectForm();
    await loadAllData();
  });

  // ---- JOURNEY / ROLES ----
  function renderJourney() {
    const container = document.getElementById('journey-list');
    container.innerHTML = '';
    (portfolioData.journey || []).forEach(j => {
      const row = document.createElement('div');
      row.className = 'item-row';
      row.innerHTML = `
        <div class="item-row-info">
          <div class="item-row-meta">${escapeHtml(j.number)} | ${escapeHtml(j.company)} | ${escapeHtml(j.period)}</div>
          <h4>${escapeHtml(j.title)}</h4>
          <p class="item-row-desc">${escapeHtml(j.description)}</p>
        </div>
        <div class="item-row-actions">
          <button type="button" class="btn-sm" data-edit-jrn="${j.id}">Edit</button>
          <button type="button" class="btn-sm btn-sm-danger" data-del-jrn="${j.id}">Delete</button>
        </div>
      `;
      container.appendChild(row);
    });

    container.querySelectorAll('[data-edit-jrn]').forEach(btn => {
      btn.addEventListener('click', () => {
        const j = portfolioData.journey.find(x => x.id === btn.dataset.editJrn);
        if (!j) return;
        document.getElementById('journey-form-title').textContent = 'Edit Role / Journey';
        document.getElementById('jrn-id').value = j.id;
        document.getElementById('jrn-number').value = j.number;
        document.getElementById('jrn-company').value = j.company;
        document.getElementById('jrn-period').value = j.period;
        document.getElementById('jrn-title').value = j.title;
        document.getElementById('jrn-desc').value = j.description;
        document.getElementById('jrn-cancel-btn').style.display = 'inline-flex';
      });
    });

    container.querySelectorAll('[data-del-jrn]').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Delete this role?')) return;
        await api(`/api/journey/${btn.dataset.delJrn}`, { method: 'DELETE' });
        showToast('Role deleted.');
        await loadAllData();
      });
    });
  }

  function resetJourneyForm() {
    document.getElementById('journey-form').reset();
    document.getElementById('jrn-id').value = '';
    document.getElementById('journey-form-title').textContent = 'Add Role / Journey Step';
    document.getElementById('jrn-cancel-btn').style.display = 'none';
  }

  document.getElementById('jrn-cancel-btn').addEventListener('click', resetJourneyForm);

  document.getElementById('journey-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('jrn-id').value;
    const payload = {
      number: document.getElementById('jrn-number').value.trim() || '01',
      company: document.getElementById('jrn-company').value.trim(),
      period: document.getElementById('jrn-period').value.trim(),
      title: document.getElementById('jrn-title').value.trim(),
      description: document.getElementById('jrn-desc').value.trim()
    };
    if (id) {
      await api(`/api/journey/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
      showToast('Role updated.');
    } else {
      await api('/api/journey', { method: 'POST', body: JSON.stringify(payload) });
      showToast('Role added.');
    }
    resetJourneyForm();
    await loadAllData();
  });

  // ---- ACHIEVEMENTS ----
  function renderAchievements() {
    const container = document.getElementById('achievements-list');
    container.innerHTML = '';
    (portfolioData.achievements || []).forEach(a => {
      const row = document.createElement('div');
      row.className = 'item-row';
      row.innerHTML = `
        <div class="item-row-info">
          <div class="item-row-meta">${escapeHtml(a.issuer)} | ${escapeHtml(a.year)}</div>
          <h4>${escapeHtml(a.title)}</h4>
          <p class="item-row-desc">${escapeHtml(a.description)}</p>
        </div>
        <div class="item-row-actions">
          <button type="button" class="btn-sm" data-edit-ach="${a.id}">Edit</button>
          <button type="button" class="btn-sm btn-sm-danger" data-del-ach="${a.id}">Delete</button>
        </div>
      `;
      container.appendChild(row);
    });

    container.querySelectorAll('[data-edit-ach]').forEach(btn => {
      btn.addEventListener('click', () => {
        const a = portfolioData.achievements.find(x => x.id === btn.dataset.editAch);
        if (!a) return;
        document.getElementById('ach-form-title').textContent = 'Edit Achievement';
        document.getElementById('ach-id').value = a.id;
        document.getElementById('ach-title').value = a.title;
        document.getElementById('ach-issuer').value = a.issuer;
        document.getElementById('ach-year').value = a.year;
        document.getElementById('ach-desc').value = a.description;
        document.getElementById('ach-cancel-btn').style.display = 'inline-flex';
      });
    });

    container.querySelectorAll('[data-del-ach]').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Delete this achievement?')) return;
        await api(`/api/achievements/${btn.dataset.delAch}`, { method: 'DELETE' });
        showToast('Achievement deleted.');
        await loadAllData();
      });
    });
  }

  function resetAchForm() {
    document.getElementById('ach-form').reset();
    document.getElementById('ach-id').value = '';
    document.getElementById('ach-form-title').textContent = 'Add Achievement';
    document.getElementById('ach-cancel-btn').style.display = 'none';
  }

  document.getElementById('ach-cancel-btn').addEventListener('click', resetAchForm);

  document.getElementById('ach-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('ach-id').value;
    const payload = {
      title: document.getElementById('ach-title').value.trim(),
      issuer: document.getElementById('ach-issuer').value.trim(),
      year: document.getElementById('ach-year').value.trim(),
      description: document.getElementById('ach-desc').value.trim()
    };
    if (id) {
      await api(`/api/achievements/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
      showToast('Achievement updated.');
    } else {
      await api('/api/achievements', { method: 'POST', body: JSON.stringify(payload) });
      showToast('Achievement added.');
    }
    resetAchForm();
    await loadAllData();
  });

  // ---- PROFILE ----
  function fillProfileForm() {
    const p = portfolioData.profile || {};
    document.getElementById('prof-greeting').value = p.greeting || '';
    document.getElementById('prof-disciplines').value = (p.disciplines || []).join(', ');
    document.getElementById('prof-role1').value = p.roleLine1 || '';
    document.getElementById('prof-role2').value = p.roleLine2 || '';
    document.getElementById('prof-city').value = p.locationCity || '';
    document.getElementById('prof-country').value = p.locationCountry || '';
    document.getElementById('prof-hero-image').value = p.heroImage || '';
    document.getElementById('prof-about-headline').value = p.aboutHeadline || '';
    document.getElementById('prof-about-sub').value = p.aboutSubheadline || '';
    document.getElementById('prof-about-bio').value = p.aboutBio || '';
    document.getElementById('prof-education').value = p.education || '';
    document.getElementById('prof-college').value = p.college || '';
    document.getElementById('prof-period').value = p.degreePeriod || '';
    document.getElementById('prof-grad').value = p.graduationYear || '';
  }

  document.getElementById('profile-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      greeting: document.getElementById('prof-greeting').value.trim(),
      disciplines: document.getElementById('prof-disciplines').value.split(',').map(s => s.trim()).filter(Boolean),
      roleLine1: document.getElementById('prof-role1').value.trim(),
      roleLine2: document.getElementById('prof-role2').value.trim(),
      locationCity: document.getElementById('prof-city').value.trim(),
      locationCountry: document.getElementById('prof-country').value.trim(),
      heroImage: document.getElementById('prof-hero-image').value.trim(),
      aboutHeadline: document.getElementById('prof-about-headline').value.trim(),
      aboutSubheadline: document.getElementById('prof-about-sub').value.trim(),
      aboutBio: document.getElementById('prof-about-bio').value.trim(),
      education: document.getElementById('prof-education').value.trim(),
      college: document.getElementById('prof-college').value.trim(),
      degreePeriod: document.getElementById('prof-period').value.trim(),
      graduationYear: document.getElementById('prof-grad').value.trim()
    };
    await api('/api/portfolio/profile', { method: 'PUT', body: JSON.stringify(payload) });
    showToast('Profile details saved.');
    await loadAllData();
  });

  // ---- TECHNICAL INTERESTS ----
  function renderInterests() {
    const container = document.getElementById('interests-list');
    container.innerHTML = '';
    (portfolioData.interests || []).forEach(item => {
      const row = document.createElement('div');
      row.className = 'item-row';
      row.innerHTML = `
        <div class="item-row-info">
          <h4>${escapeHtml(item.title)}</h4>
          <p class="item-row-desc">${escapeHtml(item.description)}</p>
        </div>
        <div class="item-row-actions">
          <button type="button" class="btn-sm" data-edit-int="${item.id}">Edit</button>
          <button type="button" class="btn-sm btn-sm-danger" data-del-int="${item.id}">Delete</button>
        </div>
      `;
      container.appendChild(row);
    });

    container.querySelectorAll('[data-edit-int]').forEach(btn => {
      btn.addEventListener('click', () => {
        const i = portfolioData.interests.find(x => x.id === btn.dataset.editInt);
        if (!i) return;
        document.getElementById('int-form-title').textContent = 'Edit Technical Interest';
        document.getElementById('int-id').value = i.id;
        document.getElementById('int-title').value = i.title;
        document.getElementById('int-desc').value = i.description;
        document.getElementById('int-cancel-btn').style.display = 'inline-flex';
      });
    });

    container.querySelectorAll('[data-del-int]').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Delete this technical interest?')) return;
        await api(`/api/interests/${btn.dataset.delInt}`, { method: 'DELETE' });
        showToast('Interest deleted.');
        await loadAllData();
      });
    });
  }

  function resetIntForm() {
    document.getElementById('int-form').reset();
    document.getElementById('int-id').value = '';
    document.getElementById('int-form-title').textContent = 'Add Technical Interest';
    document.getElementById('int-cancel-btn').style.display = 'none';
  }

  document.getElementById('int-cancel-btn').addEventListener('click', resetIntForm);

  document.getElementById('int-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('int-id').value;
    const payload = {
      title: document.getElementById('int-title').value.trim(),
      description: document.getElementById('int-desc').value.trim()
    };
    if (id) {
      await api(`/api/interests/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
      showToast('Interest updated.');
    } else {
      await api('/api/interests', { method: 'POST', body: JSON.stringify(payload) });
      showToast('Interest added.');
    }
    resetIntForm();
    await loadAllData();
  });

  // ---- MESSAGES ----
  async function loadMessages() {
    const container = document.getElementById('messages-list');
    try {
      const msgs = await api('/api/messages');
      if (!msgs.length) {
        container.innerHTML = '<p class="item-row-desc">No messages received yet.</p>';
        return;
      }
      container.innerHTML = '';
      msgs.forEach(m => {
        const row = document.createElement('div');
        row.className = 'item-row';
        row.innerHTML = `
          <div class="item-row-info">
            <div class="item-row-meta">${escapeHtml(m.name)} (${escapeHtml(m.email)})</div>
            <h4>${escapeHtml(m.subject)}</h4>
            <p class="item-row-desc">${escapeHtml(m.message)}</p>
          </div>
          <div class="item-row-actions">
            <button type="button" class="btn-sm btn-sm-danger" data-del-msg="${m.id}">Delete</button>
          </div>
        `;
        container.appendChild(row);
      });
      container.querySelectorAll('[data-del-msg]').forEach(btn => {
        btn.addEventListener('click', async () => {
          await api(`/api/messages/${btn.dataset.delMsg}`, { method: 'DELETE' });
          showToast('Message deleted.');
          loadMessages();
        });
      });
    } catch {
      container.innerHTML = '';
    }
  }

  // ---- SECURITY SETTINGS ----
  document.getElementById('security-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      authMode: document.getElementById('sec-mode').value,
      email: document.getElementById('sec-email').value.trim(),
      phone: document.getElementById('sec-phone').value.trim(),
      smsWebhookUrl: document.getElementById('sec-webhook').value.trim()
    };
    const newPass = document.getElementById('sec-password').value;
    if (newPass) payload.newPassword = newPass;

    try {
      await api('/api/auth/settings', { method: 'POST', body: JSON.stringify(payload) });
      document.getElementById('sec-password').value = '';
      showToast('Login & security settings updated.');
    } catch (err) {
      showToast(err.message);
    }
  });

  // Export JSON
  document.getElementById('export-json-btn').addEventListener('click', () => {
    if (!portfolioData) return;
    const blob = new Blob([JSON.stringify(portfolioData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'portfolio.json';
    a.click();
    URL.revokeObjectURL(url);
  });

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  init();
})();
