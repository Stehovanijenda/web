/* ==========================================================================
   STĚHOVÁNÍ JENDA S.R.O. — script.js
   ========================================================================== */

'use strict';

/* --------------------------------------------------------------------------
   1. STICKY NAVBAR — přidat třídu .scrolled při scroll > 50px
   -------------------------------------------------------------------------- */
(function initStickyNavbar() {
  var navbar = document.getElementById('navbar');
  if (!navbar) return;

  function onScroll() {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // run once on load in case page is already scrolled
})();


/* --------------------------------------------------------------------------
   2. HAMBURGER MENU TOGGLE
   -------------------------------------------------------------------------- */
(function initHamburger() {
  var hamburger = document.getElementById('hamburger');
  var navMenu   = document.getElementById('navMenu');

  if (!hamburger || !navMenu) return;

  hamburger.addEventListener('click', function () {
    var isOpen = navMenu.classList.toggle('is-open');
    hamburger.classList.toggle('is-active', isOpen);
    hamburger.setAttribute('aria-expanded', String(isOpen));
    // Prevent body scroll when mobile menu is open
    document.body.classList.toggle('no-scroll', isOpen);
  });
})();


/* --------------------------------------------------------------------------
   3. ZAVŘÍT MENU PŘI KLIKNUTÍ NA ODKAZ nebo mimo navigaci
   -------------------------------------------------------------------------- */
(function initMenuClose() {
  var hamburger = document.getElementById('hamburger');
  var navMenu   = document.getElementById('navMenu');

  if (!hamburger || !navMenu) return;

  function closeMenu() {
    if (navMenu.classList.contains('is-open')) {
      navMenu.classList.remove('is-open');
      hamburger.classList.remove('is-active');
      hamburger.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('no-scroll');
    }
  }

  // Close when any link inside the menu is clicked
  var navLinks = navMenu.querySelectorAll('a');
  navLinks.forEach(function (link) {
    link.addEventListener('click', closeMenu);
  });

  // Close when clicking outside the navbar area
  document.addEventListener('click', function (event) {
    var navbar = document.getElementById('navbar');
    if (navbar && !navbar.contains(event.target)) {
      closeMenu();
    }
  });

  // Close on Escape key
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      closeMenu();
    }
  });
})();


/* --------------------------------------------------------------------------
   4. SMOOTH SCROLL PRO VŠECHNY ANCHOR LINKY
      Záložní řešení pro starší prohlížeče bez scroll-behavior: smooth.
      Moderní prohlížeče použijí nativní chování definované v CSS.
   -------------------------------------------------------------------------- */
(function initSmoothScroll() {
  document.addEventListener('click', function (event) {
    // Walk up the DOM to find an <a> element with a hash href
    var target = event.target;
    while (target && target.tagName !== 'A') {
      target = target.parentElement;
    }

    if (!target) return;

    var href = target.getAttribute('href');
    if (!href || !href.startsWith('#') || href === '#') return;

    var sectionId = href.slice(1);
    var section   = document.getElementById(sectionId);
    if (!section) return;

    event.preventDefault();

    // Recalculate offset each time so it stays correct after browser resize
    var navbarEl = document.getElementById('navbar');
    var SCROLL_OFFSET = navbarEl ? navbarEl.offsetHeight : 72;

    var top = section.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET;
    window.scrollTo({ top: top, behavior: 'smooth' });

    if (history.pushState) {
      history.pushState(null, '', href);
    }
  });
})();


/* --------------------------------------------------------------------------
   5. FORMULÁŘ SUBMIT HANDLER — validace + success message
   -------------------------------------------------------------------------- */
(function initContactForm() {
  var form       = document.getElementById('contactForm');
  var successBox = document.getElementById('formSuccess');

  if (!form) return;

  /* ---- helper: mark field as invalid, show error message ---- */
  function showError(fieldId, message) {
    var errorEl = document.getElementById(fieldId + '-error');
    var inputEl = document.getElementById(fieldId);

    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.add('is-visible');
    }
    if (inputEl) {
      inputEl.classList.add('is-invalid');
      inputEl.setAttribute('aria-invalid', 'true');
    }
  }

  /* ---- helper: clear field error state ---- */
  function clearError(fieldId) {
    var errorEl = document.getElementById(fieldId + '-error');
    var inputEl = document.getElementById(fieldId);

    if (errorEl) {
      errorEl.textContent = '';
      errorEl.classList.remove('is-visible');
    }
    if (inputEl) {
      inputEl.classList.remove('is-invalid');
      inputEl.removeAttribute('aria-invalid');
    }
  }

  /* ---- validate a single field, return true if valid ---- */
  function validateField(field) {
    var id    = field.id;
    var value = (field.value || '').trim();

    clearError(id);

    // Checkbox handling
    if (field.type === 'checkbox') {
      if (!field.checked) {
        showError(id, 'Prosím potvrďte souhlas se zpracováním osobních údajů.');
        return false;
      }
      return true;
    }

    // Required and empty
    if (field.required && !value) {
      showError(id, 'Toto pole je povinné.');
      return false;
    }

    // Email format
    if (field.type === 'email' && value) {
      var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRe.test(value)) {
        showError(id, 'Zadejte platnou e-mailovou adresu (např. jan@email.cz).');
        return false;
      }
    }

    // Phone format
    if (field.type === 'tel' && value) {
      var phoneRe = /^[+\d][\d\s\-().]{6,}$/;
      if (!phoneRe.test(value)) {
        showError(id, 'Zadejte platné telefonní číslo (např. +420 777 123 456).');
        return false;
      }
    }

    // Select (ensure something was picked)
    if (field.tagName === 'SELECT' && field.required && !value) {
      showError(id, 'Vyberte jednu z možností.');
      return false;
    }

    return true;
  }

  /* ---- live validation — re-validate on blur and on input after error ---- */
  var requiredFields = form.querySelectorAll('[required]');
  requiredFields.forEach(function (field) {
    field.addEventListener('blur', function () {
      validateField(field);
    });
    field.addEventListener('input', function () {
      if (field.classList.contains('is-invalid')) {
        validateField(field);
      }
    });
    field.addEventListener('change', function () {
      // For selects and checkboxes
      if (field.classList.contains('is-invalid')) {
        validateField(field);
      }
    });
  });

  /* ---- form submit ---- */
  form.addEventListener('submit', function (event) {
    event.preventDefault();

    var isValid = true;

    // Run validation on every required field
    requiredFields.forEach(function (field) {
      if (!validateField(field)) {
        isValid = false;
      }
    });

    if (!isValid) {
      // Focus and scroll to the first invalid field
      var firstInvalid = form.querySelector('.is-invalid');
      if (firstInvalid) {
        firstInvalid.focus();
        firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    // Disable submit button to prevent double submission
    var submitBtn = form.querySelector('[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Odesílám...';
    }

    var formData = new FormData(form);

    fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(formData).toString()
    })
      .then(function (response) {
        if (response.ok) {
          form.style.display = 'none';
          if (successBox) {
            successBox.classList.add('is-visible');
            successBox.removeAttribute('aria-hidden');
            successBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        } else {
          throw new Error('Server error');
        }
      })
      .catch(function () {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Odeslat poptávku \u2192';
        }
        var submitErrorEl = form.querySelector('.form__submit-error');
        if (!submitErrorEl) {
          submitErrorEl = document.createElement('span');
          submitErrorEl.className = 'form__error is-visible form__submit-error';
          submitErrorEl.setAttribute('role', 'alert');
          submitBtn.insertAdjacentElement('beforebegin', submitErrorEl);
        }
        submitErrorEl.textContent = 'Odeslání se nezdařilo. Zkuste to prosím znovu nebo nás kontaktujte telefonicky.';
      });
  });
})();


/* --------------------------------------------------------------------------
   6. FADE-IN ANIMACE PŘES INTERSECTION OBSERVER
      CSS definuje: .fade-in { opacity: 0; transform: translateY(28px); }
                    .fade-in.is-visible { opacity: 1; transform: none; }
   -------------------------------------------------------------------------- */
(function initFadeIn() {
  var elements = document.querySelectorAll('.fade-in');
  if (!elements.length) return;

  // Graceful degradation: if IntersectionObserver is not available
  if (!('IntersectionObserver' in window)) {
    elements.forEach(function (el) {
      el.classList.add('is-visible');
    });
    return;
  }

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target); // animate only once
        }
      });
    },
    {
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px'
    }
  );

  elements.forEach(function (el) {
    observer.observe(el);
  });
})();


/* --------------------------------------------------------------------------
   7. AKTIVNÍ STAV NAVIGACE DLE AKTUÁLNÍ SEKCE PŘI SCROLLU
      CSS definuje: .navbar__link.active { color: var(--orange); }
   -------------------------------------------------------------------------- */
(function initActiveNav() {
  // All nav links that carry a data-section attribute
  var navLinks = document.querySelectorAll('.navbar__link[data-section]');
  if (!navLinks.length) return;

  // Build a lookup table: sectionId -> { link, section }
  var sectionEntries = [];
  navLinks.forEach(function (link) {
    var sectionId = link.getAttribute('data-section');
    var section   = document.getElementById(sectionId);
    if (section) {
      sectionEntries.push({ link: link, section: section, id: sectionId });
    }
  });

  if (!sectionEntries.length) return;

  function updateActiveLink() {
    var NAVBAR_OFFSET = document.getElementById('navbar').offsetHeight || 72; // px from top at which section is considered active
    var scrollY      = window.scrollY;
    var windowBottom = scrollY + window.innerHeight;
    var docHeight    = document.documentElement.scrollHeight;

    var currentEntry = null;

    // If scrolled to the very bottom, activate the last section
    if (windowBottom >= docHeight - 4) {
      currentEntry = sectionEntries[sectionEntries.length - 1];
    } else {
      // Find the deepest section whose top is above the detection line
      for (var i = 0; i < sectionEntries.length; i++) {
        var entry     = sectionEntries[i];
        var sectionTop = entry.section.getBoundingClientRect().top + scrollY;

        if (scrollY + NAVBAR_OFFSET >= sectionTop) {
          currentEntry = entry;
        }
      }
    }

    // Toggle the .active class on nav links
    navLinks.forEach(function (link) {
      link.classList.remove('active');
    });

    if (currentEntry) {
      currentEntry.link.classList.add('active');
    }
  }

  window.addEventListener('scroll', updateActiveLink, { passive: true });
  updateActiveLink(); // run once immediately on load
})();


/* --------------------------------------------------------------------------
   8. STATS BAR — animovaný počítadlo při vstupu do viewportu
   -------------------------------------------------------------------------- */
(function initCounters() {
  var statNumbers = document.querySelectorAll('.stats-bar__number');
  if (!statNumbers.length) return;
  if (!('IntersectionObserver' in window) || !window.requestAnimationFrame) return;

  function animateCounter(el) {
    var rawText = el.textContent.trim();
    // Match a leading number and optional suffix (e.g. "350+" or "8 let" or "100%")
    var match   = rawText.match(/^(\d[\d\s]*)(.*)$/);
    if (!match) return;

    var target   = parseInt(match[1].replace(/\s/g, ''), 10);
    var suffix   = match[2] || '';
    var duration = 1400; // ms
    var start    = null;

    function step(timestamp) {
      if (!start) start = timestamp;
      var elapsed  = timestamp - start;
      var progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      var eased    = 1 - Math.pow(1 - progress, 3);
      var current  = Math.round(eased * target);

      el.textContent = current + suffix;

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = rawText; // restore exact original string
      }
    }

    requestAnimationFrame(step);
  }

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  statNumbers.forEach(function (el) {
    observer.observe(el);
  });
})();


/* --------------------------------------------------------------------------
   9. SCROLL-TO-TOP BUTTON
      Zobrazí se po scrollnutí dolů o 400px, vrátí uživatele nahoru.
   -------------------------------------------------------------------------- */
(function initScrollToTop() {
  // Create button element
  var btn = document.createElement('button');
  btn.setAttribute('aria-label', 'Zpět nahoru');
  btn.setAttribute('title', 'Zpět nahoru');
  btn.className = 'js-scroll-top';
  btn.innerHTML = '&#8679;'; // ↑

  document.body.appendChild(btn);

  // Toggle visibility based on scroll position
  window.addEventListener('scroll', function () {
    if (window.scrollY > 400) {
      btn.classList.add('js-scroll-top--visible');
    } else {
      btn.classList.remove('js-scroll-top--visible');
    }
  }, { passive: true });

  // Scroll to top on click
  btn.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();


/* --------------------------------------------------------------------------
   11. SERVICES FILTER
       Filtrovací záložky v sekci "Naše služby"
   -------------------------------------------------------------------------- */
(function initServicesFilter() {
  var filterBtns = document.querySelectorAll('.services__filter-btn');
  var cards      = document.querySelectorAll('.service-card[data-category]');

  if (!filterBtns.length || !cards.length) return;

  filterBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var filter = btn.getAttribute('data-filter');

      // Update active button
      filterBtns.forEach(function (b) { b.classList.remove('is-active'); });
      btn.classList.add('is-active');

      // Show/hide cards
      cards.forEach(function (card) {
        if (filter === 'vse' || card.getAttribute('data-category') === filter) {
          card.classList.remove('service-card--hidden');
        } else {
          card.classList.add('service-card--hidden');
        }
      });
    });
  });
})();

/* --------------------------------------------------------------------------
   10. REVEAL ABOVE-FOLD ELEMENTS
       Elementy s .fade-in které jsou viditelné okamžitě při načtení stránky
       (nad přechodem) dostanout .is-visible ihned bez čekání na scroll.
   -------------------------------------------------------------------------- */
(function revealAboveFold() {
  // Small delay so CSS transitions are registered before we add the class
  setTimeout(function () {
    var elements = document.querySelectorAll('.fade-in:not(.is-visible)');
    elements.forEach(function (el) {
      var rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        el.classList.add('is-visible');
      }
    });
  }, 80);
})();
