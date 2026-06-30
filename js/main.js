/* =====================================================================
   RAINS — Storefront logic (cart + WhatsApp order + animations)
   Is file ko edit karne ki zaroorat nahi.
   ===================================================================== */
(function () {
  "use strict";

  var CART_KEY = "rains_cart";
  var cart = loadCart();

  /* ---- soft gradients for image placeholders ---- */
  var GRADIENTS = [
    "linear-gradient(135deg,#ffd3ec,#e7c9ff)",
    "linear-gradient(135deg,#ffe0f0,#d9c4ff)",
    "linear-gradient(135deg,#fcd5ff,#c8d4ff)",
    "linear-gradient(135deg,#ffd9e8,#e9d4ff)",
    "linear-gradient(135deg,#f7d4ff,#ffd6e7)"
  ];

  /* ============================ helpers ============================ */
  function $(s, r) { return (r || document).querySelector(s); }
  function loadCart() { try { return JSON.parse(localStorage.getItem(CART_KEY)) || {}; } catch (e) { return {}; } }
  function saveCart() { try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) {} }
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
  function catById(id) { return CATEGORIES.filter(function (c) { return c.id === id; })[0]; }
  function emojiForCat(id) { var c = catById(id); return c ? c.emoji : "🎀"; }
  function productById(id) { return PRODUCTS.filter(function (p) { return p.id === id; })[0]; }

  function mediaHtml(p, cls) {
    if (p.image) return '<img src="' + p.image + '" alt="' + escapeHtml(p.name) + '" loading="lazy">';
    return '<div class="ph" style="background:' + gradFor(p.id) + '">' + emojiForCat(p.category) + '</div>';
  }

  /* ====================== build the page ========================== */
  function setLogo(el) {
    if (CONFIG.logoImage) {
      el.innerHTML = '<img src="' + CONFIG.logoImage + '" alt="logo">';
      el.classList.add("has-img");
    } else {
      el.textContent = CONFIG.brandEmoji;
      el.classList.remove("has-img");
    }
  }
  function applyTheme() {
    if (!CONFIG.theme) return;
    var r = document.documentElement.style;
    if (CONFIG.theme.accent1) r.setProperty("--accent-1", CONFIG.theme.accent1);
    if (CONFIG.theme.accent2) r.setProperty("--accent-2", CONFIG.theme.accent2);
    if (CONFIG.theme.accent1 && CONFIG.theme.accent2)
      r.setProperty("--accent-grad", "linear-gradient(135deg," + CONFIG.theme.accent1 + "," + CONFIG.theme.accent2 + ")");
  }
  function buildBrand() {
    $("#brandName").textContent = CONFIG.brandName;
    [].forEach.call(document.querySelectorAll(".logo"), setLogo);
    $("#heroTagline").textContent = CONFIG.heroTagline;
    applyTheme();
    document.title = CONFIG.brandName + " — Handmade Keychains & Charms";
  }

  function buildNav() {
    var nav = $("#navLinks");
    nav.innerHTML = CATEGORIES.map(function (c) {
      return '<a href="#cat-' + c.id + '">' + c.emoji + " " + c.title + "</a>";
    }).join("");
  }

  function buildSections() {
    var root = $("#sections");
    root.innerHTML = CATEGORIES.map(function (c) {
      var items = PRODUCTS.filter(function (p) { return p.category === c.id; });
      var cards = items.length
        ? items.map(cardHtml).join("")
        : '<div class="empty-cat">Is section mein abhi koi product nahi — admin page se add karein 💜</div>';
      return (
        '<section class="section" id="cat-' + c.id + '">' +
          '<div class="section-head reveal">' +
            '<div class="ico">' + c.emoji + "</div>" +
            "<div><h2>" + escapeHtml(c.title) + "</h2></div>" +
            "<p>" + escapeHtml(c.desc) + "</p>" +
          "</div>" +
          '<div class="grid">' + cards + "</div>" +
        "</section>"
      );
    }).join("");
  }

  function cardHtml(p) {
    var badge = p.badge ? '<span class="badge">' + escapeHtml(p.badge) + "</span>" : "";
    return (
      '<article class="card glass reveal">' +
        '<div class="card-media">' + mediaHtml(p) + badge + "</div>" +
        '<div class="card-body">' +
          "<h3>" + escapeHtml(p.name) + "</h3>" +
          '<div class="card-row">' +
            '<span class="price">' + money(p.price) + "</span>" +
            '<button class="add" data-add="' + p.id + '">＋ Cart</button>' +
          "</div>" +
        "</div>" +
      "</article>"
    );
  }

  /* ============================ cart ============================== */
  function addToCart(id) {
    cart[id] = (cart[id] || 0) + 1;
    saveCart(); renderCart(); bumpCount(); toast("Cart mein add ho gaya ✓");
  }
  function setQty(id, delta) {
    cart[id] = (cart[id] || 0) + delta;
    if (cart[id] <= 0) delete cart[id];
    saveCart(); renderCart(); updateCount();
  }
  function removeItem(id) { delete cart[id]; saveCart(); renderCart(); updateCount(); }

  function cartEntries() {
    return Object.keys(cart)
      .map(function (id) { return { p: productById(id), qty: cart[id] }; })
      .filter(function (e) { return e.p; }); // skip deleted products
  }
  function cartTotal() {
    return cartEntries().reduce(function (s, e) { return s + e.p.price * e.qty; }, 0);
  }
  function cartCount() {
    return cartEntries().reduce(function (s, e) { return s + e.qty; }, 0);
  }

  function updateCount() {
    var n = cartCount();
    var el = $("#cartCount");
    el.textContent = n;
    el.style.display = n ? "grid" : "none";
    $("#checkoutBtn").disabled = n === 0;
  }
  function bumpCount() {
    updateCount();
    var el = $("#cartCount");
    el.classList.remove("pop"); void el.offsetWidth; el.classList.add("pop");
  }

  function renderCart() {
    var box = $("#cartItems");
    var entries = cartEntries();
    if (!entries.length) {
      box.innerHTML = '<div class="cart-empty"><div class="big">🛍️</div>Aap ka cart khali hai.<br>Kuch pyara sa add karein!</div>';
    } else {
      box.innerHTML = entries.map(function (e) {
        var p = e.p;
        return (
          '<div class="citem">' +
            '<div class="thumb">' + mediaHtml(p) + "</div>" +
            '<div class="info">' +
              "<h4>" + escapeHtml(p.name) + "</h4>" +
              '<div class="p">' + money(p.price) + "</div>" +
              '<div class="qty">' +
                '<button data-dec="' + p.id + '">−</button>' +
                "<span>" + e.qty + "</span>" +
                '<button data-inc="' + p.id + '">＋</button>' +
              "</div>" +
            "</div>" +
            '<button class="rm" data-rm="' + p.id + '" title="Remove">🗑️</button>' +
          "</div>"
        );
      }).join("");
    }
    $("#cartTotal").textContent = money(cartTotal());
    updateCount();
  }

  /* ======================= WhatsApp checkout ====================== */
  function checkout() {
    var entries = cartEntries();
    if (!entries.length) return;

    var name = $("#custName").value.trim();
    var addr = $("#custAddr").value.trim();
    var phone = $("#custPhone").value.trim();

    var lines = entries.map(function (e, i) {
      return (i + 1) + ") " + e.p.name + " — " + money(e.p.price) + " x " + e.qty +
             " = " + money(e.p.price * e.qty);
    });

    var msg = CONFIG.orderGreeting + "\n\n" + lines.join("\n") +
              "\n\n*Total: " + money(cartTotal()) + "*";
    if (name)  msg += "\n\nNaam: " + name;
    if (phone) msg += "\nPhone: " + phone;
    if (addr)  msg += "\nAddress: " + addr;
    if (!name && !addr) msg += "\n\n(Naam aur address yahan likh dein 👇)\nNaam: \nAddress: ";

    var url = "https://wa.me/" + CONFIG.whatsappNumber + "?text=" + encodeURIComponent(msg);
    window.open(url, "_blank");
  }

  /* =========================== UI glue =========================== */
  function openCart() { $("#cart").classList.add("open"); $("#overlay").classList.add("show"); }
  function closeCart() { $("#cart").classList.remove("open"); $("#overlay").classList.remove("show"); }

  var toastTimer;
  function toast(text) {
    var t = $("#toast");
    t.querySelector("span").textContent = text;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("show"); }, 1800);
  }

  function wireEvents() {
    // event delegation for everything that gets re-rendered
    document.addEventListener("click", function (e) {
      var t = e.target.closest("[data-add],[data-inc],[data-dec],[data-rm]");
      if (!t) return;
      if (t.hasAttribute("data-add")) addToCart(t.getAttribute("data-add"));
      else if (t.hasAttribute("data-inc")) setQty(t.getAttribute("data-inc"), 1);
      else if (t.hasAttribute("data-dec")) setQty(t.getAttribute("data-dec"), -1);
      else if (t.hasAttribute("data-rm")) removeItem(t.getAttribute("data-rm"));
    });
    $("#openCart").addEventListener("click", openCart);
    $("#closeCart").addEventListener("click", closeCart);
    $("#overlay").addEventListener("click", closeCart);
    $("#checkoutBtn").addEventListener("click", checkout);
    // close cart with Esc
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeCart(); });
  }

  function wireFooter() {
    $("#igLink").href = CONFIG.instagramUrl;
    var wa = "https://wa.me/" + CONFIG.whatsappNumber;
    $("#waLink").href = wa;
    $("#year").textContent = new Date().getFullYear();
    $("#footBrand").textContent = CONFIG.brandName;
    var fbc = $("#footBrandCopy"); if (fbc) fbc.textContent = CONFIG.brandName;
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
    // safety: kuch bhi hidden na reh jaye
    setTimeout(function () { els.forEach(show); }, 1500);
  }

  /* ============================ init ============================= */
  /* Har step alag guard mein — agar ek cheez fail ho (jaise file:// par
     kisi browser setting ki wajah se) to baqi sab phir bhi chalein,
     khaas taur par products render aur reveal. */
  function safe(fn, label) {
    try { fn(); } catch (e) { if (window.console && console.error) console.error("[Rains] " + label + ":", e); }
  }
  function start() {
    safe(buildBrand, "buildBrand");
    safe(buildNav, "buildNav");
    safe(buildSections, "buildSections");
    safe(wireEvents, "wireEvents");
    safe(wireFooter, "wireFooter");
    safe(renderCart, "renderCart");
    safe(initReveal, "initReveal");
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
