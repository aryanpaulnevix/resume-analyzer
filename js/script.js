console.log("JavaScript loaded");
const form = document.getElementById("resume-form");
const resumeInput = document.getElementById("resume");
const fileError = document.getElementById("file-error");

form.addEventListener("submit", async function (event) {
  event.preventDefault();
  console.log("SUBMIT WORKING");
  const analyzeBtn = document.getElementById("analyzeBtn");
  analyzeBtn.textContent = "Analyzing...";
  analyzeBtn.disabled = true;
  const file = resumeInput.files[0];

  if (!file) {
    fileError.textContent = "Please select a resume";
    fileError.classList.add("show");
    analyzeBtn.textContent = "Analyze Resume";
    analyzeBtn.disabled = false;
    return;
  }

  if (file.type !== "application/pdf") {
    fileError.textContent = "Please upload a PDF";
    fileError.classList.add("show");
    analyzeBtn.textContent = "Analyze Resume";
    analyzeBtn.disabled = false;
    return;
  }

  fileError.textContent = "";
  fileError.classList.remove("show");

  const formData = new FormData();
  formData.append("resume", file);

  const API_URL =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://localhost:3000"
    : "";

  const response = await fetch(`${API_URL}/api/analyze`, {
    method: "POST",
    body: formData,
  });
  analyzeBtn.textContent = "Analyze Resume";
  analyzeBtn.disabled = false;

  const data = await response.json();
  document.getElementById("skills-list").textContent = "";
  document.getElementById("missing-list").textContent = "";
  document.getElementById("suggestion-list").textContent = "";

  document.getElementById("score").textContent = data.analysis.score;

  const skillsList = document.getElementById("skills-list");
  data.analysis.skills.forEach(function (skill) {
    const li = document.createElement("li");
    li.textContent = skill;
    skillsList.appendChild(li);
  });

  const missingList = document.getElementById("missing-list");
  data.analysis.missingKeywords.forEach(function (keyword) {
    const li = document.createElement("li");
    li.textContent = keyword;
    missingList.appendChild(li);
  });

  const suggestionList = document.getElementById("suggestion-list");

  data.analysis.suggestions.forEach(function (suggestion) {
    const li = document.createElement("li");
    li.textContent = suggestion;
    suggestionList.appendChild(li);
  });
});
