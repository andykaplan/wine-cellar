import Anthropic from '@anthropic-ai/sdk'

const SYSTEM_PROMPT = `You are a world-class sommelier and wine expert. When given a photo (or photos) of a wine label, analyze carefully and respond ONLY with valid JSON — no markdown, no backticks, no text outside the JSON.

Return this exact structure:
{
  "name": "Full wine name (producer + wine name)",
  "vintage": "Year as string, or 'NV' if non-vintage",
  "producer": "Producer/winery name",
  "region": "Region, Country",
  "varietal": "Grape variety or blend",
  "estimatedValue": "Price range in USD, e.g. '$45-$65', or 'Unknown' if truly unidentifiable",
  "drinkingWindow": "e.g. '2024-2032', 'Drink now', 'Past peak', or 'Probably undrinkable'",
  "verdict": "one of: DRINK NOW, HOLD, PEAK SOON, PAST PEAK, PROBABLY UNDRINKABLE, or UNKNOWN",
  "verdictReason": "One sentence explaining the verdict",
  "characteristics": "2-3 sentences describing the wine's flavor profile, structure, and style. If confidence is LOW write what you can infer from the region/varietal.",
  "confidence": "HIGH, MEDIUM, or LOW",
  "clarificationNeeded": false,
  "clarificationQuestions": []
}

IMPORTANT — set clarificationNeeded to true and populate clarificationQuestions when ANY of these are true:
1. confidence is LOW
2. vintage is unknown or missing (use "Unknown" for vintage field) — a vintage is critical for drinking window advice
3. You cannot identify the region or producer with reasonable confidence

Clarification questions should be specific and actionable (2-4 questions). Examples:
- "Can you photograph the back label? It may show the vintage year and appellation."
- "What year did you purchase or receive this bottle? Even an approximate year helps."
- "Is there a year printed anywhere on the capsule, cork, or back label?"
- "Can you retake the photo in better lighting showing the full label?"
- "Is there any text on the back label showing the importer or region?"

Once the user provides additional information and confidence reaches MEDIUM or HIGH, set clarificationNeeded to false even if some details are still uncertain.

Use verdict PROBABLY UNDRINKABLE when: the wine is a simple table wine well past 10-15 years old, a cheap wine over 20 years old, or any wine where age and type strongly suggest it has deteriorated beyond enjoyment.

If the image is not a wine label at all, return: { "error": "Brief explanation" }`

export async function POST(request) {
  try {
    const { images, clarificationText } = await request.json()

    if (!images || images.length === 0) {
      return Response.json({ error: 'No image provided' }, { status: 400 })
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const content = []

    for (const img of images) {
      content.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: 'image/jpeg',
          data: img,
        },
      })
    }

    if (clarificationText) {
      content.push({ type: 'text', text: `Additional context from user: ${clarificationText}` })
      content.push({ type: 'text', text: 'Please re-analyze with this additional information and return the JSON.' })
    } else {
      content.push({ type: 'text', text: 'Analyze this wine label and return the JSON.' })
    }

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content }],
    })

    const text = message.content.find(b => b.type === 'text')?.text || ''
    let cleaned = text
    cleaned = cleaned.replace(/```json\s*/gi, '').replace(/```\s*/g, '')
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON object found in response: ' + text.slice(0, 200))
    const parsed = JSON.parse(jsonMatch[0])

    return Response.json(parsed)
  } catch (err) {
    console.error('Wine analysis error:', err)
    return Response.json(
      { error: `Analysis failed: ${err.message}` },
      { status: 500 }
    )
  }
}
