/**
 * Anunay Brini — Personal Portfolio
 * Core Interactive Scripts (GitHub Pages Compatible)
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Mobile Menu Toggle
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

    // Close menu when a link inside is clicked
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

  // 2. Smooth Scroll for Anchor Links
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

  // 3. Contact Form Submission Feedback
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
