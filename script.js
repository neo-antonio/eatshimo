// ─── DATA HELPERS ────────────────────────────────────────
let foods = JSON.parse(localStorage.getItem('eatshimo_foods') || '[]');

function saveFoodsToDisk() {
  localStorage.setItem('eatshimo_foods', JSON.stringify(foods));
}

function getTimezone() {
  const p = JSON.parse(localStorage.getItem('eatshimo_profile') || '{}');
  return p.timezone || 'Asia/Manila';
}

function dateStr(d) {
  // Use the user's timezone to determine the correct local date
  const tz = getTimezone();
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year:'numeric', month:'2-digit', day:'2-digit' }).format(d);
  return parts; // en-CA gives YYYY-MM-DD format
}

function nowInTZ() {
  // Returns a Date object adjusted so getFullYear/Month/Date reflect the user's timezone
  const tz = getTimezone();
  const str = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year:'numeric', month:'2-digit', day:'2-digit' }).format(new Date());
  const [y, m, day] = str.split('-').map(Number);
  return new Date(y, m - 1, day);
}
function getDayKey(ds) { return 'eatshimo_day_' + ds; }
function getDayData(ds) {
  const raw = localStorage.getItem(getDayKey(ds));
  if (!raw) return { meals: [], water: 0, steps: 0, weight: null, sleep: null, exercises: {}, checklist: {} };
  const d = JSON.parse(raw);
  if (!d.exercises) d.exercises = {};
  if (!d.checklist) d.checklist = {};
  return d;
}
function saveDayData(ds, data) { localStorage.setItem(getDayKey(ds), JSON.stringify(data)); }

function cleanupDay(key, data) {
  const isEmpty = data.meals.length === 0 && !data.water && !data.steps && !data.weight && !data.sleep;
  if (isEmpty) localStorage.removeItem(getDayKey(key));
  else saveDayData(key, data);
}

function getAllDayKeys() {
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith('eatshimo_day_')) keys.push(k.replace('eatshimo_day_', ''));
  }
  return keys.sort();
}

// ─── THEMES ──────────────────────────────────────────────
const THEMES = {
  slate:    { label: 'Slate',    border: '#3d4452', borderLite: '#555d70', headerBg: '#2c313a', accentDim: 'rgba(61,68,82,0.07)' },
  ocean:    { label: 'Ocean',    border: '#1a5276', borderLite: '#2471a3', headerBg: '#0e3460', accentDim: 'rgba(26,82,118,0.07)' },
  forest:   { label: 'Forest',   border: '#1e6b45', borderLite: '#28895a', headerBg: '#134a30', accentDim: 'rgba(30,107,69,0.07)' },
  crimson:  { label: 'Crimson',  border: '#8b1a1a', borderLite: '#b02323', headerBg: '#5e1010', accentDim: 'rgba(139,26,26,0.07)' },
  violet:   { label: 'Violet',   border: '#5b2c8b', borderLite: '#7634b5', headerBg: '#3d1d5e', accentDim: 'rgba(91,44,139,0.07)' },
  teal:     { label: 'Teal',     border: '#0f6b6b', borderLite: '#1a8c8c', headerBg: '#074a4a', accentDim: 'rgba(15,107,107,0.07)' },
  cocoa:    { label: 'Cocoa',    border: '#6b3a1f', borderLite: '#8c4e28', headerBg: '#4a2510', accentDim: 'rgba(107,58,31,0.07)' },
  dark:     { label: 'Dark',     border: '#4a5370', borderLite: '#606885', headerBg: '#0c0e16', accentDim: 'rgba(74,83,112,0.15)',
    dark: true, bg: '#12141e', surface: '#191c28', card: '#1e2130',
    text: '#e2e4ef', textDim: '#6e7480', textMid: '#9aa0b0',
    inputBorder: '#2a2e42', shadow: '0 4px 24px rgba(0,0,0,0.5)', shadowSm: '0 2px 8px rgba(0,0,0,0.35)' },
};

const LIGHT_DEFAULTS = {
  bg: '#f4f5f7', surface: '#ffffff', card: '#ffffff',
  text: '#252830', textDim: '#8a9099', textMid: '#555c6b',
  inputBorder: '#dde0e8', shadow: '0 4px 24px rgba(0,0,0,0.10)', shadowSm: '0 2px 8px rgba(0,0,0,0.07)',
};

function applyTheme(id) {
  const t = THEMES[id] || THEMES.slate;
  const r = document.documentElement.style;
  // Accent / header vars (all themes)
  r.setProperty('--border',      t.border);
  r.setProperty('--border-lite', t.borderLite);
  r.setProperty('--header-bg',   t.headerBg);
  r.setProperty('--footer-bg',   t.headerBg);
  r.setProperty('--accent',      t.border);
  r.setProperty('--accent-dim',  t.accentDim);
  // Background / text vars — use theme overrides if dark, else restore defaults
  const d = t.dark ? t : LIGHT_DEFAULTS;
  r.setProperty('--bg',           d.bg);
  r.setProperty('--surface',      d.surface);
  r.setProperty('--card',         d.card);
  r.setProperty('--text',         d.text);
  r.setProperty('--text-dim',     d.textDim);
  r.setProperty('--text-mid',     d.textMid);
  r.setProperty('--input-border', d.inputBorder);
  r.setProperty('--shadow',       d.shadow);
  r.setProperty('--shadow-sm',    d.shadowSm);
}

function loadTheme() {
  applyTheme(localStorage.getItem('eatshimo_theme') || 'slate');
}

function selectTheme(id) {
  localStorage.setItem('eatshimo_theme', id);
  applyTheme(id);
  renderThemePicker();
}

function renderThemePicker() {
  const grid = document.getElementById('theme-grid');
  if (!grid) return;
  const current = localStorage.getItem('eatshimo_theme') || 'slate';
  grid.innerHTML = Object.entries(THEMES).map(([id, t]) => `
    <button class="theme-swatch${id === current ? ' active' : ''}"
            style="background:${t.border};"
            onclick="selectTheme('${id}')"
            title="${t.label}">
      ${id === current ? '<span class="theme-check">✓</span>' : ''}
      <span class="theme-label">${t.label}</span>
    </button>`).join('');
}

// ─── NAV ─────────────────────────────────────────────────
let libraryExpanded = false;

function showPage(page, btn, bnavId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.bottom-nav-btn').forEach(t => t.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  if (btn) btn.classList.add('active');
  // sync top nav active state
  const topNav = document.querySelector(`.nav-tab[onclick*="'${page}'"]`);
  if (topNav) topNav.classList.add('active');
  // sync bottom nav
  const bId = bnavId || page;
  const bBtn = document.getElementById('bnav-' + bId);
  if (bBtn) bBtn.classList.add('active');
  // Reset library collapse on every tab switch
  if (page !== 'library') libraryExpanded = false;
  if (page === 'daily')   renderDailyLog();
  if (page === 'library') renderLibrary();
  if (page === 'profile') { loadProfile(); renderCharts(); renderThemePicker(); loadCardToggles(); }
}

// ─── DATE NAV ────────────────────────────────────────────
let currentDate = nowInTZ();

function formatDateDisplay(d) {
  const today = nowInTZ();
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  const dStr = dateStr(d), tStr = dateStr(today), yStr = dateStr(yesterday);
  const label = d.toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' });
  if (dStr === tStr) return 'Today — ' + label;
  if (dStr === yStr) return 'Yesterday — ' + label;
  return d.toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric', year:'numeric' });
}

function changeDate(dir) { currentDate.setDate(currentDate.getDate() + dir); renderDailyLog(); }
function goToToday() { currentDate = nowInTZ(); renderDailyLog(); }

// ─── DAILY LOG ───────────────────────────────────────────
function renderDailyLog() {
  const key  = dateStr(currentDate);
  const data = getDayData(key);
  document.getElementById('current-date').textContent = formatDateDisplay(currentDate);

  let totalCal = 0, totalP = 0, totalC = 0, totalF = 0;
  data.meals.forEach(m => { totalCal += m.calories; totalP += m.protein; totalC += m.carbs; totalF += m.fat; });

  document.getElementById('sum-calories').textContent = Math.round(totalCal);
  const prof = JSON.parse(localStorage.getItem('eatshimo_profile') || '{}');
  document.getElementById('sum-protein').textContent = prof.proteinGoal ? `${Math.round(totalP)}/${prof.proteinGoal}g` : Math.round(totalP) + 'g';
  document.getElementById('sum-carbs').textContent   = prof.carbsGoal   ? `${Math.round(totalC)}/${prof.carbsGoal}g`   : Math.round(totalC) + 'g';
  document.getElementById('sum-fat').textContent     = prof.fatGoal     ? `${Math.round(totalF)}/${prof.fatGoal}g`     : Math.round(totalF) + 'g';

  const target = parseInt(localStorage.getItem('eatshimo_cal_target') || '0');
  const bar = document.getElementById('calorie-bar'), lbl = document.getElementById('calorie-label');
  if (target > 0) {
    const pct = Math.min((totalCal / target) * 100, 100);
    bar.style.width = pct + '%';
    bar.className = 'calorie-bar' + (totalCal > target ? ' over' : '');
    const rem = target - Math.round(totalCal);
    lbl.textContent = rem >= 0 ? `${Math.round(totalCal)} / ${target} kcal — ${rem} remaining` : `${Math.round(totalCal)} / ${target} kcal — ${Math.abs(rem)} over target`;
  } else {
    bar.style.width = '0%';
    lbl.innerHTML = `<a href="#" onclick="editCalorieGoal();return false;">Set your calorie target</a>`;
  }

  const mealList = document.getElementById('meal-list');
  if (data.meals.length === 0) {
    mealList.innerHTML = '<p class="empty-msg">No meals logged yet today.</p>';
  } else {
    mealList.innerHTML = data.meals.map((m, i) => `
      <div class="meal-item">
        <div class="meal-info">
          <div class="meal-name">${m.name}</div>
          <div class="meal-grams-row">
            <span style="font-size:13px;color:var(--text-dim);font-weight:500;">${m.grams}g</span>
          </div>
          <div class="meal-macros">
            <div class="macro-chip cal">Cal <span>${Math.round(m.calories)}</span></div>
            <div class="macro-chip">P <span>${Math.round(m.protein)}g</span></div>
            <div class="macro-chip">C <span>${Math.round(m.carbs)}g</span></div>
            <div class="macro-chip">F <span>${Math.round(m.fat)}g</span></div>
            ${m.fiber > 0 ? `<div class="macro-chip fiber">Fiber <span>${Math.round(m.fiber)}g</span></div>` : ''}
          </div>
        </div>
        <div class="meal-item-actions">
          <button class="btn-edit-meal" onclick="openEditMealModal(${i})">Edit</button>
          <button class="btn-remove-meal" onclick="removeMeal(${i})">Remove</button>
        </div>
      </div>`).join('');
  }

  document.getElementById('water-val').textContent  = data.water  || 0;
  document.getElementById('steps-val').textContent  = data.steps  || 0;
  document.getElementById('weight-val').textContent = data.weight ? data.weight + ' kg' : '—';
  document.getElementById('sleep-val').textContent  = data.sleep  ? data.sleep + ' hrs' : '—';

  // Steps → calories burned (profile-aware)
  const stepsEl = document.getElementById('steps-burned');
  if (data.steps && data.steps > 0) {
    stepsEl.textContent = `≈ ${calcStepCalories(data.steps)} kcal`;
  } else {
    stepsEl.textContent = '';
  }

  // Card visibility
  const extrasEnabled   = getCardEnabled('extras');
  const exerciseEnabled = getCardEnabled('exercise');
  const clEnabled       = getCardEnabled('checklist');
  document.getElementById('card-extras').style.display    = extrasEnabled   ? '' : 'none';
  document.getElementById('card-exercise').style.display  = exerciseEnabled ? '' : 'none';
  document.getElementById('card-checklist').style.display = clEnabled       ? '' : 'none';
  if (extrasEnabled)   initCardCollapse('extras');
  if (exerciseEnabled) { initCardCollapse('exercise');  renderExerciseCard(); }
  if (clEnabled)       { initCardCollapse('checklist'); renderChecklistCard(); }
  // Fasting card
  const fastingEnabled = getCardEnabled('fasting');
  const foodmodEnabled = getCardEnabled('foodmod');
  const fastEl = document.getElementById('card-fasting');
  const foodEl = document.getElementById('card-foodmod');
  if (fastEl) fastEl.style.display = fastingEnabled ? '' : 'none';
  if (foodEl) foodEl.style.display = foodmodEnabled ? '' : 'none';
  if (fastingEnabled) { initCardCollapse('fasting'); renderFastingCard(); }
  if (foodmodEnabled) { initCardCollapse('foodmod'); renderFoodModCard(); }
}

let mealEditMode = 'grams';
let mealBaseRates = {};

function openEditMealModal(index) {
  const key  = dateStr(currentDate);
  const data = getDayData(key);
  const m    = data.meals[index];
  mealEditMode = 'grams';

  // Try to look up the original food in the library for accurate per-gram rates
  const libFood = foods.find(f => f.name === m.name);
  const baseG = libFood ? (libFood.grams || 100) : m.grams;
  const src   = libFood || m;
  mealBaseRates = {
    calories: src.calories / baseG,
    protein:  src.protein  / baseG,
    carbs:    src.carbs    / baseG,
    fat:      src.fat      / baseG,
    fiber:    (src.fiber || 0) / baseG,
  };

  document.getElementById('edit-meal-index').value    = index;
  document.getElementById('edit-meal-name').value     = m.name;
  document.getElementById('edit-meal-grams').value    = m.grams;
  document.getElementById('edit-meal-calories').value = Math.round(m.calories);
  document.getElementById('edit-meal-protein').value  = parseFloat(m.protein.toFixed(1));
  document.getElementById('edit-meal-carbs').value    = parseFloat(m.carbs.toFixed(1));
  document.getElementById('edit-meal-fat').value      = parseFloat(m.fat.toFixed(1));
  document.getElementById('edit-meal-fiber').value    = parseFloat((m.fiber||0).toFixed(1));
  setMealEditMode('grams');
  document.getElementById('edit-meal-overlay').classList.remove('hidden');
}

function setMealEditMode(mode) {
  mealEditMode = mode;
  document.getElementById('meal-mode-grams').classList.toggle('active',  mode === 'grams');
  document.getElementById('meal-mode-manual').classList.toggle('active', mode === 'manual');
  const macroFields = ['calories','protein','carbs','fat','fiber'];
  macroFields.forEach(id => {
    const field = document.getElementById('meal-field-' + id);
    const input = document.getElementById('edit-meal-' + id);
    if (mode === 'grams') {
      field.classList.add('edit-field-readonly');
      input.readOnly = true;
    } else {
      field.classList.remove('edit-field-readonly');
      input.readOnly = false;
    }
  });
  if (mode === 'grams') onMealGramsInput();
}

function onMealGramsInput() {
  if (mealEditMode !== 'grams') return;
  const g = parseFloat(document.getElementById('edit-meal-grams').value) || 0;
  if (g <= 0) return;
  document.getElementById('edit-meal-calories').value = (mealBaseRates.calories * g).toFixed(1);
  document.getElementById('edit-meal-protein').value  = (mealBaseRates.protein  * g).toFixed(1);
  document.getElementById('edit-meal-carbs').value    = (mealBaseRates.carbs    * g).toFixed(1);
  document.getElementById('edit-meal-fat').value      = (mealBaseRates.fat      * g).toFixed(1);
  document.getElementById('edit-meal-fiber').value    = (mealBaseRates.fiber    * g).toFixed(1);
}

function saveEditedMeal() {
  const index = parseInt(document.getElementById('edit-meal-index').value);
  const key   = dateStr(currentDate);
  const data  = getDayData(key);
  data.meals[index] = {
    name:     data.meals[index].name,
    grams:    parseFloat(document.getElementById('edit-meal-grams').value)    || data.meals[index].grams,
    calories: parseFloat(document.getElementById('edit-meal-calories').value) || 0,
    protein:  parseFloat(document.getElementById('edit-meal-protein').value)  || 0,
    carbs:    parseFloat(document.getElementById('edit-meal-carbs').value)    || 0,
    fat:      parseFloat(document.getElementById('edit-meal-fat').value)      || 0,
    fiber:    parseFloat(document.getElementById('edit-meal-fiber').value)    || 0,
  };
  saveDayData(key, data);
  renderDailyLog();
  closeEditMealModalDirect();
}

function closeEditMealModal(e) { if (e.target===document.getElementById('edit-meal-overlay')) closeEditMealModalDirect(); }
function closeEditMealModalDirect() { document.getElementById('edit-meal-overlay').classList.add('hidden'); }

function editCalorieGoal() {
  const current = localStorage.getItem('eatshimo_cal_target') || '';
  const val = prompt('Enter your daily calorie target (kcal):', current);
  if (val === null) return;
  if (!isNaN(val) && parseInt(val) > 0) {
    localStorage.setItem('eatshimo_cal_target', parseInt(val));
    // Sync to profile display if profile page is loaded
    const profGoalInput = document.getElementById('prof-calorie-goal');
    if (profGoalInput) profGoalInput.value = parseInt(val);
    updateProfileCalorieGoalDisplay();
    renderDailyLog();
  } else if (val === '' || parseInt(val) <= 0) {
    if (confirm('Remove calorie target?')) {
      localStorage.removeItem('eatshimo_cal_target');
      const profGoalInput = document.getElementById('prof-calorie-goal');
      if (profGoalInput) profGoalInput.value = '';
      updateProfileCalorieGoalDisplay();
      renderDailyLog();
    }
  }
}

function saveCalorieGoalFromProfile() {
  const val = parseInt(document.getElementById('prof-calorie-goal').value);
  if (!isNaN(val) && val > 0) {
    localStorage.setItem('eatshimo_cal_target', val);
  } else {
    localStorage.removeItem('eatshimo_cal_target');
  }
  updateProfileCalorieGoalDisplay();
  // Reflect in daily log if it's rendered
  renderDailyLog();
  alert('Calorie goal updated!');
}

function updateProfileCalorieGoalDisplay() {
  const el = document.getElementById('prof-calorie-goal-display');
  if (!el) return;
  const current = localStorage.getItem('eatshimo_cal_target');
  el.textContent = current ? `Current goal: ${current} kcal/day` : 'No calorie goal set.';
}

function removeMeal(index) {
  const key = dateStr(currentDate), data = getDayData(key);
  data.meals.splice(index, 1);
  cleanupDay(key, data);
  renderDailyLog();
}

function logWater() {
  const val = parseFloat(document.getElementById('water-input').value);
  if (!val || val <= 0) return;
  const key = dateStr(currentDate), data = getDayData(key);
  data.water = (data.water || 0) + val;
  saveDayData(key, data);
  document.getElementById('water-input').value = '';
  renderDailyLog();
}

function logSteps() {
  const val = parseInt(document.getElementById('steps-input').value);
  if (!val || val < 0) return;
  const key = dateStr(currentDate), data = getDayData(key);
  data.steps = val;
  saveDayData(key, data);
  document.getElementById('steps-input').value = '';
  renderDailyLog();
}

function logWeight() {
  const val = parseFloat(document.getElementById('weight-input').value);
  if (!val || val <= 0) return;
  const key = dateStr(currentDate), data = getDayData(key);
  data.weight = val;
  saveDayData(key, data);
  document.getElementById('weight-input').value = '';
  renderDailyLog();
}

function clearWater()  { if (!confirm('Clear water for this day?'))  return; const key=dateStr(currentDate),data=getDayData(key); data.water=0;     cleanupDay(key,data); renderDailyLog(); }
function clearSteps()  { if (!confirm('Clear steps for this day?'))  return; const key=dateStr(currentDate),data=getDayData(key); data.steps=0;     cleanupDay(key,data); renderDailyLog(); }
function clearWeight() { if (!confirm('Clear weight for this day?')) return; const key=dateStr(currentDate),data=getDayData(key); data.weight=null; cleanupDay(key,data); renderDailyLog(); }
function clearSleep()  { if (!confirm('Clear sleep for this day?'))  return; const key=dateStr(currentDate),data=getDayData(key); data.sleep=null;  cleanupDay(key,data); renderDailyLog(); }

function logSleep() {
  const val = parseFloat(document.getElementById('sleep-input').value);
  if (!val || val <= 0 || val > 24) return;
  const key = dateStr(currentDate), data = getDayData(key);
  data.sleep = val;
  saveDayData(key, data);
  document.getElementById('sleep-input').value = '';
  renderDailyLog();
}

// ─── LOG MEAL MODAL ──────────────────────────────────────
let selectedFoodIndex = null;

function openLogModal() {
  selectedFoodIndex = null;
  document.getElementById('log-grams').value = '';
  document.getElementById('macro-preview').innerHTML = 'Pick a food to see scaled macros';
  document.getElementById('log-search').value = '';
  renderLogFoodList('');
  document.getElementById('log-modal-overlay').classList.remove('hidden');
  setTimeout(() => document.getElementById('log-search').focus(), 100);
}

function renderLogFoodList(query) {
  const list = document.getElementById('food-pick-list');
  const sorted = [...foods].sort((a,b) => a.name.localeCompare(b.name));
  const filtered = sorted.filter(f => f.name.toLowerCase().includes(query.toLowerCase()));
  if (filtered.length === 0) {
    list.innerHTML = '<p class="empty-msg" style="padding:16px 0;">No foods match your search.</p>';
    return;
  }
  // Store original index for each
  list.innerHTML = filtered.map(f => {
    const origIdx = foods.findIndex(food => food.name === f.name);
    return `
      <div class="food-pick-item" id="pick-${origIdx}" onclick="selectFood(${origIdx})">
        <div class="pick-name">${f.name}</div>
        <div class="pick-meta">${f.grams}g · ${f.calories} kcal · P${f.protein}g C${f.carbs}g F${f.fat}g</div>
      </div>`;
  }).join('');
}

function selectFood(index) {
  selectedFoodIndex = index;
  document.querySelectorAll('.food-pick-item').forEach(el => el.classList.remove('selected'));
  const el = document.getElementById('pick-' + index);
  if (el) el.classList.add('selected');
  document.getElementById('log-grams').value = foods[index].grams;
  updateMacroPreview();
}

function updateMacroPreview() {
  if (selectedFoodIndex === null) return;
  const f = foods[selectedFoodIndex];
  const grams = parseFloat(document.getElementById('log-grams').value) || 0;
  const r = grams / (f.grams || 100);
  const fiber = ((f.fiber || 0) * r).toFixed(1);
  document.getElementById('macro-preview').innerHTML =
    `Cal <span>${Math.round(f.calories*r)}</span> &nbsp; P <span>${(f.protein*r).toFixed(1)}g</span> &nbsp; C <span>${(f.carbs*r).toFixed(1)}g</span> &nbsp; F <span>${(f.fat*r).toFixed(1)}g</span>${parseFloat(fiber)>0?` &nbsp; Fiber <span>${fiber}g</span>`:''}`;
}

function confirmLogMeal() {
  if (selectedFoodIndex === null) { alert('Please pick a food first.'); return; }
  const grams = parseFloat(document.getElementById('log-grams').value);
  if (!grams || grams <= 0) { alert('Please enter how many grams you ate.'); return; }
  const f = foods[selectedFoodIndex], r = grams / (f.grams || 100);
  const entry = { name: f.name, grams, calories: f.calories*r, protein: f.protein*r, carbs: f.carbs*r, fat: f.fat*r, fiber: (f.fiber||0)*r };
  const key = dateStr(currentDate), data = getDayData(key);
  data.meals.push(entry);
  saveDayData(key, data);
  checkFoodModerator(f.name);
  renderDailyLog();
  closeLogModalDirect();
}

function closeLogModal(e)  { if (e.target===document.getElementById('log-modal-overlay')) closeLogModalDirect(); }
function closeLogModalDirect() { document.getElementById('log-modal-overlay').classList.add('hidden'); }

// ─── CALENDAR ────────────────────────────────────────────
let calViewDate = new Date();

function openCalendar() {
  calViewDate = new Date(currentDate);
  document.getElementById('cal-overlay').classList.remove('hidden');
  renderCalendar();
}

function closeCalendar(e) { if (e.target===document.getElementById('cal-overlay')) closeCalendarDirect(); }
function closeCalendarDirect() { document.getElementById('cal-overlay').classList.add('hidden'); }
function calPrevMonth() { calViewDate.setMonth(calViewDate.getMonth()-1); renderCalendar(); }
function calNextMonth() { calViewDate.setMonth(calViewDate.getMonth()+1); renderCalendar(); }

function renderCalendar() {
  const year=calViewDate.getFullYear(), month=calViewDate.getMonth();
  document.getElementById('cal-month-label').textContent = new Date(year,month,1).toLocaleDateString('en-US',{month:'long',year:'numeric'});
  const firstDay=new Date(year,month,1).getDay(), days=new Date(year,month+1,0).getDate();
  const todayStr=dateStr(nowInTZ()), selectedStr=dateStr(currentDate);
  let html='';
  for(let i=0;i<firstDay;i++) html+='<span class="cal-empty"></span>';
  for(let d=1;d<=days;d++){
    const ds=`${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const hasData=localStorage.getItem(getDayKey(ds))!==null, isFuture=ds>todayStr;
    let cls='cal-day';
    if(ds===selectedStr) cls+=' selected';
    else if(ds===todayStr) cls+=' today';
    if(isFuture) cls+=' future';
    if(hasData&&ds!==selectedStr) cls+=' has-data';
    html+=`<span class="${cls}" onclick="pickCalDay('${ds}')">${d}</span>`;
  }
  document.getElementById('cal-grid').innerHTML=html;
}

function pickCalDay(ds) {
  const p=ds.split('-');
  currentDate=new Date(parseInt(p[0]),parseInt(p[1])-1,parseInt(p[2]));
  closeCalendarDirect();
  renderDailyLog();
}

// ─── PROFILE ─────────────────────────────────────────────
function loadProfile() {
  const p = JSON.parse(localStorage.getItem('eatshimo_profile') || '{}');
  if (p.gender)       document.getElementById('prof-gender').value       = p.gender;
  if (p.age)          document.getElementById('prof-age').value          = p.age;
  if (p.height)       document.getElementById('prof-height').value       = p.height;
  if (p.weight)       document.getElementById('prof-weight').value       = p.weight;
  if (p.activity)     document.getElementById('prof-activity').value     = p.activity;
  if (p.timezone)     document.getElementById('prof-timezone').value     = p.timezone;
  else                document.getElementById('prof-timezone').value     = 'Asia/Manila';
  if (p.proteinGoal)  document.getElementById('prof-protein-goal').value = p.proteinGoal;
  if (p.carbsGoal)    document.getElementById('prof-carbs-goal').value   = p.carbsGoal;
  if (p.fatGoal)      document.getElementById('prof-fat-goal').value     = p.fatGoal;
  // Load calorie goal
  const calTarget = localStorage.getItem('eatshimo_cal_target');
  if (calTarget) document.getElementById('prof-calorie-goal').value = calTarget;
  updateProfileCalorieGoalDisplay();
  if (p.gender && p.age && p.height && p.weight) calcTDEE(p);
}

function saveProfile() {
  const p = {
    gender:      document.getElementById('prof-gender').value,
    age:         parseFloat(document.getElementById('prof-age').value)          || 0,
    height:      parseFloat(document.getElementById('prof-height').value)       || 0,
    weight:      parseFloat(document.getElementById('prof-weight').value)       || 0,
    activity:    parseFloat(document.getElementById('prof-activity').value)     || 1.2,
    timezone:    document.getElementById('prof-timezone').value || 'Asia/Manila',
    proteinGoal: parseFloat(document.getElementById('prof-protein-goal').value) || 0,
    carbsGoal:   parseFloat(document.getElementById('prof-carbs-goal').value)   || 0,
    fatGoal:     parseFloat(document.getElementById('prof-fat-goal').value)     || 0,
  };
  localStorage.setItem('eatshimo_profile', JSON.stringify(p));
  if (p.gender && p.age && p.height && p.weight) calcTDEE(p);
  alert('Profile saved!');
}

function calcTDEE(p) {
  let bmr = p.gender === 'male' ? 10*p.weight + 6.25*p.height - 5*p.age + 5 : 10*p.weight + 6.25*p.height - 5*p.age - 161;
  const tdee = Math.round(bmr * p.activity);
  document.getElementById('tdee-loss').textContent     = tdee - 500;
  document.getElementById('tdee-maintain').textContent = tdee;
  document.getElementById('tdee-gain').textContent     = tdee + 500;
  document.getElementById('tdee-card').style.display   = 'block';
  const current = localStorage.getItem('eatshimo_cal_target');
  document.getElementById('tdee-current-goal').textContent = current ? `Your current goal: ${current} kcal/day` : 'No calorie goal set yet.';
}

function setTDEEGoal(type) {
  const vals = { loss: parseInt(document.getElementById('tdee-loss').textContent), maintain: parseInt(document.getElementById('tdee-maintain').textContent), gain: parseInt(document.getElementById('tdee-gain').textContent) };
  const val = vals[type];
  if (!val || isNaN(val)) return;
  localStorage.setItem('eatshimo_cal_target', val);
  document.getElementById('tdee-current-goal').textContent = `Your current goal: ${val} kcal/day`;
  const profGoalInput = document.getElementById('prof-calorie-goal');
  if (profGoalInput) profGoalInput.value = val;
  updateProfileCalorieGoalDisplay();
  alert(`Calorie goal set to ${val} kcal/day!`);
}

// ─── CHARTS ──────────────────────────────────────────────
let chartPeriod = 'daily';
let charts = {};

function setPeriod(period, btn) {
  chartPeriod = period;
  // Sync all period-tab groups to the selected period
  document.querySelectorAll('.period-tab').forEach(t => {
    const tabPeriod = t.getAttribute('onclick').match(/'(\w+)'/)[1];
    t.classList.toggle('active', tabPeriod === period);
  });
  renderCharts();
}

function getChartData() {
  if (chartPeriod === 'daily') {
    const result = [], today = nowInTZ();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today); d.setDate(today.getDate() - i);
      const ds = dateStr(d), data = getDayData(ds);
      result.push({ label: d.toLocaleDateString('en-US',{month:'short',day:'numeric'}), calories: Math.round(data.meals.reduce((s,m)=>s+m.calories,0)), protein: Math.round(data.meals.reduce((s,m)=>s+m.protein,0)), carbs: Math.round(data.meals.reduce((s,m)=>s+m.carbs,0)), fat: Math.round(data.meals.reduce((s,m)=>s+m.fat,0)), weight: data.weight, water: data.water||0, steps: data.steps||0, sleep: data.sleep||null });
    }
    return result;
  }
  if (chartPeriod === 'weekly') {
    const weeks = {}, today = nowInTZ();
    for (let i = 83; i >= 0; i--) {
      const d = new Date(today); d.setDate(today.getDate() - i);
      const ds = dateStr(d), data = getDayData(ds);
      const weekStart = new Date(d); weekStart.setDate(d.getDate() - d.getDay());
      const wk = dateStr(weekStart);
      if (!weeks[wk]) weeks[wk] = { label: weekStart.toLocaleDateString('en-US',{month:'short',day:'numeric'}), calories:0, protein:0, carbs:0, fat:0, water:0, steps:0, weightSum:0, weightCount:0, sleepSum:0, sleepCount:0, days:0 };
      weeks[wk].calories += data.meals.reduce((s,m)=>s+m.calories,0);
      weeks[wk].protein  += data.meals.reduce((s,m)=>s+m.protein,0);
      weeks[wk].carbs    += data.meals.reduce((s,m)=>s+m.carbs,0);
      weeks[wk].fat      += data.meals.reduce((s,m)=>s+m.fat,0);
      weeks[wk].water    += data.water||0; weeks[wk].steps += data.steps||0;
      if (data.weight) { weeks[wk].weightSum+=data.weight; weeks[wk].weightCount++; }
      if (data.sleep)  { weeks[wk].sleepSum+=data.sleep;   weeks[wk].sleepCount++;  }
      weeks[wk].days++;
    }
    return Object.values(weeks).map(w=>({ ...w, calories:Math.round(w.calories/w.days), protein:Math.round(w.protein/w.days), carbs:Math.round(w.carbs/w.days), fat:Math.round(w.fat/w.days), water:Math.round(w.water/w.days), steps:Math.round(w.steps/w.days), weight:w.weightCount>0?parseFloat((w.weightSum/w.weightCount).toFixed(1)):null, sleep:w.sleepCount>0?parseFloat((w.sleepSum/w.sleepCount).toFixed(1)):null }));
  }
  if (chartPeriod === 'monthly') {
    const months = {}, today = nowInTZ();
    for (let i = 364; i >= 0; i--) {
      const d = new Date(today); d.setDate(today.getDate() - i);
      const ds = dateStr(d), data = getDayData(ds);
      const mk = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      if (!months[mk]) months[mk] = { label: d.toLocaleDateString('en-US',{month:'short',year:'numeric'}), calories:0, protein:0, carbs:0, fat:0, water:0, steps:0, weightSum:0, weightCount:0, sleepSum:0, sleepCount:0, days:0 };
      months[mk].calories += data.meals.reduce((s,m)=>s+m.calories,0);
      months[mk].protein  += data.meals.reduce((s,m)=>s+m.protein,0);
      months[mk].carbs    += data.meals.reduce((s,m)=>s+m.carbs,0);
      months[mk].fat      += data.meals.reduce((s,m)=>s+m.fat,0);
      months[mk].water    += data.water||0; months[mk].steps += data.steps||0;
      if (data.weight) { months[mk].weightSum+=data.weight; months[mk].weightCount++; }
      if (data.sleep)  { months[mk].sleepSum+=data.sleep;   months[mk].sleepCount++;  }
      months[mk].days++;
    }
    return Object.values(months).map(m=>({ ...m, calories:Math.round(m.calories/m.days), protein:Math.round(m.protein/m.days), carbs:Math.round(m.carbs/m.days), fat:Math.round(m.fat/m.days), water:Math.round(m.water/m.days), steps:Math.round(m.steps/m.days), weight:m.weightCount>0?parseFloat((m.weightSum/m.weightCount).toFixed(1)):null, sleep:m.sleepCount>0?parseFloat((m.sleepSum/m.sleepCount).toFixed(1)):null }));
  }
}

function makeChart(id, label, data, color, yLabel) {
  if (charts[id]) { charts[id].destroy(); delete charts[id]; }
  const ctx = document.getElementById(id);
  if (!ctx || !data || data.length === 0) return;
  charts[id] = new Chart(ctx, {
    type: 'line',
    data: { labels: data.map(d=>d.label), datasets: [{ label: yLabel||label, data: data.map(d=>d[label]||null), borderColor: color, backgroundColor: color+'22', borderWidth: 2.5, pointRadius: 3, pointHoverRadius: 5, tension: 0.35, fill: true, spanGaps: true }] },
    options: { responsive:true, maintainAspectRatio:false, plugins:{ legend:{display:false}, tooltip:{mode:'index',intersect:false, backgroundColor:'#23272f', titleColor:'#f0f1f4', bodyColor:'#9aa0b4', borderColor:'#3a3f4d', borderWidth:1} }, scales:{ x:{grid:{color:'#2a2f3d'},ticks:{font:{size:11,family:'Ubuntu'},color:'#6b7385',maxRotation:45,maxTicksLimit:10}}, y:{grid:{color:'#2a2f3d'},ticks:{font:{size:11,family:'Ubuntu'},color:'#6b7385'},beginAtZero:true} } }
  });
}

function makeMacroChart(id, data) {
  if (charts[id]) { charts[id].destroy(); delete charts[id]; }
  const ctx = document.getElementById(id);
  if (!ctx || !data || data.length === 0) return;
  charts[id] = new Chart(ctx, {
    type: 'line',
    data: { labels: data.map(d=>d.label), datasets: [
      { label:'Protein', data:data.map(d=>d.protein||null), borderColor:'#c0523a', backgroundColor:'#c0523a12', borderWidth:2.5, pointRadius:3, tension:0.35, fill:false, spanGaps:true },
      { label:'Carbs',   data:data.map(d=>d.carbs||null),   borderColor:'#7b8fb0', backgroundColor:'#7b8fb012', borderWidth:2.5, pointRadius:3, tension:0.35, fill:false, spanGaps:true },
      { label:'Fat',     data:data.map(d=>d.fat||null),     borderColor:'#4a8c72', backgroundColor:'#4a8c7212', borderWidth:2.5, pointRadius:3, tension:0.35, fill:false, spanGaps:true },
    ]},
    options: { responsive:true, maintainAspectRatio:false, plugins:{ legend:{display:true,labels:{font:{size:12,family:'Ubuntu'},color:'#9aa0b4',boxWidth:12}}, tooltip:{mode:'index',intersect:false, backgroundColor:'#23272f', titleColor:'#f0f1f4', bodyColor:'#9aa0b4', borderColor:'#3a3f4d', borderWidth:1} }, scales:{ x:{grid:{color:'#2a2f3d'},ticks:{font:{size:11,family:'Ubuntu'},color:'#6b7385',maxRotation:45,maxTicksLimit:10}}, y:{grid:{color:'#2a2f3d'},ticks:{font:{size:11,family:'Ubuntu'},color:'#6b7385'},beginAtZero:true} } }
  });
}

function renderCharts() {
  const data = getChartData();
  if (!data || data.length === 0) return;
  makeChart('chart-calories', 'calories', data, '#555c6b', 'kcal');
  makeMacroChart('chart-macros', data);
  makeChart('chart-weight', 'weight', data, '#555c6b', 'kg');
  makeChart('chart-water',  'water',  data, '#7b8fb0', 'ml');
  makeChart('chart-steps',  'steps',  data, '#4a8c72', 'steps');
  makeChart('chart-sleep',  'sleep',  data, '#9b7fd4', 'hrs');
}

// ─── EXPORT CSV ──────────────────────────────────────────
function exportCSV() {
  const allKeys = getAllDayKeys();
  const rows = [];

  // Section 1: Profile
  const prof = JSON.parse(localStorage.getItem('eatshimo_profile') || '{}');
  const calTarget = localStorage.getItem('eatshimo_cal_target') || '';
  rows.push(['=== PROFILE ===']);
  rows.push(['Gender','Age','Height (cm)','Weight (kg)','Activity','Calorie Target','Protein Goal (g)','Carbs Goal (g)','Fat Goal (g)']);
  rows.push([
    prof.gender || '', prof.age || '', prof.height || '', prof.weight || '',
    prof.activity || '', calTarget,
    prof.proteinGoal || '', prof.carbsGoal || '', prof.fatGoal || ''
  ]);
  rows.push(['']);

  // Section 2: Daily logs — include full meal detail rows
  rows.push(['=== DAILY LOGS ===']);
  rows.push(['Date','Total Calories','Protein (g)','Carbs (g)','Fat (g)','Fiber (g)','Water (ml)','Steps','Weight (kg)','Sleep (hrs)','Meal Name','Meal Grams','Meal Calories','Meal Protein','Meal Carbs','Meal Fat','Meal Fiber']);
  allKeys.forEach(ds => {
    const d = getDayData(ds);
    const totalCal   = d.meals.reduce((s,m)=>s+m.calories,0);
    const totalP     = d.meals.reduce((s,m)=>s+m.protein,0);
    const totalC     = d.meals.reduce((s,m)=>s+m.carbs,0);
    const totalF     = d.meals.reduce((s,m)=>s+m.fat,0);
    const totalFiber = d.meals.reduce((s,m)=>s+(m.fiber||0),0);
    if (d.meals.length === 0) {
      rows.push([ds, 0, 0, 0, 0, 0, d.water||0, d.steps||0, d.weight||'', d.sleep||'', '', '', '', '', '', '', '']);
    } else {
      d.meals.forEach((m, i) => {
        rows.push([
          i === 0 ? ds : '',
          i === 0 ? Math.round(totalCal) : '',
          i === 0 ? Math.round(totalP)   : '',
          i === 0 ? Math.round(totalC)   : '',
          i === 0 ? Math.round(totalF)   : '',
          i === 0 ? Math.round(totalFiber): '',
          i === 0 ? (d.water||0)         : '',
          i === 0 ? (d.steps||0)         : '',
          i === 0 ? (d.weight||'')       : '',
          i === 0 ? (d.sleep||'')        : '',
          `"${m.name}"`, m.grams,
          Math.round(m.calories), Math.round(m.protein),
          Math.round(m.carbs),    Math.round(m.fat),
          Math.round(m.fiber||0)
        ]);
      });
    }
  });
  rows.push(['']);

  // Section 3: Food library
  rows.push(['=== FOOD LIBRARY ===']);
  rows.push(['Name','Serving (g)','Calories','Protein (g)','Carbs (g)','Fat (g)','Fiber (g)']);
  [...foods].sort((a,b)=>a.name.localeCompare(b.name)).forEach(f => {
    rows.push([`"${f.name}"`, f.grams, f.calories, f.protein, f.carbs, f.fat, f.fiber||0]);
  });

  const csv = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], {type:'text/csv'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `eatshimo-export-${dateStr(new Date())}.csv`;
  a.click();
}

// ─── IMPORT CSV ──────────────────────────────────────────
function importCSV(event) {
  const file = event.target.files[0];
  if (!file) return;
  const status = document.getElementById('import-status');
  status.textContent = 'Importing...';
  status.style.color = 'var(--text-dim)';

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const lines = e.target.result.split('\n').map(l => l.trim()).filter(l => l);
      let mode = null;
      let importedDays = 0, importedFoods = 0;
      // Collect all meal rows per date before saving
      const dayMeals = {}; // ds -> { meals:[], water, steps, weight }

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Detect sections
        if (line.startsWith('=== PROFILE ==='))      { mode = 'profile'; continue; }
        if (line.startsWith('=== DAILY LOGS ==='))   { mode = 'logs';    continue; }
        if (line.startsWith('=== FOOD LIBRARY ===')) { mode = 'foods';   continue; }

        // Skip header rows
        if (line.startsWith('Gender,') || line.startsWith('Date,') || line.startsWith('Name,')) continue;

        // ── PROFILE ──
        if (mode === 'profile') {
          const cols = parseCSVLine(line);
          const p = {
            gender:      cols[0] || '',
            age:         parseFloat(cols[1]) || 0,
            height:      parseFloat(cols[2]) || 0,
            weight:      parseFloat(cols[3]) || 0,
            activity:    parseFloat(cols[4]) || 1.2,
            proteinGoal: parseFloat(cols[6]) || 0,
            carbsGoal:   parseFloat(cols[7]) || 0,
            fatGoal:     parseFloat(cols[8]) || 0,
          };
          localStorage.setItem('eatshimo_profile', JSON.stringify(p));
          if (cols[5]) localStorage.setItem('eatshimo_cal_target', cols[5]);
        }

        // ── DAILY LOGS ──
        if (mode === 'logs') {
          const cols = parseCSVLine(line);
          // A row with a date in col 0 starts a new day
          const ds = cols[0]?.trim();
          if (ds && /^\d{4}-\d{2}-\d{2}$/.test(ds)) {
            if (!dayMeals[ds]) {
              dayMeals[ds] = {
                water:  parseFloat(cols[6]) || 0,
                steps:  parseInt(cols[7])   || 0,
                weight: cols[8] && cols[8].trim() ? parseFloat(cols[8]) : null,
                sleep:  cols[9] && cols[9].trim() ? parseFloat(cols[9]) : null,
                meals:  []
              };
            }
            // Meal columns start at col 10
            const mealName = cols[10]?.replace(/"/g,'').trim();
            if (mealName) {
              dayMeals[ds].meals.push({
                name:     mealName,
                grams:    parseFloat(cols[11]) || 100,
                calories: parseFloat(cols[12]) || 0,
                protein:  parseFloat(cols[13]) || 0,
                carbs:    parseFloat(cols[14]) || 0,
                fat:      parseFloat(cols[15]) || 0,
                fiber:    parseFloat(cols[16]) || 0,
              });
            }
          } else if (ds === '' && cols[10]) {
            // Continuation row — meal belongs to the last date
            const lastDs = Object.keys(dayMeals).pop();
            if (lastDs) {
              const mealName = cols[10].replace(/"/g,'').trim();
              if (mealName) {
                dayMeals[lastDs].meals.push({
                  name:     mealName,
                  grams:    parseFloat(cols[11]) || 100,
                  calories: parseFloat(cols[12]) || 0,
                  protein:  parseFloat(cols[13]) || 0,
                  carbs:    parseFloat(cols[14]) || 0,
                  fat:      parseFloat(cols[15]) || 0,
                  fiber:    parseFloat(cols[16]) || 0,
                });
              }
            }
          }
        }

        // ── FOOD LIBRARY ──
        if (mode === 'foods') {
          const cols = parseCSVLine(line);
          if (cols.length < 4) continue;
          const name = cols[0].replace(/"/g,'').trim();
          if (!name) continue;
          const exists = foods.some(f => f.name.toLowerCase() === name.toLowerCase());
          if (!exists) {
            foods.push({
              name,
              grams:    parseFloat(cols[1]) || 100,
              calories: parseFloat(cols[2]) || 0,
              protein:  parseFloat(cols[3]) || 0,
              carbs:    parseFloat(cols[4]) || 0,
              fat:      parseFloat(cols[5]) || 0,
              fiber:    parseFloat(cols[6]) || 0,
            });
            importedFoods++;
          }
        }
      }

      // Save all collected day data
      Object.keys(dayMeals).forEach(ds => {
        const incoming = dayMeals[ds];
        const existing = getDayData(ds);
        // Merge: prefer imported meals if any, merge extras
        if (incoming.meals.length > 0) existing.meals = incoming.meals;
        if (incoming.water)  existing.water  = incoming.water;
        if (incoming.steps)  existing.steps  = incoming.steps;
        if (incoming.weight) existing.weight = incoming.weight;
        if (incoming.sleep)  existing.sleep  = incoming.sleep;
        saveDayData(ds, existing);
        importedDays++;
      });

      saveFoodsToDisk();
      renderLibrary();
      renderDailyLog();
      status.textContent = `Imported ${importedDays} day(s) and ${importedFoods} food(s) successfully.`;
      status.style.color = '#2a8a3e';
    } catch(err) {
      console.error(err);
      status.textContent = 'Import failed. Make sure it is a valid Eatshimo CSV file.';
      status.style.color = '#e84040';
    }
    event.target.value = '';
  };
  reader.readAsText(file);
}

// Properly parse a CSV line handling quoted fields
function parseCSVLine(line) {
  const result = [];
  let cur = '', inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQuote = !inQuote; }
    else if (ch === ',' && !inQuote) { result.push(cur); cur = ''; }
    else { cur += ch; }
  }
  result.push(cur);
  return result;
}

// ─── DELETE ALL DATA ─────────────────────────────────────
function deleteAllData() {
  if (!confirm('This will permanently delete ALL your data — food library, daily logs, and profile. Are you sure?')) return;
  if (!confirm('Last warning: this cannot be undone. Delete everything?')) return;
  const toRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith('eatshimo')) toRemove.push(k);
  }
  toRemove.forEach(k => localStorage.removeItem(k));
  foods = [];
  alert('All data deleted. Please refresh to reflect your changes.');
  location.reload();
}

// ─── AI ESTIMATE ─────────────────────────────────────────
function openAIEstimate() {
  const name  = document.getElementById('food-name').value.trim();
  const grams = document.getElementById('food-grams').value.trim();
  let prompt;
  if (name && grams) {
    prompt = `Estimate the nutrition for ${grams}g of ${name}. Give me: calories (kcal), protein (g), carbs (g), fat (g), and fiber (g). Keep the response short and in this exact format:\n\nFood: ${name}\nServing: ${grams}g\nCalories: ?\nProtein: ?g\nCarbs: ?g\nFat: ?g\nFiber: ?g`;
  } else if (name) {
    prompt = `Estimate the nutrition for a typical 100g serving of ${name}. Give me: calories (kcal), protein (g), carbs (g), fat (g), and fiber (g). Keep the response short and in this exact format:\n\nFood: ${name}\nServing: 100g\nCalories: ?\nProtein: ?g\nCarbs: ?g\nFat: ?g\nFiber: ?g`;
  } else {
    prompt = `Estimate the nutrition for a food of my choice. Give me calories (kcal), protein (g), carbs (g), fat (g), and fiber (g) per 100g serving in this format:\n\nFood: [name]\nServing: 100g\nCalories: ?\nProtein: ?g\nCarbs: ?g\nFat: ?g\nFiber: ?g`;
  }
  window.open('https://chatgpt.com/?q=' + encodeURIComponent(prompt), '_blank');
}

// ─── FOOD LIBRARY ────────────────────────────────────────
const PRESETS = {
  common: [
    { name:'White Rice',          grams:100, calories:130, protein:2.7, carbs:28,  fat:0.3, fiber:0.4 },
    { name:'Loaf of White Bread', grams:30,  calories:79,  protein:2.7, carbs:15,  fat:1,   fiber:0.6 },
    { name:'Boiled Egg',          grams:50,  calories:78,  protein:6.3, carbs:0.6, fat:5.3, fiber:0   },
    { name:'Fried Egg',           grams:46,  calories:90,  protein:6.3, carbs:0.4, fat:6.8, fiber:0   },
    { name:'Banana',              grams:120, calories:107, protein:1.3, carbs:27,  fat:0.4, fiber:3.1 },
    { name:'Apple',               grams:182, calories:95,  protein:0.5, carbs:25,  fat:0.3, fiber:4.4 },
    { name:'Orange',              grams:130, calories:62,  protein:1.2, carbs:15,  fat:0.2, fiber:3.1 },
    { name:'Strawberries',        grams:100, calories:32,  protein:0.7, carbs:7.7, fat:0.3, fiber:2   },
    { name:'Mango',               grams:165, calories:99,  protein:1.4, carbs:25,  fat:0.6, fiber:2.6 },
    { name:'Fried Chicken',       grams:150, calories:360, protein:30,  carbs:12,  fat:20,  fiber:0.5 },
    { name:'Rotisserie Chicken',  grams:150, calories:250, protein:34,  carbs:0,   fat:12,  fiber:0   },
    { name:'Steak',               grams:150, calories:330, protein:38,  carbs:0,   fat:19,  fiber:0   },
    { name:'Butter',              grams:14,  calories:102, protein:0.1, carbs:0,   fat:11.5,fiber:0   },
    { name:'Peanut Butter',       grams:32,  calories:188, protein:8,   carbs:6,   fat:16,  fiber:1.9 },
  ],
  filipino: [
    { name:'Pandesal',       grams:40,  calories:120, protein:3.5, carbs:22,  fat:2.5, fiber:0.8 },
    { name:'Lugaw',          grams:200, calories:130, protein:3,   carbs:28,  fat:0.5, fiber:0.5 },
    { name:'Kare-Kare',      grams:200, calories:380, protein:24,  carbs:14,  fat:26,  fiber:3   },
    { name:'Sinangag',       grams:200, calories:300, protein:5,   carbs:54,  fat:8,   fiber:0.8 },
    { name:'Chicken Adobo',  grams:150, calories:320, protein:28,  carbs:4,   fat:20,  fiber:0.3 },
    { name:'Pork Adobo',     grams:150, calories:420, protein:25,  carbs:4,   fat:33,  fiber:0.2 },
    { name:'Pork Sinigang',  grams:250, calories:280, protein:20,  carbs:12,  fat:16,  fiber:2   },
    { name:'Beef Pares',     grams:200, calories:350, protein:28,  carbs:18,  fat:18,  fiber:0.5 },
    { name:'Tocino',         grams:80,  calories:230, protein:16,  carbs:12,  fat:13,  fiber:0   },
    { name:'Longganisa',     grams:80,  calories:280, protein:13,  carbs:8,   fat:22,  fiber:0   },
    { name:'Ensaymada',      grams:80,  calories:280, protein:5,   carbs:38,  fat:13,  fiber:0.5 },
    { name:'Tapa',           grams:80,  calories:210, protein:20,  carbs:4,   fat:12,  fiber:0   },
    { name:'Sisig',          grams:150, calories:430, protein:27,  carbs:5,   fat:34,  fiber:0.5 },
    { name:'Puto',           grams:40,  calories:90,  protein:2,   carbs:18,  fat:1.5, fiber:0.5 },
    { name:'Palabok',        grams:200, calories:310, protein:14,  carbs:42,  fat:10,  fiber:1.5 },
    { name:'Pancit Bihon',   grams:200, calories:270, protein:12,  carbs:40,  fat:7,   fiber:2   },
  ]
};

let activeTab = 'common';

function togglePresets() {
  const panel = document.getElementById('preset-panel');
  panel.classList.toggle('hidden');
  if (!panel.classList.contains('hidden')) renderPresets();
}

function switchTab(tab) {
  activeTab = tab;
  document.querySelectorAll('.preset-tab').forEach((btn,i) => {
    btn.classList.toggle('active', (i===0&&tab==='common')||(i===1&&tab==='filipino'));
  });
  renderPresets();
}

function renderPresets() {
  const list=document.getElementById('preset-list'), items=PRESETS[activeTab];
  list.innerHTML=items.map((f,i)=>`
    <div class="preset-item">
      <div class="preset-info">
        <span class="preset-name">${f.name}</span>
        <span class="preset-meta">${f.grams}g · ${f.calories} kcal · P${f.protein}g C${f.carbs}g F${f.fat}g${f.fiber?' · Fiber '+f.fiber+'g':''}</span>
      </div>
      <button class="btn-add-preset" onclick="addPreset('${activeTab}',${i})">Add</button>
    </div>`).join('');
}

function addPreset(tab, index) {
  const f=PRESETS[tab][index];
  if (foods.some(e=>e.name.toLowerCase()===f.name.toLowerCase())) { alert(`"${f.name}" is already in your library.`); return; }
  foods.push({...f}); saveFoodsToDisk(); renderLibrary();
  const btns=document.querySelectorAll('.btn-add-preset');
  if (btns[index]) { btns[index].textContent='✓ Added'; btns[index].disabled=true; }
}

function saveFood() {
  const name=document.getElementById('food-name').value.trim();
  if (!name) { alert('Please enter a food name.'); return; }
  foods.push({
    name,
    grams:    parseFloat(document.getElementById('food-grams').value)    || 100,
    calories: parseFloat(document.getElementById('food-calories').value) || 0,
    protein:  parseFloat(document.getElementById('food-protein').value)  || 0,
    carbs:    parseFloat(document.getElementById('food-carbs').value)    || 0,
    fat:      parseFloat(document.getElementById('food-fat').value)      || 0,
    fiber:    parseFloat(document.getElementById('food-fiber').value)    || 0,
  });
  saveFoodsToDisk(); renderLibrary(); clearForm();
}

function clearForm() {
  ['food-name','food-grams','food-calories','food-protein','food-carbs','food-fat','food-fiber']
    .forEach(id=>document.getElementById(id).value='');
  document.getElementById('food-name').focus();
}

const LIBRARY_COLLAPSE_THRESHOLD = 5;

function expandLibrary() {
  libraryExpanded = true;
  renderLibrary();
}

function renderLibrary() {
  const query = document.getElementById('search-input').value.toLowerCase();
  const list = document.getElementById('food-list');
  const sorted = [...foods].map((f,i) => ({...f, originalIndex:i})).sort((a,b) => a.name.localeCompare(b.name));
  const filtered = sorted.filter(f => f.name.toLowerCase().includes(query));

  if (filtered.length === 0) {
    list.innerHTML = `<p class="empty-msg">${query ? 'No foods match your search.' : 'No foods saved yet. Add one above or use Presets!'}</p>`;
    return;
  }

  const isSearching = query.length > 0;
  const showAll = libraryExpanded || isSearching || filtered.length <= LIBRARY_COLLAPSE_THRESHOLD;
  const visible = showAll ? filtered : filtered.slice(0, LIBRARY_COLLAPSE_THRESHOLD);
  const hiddenCount = filtered.length - LIBRARY_COLLAPSE_THRESHOLD;

  const itemsHTML = visible.map(f => `
    <div class="food-item">
      <div class="food-info">
        <div class="food-name">${f.name}</div>
        <div class="macros">
          <div class="macro-chip serving">${f.grams||100}g serving</div>
          <div class="macro-chip cal">Cal <span>${f.calories}</span></div>
          <div class="macro-chip">P <span>${f.protein}g</span></div>
          <div class="macro-chip">C <span>${f.carbs}g</span></div>
          <div class="macro-chip">F <span>${f.fat}g</span></div>
          ${f.fiber>0 ? `<div class="macro-chip fiber">Fiber <span>${f.fiber}g</span></div>` : ''}
        </div>
      </div>
      <div class="food-actions">
        <button class="btn-edit" onclick="openEdit(${f.originalIndex})">Edit</button>
        <button class="btn-delete" onclick="deleteFood(${f.originalIndex})">Delete</button>
      </div>
    </div>`).join('');

  const viewAllHTML = (!showAll && hiddenCount > 0) ? `
    <div class="library-view-all">
      <button class="btn-view-all" onclick="expandLibrary()">View All ${filtered.length} Foods ▾</button>
    </div>` : '';

  list.innerHTML = itemsHTML + viewAllHTML;
}

function deleteFood(index) {
  if (!confirm(`Delete "${foods[index].name}"?`)) return;
  foods.splice(index,1); saveFoodsToDisk(); renderLibrary();
}

// ─── EDIT FOOD MODAL ────────────────────────────────────
function openEdit(index) {
  const f = foods[index];
  document.getElementById('edit-index').value    = index;
  document.getElementById('edit-name').value     = f.name;
  document.getElementById('edit-grams').value    = f.grams || 100;
  document.getElementById('edit-calories').value = f.calories;
  document.getElementById('edit-protein').value  = f.protein;
  document.getElementById('edit-carbs').value    = f.carbs;
  document.getElementById('edit-fat').value      = f.fat;
  document.getElementById('edit-fiber').value    = f.fiber || 0;
  document.getElementById('modal-overlay').classList.remove('hidden');
}

function closeModal(e) { if (e.target === document.getElementById('modal-overlay')) closeModalDirect(); }
function closeModalDirect() { document.getElementById('modal-overlay').classList.add('hidden'); }

function updateFood() {
  const index = parseInt(document.getElementById('edit-index').value);
  const name  = document.getElementById('edit-name').value.trim();
  if (!name) { alert('Food name cannot be empty.'); return; }
  foods[index] = {
    name,
    grams:    parseFloat(document.getElementById('edit-grams').value)    || 100,
    calories: parseFloat(document.getElementById('edit-calories').value) || 0,
    protein:  parseFloat(document.getElementById('edit-protein').value)  || 0,
    carbs:    parseFloat(document.getElementById('edit-carbs').value)    || 0,
    fat:      parseFloat(document.getElementById('edit-fat').value)      || 0,
    fiber:    parseFloat(document.getElementById('edit-fiber').value)    || 0,
  };
  saveFoodsToDisk(); renderLibrary(); closeModalDirect();
}

// ─── KEYBOARD ────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeModalDirect(); closeLogModalDirect(); closeCalendarDirect();
    closeEditMealModalDirect(); closeTutorialDirect();
    ['add-ex-overlay','edit-ex-overlay','add-cl-overlay','edit-cl-overlay','foodcat-overlay','editcooldown-overlay']
      .forEach(id => document.getElementById(id)?.classList.add('hidden'));
  }
  if (e.key === 'Enter' && e.target.closest('#add-section')) saveFood();
});

// ─── TUTORIAL ────────────────────────────────────────────
let tutStep = 0;
const TUT_STEPS = 3;

function openTutorial() {
  tutStep = 0;
  renderTutStep();
  document.getElementById('tutorial-overlay').classList.remove('hidden');
}

function closeTutorial(e) {
  if (e.target === document.getElementById('tutorial-overlay')) closeTutorialDirect();
}

function closeTutorialDirect() {
  document.getElementById('tutorial-overlay').classList.add('hidden');
  localStorage.setItem('eatshimo_tutorial_seen', '1');
}

function tutNav(dir) {
  tutStep += dir;
  if (tutStep >= TUT_STEPS) { closeTutorialDirect(); return; }
  if (tutStep < 0) tutStep = 0;
  renderTutStep();
}

function goToStep(n) { tutStep = n; renderTutStep(); }

function renderTutStep() {
  for (let i = 0; i < TUT_STEPS; i++) {
    document.getElementById('tut-step-' + i).classList.toggle('active', i === tutStep);
  }
  document.querySelectorAll('.tut-dot').forEach((d,i) => d.classList.toggle('active', i === tutStep));
  const prev = document.getElementById('tut-prev');
  const next = document.getElementById('tut-next');
  prev.style.visibility = tutStep === 0 ? 'hidden' : 'visible';
  next.textContent = tutStep === TUT_STEPS - 1 ? 'Get Started' : 'Next';
}

// ─── PROFILE-AWARE CALORIE HELPERS ──────────────────────
function getProfileForCalc() {
  const p = JSON.parse(localStorage.getItem('eatshimo_profile') || '{}');
  return {
    weight: parseFloat(p.weight) || 70,
    height: parseFloat(p.height) || 170,
    gender: p.gender || '',
  };
}

function calcStepCalories(steps) {
  const { weight, height, gender } = getProfileForCalc();
  const strideMult = gender === 'female' ? 0.413 : 0.415;
  const strideLenM = (height / 100) * strideMult;
  const distKm = (steps * strideLenM) / 1000;
  const timeHr = distKm / 5.0;
  let cal = 3.5 * weight * timeHr;
  if (gender === 'female') cal *= 0.95;
  return Math.round(cal);
}

function calcExCals(ex, totalUnits) {
  if (ex.calsPerUnit && ex.calsPerUnit > 0) return Math.round(ex.calsPerUnit * totalUnits);
  const { weight, gender } = getProfileForCalc();
  const totalSecs = ex.type === 'reps' ? totalUnits * (ex.secPerUnit || 2.5) : totalUnits;
  const hrs = totalSecs / 3600;
  let cal = (ex.met || 4.0) * weight * hrs;
  if (gender === 'female') cal *= 0.92;
  return Math.round(cal);
}

// ─── CARD TOGGLE SYSTEM ─────────────────────────────────
function getCardEnabled(name) {
  return localStorage.getItem('eatshimo_card_' + name) !== 'false';
}

function saveCardToggle(name, checkbox) {
  localStorage.setItem('eatshimo_card_' + name, checkbox.checked ? 'true' : 'false');
  renderDailyLog();
  if (name === 'extras') updateExtrasChartsVisibility();
}

function loadCardToggles() {
  ['extras','exercise','checklist','fasting','foodmod'].forEach(name => {
    const el = document.getElementById('toggle-' + name);
    if (el) el.checked = getCardEnabled(name);
  });
  updateExtrasChartsVisibility();
}

function updateExtrasChartsVisibility() {
  const show = getCardEnabled('extras');
  ['water','steps','sleep'].forEach(name => {
    const el = document.getElementById('profile-chart-' + name);
    if (el) el.style.display = show ? '' : 'none';
  });
  const wt = document.getElementById('profile-chart-weight');
  if (wt) wt.style.display = show ? '' : 'none';
}

// ─── ASK AI FOR EXERCISE SUGGESTIONS ────────────────────
function openAskAI() {
  const p = JSON.parse(localStorage.getItem('eatshimo_profile') || '{}');
  const parts = [];
  if (p.age)    parts.push(`${p.age} years old`);
  if (p.gender) parts.push(p.gender);
  if (p.height) parts.push(`${p.height} cm tall`);
  if (p.weight) parts.push(`${p.weight} kg`);
  const who = parts.length ? `a ${parts.join(', ')}` : 'someone';

  const exName = document.getElementById('new-ex-name')?.value.trim();
  const exType = document.getElementById('new-ex-type')?.value === 'secs' ? 'second held' : 'repetition';
  const exerciseDesc = exName ? `"${exName}"` : 'an exercise of your choice';

  const prompt = `For ${who}, estimate how many calories are burnt per ${exType} doing ${exerciseDesc}. Give a single decimal number (e.g. 0.4) I can enter directly, plus a one-line explanation of how you calculated it.`;

  navigator.clipboard?.writeText(prompt).catch(() => {});
  window.open('https://chatgpt.com/?q=' + encodeURIComponent(prompt), '_blank');
}

// ─── COLLAPSIBLE CARDS ──────────────────────────────────
function toggleCardCollapse(card) {
  const body = document.getElementById('body-' + card);
  const chevron = document.getElementById('chevron-' + card);
  const isCollapsed = body.style.display === 'none';
  body.style.display = isCollapsed ? '' : 'none';
  chevron.textContent = isCollapsed ? '▲' : '▼';
  localStorage.setItem('eatshimo_' + card + '_collapsed', isCollapsed ? 'false' : 'true');
}

function initCardCollapse(card) {
  const body = document.getElementById('body-' + card);
  const chevron = document.getElementById('chevron-' + card);
  if (!body || !chevron) return;
  const collapsed = localStorage.getItem('eatshimo_' + card + '_collapsed') === 'true';
  body.style.display = collapsed ? 'none' : '';
  chevron.textContent = collapsed ? '▼' : '▲';
}

// ─── RECURRENCE SYSTEM ──────────────────────────────────
function recurrenceAppliesOnDate(rec, dateString) {
  if (!rec) return true;
  // Hard exclusions
  if (rec.endDate && dateString > rec.endDate) return false;
  if (rec.exceptions && rec.exceptions.includes(dateString)) return false;
  const date = new Date(dateString + 'T00:00:00');
  const dow  = date.getDay(); // 0=Sun

  switch (rec.type) {
    case 'once':
      return dateString === rec.date;

    case 'weekly': {
      if (rec.activeSince && dateString < rec.activeSince) return false;
      return !rec.days || rec.days.length === 0 || rec.days.includes(dow);
    }

    case 'every_x_weeks': {
      if (rec.activeSince && dateString < rec.activeSince) return false;
      if (!rec.days || !rec.days.includes(dow)) return false;
      if (!rec.startDate) return true;
      const start = new Date(rec.startDate + 'T00:00:00');
      const startMon = new Date(start); startMon.setDate(start.getDate() - ((start.getDay() + 6) % 7));
      const curMon   = new Date(date);  curMon.setDate(date.getDate()   - ((date.getDay()  + 6) % 7));
      const diffW = Math.round((curMon - startMon) / (7 * 864e5));
      return diffW >= 0 && diffW % (rec.interval || 1) === 0;
    }

    case 'every_x_months': {
      if (rec.activeSince && dateString < rec.activeSince) return false;
      if (!rec.startDate) return true;
      const start = new Date(rec.startDate + 'T00:00:00');
      if (date.getDate() !== start.getDate()) return false;
      const mDiff = (date.getFullYear() - start.getFullYear()) * 12 + (date.getMonth() - start.getMonth());
      return mDiff >= 0 && mDiff % (rec.interval || 1) === 0;
    }

    case 'every_x_years': {
      if (rec.activeSince && dateString < rec.activeSince) return false;
      if (!rec.startDate) return true;
      const start = new Date(rec.startDate + 'T00:00:00');
      if (date.getMonth() !== start.getMonth() || date.getDate() !== start.getDate()) return false;
      const yDiff = date.getFullYear() - start.getFullYear();
      return yDiff >= 0 && yDiff % (rec.interval || 1) === 0;
    }

    case 'every_x_days': {
      if (rec.activeSince && dateString < rec.activeSince) return false;
      if (!rec.startDate) return true;
      const start = new Date(rec.startDate + 'T00:00:00');
      const diffDays = Math.round((date - start) / 864e5);
      return diffDays >= 0 && diffDays % (rec.interval || 1) === 0;
    }

    default: return true;
  }
}

function updateRecurrenceUI(prefix) {
  const type = document.getElementById(prefix + '-recurrence').value;
  const showDays     = type === 'weekly' || type === 'every_x_weeks';
  const showInterval = type === 'every_x_weeks' || type === 'every_x_months' || type === 'every_x_years' || type === 'every_x_days';
  const showPast     = type !== 'once';
  const units = { every_x_weeks: 'weeks', every_x_months: 'months', every_x_years: 'years', every_x_days: 'days' };
  const daysRow = document.getElementById(prefix + '-days-row');
  const intRow  = document.getElementById(prefix + '-interval-row');
  const pastRow = document.getElementById(prefix + '-past-row');
  if (daysRow) daysRow.style.display = showDays     ? '' : 'none';
  if (intRow)  intRow.style.display  = showInterval ? '' : 'none';
  if (pastRow) pastRow.style.display = showPast     ? '' : 'none';
  const unitEl = document.getElementById(prefix + '-interval-unit');
  if (unitEl && units[type]) unitEl.textContent = units[type];
}

function updateEndUI(prefix) {
  const endType = document.getElementById(prefix + '-end-type')?.value || 'never';
  const dateRow  = document.getElementById(prefix + '-end-date-row');
  const countRow = document.getElementById(prefix + '-end-count-row');
  const label    = document.getElementById(prefix + '-end-count-label');
  if (dateRow)  dateRow.style.display  = endType === 'date'           ? '' : 'none';
  if (countRow) countRow.style.display = (endType === 'occurrences' || endType === 'accomplishments') ? '' : 'none';
  if (label) label.textContent = endType === 'accomplishments' ? 'After how many completions?' : 'After how many occurrences?';
}

function getRecurrenceFromModal(prefix) {
  const sel  = document.getElementById(prefix + '-recurrence');
  const type = sel ? sel.value : 'weekly';
  const rec  = { type };
  const today = dateStr(currentDate);
  const applyPastEl = document.getElementById(prefix + '-apply-past');
  const applyPast   = applyPastEl ? applyPastEl.checked : false;

  if (type === 'once') {
    rec.date = today;
  } else {
    rec.activeSince = applyPast ? null : today;
    if (type === 'weekly') {
      rec.days = getPickerDays(prefix + '-days-picker');
    } else if (type === 'every_x_weeks') {
      rec.days      = getPickerDays(prefix + '-days-picker');
      rec.interval  = parseInt(document.getElementById(prefix + '-interval')?.value) || 1;
      rec.startDate = today;
    } else if (type === 'every_x_days') {
      rec.interval  = parseInt(document.getElementById(prefix + '-interval')?.value) || 1;
      rec.startDate = today;
    } else if (type === 'every_x_months' || type === 'every_x_years') {
      rec.interval  = parseInt(document.getElementById(prefix + '-interval')?.value) || 1;
      rec.startDate = today;
    }
  }

  // End condition
  const endType = document.getElementById(prefix + '-end-type')?.value || 'never';
  rec.endType = endType;
  if (endType === 'date') {
    rec.endDate = document.getElementById(prefix + '-end-date')?.value || null;
  } else if (endType === 'occurrences') {
    rec.endAfterOccurrences = parseInt(document.getElementById(prefix + '-end-count')?.value) || 0;
  } else if (endType === 'accomplishments') {
    rec.endAfterAccomplishments = parseInt(document.getElementById(prefix + '-end-count')?.value) || 0;
  }

  return rec;
}

function setRecurrenceToModal(prefix, rec) {
  if (!rec) rec = { type: 'weekly', days: [0,1,2,3,4,5,6] };
  const sel = document.getElementById(prefix + '-recurrence');
  if (sel) sel.value = rec.type || 'weekly';
  if (rec.days)     setPickerDays(prefix + '-days-picker', rec.days);
  if (rec.interval) { const el = document.getElementById(prefix + '-interval'); if (el) el.value = rec.interval; }
  updateRecurrenceUI(prefix);
  // Restore end condition
  const endType = rec.endType || 'never';
  const endSel = document.getElementById(prefix + '-end-type');
  if (endSel) endSel.value = endType;
  if (endType === 'date' && rec.endDate) {
    const el = document.getElementById(prefix + '-end-date'); if (el) el.value = rec.endDate;
  } else if (endType === 'occurrences' && rec.endAfterOccurrences) {
    const el = document.getElementById(prefix + '-end-count'); if (el) el.value = rec.endAfterOccurrences;
  } else if (endType === 'accomplishments' && rec.endAfterAccomplishments) {
    const el = document.getElementById(prefix + '-end-count'); if (el) el.value = rec.endAfterAccomplishments;
  }
  updateEndUI(prefix);
}

// ─── EXERCISE TRACKER ───────────────────────────────────
function getExLib() {
  return JSON.parse(localStorage.getItem('eatshimo_ex_lib') || '[]');
}
function saveExLib(lib) { localStorage.setItem('eatshimo_ex_lib', JSON.stringify(lib)); }

// Active list: [{id, recurrence:{...}}]
// Transparently migrates old formats
function getActiveExList() {
  const raw = JSON.parse(localStorage.getItem('eatshimo_active_ex') || '[]');
  return raw.map(item => {
    if (typeof item === 'string')
      return { id: item, recurrence: { type: 'weekly', days: [0,1,2,3,4,5,6], activeSince: null } };
    // migrate old {id, days, activeSince} format
    if (item.days !== undefined && !item.recurrence)
      return { id: item.id, recurrence: { type: 'weekly', days: item.days, activeSince: item.activeSince } };
    return item;
  });
}
function saveActiveExList(list) { localStorage.setItem('eatshimo_active_ex', JSON.stringify(list)); }

// Day picker helpers
function toggleDayBtn(btn) { btn.classList.toggle('active'); btn.blur(); }

function getPickerDays(pickerId) {
  const days = [];
  document.querySelectorAll('#' + pickerId + ' .day-btn.active').forEach(btn => {
    days.push(parseInt(btn.dataset.day));
  });
  return days.length > 0 ? days : [0,1,2,3,4,5,6];
}

function setPickerDays(pickerId, days) {
  document.querySelectorAll('#' + pickerId + ' .day-btn').forEach(btn => {
    btn.classList.toggle('active', days.includes(parseInt(btn.dataset.day)));
  });
}

function renderExerciseCard() {
  const lib = getExLib();
  const activeList = getActiveExList();
  const key = dateStr(currentDate);
  const data = getDayData(key);
  const exercises = data.exercises || {};
  const list = document.getElementById('exercise-list');
  if (!list) return;

  const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const dayOfWeek = new Date(key + 'T00:00:00').getDay();
  const applicable = activeList.filter(entry =>
    recurrenceAppliesOnDate(entry.recurrence, key) && !exEntryHasEnded(entry, key)
  );

  if (applicable.length === 0) {
    const hasAny = activeList.length > 0;
    list.innerHTML = hasAny
      ? `<p class="empty-msg" style="padding:12px 0 4px;">No exercises scheduled for ${DAY_NAMES[dayOfWeek]}.</p>`
      : `<p class="card-desc">Log workouts like pushups, planks, or runs and track calories burned per session.</p>`;
    return;
  }

  list.innerHTML = applicable.map(entry => {
    const ex = lib.find(e => e.id === entry.id);
    if (!ex) return '';
    const sets = (exercises[ex.id] || {}).sets || [];
    const total = sets.reduce((a, b) => a + b, 0);
    const kcal = total > 0 ? calcExCals(ex, total) : 0;
    const unit = ex.type === 'reps' ? 'reps' : 'sec';
    const goal = ex.goal > 0;
    const progress = goal ? Math.min(100, Math.round((total / ex.goal) * 100)) : 0;
    const goalText = goal ? `/ ${ex.goal} ${unit}` : '';
    const r = entry.recurrence || {};
    let dayTags = '';
    if (r.type === 'once') dayTags = '<span class="ex-day-tag">Once</span>';
    else if (r.type === 'every_x_days')   dayTags = `<span class="ex-day-tag">Every ${r.interval||1}d</span>`;
    else if (r.type === 'every_x_weeks')  dayTags = `<span class="ex-day-tag">Every ${r.interval||1}w</span>`;
    else if (r.type === 'every_x_months') dayTags = `<span class="ex-day-tag">Every ${r.interval||1}mo</span>`;
    else if (r.type === 'every_x_years')  dayTags = `<span class="ex-day-tag">Every ${r.interval||1}yr</span>`;
    else if (r.type === 'weekly' && r.days && r.days.length < 7)
      dayTags = r.days.sort().map(d => `<span class="ex-day-tag">${DAY_NAMES[d].slice(0,1)}</span>`).join('');
    return `
    <div class="ex-item" data-ex-id="${ex.id}">
      <div class="ex-header">
        <div class="ex-name-row">
          <span class="ex-name">${ex.name}</span>
          <span class="ex-type-badge">${ex.type === 'reps' ? 'Reps' : 'Secs'}</span>
          ${dayTags ? `<span class="ex-day-tags">${dayTags}</span>` : ''}
        </div>
        <button class="btn-ex-settings" data-ex-id="${ex.id}">⚙</button>
      </div>
      ${goal ? `<div class="ex-progress-bar-wrap"><div class="ex-progress-bar" style="width:${progress}%"></div></div>` : ''}
      <div class="ex-summary">
        ${sets.length > 0
          ? `<span class="ex-sets-display">${sets.join(' · ')} = <strong>${total}</strong> ${unit} ${goalText}</span>`
          : `<span class="ex-sets-display" style="color:var(--text-dim);">No sets logged yet ${goalText ? '(' + ex.goal + ' ' + unit + ')' : ''}</span>`}
        ${kcal > 0 ? `<span class="ex-kcal">≈ ${kcal} kcal</span>` : ''}
      </div>
      <div class="ex-log-row">
        <input type="number" class="ex-input" data-ex-id="${ex.id}" placeholder="${ex.type === 'reps' ? 'reps' : 'secs'}" min="1" />
        <button class="btn-log-set" data-ex-id="${ex.id}">Log Set</button>
        ${sets.length > 0 ? `<button class="btn-remove-set" data-ex-id="${ex.id}">Undo</button>` : ''}
      </div>
    </div>`;
  }).join('');

  // Event delegation — avoids inline onclick escaping issues
  list.querySelectorAll('.btn-ex-settings').forEach(btn => {
    btn.addEventListener('click', () => openEditExModal(btn.dataset.exId));
  });
  list.querySelectorAll('.btn-log-set').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = btn.closest('.ex-log-row').querySelector('.ex-input');
      logExSetDirect(btn.dataset.exId, input);
    });
  });
  list.querySelectorAll('.btn-remove-set').forEach(btn => {
    btn.addEventListener('click', () => removeLastExSet(btn.dataset.exId));
  });
  list.querySelectorAll('.ex-input').forEach(input => {
    input.addEventListener('keydown', e => { if (e.key === 'Enter') { logExSetDirect(input.dataset.exId, input); } });
  });
}

function logExSetDirect(exId, input) {
  const val = parseFloat(input.value);
  if (!val || val <= 0) return;
  const key = dateStr(currentDate), data = getDayData(key);
  if (!data.exercises[exId]) data.exercises[exId] = { sets: [] };
  data.exercises[exId].sets.push(val);
  saveDayData(key, data);
  input.value = '';
  renderExerciseCard();
}

function logExSet(exId) {
  const input = document.getElementById('ex-input-' + exId) || document.querySelector(`.ex-input[data-ex-id="${exId}"]`);
  if (input) logExSetDirect(exId, input);
}

function removeLastExSet(exId) {
  const key = dateStr(currentDate), data = getDayData(key);
  if (data.exercises[exId] && data.exercises[exId].sets.length > 0) {
    data.exercises[exId].sets.pop();
    saveDayData(key, data);
  }
  renderExerciseCard();
}

// Add Exercise Modal
function openAddExModal(defaultRec) {
  const type = defaultRec || 'weekly';
  const sel = document.getElementById('new-ex-recurrence');
  if (sel) sel.value = type;
  setPickerDays('new-ex-days-picker', [0,1,2,3,4,5,6]);
  const pastCb = document.getElementById('new-ex-apply-past');
  if (pastCb) pastCb.checked = false;
  updateRecurrenceUI('new-ex');
  document.getElementById('new-ex-name').value = '';
  document.getElementById('new-ex-goal').value = '';
  document.getElementById('new-ex-cals-per-unit').value = '';
  document.getElementById('add-ex-overlay').classList.remove('hidden');
}
function closeAddExModal() {
  document.getElementById('add-ex-overlay').classList.add('hidden');
  renderExerciseCard();
}

function addCustomExercise() {
  const name = document.getElementById('new-ex-name').value.trim();
  const type = document.getElementById('new-ex-type').value;
  const goal = parseInt(document.getElementById('new-ex-goal').value) || 0;
  const calsPerUnit = parseFloat(document.getElementById('new-ex-cals-per-unit').value) || 0;
  if (!name) { alert('Please enter an exercise name.'); return; }
  if (!calsPerUnit || calsPerUnit <= 0) { alert('Please enter calories burnt per rep/sec. Use "Ask AI for Calories Burnt" if unsure.'); return; }
  const lib = getExLib();
  const id = 'ex_' + Date.now();
  lib.push({ id, name, type, goal, calsPerUnit });
  saveExLib(lib);
  const rec = getRecurrenceFromModal('new-ex');
  const list = getActiveExList();
  list.push({ id, recurrence: rec });
  saveActiveExList(list);
  document.getElementById('add-ex-overlay').classList.add('hidden');
  renderExerciseCard();
}

// Edit Exercise Modal
let editExId = null;

function openEditExModal(exId) {
  editExId = exId;
  const ex = getExLib().find(e => e.id === exId);
  if (!ex) return;
  document.getElementById('edit-ex-name').value = ex.name;
  document.getElementById('edit-ex-goal').value = ex.goal || '';
  document.getElementById('edit-ex-cals-per-unit').value = ex.calsPerUnit || '';
  const entry = getActiveExList().find(e => e.id === exId);
  setRecurrenceToModal('edit-ex', entry?.recurrence);
  document.getElementById('edit-ex-overlay').classList.remove('hidden');
}

function saveEditEx() {
  const lib = getExLib();
  const idx = lib.findIndex(e => e.id === editExId);
  if (idx === -1) return;
  const name = document.getElementById('edit-ex-name').value.trim();
  const calsPerUnit = parseFloat(document.getElementById('edit-ex-cals-per-unit').value) || 0;
  if (!calsPerUnit || calsPerUnit <= 0) { alert('Please enter calories burnt per rep/sec.'); return; }
  if (name) lib[idx].name = name;
  lib[idx].goal = parseInt(document.getElementById('edit-ex-goal').value) || 0;
  lib[idx].calsPerUnit = calsPerUnit;
  saveExLib(lib);
  const list = getActiveExList();
  const entryIdx = list.findIndex(e => e.id === editExId);
  if (entryIdx !== -1) list[entryIdx].recurrence = getRecurrenceFromModal('edit-ex');
  saveActiveExList(list);
  document.getElementById('edit-ex-overlay').classList.add('hidden');
  renderExerciseCard();
}

function prevDateStr(ds) {
  const d = new Date(ds + 'T00:00:00'); d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

// Count how many days rec applied from start up to (but not including) dateString
function countOccurrences(rec, dateString) {
  const startDs = rec.activeSince || rec.startDate || '2020-01-01';
  if (dateString <= startDs) return 0;
  let count = 0;
  const recNoEnd = { ...rec, endDate: null, endAfterOccurrences: undefined, endAfterAccomplishments: undefined };
  const start = new Date(startDs + 'T00:00:00');
  const end   = new Date(dateString + 'T00:00:00');
  for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
    if (recurrenceAppliesOnDate(recNoEnd, d.toISOString().slice(0, 10))) count++;
  }
  return count;
}

// Count days where exercise was actually completed (sets logged)
function countExAccomplishments(exId, toDateString) {
  let count = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k || !k.startsWith('eatshimo_day_')) continue;
    const ds = k.replace('eatshimo_day_', '');
    if (ds >= toDateString) continue;
    try {
      const d = JSON.parse(localStorage.getItem(k));
      if (d?.exercises?.[exId]?.sets?.length > 0) count++;
    } catch(e) {}
  }
  return count;
}

// Count habit completions (at least 1 checkbox ticked)
function countCLAccomplishments(clId, toDateString) {
  let count = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k || !k.startsWith('eatshimo_day_')) continue;
    const ds = k.replace('eatshimo_day_', '');
    if (ds >= toDateString) continue;
    try {
      const d = JSON.parse(localStorage.getItem(k));
      if ((d?.checklist?.[clId] || 0) > 0) count++;
    } catch(e) {}
  }
  return count;
}

function exEntryHasEnded(entry, dateString) {
  const rec = entry.recurrence || {};
  if (!rec.endType || rec.endType === 'never') return false;
  if (rec.endType === 'date') return rec.endDate ? dateString > rec.endDate : false;
  if (rec.endType === 'occurrences')
    return rec.endAfterOccurrences ? countOccurrences(rec, dateString) >= rec.endAfterOccurrences : false;
  if (rec.endType === 'accomplishments')
    return rec.endAfterAccomplishments ? countExAccomplishments(entry.id, dateString) >= rec.endAfterAccomplishments : false;
  return false;
}

function clItemHasEnded(item, dateString) {
  const rec = item.recurrence || {};
  if (!rec.endType || rec.endType === 'never') return false;
  if (rec.endType === 'date') return rec.endDate ? dateString > rec.endDate : false;
  if (rec.endType === 'occurrences')
    return rec.endAfterOccurrences ? countOccurrences(rec, dateString) >= rec.endAfterOccurrences : false;
  if (rec.endType === 'accomplishments')
    return rec.endAfterAccomplishments ? countCLAccomplishments(item.id, dateString) >= rec.endAfterAccomplishments : false;
  return false;
}

function showDeletePanel(type) {
  document.getElementById(type + '-delete-panel').style.display = '';
}
function hideDeletePanel(type) {
  document.getElementById(type + '-delete-panel').style.display = 'none';
}

function deleteExFromTracker(mode) {
  const today = dateStr(currentDate);
  if (mode === 'all') {
    saveActiveExList(getActiveExList().filter(e => e.id !== editExId));
  } else if (mode === 'once') {
    const list = getActiveExList();
    const idx = list.findIndex(e => e.id === editExId);
    if (idx !== -1) {
      if (!list[idx].recurrence.exceptions) list[idx].recurrence.exceptions = [];
      if (!list[idx].recurrence.exceptions.includes(today)) list[idx].recurrence.exceptions.push(today);
      saveActiveExList(list);
    }
  } else if (mode === 'future') {
    const list = getActiveExList();
    const idx = list.findIndex(e => e.id === editExId);
    if (idx !== -1) {
      list[idx].recurrence.endDate = prevDateStr(today);
      saveActiveExList(list);
    }
  }
  document.getElementById('edit-ex-overlay').classList.add('hidden');
  hideDeletePanel('ex');
  renderExerciseCard();
}

// ─── HEALTH ROUTINES CHECKLIST ──────────────────────────
function getCLItems() {
  const raw = JSON.parse(localStorage.getItem('eatshimo_checklist') || '[]');
  return raw.map(item => {
    // Migrate old format (has days/activeSince but no recurrence)
    if (item.days !== undefined && !item.recurrence)
      return { ...item, recurrence: { type: 'weekly', days: item.days, activeSince: item.activeSince } };
    if (!item.recurrence)
      item.recurrence = { type: 'weekly', days: [0,1,2,3,4,5,6], activeSince: null };
    return item;
  });
}
function saveCLItems(items) { localStorage.setItem('eatshimo_checklist', JSON.stringify(items)); }

function renderChecklistCard() {
  const items = getCLItems();
  const key = dateStr(currentDate);
  const data = getDayData(key);
  const checks = data.checklist || {};
  const list = document.getElementById('checklist-list');
  if (!list) return;

  const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const dayOfWeek = new Date(key + 'T00:00:00').getDay();

  const applicable = items.filter(item =>
    recurrenceAppliesOnDate(item.recurrence, key) && !clItemHasEnded(item, key)
  );

  if (items.length === 0) {
    list.innerHTML = '<p class="card-desc">Track daily habits like vitamins, skincare, or medication with checkboxes for each occurrence.</p>';
    return;
  }
  if (applicable.length === 0) {
    list.innerHTML = `<p class="empty-msg" style="padding:12px 0 4px;">No habits scheduled for ${DAY_NAMES[dayOfWeek]}.</p>`;
    return;
  }

  list.innerHTML = applicable.map(item => {
    const checked = checks[item.id] || 0;
    const cr = item.recurrence || {};
    let dayTags = '';
    if (cr.type === 'once') dayTags = '<span class="ex-day-tag">Once</span>';
    else if (cr.type === 'every_x_days')   dayTags = `<span class="ex-day-tag">Every ${cr.interval||1}d</span>`;
    else if (cr.type === 'every_x_weeks')  dayTags = `<span class="ex-day-tag">Every ${cr.interval||1}w</span>`;
    else if (cr.type === 'every_x_months') dayTags = `<span class="ex-day-tag">Every ${cr.interval||1}mo</span>`;
    else if (cr.type === 'every_x_years')  dayTags = `<span class="ex-day-tag">Every ${cr.interval||1}yr</span>`;
    else if (cr.type === 'weekly' && cr.days && cr.days.length < 7)
      dayTags = cr.days.sort().map(d => `<span class="ex-day-tag">${DAY_NAMES[d].slice(0,1)}</span>`).join('');
    const boxes = Array.from({ length: item.count }, (_, i) =>
      `<button class="cl-box${i < checked ? ' checked' : ''}" data-item-id="${item.id}" data-box-index="${i}">${i < checked ? '✓' : ''}</button>`
    ).join('');
    return `
    <div class="cl-item" data-item-id="${item.id}">
      <div class="cl-item-content">
        <div>
          <span class="cl-name">${item.name}</span>
          ${dayTags ? `<span class="ex-day-tags" style="margin-left:6px;">${dayTags}</span>` : ''}
        </div>
        <div class="cl-boxes">${boxes}</div>
      </div>
      <button class="btn-cl-edit" data-item-id="${item.id}">Edit</button>
    </div>`;
  }).join('');

  // Attach events via data attributes — avoids inline quote escaping issues
  list.querySelectorAll('.cl-box').forEach(btn => {
    btn.addEventListener('click', () => toggleCLBox(btn.dataset.itemId, parseInt(btn.dataset.boxIndex)));
  });
  list.querySelectorAll('.btn-cl-edit').forEach(btn => {
    btn.addEventListener('click', () => openEditCLModal(btn.dataset.itemId));
  });
}

function toggleCLBox(itemId, boxIndex) {
  const key = dateStr(currentDate), data = getDayData(key);
  const cur = data.checklist[itemId] || 0;
  data.checklist[itemId] = cur === boxIndex + 1 ? boxIndex : boxIndex + 1;
  saveDayData(key, data);
  renderChecklistCard();
}

function openAddCLModal(defaultRec) {
  document.getElementById('new-cl-name').value = '';
  document.getElementById('new-cl-count').value = '1';
  const type = defaultRec || 'weekly';
  const sel = document.getElementById('new-cl-recurrence');
  if (sel) sel.value = type;
  setPickerDays('new-cl-days-picker', [0,1,2,3,4,5,6]);
  const pastCb = document.getElementById('new-cl-apply-past');
  if (pastCb) pastCb.checked = false;
  updateRecurrenceUI('new-cl');
  document.getElementById('add-cl-overlay').classList.remove('hidden');
}

function saveNewCL() {
  const name = document.getElementById('new-cl-name').value.trim();
  const count = Math.min(5, Math.max(1, parseInt(document.getElementById('new-cl-count').value) || 1));
  if (!name) { alert('Please enter a routine name.'); return; }
  const rec = getRecurrenceFromModal('new-cl');
  const items = getCLItems();
  items.push({ id: 'cl_' + Date.now(), name, count, recurrence: rec });
  saveCLItems(items);
  document.getElementById('add-cl-overlay').classList.add('hidden');
  renderChecklistCard();
}

let editCLId = null;

function openEditCLModal(itemId) {
  editCLId = itemId;
  const item = getCLItems().find(i => i.id === itemId);
  if (!item) return;
  document.getElementById('edit-cl-name').value = item.name;
  document.getElementById('edit-cl-count').value = item.count;
  setRecurrenceToModal('edit-cl', item.recurrence);
  document.getElementById('edit-cl-overlay').classList.remove('hidden');
}

function saveEditCL() {
  const items = getCLItems();
  const idx = items.findIndex(i => i.id === editCLId);
  if (idx === -1) return;
  const name = document.getElementById('edit-cl-name').value.trim();
  if (name) items[idx].name = name;
  items[idx].count = Math.min(5, Math.max(1, parseInt(document.getElementById('edit-cl-count').value) || 1));
  items[idx].recurrence = getRecurrenceFromModal('edit-cl');
  saveCLItems(items);
  document.getElementById('edit-cl-overlay').classList.add('hidden');
  renderChecklistCard();
}

function deleteCLItem(mode) {
  const today = dateStr(currentDate);
  if (mode === 'all') {
    saveCLItems(getCLItems().filter(i => i.id !== editCLId));
  } else if (mode === 'once') {
    const items = getCLItems();
    const idx = items.findIndex(i => i.id === editCLId);
    if (idx !== -1) {
      if (!items[idx].recurrence) items[idx].recurrence = { type: 'weekly', days: [0,1,2,3,4,5,6] };
      if (!items[idx].recurrence.exceptions) items[idx].recurrence.exceptions = [];
      if (!items[idx].recurrence.exceptions.includes(today)) items[idx].recurrence.exceptions.push(today);
      saveCLItems(items);
    }
  } else if (mode === 'future') {
    const items = getCLItems();
    const idx = items.findIndex(i => i.id === editCLId);
    if (idx !== -1) {
      if (!items[idx].recurrence) items[idx].recurrence = { type: 'weekly', days: [0,1,2,3,4,5,6] };
      items[idx].recurrence.endDate = prevDateStr(today);
      saveCLItems(items);
    }
  }
  document.getElementById('edit-cl-overlay').classList.add('hidden');
  hideDeletePanel('cl');
  renderChecklistCard();
}

// ════════════════════════════════════════════════════════════
// ─── FASTING TRACKER ────────────────────────────────────────
// ════════════════════════════════════════════════════════════
let fastingTimerInterval = null;

const FASTING_PRESETS = {
  '16:8':  { fastingHours: 16, eatingHours: 8 },
  '18:6':  { fastingHours: 18, eatingHours: 6 },
  '14:10': { fastingHours: 14, eatingHours: 10 },
};

function getFastingConfig() {
  return JSON.parse(localStorage.getItem('eatshimo_fasting') || '{"preset":"16:8","fastingHours":16,"eatingHours":8,"startHour":20,"startMin":0}');
}
function saveFastingConfig(cfg) { localStorage.setItem('eatshimo_fasting', JSON.stringify(cfg)); }

function setFastingPreset(preset) {
  const cfg = getFastingConfig();
  cfg.preset = preset;
  if (FASTING_PRESETS[preset]) {
    cfg.fastingHours = FASTING_PRESETS[preset].fastingHours;
    cfg.eatingHours  = FASTING_PRESETS[preset].eatingHours;
  }
  saveFastingConfig(cfg);
  renderFastingCard();
}

function updateCustomFasting() {
  const fh = parseInt(document.getElementById('fast-hours')?.value) || 16;
  const eh = parseInt(document.getElementById('eat-hours')?.value)  || 8;
  const cfg = getFastingConfig();
  cfg.fastingHours = fh; cfg.eatingHours = eh;
  saveFastingConfig(cfg);
  renderFastingCard();
}

function saveFastingStartTime() {
  const val = document.getElementById('fast-start-time')?.value || '20:00';
  const [h, m] = val.split(':').map(Number);
  const cfg = getFastingConfig();
  cfg.startHour = h; cfg.startMin = m || 0;
  saveFastingConfig(cfg);
  renderFastingCard();
}

function getFastingStatus(cfg) {
  const tz = JSON.parse(localStorage.getItem('eatshimo_profile') || '{}').timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  const nowLocal = new Date(new Date().toLocaleString('en-US', { timeZone: tz }));
  const nowMin = nowLocal.getHours() * 60 + nowLocal.getMinutes() + nowLocal.getSeconds() / 60;
  const startMin = (cfg.startHour || 20) * 60 + (cfg.startMin || 0);
  const fastMin  = (cfg.fastingHours || 16) * 60;
  const eatMin   = (cfg.eatingHours  || 8)  * 60;
  const sinceStart = ((nowMin - startMin) % 1440 + 1440) % 1440;
  if (sinceStart < fastMin) {
    return { phase: 'fasting', elapsed: sinceStart, remaining: fastMin - sinceStart, total: fastMin };
  } else {
    const eatElapsed = sinceStart - fastMin;
    return { phase: 'eating', elapsed: eatElapsed, remaining: eatMin - eatElapsed, total: eatMin };
  }
}

function fmtHHMM(totalMinutes) {
  const h = Math.floor(Math.abs(totalMinutes) / 60);
  const m = Math.floor(Math.abs(totalMinutes) % 60);
  return `${h}h ${m.toString().padStart(2,'0')}m`;
}

function formatTimeHHMM(h, m) {
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hh = ((h % 12) || 12);
  return `${hh}:${m.toString().padStart(2,'0')} ${suffix}`;
}

function renderFastingCard() {
  if (!document.getElementById('fasting-status-display')) return;
  const cfg = getFastingConfig();

  // Update preset buttons
  document.querySelectorAll('.fast-preset-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.preset === cfg.preset);
  });

  // Custom row
  const customRow = document.getElementById('fasting-custom-row');
  if (customRow) customRow.style.display = cfg.preset === 'custom' ? '' : 'none';
  if (cfg.preset === 'custom') {
    const fhEl = document.getElementById('fast-hours');
    const ehEl = document.getElementById('eat-hours');
    if (fhEl) fhEl.value = cfg.fastingHours;
    if (ehEl) ehEl.value = cfg.eatingHours;
  }

  // Start time input
  const stEl = document.getElementById('fast-start-time');
  if (stEl) stEl.value = `${String(cfg.startHour||20).padStart(2,'0')}:${String(cfg.startMin||0).padStart(2,'0')}`;

  // Window label
  const eatStartH = ((cfg.startHour || 20) + (cfg.fastingHours || 16)) % 24;
  const eatStartM = cfg.startMin || 0;
  const fastRestartH = (eatStartH + (cfg.eatingHours || 8)) % 24;
  const wlEl = document.getElementById('fasting-window-label');
  if (wlEl) wlEl.textContent =
    `Fast ${formatTimeHHMM(cfg.startHour||20, cfg.startMin||0)} – ${formatTimeHHMM(eatStartH, eatStartM)}  ·  Eat ${formatTimeHHMM(eatStartH, eatStartM)} – ${formatTimeHHMM(fastRestartH, eatStartM)}`;

  // Status display
  updateFastingDisplay(cfg);

  // Timer
  if (fastingTimerInterval) clearInterval(fastingTimerInterval);
  fastingTimerInterval = setInterval(() => {
    if (document.getElementById('fasting-status-display') && getCardEnabled('fasting'))
      updateFastingDisplay(getFastingConfig());
  }, 30000);
}

function updateFastingDisplay(cfg) {
  const el = document.getElementById('fasting-status-display');
  if (!el) return;
  const s = getFastingStatus(cfg);
  const pct = Math.round((s.elapsed / s.total) * 100);
  const isFasting = s.phase === 'fasting';
  el.innerHTML = `
    <div class="fasting-status-box ${isFasting ? 'fasting-active' : 'eating-active'}">
      <div class="fasting-phase-label">${isFasting ? 'Fasting' : 'Eating Window'}</div>
      <div class="fasting-remaining">${fmtHHMM(s.remaining)} remaining</div>
      <div class="fasting-bar-wrap"><div class="fasting-bar" style="width:${pct}%"></div></div>
      <div class="fasting-pct">${pct}% complete</div>
    </div>`;
}

// ════════════════════════════════════════════════════════════
// ─── FOOD MODERATOR ─────────────────────────────────────────
// ════════════════════════════════════════════════════════════
function getFoodCats()    { return JSON.parse(localStorage.getItem('eatshimo_food_cats') || '[]'); }
function saveFoodCats(v)  { localStorage.setItem('eatshimo_food_cats', JSON.stringify(v)); }
function getFoodTags()    { return JSON.parse(localStorage.getItem('eatshimo_food_tags') || '{}'); }
function saveFoodTags(v)  { localStorage.setItem('eatshimo_food_tags', JSON.stringify(v)); }
function getCooldowns()   { return JSON.parse(localStorage.getItem('eatshimo_cooldowns') || '{}'); }
function saveCooldowns(v) { localStorage.setItem('eatshimo_cooldowns', JSON.stringify(v)); }
function getCooldownSetting() { return localStorage.getItem('eatshimo_cooldown_setting') || 'reset'; }
function saveCooldownSetting(v) {
  localStorage.setItem('eatshimo_cooldown_setting', v);
  renderFoodModCard();
}

function cooldownDaysRemaining(catId) {
  const cds = getCooldowns();
  const entry = cds[catId];
  if (!entry || !entry.lastConsumed) return 0;
  const daysSince = Math.floor((Date.now() - new Date(entry.lastConsumed + 'T00:00:00').getTime()) / 864e5);
  return Math.max(0, entry.currentCooldownDays - daysSince);
}

function renderFoodModCard() {
  const list = document.getElementById('foodmod-list');
  if (!list) return;
  const cats = getFoodCats();
  const setting = getCooldownSetting();
  const settingEl = document.getElementById('foodmod-setting');
  if (settingEl) settingEl.value = setting;

  if (cats.length === 0) {
    list.innerHTML = '<p class="card-desc">Set cooldown periods for foods like canned goods or sugary treats to space out how often you eat them.</p>';
    return;
  }

  list.innerHTML = cats.map(cat => {
    const rem = cooldownDaysRemaining(cat.id);
    const isReady = rem === 0;
    return `
    <div class="foodmod-item" data-cat-id="${cat.id}">
      <div class="foodmod-item-top">
        <div>
          <span class="foodmod-cat-name">${cat.name}</span>
          <span class="foodmod-cooldown-default">${cat.cooldownDays}d default</span>
        </div>
        <div class="foodmod-status ${isReady ? 'status-ready' : 'status-cooling'}">
          ${isReady ? '✓ Ready' : `${rem}d left`}
        </div>
      </div>
      <div class="foodmod-actions">
        <button class="btn-foodmod-action btn-foodmod-edit">Edit</button>
        ${isReady
          ? `<button class="btn-foodmod-action btn-foodmod-trigger">Start Cooldown</button>`
          : `<button class="btn-foodmod-action btn-foodmod-cd">Edit Cooldown</button>`}
      </div>
    </div>`;
  }).join('');

  // Attach events via data attributes (avoids inline quote escaping issues)
  list.querySelectorAll('[data-cat-id]').forEach(item => {
    const catId = item.dataset.catId;
    item.querySelector('.btn-foodmod-edit')?.addEventListener('click', () => openFoodCatModal(catId));
    item.querySelector('.btn-foodmod-trigger')?.addEventListener('click', () => triggerCooldown(catId));
    item.querySelector('.btn-foodmod-cd')?.addEventListener('click', () => openEditCooldownModal(catId));
  });
}

// Check + update cooldown when food is logged
function checkFoodModerator(foodName) {
  const tags = getFoodTags();
  const catIds = tags[foodName] || [];
  if (!catIds.length) return;
  const cats = getFoodCats();
  const cds  = getCooldowns();
  const setting = getCooldownSetting();
  // Use the date being viewed, not today — so logging on yesterday counts from yesterday
  const logDate = dateStr(currentDate);
  catIds.forEach(catId => {
    const cat = cats.find(c => c.id === catId);
    if (!cat) return;
    const rem = cooldownDaysRemaining(catId);
    let newCooldown = cat.cooldownDays;
    if (rem > 0 && setting === 'extend') newCooldown = rem + cat.cooldownDays;
    cds[catId] = { lastConsumed: logDate, currentCooldownDays: newCooldown };
  });
  saveCooldowns(cds);
  if (getCardEnabled('foodmod') && document.getElementById('foodmod-list')) renderFoodModCard();
}

// Manually start cooldown for a category (without a food being logged)
function triggerCooldown(catId) {
  const cat = getFoodCats().find(c => c.id === catId);
  if (!cat) return;
  const cds = getCooldowns();
  cds[catId] = { lastConsumed: dateStr(currentDate), currentCooldownDays: cat.cooldownDays };
  saveCooldowns(cds);
  renderFoodModCard();
}
let foodCatSelectedNames = [];

function openFoodCatModal(catId) {
  editingCatId = catId || null;
  const cats = getFoodCats();
  const tags = getFoodTags();
  const cat = catId ? cats.find(c => c.id === catId) : null;
  document.getElementById('foodcat-modal-title').textContent = cat ? 'Edit Food Category' : 'Add Food Category';
  document.getElementById('foodcat-name').value = cat ? cat.name : '';
  document.getElementById('foodcat-days').value = cat ? cat.cooldownDays : 7;
  document.getElementById('foodcat-delete-btn').style.display = cat ? '' : 'none';
  document.getElementById('foodcat-search').value = '';

  // Pre-populate currently tagged foods for this category
  foodCatSelectedNames = catId
    ? Object.keys(tags).filter(name => (tags[name] || []).includes(catId))
    : [];

  renderFoodCatSelectedChips();
  renderFoodCatPickList('');
  document.getElementById('foodcat-overlay').classList.remove('hidden');
  setTimeout(() => document.getElementById('foodcat-search').focus(), 100);
}

function renderFoodCatPickList(query) {
  const list = document.getElementById('foodcat-pick-list');
  const sorted = [...foods].sort((a, b) => a.name.localeCompare(b.name));
  const filtered = sorted.filter(f => f.name.toLowerCase().includes(query.toLowerCase()));
  if (filtered.length === 0) {
    list.innerHTML = `<p class="empty-msg" style="padding:16px 0;">${foods.length === 0 ? 'No foods in library yet.' : 'No foods match your search.'}</p>`;
    return;
  }
  list.innerHTML = filtered.map(f => {
    const selected = foodCatSelectedNames.includes(f.name);
    return `
      <div class="food-pick-item${selected ? ' selected' : ''}" onclick="toggleFoodCatTag('${f.name.replace(/'/g, "\\'")}')">
        <div class="pick-name">${f.name}</div>
        <div class="pick-meta">${f.grams}g · ${f.calories} kcal · P${f.protein}g C${f.carbs}g F${f.fat}g</div>
      </div>`;
  }).join('');
}

function toggleFoodCatTag(name) {
  if (foodCatSelectedNames.includes(name)) {
    foodCatSelectedNames = foodCatSelectedNames.filter(n => n !== name);
  } else {
    foodCatSelectedNames.push(name);
  }
  renderFoodCatSelectedChips();
  renderFoodCatPickList(document.getElementById('foodcat-search').value);
}

function renderFoodCatSelectedChips() {
  const el = document.getElementById('foodcat-selected-chips');
  if (foodCatSelectedNames.length === 0) {
    el.innerHTML = '';
    el.style.display = 'none';
    return;
  }
  el.style.display = 'flex';
  el.innerHTML = foodCatSelectedNames.map(name => `
    <span class="foodcat-chip">
      ${name}
      <span class="chip-remove" onclick="toggleFoodCatTag(this.dataset.name)" data-name="${name.replace(/"/g, '&quot;')}" role="button" aria-label="Remove">✕</span>
    </span>`).join('');
}

function saveFoodCat() {
  const name = document.getElementById('foodcat-name').value.trim();
  const days = parseInt(document.getElementById('foodcat-days').value) || 7;
  if (!name) { alert('Please enter a category name.'); return; }

  const cats = getFoodCats();
  const tags = getFoodTags();

  let catId = editingCatId;
  if (catId) {
    const idx = cats.findIndex(c => c.id === catId);
    if (idx !== -1) { cats[idx].name = name; cats[idx].cooldownDays = days; }
  } else {
    catId = 'cat_' + Date.now();
    cats.push({ id: catId, name, cooldownDays: days });
  }
  saveFoodCats(cats);

  // Determine which foods are newly added to this category in this save
  const prevTagged = Object.keys(tags).filter(fn => (tags[fn] || []).includes(catId));
  const newlyTagged = foodCatSelectedNames.filter(fn => !prevTagged.includes(fn));

  // Save tags: remove this catId from all foods, then re-add to selected ones
  Object.keys(tags).forEach(foodName => {
    tags[foodName] = (tags[foodName] || []).filter(id => id !== catId);
  });
  foodCatSelectedNames.forEach(foodName => {
    if (!tags[foodName]) tags[foodName] = [];
    if (!tags[foodName].includes(catId)) tags[foodName].push(catId);
  });
  saveFoodTags(tags);

  // Only retroactively apply cooldowns for foods NEWLY tagged in this save
  if (newlyTagged.length > 0) {
    applyRetroactiveCooldowns(catId, days, newlyTagged);
  }

  document.getElementById('foodcat-overlay').classList.add('hidden');
  renderFoodModCard();
}

// Scan past daily logs for newly-tagged foods and apply cooldown if found within the cooldown window.
// ONLY runs if the category has no active cooldown — never overrides an existing one.
function applyRetroactiveCooldowns(catId, cooldownDays, newlyTaggedFoods) {
  if (!newlyTaggedFoods || newlyTaggedFoods.length === 0) return;

  // If an active cooldown already exists, don't touch it
  if (cooldownDaysRemaining(catId) > 0) return;

  const cds = getCooldowns();
  const todayStr = dateStr(new Date());
  const todayMs  = new Date(todayStr + 'T00:00:00').getTime();

  let mostRecentDateStr = null;

  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k || !k.startsWith('eatshimo_day_')) continue;
    const ds = k.replace('eatshimo_day_', '');
    const logMs   = new Date(ds + 'T00:00:00').getTime();
    const daysAgo = Math.floor((todayMs - logMs) / 864e5);
    if (daysAgo < 0 || daysAgo >= cooldownDays) continue;
    try {
      const dayData = JSON.parse(localStorage.getItem(k));
      const meals = dayData?.meals || [];
      if (meals.some(m => newlyTaggedFoods.includes(m.name))) {
        if (!mostRecentDateStr || ds > mostRecentDateStr) mostRecentDateStr = ds;
      }
    } catch (e) {}
  }

  if (!mostRecentDateStr) return;
  cds[catId] = { lastConsumed: mostRecentDateStr, currentCooldownDays: cooldownDays };
  saveCooldowns(cds);
}

function deleteFoodCat() {
  if (!editingCatId || !confirm('Delete this food category?')) return;
  saveFoodCats(getFoodCats().filter(c => c.id !== editingCatId));
  const cds = getCooldowns(); delete cds[editingCatId]; saveCooldowns(cds);
  const tags = getFoodTags();
  Object.keys(tags).forEach(k => { tags[k] = tags[k].filter(id => id !== editingCatId); });
  saveFoodTags(tags);
  document.getElementById('foodcat-overlay').classList.add('hidden');
  renderFoodModCard();
}

// Edit Cooldown Modal
let editingCooldownCatId = null;

function openEditCooldownModal(catId) {
  editingCooldownCatId = catId;
  const cat = getFoodCats().find(c => c.id === catId);
  if (!cat) return;
  const rem = cooldownDaysRemaining(catId);
  document.getElementById('editcooldown-cat-name').textContent = cat.name;
  document.getElementById('editcooldown-default').value = cat.cooldownDays;
  document.getElementById('editcooldown-current').value = rem;
  document.getElementById('editcooldown-add').value = 1;
  document.getElementById('editcooldown-reduce').value = 1;
  document.getElementById('editcooldown-status').textContent =
    rem > 0 ? `Currently on cooldown — ${rem} day${rem !== 1 ? 's' : ''} remaining.` : 'No active cooldown.';
  document.getElementById('editcooldown-overlay').classList.remove('hidden');
}

function _setCooldownRemaining(days) {
  const cds = getCooldowns();
  if (days <= 0) {
    delete cds[editingCooldownCatId];
  } else {
    cds[editingCooldownCatId] = { lastConsumed: dateStr(new Date()), currentCooldownDays: days };
  }
  saveCooldowns(cds);
  renderFoodModCard();
  // Refresh status label
  const rem = cooldownDaysRemaining(editingCooldownCatId);
  const statusEl = document.getElementById('editcooldown-status');
  if (statusEl) statusEl.textContent = rem > 0
    ? `Currently on cooldown — ${rem} day${rem !== 1 ? 's' : ''} remaining.`
    : 'No active cooldown.';
  const currentEl = document.getElementById('editcooldown-current');
  if (currentEl) currentEl.value = rem;
}

function applyCooldownExact() {
  const val = parseInt(document.getElementById('editcooldown-current').value) || 0;
  _setCooldownRemaining(val);
}

function applyCooldownAdd() {
  const add = parseInt(document.getElementById('editcooldown-add').value) || 1;
  const cur = cooldownDaysRemaining(editingCooldownCatId);
  _setCooldownRemaining(cur + add);
}

function applyCooldownReduce() {
  const reduce = parseInt(document.getElementById('editcooldown-reduce').value) || 1;
  const cur = cooldownDaysRemaining(editingCooldownCatId);
  _setCooldownRemaining(Math.max(0, cur - reduce));
}

function saveEditCooldownDefault() {
  const newDefault = parseInt(document.getElementById('editcooldown-default').value) || 1;
  const cats = getFoodCats();
  const idx = cats.findIndex(c => c.id === editingCooldownCatId);
  if (idx !== -1) { cats[idx].cooldownDays = newDefault; saveFoodCats(cats); }
  document.getElementById('editcooldown-overlay').classList.add('hidden');
  renderFoodModCard();
}

// Keep old saveEditCooldown as alias for backward compat
function saveEditCooldown() { saveEditCooldownDefault(); }

function clearOneCooldown() {
  const cds = getCooldowns();
  delete cds[editingCooldownCatId || editingCooldownCatId];
  saveCooldowns(cds);
  document.getElementById('editcooldown-overlay').classList.add('hidden');
  renderFoodModCard();
}

// ════════════════════════════════════════════════════════════
// ─── JSON EXPORT / IMPORT ───────────────────────────────────
// ════════════════════════════════════════════════════════════
const ALL_CARD_KEYS = [
  'eatshimo_ex_lib','eatshimo_active_ex','eatshimo_checklist',
  'eatshimo_fasting','eatshimo_food_cats','eatshimo_food_tags',
  'eatshimo_cooldowns','eatshimo_cooldown_setting'
];

function exportAllData() {
  const data = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith('eatshimo')) {
      try { data[k] = JSON.parse(localStorage.getItem(k)); }
      catch(e) { data[k] = localStorage.getItem(k); }
    }
  }
  _downloadJSON(data, 'eatshimo_data.json');
}

function exportCardsData() {
  const data = {};
  ALL_CARD_KEYS.forEach(k => {
    const v = localStorage.getItem(k);
    if (v !== null) { try { data[k] = JSON.parse(v); } catch(e) { data[k] = v; } }
  });
  _downloadJSON(data, 'eatshimo_cards.json');
}

function _downloadJSON(obj, filename) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      let count = 0;
      Object.entries(data).forEach(([k, v]) => {
        if (k.startsWith('eatshimo')) {
          localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
          count++;
        }
      });
      document.getElementById('import-status').textContent = `✓ Imported ${count} keys. Refreshing…`;
      setTimeout(() => location.reload(), 1200);
    } catch (err) {
      document.getElementById('import-status').textContent = '✗ Invalid JSON file.';
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

// ─── INIT ────────────────────────────────────────────────
loadTheme();
renderLibrary();
renderDailyLog();
// Show tutorial on first launch
currentDate = nowInTZ();
if (!localStorage.getItem('eatshimo_tutorial_seen')) {
  setTimeout(openTutorial, 400);
}