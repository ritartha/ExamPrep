/* ========================================
   WBCS Preparation Planner — Application Logic
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {
  // ==============================
  // DOM REFERENCES
  // ==============================
  const sidebar = document.getElementById('sidebar');
  const menuBtn = document.getElementById('menuBtn');
  const overlay = document.getElementById('sidebarOverlay');
  const navLinks = document.querySelectorAll('.nav-link');
  const mainContent = document.getElementById('mainContent');

  // ==============================
  // STORAGE HELPERS
  // ==============================
  const STORAGE_KEY = 'wbcs_planner_data';

  function loadData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : getDefaultData();
    } catch {
      return getDefaultData();
    }
  }

  function saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function getDefaultData() {
    return {
      startDate: new Date().toISOString().split('T')[0],
      streak: 0,
      lastActiveDate: null,
      totalHours: 0,
      weeklyChecklist: {},
      currentWeek: 1,
      currentMonth: 1,
      dailyLog: {}
    };
  }

  let appData = loadData();

  // ==============================
  // SIDEBAR & NAVIGATION
  // ==============================
  menuBtn.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    menuBtn.classList.toggle('active');
    overlay.classList.toggle('active');
  });

  overlay.addEventListener('click', () => {
    sidebar.classList.remove('open');
    menuBtn.classList.remove('active');
    overlay.classList.remove('active');
  });

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const tab = link.dataset.tab;
      switchTab(tab);
      // Close mobile sidebar
      sidebar.classList.remove('open');
      menuBtn.classList.remove('active');
      overlay.classList.remove('active');
    });
  });

  function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(n => n.classList.remove('active'));
    const tabEl = document.getElementById(`tab-${tabId}`);
    const navEl = document.getElementById(`nav-${tabId}`);
    if (tabEl) tabEl.classList.add('active');
    if (navEl) navEl.classList.add('active');
  }

  // ==============================
  // DAILY PLAN TOGGLE
  // ==============================
  const dayTypeBtns = document.querySelectorAll('.toggle-btn[data-daytype]');
  dayTypeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      dayTypeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.day-plan').forEach(p => p.classList.remove('active'));
      const plan = document.getElementById(`plan-${btn.dataset.daytype}`);
      if (plan) plan.classList.add('active');
    });
  });

  // ==============================
  // YEAR PLAN TOGGLE (Monthly)
  // ==============================
  const yearBtns = document.querySelectorAll('.toggle-btn[data-year]');
  yearBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      yearBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.year-plan').forEach(p => p.classList.remove('active'));
      const plan = document.getElementById(`year-plan-${btn.dataset.year}`);
      if (plan) plan.classList.add('active');
    });
  });

  // ==============================
  // DASHBOARD — Populate
  // ==============================
  function updateDashboard() {
    const today = new Date();
    const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];

    // Today badge
    const todayBadge = document.getElementById('todayBadge');
    if (todayBadge) {
      todayBadge.textContent = `${dayNames[today.getDay()]}, ${today.getDate()} ${monthNames[today.getMonth()]} ${today.getFullYear()}`;
    }

    // Day type badge
    const dayTypeBadge = document.getElementById('dayTypeBadge');
    const dayNum = today.getDay();
    if (dayTypeBadge) {
      if (dayNum === 0) dayTypeBadge.textContent = 'Sunday';
      else if (dayNum === 6) dayTypeBadge.textContent = 'Saturday';
      else dayTypeBadge.textContent = 'Weekday';
    }

    // Days completed
    const startDate = new Date(appData.startDate);
    const diffTime = Math.abs(today - startDate);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const daysEl = document.getElementById('daysCompleted');
    if (daysEl) daysEl.textContent = diffDays;
    const dayProg = document.getElementById('dayProgress');
    if (dayProg) dayProg.style.width = `${Math.min((diffDays / 730) * 100, 100)}%`;
    const dayProgText = document.getElementById('dayProgressText');
    if (dayProgText) dayProgText.textContent = `${diffDays} / 730 days`;

    // Phase
    const phaseEl = document.getElementById('currentPhase');
    const phaseProg = document.getElementById('phaseProgress');
    if (diffDays <= 365) {
      if (phaseEl) phaseEl.textContent = 'Year 1';
      if (phaseProg) phaseProg.style.width = `${(diffDays / 365) * 100}%`;
    } else {
      if (phaseEl) phaseEl.textContent = 'Year 2';
      if (phaseProg) phaseProg.style.width = `${((diffDays - 365) / 365) * 100}%`;
    }

    // Streak
    updateStreak();

    // Total hours
    const hoursEl = document.getElementById('totalHours');
    if (hoursEl) hoursEl.textContent = appData.totalHours || 0;
    const hourProg = document.getElementById('hourProgress');
    if (hourProg) hourProg.style.width = `${Math.min((appData.totalHours / 3000) * 100, 100)}%`;

    // Today's timeline
    buildTodayTimeline(dayNum);

    // Motivational quotes rotation
    rotateQuote();
  }

  function updateStreak() {
    const streakEl = document.getElementById('streakCount');
    const mobileStreakEl = document.getElementById('mobileStreakCount');
    if (streakEl) streakEl.textContent = `${appData.streak} days`;
    if (mobileStreakEl) mobileStreakEl.textContent = appData.streak;
  }

  // ==============================
  // TODAY'S TIMELINE
  // ==============================
  function buildTodayTimeline(dayNum) {
    const container = document.getElementById('todayTimeline');
    if (!container) return;

    let items = [];
    const now = new Date();
    const currentHour = now.getHours() + now.getMinutes() / 60;

    if (dayNum >= 1 && dayNum <= 5) {
      // Weekday
      items = [
        { time: '5:30 – 7:00', title: 'GS Static Subjects', desc: 'Focus: Polity / History / Geography', start: 5.5, end: 7 },
        { time: '7:00 – 8:00', title: 'Electrical Engineering', desc: 'Core EE subject of the day', start: 7, end: 8 },
        { time: 'Breaks', title: 'Current Affairs + Notes', desc: 'Micro-prep during office', start: 12, end: 13 },
        { time: '8:30 – 9:30', title: 'MCQ / PYQ Practice', desc: 'Solve previous year questions', start: 20.5, end: 21.5 },
        { time: '9:30 – 10:30', title: 'Light Subject / Revision', desc: 'Easy review before sleep', start: 21.5, end: 22.5 },
      ];
    } else if (dayNum === 6) {
      // Saturday
      items = [
        { time: '6:00 – 9:00', title: 'EE Deep Study', desc: '3 hours focused EE practice', start: 6, end: 9 },
        { time: '9:30 – 11:30', title: 'GS Deep Study', desc: 'Pick one subject, go deep', start: 9.5, end: 11.5 },
        { time: '2:00 – 4:00', title: 'Answer Writing / MCQs', desc: 'Structured answer practice', start: 14, end: 16 },
      ];
    } else {
      // Sunday
      items = [
        { time: '6:00 – 9:00', title: 'Full-Length Mock Test', desc: 'Simulate real exam conditions', start: 6, end: 9 },
        { time: '10:00 – 12:00', title: 'Weak Area Analysis', desc: 'Review mistakes, identify gaps', start: 10, end: 12 },
        { time: '2:00 – 4:00', title: 'Weekly Revision', desc: 'Revise everything from the week', start: 14, end: 16 },
      ];
    }

    container.innerHTML = items.map((item, i) => {
      const isActive = currentHour >= item.start && currentHour < item.end;
      const isLast = i === items.length - 1;
      return `
        <div class="timeline-item">
          <div class="timeline-marker">
            <div class="timeline-dot ${isActive ? 'active' : ''}"></div>
            ${!isLast ? '<div class="timeline-line"></div>' : ''}
          </div>
          <div class="timeline-content">
            <div class="timeline-time">${item.time}</div>
            <div class="timeline-title">${item.title}</div>
            <div class="timeline-desc">${item.desc}</div>
          </div>
        </div>
      `;
    }).join('');
  }

  // ==============================
  // QUOTES
  // ==============================
  const quotes = [
    "Consistency beats intensity. Show up every day for 600+ days — that's how you crack WBCS.",
    "You don't need 10 hrs/day or fancy coaching. You need discipline for 600+ days.",
    "PYQs are your Bible. Master the last 10–15 years papers — they reveal the exam's DNA.",
    "Smart revision > long study sessions. 1 day quick → 1 week deep → 1 month full.",
    "Don't chase perfection. Chase consistency. Even 3 hrs on a bad day counts.",
    "The weekend is your game changer. 6–8 hours of focused work changes everything.",
    "Burnout is part of the journey. Plan for it. Keep 1 light day every week.",
    "Answer writing is the Mains game. Start after 6 months — 2-3 answers daily.",
    "Your morning brain is gold. Use 5:30–8:00 AM for the hardest subjects.",
    "30 hours a week is enough to crack WBCS. But they must be focused hours."
  ];

  function rotateQuote() {
    const quoteEl = document.getElementById('quoteText');
    if (quoteEl) {
      const idx = new Date().getDate() % quotes.length;
      quoteEl.textContent = quotes[idx];
    }
  }

  // ==============================
  // MONTHLY PLAN — Generate Month Cards
  // ==============================
  const year1Plan = [
    { month: 1, subjects: [
      { text: 'Polity — Indian Constitution basics', type: 'gs' },
      { text: 'Network Theory — KVL, KCL, basics', type: 'ee' },
      { text: 'Current Affairs habit building', type: 'ca' },
      { text: 'Start PYQ collection', type: 'practice' }
    ]},
    { month: 2, subjects: [
      { text: 'Polity — Fundamental Rights, DPSP', type: 'gs' },
      { text: 'Network Theory — Thevenin, Norton', type: 'ee' },
      { text: 'Daily Current Affairs reading', type: 'ca' },
      { text: 'PYQ solving: Polity', type: 'practice' }
    ]},
    { month: 3, subjects: [
      { text: 'History — Ancient India', type: 'gs' },
      { text: 'Control Systems — Transfer functions', type: 'ee' },
      { text: 'Monthly Revision #1', type: 'rev' },
      { text: 'PYQ solving: History + EE', type: 'practice' }
    ]},
    { month: 4, subjects: [
      { text: 'History — Medieval India', type: 'gs' },
      { text: 'Control Systems — Stability, Bode', type: 'ee' },
      { text: 'Current Affairs compilation', type: 'ca' },
      { text: 'Revise Polity notes', type: 'rev' }
    ]},
    { month: 5, subjects: [
      { text: 'History — Modern India', type: 'gs' },
      { text: 'Electrical Machines — Transformers', type: 'ee' },
      { text: 'PYQ solving: History full', type: 'practice' },
      { text: 'Monthly Revision #2', type: 'rev' }
    ]},
    { month: 6, subjects: [
      { text: 'Geography — Physical', type: 'gs' },
      { text: 'Electrical Machines — DC Machines', type: 'ee' },
      { text: '★ START Answer Writing', type: 'practice' },
      { text: 'Full revision: Polity + History', type: 'rev' }
    ]},
    { month: 7, subjects: [
      { text: 'Geography — Indian Geography', type: 'gs' },
      { text: 'Electrical Machines — AC Machines', type: 'ee' },
      { text: 'Answer Writing: 2/day', type: 'practice' },
      { text: 'PYQ solving: Geography', type: 'practice' }
    ]},
    { month: 8, subjects: [
      { text: 'Economy — Basics + Indian Economy', type: 'gs' },
      { text: 'Power Systems — Load flow', type: 'ee' },
      { text: 'Answer Writing continues', type: 'practice' },
      { text: 'Monthly Revision #3', type: 'rev' }
    ]},
    { month: 9, subjects: [
      { text: 'Economy — Banking, Budget, Fiscal', type: 'gs' },
      { text: 'Power Systems — Fault analysis', type: 'ee' },
      { text: 'PYQ solving: Economy', type: 'practice' },
      { text: 'Revise Geography notes', type: 'rev' }
    ]},
    { month: 10, subjects: [
      { text: 'Environment — Ecology basics', type: 'gs' },
      { text: 'Analog Electronics — Op-amps, Diodes', type: 'ee' },
      { text: 'Full revision: History + Geography', type: 'rev' },
      { text: 'Answer Writing: 3/day', type: 'practice' }
    ]},
    { month: 11, subjects: [
      { text: 'Environment — Biodiversity, Climate', type: 'gs' },
      { text: 'Digital Electronics — Logic gates', type: 'ee' },
      { text: 'PYQ solving: Environment', type: 'practice' },
      { text: 'Monthly Revision #4', type: 'rev' }
    ]},
    { month: 12, subjects: [
      { text: '★ FULL SYLLABUS REVISION', type: 'rev' },
      { text: 'EE — Complete revision', type: 'ee' },
      { text: 'Year 1 self-assessment test', type: 'practice' },
      { text: 'Gap analysis & Year 2 planning', type: 'practice' }
    ]}
  ];

  const year2Plan = [
    { month: 13, subjects: [
      { text: 'Polity — Advanced + amendments', type: 'gs' },
      { text: 'EE: Network + Control revision', type: 'ee' },
      { text: 'Weekly mock tests start', type: 'practice' },
      { text: 'Answer Writing: daily', type: 'practice' }
    ]},
    { month: 14, subjects: [
      { text: 'History — In-depth revision', type: 'gs' },
      { text: 'EE: Machines deep revision', type: 'ee' },
      { text: 'Mock test analysis', type: 'practice' },
      { text: 'Current Affairs: 6-month compilation', type: 'ca' }
    ]},
    { month: 15, subjects: [
      { text: 'Geography — Map work + advanced', type: 'gs' },
      { text: 'EE: Power Systems deep', type: 'ee' },
      { text: 'Bi-weekly mock tests', type: 'practice' },
      { text: 'Fast revision cycle #1', type: 'rev' }
    ]},
    { month: 16, subjects: [
      { text: 'Economy — Current Economic Survey', type: 'gs' },
      { text: 'EE: Electronics revision', type: 'ee' },
      { text: 'Weak area intensive study', type: 'practice' },
      { text: 'Answer Writing: Mains focus', type: 'practice' }
    ]},
    { month: 17, subjects: [
      { text: 'Environment — Current issues', type: 'gs' },
      { text: 'EE: Full PYQ marathon', type: 'ee' },
      { text: 'Mock tests: exam simulation', type: 'practice' },
      { text: 'Fast revision cycle #2', type: 'rev' }
    ]},
    { month: 18, subjects: [
      { text: 'GS: All subjects rapid revision', type: 'gs' },
      { text: 'EE: Problem-solving marathon', type: 'ee' },
      { text: 'Full-length mocks: weekly', type: 'practice' },
      { text: '1-year current affairs revision', type: 'ca' }
    ]},
    { month: 19, subjects: [
      { text: '★ PRELIMS PREPARATION MODE', type: 'practice' },
      { text: 'MCQ-only practice sessions', type: 'practice' },
      { text: 'Current Affairs intensive', type: 'ca' },
      { text: 'Fast revision cycle #3', type: 'rev' }
    ]},
    { month: 20, subjects: [
      { text: 'Prelims mock tests: 3/week', type: 'practice' },
      { text: 'GS rapid-fire revision', type: 'rev' },
      { text: 'EE: Formula sheet creation', type: 'ee' },
      { text: 'Time management practice', type: 'practice' }
    ]},
    { month: 21, subjects: [
      { text: '★ PRELIMS MONTH', type: 'practice' },
      { text: 'Daily mock + analysis', type: 'practice' },
      { text: 'Only revision, no new topics', type: 'rev' },
      { text: 'Stress management & rest', type: 'rev' }
    ]},
    { month: 22, subjects: [
      { text: '★ MAINS PREPARATION INTENSIVE', type: 'practice' },
      { text: 'Answer Writing: 5-6/day', type: 'practice' },
      { text: 'EE: Full test series', type: 'ee' },
      { text: 'GS Mains deep study', type: 'gs' }
    ]},
    { month: 23, subjects: [
      { text: 'Mains mock tests: full-length', type: 'practice' },
      { text: 'EE: Final revision', type: 'ee' },
      { text: 'Answer writing refinement', type: 'practice' },
      { text: 'Fast revision cycle #4', type: 'rev' }
    ]},
    { month: 24, subjects: [
      { text: '★ FINAL REVISION + EXAM', type: 'rev' },
      { text: 'Light study, no new topics', type: 'rev' },
      { text: 'Confidence building mocks', type: 'practice' },
      { text: 'Rest well, trust the process', type: 'rev' }
    ]}
  ];

  function renderMonthCards() {
    const y1Container = document.getElementById('year1Months');
    const y2Container = document.getElementById('year2Months');

    if (y1Container) {
      y1Container.innerHTML = year1Plan.map(m => buildMonthCard(m)).join('');
    }
    if (y2Container) {
      y2Container.innerHTML = year2Plan.map(m => buildMonthCard(m)).join('');
    }
  }

  function buildMonthCard(m) {
    return `
      <div class="month-card">
        <div class="month-card-header">
          <span class="month-number">Month ${m.month}</span>
        </div>
        <div class="month-card-body">
          ${m.subjects.map(s => `
            <div class="month-subject ${s.type}">
              ${s.text}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // ==============================
  // MONTHLY GOALS
  // ==============================
  const monthlyGoals = [
    {
      month: 1,
      goals: [
        { icon: '📚', title: 'General Studies', color: 'blue', items: [
          'Complete Indian Constitution — Preamble to Part V',
          'Read Laxmikanth Chapters 1–15',
          'Make short notes for Polity basics',
          'Solve 200+ Polity MCQs'
        ]},
        { icon: '⚡', title: 'Electrical Engineering', color: 'gold', items: [
          'Complete Network Theory basics — KVL, KCL',
          'Solve 50+ numerical problems',
          'Master circuit analysis techniques',
          'Revise formulas weekly'
        ]},
        { icon: '📰', title: 'Current Affairs', color: 'green', items: [
          'Set up daily CA reading habit (20 min)',
          'Subscribe to relevant apps/newspapers',
          'Start monthly CA compilation'
        ]},
        { icon: '🎯', title: 'Practice & Revision', color: 'red', items: [
          'Collect last 10 years PYQ papers',
          'Complete at least 1 mock test',
          'Build revision schedule',
          'Track daily study hours'
        ]}
      ]
    },
    {
      month: 2,
      goals: [
        { icon: '📚', title: 'General Studies', color: 'blue', items: [
          'Polity — Fundamental Rights & DPSP deep study',
          'Read about Parliament, State Legislature',
          'Solve 250+ Polity MCQs (cumulative)',
          'Start current affairs linking with Polity'
        ]},
        { icon: '⚡', title: 'Electrical Engineering', color: 'gold', items: [
          'Network Theorems — Thevenin, Norton, Superposition',
          'AC circuit analysis — Phasors, Impedance',
          'Solve 100+ cumulative EE problems',
          'Revise Month 1 EE topics'
        ]},
        { icon: '📰', title: 'Current Affairs', color: 'green', items: [
          'Daily CA reading is now a habit',
          'Start making monthly CA notes',
          'Focus on government schemes & policies'
        ]},
        { icon: '🎯', title: 'Practice & Revision', color: 'red', items: [
          'PYQ marathon — Polity section complete',
          'Weekend mock test #2',
          'Revision of Month 1 notes (full)',
          'Maintain 30 hrs/week minimum'
        ]}
      ]
    },
    {
      month: 3,
      goals: [
        { icon: '📚', title: 'General Studies', color: 'blue', items: [
          'Ancient History — Indus Valley to Gupta Period',
          'Read Tamil Nadu Board textbooks or Spectrum',
          'Make timeline-based notes',
          'Solve 200+ History MCQs'
        ]},
        { icon: '⚡', title: 'Electrical Engineering', color: 'gold', items: [
          'Control Systems — Transfer functions, Block diagrams',
          'Signal flow graphs, Mason\'s gain formula',
          'Solve 60+ Control Systems problems',
          'Revise Network Theory completely'
        ]},
        { icon: '📰', title: 'Current Affairs', color: 'green', items: [
          'Monthly compilation up to date',
          'International relations focus',
          'Science & Technology updates'
        ]},
        { icon: '🎯', title: 'Practice & Revision', color: 'red', items: [
          '★ First Monthly Full Revision',
          'PYQ: History + EE sections',
          'Mock Test #3',
          'Identify weak areas from Month 1–3'
        ]}
      ]
    }
  ];

  // Generate goals for remaining months (4-24) programmatically
  function generateAllGoals() {
    const allGoals = [...monthlyGoals];
    const gsTopics = [
      'Medieval India — Delhi Sultanate, Mughal period',
      'Modern India — 1857 to Independence movement',
      'Physical Geography — Earth, atmosphere, oceans',
      'Indian Geography — Rivers, climate, resources',
      'Economy — Basics, GDP, fiscal policy',
      'Economy — Banking, monetary policy, budget',
      'Environment — Ecology fundamentals',
      'Environment — Biodiversity, Climate change',
      'GS full revision (Polity + History)',
      'GS full revision (Geography + Economy)',
      'GS full revision (Environment + CA)',
      'GS rapid revision — all subjects',
      'Advanced Polity — judicial review, federalism',
      'History in-depth — freedom movement analysis',
      'Geography advanced — map work mastery',
      'Economy — Economic Survey deep study',
      'Environment — current environmental issues',
      'GS rapid-fire revision cycle',
      'Prelims MCQ-intensive preparation',
      'Prelims daily mocks + final revision',
      'Mains answer writing intensive'
    ];

    const eeTopics = [
      'Control Systems — Stability criteria, Routh',
      'Electrical Machines — Transformer deep study',
      'Electrical Machines — DC motors & generators',
      'Electrical Machines — AC synchronous machines',
      'Power Systems — Load flow analysis',
      'Power Systems — Fault analysis & protection',
      'Analog Electronics — Op-amps, amplifiers',
      'Digital Electronics — Logic gates, flip-flops',
      'EE full subject revision',
      'EE — Network + Control Systems revision',
      'EE — Machines deep revision',
      'EE — Power Systems deep revision',
      'EE — Electronics revision',
      'EE — Full PYQ marathon',
      'EE — Problem solving intensive',
      'EE — Formula sheets + quick revision',
      'EE — Mock test series',
      'EE — Final revision cycle',
      'EE — Formula sheet review only',
      'EE — Confidence mocks',
      'EE — Light revision, trust the process'
    ];

    for (let i = allGoals.length; i < 24; i++) {
      const gsIdx = Math.min(i - 3, gsTopics.length - 1);
      const eeIdx = Math.min(i - 3, eeTopics.length - 1);

      allGoals.push({
        month: i + 1,
        goals: [
          { icon: '📚', title: 'General Studies', color: 'blue', items: [
            gsTopics[gsIdx],
            i >= 12 ? 'Intensive revision mode' : 'Build comprehensive notes',
            i >= 12 ? 'Mock test analysis' : 'Solve 200+ topic MCQs',
            i >= 18 ? 'Prelims/Mains specific prep' : 'Link with current affairs'
          ]},
          { icon: '⚡', title: 'Electrical Engineering', color: 'gold', items: [
            eeTopics[eeIdx],
            i >= 12 ? 'PYQ-focused problem solving' : 'Numerical problem practice',
            i >= 12 ? 'Test series completion' : 'Concept clarity drilling',
            'Weekly EE revision session'
          ]},
          { icon: '📰', title: 'Current Affairs', color: 'green', items: [
            'Monthly CA compilation',
            i >= 12 ? 'Link CA with Mains answers' : 'Daily reading habit maintained',
            i >= 18 ? 'Last 1-year CA intensive revision' : 'Focus on government policies'
          ]},
          { icon: '🎯', title: 'Practice & Revision', color: 'red', items: [
            i >= 6 ? 'Answer Writing: daily practice' : 'PYQ solving: weekly targets',
            i >= 12 ? `Mock tests: ${i >= 18 ? 'daily' : 'weekly'}` : 'Weekend mock test',
            `Monthly Revision #${Math.floor(i/3) + 1}`,
            'Track and maintain 30 hrs/week'
          ]}
        ]
      });
    }
    return allGoals;
  }

  const allMonthlyGoals = generateAllGoals();
  let selectedGoalMonth = 0;

  function renderGoals(monthIdx) {
    const container = document.getElementById('goalsContainer');
    const label = document.getElementById('monthLabel');
    if (!container || !label) return;

    const data = allMonthlyGoals[monthIdx];
    label.textContent = `Month ${data.month}`;

    container.innerHTML = data.goals.map(g => `
      <div class="goal-card">
        <div class="goal-card-header">
          <div class="goal-icon" style="background: ${getGoalBg(g.color)}">${g.icon}</div>
          <h3>${g.title}</h3>
        </div>
        <ul class="goal-list">
          ${g.items.map(item => `
            <li class="goal-item">
              <div class="goal-bullet ${g.color}"></div>
              <span>${item}</span>
            </li>
          `).join('')}
        </ul>
      </div>
    `).join('');
  }

  function getGoalBg(color) {
    const map = {
      gold: 'rgba(245,166,35,0.1)',
      blue: 'rgba(59,130,246,0.1)',
      green: 'rgba(16,185,129,0.1)',
      red: 'rgba(248,113,113,0.1)',
      purple: 'rgba(139,92,246,0.1)'
    };
    return map[color] || map.gold;
  }

  // Month navigation
  const prevMonthBtn = document.getElementById('prevMonth');
  const nextMonthBtn = document.getElementById('nextMonth');

  if (prevMonthBtn) {
    prevMonthBtn.addEventListener('click', () => {
      selectedGoalMonth = Math.max(0, selectedGoalMonth - 1);
      renderGoals(selectedGoalMonth);
    });
  }
  if (nextMonthBtn) {
    nextMonthBtn.addEventListener('click', () => {
      selectedGoalMonth = Math.min(23, selectedGoalMonth + 1);
      renderGoals(selectedGoalMonth);
    });
  }

  // ==============================
  // WEEKLY CHECKLIST
  // ==============================
  const weeklyChecklistData = [
    {
      day: 'Monday',
      tasks: [
        { label: 'GS: Polity study (1.5h)', tag: 'gs', tagLabel: 'GS' },
        { label: 'EE: Network Theory (1h)', tag: 'ee', tagLabel: 'EE' },
        { label: 'MCQ Practice (1h)', tag: 'practice', tagLabel: 'Practice' },
        { label: 'Current Affairs reading', tag: 'ca', tagLabel: 'CA' },
        { label: 'Revise notes (15-20 min)', tag: 'rev', tagLabel: 'Rev' }
      ]
    },
    {
      day: 'Tuesday',
      tasks: [
        { label: 'GS: History study (1.5h)', tag: 'gs', tagLabel: 'GS' },
        { label: 'EE: Control Systems (1h)', tag: 'ee', tagLabel: 'EE' },
        { label: 'PYQ Solving (1h)', tag: 'practice', tagLabel: 'Practice' },
        { label: 'Current Affairs reading', tag: 'ca', tagLabel: 'CA' },
        { label: 'Revise notes (15-20 min)', tag: 'rev', tagLabel: 'Rev' }
      ]
    },
    {
      day: 'Wednesday',
      tasks: [
        { label: 'GS: Geography study (1.5h)', tag: 'gs', tagLabel: 'GS' },
        { label: 'EE: Machines (1h)', tag: 'ee', tagLabel: 'EE' },
        { label: 'Revision (1h)', tag: 'rev', tagLabel: 'Rev' },
        { label: 'Current Affairs reading', tag: 'ca', tagLabel: 'CA' },
        { label: 'Answer Writing (if Month 6+)', tag: 'practice', tagLabel: 'Write' }
      ]
    },
    {
      day: 'Thursday',
      tasks: [
        { label: 'GS: Economy study (1.5h)', tag: 'gs', tagLabel: 'GS' },
        { label: 'EE: Power Systems (1h)', tag: 'ee', tagLabel: 'EE' },
        { label: 'MCQ Practice (1h)', tag: 'practice', tagLabel: 'Practice' },
        { label: 'Current Affairs reading', tag: 'ca', tagLabel: 'CA' },
        { label: 'Revise notes (15-20 min)', tag: 'rev', tagLabel: 'Rev' }
      ]
    },
    {
      day: 'Friday',
      tasks: [
        { label: 'GS: Environment study (1.5h)', tag: 'gs', tagLabel: 'GS' },
        { label: 'EE: Electronics (1h)', tag: 'ee', tagLabel: 'EE' },
        { label: 'Light Revision (1h)', tag: 'rev', tagLabel: 'Rev' },
        { label: 'Current Affairs reading', tag: 'ca', tagLabel: 'CA' }
      ]
    },
    {
      day: 'Saturday',
      tasks: [
        { label: 'EE Deep Study (3h)', tag: 'ee', tagLabel: 'EE' },
        { label: 'GS Deep Study (2h)', tag: 'gs', tagLabel: 'GS' },
        { label: 'Answer Writing (1h)', tag: 'practice', tagLabel: 'Write' },
        { label: 'MCQ/PYQ Set (1h)', tag: 'practice', tagLabel: 'Practice' }
      ]
    },
    {
      day: 'Sunday',
      tasks: [
        { label: 'Full-Length Mock Test (3h)', tag: 'practice', tagLabel: 'Mock' },
        { label: 'Weak Area Analysis (2h)', tag: 'rev', tagLabel: 'Analysis' },
        { label: 'Weekly Revision (2h)', tag: 'rev', tagLabel: 'Rev' }
      ]
    }
  ];

  function getChecklistKey(day, taskIdx) {
    const weekNum = appData.currentWeek || 1;
    return `w${weekNum}_${day}_${taskIdx}`;
  }

  function renderChecklist() {
    const grid = document.getElementById('checklistGrid');
    if (!grid) return;

    grid.innerHTML = weeklyChecklistData.map(dayData => {
      const completedCount = dayData.tasks.filter((_, i) => 
        appData.weeklyChecklist[getChecklistKey(dayData.day, i)]
      ).length;

      return `
        <div class="checklist-day">
          <div class="checklist-day-header">
            <h3>${dayData.day}</h3>
            <span class="checklist-day-count">${completedCount}/${dayData.tasks.length}</span>
          </div>
          <div class="checklist-items">
            ${dayData.tasks.map((task, i) => {
              const key = getChecklistKey(dayData.day, i);
              const done = appData.weeklyChecklist[key] ? 'done' : '';
              const tagBg = getTagBg(task.tag);
              const tagColor = getTagColor(task.tag);
              return `
                <div class="checklist-item ${done}" data-key="${key}" onclick="toggleCheckItem(this)">
                  <div class="check-box">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20,6 9,17 4,12"/></svg>
                  </div>
                  <span class="check-label">${task.label}</span>
                  <span class="check-tag" style="background:${tagBg};color:${tagColor}">${task.tagLabel}</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }).join('');

    updateChecklistProgress();
  }

  function getTagBg(tag) {
    const m = {
      gs: 'rgba(59,130,246,0.12)',
      ee: 'rgba(245,166,35,0.12)',
      practice: 'rgba(248,113,113,0.12)',
      rev: 'rgba(139,92,246,0.12)',
      ca: 'rgba(16,185,129,0.12)'
    };
    return m[tag] || m.gs;
  }

  function getTagColor(tag) {
    const m = {
      gs: '#60A5FA',
      ee: '#F5A623',
      practice: '#F87171',
      rev: '#A78BFA',
      ca: '#34D399'
    };
    return m[tag] || m.gs;
  }

  // Global toggle function
  window.toggleCheckItem = function(el) {
    const key = el.dataset.key;
    el.classList.toggle('done');
    appData.weeklyChecklist[key] = el.classList.contains('done');
    saveData(appData);
    updateChecklistProgress();
    updateDashboardTaskCount();
  };

  function updateChecklistProgress() {
    let total = 0;
    let done = 0;
    weeklyChecklistData.forEach(dayData => {
      dayData.tasks.forEach((_, i) => {
        total++;
        if (appData.weeklyChecklist[getChecklistKey(dayData.day, i)]) done++;
      });
    });

    const percent = total > 0 ? Math.round((done / total) * 100) : 0;
    const remaining = total - done;

    const percentEl = document.getElementById('checklistPercent');
    const doneEl = document.getElementById('clDone');
    const totalEl = document.getElementById('clTotal');
    const remainEl = document.getElementById('clRemaining');
    const circle = document.getElementById('progressCircle');

    if (percentEl) percentEl.textContent = `${percent}%`;
    if (doneEl) doneEl.textContent = done;
    if (totalEl) totalEl.textContent = total;
    if (remainEl) remainEl.textContent = remaining;

    if (circle) {
      const circumference = 2 * Math.PI * 50; // r=50
      const offset = circumference - (percent / 100) * circumference;
      circle.style.strokeDashoffset = offset;
    }

    // Update day counts
    document.querySelectorAll('.checklist-day').forEach((dayEl, dayIdx) => {
      const dayData = weeklyChecklistData[dayIdx];
      if (!dayData) return;
      const count = dayData.tasks.filter((_, i) => 
        appData.weeklyChecklist[getChecklistKey(dayData.day, i)]
      ).length;
      const countEl = dayEl.querySelector('.checklist-day-count');
      if (countEl) countEl.textContent = `${count}/${dayData.tasks.length}`;
    });
  }

  function updateDashboardTaskCount() {
    let done = 0;
    weeklyChecklistData.forEach(dayData => {
      dayData.tasks.forEach((_, i) => {
        if (appData.weeklyChecklist[getChecklistKey(dayData.day, i)]) done++;
      });
    });
    const el = document.getElementById('tasksCompleted');
    if (el) el.textContent = done;
    const progEl = document.getElementById('taskProgress');
    const total = weeklyChecklistData.reduce((s, d) => s + d.tasks.length, 0);
    if (progEl) progEl.style.width = `${(done / total) * 100}%`;
    const textEl = document.getElementById('taskProgressText');
    if (textEl) textEl.textContent = `${done}/${total} this week`;
  }

  // Reset checklist
  const resetBtn = document.getElementById('resetChecklist');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Reset all checklist items for this week?')) {
        appData.weeklyChecklist = {};
        appData.currentWeek = (appData.currentWeek || 1) + 1;
        saveData(appData);
        renderChecklist();
        updateDashboardTaskCount();
      }
    });
  }

  // ==============================
  // WEEK NAVIGATION
  // ==============================
  let displayWeek = appData.currentWeek || 1;
  const weekLabel = document.getElementById('weekLabel');
  const prevWeekBtn = document.getElementById('prevWeek');
  const nextWeekBtn = document.getElementById('nextWeek');

  function updateWeekLabel() {
    if (weekLabel) weekLabel.textContent = `Week ${displayWeek}`;
  }

  if (prevWeekBtn) {
    prevWeekBtn.addEventListener('click', () => {
      displayWeek = Math.max(1, displayWeek - 1);
      updateWeekLabel();
    });
  }
  if (nextWeekBtn) {
    nextWeekBtn.addEventListener('click', () => {
      displayWeek = Math.min(104, displayWeek + 1);
      updateWeekLabel();
    });
  }

  // ==============================
  // INITIALIZATION
  // ==============================
  function init() {
    updateDashboard();
    renderMonthCards();
    renderGoals(0);
    renderChecklist();
    updateDashboardTaskCount();
    updateWeekLabel();

    // Set initial day plan based on current day
    const today = new Date().getDay();
    if (today === 0) {
      // Sunday
      dayTypeBtns.forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.day-plan').forEach(p => p.classList.remove('active'));
      const sunBtn = document.querySelector('[data-daytype="weekend-sun"]');
      const sunPlan = document.getElementById('plan-weekend-sun');
      if (sunBtn) sunBtn.classList.add('active');
      if (sunPlan) sunPlan.classList.add('active');
    } else if (today === 6) {
      // Saturday
      dayTypeBtns.forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.day-plan').forEach(p => p.classList.remove('active'));
      const satBtn = document.querySelector('[data-daytype="weekend-sat"]');
      const satPlan = document.getElementById('plan-weekend-sat');
      if (satBtn) satBtn.classList.add('active');
      if (satPlan) satPlan.classList.add('active');
    }
  }

  init();
});
