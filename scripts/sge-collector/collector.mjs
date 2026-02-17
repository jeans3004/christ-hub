/**
 * SGE (e-aluno) Collector - Pure HTTP (sem browser)
 *
 * Faz login no SGE, navega por todos os endpoints de chamadas.php,
 * captura TODA troca HTTP (request/response/headers/bodies),
 * baixa HTML e JS da pagina, e gera relatorio completo.
 *
 * Uso:
 *   cd scripts/sge-collector
 *   SGE_USER=seu_cpf SGE_PASS=sua_senha node collector.mjs
 *
 * Zero dependencias externas - usa fetch nativo do Node 18+.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT = path.join(__dirname, 'output');
const BASE = 'https://e-aluno.com.br/christ/diario';

// ========== Data stores ==========
const httpLog = [];      // Every request/response
const endpoints = {};    // Grouped by PHP file

function log(step, total, msg) {
  console.log(`  [${step}/${total}] ${msg}`);
}

// ========== HTTP helper: tracked fetch ==========
async function trackedFetch(url, options = {}, label = '') {
  const entry = {
    label,
    ts: new Date().toISOString(),
    method: options.method || 'GET',
    url,
    requestHeaders: options.headers || {},
    requestBody: options.body || null,
  };

  try {
    const res = await fetch(url, { ...options, redirect: 'manual' });

    // Collect all response headers
    const resHeaders = {};
    res.headers.forEach((v, k) => { resHeaders[k] = v; });

    // Collect Set-Cookie separately (multiple values)
    const setCookies = res.headers.getSetCookie?.() || [];

    let body = null;
    try { body = await res.text(); } catch {}

    entry.status = res.status;
    entry.responseHeaders = resHeaders;
    entry.setCookies = setCookies;
    entry.responseBody = body;
    entry.responseLength = body?.length || 0;
    entry.redirectUrl = res.headers.get('location') || null;
  } catch (err) {
    entry.error = err.message;
  }

  httpLog.push(entry);

  // Categorize
  try {
    const file = new URL(url).pathname.split('/').pop();
    if (!endpoints[file]) endpoints[file] = [];
    endpoints[file].push(entry);
  } catch {}

  return entry;
}

// ========== Main ==========
async function main() {
  const user = process.env.SGE_USER?.replace(/[^a-zA-Z0-9]/g, '');
  const pass = process.env.SGE_PASS;

  if (!user || !pass) {
    console.error('\n  Uso: SGE_USER=seu_cpf SGE_PASS=sua_senha node collector.mjs\n');
    process.exit(1);
  }

  fs.mkdirSync(OUTPUT, { recursive: true });
  console.log('\n  SGE Collector (HTTP) - Iniciando coleta completa...\n');

  const STEPS = 8;
  let cookie = '';

  // ===== 1. LOGIN PAGE (GET) =====
  log(1, STEPS, 'Baixando pagina de login...');

  const loginPage = await trackedFetch(`${BASE}/index.html`, {}, 'login-page-GET');
  if (loginPage.responseBody) {
    fs.writeFileSync(path.join(OUTPUT, 'login-page.html'), loginPage.responseBody);
    console.log(`    ✓ index.html (${loginPage.responseLength} bytes)`);
  }

  // ===== 2. LOGIN (POST) =====
  log(2, STEPS, 'Autenticando...');

  const loginRes = await trackedFetch(`${BASE}/flogin.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `user=${encodeURIComponent(user)}&user_password=${encodeURIComponent(pass)}`,
  }, 'login-POST');

  // Extract session cookie
  const sessionCookies = (loginRes.setCookies || []).map(c => c.split(';')[0]).filter(Boolean);
  cookie = sessionCookies.join('; ');

  const loginOk = loginRes.responseBody?.trim() === '0';
  console.log(`    → Status: ${loginRes.status}`);
  console.log(`    → Body: "${loginRes.responseBody?.trim()}"`);
  console.log(`    → Cookies: ${cookie || '(nenhum)'}`);
  console.log(`    → Login: ${loginOk ? 'OK' : 'FALHOU'}`);

  if (!loginOk || !cookie) {
    console.error('\n  ✗ Login falhou. Verifique CPF e senha.\n');
    saveAll();
    process.exit(1);
  }

  const headers = (extra = {}) => ({
    Cookie: cookie,
    'X-Requested-With': 'XMLHttpRequest',
    ...extra,
  });

  const postHeaders = (extra = {}) => ({
    Cookie: cookie,
    'Content-Type': 'application/x-www-form-urlencoded',
    'X-Requested-With': 'XMLHttpRequest',
    ...extra,
  });

  // ===== 3. CHAMADAS.PHP (pagina principal) =====
  log(3, STEPS, 'Baixando chamadas.php (pagina principal)...');

  const chamadasPage = await trackedFetch(`${BASE}/chamadas.php`, {
    headers: { Cookie: cookie },
  }, 'chamadas-GET');

  if (chamadasPage.responseBody) {
    fs.writeFileSync(path.join(OUTPUT, 'chamadas-page.html'), chamadasPage.responseBody);
    console.log(`    ✓ ${chamadasPage.responseLength} bytes`);

    // Check if session valid
    if (chamadasPage.responseBody.includes("location.href='index.html'")) {
      console.error('    ✗ Sessao expirada!');
      saveAll();
      process.exit(1);
    }
  }

  // ===== 4. PARSE HTML: extrair selects, forms, scripts =====
  log(4, STEPS, 'Extraindo estrutura da pagina...');

  const html = chamadasPage.responseBody || '';
  const pageStructure = {
    selects: parseSelects(html),
    forms: parseForms(html),
    inputs: parseInputs(html),
    buttons: parseButtons(html),
    scripts: parseScripts(html),
    links: parseLinks(html),
  };

  fs.writeFileSync(path.join(OUTPUT, 'page-structure.json'), JSON.stringify(pageStructure, null, 2));

  // Extract inline JS
  const inlineJs = pageStructure.scripts
    .filter(s => s.type === 'inline')
    .map((s, i) => `// ========== INLINE SCRIPT #${i + 1} ==========\n${s.content}`)
    .join('\n\n');
  fs.writeFileSync(path.join(OUTPUT, 'inline-scripts.js'), inlineJs);

  console.log(`    ✓ ${pageStructure.selects.length} selects, ${pageStructure.inputs.length} inputs`);
  console.log(`    ✓ ${pageStructure.scripts.filter(s => s.type === 'inline').length} inline scripts`);
  console.log(`    ✓ ${pageStructure.scripts.filter(s => s.type === 'external').length} external scripts`);

  // Download external scripts
  for (const s of pageStructure.scripts.filter(s => s.type === 'external')) {
    const src = s.src.startsWith('http') ? s.src : `${BASE}/${s.src.replace(/^\.\//, '')}`;
    const filename = s.src.split('/').pop().split('?')[0];
    console.log(`    → Baixando: ${filename}...`);

    const scriptRes = await trackedFetch(src, { headers: { Cookie: cookie } }, `script-${filename}`);
    if (scriptRes.responseBody) {
      fs.writeFileSync(path.join(OUTPUT, `ext-${filename}`), scriptRes.responseBody);
      console.log(`      ✓ ${scriptRes.responseLength} bytes`);
    }
  }

  // ===== 5. PARSE cmbSerie + FETCH DISCIPLINAS =====
  log(5, STEPS, 'Extraindo series e disciplinas...');

  const cmbSerie = pageStructure.selects.find(s => s.id === 'cmbSerie' || s.name === 'cmbSerie');
  const serieOptions = cmbSerie?.options.filter(o => o.value && o.value !== '' && o.value !== '0') || [];

  console.log(`    ✓ ${serieOptions.length} series/turmas`);
  for (const o of serieOptions) {
    console.log(`      - value=${o.value} turma=${o.attrs?.['data-code']} turno="${o.attrs?.['data-name']}" label="${o.text}"`);
  }

  // Fetch disciplinas for EACH serie (to map all combinations)
  const today = new Date();
  const ano = today.getFullYear();
  const allDisciplinas = {};

  for (const serie of serieOptions.slice(0, 5)) { // primeiras 5 para nao sobrecarregar
    const turma = serie.attrs?.['data-code'] || '';
    const turno = serie.attrs?.['data-name'] || '';

    console.log(`    → Disciplinas para "${serie.text}"...`);
    const discRes = await trackedFetch(`${BASE}/get_disciplinas_chamada.php`, {
      method: 'POST',
      headers: postHeaders(),
      body: `serie=${serie.value}&turma=${turma}&turno=${encodeURIComponent(turno)}&ano=${ano}&show=1`,
    }, `disciplinas-serie${serie.value}`);

    if (discRes.responseBody) {
      try {
        const discs = JSON.parse(discRes.responseBody);
        allDisciplinas[serie.value] = { serie: serie.text, turma, turno, disciplinas: discs };
        console.log(`      ✓ ${discs.length} disciplinas: ${discs.map(d => d.descricao || d.nome).join(', ')}`);
      } catch {
        allDisciplinas[serie.value] = { raw: discRes.responseBody };
        console.log(`      ✓ Resposta (nao-JSON): ${discRes.responseBody.substring(0, 200)}`);
      }
    }
  }

  fs.writeFileSync(path.join(OUTPUT, 'disciplinas-all.json'), JSON.stringify(allDisciplinas, null, 2));

  // ===== 6. SHOW_CHAMADAS.PHP - Carregar chamada para cada aula =====
  log(6, STEPS, 'Buscando show_chamadas.php (aulas 1-7)...');

  // Use first serie/disciplina for detailed capture
  const testSerie = serieOptions[0];
  const testTurma = testSerie?.attrs?.['data-code'] || '';
  const testTurno = testSerie?.attrs?.['data-name'] || '';
  const firstDiscs = allDisciplinas[testSerie?.value];
  let testDisc = null;

  if (firstDiscs?.disciplinas?.length > 0) {
    testDisc = firstDiscs.disciplinas[0];
  }

  const todayBR = `${pad(today.getDate())}/${pad(today.getMonth() + 1)}/${ano}`;
  const todayISO = today.toISOString().split('T')[0];

  if (testSerie && testDisc) {
    const discId = testDisc.disciplina || testDisc.id;
    console.log(`    Turma: "${testSerie.text}" | Disciplina: "${testDisc.descricao || testDisc.nome}" | Data: ${todayBR}`);

    for (let aula = 1; aula <= 7; aula++) {
      const showUrl = `${BASE}/show_chamadas.php?serie=${testSerie.value}&turma=${testTurma}&turno=${encodeURIComponent(testTurno)}&ano=${ano}`;

      const showRes = await trackedFetch(showUrl, {
        method: 'POST',
        headers: postHeaders(),
        body: `data=${encodeURIComponent(todayBR)}&disciplina=${discId}&aula=${aula}&show=1`,
      }, `show-chamada-aula${aula}`);

      if (showRes.responseBody) {
        fs.writeFileSync(path.join(OUTPUT, `show-chamada-aula-${aula}.html`), showRes.responseBody);
        const hasStudents = showRes.responseBody.includes('openOcorrencia') || showRes.responseBody.includes('checkbox');
        const hasChecked = showRes.responseBody.includes('checked');
        console.log(`    → Aula ${aula}: ${showRes.responseLength} bytes | alunos: ${hasStudents ? 'SIM' : 'nao'} | chamada feita: ${hasChecked ? 'SIM' : 'nao'}`);
      } else {
        console.log(`    → Aula ${aula}: sem resposta`);
      }
    }

    // Tambem testar com datas passadas (ultimos 3 dias uteis)
    console.log(`    → Testando datas recentes...`);
    for (let daysBack = 1; daysBack <= 5; daysBack++) {
      const pastDate = new Date(today);
      pastDate.setDate(pastDate.getDate() - daysBack);
      if (pastDate.getDay() === 0 || pastDate.getDay() === 6) continue; // Skip weekends

      const pastBR = `${pad(pastDate.getDate())}/${pad(pastDate.getMonth() + 1)}/${pastDate.getFullYear()}`;
      const pastISO = `${pastDate.getFullYear()}-${pad(pastDate.getMonth() + 1)}-${pad(pastDate.getDate())}`;

      // Try aula 1 and 2
      for (const aula of [1, 2]) {
        const showUrl = `${BASE}/show_chamadas.php?serie=${testSerie.value}&turma=${testTurma}&turno=${encodeURIComponent(testTurno)}&ano=${ano}`;
        const showRes = await trackedFetch(showUrl, {
          method: 'POST',
          headers: postHeaders(),
          body: `data=${encodeURIComponent(pastBR)}&disciplina=${testDisc.disciplina || testDisc.id}&aula=${aula}&show=1`,
        }, `show-chamada-${pastISO}-aula${aula}`);

        if (showRes.responseBody) {
          const hasChecked = showRes.responseBody.includes('checked');
          if (hasChecked) {
            fs.writeFileSync(path.join(OUTPUT, `show-chamada-${pastISO}-aula${aula}.html`), showRes.responseBody);
            console.log(`      ${pastBR} aula ${aula}: ✓ CHAMADA ENCONTRADA (${showRes.responseLength} bytes)`);
          } else {
            console.log(`      ${pastBR} aula ${aula}: sem chamada`);
          }
        }
      }
    }
  } else {
    console.log('    ✗ Sem serie/disciplina para testar');
  }

  // ===== 7. PAGINAS DE RELATORIO =====
  log(7, STEPS, 'Buscando paginas de relatorio...');

  // relatorio_detalhamento_chamada.php - A PRINCIPAL
  if (testSerie && testDisc) {
    const discId = testDisc.disciplina || testDisc.id;

    // Sem aula param
    const detUrl1 = `${BASE}/relatorio_detalhamento_chamada.php?serie=${testSerie.value}&turma=${testTurma}&turno=${encodeURIComponent(testTurno)}&disciplina=${discId}&data=${todayISO}&ano=${ano}&txtSerie=${encodeURIComponent(testSerie.text)}`;
    console.log(`    → relatorio_detalhamento_chamada.php (sem aula)...`);
    const det1 = await trackedFetch(detUrl1, { headers: { Cookie: cookie } }, 'relatorio-detalhamento-sem-aula');
    if (det1.responseBody) {
      fs.writeFileSync(path.join(OUTPUT, 'relatorio-detalhamento.html'), det1.responseBody);
      console.log(`      ✓ ${det1.responseLength} bytes`);
    }

    // Com aula param
    for (const aula of [1, 2, 3]) {
      const detUrl = `${BASE}/relatorio_detalhamento_chamada.php?serie=${testSerie.value}&turma=${testTurma}&turno=${encodeURIComponent(testTurno)}&disciplina=${discId}&data=${todayISO}&aula=${aula}&ano=${ano}&txtSerie=${encodeURIComponent(testSerie.text)}`;
      console.log(`    → relatorio_detalhamento_chamada.php (aula=${aula})...`);
      const det = await trackedFetch(detUrl, { headers: { Cookie: cookie } }, `relatorio-detalhamento-aula${aula}`);
      if (det.responseBody) {
        fs.writeFileSync(path.join(OUTPUT, `relatorio-detalhamento-aula${aula}.html`), det.responseBody);
        console.log(`      ✓ ${det.responseLength} bytes`);
      }
    }

    // Tentar com datas passadas que tem chamada
    for (let daysBack = 1; daysBack <= 5; daysBack++) {
      const pastDate = new Date(today);
      pastDate.setDate(pastDate.getDate() - daysBack);
      if (pastDate.getDay() === 0 || pastDate.getDay() === 6) continue;

      const pastISO = `${pastDate.getFullYear()}-${pad(pastDate.getMonth() + 1)}-${pad(pastDate.getDate())}`;
      const detUrl = `${BASE}/relatorio_detalhamento_chamada.php?serie=${testSerie.value}&turma=${testTurma}&turno=${encodeURIComponent(testTurno)}&disciplina=${discId}&data=${pastISO}&ano=${ano}&txtSerie=${encodeURIComponent(testSerie.text)}`;
      console.log(`    → detalhamento ${pastISO}...`);
      const det = await trackedFetch(detUrl, { headers: { Cookie: cookie } }, `relatorio-detalhamento-${pastISO}`);
      if (det.responseBody && det.responseBody.length > 500) {
        fs.writeFileSync(path.join(OUTPUT, `relatorio-detalhamento-${pastISO}.html`), det.responseBody);
        console.log(`      ✓ ${det.responseLength} bytes`);
      } else {
        console.log(`      - vazio ou pequeno`);
      }
    }
  }

  // Outros endpoints de relatorio
  const otherReports = [
    'relatorio_espelho_chamada.php',
    'relatorio_mensal_chamada.php',
    'relatorio_chamadas.php',
    'relatorio_faltas.php',
  ];

  for (const rp of otherReports) {
    console.log(`    → ${rp}...`);
    const res = await trackedFetch(`${BASE}/${rp}`, { headers: { Cookie: cookie } }, `report-${rp}`);
    if (res.responseBody && !res.responseBody.includes("location.href='index.html'")) {
      fs.writeFileSync(path.join(OUTPUT, `report-${rp.replace('.php', '')}.html`), res.responseBody);
      console.log(`      ✓ ${res.responseLength} bytes`);
    } else {
      console.log(`      - precisa de parametros ou redirecionou`);
    }
  }

  // ===== 8. OUTROS ENDPOINTS (insert, etc - apenas GET para ver estrutura) =====
  log(8, STEPS, 'Explorando outros endpoints...');

  const otherEndpoints = [
    'insert_chamada.php',
    'get_alunos.php',
    'get_turmas.php',
    'get_series.php',
    'save_chamada.php',
    'salvar_chamada.php',
    'conteudo.php',
    'ocorrencias.php',
    'frequencia.php',
  ];

  for (const ep of otherEndpoints) {
    const res = await trackedFetch(`${BASE}/${ep}`, { headers: { Cookie: cookie } }, `explore-${ep}`);
    if (res.status === 200 && res.responseBody && !res.responseBody.includes("location.href='index.html'")) {
      fs.writeFileSync(path.join(OUTPUT, `explore-${ep.replace('.php', '')}.html`), res.responseBody);
      console.log(`    ✓ ${ep}: ${res.responseLength} bytes (status ${res.status})`);
    } else {
      console.log(`    - ${ep}: status ${res.status || 'erro'} (${res.responseLength || 0} bytes)`);
    }
  }

  // ===== SAVE =====
  saveAll();

  console.log('\n  ✅ Coleta finalizada! Arquivos em scripts/sge-collector/output/\n');
  console.log('  Copie o conteudo de output/relatorio.md e cole para o Claude.\n');
}

// ========== Save all data ==========
function saveAll() {
  fs.writeFileSync(path.join(OUTPUT, 'http-log.json'), JSON.stringify(httpLog, null, 2));
  fs.writeFileSync(path.join(OUTPUT, 'endpoints.json'), JSON.stringify(endpoints, null, 2));
  generateReport();
}

// ========== HTML Parsing Helpers ==========

function parseSelects(html) {
  const results = [];
  const selectRegex = /<select([^>]*)>([\s\S]*?)<\/select>/gi;
  let match;

  while ((match = selectRegex.exec(html)) !== null) {
    const attrs = parseAttrs(match[1]);
    const optionsHtml = match[2];
    const options = [];

    const optRegex = /<option([^>]*)>([\s\S]*?)<\/option>/gi;
    let optMatch;
    while ((optMatch = optRegex.exec(optionsHtml)) !== null) {
      const optAttrs = parseAttrs(optMatch[1]);
      options.push({
        value: optAttrs.value || '',
        text: optMatch[2].trim(),
        attrs: optAttrs,
      });
    }

    results.push({
      id: attrs.id || '',
      name: attrs.name || '',
      className: attrs.class || '',
      onchange: attrs.onchange || '',
      options,
    });
  }
  return results;
}

function parseForms(html) {
  const results = [];
  const formRegex = /<form([^>]*)>/gi;
  let match;
  while ((match = formRegex.exec(html)) !== null) {
    const attrs = parseAttrs(match[1]);
    results.push({ id: attrs.id, name: attrs.name, action: attrs.action, method: attrs.method });
  }
  return results;
}

function parseInputs(html) {
  const results = [];
  const inputRegex = /<input([^>]*)>/gi;
  let match;
  while ((match = inputRegex.exec(html)) !== null) {
    const attrs = parseAttrs(match[1]);
    results.push({
      id: attrs.id || '', name: attrs.name || '', type: attrs.type || '',
      value: attrs.value || '', placeholder: attrs.placeholder || '',
      onchange: attrs.onchange || '', onclick: attrs.onclick || '',
    });
  }
  return results;
}

function parseButtons(html) {
  const results = [];
  const btnRegex = /<button([^>]*)>([\s\S]*?)<\/button>/gi;
  let match;
  while ((match = btnRegex.exec(html)) !== null) {
    const attrs = parseAttrs(match[1]);
    results.push({ tag: 'button', id: attrs.id, text: match[2].trim().substring(0, 100), onclick: attrs.onclick, className: attrs.class });
  }
  // input[type=button/submit]
  const inputBtnRegex = /<input([^>]*type=['"](?:button|submit)['"][^>]*)>/gi;
  while ((match = inputBtnRegex.exec(html)) !== null) {
    const attrs = parseAttrs(match[1]);
    results.push({ tag: 'input', id: attrs.id, text: attrs.value, onclick: attrs.onclick, className: attrs.class, type: attrs.type });
  }
  return results;
}

function parseScripts(html) {
  const results = [];
  const scriptRegex = /<script([^>]*)>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = scriptRegex.exec(html)) !== null) {
    const attrs = parseAttrs(match[1]);
    if (attrs.src) {
      results.push({ type: 'external', src: attrs.src });
    } else if (match[2].trim()) {
      results.push({ type: 'inline', content: match[2].trim() });
    }
  }
  return results;
}

function parseLinks(html) {
  const results = [];
  const linkRegex = /<a([^>]*href=['"]([^'"]+)['"][^>]*)>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = linkRegex.exec(html)) !== null) {
    results.push({ href: match[2], text: match[3].trim().substring(0, 100) });
  }
  return results;
}

function parseAttrs(attrStr) {
  const result = {};
  const regex = /(\w[\w-]*)=['"]([^'"]*)['"]/g;
  let match;
  while ((match = regex.exec(attrStr)) !== null) {
    result[match[1]] = match[2];
  }
  // Handle valueless attributes like "checked", "disabled"
  const boolRegex = /\s(checked|disabled|readonly|selected|required|multiple)\b/gi;
  while ((match = boolRegex.exec(attrStr)) !== null) {
    result[match[1].toLowerCase()] = 'true';
  }
  return result;
}

function pad(n) { return String(n).padStart(2, '0'); }

// ========== Report Generator ==========

function generateReport() {
  let md = '';
  md += `# Relatorio SGE (e-aluno) - Coleta Automatica\n`;
  md += `Data: ${new Date().toISOString()}\n`;
  md += `Base: ${BASE}\n\n`;
  md += `---\n\n`;

  // ---- 1. Endpoints ----
  md += `## 1. Endpoints Descobertos\n\n`;
  const phpFiles = Object.keys(endpoints).filter(k => k.endsWith('.php')).sort();

  for (const file of phpFiles) {
    const entries = endpoints[file];
    md += `### \`${file}\`\n\n`;

    for (const e of entries) {
      md += `**${e.method} ${e.label}**\n`;
      md += `\`\`\`\n`;
      md += `URL: ${e.url}\n`;
      if (e.requestBody) md += `Body: ${e.requestBody}\n`;
      md += `Status: ${e.status || 'N/A'}\n`;

      if (e.setCookies?.length) md += `Set-Cookie: ${e.setCookies.join('; ')}\n`;
      if (e.redirectUrl) md += `Redirect: ${e.redirectUrl}\n`;

      md += `Response (${e.responseLength || 0} bytes):\n`;
      if (e.responseBody) {
        const preview = e.responseBody.substring(0, 3000);
        md += `${preview}\n`;
        if (e.responseBody.length > 3000) md += `... [TRUNCADO - total ${e.responseBody.length} bytes]\n`;
      }
      md += `\`\`\`\n\n`;
    }
  }

  // ---- 2. Page Structure ----
  md += `## 2. Estrutura da Pagina (chamadas.php)\n\n`;

  try {
    const struct = JSON.parse(fs.readFileSync(path.join(OUTPUT, 'page-structure.json'), 'utf-8'));

    md += `### Selects\n`;
    for (const s of struct.selects) {
      md += `\n#### \`#${s.id || s.name}\` (${s.options.length} opcoes)\n`;
      md += `onchange: \`${s.onchange || 'nenhum'}\`\n\n`;
      for (const o of s.options.slice(0, 25)) {
        md += `- value=\`${o.value}\` text="${o.text}" ${Object.keys(o.attrs || {}).length > 1 ? `attrs=${JSON.stringify(o.attrs)}` : ''}\n`;
      }
      if (s.options.length > 25) md += `- ... +${s.options.length - 25} mais\n`;
    }

    md += `\n### Inputs\n`;
    for (const i of struct.inputs) {
      if (i.type === 'hidden' && !i.value) continue;
      md += `- \`#${i.id || i.name}\` type=${i.type} value="${i.value}" onchange="${i.onchange}" onclick="${i.onclick}"\n`;
    }

    md += `\n### Botoes\n`;
    for (const b of struct.buttons) {
      md += `- \`#${b.id}\` ${b.tag} text="${b.text}" onclick="${b.onclick || ''}" class="${b.className || ''}"\n`;
    }

    md += `\n### Links\n`;
    for (const l of (struct.links || []).slice(0, 20)) {
      md += `- [${l.text}](${l.href})\n`;
    }

    md += `\n### Scripts\n`;
    for (const s of struct.scripts) {
      if (s.type === 'external') {
        md += `- External: \`${s.src}\`\n`;
      } else {
        md += `- Inline (${s.content?.length || 0} chars)\n`;
      }
    }
  } catch {}

  // ---- 3. Inline JavaScript ----
  md += `\n## 3. JavaScript Inline (completo)\n\n`;
  try {
    const js = fs.readFileSync(path.join(OUTPUT, 'inline-scripts.js'), 'utf-8');
    md += `\`\`\`javascript\n${js.substring(0, 30000)}\n\`\`\`\n`;
    if (js.length > 30000) md += `\n... [TRUNCADO - total ${js.length} chars]\n`;
  } catch {}

  // ---- 4. External JS ----
  md += `\n## 4. JavaScript Externo\n\n`;
  try {
    const files = fs.readdirSync(OUTPUT).filter(f => f.startsWith('ext-') && f.endsWith('.js'));
    for (const f of files) {
      const content = fs.readFileSync(path.join(OUTPUT, f), 'utf-8');
      md += `### \`${f.replace('ext-', '')}\`\n`;
      md += `\`\`\`javascript\n${content.substring(0, 15000)}\n\`\`\`\n`;
      if (content.length > 15000) md += `... [TRUNCADO - total ${content.length} chars]\n`;
      md += `\n`;
    }
  } catch {}

  // ---- 5. Disciplinas ----
  md += `\n## 5. Disciplinas por Serie\n\n`;
  try {
    const discs = JSON.parse(fs.readFileSync(path.join(OUTPUT, 'disciplinas-all.json'), 'utf-8'));
    for (const [serieId, data] of Object.entries(discs)) {
      md += `### Serie ${serieId}: ${data.serie || ''} (turma=${data.turma}, turno=${data.turno})\n`;
      if (data.disciplinas) {
        for (const d of data.disciplinas) {
          md += `- id=${d.disciplina || d.id} nome="${d.descricao || d.nome}"\n`;
        }
      } else if (data.raw) {
        md += `Raw: ${data.raw.substring(0, 500)}\n`;
      }
      md += `\n`;
    }
  } catch {}

  // ---- 6. show_chamadas.php responses ----
  md += `\n## 6. Respostas show_chamadas.php\n\n`;
  try {
    const showFiles = fs.readdirSync(OUTPUT).filter(f => f.startsWith('show-chamada-')).sort();
    for (const f of showFiles) {
      const content = fs.readFileSync(path.join(OUTPUT, f), 'utf-8');
      md += `### ${f}\n`;
      md += `\`\`\`html\n${content.substring(0, 5000)}\n\`\`\`\n`;
      if (content.length > 5000) md += `... [TRUNCADO - total ${content.length} chars]\n`;
      md += `\n`;
    }
  } catch {}

  // ---- 7. Relatorio detalhamento ----
  md += `\n## 7. relatorio_detalhamento_chamada.php\n\n`;
  try {
    const detFiles = fs.readdirSync(OUTPUT).filter(f => f.startsWith('relatorio-detalhamento')).sort();
    for (const f of detFiles) {
      const content = fs.readFileSync(path.join(OUTPUT, f), 'utf-8');
      md += `### ${f}\n`;
      md += `\`\`\`html\n${content.substring(0, 8000)}\n\`\`\`\n`;
      if (content.length > 8000) md += `... [TRUNCADO - total ${content.length} chars]\n`;
      md += `\n`;
    }
  } catch {}

  // ---- 8. Resumo de rede ----
  md += `\n## 8. Resumo de Rede\n\n`;
  md += `Total de requests: ${httpLog.length}\n\n`;

  const postReqs = httpLog.filter(e => e.method === 'POST');
  md += `### POST requests (${postReqs.length})\n`;
  for (const p of postReqs) {
    md += `- ${p.label}: \`${p.url}\` body=\`${p.requestBody?.substring(0, 200) || ''}\` → status ${p.status}\n`;
  }

  md += `\n### Todos os requests\n`;
  for (const e of httpLog) {
    md += `- ${e.method} ${e.url.substring(0, 100)} → ${e.status || 'err'} (${e.responseLength || 0}b)\n`;
  }

  fs.writeFileSync(path.join(OUTPUT, 'relatorio.md'), md);
}

// ========== Run ==========
main().catch(err => {
  console.error('Fatal:', err);
  saveAll();
  process.exit(1);
});
