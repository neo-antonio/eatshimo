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
  return JSON.parse(localStorage.getItem(getDayKey(ds)) || '{"meals":[],"water":0,"steps":0,"weight":null,"sleep":null}');
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
  if (page === 'daily')   renderDailyLog();
  if (page === 'profile') { loadProfile(); renderCharts(); renderThemePicker(); }
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

  // Steps → calories burned (approx: steps * 0.04 kcal for average person)
  const stepsEl = document.getElementById('steps-burned');
  if (data.steps && data.steps > 0) {
    const burned = Math.round(data.steps * 0.04);
    stepsEl.textContent = `≈ ${burned} kcal burned`;
  } else {
    stepsEl.textContent = '';
  }
}

function openEditMealModal(index) {
  const key  = dateStr(currentDate);
  const data = getDayData(key);
  const m    = data.meals[index];
  document.getElementById('edit-meal-index').value    = index;
  document.getElementById('edit-meal-name').value     = m.name;
  document.getElementById('edit-meal-grams').value    = m.grams;
  document.getElementById('edit-meal-calories').value = Math.round(m.calories);
  document.getElementById('edit-meal-protein').value  = parseFloat(m.protein.toFixed(1));
  document.getElementById('edit-meal-carbs').value    = parseFloat(m.carbs.toFixed(1));
  document.getElementById('edit-meal-fat').value      = parseFloat(m.fat.toFixed(1));
  document.getElementById('edit-meal-fiber').value    = parseFloat((m.fiber||0).toFixed(1));
  document.getElementById('edit-meal-overlay').classList.remove('hidden');
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
    html+=`<span class="${cls}" onclick="${isFuture?'':`pickCalDay('${ds}')`}">${d}</span>`;
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

function renderLibrary() {
  const query=document.getElementById('search-input').value.toLowerCase();
  const list=document.getElementById('food-list');
  const sorted=[...foods].map((f,i)=>({...f,originalIndex:i})).sort((a,b)=>a.name.localeCompare(b.name));
  const filtered=sorted.filter(f=>f.name.toLowerCase().includes(query));
  if (filtered.length===0) { list.innerHTML=`<p class="empty-msg">${query?'No foods match your search.':'No foods saved yet. Add one above or use Presets!'}</p>`; return; }
  list.innerHTML=filtered.map(f=>`
    <div class="food-item">
      <div class="food-info">
        <div class="food-name">${f.name}</div>
        <div class="macros">
          <div class="macro-chip serving">${f.grams||100}g serving</div>
          <div class="macro-chip cal">Cal <span>${f.calories}</span></div>
          <div class="macro-chip">P <span>${f.protein}g</span></div>
          <div class="macro-chip">C <span>${f.carbs}g</span></div>
          <div class="macro-chip">F <span>${f.fat}g</span></div>
          ${f.fiber>0?`<div class="macro-chip fiber">Fiber <span>${f.fiber}g</span></div>`:''}
        </div>
      </div>
      <div class="food-actions">
        <button class="btn-edit" onclick="openEdit(${f.originalIndex})">Edit</button>
        <button class="btn-delete" onclick="deleteFood(${f.originalIndex})">Delete</button>
      </div>
    </div>`).join('');
}

function deleteFood(index) {
  if (!confirm(`Delete "${foods[index].name}"?`)) return;
  foods.splice(index,1); saveFoodsToDisk(); renderLibrary();
}

function openEdit(index) {
  const f=foods[index];
  document.getElementById('edit-index').value    = index;
  document.getElementById('edit-name').value     = f.name;
  document.getElementById('edit-grams').value    = f.grams||100;
  document.getElementById('edit-calories').value = f.calories;
  document.getElementById('edit-protein').value  = f.protein;
  document.getElementById('edit-carbs').value    = f.carbs;
  document.getElementById('edit-fat').value      = f.fat;
  document.getElementById('edit-fiber').value    = f.fiber||0;
  document.getElementById('modal-overlay').classList.remove('hidden');
}

function closeModal(e) { if(e.target===document.getElementById('modal-overlay')) closeModalDirect(); }
function closeModalDirect() { document.getElementById('modal-overlay').classList.add('hidden'); }

function updateFood() {
  const index=parseInt(document.getElementById('edit-index').value);
  const name=document.getElementById('edit-name').value.trim();
  if (!name) { alert('Food name cannot be empty.'); return; }
  foods[index]={ name, grams:parseFloat(document.getElementById('edit-grams').value)||100, calories:parseFloat(document.getElementById('edit-calories').value)||0, protein:parseFloat(document.getElementById('edit-protein').value)||0, carbs:parseFloat(document.getElementById('edit-carbs').value)||0, fat:parseFloat(document.getElementById('edit-fat').value)||0, fiber:parseFloat(document.getElementById('edit-fiber').value)||0 };
  saveFoodsToDisk(); renderLibrary(); closeModalDirect();
}

// ─── KEYBOARD ────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key==='Escape') { closeModalDirect(); closeLogModalDirect(); closeCalendarDirect(); closeEditMealModalDirect(); closeTutorialDirect(); }
  if (e.key==='Enter' && e.target.closest('#add-section')) saveFood();
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

// ─── INIT ────────────────────────────────────────────────
loadTheme();
renderLibrary();
renderDailyLog();
// Show tutorial on first launch
currentDate = nowInTZ();
if (!localStorage.getItem('eatshimo_tutorial_seen')) {
  setTimeout(openTutorial, 400);
}