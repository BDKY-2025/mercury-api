// === Open New Page and Set Headers ===
const page = await browser.newPage();

await page.setUserAgent(
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
);
await page.setExtraHTTPHeaders({
  "accept-language": "en-US,en;q=0.9"
});

// === Block images and fonts to improve speed ===
await page.setRequestInterception(true);
page.on("request", (req) => {
  const type = req.resourceType();
  if (type === "image" || type === "font") {
    req.abort();
  } else {
    req.continue();
  }
});
