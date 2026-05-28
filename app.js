/* ─────────────────────────────────────────────────────────────
   wish-us-well — app.js
   Lorena & Fernando · 14 de junho de 2026
   ───────────────────────────────────────────────────────────── */

// ── CONFIG ────────────────────────────────────────────────────
// Edit these values before deploying!
const CONFIG = {
  // Publish your sheet: File → Share → Publish to web → CSV
  // Then paste the URL below.
  csvUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vScEK-RFlMNa14Hq3jbadmBSeDItpax3ibK14aDIVI00bFt7CdSjU4pTdFTuTeCk9If589ikJIgFybZ/pub?gid=1785623974&single=true&output=csv',

  // WhatsApp number: country code + DDD + number, no spaces, no +
  // Example: Brazil (55) + SP (11) + 98765-4321 → '5511987654321'
  whatsappNumber: '5561998343424',

  // Your PIX key: CPF, e-mail, phone, or random key
  pixKey: '61998147348',

  // Names used in WhatsApp messages
  coupleNames: 'Lorena e Fernando',

  // Wedding date (ISO format)
  weddingDate: '2026-06-14T12:00:00',
};

// ── STATE ─────────────────────────────────────────────────────
let allGifts = [];
let searchQuery = '';
let showOnlyAvailable = false;

// ── DOM REFS ──────────────────────────────────────────────────
const grid        = document.getElementById('gifts-grid');
const counter     = document.getElementById('gifts-counter');
const searchInput = document.getElementById('search-input');
const toggleAvail = document.getElementById('toggle-available');
const errorBanner = document.getElementById('error-banner');

// ── INIT ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  startCountdown();
  renderSkeletons(8);
  loadCSV();

  // Update PIX key display and delivery WhatsApp links from CONFIG
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
    produto:    col(['produto', 'product', 'item', 'presente', 'name']),
    nome:       col(['nome', 'reservado_por', 'reservante', 'quem_compra', 'comprador']),
    imagem:     col(['imagem', 'image', 'foto', 'img', 'photo', 'url_imagem']),
    link:       col(['link', 'url', 'loja', 'comprar', 'buy', 'url_compra']),
    preco:      col(['preco', 'price', 'valor', 'faixa', 'preco_faixa', 'custo']),
    destaque:   col(['destaque', 'featured', 'wishlist', 'priority']),
    comprado:   col(['comprado', 'gifted', 'bought', 'presenteado']),
    observacao: col(['observacao', 'obs', 'nota', 'notes', 'detalhe', 'cor', 'info']),
  };

  const gifts = [];

  for (let i = 1; i < lines.length; i++) {
    const vals = splitLine(lines[i]);
    const get = (key) =>
      idx[key] !== -1 ? (vals[idx[key]] || '').replace(/^"|"$/g, '').trim() : '';

    const produto = get('produto');
    if (!produto) continue;

    gifts.push({
      id:         i,
      produto,
      nome:       get('nome'),
      imagem:     get('imagem'),
      link:       get('link'),
      preco:      get('preco'),
      destaque:   get('destaque').toLowerCase() === 'sim',
      comprado:   get('comprado').toLowerCase() === 'sim',
      observacao: get('observacao'),
    });
  }

  // Sort: featured first, then free (no nome + not comprado), then reserved, then gifted
  return gifts.sort((a, b) => {
    if (a.destaque && !b.destaque) return -1;
    if (!a.destaque && b.destaque) return  1;
    const aFree = !a.nome && !a.comprado;
    const bFree = !b.nome && !b.comprado;
    if (aFree && !bFree) return -1;
    if (!aFree && bFree) return  1;
    return a.produto.localeCompare(b.produto, 'pt-BR');
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

// ── RENDER GIFTS ──────────────────────────────────────────────
function renderGifts() {
  const filtered = allGifts.filter(g => {
    const matchSearch = !searchQuery ||
      g.produto.toLowerCase().includes(searchQuery) ||
      (g.observacao || '').toLowerCase().includes(searchQuery) ||
      (g.nome       || '').toLowerCase().includes(searchQuery);
    // "Só disponíveis" hides both reserved (nome set) and gifted (comprado)
    const matchAvail = !showOnlyAvailable || (!g.nome && !g.comprado);
    return matchSearch && matchAvail;
  });

  const free     = allGifts.filter(g => !g.nome && !g.comprado).length;
  const reserved = allGifts.filter(g => g.nome && !g.comprado).length;
  counter.innerHTML =
    `<span>${free}</span> disponíveis · <span>${reserved}</span> reservados · ` +
    `<span>${allGifts.length}</span> no total` +
    (filtered.length !== allGifts.length ? ` — exibindo <span>${filtered.length}</span>` : '');

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
    ? `<img class="card-img" src="${esc(g.imagem)}" alt="${esc(g.produto)}" loading="lazy"
        onerror="this.parentElement.innerHTML=giftPlaceholder()">`
    : giftPlaceholder();

  const wppMsg  = encodeURIComponent(
    `Olá ${CONFIG.coupleNames}! Vou presentear com: *${g.produto}* 🎁 Podem marcar como presenteado!`
  );
  const wppHref = `https://wa.me/${CONFIG.whatsappNumber}?text=${wppMsg}`;

  const isReserved = !!g.nome && !g.comprado;

  const buyBtn = g.link
    ? `<a href="${esc(g.link)}" target="_blank" rel="noopener noreferrer" class="btn btn-primary">Ver na Loja</a>`
    : `<span class="btn btn-primary disabled" aria-disabled="true">Em breve</span>`;

  // Show notify button only when item is free (no one reserved yet)
  const notifyBtn = !g.nome && !g.comprado
    ? `<div class="notify-wrap">
        <a href="${wppHref}" target="_blank" rel="noopener noreferrer" class="btn btn-wpp-notify">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          Vou presentear este!
        </a>
        <p class="notify-hint">Clique para nos avisar <br>assim evitamos presentes repetidos 🎁</p>
       </div>`
    : '';

  // "Reservado por" badge shown inside card body
  const reservedBadge = isReserved
    ? `<div class="card-reservado">👤 Reservado por <strong>${esc(g.nome)}</strong></div>`
    : '';

  let cardClass = 'card';
  if (g.comprado)  cardClass += ' is-gifted';
  if (isReserved)  cardClass += ' is-reserved';

  return `
    <article class="${cardClass}">
      <div class="card-img-wrap">
        ${imgHtml}
        ${g.destaque ? '<span class="card-badge-featured">✦ Wishlist</span>' : ''}
      </div>
      <div class="card-body">
        <div class="card-name">${esc(g.produto)}</div>
        ${g.observacao    ? `<div class="card-obs">${esc(g.observacao)}</div>`   : ''}
        ${g.preco         ? `<div class="card-price">${esc(g.preco)}</div>`      : ''}
        ${reservedBadge}
      </div>
      <div class="card-actions">
        ${buyBtn}
      </div>
      ${notifyBtn}
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
