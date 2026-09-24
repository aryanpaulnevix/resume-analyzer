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

app.post("/api/analyze", upload.single("resume"), async function (req, res) {
  if (!req.file) {
    return res.status(400).json({
      error: "Please upload a PDF resume",
    });
  }

  try {
    const pdfBuffer = req.file.buffer;

    const parser = new PDFParse({
      data: pdfBuffer,
    });

    const result = await parser.getText();
    const resumeText = result.text;

    await parser.destroy();

    const prompt = createResumePrompt(resumeText);

    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0,
      max_completion_tokens: 2048,
      stream: false,
    });

    const analysisText = completion.choices[0].message.content;

    const analysisData = JSON.parse(analysisText);

    res.json({
      analysis: analysisData,
    });
  } catch (error) {
    console.error("Resume analysis failed:", error);

    res.status(500).json({
      error: "Failed to analyze resume",
    });
  }
});

app.listen(process.env.PORT || 3000, function () {
  console.log("Server running on port 3000");
});
