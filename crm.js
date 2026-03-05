const STORAGE_KEY = 'crm_enterprise_app_v3';
const stages = ['MQL', 'SQL', 'Discovery', 'Proposal', 'Won'];
const industryWeights = { ai: 25, saas: 20, ecommerce: 15 };

const defaultState = {
  quota: 12000,
  currentUser: { id: 'u_admin', role: 'admin', team: 'A' },
  leads: [],
  accounts: [],
  contacts: [],
  opportunities: [
    { id: crypto.randomUUID(), ownerId: 'u_admin', ownerTeam: 'A', name: 'Implementación CRM IA', stage: 'SQL', amount: 4200, lastActivityDays: 2 },
    { id: crypto.randomUUID(), ownerId: 'u_sales_1', ownerTeam: 'A', name: 'Automatización cobranzas WA', stage: 'Proposal', amount: 6800, lastActivityDays: 10 }
  ],
  tasks: [],
  subscriptions: [{ id: crypto.randomUUID(), name: 'Plan Enterprise', mrr: 2500 }],
  expenses: [{ id: crypto.randomUUID(), name: 'Payroll', cost: 1500 }],
  invoices: [],
  webhooks: [{ id: crypto.randomUUID(), event: 'invoice.overdue', status: 'failed', retries: 1 }],
  apiKeys: [],
  activities: [{ channel: 'system', text: 'CRM iniciado', ts: new Date().toISOString() }]
};

const state = loadState();
const $ = (id) => document.getElementById(id);
const money = (v) => `$${Math.round(v).toLocaleString('en-US')}`;

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return structuredClone(defaultState);
  try { return { ...structuredClone(defaultState), ...JSON.parse(raw) }; } catch { return structuredClone(defaultState); }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  log('audit', `state.save by ${state.currentUser.role}`);
}

function log(channel, text) {
  state.activities.unshift({ channel, text, ts: new Date().toISOString() });
  state.activities = state.activities.slice(0, 180);
  renderActivities();
}

function scopeOpps() {
  if (state.currentUser.role === 'admin') return state.opportunities;
  if (state.currentUser.role === 'manager') return state.opportunities.filter((o) => o.ownerTeam === state.currentUser.team);
  return state.opportunities.filter((o) => o.ownerId === state.currentUser.id);
}

function scoreLead(industry, budget, behavior) {
  return Math.min(100, (industryWeights[industry] || 10) + Number(behavior) * 0.5 + Math.min(40, Number(budget) / 200));
}

function parseCustomField(raw) {
  if (!raw || !raw.includes('=')) return {};
  const [key, value] = raw.split('=');
  return { [key.trim()]: value.trim() };
}

function atomicLeadConversion(lead) {
  const account = { id: crypto.randomUUID(), name: `${lead.name} Account`, custom: lead.custom };
  const contact = { id: crypto.randomUUID(), accountId: account.id, name: lead.name };
  const opportunity = {
    id: crypto.randomUUID(),
    ownerId: state.currentUser.id,
    ownerTeam: state.currentUser.team,
    name: `${lead.name} - Deal`,
    stage: 'MQL',
    amount: Math.max(1000, Math.round(lead.budget * 1.5)),
    lastActivityDays: 0
  };
  const task = { id: crypto.randomUUID(), title: `Onboarding ${lead.name}`, status: 'open' };

  state.accounts.push(account);
  state.contacts.push(contact);
  state.opportunities.push(opportunity);
  state.tasks.push(task);
  log('audit', `lead.convert ${lead.name} by ${state.currentUser.role}`);
}

function renderLeads() {
  $('leadList').innerHTML = state.leads.slice(0, 10).map((lead) => {
    const custom = Object.entries(lead.custom || {}).map(([k, v]) => `${k}:${v}`).join(', ');
    return `<li class="border border-line rounded p-2 bg-slate-900">${lead.name} · score ${lead.score.toFixed(1)} ${custom ? `· ${custom}` : ''}</li>`;
  }).join('');
}

function renderKanban() {
  const visible = scopeOpps();
  $('kpiStale').textContent = visible.filter((o) => o.stage !== 'Won' && o.lastActivityDays > 7).length;

  $('kanban').innerHTML = stages.map((stage) => {
    const deals = visible.filter((o) => o.stage === stage);
    const stale = deals.some((d) => d.lastActivityDays > 7 && d.stage !== 'Won');
    return `<div class="kanban-column bg-slate-900 border border-line rounded p-2" data-stage="${stage}" data-stale="${stale}">
      <h3 class="font-medium mb-2">${stage} <span class="text-slate-400 text-xs">(${deals.length})</span></h3>
      <div class="min-h-[100px] space-y-2">${deals.map((d) => `<article draggable="true" class="deal border border-line rounded p-2 bg-slate-950" data-id="${d.id}">
        <p>${d.name}</p><p class="text-xs text-slate-400">${money(d.amount)} · ${d.lastActivityDays}d</p>
      </article>`).join('')}</div>
    </div>`;
  }).join('');

  document.querySelectorAll('.deal').forEach((dealEl) => {
    dealEl.addEventListener('dragstart', () => dealEl.classList.add('dragging'));
    dealEl.addEventListener('dragend', () => dealEl.classList.remove('dragging'));
  });

  document.querySelectorAll('.kanban-column').forEach((col) => {
    col.addEventListener('dragover', (e) => e.preventDefault());
    col.addEventListener('drop', () => {
      const dragging = document.querySelector('.deal.dragging');
      if (!dragging) return;
      const opp = state.opportunities.find((o) => o.id === dragging.dataset.id);
      if (!opp) return;
      opp.stage = col.dataset.stage;
      opp.lastActivityDays = 0;
      log('audit', `opp.move ${opp.name} -> ${opp.stage} by ${state.currentUser.role}`);
      renderKanban();
      renderKPIs();
    });
  });
}

function renderFinance() {
  const items = [...state.subscriptions.map((s) => `Ingreso ${s.name}: ${money(s.mrr)}`), ...state.expenses.map((e) => `Gasto ${e.name}: ${money(e.cost)}`)];
  $('financeList').innerHTML = items.map((line) => `<li class="border border-line rounded p-2 bg-slate-900 text-xs">${line}</li>`).join('');
}

function renderInvoices() {
  $('invoiceList').innerHTML = state.invoices.slice(0, 10).map((i) =>
    `<li class="border border-line rounded p-2 bg-slate-900">${i.id.slice(0, 6)} · ${i.subscription} · ${money(i.amount)} · ${i.status}</li>`
  ).join('');
}

function renderIntegrations() {
  const api = state.apiKeys.slice(-3).map((k) => `api_key ${k.name}: ****${k.token.slice(-4)}`);
  const hooks = state.webhooks.map((w) => `webhook ${w.event}: ${w.status} (r${w.retries})`);
  $('integrationList').innerHTML = [...api, ...hooks].map((line) => `<li class="border border-line rounded p-2 bg-slate-900">${line}</li>`).join('');
}

function renderActivities() {
  $('activityLog').innerHTML = state.activities.slice(0, 20).map((a) => `<li class="border border-line rounded p-2 bg-slate-900"><strong class="text-cyan-300">${a.channel}</strong> · ${a.text}</li>`).join('');
}

function renderKPIs() {
  const mrr = state.subscriptions.reduce((acc, s) => acc + s.mrr, 0);
  const costs = state.expenses.reduce((acc, e) => acc + e.cost, 0);
  const ebitda = mrr - costs;
  const roi = costs ? ((mrr - costs) / costs) * 100 : 0;
  const scoped = scopeOpps();
  const forecast = scoped.filter((o) => o.stage !== 'Won').reduce((acc, o) => acc + o.amount * 0.35, 0) + scoped.filter((o) => o.stage === 'Won').reduce((acc, o) => acc + o.amount, 0);

  $('kpiMRR').textContent = money(mrr);
  $('kpiARR').textContent = money(mrr * 12);
  $('kpiEBITDA').textContent = money(ebitda);
  $('kpiROI').textContent = `${roi.toFixed(1)}%`;
  $('kpiForecast').textContent = `${money(forecast)} / ${money(state.quota)}`;
}

function generateInvoices() {
  state.subscriptions.forEach((sub) => {
    const prorate = Math.random() > 0.7 ? 0.5 : 1;
    state.invoices.unshift({
      id: crypto.randomUUID(),
      subscription: sub.name,
      amount: Math.round(sub.mrr * prorate),
      status: 'issued',
      cycle: new Date().toISOString().slice(0, 7)
    });
  });
  state.invoices = state.invoices.slice(0, 80);
  renderInvoices();
  log('finance', `invoices.generated count=${state.subscriptions.length}`);
}

function markOverdueAndNotify() {
  let total = 0;
  state.invoices.forEach((i) => {
    if (i.status === 'issued') { i.status = 'overdue'; total += 1; }
  });
  log('whatsapp', `recordatorios D+1 enviados para ${total} facturas vencidas`);
  renderInvoices();
}

function exportJSON() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'crm-export.json'; a.click(); URL.revokeObjectURL(url);
  log('export', 'json.export');
}

function exportCSV() {
  const rows = [['id','name','stage','amount','lastActivityDays'], ...state.opportunities.map((o) => [o.id,o.name,o.stage,o.amount,o.lastActivityDays])];
  const csv = rows.map((r) => r.map((v) => `"${String(v).replaceAll('"','""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'opportunities.csv'; a.click(); URL.revokeObjectURL(url);
  log('export', 'csv.export.opportunities');
}

$('roleFilter').addEventListener('change', (e) => {
  const role = e.target.value;
  state.currentUser = role === 'admin' ? { id: 'u_admin', role, team: 'A' } : role === 'manager' ? { id: 'u_manager_1', role, team: 'A' } : { id: 'u_sales_1', role, team: 'A' };
  log('audit', `role.switch -> ${role}`);
  renderKanban();
  renderKPIs();
});

$('leadForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const lead = {
    id: crypto.randomUUID(),
    name: String(fd.get('name')).trim(),
    industry: String(fd.get('industry')),
    budget: Number(fd.get('budget')),
    behavior: Number(fd.get('behavior')),
    custom: parseCustomField(String(fd.get('custom') || ''))
  };
  lead.score = scoreLead(lead.industry, lead.budget, lead.behavior);
  state.leads.unshift(lead);
  atomicLeadConversion(lead);
  renderLeads(); renderKanban(); renderKPIs();
  log('lead', `lead.create ${lead.name} score=${lead.score.toFixed(1)}`);
  e.target.reset();
});

$('detectStale').addEventListener('click', () => { state.opportunities.forEach((o) => { if (o.stage !== 'Won') o.lastActivityDays += 2; }); renderKanban(); log('ops', 'stale.simulation +2d'); });
$('runWorkflow').addEventListener('click', () => {
  const staleDeals = scopeOpps().filter((o) => o.stage !== 'Won' && o.lastActivityDays > 7);
  if (!staleDeals.length) return log('workflow', 'if stale then no-op');
  staleDeals.forEach((d) => log('workflow', `if stale then task+alert ${d.name}`));
});

$('addSub').addEventListener('click', () => {
  const name = $('subName').value.trim(); const mrr = Number($('subMrr').value); if (!name || !mrr) return;
  state.subscriptions.push({ id: crypto.randomUUID(), name, mrr }); $('subName').value = ''; $('subMrr').value = '';
  renderFinance(); renderKPIs(); log('finance', `subscription.add ${name}`);
});
$('addExpense').addEventListener('click', () => {
  const name = $('expenseName').value.trim(); const cost = Number($('expenseVal').value); if (!name || !cost) return;
  state.expenses.push({ id: crypto.randomUUID(), name, cost }); $('expenseName').value = ''; $('expenseVal').value = '';
  renderFinance(); renderKPIs(); log('finance', `expense.add ${name}`);
});

$('genInvoices').addEventListener('click', generateInvoices);
$('markOverdue').addEventListener('click', markOverdueAndNotify);
$('retryWebhook').addEventListener('click', () => {
  state.webhooks.forEach((w) => { if (w.status === 'failed') { w.retries += 1; w.status = w.retries >= 2 ? 'delivered' : 'failed'; } });
  renderIntegrations(); log('webhook', 'retry.run');
});
$('newApiKey').addEventListener('click', () => {
  const token = crypto.randomUUID().replaceAll('-', ''); state.apiKeys.push({ id: crypto.randomUUID(), name: `key_${state.apiKeys.length + 1}`, token });
  renderIntegrations(); log('api', 'key.generated scopes=leads:write,invoices:read');
});
$('sendWhatsapp').addEventListener('click', () => log('whatsapp', 'hsm.send reminder_template'));
$('exportJSON').addEventListener('click', exportJSON);
$('exportCSV').addEventListener('click', exportCSV);
$('saveState').addEventListener('click', saveState);

const palette = $('palette');
const openPalette = () => { palette.classList.remove('hidden'); palette.classList.add('flex'); $('cmdInput').focus(); };
const closePalette = () => { palette.classList.add('hidden'); palette.classList.remove('flex'); };
$('cmdButton').addEventListener('click', openPalette);
document.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openPalette(); }
  if (e.key === 'Escape') closePalette();
});
$('cmdInput').addEventListener('keydown', (e) => {
  if (e.key !== 'Enter') return;
  const cmd = e.target.value.trim().toLowerCase();
  if (cmd === 'new lead') $('leadForm').querySelector('input[name="name"]').focus();
  if (cmd === 'stale') $('detectStale').click();
  if (cmd === 'finance') $('subName').focus();
  if (cmd === 'whatsapp') $('sendWhatsapp').click();
  if (cmd === 'invoices') $('genInvoices').click();
  if (cmd === 'export') exportJSON();
  log('cmdk', `command.run ${cmd}`);
  e.target.value = ''; closePalette();
});

renderLeads();
renderKanban();
renderFinance();
renderInvoices();
renderIntegrations();
renderActivities();
renderKPIs();
