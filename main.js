 
document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  initLongPressOnImages();
  initVideoModal();
  initFancyboxGalleries();
});

/** Hamburger meni **/
function initMobileMenu() {
  const hamburger = document.querySelector('.hamburger');
  const mobileMenu = document.querySelector('.mobile-menu-overlay');

  if (!hamburger || !mobileMenu) return;

  hamburger.addEventListener('click', () => {
    const expanded = hamburger.getAttribute('aria-expanded') === 'true';
    hamburger.setAttribute('aria-expanded', !expanded);
    hamburger.classList.toggle('active');
    mobileMenu.classList.toggle('active');
  });

  document.querySelectorAll('.mobile-menu a').forEach(link => {
    link.addEventListener('click', () => {
      closeMobileMenu(hamburger, mobileMenu);
    });
  });

  mobileMenu.addEventListener('click', e => {
    if (e.target === mobileMenu) {
      closeMobileMenu(hamburger, mobileMenu);
    }
  });
}

function closeMobileMenu(hamburger, mobileMenu) {
  hamburger.setAttribute('aria-expanded', false);
  hamburger.classList.remove('active');
  mobileMenu.classList.remove('active');
}

/** Dolg pritisk na .image-wrapper **/
function initLongPressOnImages() {
  const wrappers = document.querySelectorAll('.image-wrapper');

  wrappers.forEach(wrapper => {
    let pressTimer;

    wrapper.addEventListener('touchstart', () => {
      clearTimeout(pressTimer);
      document.querySelectorAll('.image-wrapper.long-press').forEach(el => el.classList.remove('long-press'));
      pressTimer = setTimeout(() => {
        wrapper.classList.add('long-press');
      }, 250);
    });

    ['touchend', 'touchcancel', 'touchmove'].forEach(evt =>
      wrapper.addEventListener(evt, () => {
        clearTimeout(pressTimer);
        wrapper.classList.remove('long-press');
      })
    );
  });
}

/** Video modal **/
function initVideoModal() {
  const modal = document.getElementById('videoModal');
  const video = document.getElementById('modalVideo');
  const closeBtn = document.querySelector('.close-btn');

  if (!modal || !video || !closeBtn) return;

  // Naredimo funkciji globalni, da jih lahko kličeš iz HTMLja
  window.openModal = function (videoSrc) {
    video.src = videoSrc;
    modal.style.display = 'flex';
    video.play();
  };

  window.closeModal = function () {
    modal.style.display = 'none';
    video.pause();
    video.src = '';
  };

  closeBtn.addEventListener('click', window.closeModal);
}


function initFancyboxGalleries() {
  const imageLinks = document.querySelectorAll('[data-fancybox]');
  if (imageLinks.length === 0) return;

 function initFancyboxGalleries() {
  const imageLinks = document.querySelectorAll('[data-fancybox]');
  if (imageLinks.length === 0) return;

  Fancybox.bind('[data-fancybox]', {
    Toolbar: {
      show: true,
      display: [
        "play",       // 🎞️ Diaprojekcija
        "fullscreen", // 🔲 Celozaslonski prikaz
        "close"       // ❌ Zapri
      ]
    },
    Thumbs: {
      autoStart: true
    }
  });
}
}

document.addEventListener('DOMContentLoaded', () => {
  const filterLinks = document.querySelectorAll('.sub-menu a');
  const imageWrappers = document.querySelectorAll('.image-wrapper');

  filterLinks.forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const filter = link.getAttribute('data-filter');

      imageWrappers.forEach(wrapper => {
        const category = wrapper.getAttribute('data-category');
        if (filter === 'all' || category === filter) {
          wrapper.style.display = 'inline-block';
        } else {
          wrapper.style.display = 'none';
        }
      });
    });
  });
});


initFancyboxGalleries();
