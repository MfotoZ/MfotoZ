import { Fancybox } from "https://cdn.jsdelivr.net/npm/@fancyapps/fancybox@4/dist/fancybox.esm.js";

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
      }, 400);
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
  Fancybox.bind('[data-fancybox]', {
    Thumbs: {
      autoStart: false
    },
    Toolbar: {
      display: [
        { id: "counter" },
        { id: "fullscreen" },
        { id: "close" }
      ]
    },
    Image: {
      zoom: false,
      click: false,
      wheel: "slide"
    },
    contentClick: "toggleMax",
    contentDblClick: false,
    placeFocusBack: false,
    fitToView: true,
    preload: 1,
    animated: true,
    compact: false
  });
}

