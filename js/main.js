/* ==========================================================================
   МУРАЛЫ ХАБАРОВСК — логика сайта
   ========================================================================== */

(function () {
  "use strict";

  const MURALS = window.MURALS || [];
  const body = document.body;
  const page = body.dataset.page || "home";
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  /* ---------- Шапка и меню ---------- */

  const header = $(".site-header");
  const burger = $(".burger");
  const nav = $(".nav");

  function onScroll() {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 24);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const navMap = {
    home: "index.html",
    murals: "murals.html",
    history: "history.html",
    map: "map.html",
    routes: "routes.html",
    gallery: "gallery.html"
  };

  $$(".nav-link").forEach((link) => {
    const href = link.getAttribute("href");
    if (href === navMap[page]) {
      link.classList.add("is-active");
      link.setAttribute("aria-current", "page");
    }
  });

  function closeMenu() {
    body.classList.remove("nav-open");
    if (burger) {
      burger.setAttribute("aria-expanded", "false");
      burger.setAttribute("aria-label", "Открыть меню");
    }
  }

  if (burger && nav) {
    burger.addEventListener("click", () => {
      const open = body.classList.toggle("nav-open");
      burger.setAttribute("aria-expanded", String(open));
      burger.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
      body.classList.toggle("no-scroll", open);
    });

    $$(".nav-link, .nav-extra a").forEach((link) => {
      link.addEventListener("click", () => {
        closeMenu();
        body.classList.remove("no-scroll");
      });
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 1024) {
        closeMenu();
        body.classList.remove("no-scroll");
      }
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeMenu();
      body.classList.remove("no-scroll");
    }
  });

  /* ---------- Мягкое свечение в hero ---------- */

  const hero = $(".hero");
  const heroGlow = $(".hero-glow");
  if (hero && heroGlow && !reducedMotion && window.matchMedia("(pointer:fine)").matches) {
    hero.addEventListener("pointermove", (e) => {
      const rect = hero.getBoundingClientRect();
      heroGlow.style.setProperty("--mx", ((e.clientX - rect.left) / rect.width) * 100 + "%");
      heroGlow.style.setProperty("--my", ((e.clientY - rect.top) / rect.height) * 100 + "%");
    });
  }

  /* ---------- Появление блоков ---------- */

  let revealObserver = null;

  function initReveal() {
    if (!("IntersectionObserver" in window) || reducedMotion) {
      $$("[data-reveal]").forEach((el) => el.classList.add("is-visible"));
      return;
    }
    revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    );
    $$("[data-reveal]").forEach((el) => revealObserver.observe(el));
  }

  function observeNew(root) {
    if (!revealObserver) {
      $$("[data-reveal]", root).forEach((el) => el.classList.add("is-visible"));
      return;
    }
    $$("[data-reveal]", root).forEach((el) => revealObserver.observe(el));
  }

  initReveal();

  /* ---------- Счётчики ---------- */

  function animateCounter(el) {
    const target = parseInt(el.dataset.count, 10);
    if (Number.isNaN(target)) return;
    if (reducedMotion) {
      el.textContent = String(target);
      return;
    }
    const duration = 1300;
    const start = performance.now();
    const from = 0;

    function frame(now) {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = String(Math.round(from + (target - from) * eased));
      if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  const counters = $$("[data-count]");
  if (counters.length) {
    if (!("IntersectionObserver" in window)) {
      counters.forEach(animateCounter);
    } else {
      const counterObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              animateCounter(entry.target);
              counterObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.6 }
      );
      counters.forEach((el) => counterObserver.observe(el));
    }
  }

  /* ---------- Карточка мурала ---------- */

  function cardTemplate(mural, modifier) {
    return `
      <a class="mural-card ${modifier || ""}" href="murals.html#${mural.id}" data-mural="${mural.id}" data-reveal>
        <div class="mural-media">
          <img src="${mural.art}" alt="Мурал «${mural.title}» — ${mural.artist}, ${mural.year}" loading="lazy">
          <span class="mural-tag">${mural.district}</span>
          <span class="mural-year">${mural.year}</span>
        </div>
        <div class="mural-body">
          <h3 class="mural-title">${mural.title}</h3>
          <div class="mural-meta">
            <span>${mural.artist}</span>
            <span class="sep"></span>
            <span>${mural.category}</span>
          </div>
          <div class="mural-foot">
            <span>История</span>
            <span class="arrow-circle" aria-hidden="true">↗</span>
          </div>
        </div>
      </a>`;
  }

  /* ---------- Подборка на главной ---------- */

  const featuredWrap = $("[data-featured]");
  if (featuredWrap) {
    const ids = (featuredWrap.dataset.featured || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const featured = ids.length
      ? ids.map((id) => MURALS.find((m) => m.id === id)).filter(Boolean)
      : MURALS.filter((m) => m.featured).slice(0, 3);
    featuredWrap.innerHTML = featured.map((m, i) => cardTemplate(m)).join("");
    observeNew(featuredWrap);
  }

  /* ---------- Каталог ---------- */

  const catalogGrid = $("[data-catalog]");
  if (catalogGrid) {
    const filtersWrap = $("[data-filters]");
    const searchInput = $("#mural-search");
    const countEl = $("[data-results]");
    const emptyEl = $("[data-empty]");
    const districts = [];
    MURALS.forEach((m) => {
      if (!districts.includes(m.district)) districts.push(m.district);
    });

    let activeFilter = "Все";
    let query = "";

    if (filtersWrap) {
      const chips = ["Все"].concat(districts);
      filtersWrap.innerHTML = chips
        .map(
          (name) =>
            `<button class="chip${name === "Все" ? " is-active" : ""}" type="button" data-filter="${name}" aria-pressed="${name === "Все"}">${name}</button>`
        )
        .join("");

      filtersWrap.addEventListener("click", (e) => {
        const chip = e.target.closest("[data-filter]");
        if (!chip) return;
        activeFilter = chip.dataset.filter;
        $$(".chip", filtersWrap).forEach((c) => {
          const on = c === chip;
          c.classList.toggle("is-active", on);
          c.setAttribute("aria-pressed", String(on));
        });
        renderCatalog();
      });
    }

    if (searchInput) {
      let timer = null;
      searchInput.addEventListener("input", () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          query = searchInput.value.trim().toLowerCase();
          renderCatalog();
        }, 140);
      });
    }

    function renderCatalog() {
      const list = MURALS.filter((m) => {
        const byDistrict = activeFilter === "Все" || m.district === activeFilter;
        const haystack = [m.title, m.artist, m.district, m.year, m.category, m.address]
          .join(" ")
          .toLowerCase();
        return byDistrict && (!query || haystack.includes(query));
      });

      catalogGrid.innerHTML = list.map((m) => cardTemplate(m)).join("");
      observeNew(catalogGrid);

      if (countEl) {
        countEl.innerHTML = `Найдено: <b>${list.length}</b> ${plural(list.length, "мурал", "мурала", "муралов")}`;
      }
      if (emptyEl) emptyEl.hidden = list.length !== 0;
    }

    renderCatalog();
  }

  function plural(n, one, few, many) {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return one;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
    return many;
  }

  /* ---------- Модальное окно истории ---------- */

  const modal = $("#mural-modal");
  let currentMural = null;
  let lastFocus = null;

  function fillModal(mural) {
    if (!modal || !mural) return;
    currentMural = mural;
    const panel = $(".modal-panel", modal);
    if (panel) panel.scrollTop = 0;
    const img = $("#modal-img");
    const kicker = $("#modal-kicker");
    const title = $("#modal-title");
    const artist = $("#modal-artist");
    const story = $("#modal-story");
    const facts = $("#modal-facts");

    if (img) {
      img.src = mural.art;
      img.alt = `Мурал «${mural.title}» — ${mural.artist}, ${mural.year}`;
    }
    if (kicker) {
      kicker.innerHTML = `<span>Мурал</span><span class="sep"></span><span>${mural.year}</span><span class="sep"></span><span>${mural.district}</span>`;
    }
    if (title) title.textContent = mural.title;
    if (artist) artist.textContent = "Художник: " + mural.artist;
    if (story) story.innerHTML = mural.story.map((p) => `<p>${p}</p>`).join("");
    if (facts) {
      facts.innerHTML = `
        <div class="fact"><div class="fact-label">Год</div><div class="fact-value">${mural.year}</div></div>
        <div class="fact"><div class="fact-label">Размер</div><div class="fact-value">${mural.size}</div></div>
        <div class="fact"><div class="fact-label">Техника</div><div class="fact-value">${mural.technique}</div></div>
        <div class="fact"><div class="fact-label">Адрес</div><div class="fact-value">${mural.address}</div></div>`;
    }

    const index = MURALS.findIndex((m) => m.id === mural.id);
    const prev = MURALS[(index - 1 + MURALS.length) % MURALS.length];
    const next = MURALS[(index + 1) % MURALS.length];
    const prevBtn = $("#modal-prev");
    const nextBtn = $("#modal-next");
    if (prevBtn) {
      prevBtn.dataset.mural = prev.id;
      prevBtn.setAttribute("aria-label", "Предыдущий мурал: " + prev.title);
    }
    if (nextBtn) {
      nextBtn.dataset.mural = next.id;
      nextBtn.setAttribute("aria-label", "Следующий мурал: " + next.title);
    }
    const mapLink = $("#modal-map-link");
    if (mapLink) mapLink.href = "map.html#" + mural.id;
  }

  function openModal(id) {
    const mural = MURALS.find((m) => m.id === id);
    if (!modal || !mural) return;
    lastFocus = document.activeElement;
    fillModal(mural);
    modal.hidden = false;
    body.classList.add("no-scroll");
    const closeBtn = $(".modal-close", modal);
    if (closeBtn) closeBtn.focus();
    if (history.replaceState) {
      try { history.replaceState(null, "", "#" + mural.id); } catch (err) { /* file:// в некоторых браузерах */ }
    }
  }

  function closeModal() {
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    body.classList.remove("no-scroll");
    if (currentMural && window.location.hash === "#" + currentMural.id) {
      try {
        history.replaceState(null, "", window.location.pathname + window.location.search);
      } catch (err) { /* file:// в некоторых браузерах */ }
    }
    if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
  }

  if (modal) {
    document.addEventListener("click", (e) => {
      const trigger = e.target.closest("[data-mural]");
      if (trigger) {
        e.preventDefault();
        openModal(trigger.dataset.mural);
        return;
      }
      const close = e.target.closest("[data-modal-close]");
      if (close) closeModal();
    });

    const backdrop = $(".modal-backdrop", modal);
    if (backdrop) backdrop.addEventListener("click", closeModal);

    modal.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeModal();
      if (e.key !== "Tab") return;
      const focusables = $$(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        modal
      ).filter((el) => el.offsetParent !== null);
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !modal.hidden) closeModal();
    });

    const initialHash = window.location.hash.slice(1);
    if (page === "murals" && initialHash && MURALS.some((m) => m.id === initialHash)) {
      setTimeout(() => openModal(initialHash), 120);
    }
  }

  /* ---------- Карта ---------- */

  const mapPoints = $("#map-points");
  if (mapPoints) {
    const mapList = $("#map-list");
    const mapImg = $("#map-img");
    const mapBadge = $("#map-badge");
    const mapKicker = $("#map-kicker");
    const mapTitle = $("#map-title");
    const mapArtist = $("#map-artist");
    const mapShort = $("#map-short");
    const mapAddress = $("#map-address");
    const mapFacts = $("#map-facts");
    const mapModalBtn = $("#map-modal-btn");

    const pointHTML = MURALS.map(
      (m, i) => `
      <button class="map-point" type="button" data-target="${m.id}"
        style="left:${m.coords.x}%;top:${m.coords.y}%"
        aria-label="${m.title}, ${m.district}">${String(i + 1).padStart(2, "0")}</button>`
    ).join("");

    mapPoints.innerHTML = pointHTML;

    if (mapList) {
      mapList.innerHTML = MURALS.map((m, i) => {
        const num = String(i + 1).padStart(2, "0");
        return `
          <button class="map-list-item" type="button" data-target="${m.id}">
            <span class="map-list-num">${num}</span>
            <span>
              <span class="map-list-title">${m.title}</span>
              <span class="map-list-sub">${m.district} · ${m.year}</span>
            </span>
          </button>`;
      }).join("");
    }

    function selectPoint(id) {
      const mural = MURALS.find((m) => m.id === id);
      if (!mural) return;
      $$(".map-point, .map-list-item").forEach((el) => {
        const on = el.dataset.target === id;
        el.classList.toggle("is-active", on);
        if (el.classList.contains("map-list-item")) {
          el.setAttribute("aria-pressed", String(on));
        }
      });
      if (mapImg) {
        mapImg.src = mural.art;
        mapImg.alt = `Мурал «${mural.title}»`;
      }
      if (mapBadge) mapBadge.textContent = "Точка " + String(MURALS.indexOf(mural) + 1).padStart(2, "0");
      if (mapKicker) mapKicker.textContent = `${mural.year} · ${mural.district}`;
      if (mapTitle) mapTitle.textContent = mural.title;
      if (mapArtist) mapArtist.textContent = mural.artist;
      if (mapShort) mapShort.textContent = mural.short;
      if (mapAddress) mapAddress.textContent = mural.address;
      if (mapFacts) {
        mapFacts.innerHTML = `<span>${mural.size}</span><span class="sep"></span><span>${mural.technique}</span>`;
      }
      if (mapModalBtn) mapModalBtn.dataset.mural = mural.id;
    }

    document.addEventListener("click", (e) => {
      const point = e.target.closest("[data-target]");
      if (point && (point.classList.contains("map-point") || point.classList.contains("map-list-item"))) {
        selectPoint(point.dataset.target);
      }
    });

    const hash = window.location.hash.slice(1);
    selectPoint(hash && MURALS.some((m) => m.id === hash) ? hash : MURALS[0].id);
  }

  /* ---------- Маршруты ---------- */

  const routeTabs = $$(".route-tab");
  if (routeTabs.length) {
    routeTabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const target = tab.dataset.routeTarget;
        routeTabs.forEach((t) => {
          const on = t === tab;
          t.classList.toggle("is-active", on);
          t.setAttribute("aria-selected", String(on));
          t.setAttribute("tabindex", on ? "0" : "-1");
        });
        $$(".route-panel").forEach((panel) => {
          panel.hidden = panel.id !== target;
        });
      });
    });
  }

  /* ---------- Галерея и лайтбокс ---------- */

  const galleryGrid = $("[data-gallery]");
  if (galleryGrid) {
    const galleryFilters = $("[data-gallery-filters]");
    const categories = [];
    MURALS.forEach((m) => {
      if (!categories.includes(m.category)) categories.push(m.category);
    });

    let galleryFilter = "Все";
    let visible = MURALS.slice();
    let lightboxIndex = 0;

    if (galleryFilters) {
      galleryFilters.innerHTML = ["Все"]
        .concat(categories)
        .map(
          (name) =>
            `<button class="chip${name === "Все" ? " is-active" : ""}" type="button" data-gfilter="${name}" aria-pressed="${name === "Все"}">${name}</button>`
        )
        .join("");

      galleryFilters.addEventListener("click", (e) => {
        const chip = e.target.closest("[data-gfilter]");
        if (!chip) return;
        galleryFilter = chip.dataset.gfilter;
        $$(".chip", galleryFilters).forEach((c) => {
          const on = c === chip;
          c.classList.toggle("is-active", on);
          c.setAttribute("aria-pressed", String(on));
        });
        renderGallery();
      });
    }

    function renderGallery() {
      visible =
        galleryFilter === "Все"
          ? MURALS.slice()
          : MURALS.filter((m) => m.category === galleryFilter);

      galleryGrid.innerHTML = visible
        .map(
          (m, i) => `
        <button class="g-item" type="button" data-index="${i}" data-reveal aria-label="Открыть фото мурала «${m.title}»">
          <img src="${m.art}" alt="Мурал «${m.title}» — ${m.artist}, ${m.year}" loading="lazy">
          <span class="g-zoom" aria-hidden="true">↗</span>
          <span class="g-caption">
            <span class="g-title">${m.title}</span>
            <span class="g-sub">${m.artist} · ${m.year}</span>
          </span>
        </button>`
        )
        .join("");
      observeNew(galleryGrid);
    }

    renderGallery();

    const lightbox = $("#lightbox");
    const lbImg = $("#lb-img");
    const lbTitle = $("#lb-title");
    const lbSub = $("#lb-sub");
    const lbCounter = $("#lb-counter");

    function showLightbox(index) {
      if (!lightbox || !visible.length) return;
      lightboxIndex = (index + visible.length) % visible.length;
      const m = visible[lightboxIndex];
      if (lbImg) {
        lbImg.src = m.art;
        lbImg.alt = `Мурал «${m.title}»`;
      }
      if (lbTitle) lbTitle.textContent = m.title;
      if (lbSub) lbSub.textContent = `${m.artist} · ${m.year} · ${m.district}`;
      if (lbCounter) lbCounter.textContent = `${lightboxIndex + 1} / ${visible.length}`;
      if (lightbox.hidden) {
        lightbox.hidden = false;
        body.classList.add("no-scroll");
        const closeBtn = $(".lb-close", lightbox);
        if (closeBtn) closeBtn.focus();
      }
    }

    function closeLightbox() {
      if (!lightbox || lightbox.hidden) return;
      lightbox.hidden = true;
      body.classList.remove("no-scroll");
    }

    galleryGrid.addEventListener("click", (e) => {
      const item = e.target.closest("[data-index]");
      if (!item) return;
      showLightbox(parseInt(item.dataset.index, 10));
    });

    if (lightbox) {
      $(".lb-close", lightbox).addEventListener("click", closeLightbox);
      $(".lb-prev", lightbox).addEventListener("click", () => showLightbox(lightboxIndex - 1));
      $(".lb-next", lightbox).addEventListener("click", () => showLightbox(lightboxIndex + 1));
      lightbox.addEventListener("click", (e) => {
        if (e.target === lightbox) closeLightbox();
      });
      document.addEventListener("keydown", (e) => {
        if (lightbox.hidden) return;
        if (e.key === "Escape") closeLightbox();
        if (e.key === "ArrowLeft") showLightbox(lightboxIndex - 1);
        if (e.key === "ArrowRight") showLightbox(lightboxIndex + 1);
      });
    }
  }

  /* ---------- FAQ ---------- */

  $$(".faq-item").forEach((item) => {
    const btn = $(".faq-q", item);
    const answer = $(".faq-a", item);
    if (!btn || !answer) return;

    btn.addEventListener("click", () => {
      const isOpen = item.classList.contains("is-open");
      $$(".faq-item").forEach((other) => {
        other.classList.remove("is-open");
        const otherBtn = $(".faq-q", other);
        const otherAnswer = $(".faq-a", other);
        if (otherBtn) otherBtn.setAttribute("aria-expanded", "false");
        if (otherAnswer) otherAnswer.style.maxHeight = "0px";
      });
      if (!isOpen) {
        item.classList.add("is-open");
        btn.setAttribute("aria-expanded", "true");
        answer.style.maxHeight = answer.scrollHeight + 40 + "px";
      }
    });
  });

  /* ---------- Год в подвале ---------- */

  $$("[data-year]").forEach((el) => {
    el.textContent = String(new Date().getFullYear());
  });
})();
