import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SYSTEM_PROMPT = `You are FinTrack, a smart personal finance assistant. Parse the user's message and extract structured financial data.

You MUST call one of the provided tools based on what the user wants. Choose the right tool:

1. **add_transaction** — When they mention spending, earning, paying, receiving money
2. **add_bank_account** — When they mention adding a bank/savings/current/salary/cash account
3. **add_credit_card** — When they mention adding a credit card
4. **add_asset** — When they mention property, investments, vehicles, gold, stocks, mutual funds
5. **add_loan** — When they mention loans (home, car, personal, education)
6. **set_budget** — When they mention setting budget limits for categories
7. **answer_query** — When they ask about spending, income, balances, or summaries

Important rules:
- "lakh" = 100,000 and "crore" = 10,000,000 (Indian number system)
- "k" = 1,000, "m" = 1,000,000
- Default currency is INR unless specified otherwise
- For transactions, determine if it's income or expense from context
- Detect the category from context (food, groceries, transport, shopping, bills, entertainment, health, education, rent, travel, salary, freelance, investment, gift, refund, other)
- Be friendly and confirm what you understood in the message field`;

const TOOLS = [
  {
    type: "function",
    function: {
      name: "add_transaction",
      description: "Add an income or expense transaction",
      parameters: {
        type: "object",
        properties: {
          type: { type: "string", enum: ["income", "expense"] },
          amount: { type: "number" },
          currency: { type: "string", default: "INR" },
          category: { type: "string", enum: ["food", "transport", "shopping", "bills", "entertainment", "health", "education", "rent", "groceries", "travel", "salary", "freelance", "investment", "gift", "refund", "other"] },
          description: { type: "string" },
          cashback: { type: "number" },
          message: { type: "string" },
        },
        required: ["type", "amount", "currency", "category", "description", "message"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_bank_account",
      description: "Add a bank account",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          type: { type: "string", enum: ["savings", "current", "salary", "cash"] },
          balance: { type: "number" },
          currency: { type: "string", default: "INR" },
          message: { type: "string" },
        },
        required: ["name", "type", "balance", "currency", "message"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_credit_card",
      description: "Add a credit card",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          limit: { type: "number" },
          outstanding: { type: "number", default: 0 },
          currency: { type: "string", default: "INR" },
          message: { type: "string" },
        },
        required: ["name", "limit", "currency", "message"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_asset",
      description: "Add an asset",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          type: { type: "string", enum: ["property", "investment", "vehicle", "other"] },
          value: { type: "number" },
          currency: { type: "string", default: "INR" },
          message: { type: "string" },
        },
        required: ["name", "type", "value", "currency", "message"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_loan",
      description: "Add a loan",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          principal: { type: "number" },
          rate: { type: "number" },
          tenureMonths: { type: "number" },
          currency: { type: "string", default: "INR" },
          message: { type: "string" },
        },
        required: ["name", "principal", "rate", "tenureMonths", "currency", "message"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "set_budget",
      description: "Set a monthly budget goal",
      parameters: {
        type: "object",
        properties: {
          category: { type: "string", enum: ["food", "transport", "shopping", "bills", "entertainment", "health", "education", "rent", "groceries", "travel", "other"] },
          monthlyLimit: { type: "number" },
          currency: { type: "string", default: "INR" },
          message: { type: "string" },
        },
        required: ["category", "monthlyLimit", "currency", "message"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "answer_query",
      description: "Answer a financial query",
      parameters: {
        type: "object",
        properties: {
          queryType: { type: "string", enum: ["spending", "income", "balance", "summary"] },
          category: { type: "string" },
          period: { type: "string", enum: ["today", "this_week", "this_month", "this_year"] },
          message: { type: "string" },
        },
        required: ["queryType", "period", "message"],
      },
    },
  },
];

async function callOpenAI(apiKey: string, model: string, message: string) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: message },
      ],
      tools: TOOLS,
      tool_choice: "required",
    }),
  });

  if (!res.ok) throw new Error(`OpenAI error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall) return { intent: "unknown", data: {}, message: data.choices?.[0]?.message?.content ?? "I couldn't understand that." };
  const args = JSON.parse(toolCall.function.arguments);
  return { intent: toolCall.function.name, data: args, message: args.message ?? "Parsed." };
}

async function callGemini(apiKey: string, model: string, message: string) {
  const geminiTools = [{ function_declarations: TOOLS.map((t) => ({ name: t.function.name, description: t.function.description, parameters: t.function.parameters })) }];
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: "user", parts: [{ text: message }] }],
        tools: geminiTools,
        tool_config: { function_calling_config: { mode: "ANY" } },
      }),
    },
  );

  if (!res.ok) throw new Error(`Gemini error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const parts = data.candidates?.[0]?.content?.parts ?? [];
  const fnCall = parts.find((p: Record<string, unknown>) => p.functionCall);
  if (!fnCall) return { intent: "unknown", data: {}, message: parts.find((p: Record<string, unknown>) => p.text)?.text ?? "I couldn't understand that." };
  const args = (fnCall as Record<string, Record<string, Record<string, unknown>>>).functionCall.args;
  return { intent: (fnCall as Record<string, Record<string, string>>).functionCall.name, data: args, message: (args as Record<string, string>).message ?? "Parsed." };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { message, provider, model } = await req.json();
    if (!message) {
      return new Response(JSON.stringify({ error: "message is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let result;
    if (provider === "google") {
      const apiKey = Deno.env.get("GOOGLE_API_KEY");
      if (!apiKey) throw new Error("GOOGLE_API_KEY not configured");
      result = await callGemini(apiKey, model ?? "gemini-2.0-flash", message);
    } else {
      const apiKey = Deno.env.get("OPENAI_API_KEY");
      if (!apiKey) throw new Error("OPENAI_API_KEY not configured");
      result = await callOpenAI(apiKey, model ?? "gpt-4o-mini", message);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
