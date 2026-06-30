/* =====================================================================
   RAINS — Admin product manager
   Form bharein -> product add ho -> "Download products.js" -> file replace.
   Sab kuch browser mein chalta hai, koi server nahi chahiye.
   ===================================================================== */
(function () {
  "use strict";

  var STORE_KEY = "rains_admin_products";
  var list = loadList();
  var editingId = null;
  var currentImage = ""; // base64 of selected/compressed product photo
  var currentLogo = "";  // base64 of selected/compressed logo image

  /* same gradients/icons as the storefront */
  var GRADIENTS = [
    "linear-gradient(135deg,#ffd3ec,#e7c9ff)",
    "linear-gradient(135deg,#ffe0f0,#d9c4ff)",
    "linear-gradient(135deg,#fcd5ff,#c8d4ff)",
    "linear-gradient(135deg,#ffd9e8,#e9d4ff)",
    "linear-gradient(135deg,#f7d4ff,#ffd6e7)"
  ];

  /* ---------------------------- helpers --------------------------- */
  function $(s, r) { return (r || document).querySelector(s); }
  function money(n) { return CONFIG.currency + " " + Number(n).toLocaleString("en-PK"); }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function gradFor(id) {
    var h = 0; for (var i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
    return GRADIENTS[h % GRADIENTS.length];
  }
  function emojiForCat(id) {
    var c = CATEGORIES.filter(function (x) { return x.id === id; })[0];
    return c ? c.emoji : "🎀";
  }
  function catTitle(id) {
    var c = CATEGORIES.filter(function (x) { return x.id === id; })[0];
    return c ? c.title : id;
  }
  function mediaHtml(p) {
    if (p.image) return '<img src="' + p.image + '" alt="">';
    return '<div class="ph" style="background:' + gradFor(p.id) + '">' + emojiForCat(p.category) + "</div>";
  }
  function newId() { return "p" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

  function loadList() {
    try {
      var saved = JSON.parse(localStorage.getItem(STORE_KEY));
      if (saved && saved.length) return saved;
    } catch (e) {}
    return JSON.parse(JSON.stringify(window.PRODUCTS || [])); // seed from current products.js
  }
  function saveList() { localStorage.setItem(STORE_KEY, JSON.stringify(list)); }

  /* --------------------- image compression ----------------------- */
  function compress(file, maxSide, quality, transparent) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () {
        var img = new Image();
        img.onload = function () {
          var w = img.width, h = img.height;
          if (w > h && w > maxSide) { h = Math.round(h * maxSide / w); w = maxSide; }
          else if (h >= w && h > maxSide) { w = Math.round(w * maxSide / h); h = maxSide; }
          var c = document.createElement("canvas");
          c.width = w; c.height = h;
          var ctx = c.getContext("2d");
          if (!transparent) { ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, w, h); }
          ctx.drawImage(img, 0, 0, w, h);
          resolve(c.toDataURL(transparent ? "image/png" : "image/jpeg", quality));
        };
        img.onerror = reject;
        img.src = reader.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /* ----------------------- build the form ------------------------ */
  function buildCatOptions() {
    $("#f-cat").innerHTML = CATEGORIES.map(function (c) {
      return '<option value="' + c.id + '">' + c.emoji + " " + c.title + "</option>";
    }).join("");
  }

  function resetForm() {
    editingId = null;
    currentImage = "";
    $("#f-name").value = "";
    $("#f-price").value = "";
    $("#f-badge").value = "";
    $("#f-image").value = "";
    $("#f-cat").selectedIndex = 0;
    $("#imgPreview").innerHTML = '<span class="hint">Koi photo select nahi</span>';
    $("#btnSave").textContent = "＋ Product Add karein";
    $("#btnCancel").style.display = "none";
    $("#formTitle").textContent = "Naya Product";
  }

  function fillForm(p) {
    editingId = p.id;
    currentImage = p.image || "";
    $("#f-name").value = p.name;
    $("#f-price").value = p.price;
    $("#f-badge").value = p.badge || "";
    $("#f-cat").value = p.category;
    $("#imgPreview").innerHTML = currentImage
      ? '<img src="' + currentImage + '" alt="preview">'
      : '<div class="ph" style="background:' + gradFor(p.id) + '">' + emojiForCat(p.category) + "</div>";
    $("#btnSave").textContent = "✓ Changes Save karein";
    $("#btnCancel").style.display = "inline-flex";
    $("#formTitle").textContent = "Product Edit";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function saveProduct() {
    var name = $("#f-name").value.trim();
    var price = parseFloat($("#f-price").value);
    var category = $("#f-cat").value;
    var badge = $("#f-badge").value.trim();

    if (!name) { alert("Product ka naam likhein."); return; }
    if (isNaN(price) || price < 0) { alert("Sahi price likhein (sirf number)."); return; }

    if (editingId) {
      var p = list.filter(function (x) { return x.id === editingId; })[0];
      if (p) { p.name = name; p.price = price; p.category = category; p.badge = badge; p.image = currentImage; }
    } else {
      list.push({ id: newId(), name: name, category: category, price: price, image: currentImage, badge: badge });
    }
    saveList();
    render();
    resetForm();
    toast("Save ho gaya ✓ — ab niche 'Download products.js' dabana na bhulein!");
  }

  function deleteProduct(id) {
    if (!confirm("Ye product delete karna hai?")) return;
    list = list.filter(function (x) { return x.id !== id; });
    saveList(); render();
    if (editingId === id) resetForm();
  }

  /* ----------------------- render product list ------------------- */
  function render() {
    var grid = $("#adminGrid");
    if (!list.length) {
      grid.innerHTML = '<div class="empty-cat">Abhi koi product nahi. Upar form se add karein 💜</div>';
    } else {
      grid.innerHTML = list.map(function (p) {
        var badge = p.badge ? '<span class="badge">' + escapeHtml(p.badge) + "</span>" : "";
        return (
          '<article class="card glass">' +
            '<div class="card-media">' + mediaHtml(p) + badge + "</div>" +
            '<div class="card-body">' +
              "<h3>" + escapeHtml(p.name) + "</h3>" +
              '<div style="font-size:.8rem;color:var(--ink-soft)">' + escapeHtml(catTitle(p.category)) + "</div>" +
              '<div class="card-row">' +
                '<span class="price">' + money(p.price) + "</span>" +
              "</div>" +
              '<div class="admin-actions">' +
                '<button class="mini edit" data-edit="' + p.id + '">✎ Edit</button>' +
                '<button class="mini del" data-del="' + p.id + '">🗑 Delete</button>' +
              "</div>" +
            "</div>" +
          "</article>"
        );
      }).join("");
    }
    // stats
    var content = fileContent();
    $("#statCount").textContent = list.length;
    $("#statSize").textContent = formatBytes(new Blob([content]).size);
  }

  function formatBytes(b) {
    if (b < 1024) return b + " B";
    if (b < 1048576) return (b / 1024).toFixed(0) + " KB";
    return (b / 1048576).toFixed(2) + " MB";
  }

  /* -------------------- export products.js ----------------------- */
  function fileContent() {
    var header =
      "/* =====================================================================\n" +
      "   RAINS — Products data  (admin page se generate: " + new Date().toLocaleString() + ")\n" +
      "   Is file ko js/ folder mein purani products.js ki jagah rakh dein.\n" +
      "   ===================================================================== */\n\n";
    return header + "window.PRODUCTS = " + JSON.stringify(list, null, 2) + ";\n";
  }

  function download() {
    if (!list.length) { alert("Pehle kuch products add karein."); return; }
    var blob = new Blob([fileContent()], { type: "text/javascript" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "products.js";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1500);
    toast("products.js download ho gayi — js folder mein replace kar dein ✓");
  }

  function copyCode() {
    var text = fileContent();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { toast("Code copy ho gaya ✓"); },
        function () { fallbackCopy(text); });
    } else fallbackCopy(text);
  }
  function fallbackCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text; document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); toast("Code copy ho gaya ✓"); } catch (e) { alert("Copy nahi ho saka."); }
    ta.remove();
  }

  function resetToSite() {
    if (!confirm("Website ki current products.js wali list dobara load karein? (aapke unsaved changes chale jayenge)")) return;
    list = JSON.parse(JSON.stringify(window.PRODUCTS || []));
    saveList(); render(); resetForm();
    toast("Website ki current list load ho gayi");
  }
  function clearAll() {
    if (!confirm("Saare products delete kar dein? (ye sirf yahan list khali karega — website tab badlegi jab aap nayi file download karke replace karein)")) return;
    list = []; saveList(); render(); resetForm();
  }

  /* ======================= WEBSITE SETTINGS ====================== */
  function setBrandLogo(el, img, emoji) {
    if (!el) return;
    if (img) { el.innerHTML = '<img src="' + img + '" alt="logo">'; el.classList.add("has-img"); }
    else { el.textContent = emoji || "🎀"; el.classList.remove("has-img"); }
  }
  function applyTheme(c1, c2) {
    var r = document.documentElement.style;
    if (c1) r.setProperty("--accent-1", c1);
    if (c2) r.setProperty("--accent-2", c2);
    if (c1 && c2) r.setProperty("--accent-grad", "linear-gradient(135deg," + c1 + "," + c2 + ")");
  }
  function renderLogoPreview() {
    var box = $("#logoPreview");
    if (currentLogo) box.innerHTML = '<img src="' + currentLogo + '" alt="logo">';
    else if ($("#s-emoji").value) box.innerHTML = '<div class="ph">' + $("#s-emoji").value + "</div>";
    else box.innerHTML = '<span class="hint">—</span>';
  }
  function prefillSettings() {
    var C = window.CONFIG || {};
    currentLogo = C.logoImage || "";
    $("#s-brand").value = C.brandName || "";
    $("#s-emoji").value = C.brandEmoji || "";
    $("#s-cur").value = C.currency || "Rs";
    $("#s-tag").value = C.heroTagline || "";
    $("#s-wa").value = C.whatsappNumber || "";
    $("#s-ig").value = C.instagramUrl || "";
    $("#s-greet").value = C.orderGreeting || "";
    if (C.theme) { $("#s-c1").value = C.theme.accent1 || "#ff5fa2"; $("#s-c2").value = C.theme.accent2 || "#a855f7"; }
    renderLogoPreview();
  }
  function settingsObject() {
    return {
      brandName: $("#s-brand").value.trim() || "Rains",
      brandEmoji: $("#s-emoji").value.trim() || "🎀",
      logoImage: currentLogo,
      whatsappNumber: $("#s-wa").value.replace(/[^0-9]/g, ""),
      instagramUrl: $("#s-ig").value.trim(),
      currency: $("#s-cur").value.trim() || "Rs",
      heroTagline: $("#s-tag").value.trim(),
      orderGreeting: $("#s-greet").value.trim(),
      theme: { accent1: $("#s-c1").value, accent2: $("#s-c2").value }
    };
  }
  function configContent() {
    var cfg = settingsObject();
    var header =
      "/* =====================================================================\n" +
      "   RAINS — Settings  (admin page se generate: " + new Date().toLocaleString() + ")\n" +
      "   Is file ko js/ folder mein purani config.js ki jagah rakh dein.\n" +
      "   ===================================================================== */\n\n";
    return header +
      "window.CONFIG = " + JSON.stringify(cfg, null, 2) + ";\n\n" +
      "window.CATEGORIES = " + JSON.stringify(window.CATEGORIES || [], null, 2) + ";\n";
  }
  function downloadConfig() {
    var blob = new Blob([configContent()], { type: "text/javascript" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "config.js";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1500);
    toast("config.js download ho gayi — js folder mein replace kar dein ✓");
  }
  function copyConfig() {
    var text = configContent();
    if (navigator.clipboard && navigator.clipboard.writeText)
      navigator.clipboard.writeText(text).then(function () { toast("Config code copy ✓"); }, function () { fallbackCopy(text); });
    else fallbackCopy(text);
  }
  function previewSettings() {
    var s = settingsObject();
    setBrandLogo($("#brandEmoji"), s.logoImage, s.brandEmoji);
    $("#brandName").textContent = s.brandName + " · Admin";
    applyTheme(s.theme.accent1, s.theme.accent2);
    toast("Preview lag gaya 👀 — website par lane ke liye 'Download config.js' karein");
  }

  /* ----------------------------- toast --------------------------- */
  var tTimer;
  function toast(text) {
    var t = $("#toast");
    t.querySelector("span").textContent = text;
    t.classList.add("show");
    clearTimeout(tTimer);
    tTimer = setTimeout(function () { t.classList.remove("show"); }, 2600);
  }

  /* ----------------------------- events -------------------------- */
  function wire() {
    // admin navbar reflects current branding + theme
    setBrandLogo($("#brandEmoji"), CONFIG.logoImage, CONFIG.brandEmoji);
    $("#brandName").textContent = CONFIG.brandName + " · Admin";
    if (CONFIG.theme) applyTheme(CONFIG.theme.accent1, CONFIG.theme.accent2);

    // ---- Website Settings panel ----
    prefillSettings();
    $("#s-logo").addEventListener("change", function (e) {
      var file = e.target.files[0]; if (!file) return;
      $("#logoPreview").innerHTML = '<span class="hint">…</span>';
      compress(file, 256, 0.92, true)
        .then(function (data) { currentLogo = data; renderLogoPreview(); })
        .catch(function () { $("#logoPreview").innerHTML = '<span class="hint">load fail</span>'; });
    });
    $("#s-logo-remove").addEventListener("click", function () { currentLogo = ""; $("#s-logo").value = ""; renderLogoPreview(); });
    $("#s-emoji").addEventListener("input", renderLogoPreview);
    $("#btnDownloadCfg").addEventListener("click", downloadConfig);
    $("#btnCopyCfg").addEventListener("click", copyConfig);
    $("#btnPreviewCfg").addEventListener("click", previewSettings);

    $("#f-image").addEventListener("change", function (e) {
      var file = e.target.files[0];
      if (!file) return;
      $("#imgPreview").innerHTML = '<span class="hint">Photo process ho rahi hai…</span>';
      compress(file, 800, 0.82).then(function (data) {
        currentImage = data;
        $("#imgPreview").innerHTML = '<img src="' + data + '" alt="preview">';
      }).catch(function () {
        $("#imgPreview").innerHTML = '<span class="hint">Photo load nahi hui, dobara koshish karein</span>';
      });
    });

    $("#btnRemoveImg").addEventListener("click", function () {
      currentImage = ""; $("#f-image").value = "";
      $("#imgPreview").innerHTML = '<span class="hint">Koi photo select nahi</span>';
    });

    $("#btnSave").addEventListener("click", saveProduct);
    $("#btnCancel").addEventListener("click", resetForm);
    $("#btnDownload").addEventListener("click", download);
    $("#btnCopy").addEventListener("click", copyCode);
    $("#btnReset").addEventListener("click", resetToSite);
    $("#btnClear").addEventListener("click", clearAll);

    $("#adminGrid").addEventListener("click", function (e) {
      var ed = e.target.closest("[data-edit]");
      var dl = e.target.closest("[data-del]");
      if (ed) { var p = list.filter(function (x) { return x.id === ed.getAttribute("data-edit"); })[0]; if (p) fillForm(p); }
      if (dl) deleteProduct(dl.getAttribute("data-del"));
    });
  }

  /* scroll reveal — animation as enhancement; content never stays hidden */
  function initReveal() {
    document.documentElement.classList.add("reveal-on");
    var els = [].slice.call(document.querySelectorAll(".reveal"));
    function show(el) { el.classList.add("in"); }
    function revealInView() {
      var vh = window.innerHeight || 800;
      els.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < vh * 0.95 && r.bottom > 0) show(el);
      });
    }
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { show(en.target); io.unobserve(en.target); }
        });
      }, { threshold: 0.08 });
      els.forEach(function (el) { io.observe(el); });
    }
    revealInView();
    window.addEventListener("load", revealInView);
    setTimeout(function () { els.forEach(show); }, 1500);
  }

  /* ------------------------------ init --------------------------- */
  document.addEventListener("DOMContentLoaded", function () {
    buildCatOptions();
    resetForm();
    wire();
    render();
    initReveal();
  });
})();
