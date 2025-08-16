 
document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  initLongPressOnImages();
  initVideoModal();
  initFancyboxGalleries();
  initCategoryFilter();   // ⬅️ dodaj to vrstico
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

// === Zaporedno nalaganje galerije na index.html (ne dotika se video strane!) ===
(function initSequentialGallery() {
  // Vsi wrapperji…
  const wrappersAll = Array.from(document.querySelectorAll('.image-wrapper'));
  // … ampak nas zanimajo le tisti, ki dejansko vsebujejo <img> (ne video!)
  const wrappers = wrappersAll.filter(w => w.querySelector('img'));
  if (wrappers.length === 0) return; // npr. video.html → nič ne delaj

  // Prestavi src -> data-src samo pri slikah v teh wrapperjih
  const allImgs = wrappers.flatMap(w => Array.from(w.querySelectorAll('img')));
  allImgs.forEach(img => {
    if (!img.dataset.src && img.getAttribute('src')) {
      img.dataset.src = img.getAttribute('src');
      img.removeAttribute('src');
      img.loading = 'lazy';
    }
  });

  // Skrij le “slikovne” wrapperje, video wrapperjev se ne dotikamo
  wrappers.forEach(w => w.classList.add('pending'));

  // 8 slik najprej, nato še 8 (dve vrstici); preostalo pusti nedotaknjeno
  const firstBatchCount = Math.min(8, wrappers.length);
  const secondBatchCount = Math.min(16, wrappers.length);

  sequentiallyLoadTiles(wrappers.slice(0, firstBatchCount)).then(() => {
    insertDotsLoaderAfter(wrappers[firstBatchCount - 1]);

    sequentiallyLoadTiles(wrappers.slice(firstBatchCount, secondBatchCount)).then(() => {
      removeDotsLoader();
      // ostalo lahko dodaš kasneje z “load more”, če želiš
    });
  });

  // Lazy nalaganje skritih slik v odprti Fancybox skupini
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

  // ---- helpers ----
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

  function sequentiallyLoadTiles(tiles) {
    const items = tiles.map(w => {
      const mainA = w.querySelector('a[data-fancybox]:first-child');
      const img = mainA ? mainA.querySelector('img') : w.querySelector('img');
      return { wrapper: w, img };
    }).filter(x => x.img);

    return items.reduce((p, x) => p.then(() =>
      loadOneImage(x.img).then(() => {
        x.wrapper.classList.remove('pending');
        x.wrapper.classList.add('fade-in');
      })
    ), Promise.resolve());
  }

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
})();

function initCategoryFilter() {
  const filterLinks = document.querySelectorAll('.category-submenu a[data-filter], .category-submenu .filter-btn');
  if (!filterLinks.length) return;

  const wrappers = Array.from(document.querySelectorAll('.image-wrapper'));
  const imageWrappers = wrappers.filter(w => w.querySelector('img')); // na index.html so to albumi s slikami

  let firstRun = true; // prvi "ALL" ne animiramo

  const applyFilter = (filter) => {
    // aktivni gumb
    filterLinks.forEach(link => {
      link.classList.toggle('active', link.getAttribute('data-filter') === filter);
    });

    // === 1) FLIP: izmeri "prvo" stanje (samo za trenutno vidne) ===
    const currentlyVisible = wrappers.filter(w => w.style.display !== 'none');
    const firstRects = new Map();
    currentlyVisible.forEach(w => {
      firstRects.set(w, w.getBoundingClientRect());
    });

    // === 2) Uveljavi filter (prikaži/skrij) ===
    wrappers.forEach(w => {
      const cat = w.getAttribute('data-category') || 'all';
      const show = (filter === 'all' || cat === filter);
      w.style.display = show ? 'inline-block' : 'none';
    });

    // === 3) Za novo vidne elemente naloži thumbs in odstrani .pending ===
    const nowVisible = imageWrappers.filter(w => w.style.display !== 'none');

    // naloži glavne sličice vidnih (če še niso) + odstrani pending (tvoj obstoječi flow)
    sequentiallyLoadVisibleWrappers(nowVisible).then(() => {
      // === 4) FLIP animacija: samo, če to ni prvi zagon ===
      if (!firstRun) {
        // nova pozicija vidnih
        nowVisible.forEach(w => {
          const lastRect = w.getBoundingClientRect();
          const firstRect = firstRects.get(w);
          if (!firstRect) {
            // nov element (prej skrit): naredimo kratek fade-in/scale
            w.classList.add('anim-enter');
            // force reflow, da se prenese razred
            // eslint-disable-next-line no-unused-expressions
            w.offsetWidth;
            w.classList.add('anim-enter-active');
            setTimeout(() => {
              w.classList.remove('anim-enter', 'anim-enter-active');
            }, 380);
            return;
          }
          const dx = firstRect.left - lastRect.left;
          const dy = firstRect.top  - lastRect.top;
          if (dx || dy) {
            w.style.transform = `translate(${dx}px, ${dy}px)`;
            // force reflow
            // eslint-disable-next-line no-unused-expressions
            w.offsetWidth;
            w.style.transform = '';
          }
        });
      } else {
        firstRun = false;
      }
    }).catch(() => { /* ignore */ });
  };

  // klik na gumbe
  filterLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      applyFilter(link.getAttribute('data-filter'));
    });
  });

  // začetno stanje: ALL (brez animacije)
  applyFilter('all');

  // ---- helper za nalaganje in odklep (isti kot prej) ----
  function loadOneImage(img) {
    return new Promise(resolve => {
      const done = () => resolve();
      img.addEventListener('load', done, { once: true });
      img.addEventListener('error', done, { once: true });
      if (!img.getAttribute('src') && img.dataset && img.dataset.src) {
        img.src = img.dataset.src;
      } else {
        setTimeout(done, 0);
      }
    });
  }

  function sequentiallyLoadVisibleWrappers(tiles) {
    const items = tiles.map(w => {
      const mainA = w.querySelector('a[data-fancybox]:first-child');
      const img = mainA ? mainA.querySelector('img') : w.querySelector('img');
      return { wrapper: w, img };
    }).filter(x => x.img);

    return items.reduce((p, x) => p.then(() =>
      loadOneImage(x.img).then(() => {
        x.wrapper.classList.remove('pending');
        x.wrapper.classList.add('fade-in');
      })
    ), Promise.resolve());
  }
}
