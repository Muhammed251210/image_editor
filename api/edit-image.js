import { IncomingForm } from "formidable";
import fs from "fs";
import { Configuration, OpenAIApi } from "openai";

// Vercel için bodyParser kapalı
export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) {
    return res.status(500).json({ error: "API key missing" });
  }

  try {
    const form = new IncomingForm();
    form.keepExtensions = true;

    form.parse(req, async (err, fields, files) => {
      if (err) return res.status(500).json({ error: "Form parse error" });

      const prompt = fields.prompt;
      const originalFile = files.image;
      const maskFile = files.mask; // opsiyonel

      if (!prompt || !originalFile) {
        return res.status(400).json({ error: "Missing prompt or image" });
      }

      const configuration = new Configuration({ apiKey: OPENAI_API_KEY });
      const openai = new OpenAIApi(configuration);

      // OpenAI edit isteği
      const response = await openai.images.edit({
        image: fs.createReadStream(originalFile.filepath),
        mask: maskFile ? fs.createReadStream(maskFile.filepath) : undefined,
        prompt,
        n: 1,
        size: "512x512",
      });

      // Geçici dosyaları silmek istersen
      fs.unlinkSync(originalFile.filepath);
      if (maskFile) fs.unlinkSync(maskFile.filepath);

      res.status(200).json({ url: response.data.data[0].url });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || "Unknown server error" });
  }
}
