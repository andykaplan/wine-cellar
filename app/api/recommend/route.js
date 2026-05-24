import Anthropic from '@anthropic-ai/sdk'

const SYSTEM_PROMPT = `You are a world-class sommelier advising a wine collector on what to drink tonight from their personal cellar.

You will receive:
- Their wine collection as JSON
- Their preference (red, white, or no preference)
- Optionally, a food pairing they have in mind
- Their drinking history with ratings, IF they have rated any wines — only use this if it is explicitly provided

Your job is to recommend exactly 2 wines from the collection — a first choice and a second choice.

PRIORITIZATION RULES (in order of importance):
1. Wines with verdict PROBABLY UNDRINKABLE should be skipped unless the cellar has nothing else
2. Wines with verdict PAST PEAK should be prioritized — they should be drunk soon
3. Wines with verdict PEAK SOON or DRINK NOW should be prioritized next
4. Wines with verdict HOLD should only be recommended if nothing better is available
5. If a food pairing is specified, factor in how well the wine matches the food
6. ONLY if a drinking history section is explicitly provided below: use those ratings to understand preferences. Do NOT invent or assume any ratings or preferences if no history is provided.
7. Within the same priority tier, prefer wines whose drinking window is ending soonest

Respond ONLY with valid JSON — no markdown, no backticks, no text outside the JSON.

Return this exact structure:
{
  "firstChoice": {
    "id": "the wine's id field from the collection",
    "name": "wine name",
    "vintage": "vintage",
    "reason": "2-3 sentences explaining why this is tonight's top pick — mention urgency if applicable, food pairing match if relevant, and taste preferences gleaned from their history if relevant",
    "serveTemp": "e.g. '60-65F (cellar temp)' or '45-50F (well chilled)'",
    "decant": "e.g. 'Decant 30 minutes' or 'No decanting needed'"
  },
  "secondChoice": {
    "id": "the wine's id field from the collection",
    "name": "wine name",
    "vintage": "vintage",
    "reason": "2-3 sentences explaining why this is a strong second option",
    "serveTemp": "serving temperature",
    "decant": "decanting recommendation"
  },
  "sommelierNote": "One sentence of overall context or advice for the evening"
}

If the cellar has fewer than 2 suitable wines matching the preference, do your best with what is available and note this in the reason field. If the cellar is empty or has no wines matching the preference at all, return: { "error": "Brief explanation" }`

export async function POST(request) {
  try {
    const { cellar, preference, foodPairing, history } = await request.json()

    if (!cellar || cellar.length === 0) {
      return Response.json({ error: 'Your cellar is empty — scan some labels first!' }, { status: 400 })
    }

    const cellarForAPI = cellar.map(({ imageData, ...rest }) => rest)

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    let historySection = ''
    if (history && history.length > 0) {
      // Only include valid history entries that have a real rating (1-10)
      // Guards against corrupt data or old blob files being misread as history
      const validHistory = history.filter(e =>
        e.rating && typeof e.rating === 'number' && e.rating >= 1 && e.rating <= 10 &&
        e.drunkOn && e.name
      )
      if (validHistory.length > 0) {
        const recentHistory = validHistory.slice(0, 20)
        historySection = `\nMy drinking history with ratings (most recent first):\n${JSON.stringify(recentHistory, null, 2)}`
      }
    }

    const userMessage = `
Here is my wine collection:
${JSON.stringify(cellarForAPI, null, 2)}

My preference for tonight: ${preference || 'No preference — red or white is fine'}
${foodPairing ? `Food pairing: ${foodPairing}` : 'No specific food pairing in mind'}
${historySection || 'Drinking history: none yet — I have not rated any wines, do not infer or assume any preferences.'}

Please recommend the best 2 wines for me to drink tonight.`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    })

    const text = message.content.find(b => b.type === 'text')?.text || ''
    let cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '')
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON object found in response')
    const parsed = JSON.parse(jsonMatch[0])

    return Response.json(parsed)
  } catch (err) {
    console.error('Recommendation error:', err)
    return Response.json({ error: `Recommendation failed: ${err.message}` }, { status: 500 })
  }
}
