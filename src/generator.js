
import OpenAI from "openai";

const TONES = {
  professional: "professional and authoritative",
  friendly: "warm, friendly and conversational",
  witty: "witty, playful and slightly irreverent",
  inspirational: "inspiring and motivational",
  neutral: "neutral and informative",
};

const LENGTHS = {
  short: "roughly 350-500 words",
  medium: "roughly 700-1000 words",
  long: "roughly 1400-1800 words",
};

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

function buildSystemPrompt(toneLabel, audienceLabel, lengthLabel) {
  return [
    "You are a professional blog writer and editor. You write clear, well-structured, engaging articles.",
    "Tone: " + (toneLabel || "professional") + ".",
    "Target audience: " + (audienceLabel || "a general audience") + ".",
    "Length: " + (lengthLabel || "medium") + ".",
    "",
    "Return ONLY valid Markdown. Structure it as follows:",
    "- A single H1 title.",
    "- A one-paragraph hook (no heading).",
    "- 3-5 H2 sections with meaningful headings, each with a few paragraphs.",
    "- A short bulleted 'Key takeaways' list.",
    "- A concluding paragraph.",
    "Do not wrap the output in a code fence. Do not include any text outside the Markdown.",
  ].join("\n");
}

async function generateWithOpenAI(topic, toneLabel, audienceLabel, lengthLabel) {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.8,
    max_tokens: 2200,
    messages: [
      { role: "system", content: buildSystemPrompt(toneLabel, audienceLabel, lengthLabel) },
      { role: "user", content: "Write a blog post about: " + topic },
    ],
  });
  const markdown = response.choices?.[0]?.message?.content?.trim();
  if (!markdown) throw new Error("Empty response from OpenAI");
  return markdown;
}

function generateDemo(topic, toneLabel, audienceLabel) {
  const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
  const title = cap(topic);
  const tone = toneLabel || "professional";
  const audience = audienceLabel || "your readers";
  return (
    "# " + title + "\n\n" +
    "Everyone has a take on " + topic + " — but few actually take the time to understand it. This guide breaks it down into the ideas that matter, so you can walk away with a clear picture and a practical next step.\n\n" +
    "## Why " + topic + " matters right now\n\n" +
    "The conversation around " + topic + " keeps growing, and for good reason. Whether you're just curious or actively working in the space, " + topic + " sits at the intersection of real-world impact and everyday relevance. For " + audience + ", understanding the fundamentals is no longer optional — it's becoming table stakes.\n\n" +
    "What makes this moment interesting is that the basics have finally caught up with the hype. The noisy part has faded, and what's left is the signal: a handful of core ideas you can actually use.\n\n" +
    "## The core ideas, simply explained\n\n" +
    "At its heart, " + topic + " rests on three principles:\n\n" +
    "1. **Start with the problem, not the tool.** The best approaches to " + topic + " begin with a clear question and work backward.\n" +
    "2. **Small, consistent steps win.** Big transformations around " + topic + " rarely happen overnight — they compound.\n" +
    "3. **Context changes everything.** The same idea applies differently depending on your situation, and that nuance is where the value lives.\n\n" +
    "None of this is complicated. But it's easy to miss when you're drowning in noise.\n\n" +
    "## How to get started today\n\n" +
    "You don't need a grand plan to begin. Pick one small thing related to " + topic + ", do it this week, and reflect on the result. That single loop — try, reflect, adjust — is the entire engine of progress here.\n\n" +
    "A few ways to dip in:\n\n" +
    "- Read one solid, in-depth piece on " + topic + " (not a listicle).\n" +
    " - Try the simplest version of the idea yourself.\n" +
    "- Write down what you expected versus what actually happened.\n\n" +
    "## Common pitfalls to avoid\n\n" +
    "The mistakes around " + topic + " are remarkably consistent. People over-engineer before they understand the basics. They copy what works for others without adapting it to their own context. And they quit right before a small insight would have unlocked the next level.\n\n" +
    "None of these are fatal. They're just friction — and friction is removable.\n\n" +
    "## Key takeaways\n\n" +
    "- " + topic + " is more approachable than the hype suggests.\n" +
    "- Progress comes from small, consistent, context-aware steps.\n" +
    "- The fundamentals matter more than the latest trend.\n" +
    "- Start with one small action this week.\n\n" +
    "## Wrapping up\n\n" +
    "The best time to learn about " + topic + " was yesterday; the second-best time is now. You don't need to master everything — you just need to take the first honest step. Do that, and the rest follows.\n\n" +
    "_This article was generated by AI Blog Writer in " + tone + " mode. Connect an OpenAI API key to generate unlimited real articles._"
  );
}

export async function generateArticle(payload) {
  const { topic, toneLabel, audienceLabel, lengthLabel } = payload;
  if (openai) {
    const markdown = await generateWithOpenAI(topic, toneLabel, audienceLabel, lengthLabel);
    return { markdown, mode: "openai" };
  }
  return { markdown: generateDemo(topic, toneLabel, audienceLabel), mode: "demo" };
}

export { TONES, LENGTHS };
