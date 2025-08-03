// === Imports ===
const express = require("express");
const puppeteer = require("puppeteer");
const { Readability } = require("@mozilla/readability");
const { JSDOM } = require("jsdom");
const path = require("path");

// === Express Setup ===
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// === Scrape Endpoint ===
app.post("/scrape", async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  try {
    // === Launch Puppeteer (with hardcoded path) ===
    const chromePath = path.join(
      __dirname,
      "chromium",
      "chrome",
      "linux-138.0.7204.168",
      "chrome-linux64",
      "chrome"
    );

    const browser = await puppeteer.launch({
      headless: true,
      executablePath: chromePath,
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();

    // === Set Headers ===
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
    );
    await page.setExtraHTTPHeaders({
      "accept-language": "en-US,en;q=0.9"
    });

    // === Block Fonts and Images ===
    await page.setRequestInterception(true);
    page.on("request", (req) => {
      const type = req.resourceType();
      if (type === "image" || type === "font") {
        req.abort();
      } else {
        req.continue();
      }
    });

    // === Navigate to URL ===
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 60000
    });

    // === Readability ===
    const html = await page.content();
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    await browser.close();

    if (!article) {
      return res.status(500).json({ error: "Could not extract article" });
    }

    // === Return Clean Article ===
    res.json({
      title: article.title,
      content: article.textContent
    });

  } catch (err) {
    console.error("Scraping error:", err);
    res.status(500).json({ error: "Failed to scrape the page" });
  }
});

// === Start Server ===
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
