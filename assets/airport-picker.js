/* Emirates-style IATA / city airport autocomplete — no external libs */
(function (global) {
  const MAX = 8;
  const MOBILE_MQ = "(max-width: 760px)";

  function norm(s) {
    return String(s || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  }

  function scoreAirport(a, q) {
    if (!q) return 0;
    const code = a.code.toLowerCase();
    const city = norm(a.city);
    const name = norm(a.name);
    const country = norm(a.country);
    const kw = norm(a.keywords || "");
    const nq = norm(q);
    if (code === nq) return 1000;
    if (code.startsWith(nq)) return 900 - nq.length;
    if (city === nq) return 800;
    if (city.startsWith(nq)) return 700 - city.indexOf(nq);
    if (kw.split(/\s+/).some((w) => w === nq || w.startsWith(nq))) return 650;
    if (name.startsWith(nq)) return 500;
    if (city.includes(nq)) return 400;
    if (name.includes(nq)) return 300;
    if (country.startsWith(nq) || country.includes(nq)) return 200;
    if (kw.includes(nq)) return 150;
    return 0;
  }

  const POPULAR = ["MAA","BOM","DEL","BLR","HYD","CCU","COK","DXB","AUH","DOH","SIN","KUL","BKK","LHR","JFK","CDG","FRA","IST","HKG","NRT","ICN","SYD","YYZ","CMB","MLE","KTM","DAC"];
  const POP_RANK = Object.fromEntries(POPULAR.map((c, i) => [c, POPULAR.length - i]));

  function searchAirports(q, limit) {
    const list = global.SARVADHARA_AIRPORTS || [];
    const nq = String(q || "").trim();
    if (!nq) {
      const map = new Map(list.map((a) => [a.code, a]));
      return POPULAR.map((c) => map.get(c)).filter(Boolean).slice(0, limit || MAX);
    }
    const scored = [];
    for (const a of list) {
      const s = scoreAirport(a, nq);
      if (s > 0) scored.push({ a, s: s + (POP_RANK[a.code] || 0) * 0.01 });
    }
    scored.sort((x, y) => y.s - x.s || x.a.city.localeCompare(y.a.city) || x.a.code.localeCompare(y.a.code));
    return scored.slice(0, limit || MAX).map((x) => x.a);
  }

  function formatSubmit(a) {
    if (!a) return "";
    return `${a.code} ${a.city}`;
  }

  function ensureSheet() {
    let sheet = document.getElementById("apSheet");
    if (sheet) return sheet;
    sheet = document.createElement("div");
    sheet.id = "apSheet";
    sheet.className = "ap-sheet";
    sheet.hidden = true;
    sheet.innerHTML = `
      <div class="ap-sheet-backdrop" data-ap-close></div>
      <div class="ap-sheet-panel" role="dialog" aria-modal="true" aria-label="Select airport">
        <div class="ap-sheet-head">
          <button type="button" class="ap-sheet-close" data-ap-close aria-label="Close">✕</button>
          <div class="ap-sheet-title" id="apSheetTitle">Select airport</div>
        </div>
        <div class="ap-sheet-search">
          <input type="search" id="apSheetInput" class="ap-sheet-input" placeholder="City or airport code" autocomplete="off" enterkeyhint="search" />
        </div>
        <div class="ap-sheet-list" id="apSheetList" role="listbox"></div>
      </div>`;
    document.body.appendChild(sheet);
    return sheet;
  }

  function ensureDesktopMenu() {
    let menu = document.getElementById("apMenu");
    if (menu) return menu;
    menu = document.createElement("div");
    menu.id = "apMenu";
    menu.className = "ap-menu";
    menu.hidden = true;
    menu.setAttribute("role", "listbox");
    document.body.appendChild(menu);
    return menu;
  }

  function renderOptions(container, results, activeIdx, onPick) {
    if (!results.length) {
      container.innerHTML = `<div class="ap-empty">No airports match — try a city or IATA code</div>`;
      return;
    }
    container.innerHTML = results
      .map((a, i) => {
        const active = i === activeIdx ? " is-active" : "";
        return `<button type="button" class="ap-option${active}" role="option" data-idx="${i}" aria-selected="${i === activeIdx}">
          <span class="ap-option-main">
            <span class="ap-option-city">${escapeHtml(a.city)}</span>
            <span class="ap-option-name">${escapeHtml(a.name)}, ${escapeHtml(a.country)}</span>
          </span>
          <span class="ap-option-code">${escapeHtml(a.code)}</span>
        </button>`;
      })
      .join("");
    container.querySelectorAll(".ap-option").forEach((btn) => {
      btn.addEventListener("mousedown", (e) => {
        e.preventDefault();
        const idx = Number(btn.dataset.idx);
        onPick(results[idx]);
      });
    });
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function isMobile() {
    return window.matchMedia(MOBILE_MQ).matches;
  }

  function createPicker(fieldEl, opts) {
    const hidden = fieldEl.querySelector('input[type="hidden"]');
    const input = fieldEl.querySelector(".ap-input");
    const display = fieldEl.querySelector(".ap-display");
    const codeEl = fieldEl.querySelector(".ap-code");
    const cityEl = fieldEl.querySelector(".ap-city");
    const label = (fieldEl.querySelector("label") || {}).textContent || opts.label || "Airport";
    let selected = null;
    let results = [];
    let activeIdx = 0;
    let open = false;
    let sheetBound = false;

    const menu = ensureDesktopMenu();
    const sheet = ensureSheet();
    const sheetInput = document.getElementById("apSheetInput");
    const sheetList = document.getElementById("apSheetList");
    const sheetTitle = document.getElementById("apSheetTitle");

    function setSelected(a, silent) {
      selected = a || null;
      if (hidden) hidden.value = a ? formatSubmit(a) : "";
      if (a) {
        if (codeEl) codeEl.textContent = a.code;
        if (cityEl) cityEl.textContent = a.city;
        if (display) display.hidden = false;
        if (input) {
          input.value = "";
          input.classList.add("ap-input--hidden");
          input.setAttribute("aria-hidden", "true");
        }
        fieldEl.classList.add("has-value");
        fieldEl.classList.remove("invalid");
      } else {
        if (display) display.hidden = true;
        if (input) {
          input.classList.remove("ap-input--hidden");
          input.removeAttribute("aria-hidden");
        }
        fieldEl.classList.remove("has-value");
      }
      if (!silent && typeof opts.onChange === "function") opts.onChange(selected);
    }

    function positionMenu() {
      const rect = fieldEl.getBoundingClientRect();
      const width = Math.max(rect.width, 320);
      let left = rect.left;
      if (left + width > window.innerWidth - 12) left = window.innerWidth - width - 12;
      if (left < 12) left = 12;
      const below = rect.bottom + 6;
      const spaceBelow = window.innerHeight - below;
      menu.style.width = `${width}px`;
      menu.style.left = `${left}px`;
      if (spaceBelow < 220 && rect.top > 240) {
        menu.style.top = "auto";
        menu.style.bottom = `${window.innerHeight - rect.top + 6}px`;
        menu.style.maxHeight = `${Math.min(320, rect.top - 16)}px`;
      } else {
        menu.style.bottom = "auto";
        menu.style.top = `${below}px`;
        menu.style.maxHeight = `${Math.min(320, spaceBelow - 12)}px`;
      }
    }

    function closeDesktop() {
      open = false;
      menu.hidden = true;
      menu.innerHTML = "";
      fieldEl.classList.remove("ap-open");
      if (global._apActive === api) global._apActive = null;
    }

    function closeSheet() {
      open = false;
      sheet.hidden = true;
      document.body.classList.remove("ap-sheet-open");
      fieldEl.classList.remove("ap-open");
      if (global._apActive === api) global._apActive = null;
    }

    function close() {
      if (isMobile()) closeSheet();
      else closeDesktop();
    }

    function pick(a) {
      setSelected(a);
      close();
      // focus next sibling picker if any
      if (opts.focusNext) {
        const next = document.querySelector(opts.focusNext);
        if (next) {
          const n = next.__apPicker;
          if (n) n.focus();
        }
      }
    }

    function refresh(q) {
      results = searchAirports(q, MAX);
      activeIdx = 0;
      if (isMobile()) {
        renderOptions(sheetList, results, activeIdx, pick);
      } else {
        renderOptions(menu, results, activeIdx, pick);
        const optsEl = menu.querySelectorAll(".ap-option");
        if (optsEl[activeIdx]) optsEl[activeIdx].scrollIntoView({ block: "nearest" });
      }
    }

    function openDesktop(q) {
      if (global._apActive && global._apActive !== api) global._apActive.close();
      global._apActive = api;
      open = true;
      fieldEl.classList.add("ap-open");
      menu.hidden = false;
      positionMenu();
      refresh(q);
    }

    function openMobile() {
      if (global._apActive && global._apActive !== api) global._apActive.close();
      global._apActive = api;
      open = true;
      fieldEl.classList.add("ap-open");
      sheet.hidden = false;
      document.body.classList.add("ap-sheet-open");
      if (sheetTitle) sheetTitle.textContent = label.trim() || "Select airport";
      sheetInput.value = selected ? selected.city : "";
      refresh(sheetInput.value);
      setTimeout(() => sheetInput.focus(), 50);
      if (!sheetBound) {
        sheetBound = true;
        sheet.addEventListener("click", (e) => {
          if (e.target.closest("[data-ap-close]")) {
            if (global._apActive) global._apActive.close();
          }
        });
        sheetInput.addEventListener("input", () => {
          if (global._apActive) global._apActive.refresh(sheetInput.value);
        });
        sheetInput.addEventListener("keydown", (e) => {
          if (!global._apActive) return;
          global._apActive.onKey(e);
        });
      }
    }

    function openPicker(q) {
      if (isMobile()) openMobile();
      else openDesktop(q == null ? input.value : q);
    }

    function onKey(e) {
      if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
        openPicker(input.value);
        e.preventDefault();
        return;
      }
      if (!open) return;
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        activeIdx = Math.min(results.length - 1, activeIdx + 1);
        if (isMobile()) renderOptions(sheetList, results, activeIdx, pick);
        else {
          renderOptions(menu, results, activeIdx, pick);
          const el = menu.querySelector(".ap-option.is-active");
          if (el) el.scrollIntoView({ block: "nearest" });
        }
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        activeIdx = Math.max(0, activeIdx - 1);
        if (isMobile()) renderOptions(sheetList, results, activeIdx, pick);
        else {
          renderOptions(menu, results, activeIdx, pick);
          const el = menu.querySelector(".ap-option.is-active");
          if (el) el.scrollIntoView({ block: "nearest" });
        }
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (results[activeIdx]) pick(results[activeIdx]);
      }
    }

    // Click display → edit (clear so user can type a new city/code)
    if (display) {
      display.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        setSelected(null, true);
        if (input) {
          input.value = "";
          input.placeholder = "City or airport";
        }
        openPicker("");
        if (!isMobile() && input) {
          input.focus();
          input.select();
        }
      });
    }

    fieldEl.addEventListener("click", (e) => {
      if (e.target.closest(".ap-display")) return;
      if (selected && !e.target.closest(".ap-input")) {
        setSelected(null, true);
        if (input) input.value = "";
        openPicker("");
        if (!isMobile() && input) {
          input.focus();
          input.select();
        }
        return;
      }
      if (!open) openPicker(input ? input.value : "");
    });

    if (input) {
      input.addEventListener("focus", () => {
        if (!isMobile()) openDesktop(input.value);
        else openMobile();
      });
      input.addEventListener("input", () => {
        fieldEl.classList.remove("invalid");
        if (isMobile()) return;
        if (!open) openDesktop(input.value);
        else refresh(input.value);
      });
      input.addEventListener("keydown", onKey);
    }

    const api = {
      getSelected: () => selected,
      setSelected,
      clear: () => setSelected(null),
      close,
      open: openPicker,
      refresh,
      onKey,
      focus: () => {
        if (selected) {
          const prev = selected;
          setSelected(null, true);
          if (input) input.value = prev.code;
        }
        if (isMobile()) openMobile();
        else if (input) {
          input.focus();
          openDesktop(input.value);
        }
      },
      getSubmitValue: () => (hidden ? hidden.value : ""),
      field: fieldEl,
    };
    fieldEl.__apPicker = api;
    return api;
  }

  // Global dismiss
  document.addEventListener("click", (e) => {
    if (!global._apActive) return;
    if (e.target.closest(".ap-field") || e.target.closest(".ap-menu") || e.target.closest(".ap-sheet-panel")) return;
    global._apActive.close();
  });
  const closeActive = () => {
    if (global._apActive) global._apActive.close();
  };
  document.querySelectorAll(".snap-root").forEach((root) => {
    root.addEventListener("scroll", closeActive, { passive: true });
  });
  window.addEventListener("scroll", closeActive, { passive: true });

  window.addEventListener("resize", () => {
    if (global._apActive && !isMobile()) {
      const menu = document.getElementById("apMenu");
      if (menu && !menu.hidden) {
        // reposition via re-open geometry on active field
        const f = global._apActive.field;
        if (f) {
          const rect = f.getBoundingClientRect();
          const width = Math.max(rect.width, 320);
          menu.style.width = `${width}px`;
          menu.style.left = `${Math.max(12, Math.min(rect.left, window.innerWidth - width - 12))}px`;
          menu.style.top = `${rect.bottom + 6}px`;
        }
      }
    }
  });

  global.SarvadharaAirportPicker = {
    create: createPicker,
    search: searchAirports,
    formatSubmit,
  };
})(window);
