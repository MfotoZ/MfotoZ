/** Preprost filter za kategorije **/
function initCategoryFilter() {
  // Najdi gumbe
  const filterButtons = document.querySelectorAll('.filter-btn');
  
  // Dodaj event listener na vsak gumb
  filterButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      
      // Odstrani aktivni razred iz vseh gumbov
      filterButtons.forEach(btn => btn.classList.remove('active'));
      
      // Doda aktivni razred trenutnemu gumbu
      this.classList.add('active');
      
      // Pridobi kategorijo
      const category = this.getAttribute('data-filter');
      
      // Najdi vse fotografije
      const images = document.querySelectorAll('.image-wrapper');
      
      // Filtriraj — namesto inline display uporabljamo CSS razred .hidden (ki ima !important v CSS)
      images.forEach(image => {
        const match = (category === 'all') || (image.getAttribute('data-category') === category);
        image.classList.toggle('hidden', !match);
      });
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  initLongPressOnImages();
  initVideoModal();
  initFancyboxGalleries();
  initCategoryFilter();
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

// znotraj initVideoModal()
window.openModal = function (url) {
  const m = document.getElementById('videoModal');
  const v = document.getElementById('modalVideo');

  v.src = url;
  v.load();

  // iOS Safari dovoljuje autoplay samo z muted + playsinline
  v.play().catch(() => {
    console.log("iOS blokira autoplay – uporabnik mora tapniti play.");
  });

  m.style.display = 'flex';
};


window.closeModal = function () {
  const m = document.getElementById('videoModal');
  const vContainer = document.getElementById('modalVideoContainer');

  // počisti vsebino (tudi iframe, če je bil)
  vContainer.innerHTML = '';

  // vstavi nazaj prazen <video> za lokalne videe (da še vedno delujejo)
  const video = document.createElement('video');
  video.id = 'modalVideo';
  video.controls = true;
  video.autoplay = true;
  video.muted = true;
  video.playsInline = true;
  video.style.width = '100%';
  video.style.height = 'auto';
  vContainer.appendChild(video);

  // skrij modal
  m.style.display = 'none';
};



  closeBtn.addEventListener('click', window.closeModal);
}


/** Fancybox (play, zoom, fullscreen, thumbs toggle, close) **/
function initFancyboxGalleries() {
  if (typeof Fancybox === 'undefined') return;
  Fancybox.bind('[data-fancybox]', {
    Toolbar: {
       display: ['counter','zoom','slideshow','fullscreen','thumbs','close']
    },
    Thumbs: { autoStart: true }
  });
}




// === Zaporedno nalaganje galerije + video strani (stagger + podpora za <video>) ===
(function initSequentialGallery() {
   const isMobile = window.matchMedia && window.matchMedia('(hover: none)').matches;
  const REVEAL_DELAY = isMobile ? 220 : 140;  // telefon: 220ms, desktop: 140ms

  const wrappersAll = Array.from(document.querySelectorAll('.image-wrapper'));
  // Stran s fotografijami
  const imgWrappers = wrappersAll.filter(w => w.querySelector('img'));

  if (imgWrappers.length > 0) {
    // prestavi src -> data-src pri slikah (da se ne naložijo takoj)
    const allImgs = imgWrappers.flatMap(w => Array.from(w.querySelectorAll('img')));
    allImgs.forEach(img => {
      if (!img.dataset.src && img.getAttribute('src')) {
        img.dataset.src = img.getAttribute('src');
        img.removeAttribute('src');
        img.loading = 'lazy';
      }
    });

    // skrij
    imgWrappers.forEach(w => w.classList.add('pending'));

    const firstBatchCount = Math.min(8, imgWrappers.length);
    const secondBatchCount = Math.min(16, imgWrappers.length);

    sequentiallyLoadTiles(imgWrappers.slice(0, firstBatchCount)).then(async () => {
      insertDotsLoaderAfter(imgWrappers[firstBatchCount - 1]);

      await sequentiallyLoadTiles(imgWrappers.slice(firstBatchCount, secondBatchCount));
      removeDotsLoader();
    });

    // helperji (fotografije)
    function loadOneImage(img) {
      return new Promise(resolve => {
        const done = () => resolve();
        img.addEventListener('load', done, { once: true });
        img.addEventListener('error', done, { once: true });
        img.src = img.dataset.src;
      });
    }

    function sequentiallyLoadImages(imgs) {
      return imgs.reduce((p, img) => p.then(() => loadOneImage(img)), Promise.resolve());
    }

    async function sequentiallyLoadTiles(tiles) {
      const items = tiles.map(w => {
        const mainA = w.querySelector('a[data-fancybox]:first-child');
        const img = mainA ? mainA.querySelector('img') : w.querySelector('img');
        return { wrapper: w, img };
      }).filter(x => x.img);

      for (const x of items) {
        await loadOneImage(x.img);
        x.wrapper.classList.remove('pending');
        x.wrapper.classList.add('fade-in');
        await new Promise(r => setTimeout(r, REVEAL_DELAY)); // ← droben zamik med ploščicami
      }
    }

    // lazy za thumbs v odprti skupini
    document.querySelectorAll('.image-wrapper > a[data-fancybox]:first-child').forEach(a => {
      a.addEventListener('click', () => {
        const group = a.getAttribute('data-fancybox');
        if (!group) return;
        const groupAnchors = Array.from(document.querySelectorAll(`a[data-fancybox="${group}"]`));
        const thumbsToLoad = groupAnchors
          .map(x => x.querySelector('img'))
          .filter(img => img && img.dataset && img.dataset.src && !img.getAttribute('src'));
        sequentiallyLoadImages(thumbsToLoad);
      }, { once: true });
    });

    let dotsEl = null;
    function insertDotsLoaderAfter(wrapper) {
      if (!wrapper) return;
      dotsEl = document.createElement('div');
      dotsEl.className = 'dots-loader';
      dotsEl.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';
      const section = wrapper.closest('.section') || document.querySelector('.section');
      if (section) wrapper.insertAdjacentElement('afterend', dotsEl);
    }
    function removeDotsLoader() {
      if (dotsEl && dotsEl.parentNode) dotsEl.parentNode.removeChild(dotsEl);
      dotsEl = null;
    }

    return; // končaj vejo za foto stran
  }

  // ===== VIDEO STRAN (video.html) – če NI <img>, pa SO <video> =====
  const videoWrappers = wrappersAll.filter(w => w.querySelector('video'));
  if (videoWrappers.length === 0) return;

  // skrij vse video ploščice
  videoWrappers.forEach(w => w.classList.add('pending'));

  // prikaži jih z istim “stagger” efektom (ne silimo brskalnika, da naloži video – imamo preload="metadata")
  (async () => {
    for (const w of videoWrappers) {
      w.classList.remove('pending');
      w.classList.add('fade-in');
      await new Promise(r => setTimeout(r, REVEAL_DELAY));
    }
  })();
})();


window.openModalYouTube = function (videoId) {
  const m = document.getElementById('videoModal');
  const vContainer = document.getElementById('modalVideoContainer');

  // počisti staro vsebino
  vContainer.innerHTML = '';

  // vstavi YouTube iframe
  const iframe = document.createElement('iframe');
  iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`;
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.setAttribute('frameborder', '0');
  iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
  iframe.setAttribute('allowfullscreen', '');
  vContainer.appendChild(iframe);

  m.style.display = 'flex';
};
