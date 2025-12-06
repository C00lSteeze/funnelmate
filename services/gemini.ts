import { GoogleGenAI, GenerateContentResponse, Chat, Schema } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// -- MODELS --
const PRO_MODEL = 'gemini-3-pro-preview';
const LITE_MODEL = 'gemini-2.0-flash-lite-preview-02-05';
const VISION_MODEL = 'gemini-3-pro-preview';

/**
 * Helper to retry a function if it fails (useful for thinking model timeouts)
 */
async function withRetry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0) {
      console.warn(`Retrying operation... (${retries} attempts left)`, error);
      return withRetry(fn, retries - 1);
    }
    console.error("Operation failed after retries:", error);
    throw error;
  }
}

/**
 * Uses Gemini 3 Pro with Thinking Config for deep strategy generation.
 */
export const generateFunnelStrategy = async (
  niche: string,
  product: string,
  audience: string
): Promise<string> => {
  const prompt = `
      Act as a world-class affiliate marketing expert. I need a complete funnel strategy for a beginner.
      
      Niche: ${niche}
      Product: ${product}
      Target Audience: ${audience}

      STRICTLY follow this output structure using Markdown. 
      Do not add introductory text. Start directly with "# Strategy Overview".
      Ensure the "Script/Quote" sections are always in blockquotes (>).

      # Strategy Overview
      **Hook:** [Write a single compelling sentence hook describing the opportunity]
      **Targeting:** [Specific audience definition and their pain point]

      ## Step 1: Landing Page
      ### [Main Headline for the Page]
      [A short paragraph explaining the concept and why it works for this niche.]
      > [Write the actual header script/copy for the page here. Make it punchy.]
      - [Benefit 1: Specific outcome]
      - [Benefit 2: Addressing a fear]
      - [Benefit 3: Ease of use/speed]
      **Call to Action:** [Button Text]

      ## Step 2: Bridge Page
      ### [Main Headline for the Bridge Page]
      [Explain the goal: building trust and connecting the lead to the offer.]
      > [Write a personal script for the bridge video or text. "Hi, I'm [Name]..." Connect with their pain.]
      - [Trust builder point 1]
      - [Trust builder point 2]
      - [Transition to offer point]
      **Call to Action:** [Button Text]

      ## Step 3: Value Email
      ### Email 1: The Value Delivery
      [Explain the strategy: Deliver the lead magnet and transition softly.]
      > Subject: [Subject Line]
      >
      > [Email Body Copy. Keep it personal. "Hey [Name]..."]
      - [Psychological trigger: Reciprocity]
      - [Psychological trigger: Curiosity]
      **Call to Action:** [Link Text]

      ## Step 4: Logic Email
      ### Email 2: Overcoming Objections
      [Explain the strategy: Address the "I can't do this" or "I don't have time" objection.]
      > Subject: [Subject Line]
      >
      > [Email Body Copy. Focus on simplicity and automation.]
      - [Objection handled: Time/Skill]
      - [Persuasion technique: Social Proof/Logic]
      **Call to Action:** [Link Text]

      ## Step 5: Scarcity Email
      ### Email 3: The Push
      [Explain the strategy: Create urgency or fear of missing out (FOMO).]
      > Subject: [Subject Line]
      >
      > [Email Body Copy. "Fast forward 30 days..."]
      - [Future pacing technique]
      - [Scarcity element]
      **Call to Action:** [Link Text]
  `;

  return withRetry(async () => {
    const response = await ai.models.generateContent({
      model: PRO_MODEL,
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 2048 }, // Moderate thinking budget
      }
    });
    return response.text || "Failed to generate strategy.";
  });
};

/**
 * Generates quick copy for specific tasks (Headlines, Tweets, Emails, etc.)
 */
export const generateQuickCopy = async (
  topic: string, 
  type: 'headline' | 'tweet' | 'email_subject' | 'ad_copy' | 'landing_page' | 'lead_magnet' | 'lead_magnet_ideas' | 'email_sequence' | 'whatsapp_template' | 'facebook_post' | 'pov_video_script',
  template: string = ''
): Promise<string> => {
  let prompt = '';
  const context = template ? `Use the '${template}' framework/style.` : '';

  switch (type) {
    case 'headline':
      prompt = `Write 5 high-converting headlines for: ${topic}. ${context} Focus on curiosity and benefit.`;
      break;
    case 'tweet':
      prompt = `Write 3 engaging tweets about: ${topic}. ${context} Include hashtags.`;
      break;
    case 'email_subject':
      prompt = `Write 5 open-loop email subject lines for: ${topic}. ${context}`;
      break;
    case 'ad_copy':
      prompt = `Write a compelling Facebook ad copy for: ${topic}. ${context} Include: Headline, Primary Text, and CTA. Focus on benefits.`;
      break;
    case 'landing_page':
      prompt = `Create a structure for a high-converting landing page for: ${topic}. ${context} Include: Headline, 3 Key Benefits, Social Proof placeholder, and CTA.`;
      break;
    case 'lead_magnet':
      prompt = `Write a short "5 Essential Tips" checklist content for a lead magnet about: ${topic}. ${context} Include placeholders for affiliate links.`;
      break;
    case 'lead_magnet_ideas':
      prompt = `Suggest 3 distinct lead magnet ideas (e.g., Checklist, Ebook, Video Training) that would work well for promoting: ${topic}. For each, explain WHY it works.`;
      break;
    case 'email_sequence':
      prompt = `Write a 3-day email sequence for: ${topic}. ${context} 
      Day 1: Value + Soft Pitch. 
      Day 2: Overcoming Objections. 
      Day 3: Hard Pitch/Urgency.`;
      break;
    case 'whatsapp_template':
        prompt = `Write a 3-part WhatsApp message sequence for a potential lead interested in: ${topic}.
        Message 1: Casual initial outreach / question.
        Message 2: Reply if they say "Yes" (Provide value/info).
        Message 3: Follow up if they don't reply.`;
        break;
    case 'facebook_post':
        prompt = `Write an engaging personal Facebook post (long-form style) about: ${topic}. 
        Focus on storytelling, vulnerability, and a soft Call to Action in the comments. ${context}`;
        break;
    case 'pov_video_script':
        prompt = `Write a 30-second "POV" (Point of View) Faceless Reel/TikTok script about: ${topic}.
        Include:
        - Text on Screen
        - Visual description (what to film)
        - Caption text
        - Trending audio vibe suggestion.`;
        break;
    default:
      prompt = `Write marketing copy for: ${topic}. ${context}`;
  }

  return withRetry(async () => {
    const response = await ai.models.generateContent({
      model: LITE_MODEL,
      contents: prompt,
    });
    return response.text || "No copy generated.";
  });
};

/**
 * Analyzes a competitor's image for marketing insights.
 */
export const analyzeCompetitorImage = async (base64Image: string, mimeType: string): Promise<string> => {
  const prompt = `
    Analyze this marketing asset (landing page, ad, or post).
    
    STRICTLY output using the following Markdown structure with these exact headers:

    ## Hook
    [Identify the main hook or attention grabber]

    ## Promise
    [What is the big promise or benefit?]

    ## Call to Action
    [Analyze the CTA text and placement]

    ## Psychological Triggers
    [List the triggers used, e.g., Scarcity, Authority, Social Proof]

    ## Why this converts
    [Provide a bulleted list of 3-5 reasons why this design is effective]
  `;

  return withRetry(async () => {
    const response = await ai.models.generateContent({
      model: VISION_MODEL,
      contents: {
        parts: [
          { inlineData: { mimeType, data: base64Image } },
          { text: prompt }
        ]
      }
    });
    return response.text || "Analysis failed.";
  });
};

/**
 * Creates a chat session for the Coach.
 */
export const createChatSession = (): Chat => {
  return ai.chats.create({
    model: PRO_MODEL,
    config: {
      systemInstruction: "You are a friendly, encouraging affiliate marketing coach for beginners. Keep answers concise and actionable."
    }
  });
};
