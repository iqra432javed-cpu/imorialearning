/* ============================================================
   IMORIA LEARNING — chemistry.js
   Dynamic content loader from chemistry.json
   ============================================================ */

'use strict';

let CHEM_DATA = null;
let currentChapterId = 'ch1';
let currentTab = 'notes';
let mcqAnswers = {};

// ---- Bootstrap ----
document.addEventListener('DOMContentLoaded', async () => {
  await loadChemData();
  renderChapterPills();
  loadChapter(currentChapterId);
  initTabs();
});

// ---- Data Loading ----
async function loadChemData() {
  try {
    const res = await fetch('data/chemistry.json');
    CHEM_DATA = await res.json();
  } catch (e) {
    console.error('Failed to load chemistry data:', e);
    document.getElementById('content-area').innerHTML = `
      <div class="card card-pad text-center" style="padding:48px;">
        <div style="font-size:3rem;margin-bottom:16px;">⚠️</div>
        <h3>Content could not be loaded</h3>
        <p class="text-gray mt-2">Please ensure you're running this on a local server or GitHub Pages.</p>
        <code style="display:block;margin-top:12px;font-size:0.8rem;color:var(--gray-600);">
          Run: python -m http.server 8000
        </code>
      </div>`;
  }
}

// ---- Chapter Pills ----
function renderChapterPills() {
  const container = document.getElementById('chapter-pills');
  if (!container || !CHEM_DATA) return;
  container.innerHTML = CHEM_DATA.chapters.map(ch => `
    <button class="chapter-pill ${ch.id === currentChapterId ? 'active' : ''}"
      onclick="loadChapter('${ch.id}')" data-id="${ch.id}">
      Ch ${ch.number}: ${ch.title}
    </button>
  `).join('');
}

function loadChapter(id) {
  currentChapterId = id;
  mcqAnswers = {};
  // update pills
  document.querySelectorAll('.chapter-pill').forEach(p => {
    p.classList.toggle('active', p.dataset.id === id);
  });
  const ch = CHEM_DATA.chapters.find(c => c.id === id);
  if (!ch) return;
  // update page title area
  const titleEl = document.getElementById('chapter-title');
  const subEl   = document.getElementById('chapter-subtitle');
  if (titleEl) titleEl.textContent = `Chapter ${ch.number}: ${ch.title}`;
  if (subEl)   subEl.textContent   = ch.subtitle || '';
  // render active tab
  renderActiveTab(ch);
  // update MCQ counts
  updateTabCounts(ch);
}

function updateTabCounts(ch) {
  const counts = {
    notes: ch.topics.length,
    mcqs:  ch.mcqs.length,
    short: ch.shortQuestions.length,
    long:  ch.longQuestions.length
  };
  Object.entries(counts).forEach(([tab, count]) => {
    const el = document.getElementById(`count-${tab}`);
    if (el) el.textContent = count;
  });
}

// ---- Tab System ----
function initTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      if (tab === currentTab) return;
      // update buttons
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      // update panels
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      const panel = document.getElementById(`panel-${tab}`);
      if (panel) panel.classList.add('active');
      currentTab = tab;
      // render if needed
      const ch = CHEM_DATA.chapters.find(c => c.id === currentChapterId);
      if (ch) renderActiveTab(ch);
      // scroll to top of content
      document.getElementById('content-area')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

function renderActiveTab(ch) {
  switch (currentTab) {
    case 'notes': renderNotes(ch);  break;
    case 'mcqs':  renderMCQs(ch);   break;
    case 'short': renderShort(ch);  break;
    case 'long':  renderLong(ch);   break;
  }
}

// ============================================================
// NOTES RENDERER
// ============================================================
function renderNotes(ch) {
  const panel = document.getElementById('panel-notes');
  if (!panel) return;

  let html = `
    <!-- Overview Card -->
    <div class="overview-card">
      <h3>📋 Chapter Overview</h3>
      <p>${ch.overview}</p>
    </div>

    <!-- High Yield Topics -->
    <div class="card card-pad" style="margin-bottom:24px;">
      <h3 style="color:var(--navy);margin-bottom:6px;">🎯 High-Yield Topics</h3>
      <p class="text-gray text-sm" style="margin-bottom:18px;">Focus areas for MDCAT and Board Exams</p>
      <div class="high-yield-grid">
        ${ch.highYieldTopics.map(hy => `
          <div class="hy-item">
            <span class="hy-stars">${'⭐'.repeat(hy.stars)}</span>
            <span class="hy-topic">${hy.topic}</span>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Topics (Accordion) -->
    <h3 style="color:var(--navy);margin-bottom:20px;font-size:1rem;text-transform:uppercase;letter-spacing:0.5px;color:var(--gray-600);">📚 Concept Notes</h3>
  `;

  ch.topics.forEach((topic, i) => {
    html += `
      <div class="topic-card">
        <div class="topic-header" onclick="toggleTopic(this)" data-tid="${topic.id}">
          <div style="display:flex;align-items:center;flex:1;">
            <div class="topic-num">${topic.id}</div>
            <span class="topic-title">${topic.title}</span>
          </div>
          <span class="topic-chevron">▼</span>
        </div>
        <div class="topic-body">
          ${renderTopicBody(topic)}
        </div>
      </div>
    `;
  });

  panel.innerHTML = html;

  // auto-open first topic
  const firstHeader = panel.querySelector('.topic-header');
  if (firstHeader) firstHeader.click();
}

function toggleTopic(header) {
  const isOpen = header.classList.contains('open');
  // close all
  document.querySelectorAll('.topic-header').forEach(h => {
    h.classList.remove('open');
    h.nextElementSibling?.classList.remove('open');
  });
  if (!isOpen) {
    header.classList.add('open');
    header.nextElementSibling?.classList.add('open');
  }
}
window.toggleTopic = toggleTopic;

function renderTopicBody(topic) {
  let html = '';

  // Memory trick
  if (topic.memoryTrick) {
    html += `<div class="memory-trick"><h4>🧠 Memory Trick</h4><p>${topic.memoryTrick}</p></div>`;
  }

  // Key points
  if (topic.keyPoints) {
    html += `<div class="key-points"><h4>Key Points</h4>`;
    topic.keyPoints.forEach(pt => {
      html += `<div class="key-point">${escHtml(pt)}</div>`;
    });
    html += `</div>`;
  }

  // Modern Law (topic 1.1)
  if (topic.modernLaw) {
    html += `<div class="law-box"><h4>📜 Modern Periodic Law</h4><p>${escHtml(topic.modernLaw)}</p></div>`;
  }

  // Revision Table
  if (topic.revisionTable) {
    html += `
      <h4 style="font-size:0.8rem;text-transform:uppercase;letter-spacing:0.8px;color:var(--gray-600);margin:20px 0 10px;">⚡ Quick Revision Table</h4>
      <table class="revision-table">
        <thead><tr><th>Scientist</th><th>Year</th><th>Contribution</th></tr></thead>
        <tbody>
          ${topic.revisionTable.map(r => `<tr><td><strong>${r.scientist}</strong></td><td>${r.year}</td><td>${r.contribution}</td></tr>`).join('')}
        </tbody>
      </table>
    `;
  }

  // Families
  if (topic.families) {
    html += `<div class="families-grid">`;
    const fClasses = ['f-alkali','f-alkali-earth','f-transition','f-chalcogen','f-halogen','f-noble'];
    topic.families.forEach((fam, i) => {
      const cls = fClasses[i] || '';
      html += `
        <div class="family-card ${cls}">
          <h4>${fam.name}</h4>
          <div class="group-label">${fam.group} · ${fam.valenceElectrons} valence e⁻</div>
          <div class="elements">${fam.elements}</div>
          <ul class="traits">${fam.traits.map(t => `<li>${escHtml(t)}</li>`).join('')}</ul>
        </div>
      `;
    });
    html += `</div>`;
  }

  // Electronic configuration examples
  if (topic.examples) {
    html += `<div class="config-examples"><h4 style="font-size:0.8rem;text-transform:uppercase;letter-spacing:0.8px;color:var(--gray-600);margin-bottom:10px;">Worked Examples</h4>`;
    topic.examples.forEach(ex => {
      html += `
        <div class="config-example">
          <span class="cfg-label">${escHtml(ex.description)}</span>
          <span class="cfg-val">${escHtml(ex.config)}</span>
        </div>
      `;
    });
    html += `</div>`;
  }

  // Ionization Energy factors
  if (topic.factors) {
    html += `<div class="key-points"><h4>Factors Affecting Ionization Energy</h4>`;
    topic.factors.forEach((f, idx) => {
      html += `<div class="key-point"><span><strong>(${idx+1})</strong> ${escHtml(f)}</span></div>`;
    });
    html += `</div>`;
  }

  // IE Equation
  if (topic.equation) {
    html += `<div class="equation-box">⚗️ ${escHtml(topic.equation)}</div>`;
  }

  // Anomalies
  if (topic.anomalies) {
    html += `
      <div class="exam-tips" style="background:var(--orange-light);border-color:var(--orange);">
        <h4 style="color:var(--orange);">⚠️ Important Anomalies</h4>
        <ul>
          ${topic.anomalies.map(a => `<li>${escHtml(a)}</li>`).join('')}
        </ul>
      </div>
    `;
  }

  // Trends
  if (topic.trends) {
    html += `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:16px 0;">
        <div style="background:var(--blue-light);padding:14px;border-radius:var(--radius-sm);border-left:3px solid var(--blue);">
          <strong style="font-size:0.78rem;text-transform:uppercase;color:var(--blue);">Across Period →</strong>
          <p style="font-size:0.88rem;margin-top:6px;">${escHtml(topic.trends.acrossPeriod)}</p>
        </div>
        <div style="background:var(--green-light);padding:14px;border-radius:var(--radius-sm);border-left:3px solid var(--green);">
          <strong style="font-size:0.78rem;text-transform:uppercase;color:var(--green);">Down Group ↓</strong>
          <p style="font-size:0.88rem;margin-top:6px;">${escHtml(topic.trends.downGroup)}</p>
        </div>
      </div>
      ${topic.trends.example ? `<div class="key-point">Example: <strong>${escHtml(topic.trends.example)}</strong></div>` : ''}
    `;
  }

  // Electron Affinity + Electronegativity (topic 1.9)
  if (topic.electronAffinity) {
    const ea = topic.electronAffinity;
    html += `
      <div class="law-box"><h4>📜 Definition — Electron Affinity</h4><p>${escHtml(ea.definition)}</p></div>
      <div class="equation-box">⚗️ ${escHtml(ea.example)}</div>
      <div class="key-point">${escHtml(ea.signConvention)}</div>
      <div class="key-point"><strong>Trend:</strong> ${escHtml(ea.trends)}</div>
      <div class="exam-tips" style="background:var(--orange-light);">
        <h4 style="color:var(--orange);">🔥 F vs Cl Anomaly</h4>
        <ul>${ea.examTips.map(t => `<li>${escHtml(t)}</li>`).join('')}</ul>
      </div>
    `;
  }

  if (topic.electronegativity) {
    const en = topic.electronegativity;
    html += `
      <div class="law-box" style="margin-top:16px;"><h4>📜 Definition — Electronegativity (Pauling)</h4><p>${escHtml(en.definition)}</p></div>
      <table class="revision-table" style="margin:12px 0;">
        <thead><tr><th>Li</th><th>Be</th><th>B</th><th>C</th><th>N</th><th>O</th><th>F</th></tr></thead>
        <tbody><tr>
          ${Object.values(en.values.period2).map(v => `<td>${v}</td>`).join('')}
        </tr></tbody>
      </table>
      <div class="key-point"><strong>Minimum EN:</strong> ${escHtml(en.values.minimum)} — <strong>Maximum EN:</strong> ${escHtml(en.values.maximum)}</div>
      <div class="key-point">${escHtml(en.metallic)}</div>
    `;
  }

  // Reactions (topic 1.10)
  if (topic.reactions) {
    const rx = topic.reactions;
    ['withWater','withOxygen','withChlorine'].forEach(key => {
      const labels = { withWater: '💧 Reactions with Water', withOxygen: '🔥 Reactions with Oxygen', withChlorine: '☁️ Reactions with Chlorine' };
      html += `<div class="lq-section-title">${labels[key]}</div>`;
      rx[key].forEach(r => {
        html += `
          <div style="margin-bottom:12px;">
            <div style="font-size:0.8rem;font-weight:700;color:var(--gray-600);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">${escHtml(r.reactant)}</div>
            <div class="equation-box">⚗️ ${escHtml(r.equation)}</div>
            ${r.notes ? `<div style="font-size:0.84rem;color:var(--gray-600);margin-top:6px;padding-left:8px;">ℹ️ ${escHtml(r.notes)}</div>` : ''}
          </div>
        `;
      });
    });
  }

  // Oxide classification
  if (topic.oxideClassification) {
    const oc = topic.oxideClassification;
    html += `<div class="lq-section-title">🧪 Oxide Classification</div>`;
    const types = [
      { key: 'basic', label: 'Basic Oxides', color: 'var(--green)', bg: 'var(--green-light)', border: 'rgba(39,174,96,0.3)' },
      { key: 'acidic', label: 'Acidic Oxides', color: 'var(--red)', bg: 'var(--red-light)', border: 'rgba(231,76,60,0.3)' },
      { key: 'amphoteric', label: 'Amphoteric Oxides', color: 'var(--purple)', bg: 'var(--purple-light)', border: 'rgba(142,68,173,0.3)' }
    ];
    html += `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:14px;margin:12px 0;">`;
    types.forEach(t => {
      const item = oc[t.key];
      if (!item) return;
      const examples = item.examples || item.reactions || [];
      html += `
        <div style="background:${t.bg};border-radius:var(--radius-md);padding:16px;border:1px solid ${t.border};">
          <strong style="color:${t.color};font-size:0.85rem;">${t.label}</strong>
          <p style="font-size:0.82rem;color:var(--gray-700);margin:6px 0;">${escHtml(item.description || item.example || '')}</p>
          ${examples.map(e => `<div class="equation-box" style="margin-top:6px;font-size:0.78rem;">⚗️ ${escHtml(e)}</div>`).join('')}
        </div>
      `;
    });
    html += `</div>`;
  }

  // Oxidation numbers
  if (topic.oxidationNumbers) {
    const on = topic.oxidationNumbers;
    html += `
      <div class="lq-section-title">🔢 Oxidation Numbers in Period 3</div>
      <p style="font-size:0.88rem;color:var(--gray-700);margin-bottom:12px;">${escHtml(on.explanation)}</p>
      <table class="revision-table">
        <thead><tr><th>Compound</th><th>Element</th><th>Oxidation Number</th></tr></thead>
        <tbody>
          ${on.oxides.map(o => `<tr><td>${o.compound}</td><td>${o.element}</td><td><strong>${o.ox}</strong></td></tr>`).join('')}
        </tbody>
      </table>
      <div class="key-point">${escHtml(on.variableOxidation)}</div>
    `;
  }

  // Bonding trend
  if (topic.bondingTrend) {
    html += `
      <div class="key-point">${escHtml(topic.bondingTrend)}</div>
      <div class="diagram-placeholder">📊 Diagram: Period 3 Bonding Trend<br><br>Na–Mg (ionic oxide/chloride) → Al (amphoteric) → Si–Cl (covalent oxide/chloride)<br>→ Increasing covalent character</div>
    `;
  }

  // Exam tips
  if (topic.examTips) {
    html += `
      <div class="exam-tips">
        <h4>💡 Exam Tips</h4>
        <ul>${topic.examTips.map(t => `<li>${escHtml(t)}</li>`).join('')}</ul>
      </div>
    `;
  }

  return html;
}

// ============================================================
// MCQ RENDERER + QUIZ LOGIC
// ============================================================
function renderMCQs(ch) {
  const panel = document.getElementById('panel-mcqs');
  if (!panel) return;

  let html = `
    <div class="mcq-meta">
      <span class="mcq-counter" id="mcq-answered">0 / ${ch.mcqs.length} answered</span>
      <div class="progress-bar"><div class="progress-fill" id="mcq-progress" style="width:0%"></div></div>
      <button class="btn btn-navy" style="padding:8px 18px;font-size:0.85rem;border-radius:var(--radius-sm);" onclick="resetMCQs()">↺ Reset</button>
    </div>
    <div class="score-banner" id="score-banner">
      <div class="score-num" id="score-num">0</div>
      <div class="score-label" id="score-label">out of ${ch.mcqs.length}</div>
      <div class="score-msg" id="score-msg"></div>
    </div>
  `;

  ch.mcqs.forEach((mcq, i) => {
    const wrongHtml = mcq.whyWrong
      ? `<div class="wrong-options"><div class="wo-head">Why others are wrong:</div>
           ${Object.entries(mcq.whyWrong).map(([k, v]) => `<div class="wrong-option"><strong>${k}:</strong> ${escHtml(v)}</div>`).join('')}
         </div>` : '';

    html += `
      <div class="mcq-card" id="mcq-${mcq.id}">
        <div class="mcq-head">
          <div class="mcq-num">Question ${i + 1} of ${ch.mcqs.length}</div>
          <div class="mcq-question">${escHtml(mcq.question)}</div>
        </div>
        <div class="mcq-options" id="opts-${mcq.id}">
          ${mcq.options.map(opt => {
            const letter = opt[0];
            const text   = opt.slice(3);
            return `
              <div class="mcq-option" onclick="selectOption('${mcq.id}','${letter}','${mcq.correct}')" data-letter="${letter}">
                <div class="option-letter">${letter}</div>
                <span>${escHtml(text)}</span>
              </div>
            `;
          }).join('')}
        </div>
        <div class="mcq-explanation" id="exp-${mcq.id}">
          <div class="exp-head">✅ Explanation</div>
          <p>${escHtml(mcq.explanation)}</p>
          ${wrongHtml}
        </div>
      </div>
    `;
  });

  panel.innerHTML = html;
}

function selectOption(mcqId, selected, correct) {
  const ch = CHEM_DATA.chapters.find(c => c.id === currentChapterId);
  if (!ch) return;
  // prevent re-answering
  if (mcqAnswers[mcqId] !== undefined) return;
  mcqAnswers[mcqId] = selected;

  const optsEl = document.getElementById(`opts-${mcqId}`);
  const expEl  = document.getElementById(`exp-${mcqId}`);
  if (!optsEl || !expEl) return;

  optsEl.querySelectorAll('.mcq-option').forEach(opt => {
    const letter = opt.dataset.letter;
    opt.style.pointerEvents = 'none';
    if (letter === correct) opt.classList.add('correct');
    else if (letter === selected) opt.classList.add('wrong');
  });
  expEl.classList.add('show');

  updateMCQProgress(ch);

  // Show score if all answered
  if (Object.keys(mcqAnswers).length === ch.mcqs.length) {
    showMCQScore(ch);
  }
}
window.selectOption = selectOption;

function updateMCQProgress(ch) {
  const answered = Object.keys(mcqAnswers).length;
  const total    = ch.mcqs.length;
  const pct      = (answered / total) * 100;
  const counterEl  = document.getElementById('mcq-answered');
  const progressEl = document.getElementById('mcq-progress');
  if (counterEl)  counterEl.textContent = `${answered} / ${total} answered`;
  if (progressEl) progressEl.style.width = `${pct}%`;
}

function showMCQScore(ch) {
  const correct = ch.mcqs.filter(q => mcqAnswers[q.id] === q.correct).length;
  const total   = ch.mcqs.length;
  const pct     = Math.round((correct / total) * 100);

  const msgs = [
    [90, '🏆 Outstanding! Exam-ready!'],
    [75, '🎯 Great work! Almost there!'],
    [60, '📚 Good effort! Review the wrong ones.'],
    [0,  '📖 Keep practicing! You\'ve got this!']
  ];
  const msg = msgs.find(([min]) => pct >= min)[1];

  const banner = document.getElementById('score-banner');
  const numEl  = document.getElementById('score-num');
  const lblEl  = document.getElementById('score-label');
  const msgEl  = document.getElementById('score-msg');

  if (banner) {
    banner.classList.add('show');
    if (numEl) { numEl.textContent = '0'; window.ImoriaApp?.animateCounter(numEl, correct, 1000); }
    if (lblEl) lblEl.textContent = `out of ${total} correct (${pct}%)`;
    if (msgEl) msgEl.textContent = msg;
    banner.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  window.ImoriaApp?.showToast(`Score: ${correct}/${total} (${pct}%)`, pct >= 60 ? 'success' : 'warning');
}

function resetMCQs() {
  mcqAnswers = {};
  const ch = CHEM_DATA.chapters.find(c => c.id === currentChapterId);
  if (ch) renderMCQs(ch);
}
window.resetMCQs = resetMCQs;

// ============================================================
// SHORT QUESTIONS RENDERER
// ============================================================
function renderShort(ch) {
  const panel = document.getElementById('panel-short');
  if (!panel) return;

  let html = `
    <p style="color:var(--gray-600);font-size:0.9rem;margin-bottom:24px;">
      Click any question to reveal the full answer, marking points, and examiner tips.
    </p>
  `;

  ch.shortQuestions.forEach((sq, i) => {
    html += `
      <div class="sq-card">
        <div class="sq-head" onclick="toggleSQ(this)">
          <div class="sq-num">${i + 1}</div>
          <div class="sq-q">${escHtml(sq.question)}</div>
          <div class="sq-toggle">▼</div>
        </div>
        <div class="sq-body">
          <div class="sq-answer">${escHtml(sq.answer)}</div>
          <div class="sq-marking">
            <h5>✅ Marking Points</h5>
            <ul>
              ${sq.markingPoints.map(p => `<li>${escHtml(p)}</li>`).join('')}
            </ul>
          </div>
          <div class="sq-tip"><strong>💡 Examiner Tip:</strong> ${escHtml(sq.examTip)}</div>
        </div>
      </div>
    `;
  });

  panel.innerHTML = html;
}

function toggleSQ(head) {
  const isOpen = head.classList.contains('open');
  // close all
  document.querySelectorAll('.sq-head').forEach(h => {
    h.classList.remove('open');
    h.nextElementSibling?.classList.remove('open');
  });
  if (!isOpen) {
    head.classList.add('open');
    head.nextElementSibling?.classList.add('open');
  }
}
window.toggleSQ = toggleSQ;

// ============================================================
// LONG QUESTIONS RENDERER
// ============================================================
function renderLong(ch) {
  const panel = document.getElementById('panel-long');
  if (!panel) return;

  let html = `
    <p style="color:var(--gray-600);font-size:0.9rem;margin-bottom:24px;">
      Full long-question model answers with key points, diagrams, and common mistakes.
    </p>
  `;

  ch.longQuestions.forEach((lq, i) => {
    html += `
      <div class="lq-card">
        <div class="lq-head" onclick="toggleLQ(this)">
          <span class="lq-toggle">▼</span>
          <div class="lq-badge">Long Question ${i + 1}</div>
          <div class="lq-q">${escHtml(lq.question)}</div>
        </div>
        <div class="lq-body">
          <div class="lq-section-title">📌 Key Points (Marking Scheme)</div>
          ${lq.keyPoints.map(pt => `<div class="lq-point">${escHtml(pt)}</div>`).join('')}

          ${lq.diagram ? `
            <div class="lq-section-title">🖼️ Diagram Requirement</div>
            <div class="diagram-placeholder">${escHtml(lq.diagram)}</div>
          ` : ''}

          ${lq.commonMistakes ? `
            <div class="lq-mistakes">
              <h5>⚠️ Common Mistakes to Avoid</h5>
              <ul>${lq.commonMistakes.map(m => `<li>${escHtml(m)}</li>`).join('')}</ul>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  });

  panel.innerHTML = html;
}

function toggleLQ(head) {
  const isOpen = head.classList.contains('open');
  document.querySelectorAll('.lq-head').forEach(h => {
    h.classList.remove('open');
    h.nextElementSibling?.classList.remove('open');
  });
  if (!isOpen) {
    head.classList.add('open');
    head.nextElementSibling?.classList.add('open');
  }
}
window.toggleLQ = toggleLQ;

// ============================================================
// UTILITIES
// ============================================================
function escHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\n/g, '<br>');
}
