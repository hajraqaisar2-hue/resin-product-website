================================================================
   RAINS WEBSITE — Developer README (run + edit guide)
================================================================
Ye ek complete, ready project hai. Pure HTML + CSS + vanilla
JavaScript. Koi framework nahi, koi build/compile nahi, koi
"npm install" nahi. Bas files kholo aur chala lo.

(Non-technical / using guide ke liye "GUIDE.txt" dekhein.)

----------------------------------------------------------------
FILE STRUCTURE — kaunsi file kya karti hai
----------------------------------------------------------------
Rains Websites/
├── index.html      -> Main website (customer ye dekhega)
├── admin.html      -> Admin panel (products + website settings)
├── css/
│   └── style.css   -> Saara design: glassmorphism, theme colors,
│                      animations, responsive layout
├── js/
│   ├── config.js   -> Brand name, logo, WhatsApp number, Instagram,
│                      currency, theme colors, aur CATEGORIES (sections)
│   ├── products.js -> Products ka data  (window.PRODUCTS = [...])
│   ├── main.js     -> Storefront logic: cards render, cart,
│                      WhatsApp checkout, scroll animations
│   └── admin.js    -> Admin tool: product manager + settings,
│                      jo products.js / config.js generate karta hai
├── GUIDE.txt       -> Roman Urdu guide (admin/settings/hosting)
└── README.txt      -> Ye file

----------------------------------------------------------------
LOCALLY KAISE CHALAYEIN — 3 tareeqe (koi bhi)
----------------------------------------------------------------

>> TAREEQA 1 — Sabse aasan (kuch install nahi) <<
   "index.html" par double-click. Browser mein khul jayegi.
   - Admin ke liye: "admin.html" double-click.
   - Note: fonts internet se aate hain; offline ho to thoda
     simple font chalega, design phir bhi theek rahega.

>> TAREEQA 2 — VS Code + Live Server (code edit karne ke liye best) <<
   1. VS Code mein "Rains Websites" folder kholein (File > Open Folder).
   2. Extensions se "Live Server" (Ritwick Dey) install karein.
   3. index.html par right-click -> "Open with Live Server".
   4. Edit karte hi browser auto-refresh ho jata hai.

>> TAREEQA 3 — Command line server (jiske paas Python/Node ho) <<
   Folder ke andar terminal khol kar in mein se ek chalayein:

   Python:   python -m http.server 8000
   Node:     npx serve
             (ya)  npx http-server

   Phir browser mein:  http://localhost:8000
   (Port number terminal output mein bhi likha aata hai.)

----------------------------------------------------------------
CODE EDIT KARNA — kya badalna ho to KAHAN
----------------------------------------------------------------
- Colors / design ........ css/style.css  (sabse upar :root block
                           mein theme colors hain)
- Brand / logo / number /
  Instagram / theme ...... js/config.js  (ya admin page > Settings)
- Sections (categories) .. js/config.js  ->  CATEGORIES array
- Products ............... js/products.js  (ya admin page se generate)
- Storefront ka behaviour  js/main.js
- Admin ka behaviour ..... js/admin.js

----------------------------------------------------------------
DATA MODEL (technical note)
----------------------------------------------------------------
- window.CONFIG    -> ek object: brand, whatsappNumber, instagramUrl,
                      currency, theme {accent1, accent2}, logoImage, ...
- window.CATEGORIES-> 5 sections: [{id, title, emoji, desc}, ...]
- window.PRODUCTS  -> array: [{id, name, category, price, image, badge}]
     * category = kisi CATEGORY ki id (alphabet/teddy/butterfly/
       bookmark/charm)
     * image = ""  (to placeholder icon dikhega)  ya  base64 data URL
     * Admin page photos ko compress kar ke base64 mein embed karta
       hai, isliye alag image folder ki zaroorat nahi.

- Cart browser ke localStorage mein save hota hai ("rains_cart").
- "Order on WhatsApp" cart se ek wa.me link banata hai jisme
  pre-filled order message hota hai (config wale number par).

----------------------------------------------------------------
ONLINE (PUBLIC LINK) — har kisi ke phone par chale
----------------------------------------------------------------
Sabse aasan free tareeqa: Netlify Drop
  https://app.netlify.com/drop  par poora folder drag-drop karein
  -> ek live link mil jayega (jaise rains.netlify.app)
  -> wahi Instagram bio mein lagayein.
(localhost waale links sirf aapke apne computer par chalte hain,
 dusre ke laptop/phone par nahi.)

================================================================
   Tech: HTML + CSS + Vanilla JS · No build · No dependencies
================================================================
