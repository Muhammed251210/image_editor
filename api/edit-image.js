import OpenAI from "openai";
import formidable from "formidable";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
    if(req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const form = formidable({ multiples: false });

    form.parse(req, async (err, fields, files) => {
        if(err) return res.status(500).json({ error: err.message });

        try {
            const imageFile = files.image.filepath || files.image.file;
            const maskFile = files.mask.filepath || files.mask.file;

            const response = await openai.images.edit({
                model: "gpt-image-1",
                image: imageFile,
                mask: maskFile,
                prompt: fields.prompt,
                size: "512x512",
            });

            res.status(200).json({ url: response.data[0].url });
        } catch(e) {
            console.error(e);
            res.status(500).json({ error: e.message });
        }
    });
}
