import { Configuration, OpenAIApi } from 'openai';
import greekData from './greekData.json';

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
});
const openai = new OpenAIApi(configuration);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST requests allowed' });
  }

  const { verse, word } = req.body;
  if (!verse || !word) return res.status(400).json({ error: 'Verse and word are required.' });

  const entry = greekData.find(entry =>
    entry.verse === verse && entry.english.toLowerCase() === word.toLowerCase()
  );

  if (!entry) return res.status(404).json({ error: 'Word data not found for the given verse.' });

  const { lemma, morphology, gloss } = entry;

  const messages = [
    {
      role: 'system',
      content: `You are a Koine Greek parsing assistant. Use only the data provided. Do not guess or invent information.`
    },
    {
      role: 'user',
      content: `Verse: ${verse}\nEnglish Word: "${word}"\nGreek Lemma: ${lemma}\nMorphology: ${morphology}\nGloss: ${gloss}`
    }
  ];

  try {
    const completion = await openai.createChatCompletion({
      model: 'gpt-4-turbo',
      messages,
      temperature: 0.2,
      max_tokens: 400
    });

    return res.status(200).json({ output: completion.data.choices[0].message.content });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'OpenAI API error' });
  }
}
