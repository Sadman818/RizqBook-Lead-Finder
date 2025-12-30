import { GoogleGenAI } from "@google/genai";
import { LeadSearchResult, LeadPriorityTag, LeadStatus, GroundingSource } from "../types";

export class GeminiService {
  /**
   * Fetches leads using the Google GenAI SDK.
   * Following guidelines:
   * 1. Initialize GoogleGenAI inside the method to ensure fresh API key usage.
   * 2. Use named parameter for apiKey initialization.
   * 3. Access response.text directly as a property.
   * 4. Maps grounding is used; responseMimeType and responseSchema are omitted as per guidelines.
   * 5. Model switched to 'gemini-2.5-flash' for googleMaps tool support.
   */
  async fetchLeads(location: string, radius: number, categories: string[]): Promise<LeadSearchResult> {
    // Initialize with direct access to process.env.API_KEY as per guidelines
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prompt = `
      Act as the Ultra-High-End Lead Intelligence Engine for RizqBook.
      Target: ${location}, Bangladesh (Radius: ${radius}km).
      Categories: ${categories.join(", ")}.

      MANDATORY: Simulate a deep Google Maps grounding analysis.

      FOR EACH BUSINESS, PROVIDE:
      1. id: Unique slug.
      2. businessName, category, fullAddress, city.
      3. latitude, longitude: Precise coordinates in Dhaka region for mapping.
      4. phoneNumber, whatsappNumber, whatsappDetected (true/false).
      5. googleMapsRating, totalReviews, websiteUrl, facebookPage, instagramHandle.
      6. businessHours, isClaimed (true if listing is claimed).
      7. ownerName, ownerPhone, ownerLinkedIn.
      
      BOOKING ANALYSIS:
      8. hasOnlineBooking, bookingMethod, bookingSystemName, isManualBooking.
      9. bookingPainScore (0-100).
      10. leadScore (0-100).
      11. scoreBreakdown: { noBookingSystem: (0-25), highReviewManual: (0-25), whatsappDependency: (0-25), marketMaturity: (0-25) }.
      12. priorityTag: "HOT" (score > 80), "WARM" (50-80), "COLD" (<50).
      
      STRATEGY:
      13. missedBookingRisk, businessMaturity, whyNeedsRizqBook.
      14. topPainPoints (3 items), estMonthlyVolume, suggestedPlan ("Basic" | "Pro" | "Premium").
      15. outreachScripts: { whatsappBangla, whatsappEnglish, coldCallScript, followUpMessage, objectionHandling }.

      GLOBAL ANALYSIS:
      - marketInsights: Current digital adoption in ${location}.
      - suggestedOutreachStrategy: Best time/channel.
      - categoryDistribution: Object with counts per category found.

      OUTPUT: ONLY return valid JSON. No markdown.
    `;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          // Google Maps grounding is requested. Note: responseMimeType and responseSchema are not allowed with this tool.
          // Maps grounding is only supported in Gemini 2.5 series models.
          tools: [{ googleMaps: {} }],
        },
      });

      // Use the .text property directly (not a method)
      const text = response.text || "";
      
      // Extract grounding sources as required
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      const sources: GroundingSource[] = [];
      if (groundingChunks) {
        groundingChunks.forEach((chunk: any) => {
          if (chunk.maps) {
            sources.push({ 
              title: chunk.maps.title || "Maps Source", 
              uri: chunk.maps.uri 
            });
          }
        });
      }

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        data.leads = (data.leads || []).map((l: any) => ({
          ...l,
          status: LeadStatus.NEW,
          notes: "",
          savedAt: Date.now()
        }));
        
        return {
          leads: data.leads,
          analysis: data.analysis,
          sources: sources
        } as LeadSearchResult;
      }
      throw new Error("Lead data extraction failed.");
    } catch (error: any) {
      console.error("Gemini Error:", error);
      throw new Error(error.message || "Search failed.");
    }
  }
}

export const geminiService = new GeminiService();