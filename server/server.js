require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { Groq } = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const upload = multer({ storage: multer.memoryStorage() });
const { PDFParse } = require("pdf-parse");

const app = express();

app.use(cors());

app.post("/analyze", upload.single("resume"), async function (req, res) {
  const pdfBuffer = req.file.buffer;
  const parser = new PDFParse({ data: pdfBuffer });
  const result = await parser.getText();
  const resumeText = result.text;
  console.log(result.text);
  await parser.destroy();
  const completion = await groq.chat.completions.create({
    model: "openai/gpt-oss-120b",
    messages: [
      {
        role: "user",
        content: `Analyze this resume and return ONLY valid JSON.

Use exactly this structure:
{
  "score": 70,
  "skills": ["skill1", "skill2"],
  "missingKeywords": ["keyword1", "keyword2"],
  "suggestions": ["suggestion1", "suggestion2"]
}

Rules:
- score must be a number from 0 to 100.
- skills should contain important skills detected in the resume.
- missingKeywords should contain useful keywords that are missing from the resume.
- suggestions should contain practical improvement suggestions.
- Do not write any explanation before or after the JSON.
- Do not use markdown or code fences.

Resume:
${resumeText}`,
      },
    ],
    temperature: 0.2,
    max_completion_tokens: 2048,
    stream: false,
  });

  const analysisText = completion.choices[0].message.content;

  console.log("Groq:", analysisText);

  const analysisData = JSON.parse(analysisText);

  res.json({
    analysis: analysisData,
  });
});

app.listen(3000, function () {
  console.log("Server running on port 3000");
});
