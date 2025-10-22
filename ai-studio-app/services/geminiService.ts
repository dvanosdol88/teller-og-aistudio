import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
const model = "gemini-2.5-flash";

export const generateFinancialSummary = async (financialData: object): Promise<string> => {
  const prompt = `You are a financial analyst for a small real estate LLC. Based on the following JSON data, provide a concise, easy-to-read summary of the LLC's current financial health in markdown format. Highlight key metrics like liquidity (cash on hand), total debt, and net asset value (Assets - Liabilities). Analyze the recent transactions for cash flow insights.
        
  Data: ${JSON.stringify(financialData)}`;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini API call failed for summary generation:", error);
    return "Sorry, I was unable to process your request for a summary at this time. Please try again later.";
  }
};


export const askAccountant = async (question: string): Promise<string> => {
    const prompt = `You are an expert real estate accountant providing advice to a small LLC owner. Answer the following question clearly and concisely in markdown format.
        
    Question: "${question}"`;

    try {
        const response = await ai.models.generateContent({
          model: model,
          contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Gemini API call failed for accountant question:", error);
        return "Sorry, I was unable to answer your question at this time. Please try again later.";
    }
}