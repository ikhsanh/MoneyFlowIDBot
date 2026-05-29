/**
 * Gemini AI Service
 * MoneyFlowID Bot
 */

require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI = null;

function getClient() {
  if (!genAI) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
}

function getModel(modelName = 'gemini-3.5-flash') {
  return getClient().getGenerativeModel({ model: modelName });
}

const MODELS = [
  process.env.GEMINI_MODEL,
  'gemini-3.5-flash',
  'gemini-2.5-flash',
  'gemini-1.5-flash',
].filter(Boolean);

async function executeWithFallback(actionFn) {
  let lastError = null;
  const uniqueModels = [...new Set(MODELS)];
  for (const modelName of uniqueModels) {
    try {
      const model = getModel(modelName);
      return await actionFn(model);
    } catch (err) {
      lastError = err;
      const errMsg = err.message || err;
      console.warn(`[Gemini Fallback] Model ${modelName} failed: ${errMsg.split('\n')[0]}. Trying next...`);
    }
  }
  throw lastError || new Error('All fallback Gemini models failed.');
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

  const prompt = `You are a financial transaction parser for an Indonesian personal finance bot.

User message: "${message}"

Available data:
- Accounts/Wallets: ${accountNames || 'Cash, BCA, Gopay'}
- Spending Categories: ${categoryNames || 'Makan/Minum, Transport, Belanja'}
- Income Sources: ${sourceNames || 'Gaji, Freelance'}

Your task: Determine if this message contains a financial transaction.

Rules:
1. If it IS a transaction, return JSON with this EXACT format:
{
  "isTransaction": true,
  "type": "income" or "expense",
  "amount": <number in IDR, parse abbreviations: "25rb"=25000, "100k"=100000, "1jt"=1000000, "1.5jt"=1500000>,
  "category": "<best matching category from the list above, or closest match>",
  "account": "<best matching account from the list above, or closest match, or 'Cash' if unclear>",
  "note": "<brief description of the transaction>",
  "confidence": <0.0 to 1.0>
}

2. If it is NOT a transaction (question, greeting, request for advice, etc.), return:
{
  "isTransaction": false,
  "response": "<helpful response in ${lang === 'id' ? 'Bahasa Indonesia' : 'English'}>"
}

Important:
- Amount abbreviations: rb/ribu=×1000, jt/juta=×1000000, k=×1000
- Common Indonesian expense words: beli, bayar, makan, jajan, bensin, tagihan, bayar, transfer
- Common income words: terima, dapat, gaji, bayaran, pemasukan, masuk
- Return ONLY valid JSON, no markdown, no explanation.`;

  try {
    const result = await executeWithFallback(async (model) => {
      return await model.generateContent(prompt);
    });
    const text = result.response.text().trim();

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { isTransaction: false, response: text };

    const parsed = JSON.parse(jsonMatch[0]);
    return parsed;
  } catch (err) {
    const msg = err.message || '';
    if (msg.includes('429') || msg.includes('quota') || msg.includes('Too Many Requests')) {
      // Quota habis — kembalikan response yang informatif, bukan null
      return {
        isTransaction: false,
        response: lang === 'id'
          ? '⚠️ AI sedang overload, coba lagi dalam beberapa menit ya!'
          : '⚠️ AI is currently overloaded, please try again in a few minutes!'
      };
    }
    console.error('Gemini parseTransaction error:', msg.split('\n')[0]);
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

  const prompt = `You are MoneyFlow AI, a friendly personal finance advisor for Indonesian users.

Financial summary for this month:
- Total Income: Rp ${Math.round(totalIncome).toLocaleString('id-ID')}
- Total Expense: Rp ${Math.round(totalExpense).toLocaleString('id-ID')}
- Savings: Rp ${Math.round(savings).toLocaleString('id-ID')} (${savingsRate}% savings rate)
- Total Balance across all accounts: Rp ${Math.round(totalBalance).toLocaleString('id-ID')}

Top expense categories:
${topCategories || 'No expense data'}

Unpaid bills this month: ${unpaidBills.map((b) => b.name).join(', ') || 'None'}

Transaction count: ${transactions.length}

Please provide:
1. A brief assessment of this month's financial health (1-2 sentences)
2. 2-3 specific, actionable tips based on the actual data
3. A motivational closing sentence

Language: ${lang === 'id' ? 'Bahasa Indonesia' : 'English'}
Tone: Friendly, encouraging, like a knowledgeable friend
Format: Use emoji sparingly for readability
Keep it concise (max 250 words)`;

  try {
    const result = await executeWithFallback(async (model) => {
      return await model.generateContent(prompt);
    });
    return result.response.text().trim();
  } catch (err) {
    const msg = err.message || '';
    if (msg.includes('429') || msg.includes('quota') || msg.includes('Too Many Requests')) {
      return lang === 'id'
        ? '⚠️ AI sedang overload saat ini. Coba lagi dalam beberapa menit ya!'
        : '⚠️ AI is currently overloaded. Please try again in a few minutes!';
    }
    console.error('Gemini generateInsight error:', msg.split('\n')[0]);
    return lang === 'id'
      ? '❌ Tidak dapat menghasilkan insight saat ini. Coba lagi nanti.'
      : '❌ Could not generate insight right now. Please try again later.';
  }
}

// =============================================
// AI CHAT
// =============================================

/**
 * Chat umum dengan Gemini, dengan konteks keuangan user
 * @param {string} message - Pesan user
 * @param {Array} history - Chat history [{role, parts: [{text}]}]
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

  try {
    const result = await executeWithFallback(async (model) => {
      const chatObj = model.startChat({
        history: history.length > 0
          ? [
            { role: 'user', parts: [{ text: systemContext }] },
            { role: 'model', parts: [{ text: 'Siap! Saya MoneyFlow AI, siap membantu keuangan Anda.' }] },
            ...history,
          ]
          : [
            { role: 'user', parts: [{ text: systemContext }] },
            { role: 'model', parts: [{ text: 'Siap! Saya MoneyFlow AI, siap membantu keuangan Anda.' }] },
          ],
        generationConfig: {
          maxOutputTokens: 500,
          temperature: 0.7,
        },
      });
      return await chatObj.sendMessage(message);
    });
    return result.response.text().trim();
  } catch (err) {
    console.error('Gemini chat error:', err.message);
    return lang === 'id'
      ? '❌ AI sedang tidak tersedia. Coba lagi dalam beberapa saat.'
      : '❌ AI is currently unavailable. Please try again in a moment.';
  }
}

/**
 * Dapatkan saran singkat untuk tagihan yang hampir jatuh tempo
 */
async function getBillReminder(billName, amount, dueDay, lang = 'id') {
  const prompt = `In ${lang === 'id' ? 'Bahasa Indonesia' : 'English'}, write a very short (1 sentence), friendly reminder about paying the bill "${billName}" of Rp ${Math.round(amount).toLocaleString('id-ID')} due on the ${dueDay}th. Add one relevant emoji at the start.`;

  try {
    const result = await executeWithFallback(async (model) => {
      return await model.generateContent(prompt);
    });
    return result.response.text().trim();
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
