/* ─────────────────────────────────────────────────────────────
   wish-us-well — app.js
   Lorena & Fernando · 14 de junho de 2026
   ───────────────────────────────────────────────────────────── */

// ── CONFIG ────────────────────────────────────────────────────
// Edit these values before deploying!
const CONFIG = {
  // Publish your sheet: File → Share → Publish to web → CSV
  // Then paste the URL below.
  csvUrl: 'https://docs.google.com/spreadsheets/d/16nACSCRqpmpXfb3z-x7i2PNW44Hc_Z69iJ9cx5-_MW8/pub?output=csv',

  // WhatsApp number: country code + DDD + number, no spaces, no +
  // Example: Brazil (55) + SP (11) + 98765-4321 → '5511987654321'
  whatsappNumber: '5561998147348',

  // Your PIX key: CPF, e-mail, phone, or random key
  pixKey: '61998147348',

  // Names used in WhatsApp messages
  coupleNames: 'Lorena e Fernando',

  // Wedding date (ISO format)
  weddingDate: '2026-06-14T12:00:00',
};

// ── STATE ─────────────────────────────────────────────────────
let allGifts = [];
let activeCategory = 'Todos';
let searchQuery = '';
let showOnlyAvailable = false;

// ── DOM REFS ──────────────────────────────────────────────────
const grid          = document.getElementById('gifts-grid');
const counter       = document.getElementById('gifts-counter');
const searchInput   = document.getElementById('search-input');
const chipsContainer = document.getElementById('filter-chips');
const toggleAvail   = document.getElementById('toggle-available');
const errorBanner   = document.getElementById('error-banner');

// ── INIT ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  startCountdown();
  renderSkeletons(8);
  loadCSV();

  // Update PIX key display and delivery WhatsApp links from config
  const pixDisplay = document.getElementById('pix-key-display');
  if (pixDisplay) pixDisplay.textContent = CONFIG.pixKey;

  document.querySelectorAll('[data-wpp]').forEach(el => {
    const msg = el.dataset.wpp.replace('{names}', CONFIG.coupleNames);
    el.href = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(msg)}`;
  });

  searchInput.addEventListener('input', e => {
    searchQuery = e.target.value.toLowerCase().trim();
    renderGifts();
  });

  toggleAvail.addEventListener('change', e => {
    showOnlyAvailable = e.target.checked;
    renderGifts();
  });

  document.getElementById('pix-copy-btn').addEventListener('click', copyPix);
});

// ── COUNTDOWN ─────────────────────────────────────────────────
function startCountdown() {
  const el = document.getElementById('countdown');
  if (!el) return;

  function update() {
    const now  = new Date();
    const end  = new Date(CONFIG.weddingDate);
    const diff = end - now;

    if (diff <= 0) {
      el.innerHTML = '<div class="countdown-unit"><span class="countdown-number">🎉</span><span class="countdown-label">Hoje!</span></div>';
      return;
    }

    const days  = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const mins  = Math.floor((diff % 3600000) / 60000);
    const secs  = Math.floor((diff % 60000) / 1000);

    el.innerHTML = `
      <div class="countdown-unit">
        <span class="countdown-number">${pad(days)}</span>
        <span class="countdown-label">dias</span>
      </div>
      <span class="countdown-sep">:</span>
      <div class="countdown-unit">
        <span class="countdown-number">${pad(hours)}</span>
        <span class="countdown-label">horas</span>
      </div>
      <span class="countdown-sep">:</span>
      <div class="countdown-unit">
        <span class="countdown-number">${pad(mins)}</span>
        <span class="countdown-label">min</span>
      </div>
      <span class="countdown-sep">:</span>
      <div class="countdown-unit">
        <span class="countdown-number">${pad(secs)}</span>
        <span class="countdown-label">seg</span>
      </div>
    `;
  }

  update();
  setInterval(update, 1000);
}

function pad(n) {
  return String(n).padStart(2, '0');
}

// ── LOAD CSV ──────────────────────────────────────────────────
async function loadCSV() {
  try {
    const res = await fetch(CONFIG.csvUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    allGifts = parseCSV(text);

    if (allGifts.length === 0) {
      showError('A planilha está vazia ou com formato incorreto. Verifique as colunas.');
      return;
    }

    buildFilterChips();
    renderGifts();
  } catch (err) {
    console.error('Erro ao carregar CSV:', err);
    showError();
  }
}

// ── PARSE CSV ─────────────────────────────────────────────────
function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];

  // Normalize headers: lowercase + remove accents
  const normalize = str =>
    str.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/"/g, '')
      .trim();

  const rawHeaders = splitLine(lines[0]).map(normalize);

  // Flexible header matching
  const col = (candidates) => {
    for (const c of candidates) {
      const idx = rawHeaders.findIndex(h => h === c || h.includes(c));
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const idx = {
    nome:       col(['nome', 'name', 'produto', 'item', 'presente']),
    categoria:  col(['categoria', 'category', 'cat', 'tipo']),
    imagem:     col(['imagem', 'image', 'foto', 'img', 'photo', 'url_imagem']),
    link:       col(['link', 'url', 'loja', 'comprar', 'buy', 'url_compra']),
    preco:      col(['preco', 'price', 'valor', 'faixa', 'preco_faixa', 'custo']),
    destaque:   col(['destaque', 'featured', 'wishlist', 'priority']),
    comprado:   col(['comprado', 'gifted', 'reservado', 'bought', 'presenteado']),
    observacao: col(['observacao', 'obs', 'nota', 'notes', 'detalhe', 'cor', 'info']),
  };

  const gifts = [];

  for (let i = 1; i < lines.length; i++) {
    const vals = splitLine(lines[i]);
    const get = (key) =>
      idx[key] !== -1 ? (vals[idx[key]] || '').replace(/^"|"$/g, '').trim() : '';

    const nome = get('nome');
    if (!nome) continue;

    gifts.push({
      id:         i,
      nome,
      categoria:  get('categoria') || 'Geral',
      imagem:     get('imagem'),
      link:       get('link'),
      preco:      get('preco'),
      destaque:   get('destaque').toLowerCase() === 'sim',
      comprado:   get('comprado').toLowerCase() === 'sim',
      observacao: get('observacao'),
    });
  }

  // Sort: featured first, then available, then by name
  return gifts.sort((a, b) => {
    if (a.destaque && !b.destaque) return -1;
    if (!a.destaque && b.destaque) return  1;
    if (!a.comprado && b.comprado) return -1;
    if (a.comprado && !b.comprado) return  1;
    return a.nome.localeCompare(b.nome, 'pt-BR');
  });
}

// Handles quoted fields with commas inside
function splitLine(line) {
  const result = [];
  let cur = '';
  let inQ = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQ = !inQ;
    } else if (ch === ',' && !inQ) {
      result.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  result.push(cur);
  return result;
}

// ── BUILD FILTER CHIPS ────────────────────────────────────────
function buildFilterChips() {
  const cats = ['Todos', ...new Set(
    allGifts.map(g => g.categoria).filter(Boolean).sort((a, b) => a.localeCompare(b, 'pt-BR'))
  )];

  chipsContainer.innerHTML = '';

  cats.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'chip' + (cat === activeCategory ? ' active' : '');
    btn.textContent = cat;
    btn.type = 'button';
    btn.addEventListener('click', () => {
      activeCategory = cat;
      document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      renderGifts();
    });
    chipsContainer.appendChild(btn);
  });
}

// ── RENDER GIFTS ──────────────────────────────────────────────
function renderGifts() {
  const filtered = allGifts.filter(g => {
    const matchCat    = activeCategory === 'Todos' || g.categoria === activeCategory;
    const matchSearch = !searchQuery ||
      g.nome.toLowerCase().includes(searchQuery) ||
      (g.observacao || '').toLowerCase().includes(searchQuery) ||
      (g.categoria  || '').toLowerCase().includes(searchQuery);
    const matchAvail  = !showOnlyAvailable || !g.comprado;
    return matchCat && matchSearch && matchAvail;
  });

  const available = allGifts.filter(g => !g.comprado).length;
  counter.innerHTML =
    `<span>${available}</span> de <span>${allGifts.length}</span> presentes disponíveis` +
    (filtered.length !== allGifts.length ? ` — mostrando <span>${filtered.length}</span>` : '');

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
            d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
            d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
        </svg>
        <p>Nenhum presente encontrado com esses filtros.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(g => renderCard(g)).join('');
}

// ── RENDER CARD ───────────────────────────────────────────────
function renderCard(g) {
  const imgHtml = g.imagem
    ? `<img class="card-img" src="${esc(g.imagem)}" alt="${esc(g.nome)}" loading="lazy"
        onerror="this.parentElement.innerHTML=giftPlaceholder()">`
    : giftPlaceholder();

  const wppMsg  = encodeURIComponent(
    `Olá ${CONFIG.coupleNames}! Vou presentear com: *${g.nome}* 🎁 Podem marcar como presenteado!`
  );
  const wppHref = `https://wa.me/${CONFIG.whatsappNumber}?text=${wppMsg}`;

  const buyBtn = g.link
    ? `<a href="${esc(g.link)}" target="_blank" rel="noopener noreferrer" class="btn btn-primary">🛍️ Ver na Loja</a>`
    : `<span class="btn btn-primary disabled" aria-disabled="true">Em breve</span>`;

  const notifyBtn = !g.comprado
    ? `<a href="${wppHref}" target="_blank" rel="noopener noreferrer"
          class="btn btn-notify" title="Avisar que vou comprar este presente (WhatsApp)">✓</a>`
    : '';

  return `
    <article class="card${g.comprado ? ' is-gifted' : ''}">
      <div class="card-img-wrap">
        ${imgHtml}
        ${g.destaque ? '<span class="card-badge-featured">✦ Wishlist</span>' : ''}
      </div>
      <div class="card-body">
        ${g.categoria ? `<div class="card-category">${esc(g.categoria)}</div>` : ''}
        <div class="card-name">${esc(g.nome)}</div>
        ${g.observacao ? `<div class="card-obs">${esc(g.observacao)}</div>` : ''}
        ${g.preco      ? `<div class="card-price">${esc(g.preco)}</div>`    : ''}
      </div>
      <div class="card-actions">
        ${buyBtn}
        ${notifyBtn}
      </div>
    </article>
  `;
}

// ── SKELETON ──────────────────────────────────────────────────
function renderSkeletons(n) {
  grid.innerHTML = Array(n).fill(`
    <div class="skeleton-card">
      <div class="skeleton skeleton-img"></div>
      <div class="skeleton-body">
        <div class="skeleton skeleton-line short"></div>
        <div class="skeleton skeleton-line medium"></div>
        <div class="skeleton skeleton-line full"></div>
        <div class="skeleton skeleton-line price"></div>
      </div>
    </div>
  `).join('');
}

// ── PIX COPY ──────────────────────────────────────────────────
function copyPix() {
  const btn = document.getElementById('pix-copy-btn');

  const done = () => {
    btn.textContent = '✓ Copiado!';
    btn.classList.add('copied');
    setTimeout(() => {
      btn.textContent = 'Copiar chave PIX';
      btn.classList.remove('copied');
    }, 2500);
  };

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(CONFIG.pixKey).then(done).catch(fallbackCopy);
  } else {
    fallbackCopy();
    done();
  }
}

function fallbackCopy() {
  const inp = document.createElement('textarea');
  inp.value = CONFIG.pixKey;
  inp.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
  document.body.appendChild(inp);
  inp.focus();
  inp.select();
  try { document.execCommand('copy'); } catch (_) { /* silent */ }
  document.body.removeChild(inp);
}

// ── ERROR ─────────────────────────────────────────────────────
function showError(msg) {
  grid.innerHTML = '';
  errorBanner.style.display = 'block';
  errorBanner.innerHTML = msg
    ? `⚠️ ${msg}`
    : `⚠️ Não foi possível carregar a lista. Verifique se a planilha está publicada como CSV.
       <a href="https://support.google.com/docs/answer/183965" target="_blank" rel="noopener">Como publicar?</a>`;
}

// ── HELPERS ───────────────────────────────────────────────────
function esc(str) {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Called from onerror attribute on img tags — must be global
function giftPlaceholder() {
  return `
    <div class="card-img-placeholder">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
          d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"/>
      </svg>
      <span>Foto em breve</span>
    </div>
  `;
}
