import { Configuration, OpenAIApi } from "openai";

// Günlük sayaç (sunucu hafızasında)
let dailyCount = {};

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const date = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  if (!dailyCount[date]) dailyCount[date] = 0;

  const DAILY_LIMIT = parseInt(process.env.DAILY_LIMIT || "10");
  if (dailyCount[date] >= DAILY_LIMIT) {
    return res.status(429).json({ error: "Günlük limit doldu" });
  }

  try {
    const formidable = (await import("formidable")).default;
    const form = new formidable.IncomingForm();

    form.parse(req, async (err, fields, files) => {
      if (err) return res.status(500).json({ error: "Form parse error" });

      const prompt = fields.prompt;
      const originalFile = files.image;
      const maskFile = files.mask;

      if (!prompt || !originalFile) {
        return res.status(400).json({ error: "Missing prompt or image" });
      }

      const openai = new OpenAIApi(
        new Configuration({ apiKey: process.env.OPENAI_API_KEY })
      );

      const imageResponse = await openai.images.edit({
        image: originalFile.filepath,
        mask: maskFile?.filepath,
        prompt,
        n: 1,
        size: "256x256" // Or "512x512" / "1024x1024"
      });

      dailyCount[date]++; // Sayacı artır

      res.status(200).json({ url: imageResponse.data.data[0].url });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || "Unknown server error" });
  }

  // Eski günleri temizle
  for (let key in dailyCount) {
    if (key !== date) delete dailyCount[key];
  }
}
