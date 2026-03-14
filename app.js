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
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  const ml = 20;          // left margin
  const mr = W - 20;     // right margin
  const cw = mr - ml;    // content width = 170

  // Columns: Subject, Grade, Credits, Grade Points
  const colSub  = { x: ml,      w: 90 };
  const colGrd  = { x: ml+90,   w: 27 };
  const colCrd  = { x: ml+117,  w: 27 };
  const colGP   = { x: ml+144,  w: 26 };
  const cx = (c) => c.x + c.w / 2;

  const rowH = 9;
  let y = 24;

  // ── Title ────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(20, 20, 20);
  doc.text("CGPA Report", ml, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text(new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }), mr, y, { align: "right" });

  y += 3;
  // thin divider
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.4);
  doc.line(ml, y, mr, y);
  y += 8;

  const tableStartY = y;

  // ── Table header ─────────────────────────────────────
  doc.setFillColor(30, 30, 30);
  doc.rect(ml, y, cw, rowH, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text("Subject",      colSub.x + 3, y + 6);
  doc.text("Grade",        cx(colGrd),   y + 6, { align: "center" });
  doc.text("Credits",      cx(colCrd),   y + 6, { align: "center" });
  doc.text("Grade Points", cx(colGP),    y + 6, { align: "center" });
  y += rowH;

  // ── Rows ─────────────────────────────────────────────
  lastCalculation.subjects.forEach((s, idx) => {
    if (y + rowH > H - 30) {
      doc.addPage();
      y = 24;
    }
    doc.setFillColor(idx % 2 === 0 ? 255 : 247, idx % 2 === 0 ? 255 : 247, idx % 2 === 0 ? 255 : 247);
    doc.rect(ml, y, cw, rowH, "F");
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.2);
    doc.line(ml, y + rowH, mr, y + rowH);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(30, 30, 30);
    doc.text(s.subjectName,         colSub.x + 3, y + 6, { maxWidth: colSub.w - 5 });
    doc.text(s.grade,               cx(colGrd),   y + 6, { align: "center" });
    doc.text(String(s.credits),     cx(colCrd),   y + 6, { align: "center" });
    doc.text(String(s.gradePoint),  cx(colGP),    y + 6, { align: "center" });
    y += rowH;
  });

  // outer table border
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.4);
  doc.rect(ml, tableStartY, cw, y - tableStartY);

  y += 10;

  // ── CGPA result ──────────────────────────────────────
  doc.setDrawColor(200, 200, 200);
  doc.setFillColor(245, 245, 245);
  doc.setLineWidth(0.4);
  doc.roundedRect(mr - 60, y, 60, 16, 2, 2, "FD");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text("CGPA", mr - 30, y + 6.5, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(20, 20, 20);
  doc.text(lastCalculation.cgpa.toFixed(2), mr - 30, y + 13, { align: "center" });

  doc.save("cgpa-report.pdf");
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
