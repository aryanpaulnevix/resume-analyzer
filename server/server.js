require("dotenv").config();

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { Groq } = require("groq-sdk");
const { PDFParse } = require("pdf-parse");

const createResumePrompt = require("./prompts/resumePrompt");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const upload = multer({ storage: multer.memoryStorage() });

const app = express();

app.use(cors());

app.post("/analyze", upload.single("resume"), async function (req, res) {

  const pdfBuffer = req.file.buffer;
  const parser = new PDFParse({ data: pdfBuffer });
  const result = await parser.getText();
  const resumeText = result.text;
  const prompt = createResumePrompt(resumeText);
  await parser.destroy();


  const completion = await groq.chat.completions.create({
    model: "openai/gpt-oss-120b",
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0,
    seed: 42,
    max_completion_tokens: 2048,
    stream: false,
  });

  const analysisText = completion.choices[0].message.content;

  const analysisData = JSON.parse(analysisText);

  res.json({
    analysis: analysisData,
  });
});

app.listen(3000, function () {
  console.log("Server running on port 3000");
});
