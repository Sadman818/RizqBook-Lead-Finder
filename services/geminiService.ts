import { GoogleGenAI } from "@google/genai";
import { LeadSearchResult, LeadPriorityTag, LeadStatus, GroundingSource, StrategyPersona } from "../types";

export class GeminiService {
  /**
   * Robust utility to extract and clean JSON from model output.
   * Handles markdown blocks, trailing commas, and common LLM-generated JSON issues.
   */
  private sanitizeJSON(text: string): string {
    try {
      // 1. Find the first '{' and the last '}'
      const firstBrace = text.indexOf('{');
      const lastBrace = text.lastIndexOf('}');
      
      if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
        return "";
      }

      let jsonPart = text.substring(firstBrace, lastBrace + 1);

      // 2. Remove comments (single line and multi-line)
      jsonPart = jsonPart.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1');

      // 3. Fix trailing commas in objects and arrays
      // Matches a comma followed by closing brace or bracket, potentially with whitespace/newlines
      jsonPart = jsonPart.replace(/,\s*([}\]])/g, '$1');

      // 4. Basic check for unquoted keys (though rare with modern Gemini models)
      // jsonPart = jsonPart.replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');

      return jsonPart;
    } catch (e) {
      console.error("Sanitization failed:", e);
      return "";
    }
  }

  /**
   * Fetches leads using the Google GenAI SDK with Maps Grounding.
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
      ? "Your tone is empathetic and focused on operational efficiency. Outreach should be 'How can we help your staff succeed'."
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

      FOR EACH BUSINESS (Return at least 8-10 leads if available):
      1. Basic: businessName, category, fullAddress, city, lat/lng, phone, googleMapsRating, totalReviews.
      2. Status: isClaimed (Boolean), businessHours.
      3. Booking Tech Analysis: Determine if they use software like Zenoti, Fresha, or if they are manual (WhatsApp-based).
      4. Scoring: leadScore (0-100), priorityTag (HOT/WARM/COLD).
      5. Pain Points: Identify 3 specific reasons why they need an automated booking system.
      6. Sales Intelligence: ownerName (if detectable), suggestedPlan ("Basic" | "Pro" | "Premium").
      7. Scripts: Multi-lingual (Bangla/English) outreach scripts.

      CRITICAL FOR JSON VALIDITY:
      - Return valid JSON only.
      - DO NOT include comments like // or /* */.
      - DO NOT include trailing commas after the last item in arrays or objects.
      - Use double quotes for all keys and strings.
      - Ensure the JSON is complete and not truncated.

      OUTPUT FORMAT:
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
      const cleanedJson = this.sanitizeJSON(text);
      
      if (!cleanedJson) {
        throw new Error("The AI model returned an invalid structure. Please try again or increase Logic Depth.");
      }
      
      const data = JSON.parse(cleanedJson);

      // Extract detailed grounding metadata
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

      // Map leads and attach potential source info
      data.leads = (data.leads || []).map((l: any, idx: number) => {
        const matchingSource = sources.find(s => 
          s.title.toLowerCase().includes(l.businessName.toLowerCase()) || 
          l.businessName.toLowerCase().includes(s.title.toLowerCase())
        );

        return {
          ...l,
          id: l.id || `lead-${Date.now()}-${idx}`,
          status: LeadStatus.NEW,
          notes: l.notes || "",
          savedAt: Date.now(),
          sourceUri: matchingSource?.uri || l.sourceUri,
          verifiedReviewSnippets: matchingSource?.reviewSnippets || l.verifiedReviewSnippets || []
        };
      });

      return {
        leads: data.leads,
        analysis: data.analysis,
        sources: sources
      } as LeadSearchResult;

    } catch (error: any) {
      console.error("Gemini Service Error:", error);
      if (error instanceof SyntaxError) {
        throw new Error("Data structure received from AI was malformed. Try a simpler area or adjust Logic Depth.");
      }
      throw new Error(error.message || "Failed to extract leads. Please check your connection or API key.");
    }
  }
}

export const geminiService = new GeminiService();