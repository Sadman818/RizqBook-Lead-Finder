import { GoogleGenAI } from "@google/genai";
import { LeadSearchResult, LeadPriorityTag, LeadStatus, GroundingSource, StrategyPersona } from "../types";

export class GeminiService {
  /**
   * Fetches leads using the Google GenAI SDK with Maps Grounding.
   * @param modelName The specific model name to use for generation
   * @param thinkingBudget Reasoning token budget
   * @param persona The strategy style to use for the analysis
   */
  async fetchLeads(
    location: string, 
    radius: number, 
    categories: string[], 
    modelName: string = "gemini-2.5-flash",
    thinkingBudget: number = 0,
    persona: StrategyPersona = StrategyPersona.STANDARD
  ): Promise<LeadSearchResult> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const personaInstruction = persona === StrategyPersona.SALES 
      ? "Your tone is high-urgency and focused on missed revenue. Outreach scripts should be bold and focus on 'Stop losing money today'."
      : persona === StrategyPersona.CONSULTATIVE 
      ? "Your tone is empathetic and focused on operational efficiency and customer experience. Outreach should be 'How can we help your staff succeed'."
      : "Your tone is professional and objective, focused on market data and technical gaps.";

    const prompt = `
      Act as the Ultra-High-End Lead Intelligence Engine for RizqBook.
      Search Location: ${location}, Bangladesh.
      Scan Radius: ${radius}km.
      Market Verticals: ${categories.join(", ")}.
      Current Strategy Persona: ${persona}.
      ${personaInstruction}

      INSTRUCTIONS:
      Use the Google Maps tool to find real, existing service-based businesses in ${location}.
      Focus on identifying businesses with high review counts but likely manual booking processes (WhatsApp/Phone based).

      FOR EACH BUSINESS (Return at least 5-8 leads if available):
      1. Basic: businessName, category, fullAddress, city, lat/lng, phone, googleMapsRating, totalReviews.
      2. Status: isClaimed (Boolean), businessHours.
      3. Booking Tech Analysis: Determine if they use software like Zenoti, Fresha, or if they are manual (WhatsApp-based).
      4. Scoring: leadScore (0-100), priorityTag (HOT/WARM/COLD).
      5. Pain Points: Identify 3 specific reasons why they need an automated booking system (e.g., "High call volume causing missed appointments").
      6. Sales Intelligence: ownerName (if detectable), suggestedPlan ("Basic" | "Pro" | "Premium").
      7. Scripts: Multi-lingual (Bangla/English) outreach scripts tailored to the ${persona} persona.

      OUTPUT FORMAT:
      Return valid JSON in the following structure:
      {
        "leads": [ { ...leadSchema } ],
        "analysis": {
          "totalLeads": number,
          "hotLeadsCount": number,
          "marketInsights": "Summary of local competition",
          "averagePainScore": number,
          "suggestedOutreachStrategy": "Strategic advice",
          "categoryDistribution": { "Category": count }
        }
      }

      ONLY return the JSON object. Do not include markdown or explanations.
    `;

    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          tools: [{ googleMaps: {} }],
          thinkingConfig: { thinkingBudget: thinkingBudget }
        },
      });

      const text = response.text || "";
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) throw new Error("Could not parse lead data from response.");
      
      const data = JSON.parse(jsonMatch[0]);

      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      const sources: GroundingSource[] = [];
      
      if (groundingChunks) {
        groundingChunks.forEach((chunk: any) => {
          if (chunk.maps) {
            const source: GroundingSource = {
              title: chunk.maps.title || "Verified Business",
              uri: chunk.maps.uri
            };
            
            if (chunk.maps.placeAnswerSources?.reviewSnippets) {
              source.reviewSnippets = chunk.maps.placeAnswerSources.reviewSnippets.map((s: any) => s.text);
            }
            
            sources.push(source);
          }
        });
      }

      data.leads = (data.leads || []).map((l: any, idx: number) => {
        const matchingSource = sources.find(s => 
          s.title.toLowerCase().includes(l.businessName.toLowerCase()) || 
          l.businessName.toLowerCase().includes(s.title.toLowerCase())
        );

        return {
          ...l,
          id: l.id || `lead-${Date.now()}-${idx}`,
          status: LeadStatus.NEW,
          notes: "",
          savedAt: Date.now(),
          sourceUri: matchingSource?.uri || l.sourceUri,
          verifiedReviewSnippets: matchingSource?.reviewSnippets || []
        };
      });

      return {
        leads: data.leads,
        analysis: data.analysis,
        sources: sources
      } as LeadSearchResult;

    } catch (error: any) {
      console.error("Gemini Service Error:", error);
      throw new Error(error.message || "Failed to extract business leads. Please try again.");
    }
  }
}

export const geminiService = new GeminiService();