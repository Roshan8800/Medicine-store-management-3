import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface AIResponse {
  success: boolean;
  data?: unknown;
  error?: string;
}

export async function predictDemand(medicineHistory: { name: string; sales: number[] }[]): Promise<AIResponse> {
  try {
    const prompt = `You are a pharmacy demand prediction AI. Analyze these medicine sales patterns and predict next month's demand.
    
Medicine sales history (last 6 months):
${medicineHistory.map(m => `${m.name}: ${m.sales.join(', ')}`).join('\n')}

Provide predictions in JSON format:
{"predictions": [{"name": "medicine_name", "predicted_demand": number, "confidence": number, "trend": "increasing"|"decreasing"|"stable"}]}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const text = response.text || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return { success: true, data: JSON.parse(jsonMatch[0]) };
    }
    return { success: false, error: "Failed to parse response" };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function checkDrugInteractions(drugs: string[]): Promise<AIResponse> {
  try {
    const prompt = `You are a pharmacist AI assistant. Check for potential drug interactions between these medications:
${drugs.join(', ')}

Provide your analysis in JSON format:
{"interactions": [{"drugs": ["drug1", "drug2"], "severity": "high"|"moderate"|"low", "description": "explanation", "recommendation": "action to take"}], "safe": boolean}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const text = response.text || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return { success: true, data: JSON.parse(jsonMatch[0]) };
    }
    return { success: false, error: "Failed to parse response" };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function suggestAlternatives(medicine: string, reason: string): Promise<AIResponse> {
  try {
    const prompt = `You are a pharmacist AI. Suggest alternative medications for:
Medicine: ${medicine}
Reason for alternative needed: ${reason}

Provide alternatives in JSON format:
{"alternatives": [{"name": "medicine_name", "generic_name": "generic", "reason": "why suitable", "considerations": "important notes"}]}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const text = response.text || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return { success: true, data: JSON.parse(jsonMatch[0]) };
    }
    return { success: false, error: "Failed to parse response" };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function optimizePricing(medicines: { name: string; cost: number; currentPrice: number; salesVolume: number }[]): Promise<AIResponse> {
  try {
    const prompt = `You are a pharmacy pricing optimization AI. Analyze these medicines and suggest optimal pricing:
${medicines.map(m => `${m.name}: Cost Rs${m.cost}, Current Price Rs${m.currentPrice}, Monthly Sales: ${m.salesVolume}`).join('\n')}

Consider profit margins, competition, and demand elasticity. Provide in JSON format:
{"recommendations": [{"name": "medicine_name", "suggested_price": number, "expected_profit_change": "percentage", "reasoning": "explanation"}]}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const text = response.text || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return { success: true, data: JSON.parse(jsonMatch[0]) };
    }
    return { success: false, error: "Failed to parse response" };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function smartSearch(query: string, context: string): Promise<AIResponse> {
  try {
    const prompt = `You are a pharmacy assistant AI. Help find medicines based on this query:
Query: "${query}"
Available context: ${context}

Understand natural language queries like "medicine for headache", "paracetamol alternatives", etc.
Provide in JSON format:
{"results": [{"suggestion": "medicine name or category", "relevance": "high"|"medium"|"low", "reason": "why relevant"}], "clarification_needed": boolean, "clarification_question": "optional question if needed"}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const text = response.text || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return { success: true, data: JSON.parse(jsonMatch[0]) };
    }
    return { success: false, error: "Failed to parse response" };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function generateSalesInsights(salesData: { date: string; amount: number; items: number }[]): Promise<AIResponse> {
  try {
    const prompt = `You are a business analytics AI. Analyze this pharmacy sales data and provide insights:
${salesData.map(s => `${s.date}: Rs${s.amount} (${s.items} items)`).join('\n')}

Provide comprehensive insights in JSON format:
{"insights": [{"title": "insight title", "description": "detailed explanation", "type": "trend"|"anomaly"|"opportunity"|"warning", "actionable": "recommended action"}], "summary": "brief overall summary", "key_metrics": {"average_daily_sales": number, "peak_day": "day name", "growth_trend": "percentage"}}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const text = response.text || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return { success: true, data: JSON.parse(jsonMatch[0]) };
    }
    return { success: false, error: "Failed to parse response" };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function analyzePrescription(prescriptionText: string): Promise<AIResponse> {
  try {
    const prompt = `You are a pharmacy prescription analysis AI. Analyze this prescription:
"${prescriptionText}"

Extract and validate the prescription details. Provide in JSON format:
{"medications": [{"name": "drug name", "dosage": "dosage", "frequency": "how often", "duration": "how long", "quantity_needed": number}], "warnings": ["any warnings"], "is_valid": boolean, "notes": "additional notes"}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const text = response.text || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return { success: true, data: JSON.parse(jsonMatch[0]) };
    }
    return { success: false, error: "Failed to parse response" };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function predictExpiryRisk(batches: { medicine: string; quantity: number; expiryDate: string; averageSales: number }[]): Promise<AIResponse> {
  try {
    const prompt = `You are an inventory management AI. Analyze these medicine batches for expiry risk:
${batches.map(b => `${b.medicine}: ${b.quantity} units, Expires: ${b.expiryDate}, Avg Monthly Sales: ${b.averageSales}`).join('\n')}

Predict which will expire before being sold. Provide in JSON format:
{"risk_assessment": [{"medicine": "name", "risk_level": "high"|"medium"|"low", "units_at_risk": number, "recommendation": "suggested action", "days_until_expiry": number, "projected_remaining": number}], "total_value_at_risk": number}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const text = response.text || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return { success: true, data: JSON.parse(jsonMatch[0]) };
    }
    return { success: false, error: "Failed to parse response" };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function generateCustomerInsights(customerData: { name: string; purchases: number; lastVisit: string; totalSpent: number }[]): Promise<AIResponse> {
  try {
    const prompt = `You are a customer analytics AI. Analyze these pharmacy customers:
${customerData.map(c => `${c.name}: ${c.purchases} purchases, Last Visit: ${c.lastVisit}, Total: Rs${c.totalSpent}`).join('\n')}

Provide customer insights in JSON format:
{"segments": [{"segment": "loyal"|"occasional"|"at_risk"|"new", "customers": ["names"], "characteristics": "description"}], "retention_recommendations": ["suggestions"], "vip_customers": ["top customer names"]}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const text = response.text || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return { success: true, data: JSON.parse(jsonMatch[0]) };
    }
    return { success: false, error: "Failed to parse response" };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function chatWithAI(message: string, context: string): Promise<AIResponse> {
  try {
    const prompt = `You are Binayak Pharmacy's AI assistant. Help with pharmacy-related queries.

Context about the pharmacy:
${context}

User message: "${message}"

Provide a helpful, professional response. If asked about specific medicines or health advice, always recommend consulting a healthcare professional for personalized advice.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return { success: true, data: { response: response.text || "I couldn't generate a response." } };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function summarizeInventoryStatus(inventory: { category: string; items: number; lowStock: number; expiring: number }[]): Promise<AIResponse> {
  try {
    const prompt = `You are an inventory analyst AI. Summarize this pharmacy inventory status:
${inventory.map(i => `${i.category}: ${i.items} items, ${i.lowStock} low stock, ${i.expiring} expiring soon`).join('\n')}

Provide a concise executive summary in JSON format:
{"summary": "2-3 sentence overview", "urgent_actions": ["list of immediate actions needed"], "health_score": number (0-100), "key_concerns": ["top concerns"], "positive_notes": ["what's going well"]}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const text = response.text || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return { success: true, data: JSON.parse(jsonMatch[0]) };
    }
    return { success: false, error: "Failed to parse response" };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
