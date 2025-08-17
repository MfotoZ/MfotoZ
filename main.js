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
  v.play().catch(() => {});
  m.style.display = 'flex'; // ali m.classList.add('open') če uporabljaš razred
};

window.closeModal = function () {
  const m = document.getElementById('videoModal');
  const v = document.getElementById('modalVideo');
  v.pause();
  v.removeAttribute('src'); // počisti, da ne kuri prometa
  v.load();
  m.style.display = 'none'; // ali m.classList.remove('open')
};


  closeBtn.addEventListener('click', window.closeModal);
}


/** Fancybox (play, zoom, fullscreen, thumbs toggle, close) **/
function initFancyboxGalleries() {
  if (typeof Fancybox === 'undefined') return;
  Fancybox.bind('[data-fancybox]', {
    Toolbar: {
      display: ['zoom','slideshow','fullscreen','thumbs','close']
    },
    Thumbs: { autoStart: true }
  });
}


function initCategoryFilter() {
  const links = Array.from(document.querySelectorAll('.category-submenu a[data-filter]'));
  if (!links.length) return;

  const wrappers = Array.from(document.querySelectorAll('.image-wrapper'));
  const galleryEl = document.querySelector('.gallery'); // zaznamo grid
  let runId = 0; // prekine prejšnje klike/animacije

  const loadOneImage = (img) => new Promise(res => {
    const done = () => res();
    img.addEventListener('load', done, { once: true });
    img.addEventListener('error', done, { once: true });
    if (!img.getAttribute('src') && img.dataset && img.dataset.src) {
      img.src = img.dataset.src;
    } else {
      setTimeout(done, 0);
    }
  });

  const apply = async (filter) => {
    const myRun = ++runId;
    const isMobile = window.matchMedia && window.matchMedia('(hover: none)').matches;
    const REVEAL_DELAY = isMobile ? 220 : 140;
    const useGrid = galleryEl && getComputedStyle(galleryEl).display === 'grid';

    // aktivni gumb
    links.forEach(a => a.classList.toggle('active', a.dataset.filter === filter));

    // kdo sodi v filter
    const matches = (w) => {
      const cat = (w.getAttribute('data-category') || 'all').toLowerCase();
      return filter === 'all' || cat === filter;
    };
    const toShow = wrappers.filter(matches);
    const visible = wrappers.filter(w => w.style.display !== 'none');

    // 1) fade-out VSEH trenutno vidnih
    visible.forEach(w => w.classList.add('hiding'));
    await new Promise(r => setTimeout(r, 560)); // malo > CSS .hiding
    if (myRun !== runId) return;

    // 2) skrij vse + pripravi na enoten fade-in
    wrappers.forEach(w => {
      w.style.display = 'none';
      w.classList.remove('hiding', 'fade-in', 'full', 'half', 'quarter');
      if (!w.classList.contains('pending')) w.classList.add('pending');
    });

    // 3) samo če NISI v grid načinu, upravljaj širine (half/quarter)
    if (!useGrid) {
      if (toShow.length === 2) {
        toShow.forEach(w => w.classList.add('half'));
      } else {
        toShow.forEach(w => w.classList.add('quarter'));
      }
    }

    // 4) zaporedno prikaži ciljne (in po potrebi naloži thumbnail)
    for (const w of toShow) {
      if (myRun !== runId) return;

      // v gridu kažeš kot block; drugače inline-block
      w.style.display = useGrid ? 'block' : 'inline-block';

      const mainA = w.querySelector('a[data-fancybox]:first-child');
      const img   = mainA ? mainA.querySelector('img') : w.querySelector('img');
      if (img) await loadOneImage(img);

      w.classList.remove('pending');
      w.classList.add('fade-in');
      await new Promise(r => setTimeout(r, REVEAL_DELAY));
    }

    // dots-loader vidne samo pri “all”
    document.querySelectorAll('.dots-loader')
      .forEach(el => el.style.display = (filter === 'all' ? '' : 'none'));
  };

  // klik handlerji
  links.forEach(a => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      apply((a.dataset.filter || 'all').toLowerCase());
    });
  });

  // začetno stanje
  apply('all');
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
