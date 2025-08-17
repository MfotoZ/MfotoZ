 
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

function initCategoryFilter() {
  const filterLinks = document.querySelectorAll('.category-submenu a[data-filter], .category-submenu .filter-btn');
  if (!filterLinks.length) return;

  const wrappers = Array.from(document.querySelectorAll('.image-wrapper'));
  const imageWrappers = wrappers.filter(w => w.querySelector('img')); // na index.html so to albumi s slikami

  let firstRun = true; // prvi "ALL" ne animiramo

const applyFilter = (filter) => {
  const REVEAL_DELAY = 140; // zamik med novimi ploščicami (kot na vstopu)

  // 0) aktivni gumb
  filterLinks.forEach(link => {
    link.classList.toggle('active', link.getAttribute('data-filter') === filter);
  });

  // 1) kdo sodi v izbran filter?
  const matches = (w) => {
    const cat = w.getAttribute('data-category') || 'all';
    return (filter === 'all' || cat === filter);
  };

  const allWrappers   = wrappers;                               // vsi
  const visibleBefore = allWrappers.filter(w => w.style.display !== 'none');
  const toHide        = visibleBefore.filter(w => !matches(w)); // vidni → morajo izginiti
  const stillVisible  = visibleBefore.filter(matches);          // vidni in ostanejo
  const hiddenBefore  = allWrappers.filter(w => w.style.display === 'none');
  const toShow        = hiddenBefore.filter(matches);           // skriti → morajo se pokazati

  // 2) najprej nežno zbledi tiste, ki odpadejo
  toHide.forEach(w => w.classList.add('hiding'));

  // 3) po koncu bledenja jih skrij in nato pokaži nove zaporedoma
  setTimeout(async () => {
    // dokončno skrij odpadle
    toHide.forEach(w => { 
      w.style.display = 'none'; 
      w.classList.remove('hiding');
    });

    // PRIPRAVA na prikaz novih:
    // - nastavi display, označi 'pending'
    // - če imajo IMG brez src (a z data-src), se bodo naložile sproti
    toShow.forEach(w => {
      w.style.display = 'inline-block';
      if (!w.classList.contains('pending')) w.classList.add('pending');
    });

    // zaporedno prikaži NOVE (kot ob vstopu)
    for (const w of toShow) {
      // najdi "glavno" sliko (če obstaja) in jo po potrebi naloži
      const mainA = w.querySelector('a[data-fancybox]:first-child');
      const img   = mainA ? mainA.querySelector('img') : w.querySelector('img');
      if (img && !img.getAttribute('src') && img.dataset && img.dataset.src) {
        await new Promise(res => {
          const done = () => res();
          img.addEventListener('load',  done, { once:true });
          img.addEventListener('error', done, { once:true });
          img.src = img.dataset.src;
        });
      }
      w.classList.remove('pending');
      w.classList.add('fade-in');
      await new Promise(r => setTimeout(r, REVEAL_DELAY)); // “stagger”
    }

// Dinamične širine: 2 -> half, drugače -> quarter (tudi 1 kos naj bo quarter)
const visibleNow = wrappers.filter(w => w.style.display !== 'none');
wrappers.forEach(w => w.classList.remove('full','half','quarter'));

if (visibleNow.length === 2) {
  visibleNow.forEach(w => w.classList.add('half'));
} else {
  visibleNow.forEach(w => w.classList.add('quarter')); // 1 ali 3+ kosov
}


    // 5) skrij dots-loader, razen pri 'all'
    document.querySelectorAll('.dots-loader')
      .forEach(el => el.style.display = (filter === 'all' ? '' : 'none'));

  }, 570); // malce > .55s iz CSS .hiding, da ujamemo konec bledenja
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
