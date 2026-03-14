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
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - (margin * 2);

  function drawTableHeader(topY) {
    doc.setFillColor(15, 23, 42);
    doc.roundedRect(margin, topY, contentWidth, 10, 2, 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Subject", 22, topY + 6.5);
    doc.text("Grade", 126, topY + 6.5);
    doc.text("Credits", 154, topY + 6.5);
    doc.text("Point", 188, topY + 6.5, { align: "right" });
    doc.setTextColor(33, 37, 41);
    return topY + 12;
  }

  doc.setDrawColor(30, 41, 59);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(10, 10, pageWidth - 20, pageHeight - 20, 6, 6, "FD");

  doc.setFillColor(14, 22, 48);
  doc.roundedRect(margin, 16, contentWidth, 22, 4, 4, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Anna University CGPA Calculator", 22, 26);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Report Date: ${new Date().toLocaleString()}`, 22, 33);

  doc.setTextColor(33, 37, 41);

  let y = drawTableHeader(46);

  lastCalculation.subjects.forEach((subject) => {
    if (y > 262) {
      doc.addPage();
      doc.setDrawColor(30, 41, 59);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(10, 10, pageWidth - 20, pageHeight - 20, 6, 6, "FD");
      y = drawTableHeader(20);
    }

    doc.setFillColor(y % 20 === 0 ? 255 : 245, y % 20 === 0 ? 255 : 247, y % 20 === 0 ? 255 : 250);
    doc.roundedRect(margin, y - 6.5, contentWidth, 10, 1.5, 1.5, "F");
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y - 6.5, contentWidth, 10, 1.5, 1.5, "S");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.text(subject.subjectName, 22, y, { maxWidth: 96 });
    doc.text(subject.grade, 126, y);
    doc.text(String(subject.credits), 154, y);
    doc.text(String(subject.gradePoint), 188, y, { align: "right" });
    y += 10;
  });

  y += 4;

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, y, 82, 16, 3, 3, "F");
  doc.roundedRect(pageWidth - margin - 56, y, 56, 16, 3, 3, "F");
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, 82, 16, 3, 3, "S");
  doc.roundedRect(pageWidth - margin - 56, y, 56, 16, 3, 3, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(`Total Credits: ${lastCalculation.totalCredits}`, 22, y + 10);
  doc.text(`CGPA: ${lastCalculation.cgpa.toFixed(2)}`, pageWidth - margin - 28, y + 10, { align: "center" });

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
