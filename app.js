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
  });

  if (totalCredits === 0 || validSubjectCount === 0) {
    resultCard.classList.remove("hidden");
    cgpaValue.textContent = "0.00";
    performanceText.textContent = "Add valid subjects with credits greater than 0.";
    cgpaProgress.style.width = "0%";
    subjectsCount.textContent = "Subjects: 0";
    creditsCount.textContent = "Total Credits: 0";
    return;
  }

  const cgpa = weightedTotal / totalCredits;
  const progressWidth = Math.max(0, Math.min((cgpa / 10) * 100, 100));

  resultCard.classList.remove("hidden");
  animateCgpa(cgpa);
  performanceText.textContent = `${getPerformanceLabel(cgpa)} ${cgpa >= 8 ? "🔥" : cgpa >= 6 ? "✨" : "📈"}`;
  cgpaProgress.style.width = `${progressWidth.toFixed(2)}%`;
  subjectsCount.textContent = `Subjects: ${validSubjectCount}`;
  creditsCount.textContent = `Total Credits: ${totalCredits}`;
}

addSubjectBtn.addEventListener("click", () => addSubject());
calculateBtn.addEventListener("click", calculateCgpa);

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
