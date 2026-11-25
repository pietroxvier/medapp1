const DEFAULT_STATE = {
  activeTab: 'hoje',
  reducaoTab: 'Ritalina LA',
  estoqueSubTab: 'Consulta',
  selectedPharmacy: 'Caruso',
  streakDays: 12,
  piluColor: '#2F3CFF',
  doses: [
    { id: 'd1', time: '08:00', name: 'Pregabalina', detail: '150 mg · 1 unidade · plano de redução', status: 'pending' },
    { id: 'd2', time: '08:00', name: 'Propranolol', detail: '2,5 mg · 1 unidade', status: 'pending' },
    { id: 'd3', time: '08:00', name: 'Ritalina LA', detail: '150 mg · 1 unidade · plano de redução', status: 'pending' },
    { id: 'd4', time: '13:00', name: 'Ritalina LA', detail: '150 mg · 1 unidade · plano de redução', status: 'pending' },
    { id: 'd5', time: '13:00', name: 'Sertralina', detail: '75 mg · 1 unidade', status: 'pending' },
    { id: 'd6', time: '17:00', name: 'Pregabalina', detail: '150 mg · 1 unidade · plano de redução', status: 'pending' },
  ],
  stocks: [
    { name: 'Ritalina LA', dose: '', recipe: 'Notificação de Receita A (amarela)', days: 0, units: 0, perDay: 2, ends: '12 nov', step: 3 },
    { name: 'Pregabalina', dose: '150 mg', recipe: 'Receita de controle especial (2 vias)', days: 9, units: 18, perDay: 2, ends: '21 nov', step: 1 },
    { name: 'Propranolol', dose: '2,5 mg', recipe: 'Receita simples', days: 17, units: 17, perDay: 1, ends: '29 nov', step: 0 },
    { name: 'Sertralina', dose: '75 mg', recipe: 'Receita simples', days: 0, units: 0, perDay: 1, ends: '12 nov', step: 1 },
  ],
  checkinNote: '',
};

let state = structuredClone(DEFAULT_STATE);

function piluSvg(size = 136, mood = 'happy', color = state.piluColor) {
  const face =
    mood === 'joy'
      ? `<path d="M43 59q5-7 10 0M67 59q5-7 10 0" fill="none" stroke="#11131A" stroke-width="3.5" stroke-linecap="round"/>
         <path d="M51 67q9 11 18 0z" fill="#11131A"/>
         <path d="M100 14l2.5 6.5 6.5 2.5-6.5 2.5-2.5 6.5-2.5-6.5-6.5-2.5 6.5-2.5z" fill="#FFD66B" stroke="#11131A" stroke-width="2" stroke-linejoin="round"/>`
      : mood === 'wow'
      ? `<circle cx="48" cy="57" r="6.5" fill="#11131A"/><circle cx="72" cy="57" r="6.5" fill="#11131A"/>
         <circle cx="50" cy="55" r="2" fill="#fff"/><circle cx="74" cy="55" r="2" fill="#fff"/>
         <ellipse cx="60" cy="71" rx="4" ry="5" fill="#11131A"/>`
      : `<g style="transform-origin:60px 58px;animation:piluBlink 4s infinite">
           <circle cx="48" cy="58" r="5" fill="#11131A"/><circle cx="72" cy="58" r="5" fill="#11131A"/>
         </g>
         <path d="M53 69q7 6 14 0" fill="none" stroke="#11131A" stroke-width="3.5" stroke-linecap="round"/>`;

  return `
    <svg width="${size}" height="${size}" viewBox="0 0 120 120" role="img" aria-label="Pílu" style="display:block;overflow:visible">
      <g transform="rotate(-24 60 60)">
        <rect x="10" y="34" width="100" height="52" rx="26" fill="#fff" stroke="#11131A" stroke-width="4"/>
        <path d="M60 34H36a26 26 0 0 0 0 52h24z" fill="${color}" stroke="#11131A" stroke-width="4"/>
      </g>
      ${face}
      <circle cx="41" cy="68" r="4" fill="#FF8A8A" opacity=".75"/>
      <circle cx="79" cy="68" r="4" fill="#FF8A8A" opacity=".75"/>
    </svg>`;
}

async function loadInitialState() {
  try {
    if (window.remediosAPI) {
      const saved = await window.remediosAPI.loadState();
      if (saved) state = { ...structuredClone(DEFAULT_STATE), ...saved };
    } else {
      const raw = localStorage.getItem('remedios_gamified_state');
      if (raw) state = { ...structuredClone(DEFAULT_STATE), ...JSON.parse(raw) };
    }
  } catch {
    // fallback
  }
  render();
}

function saveState() {
  try {
    if (window.remediosAPI) {
      window.remediosAPI.saveState(state);
    } else {
      localStorage.setItem('remedios_gamified_state', JSON.stringify(state));
    }
  } catch {
    // ignore
  }
}

function openModal(title, bodyHtml, footerHtml = '') {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML = bodyHtml;
  document.getElementById('modal-footer').innerHTML = footerHtml || '<button class="btn btn-primary" id="modal-ok">Fechar</button>';
  document.getElementById('modal-backdrop').classList.remove('hidden');
  const okBtn = document.getElementById('modal-ok');
  if (okBtn) okBtn.onclick = closeModal;
}

function closeModal() {
  document.getElementById('modal-backdrop').classList.add('hidden');
}

document.getElementById('modal-close').onclick = closeModal;
document.getElementById('modal-backdrop').onclick = (e) => {
  if (e.target.id === 'modal-backdrop') closeModal();
};

function markDose(id, status) {
  const wasAllDone = state.doses.every((d) => d.status !== 'pending');
  const dose = state.doses.find((d) => d.id === id);
  if (!dose) return;
  dose.status = status;
  if (status === 'taken') {
    const stock = state.stocks.find((s) => s.name === dose.name);
    if (stock && stock.units > 0) {
      stock.units -= 1;
      stock.days = Math.floor(stock.units / Math.max(1, stock.perDay));
    }
  }
  const nowAllDone = state.doses.every((d) => d.status !== 'pending');
  if (!wasAllDone && nowAllDone) {
    state.streakDays += 1;
  }
  saveState();
  render();
}

function undoLastDose() {
  const wasAllDone = state.doses.every((d) => d.status !== 'pending');
  for (let i = state.doses.length - 1; i >= 0; i--) {
    if (state.doses[i].status !== 'pending') {
      state.doses[i].status = 'pending';
      break;
    }
  }
  if (wasAllDone && state.streakDays > 0) state.streakDays -= 1;
  saveState();
  render();
}

function renderHoje() {
  const pending = state.doses.filter((d) => d.status === 'pending');
  const doneCount = state.doses.filter((d) => d.status !== 'pending').length;
  const nextDose = pending[0];

  const heroHtml = nextDose
    ? `
      <section class="hero-mission" aria-label="Missão atual">
        <div class="hero-top">
          <div style="display:flex;align-items:center;gap:10px;">
            <span class="mono-badge">Missão</span>
            <span class="mono-text">Próxima · ${nextDose.time}</span>
          </div>
          <div class="dots-row">
            ${state.doses.map((d) => `<span class="dot-sq ${d.status !== 'pending' ? 'done' : d.id === nextDose.id ? 'now' : ''}"></span>`).join('')}
            <span style="font-size:14px;font-weight:700;margin-left:6px;">${doneCount} de ${state.doses.length} marcadas</span>
          </div>
        </div>
        <div class="hero-mid">
          <div>
            <div class="hero-med">${nextDose.name}</div>
            <div class="hero-dose">${nextDose.detail.replace(' · plano de redução', '')}</div>
          </div>
          <div class="pilu-bob">${piluSvg(138, 'happy')}</div>
        </div>
        <div class="hero-actions">
          <button class="btn-tomei" data-action="take" data-id="${nextDose.id}">✓ Tomei</button>
          <button class="btn-pular-hero" data-action="skip" data-id="${nextDose.id}">Pular</button>
          <span style="font-size:14px;font-weight:600;color:#DDE0FF;">🔥 +1 dia na sequência</span>
        </div>
      </section>`
    : `
      <section class="hero-mission done" aria-label="Dia completo">
        <div class="mono-text">Dia completo · ${state.doses.length} de ${state.doses.length} marcadas</div>
        <div class="hero-mid">
          <div>
            <div class="hero-med">+1 dia!</div>
            <div class="hero-dose" style="color:#11131A;font-weight:600;">Sua sequência agora é de ${state.streakDays} dias. Pílu ficou feliz!</div>
          </div>
          <div class="pilu-bob">${piluSvg(138, 'joy')}</div>
        </div>
        <div>
          <button class="btn btn-dark" id="btn-undo-day">Desfazer</button>
        </div>
      </section>`;

  return `
    <div class="date-label">quinta-feira, 12 de novembro</div>
    <h1 class="page-title">${pending.length === 0 ? 'Dia completo.' : pending.length === 1 ? 'Falta 1 dose.' : `Faltam ${pending.length} doses.`}</h1>

    <div class="grid-2">
      <div>
        ${heroHtml}

        <section class="card" style="margin-top:26px;">
          <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px;">
            <h2 style="margin:0;font-family:'Bricolage Grotesque',sans-serif;font-weight:800;font-size:22px;">Linha do dia</h2>
            <span class="mono-text" style="color:var(--muted);">fase ${doneCount} de ${state.doses.length}</span>
          </div>
          ${state.doses.map((d) => `
            <div class="timeline-row">
              <span class="tl-dot ${d.status !== 'pending' ? 'done' : nextDose && d.id === nextDose.id ? 'now' : ''}"></span>
              <div class="tl-time">${d.time}</div>
              <div class="tl-info">
                <strong>${d.name}</strong>
                <span>${d.detail}</span>
              </div>
              ${d.status === 'pending' ? `
                <button class="btn-ghost" data-action="skip" data-id="${d.id}">pular</button>
                <button class="btn btn-primary" data-action="take" data-id="${d.id}">Tomei</button>
              ` : `<span class="tag tag-green">${d.status === 'taken' ? '✓ Tomada' : 'Pulada'}</span>`}
            </div>
          `).join('')}
        </section>
      </div>

      <div>
        <section class="card">
          <div style="display:flex;align-items:center;gap:14px;">
            <div>${piluSvg(78, pending.length === 0 ? 'joy' : 'happy')}</div>
            <div>
              <strong style="font-family:'Bricolage Grotesque',sans-serif;font-size:19px;">Pílu</strong>
              <div class="subtitle" style="margin:0;">${state.streakDays} dias seguidos</div>
              <div class="skin-swatches" aria-label="Cor do Pílu">
                ${['#2F3CFF', '#FFD66B', '#5FD3A6', '#11131A'].map((c) => `
                  <button class="swatch ${state.piluColor === c ? 'active' : ''}" style="background:${c}" data-skin="${c}" aria-label="Cor ${c}"></button>
                `).join('')}
              </div>
            </div>
          </div>
        </section>

        <section class="card" style="background:#FFF3D6;box-shadow:0 6px 0 #E6CA82;">
          <strong style="color:#7A4100;">Ritalina LA + Sertralina acaba em ~0 dias</strong>
          <p class="subtitle" style="color:#7A4100;">Quer que eu consulte as farmácias pelo WhatsApp? Eu só começo depois do seu sim.</p>
          <div style="display:flex;gap:8px;margin-top:12px;">
            <button class="btn btn-primary" data-goto="estoque">Sim, consultar</button>
            <button class="btn btn-soft">Amanhã</button>
          </div>
        </section>

        <section class="card" style="background:var(--blue-soft);box-shadow:0 6px 0 #C7D0F7;display:flex;justify-content:space-between;align-items:center;gap:12px;">
          <div>
            <strong style="color:#1E27B8;">Check-in de hoje</strong>
            <div class="subtitle" style="color:#2E38A6;">Registre como está para acompanhar a redução.</div>
          </div>
          <button class="btn btn-soft" id="btn-checkin">Fazer</button>
        </section>

        <section class="card">
          <strong style="font-family:'Bricolage Grotesque',sans-serif;font-size:18px;">Estoque</strong>
          <div style="margin-top:10px;">
            ${state.stocks.map((s) => `
              <div style="display:flex;justify-content:space-between;padding:5px 0;">
                <span>${s.name}</span>
                <strong style="color:${s.days <= 9 ? '#B45309' : 'var(--muted)'};">${s.days} dias</strong>
              </div>
            `).join('')}
          </div>
          <button class="btn-ghost" style="padding-left:0;margin-top:8px;" data-goto="estoque">Ver reposição →</button>
        </section>
      </div>
    </div>
  `;
}

function renderReducao() {
  const med = state.reducaoTab;
  return `
    <h1 class="page-title">Guia de redução</h1>
    <p class="subtitle" style="margin-bottom:20px;">Seu plano, um dia de cada vez. Veja o que fazer hoje, registre como está e revise cada mudança antes de confirmar.</p>

    <div class="sub-tabs" role="tablist">
      <button class="sub-tab ${med === 'Ritalina LA' ? 'active' : ''}" data-reducao="Ritalina LA">Ritalina LA</button>
      <button class="sub-tab ${med === 'Pregabalina' ? 'active' : ''}" data-reducao="Pregabalina">Pregabalina</button>
    </div>

    <div class="grid-2">
      <section class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <strong>${med} · etapa 1 de 1</strong>
          <span class="tag tag-blue">Em acompanhamento</span>
        </div>
        <h2 style="font-family:'Bricolage Grotesque',sans-serif;margin:12px 0 6px;">Você chegou à revisão da última etapa</h2>
        <p class="subtitle">O prazo da última etapa foi cumprido. Combine o próximo passo com seu médico. O app mantém a dose atual.</p>
        <div style="background:var(--blue-soft);padding:16px;border-radius:18px;margin:16px 0;">
          <strong style="color:#1E27B8;">1 unidade por dose · ${med === 'Ritalina LA' ? '08:00 · 13:00' : '08:00 · 17:00'}</strong>
          <div class="subtitle">150 mg</div>
        </div>
        <button class="btn btn-primary" data-goto="hoje">Registrar doses de hoje</button>
      </section>

      <div>
        <section class="card">
          <strong>Montar um plano</strong>
          <p class="subtitle">Cadastre as etapas que o médico passou.</p>
          <div style="display:flex;gap:8px;margin-top:12px;">
            <button class="btn btn-soft">+ Propranolol</button>
            <button class="btn btn-soft">+ Sertralina</button>
          </div>
        </section>
        <section class="card">
          <strong>O que saber</strong>
          <p class="subtitle"><strong>Cápsula LA:</strong> Engula inteira; não mastigue nem esmague as microesferas.</p>
          <p class="subtitle" style="margin-top:8px;"><strong>Sinais comuns:</strong> Cansaço ou humor mais baixo nos primeiros dias. Se persistir, fale com seu médico.</p>
        </section>
      </div>
    </div>
  `;
}

function renderEstoque() {
  const stepLabels = ['Pedir receita', 'Receita em mãos', 'Reservar', 'Retirar'];
  return `
    <h1 class="page-title">Estoque e reposição</h1>
    <p class="subtitle" style="margin-bottom:22px;">O estoque desce sozinho quando você marca uma dose. Os avisos começam 14 dias antes de acabar.</p>

    <div class="grid-3">
      ${state.stocks.map((s, idx) => {
        const pct = Math.min(100, Math.round((s.days / 30) * 100));
        return `
          <section class="card">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">
              <strong>${s.name} ${s.dose}</strong>
              <span class="tag">${s.recipe}</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:baseline;margin-top:12px;">
              <div>
                <div style="font-family:'Bricolage Grotesque',sans-serif;font-size:32px;font-weight:800;color:${s.days <= 9 ? '#B45309' : 'var(--blue)'};">${s.days} dias</div>
                <div class="subtitle" style="margin:0;font-size:13px;">acaba ${s.ends}</div>
              </div>
              <div style="text-align:right;">
                <strong>${s.units} un.</strong>
                <div class="subtitle" style="margin:0;font-size:13px;">${s.perDay} un./dia</div>
              </div>
            </div>
            <div class="progress-bar"><div class="progress-fill ${s.days <= 9 ? 'orange' : ''}" style="width:${pct}%"></div></div>
            <div class="steps-4">
              ${stepLabels.map((lbl, i) => `
                <div class="step-item ${i < s.step ? 'done' : i === s.step ? 'current' : ''}" data-stock-step="${idx}:${i + 1}">
                  <div class="step-dot">${i < s.step ? '✓' : i + 1}</div>
                  <div>${lbl}</div>
                </div>
              `).join('')}
            </div>
            <div style="display:flex;gap:8px;">
              <button class="btn btn-soft" style="flex:1;" data-msg-medico="${s.name}">Msg. médico</button>
              <button class="btn btn-primary" style="flex:1;" data-restock="${idx}">Chegou remédio</button>
            </div>
          </section>`;
      }).join('')}
    </div>

    <section class="card" style="margin-top:24px;">
      <div class="sub-tabs" style="margin-bottom:14px;">
        ${['Consulta', 'Farmácias', 'Mensagens e contatos', 'Receita e entrega'].map((t) => `
          <button class="sub-tab ${state.estoqueSubTab === t ? 'active' : ''}" data-estoque-sub="${t}">${t}</button>
        `).join('')}
      </div>
      <h2 style="font-family:'Bricolage Grotesque',sans-serif;margin:0 0 4px;">Dimena 50 mg (sertralina), laboratorio Lepetit</h2>
      <p class="subtitle" style="margin-bottom:16px;">Associada a Sertralina · 8 farmácias · WHATSAPP</p>
      <div class="chat-layout">
        <div>
          ${['Ferrando', 'Sarti', 'Caruso'].map((ph) => `
            <div class="pharmacy-item ${state.selectedPharmacy === ph ? 'active' : ''}" data-pharmacy="${ph}">
              <strong>${ph}</strong><br/>
              <span class="tag tag-gold">Favorita</span>
              <span class="tag tag-blue">WhatsApp verificado</span>
            </div>
          `).join('')}
        </div>
        <div class="chat-box">
          <strong>${state.selectedPharmacy} (+5492215344069)</strong>
          <div class="msg-out">Hola, buenas.</div>
          <div class="msg-out">Tienen Dimena 50 mg (sertralina), laboratorio Lepetit? Cuánto sale con el descuento?</div>
        </div>
      </div>
    </section>
  `;
}

function renderSimpleTab(title, desc) {
  return `
    <h1 class="page-title">${title}</h1>
    <p class="subtitle" style="margin-bottom:20px;">${desc}</p>
    <section class="card">
      <div style="display:flex;align-items:center;gap:16px;">
        ${piluSvg(72, 'wow')}
        <p style="margin:0;">Módulo <strong>${title}</strong> integrado ao redesign gamificado.</p>
      </div>
    </section>
  `;
}

function render() {
  document.getElementById('header-streak').textContent = String(state.streakDays);
  document.querySelectorAll('.nav-tab').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tab === state.activeTab);
  });

  const main = document.getElementById('app-main');
  if (state.activeTab === 'hoje') main.innerHTML = renderHoje();
  else if (state.activeTab === 'reducao') main.innerHTML = renderReducao();
  else if (state.activeTab === 'estoque') main.innerHTML = renderEstoque();
  else if (state.activeTab === 'alertas') main.innerHTML = renderSimpleTab('Alertas', 'Lembretes de doses, receitas e estoque baixo.');
  else if (state.activeTab === 'assistente') main.innerHTML = renderSimpleTab('Assistente', 'Pílu e automações de consulta em farmácias.');
  else main.innerHTML = renderSimpleTab('Ajustes & Remédios', 'Preferências, notificações e lista de medicamentos.');

  bindEvents();
}

function bindEvents() {
  document.querySelectorAll('[data-action="take"]').forEach((b) => { b.onclick = () => markDose(b.dataset.id, 'taken'); });
  document.querySelectorAll('[data-action="skip"]').forEach((b) => { b.onclick = () => markDose(b.dataset.id, 'skipped'); });
  document.querySelectorAll('[data-goto]').forEach((b) => { b.onclick = () => { state.activeTab = b.dataset.goto; saveState(); render(); }; });
  document.querySelectorAll('[data-reducao]').forEach((b) => { b.onclick = () => { state.reducaoTab = b.dataset.reducao; render(); }; });
  document.querySelectorAll('[data-estoque-sub]').forEach((b) => { b.onclick = () => { state.estoqueSubTab = b.dataset.estoqueSub; render(); }; });
  document.querySelectorAll('[data-pharmacy]').forEach((b) => { b.onclick = () => { state.selectedPharmacy = b.dataset.pharmacy; render(); }; });
  document.querySelectorAll('[data-skin]').forEach((b) => { b.onclick = () => { state.piluColor = b.dataset.skin; saveState(); render(); }; });
  document.querySelectorAll('[data-restock]').forEach((b) => {
    b.onclick = () => {
      const idx = Number(b.dataset.restock);
      state.stocks[idx].units += 30;
      state.stocks[idx].days = Math.floor(state.stocks[idx].units / Math.max(1, state.stocks[idx].perDay));
      state.stocks[idx].step = 0;
      saveState();
      render();
    };
  });
  document.querySelectorAll('[data-stock-step]').forEach((b) => {
    b.onclick = () => {
      const [idx, step] = b.dataset.stockStep.split(':').map(Number);
      state.stocks[idx].step = step;
      saveState();
      render();
    };
  });
  document.querySelectorAll('[data-msg-medico]').forEach((b) => {
    b.onclick = () => openModal(`Mensagem ao médico — ${b.dataset.msgMedico}`, `<p>Olá! Gostaria de solicitar a renovação da receita de <strong>${b.dataset.msgMedico}</strong>.</p>`);
  });

  const undoBtn = document.getElementById('btn-undo-day');
  if (undoBtn) undoBtn.onclick = undoLastDose;

  const checkinBtn = document.getElementById('btn-checkin');
  if (checkinBtn) {
    checkinBtn.onclick = () => {
      openModal(
        'Check-in de hoje',
        `<p>Como você está se sentindo hoje?</p><textarea id="checkin-input" rows="3" style="width:100%;padding:10px;border-radius:12px;border:1px solid #d1d5db;">${state.checkinNote}</textarea>`,
        '<button class="btn btn-primary" id="save-checkin">Salvar check-in</button>'
      );
      document.getElementById('save-checkin').onclick = () => {
        state.checkinNote = document.getElementById('checkin-input').value;
        saveState();
        closeModal();
      };
    };
  }
}

document.querySelectorAll('.nav-tab, .more-btn').forEach((btn) => {
  btn.onclick = () => {
    state.activeTab = btn.dataset.tab;
    saveState();
    render();
  };
});

loadInitialState();
