import { GoogleGenAI } from "@google/genai";
import { LeadSearchResult, Lead, LeadPriorityTag, LeadStatus, GroundingSource, StrategyPersona } from "../types";

export class GeminiService {
  private sanitizeJSON(text: string): string {
    try {
      const firstBrace = text.indexOf('{');
      const lastBrace = text.lastIndexOf('}');
      if (firstBrace === -1) return "";
      let jsonPart = lastBrace !== -1 && lastBrace > firstBrace ? text.substring(firstBrace, lastBrace + 1) : text.substring(firstBrace);
      jsonPart = jsonPart.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      jsonPart = jsonPart.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1');
      jsonPart = jsonPart.replace(/,\s*([}\]])/g, '$1');
      let openBraces = (jsonPart.match(/\{/g) || []).length;
      let closeBraces = (jsonPart.match(/\}/g) || []).length;
      let openBrackets = (jsonPart.match(/\[/g) || []).length;
      let closeBrackets = (jsonPart.match(/\]/g) || []).length;
      while (openBrackets > closeBrackets) { jsonPart += ']'; closeBrackets++; }
      while (openBraces > closeBraces) { jsonPart += '}'; closeBraces++; }
      return jsonPart;
    } catch (e) { return ""; }
  }

  private async withRetry<T>(fn: () => Promise<T>, retries = 2, delay = 2000): Promise<T> {
    try { return await fn(); } catch (error: any) {
      if ((error.message?.includes('500') || error.status === 500) && retries > 0) {
        await new Promise(r => setTimeout(r, delay));
        return this.withRetry(fn, retries - 1, delay * 2);
      }
      throw error;
    }
  }

  async fetchLeads(location: string, radius: number, categories: string[], modelName: string = "gemini-2.5-flash", thinkingBudget: number = 0, persona: StrategyPersona = StrategyPersona.STANDARD, customLogic: string = ""): Promise<LeadSearchResult> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const personaInstruction = persona === StrategyPersona.SALES ? "High-urgency, revenue focus." : persona === StrategyPersona.CONSULTATIVE ? "Empathetic, operational focus." : "Professional, technical focus.";
    const prompt = `Act as the Ultra-High-End Lead Intelligence Engine. Search: ${location}, Bangladesh. Radius: ${radius}km. Verticals: ${categories.join(", ")}. Persona: ${persona}. ${personaInstruction} ${customLogic ? `DIRECTIVE: ${customLogic}` : ''} Find 5-7 real businesses using Google Maps. Return valid JSON with leads and analysis. Leads must include scoreBreakdown, outreachScripts, and whyNeedsRizqBook.`;
    return this.withRetry(async () => {
      const response = await ai.models.generateContent({ model: modelName, contents: prompt, config: { tools: [{ googleMaps: {} }], thinkingConfig: { thinkingBudget: thinkingBudget } } });
      const cleanedJson = this.sanitizeJSON(response.text || "");
      if (!cleanedJson) throw new Error("AI returned empty content.");
      const data = JSON.parse(cleanedJson);
      const sources: GroundingSource[] = (response.candidates?.[0]?.groundingMetadata?.groundingChunks || []).filter((c: any) => c.maps).map((c: any) => ({ title: c.maps.title, uri: c.maps.uri, reviewSnippets: c.maps.placeAnswerSources?.reviewSnippets?.map((s: any) => s.text) }));
      data.leads = (data.leads || []).map((l: any, i: number) => ({ ...l, id: l.id || `l-${Date.now()}-${i}`, status: LeadStatus.NEW, savedAt: Date.now(), sourceUri: sources.find(s => s.title?.includes(l.businessName))?.uri || l.sourceUri }));
      return { leads: data.leads, analysis: data.analysis, sources };
    });
  }

  async chatWithMarket(message: string, currentLeads: Lead[], analysis: any): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const context = `You are the RizqBook Market Strategist. DATA: ${currentLeads.length} leads found. Analysis: ${JSON.stringify(analysis)}. LEADS SUMMARY: ${currentLeads.slice(0, 5).map(l => `${l.businessName} (${l.category})`).join(", ")}. Question: ${message}`;
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: context
    });
    return response.text || "I'm processing the data, please try again.";
  }

  async deepAnalyzeLead(lead: Lead): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Perform DEEP STRATEGIC ANALYSIS for this specific business: ${lead.businessName} (${lead.category}) in ${lead.city}. Reviews: ${lead.totalReviews}. Current Booking: ${lead.bookingMethod}. Analyze why they are falling behind competitors and provide a 12-month ROI projection if they switch to RizqBook. Use high-end business consultant tone.`;
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: { thinkingConfig: { thinkingBudget: 12000 } }
    });
    return response.text || "Analysis unavailable.";
  }
}

export const geminiService = new GeminiService();