const gradePoints = {
  "S": 10,
  "A+": 9,
  "A": 8,
  "B+": 7,
  "B": 6,
  "U": 0
};

const subjectsContainer = document.getElementById("subjectsContainer");
const addSubjectBtn = document.getElementById("addSubjectBtn");
const calculateBtn = document.getElementById("calculateBtn");
const subjectRowTemplate = document.getElementById("subjectRowTemplate");
const resultCard = document.getElementById("resultCard");
const cgpaValue = document.getElementById("cgpaValue");
const performanceText = document.getElementById("performanceText");
const cgpaProgress = document.getElementById("cgpaProgress");
const subjectsCount = document.getElementById("subjectsCount");
const creditsCount = document.getElementById("creditsCount");
const downloadPdfBtn = document.getElementById("downloadPdfBtn");

let lastCalculation = {
  cgpa: 0,
  totalCredits: 0,
  validSubjectCount: 0,
  subjects: []
};

function createSubjectRow(defaults = {}) {
  const row = subjectRowTemplate.content.firstElementChild.cloneNode(true);

  const nameInput = row.querySelector(".subject-name");
  const gradeSelect = row.querySelector(".subject-grade");
  const creditInput = row.querySelector(".subject-credits");

  nameInput.value = defaults.name || "";
  gradeSelect.value = defaults.grade || "S";
  creditInput.value = defaults.credits !== undefined ? String(defaults.credits) : "";

  row.querySelectorAll(".remove-row").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (subjectsContainer.children.length <= 1) {
        return;
      }
      row.remove();
    });
  });

  return row;
}

function addSubject(defaults = {}) {
  const row = createSubjectRow(defaults);
  subjectsContainer.appendChild(row);
}

function getPerformanceLabel(cgpa) {
  if (cgpa >= 9) return "Outstanding Performance";
  if (cgpa >= 8) return "Excellent Performance";
  if (cgpa >= 7) return "Great Progress";
  if (cgpa >= 6) return "Good Effort";
  if (cgpa > 0) return "Keep Pushing Forward";
  return "Need Improvement";
}

function animateCgpa(finalValue) {
  const duration = 1100;
  const start = performance.now();

  function frame(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = finalValue * eased;

    cgpaValue.textContent = current.toFixed(2);

    if (progress < 1) {
      requestAnimationFrame(frame);
    }
  }

  requestAnimationFrame(frame);
}

function calculateCgpa() {
  const rows = [...subjectsContainer.querySelectorAll(".subject-row")];

  let weightedTotal = 0;
  let totalCredits = 0;
  let validSubjectCount = 0;
  const validSubjects = [];

  rows.forEach((row) => {
    const grade = row.querySelector(".subject-grade").value;
    const credits = Number(row.querySelector(".subject-credits").value);
    const subjectName = row.querySelector(".subject-name").value.trim();

    row.classList.remove("ring-2", "ring-rose-400/70");

    if (!subjectName || !Number.isFinite(credits) || credits <= 0) {
      row.classList.add("ring-2", "ring-rose-400/70");
      return;
    }

    weightedTotal += gradePoints[grade] * credits;
    totalCredits += credits;
    validSubjectCount += 1;
    validSubjects.push({
      subjectName,
      grade,
      credits,
      gradePoint: gradePoints[grade]
    });
  });

  if (totalCredits === 0 || validSubjectCount === 0) {
    resultCard.classList.remove("hidden");
    cgpaValue.textContent = "0.00";
    performanceText.textContent = "Add valid subjects with credits greater than 0.";
    cgpaProgress.style.width = "0%";
    subjectsCount.textContent = "Subjects: 0";
    creditsCount.textContent = "Total Credits: 0";
    downloadPdfBtn.classList.add("hidden");
    lastCalculation = {
      cgpa: 0,
      totalCredits: 0,
      validSubjectCount: 0,
      subjects: []
    };
    return;
  }

  const cgpa = weightedTotal / totalCredits;
  const progressWidth = Math.max(0, Math.min((cgpa / 10) * 100, 100));

  lastCalculation = {
    cgpa,
    totalCredits,
    validSubjectCount,
    subjects: validSubjects
  };

  resultCard.classList.remove("hidden");
  animateCgpa(cgpa);
  performanceText.textContent = `${getPerformanceLabel(cgpa)} ${cgpa >= 8 ? "🔥" : cgpa >= 6 ? "✨" : "📈"}`;
  cgpaProgress.style.width = `${progressWidth.toFixed(2)}%`;
  subjectsCount.textContent = `Subjects: ${validSubjectCount}`;
  creditsCount.textContent = `Total Credits: ${totalCredits}`;
  downloadPdfBtn.classList.remove("hidden");
}

function downloadPdfReport() {
  if (!lastCalculation.subjects.length || !window.jspdf || !window.jspdf.jsPDF) {
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();   // 210mm
  const H = doc.internal.pageSize.getHeight();  // 297mm

  // ── Colour palette ──────────────────────────────────
  const C = {
    navy:   [11, 20, 50],
    indigo: [99, 102, 241],
    white:  [255, 255, 255],
    s50:    [248, 250, 252],
    s100:   [241, 245, 249],
    s200:   [226, 232, 240],
    s400:   [148, 163, 184],
    s500:   [100, 116, 139],
    s700:   [51, 65, 85],
    s900:   [15, 23, 42],
    dim:    [170, 185, 220],
  };

  const ml = 20, cw = 170;   // left margin 20, content width 170mm

  // Column definitions (x = absolute mm from page left)
  const col = {
    sno: { x: ml,       w: 10 },
    sub: { x: ml + 10,  w: 75 },
    grd: { x: ml + 85,  w: 20 },
    crd: { x: ml + 105, w: 22 },
    gp:  { x: ml + 127, w: 23 },
    wtd: { x: ml + 150, w: 20 },
  };
  const cx = (c) => c.x + c.w / 2;   // column centre x

  // ── HEADER BAND ─────────────────────────────────────
  doc.setFillColor(...C.navy);
  doc.rect(0, 0, W, 42, "F");

  // Left accent stripe
  doc.setFillColor(...C.indigo);
  doc.rect(ml, 11, 1.2, 20, "F");

  // University name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...C.white);
  doc.text("Anna University", ml + 6, 21);

  // Subtitle
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.setTextColor(...C.dim);
  doc.text("CGPA Performance Report  ·  Regulation 2021", ml + 6, 29);

  // Date — right-aligned
  doc.setFontSize(8.5);
  doc.text(
    `Generated: ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`,
    W - ml, 36, { align: "right" }
  );

  // Bottom indigo line
  doc.setFillColor(...C.indigo);
  doc.rect(0, 42, W, 1.2, "F");

  // ── SUMMARY CARDS ───────────────────────────────────
  let y = 52;

  const cgpaVal  = lastCalculation.cgpa.toFixed(2);
  const perfLabel =
    parseFloat(cgpaVal) >= 9   ? "First Class with Distinction" :
    parseFloat(cgpaVal) >= 7.5 ? "First Class" :
    parseFloat(cgpaVal) >= 6   ? "Second Class" : "Pass Class";

  const cards = [
    { label: "SEMESTER",      value: "I"                                  },
    { label: "TOTAL CREDITS", value: String(lastCalculation.totalCredits) },
    { label: "CGPA",          value: cgpaVal                              },
  ];

  const cardW = (cw - 8) / 3;
  cards.forEach((card, i) => {
    const bx = ml + i * (cardW + 4);
    doc.setFillColor(...C.s100);
    doc.setDrawColor(...C.s200);
    doc.setLineWidth(0.3);
    doc.roundedRect(bx, y, cardW, 20, 2.5, 2.5, "FD");
    // indigo top accent
    doc.setFillColor(...C.indigo);
    doc.roundedRect(bx, y, cardW, 1.5, 0.5, 0.5, "F");
    // label
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...C.s500);
    doc.text(card.label, bx + cardW / 2, y + 8.5, { align: "center" });
    // value
    doc.setFont("helvetica", "bold");
    doc.setFontSize(card.label === "CGPA" ? 16 : 14);
    doc.setTextColor(...C.s900);
    doc.text(card.value, bx + cardW / 2, y + 17, { align: "center" });
  });

  // Performance tag — right-aligned
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...C.indigo);
  doc.text(`◆  ${perfLabel}`, W - ml, y + 11, { align: "right" });

  y += 28;

  // ── SECTION LABEL ───────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...C.s500);
  doc.text("SUBJECT-WISE PERFORMANCE", ml, y);
  doc.setDrawColor(...C.s200);
  doc.setLineWidth(0.3);
  doc.line(ml + 60, y - 1, ml + cw, y - 1);

  y += 5;

  // ── TABLE ───────────────────────────────────────────
  const hdrH    = 9;
  const rowH    = 8.5;
  const tableY0 = y;

  function drawTableHeader(yy) {
    doc.setFillColor(...C.s900);
    doc.roundedRect(ml, yy, cw, hdrH, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...C.white);
    doc.text("#",        cx(col.sno), yy + 6.2, { align: "center" });
    doc.text("Subject",  col.sub.x + 2, yy + 6.2);
    doc.text("Grade",    cx(col.grd), yy + 6.2, { align: "center" });
    doc.text("Credits",  cx(col.crd), yy + 6.2, { align: "center" });
    doc.text("Grd Pts",  cx(col.gp),  yy + 6.2, { align: "center" });
    doc.text("Weighted", cx(col.wtd), yy + 6.2, { align: "center" });
  }

  drawTableHeader(y);
  y += hdrH;

  lastCalculation.subjects.forEach((s, idx) => {
    if (y + rowH > H - 28) {
      doc.addPage();
      drawTableHeader(20);
      y = 20 + hdrH;
    }

    // Alternating row background
    doc.setFillColor(...(idx % 2 === 0 ? C.white : C.s50));
    doc.rect(ml, y, cw, rowH, "F");

    // Horizontal row separator
    doc.setDrawColor(...C.s200);
    doc.setLineWidth(0.2);
    doc.line(ml, y + rowH, ml + cw, y + rowH);

    // Vertical column dividers
    doc.setDrawColor(210, 218, 232);
    doc.setLineWidth(0.15);
    [col.grd.x, col.crd.x, col.gp.x, col.wtd.x].forEach(vx => {
      doc.line(vx, y, vx, y + rowH);
    });

    const ty = y + 5.8;
    doc.setTextColor(...C.s700);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(String(idx + 1), cx(col.sno), ty, { align: "center" });
    doc.text(s.subjectName,   col.sub.x + 2, ty, { maxWidth: col.sub.w - 4 });
    doc.text(s.grade,         cx(col.grd), ty, { align: "center" });
    doc.text(String(s.credits), cx(col.crd), ty, { align: "center" });
    doc.text(String(s.gradePoint), cx(col.gp), ty, { align: "center" });

    // Weighted score (grade pts × credits) — slightly bold, navy
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C.navy);
    doc.text(String(s.gradePoint * s.credits), cx(col.wtd), ty, { align: "center" });

    y += rowH;
  });

  // Outer table border
  doc.setDrawColor(...C.s200);
  doc.setLineWidth(0.5);
  doc.rect(ml, tableY0, cw, y - tableY0);

  // ── FORMULA NOTE ────────────────────────────────────
  y += 8;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(...C.s400);
  doc.text("CGPA  =  Σ (Grade Points × Credits)  /  Σ Credits", ml, y);

  // ── FOOTER BAND ─────────────────────────────────────
  doc.setFillColor(...C.navy);
  doc.rect(0, H - 12, W, 12, "F");
  doc.setFillColor(...C.indigo);
  doc.rect(0, H - 12, W, 0.8, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...C.dim);
  doc.text(
    "CGPA Buddy  ·  srirambharath-7.github.io/Anna-University-CGPA-Calculator",
    W / 2, H - 5.5, { align: "center" }
  );

  doc.save("anna-university-cgpa-report.pdf");
}

addSubjectBtn.addEventListener("click", () => addSubject());
calculateBtn.addEventListener("click", calculateCgpa);
downloadPdfBtn.addEventListener("click", downloadPdfReport);

[
  { name: "Applied Calculus", grade: "S", credits: 4 },
  { name: "English Essentials - I", grade: "S", credits: 2 },
  { name: "Heritage of Tamils", grade: "S", credits: 1 },
  { name: "Applied Physics - I", grade: "S", credits: 3 },
  { name: "Applied Chemistry - I", grade: "S", credits: 3 },
  { name: "Computer Programming: C", grade: "S", credits: 3 },
  { name: "Essentials of Computing", grade: "S", credits: 3 },
  { name: "Makerspace", grade: "S", credits: 2 },
  { name: "Life Skills for Engineers - I", grade: "S", credits: 1 },
  { name: "Physical Education - I", grade: "S", credits: 1 }
].forEach((subject) => addSubject(subject));
