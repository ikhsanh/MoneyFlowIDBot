/**
 * OpenAI-Compatible AI Service (menggunakan Groq — Free Tier)
 * MoneyFlowID Bot
 *
 * Groq menyediakan akses gratis ke model Llama & Gemma
 * dengan performa tinggi (LPU inference).
 * Daftar API key gratis di: https://console.groq.com/keys
 */

require('dotenv').config();
const OpenAI = require('openai');

let groqClient = null;

function getClient() {
  if (!groqClient) {
    groqClient = new OpenAI({
      apiKey: process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY,
      baseURL: process.env.GROQ_API_KEY
        ? 'https://api.groq.com/openai/v1'
        : undefined, // fallback ke OpenAI jika tidak ada GROQ_API_KEY
    });
  }
  return groqClient;
}

// Model fallback list — prioritas Groq (gratis)
const MODELS = [
  process.env.GROQ_MODEL || process.env.OPENAI_MODEL,
  'llama-3.3-70b-versatile',   // Groq — cepat & pintar
  'llama3-8b-8192',             // Groq — sangat cepat
  'gemma2-9b-it',               // Groq — alternatif
].filter(Boolean);

async function executeWithFallback(messages, options = {}) {
  let lastError = null;
  const uniqueModels = [...new Set(MODELS)];
  for (const modelName of uniqueModels) {
    try {
      const client = getClient();
      const response = await client.chat.completions.create({
        model: modelName,
        messages,
        max_tokens: options.maxTokens || 1000,
        temperature: options.temperature !== undefined ? options.temperature : 0.3,
        ...options.extra,
      });
      return response.choices[0].message.content;
    } catch (err) {
      lastError = err;
      const errMsg = err.message || String(err);
      console.warn(`[OpenAI Fallback] Model ${modelName} failed: ${errMsg.split('\n')[0]}. Trying next...`);
    }
  }
  throw lastError || new Error('All fallback OpenAI models failed.');
}

// =============================================
// TRANSACTION PARSER
// =============================================

/**
 * Parse pesan natural language menjadi transaksi terstruktur
 * @param {string} message - Pesan pengguna
 * @param {Object} userCtx - Konteks user (akun, kategori, sumber income)
 * @param {string} lang - Bahasa ('id' | 'en')
 * @returns {Object|null} - Transaksi terstruktur atau null jika bukan transaksi
 */
async function parseTransaction(message, userCtx, lang = 'id') {
  const { accounts = [], spendingCategories = [], incomeSources = [] } = userCtx;

  const accountNames = accounts.map((a) => a.name).join(', ');
  const categoryNames = spendingCategories.map((c) => c.name).join(', ');
  const sourceNames = incomeSources.map((s) => s.name).join(', ');

  const systemPrompt = `You are a financial transaction parser for an Indonesian personal finance bot.

Available data:
- Accounts/Wallets: ${accountNames || 'Cash, BCA, Gopay'}
- Spending Categories: ${categoryNames || 'Makan/Minum, Transport, Belanja'}
- Income Sources: ${sourceNames || 'Gaji, Freelance'}

Your task: Determine if the user message contains a financial transaction.

Rules:
1. If it IS a regular income or expense (paid with own money/account), return JSON:
{
  "isTransaction": true,
  "type": "income" or "expense",
  "amount": <number in IDR, parse: "25rb"=25000, "100k"=100000, "1jt"=1000000, "1.5jt"=1500000>,
  "category": "<best matching category from the list above>",
  "account": "<best matching account from the list above, or 'Cash' if unclear>",
  "note": "<brief description of the transaction>",
  "confidence": <0.0 to 1.0>
}

2. If it is a TRANSFER BETWEEN ACCOUNTS (moving money between two accounts in the list), return JSON:
{
  "isTransaction": true,
  "type": "transfer",
  "amount": <number in IDR>,
  "dari": "<source account — must be from the accounts list>",
  "ke": "<destination account — must be from the accounts list>",
  "note": "<brief description>",
  "confidence": <0.0 to 1.0>
}
Use this ONLY when BOTH source AND destination are account names from the available list.
Examples:
- "tarik tunai BCA 100k" → type: "transfer", dari: "BCA", ke: "Cash"
- "pindah saldo gopay ke bca 200k" → type: "transfer", dari: "Gopay", ke: "BCA"
- "tf 100k bca ke cash" → type: "transfer", dari: "BCA", ke: "Cash"

3. If it is SENDING MONEY / PAYING TO A PERSON (destination is a person name, NOT in accounts list), treat as EXPENSE:
{
  "isTransaction": true,
  "type": "expense",
  "amount": <number in IDR>,
  "account": "<source account from accounts list>",
  "category": "Transfer",
  "note": "<description, e.g. 'Transfer ke [person name]'>",
  "confidence": <0.0 to 1.0>
}
Examples:
- "tf 100k gopay ke doni" → type: "expense", account: "Gopay", category: "Transfer", note: "Transfer ke Doni"
- "kirim 50k ke budi dari bca" → type: "expense", account: "BCA", category: "Transfer", note: "Kirim ke Budi"
- "bayar doni 200k" → type: "expense", account: "Cash", category: "Transfer", note: "Bayar Doni"

4. If it involves PAYLATER / CICILAN / KREDIT (bought using credit, installment, or paylater service), return JSON:
{
  "isTransaction": true,
  "type": "paylater",
  "amount": <number in IDR — total price, NOT monthly installment>,
  "creditor": "<paylater service name, e.g. 'SPayLater', 'Kredivo', 'Akulaku', 'GoPay Later', 'Shopee Paylater', 'Traveloka PayLater', or general 'Paylater' if unclear>",
  "category": "<best matching spending category from the list above>",
  "note": "<brief description of what was bought>",
  "confidence": <0.0 to 1.0>
}
Paylater keywords: paylater, pay later, spaylater, kredivo, akulaku, cicilan, nyicil, kredit, gopaylater, gopay later, traveloka paylater, shopee paylater, pinjaman, DP, tempo
Examples:
- "beli mini pc 2jt pake spaylater" → type: "paylater", creditor: "SPayLater", amount: 2000000, note: "Beli Mini PC"
- "beli hp 3jt cicilan kredivo" → type: "paylater", creditor: "Kredivo", amount: 3000000, note: "Beli HP"
- "nyicil laptop 5jt akulaku" → type: "paylater", creditor: "Akulaku", amount: 5000000, note: "Cicilan Laptop"
- "beli tv 4jt kredit" → type: "paylater", creditor: "Paylater/Kredit", amount: 4000000, note: "Beli TV"

5. If it is NOT a transaction (question, greeting, advice, etc.), return:
{
  "isTransaction": false,
  "response": "<helpful response in ${lang === 'id' ? 'Bahasa Indonesia' : 'English'}>"
}

Key decision logic:
- STEP 1: Check for paylater/cicilan/kredit keywords → if found, use rule 4
- STEP 2: Identify source account (from accounts list, case-insensitive)
- STEP 3: Identify destination — is it an account name OR a person name?
  - If destination IS in accounts list → type: "transfer"
  - If destination is a PERSON NAME (not in list) → type: "expense", category: "Transfer"
  - If no clear destination → use context to determine income/expense

Amount abbreviations: rb/ribu=×1000, jt/juta=×1000000, k=×1000
Indonesian expense words: beli, bayar, makan, jajan, bensin, tagihan
Indonesian income words: terima, dapat, gaji, bayaran, pemasukan, masuk
Return ONLY valid JSON, no markdown, no explanation.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: message },
  ];

  try {
    const text = await executeWithFallback(messages, { maxTokens: 300, temperature: 0.1 });

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { isTransaction: false, response: text };

    const parsed = JSON.parse(jsonMatch[0]);
    return parsed;
  } catch (err) {
    const msg = err.message || '';
    if (msg.includes('429') || msg.includes('quota') || msg.includes('Too Many Requests') || msg.includes('Rate limit')) {
      return {
        isTransaction: false,
        response: lang === 'id'
          ? '⚠️ AI sedang overload, coba lagi dalam beberapa menit ya!'
          : '⚠️ AI is currently overloaded, please try again in a few minutes!'
      };
    }
    console.error('OpenAI parseTransaction error:', msg.split('\n')[0]);
    return null;
  }
}

// =============================================
// FINANCIAL INSIGHT
// =============================================

/**
 * Generate insight keuangan dari data transaksi
 * @param {Array} transactions - Array transaksi bulan ini
 * @param {Array} accounts - Array akun dengan saldo
 * @param {Array} bills - Array tagihan
 * @param {string} lang - Bahasa
 * @returns {string} - Insight text
 */
async function generateInsight(transactions, accounts, bills, lang = 'id') {
  const totalIncome = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const savings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.round((savings / totalIncome) * 100) : 0;

  // Top kategori pengeluaran
  const expenseByCategory = {};
  transactions.filter((t) => t.type === 'expense').forEach((t) => {
    expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount;
  });
  const topCategories = Object.entries(expenseByCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([cat, amt]) => `${cat}: Rp ${Math.round(amt).toLocaleString('id-ID')}`)
    .join('\n');

  // Total saldo semua akun
  const totalBalance = accounts.reduce((s, a) => s + (a.balance || 0), 0);

  // Tagihan yang belum dibayar
  const unpaidBills = bills.filter((b) => !b.paidThisMonth && b.active);

  const systemPrompt = `You are MoneyFlow AI, a friendly personal finance advisor for Indonesian users.

Please provide:
1. A brief assessment of this month's financial health (1-2 sentences)
2. 2-3 specific, actionable tips based on the actual data
3. A motivational closing sentence

Language: ${lang === 'id' ? 'Bahasa Indonesia' : 'English'}
Tone: Friendly, encouraging, like a knowledgeable friend
Format: Use emoji sparingly for readability
Keep it concise (max 250 words)`;

  const userContent = `Financial summary for this month:
- Total Income: Rp ${Math.round(totalIncome).toLocaleString('id-ID')}
- Total Expense: Rp ${Math.round(totalExpense).toLocaleString('id-ID')}
- Savings: Rp ${Math.round(savings).toLocaleString('id-ID')} (${savingsRate}% savings rate)
- Total Balance across all accounts: Rp ${Math.round(totalBalance).toLocaleString('id-ID')}

Top expense categories:
${topCategories || 'No expense data'}

Unpaid bills this month: ${unpaidBills.map((b) => b.name).join(', ') || 'None'}

Transaction count: ${transactions.length}`;

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userContent },
  ];

  try {
    const text = await executeWithFallback(messages, { maxTokens: 400, temperature: 0.7 });
    return text.trim();
  } catch (err) {
    const msg = err.message || '';
    if (msg.includes('429') || msg.includes('quota') || msg.includes('Too Many Requests') || msg.includes('Rate limit')) {
      return lang === 'id'
        ? '⚠️ AI sedang overload saat ini. Coba lagi dalam beberapa menit ya!'
        : '⚠️ AI is currently overloaded. Please try again in a few minutes!';
    }
    console.error('OpenAI generateInsight error:', msg.split('\n')[0]);
    return lang === 'id'
      ? '❌ Tidak dapat menghasilkan insight saat ini. Coba lagi nanti.'
      : '❌ Could not generate insight right now. Please try again later.';
  }
}

// =============================================
// AI CHAT
// =============================================

/**
 * Chat umum dengan ChatGPT, dengan konteks keuangan user
 * @param {string} message - Pesan user
 * @param {Array} history - Chat history [{role, parts: [{text}]}] (format Gemini, akan dikonversi)
 * @param {Object} userCtx - Konteks user
 * @param {string} lang - Bahasa
 * @returns {string} - Respons AI
 */
async function chat(message, history = [], userCtx = {}, lang = 'id') {
  const { accounts = [], spendingCategories = [], incomeSources = [], bills = [] } = userCtx;

  const systemContext = `You are MoneyFlow AI, an intelligent personal finance assistant integrated into a Telegram bot called MoneyFlowID.

User's financial profile:
- Accounts: ${accounts.map((a) => `${a.name} (Rp ${Math.round(a.balance || 0).toLocaleString('id-ID')})`).join(', ') || 'Not set up'}
- Income sources: ${incomeSources.map((s) => s.name).join(', ') || 'Not set up'}
- Spending categories: ${spendingCategories.map((c) => c.name).join(', ') || 'Not set up'}
- Monthly bills: ${bills.map((b) => `${b.name} (Rp ${Math.round(b.amount || 0).toLocaleString('id-ID')})`).join(', ') || 'None'}

Guidelines:
- Respond in ${lang === 'id' ? 'Bahasa Indonesia' : 'English'}
- Be friendly, concise, and practical
- Use emoji occasionally for warmth
- If asked about recording a transaction, guide them to use the main menu buttons
- If you can't help with something, say so briefly
- Keep responses under 300 words unless asked for detailed explanation
- Format numbers in Indonesian style (e.g., Rp 1.500.000)`;

  // Konversi history dari format Gemini ke format OpenAI
  const convertedHistory = [];
  for (const entry of history) {
    if (entry.role === 'user' && entry.parts) {
      convertedHistory.push({ role: 'user', content: entry.parts.map((p) => p.text).join('') });
    } else if (entry.role === 'model' && entry.parts) {
      convertedHistory.push({ role: 'assistant', content: entry.parts.map((p) => p.text).join('') });
    } else if (entry.role === 'assistant' || entry.role === 'user') {
      convertedHistory.push(entry);
    }
  }

  const messages = [
    { role: 'system', content: systemContext },
    ...convertedHistory,
    { role: 'user', content: message },
  ];

  try {
    const text = await executeWithFallback(messages, { maxTokens: 500, temperature: 0.7 });
    return text.trim();
  } catch (err) {
    console.error('OpenAI chat error:', err.message);
    return lang === 'id'
      ? '❌ AI sedang tidak tersedia. Coba lagi dalam beberapa saat.'
      : '❌ AI is currently unavailable. Please try again in a moment.';
  }
}

/**
 * Dapatkan saran singkat untuk tagihan yang hampir jatuh tempo
 */
async function getBillReminder(billName, amount, dueDay, lang = 'id') {
  const messages = [
    {
      role: 'system',
      content: `You are a friendly finance assistant. Write reminders concisely in ${lang === 'id' ? 'Bahasa Indonesia' : 'English'}.`,
    },
    {
      role: 'user',
      content: `Write a very short (1 sentence), friendly reminder about paying the bill "${billName}" of Rp ${Math.round(amount).toLocaleString('id-ID')} due on the ${dueDay}th. Add one relevant emoji at the start.`,
    },
  ];

  try {
    const text = await executeWithFallback(messages, { maxTokens: 80, temperature: 0.7 });
    return text.trim();
  } catch {
    return lang === 'id'
      ? `📅 Jangan lupa bayar tagihan ${billName} sebesar Rp ${Math.round(amount).toLocaleString('id-ID')}!`
      : `📅 Don't forget to pay your ${billName} bill of Rp ${Math.round(amount).toLocaleString('id-ID')}!`;
  }
}

module.exports = {
  parseTransaction,
  generateInsight,
  chat,
  getBillReminder,
};
