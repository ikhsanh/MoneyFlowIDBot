/**
 * MoneyFlowID Bot — Entry Point
 * Bot Telegram Pencatatan Keuangan dengan Gemini AI & Google Sheets
 *
 * @author   Ikhsanh
 * @telegram @ikhsanh
 * @github   https://github.com/ikhsanh
 * @version  1.0.0
 */

require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const cron = require('node-cron');

// Services
const userStore = require('./services/userStore');
const sheets = require('./services/sheets');

// Middleware
const session = require('./middleware/session');
const { STATES } = require('./middleware/session');

// Handlers
const startHandler = require('./handlers/start');
const setupHandler = require('./handlers/setup');
const txHandler = require('./handlers/transaction');
const reportHandler = require('./handlers/report');
const budgetHandler = require('./handlers/budget');
const { mainMenuKeyboard, settingsKeyboard, languageKeyboard, otherTransactionKeyboard } = require('./handlers/menu');
const L = require('./locales');

// =============================================
// BOT INIT
// =============================================

if (!process.env.TELEGRAM_BOT_TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN tidak ditemukan di .env');
  process.exit(1);
}

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {
  polling: {
    interval: 300,
    autoStart: true,
    params: { timeout: 10 },
  },
});

console.log('🚀 MoneyFlowID Bot starting...');

// =============================================
// COMMAND HANDLERS
// =============================================

bot.onText(/\/start/, async (msg) => {
  console.log(`📨 [${new Date().toLocaleTimeString('id-ID')}] /start dari @${msg.from.username || msg.from.first_name} (${msg.from.id})`);
  try {
    await startHandler.handleStart(bot, msg);
  } catch (err) {
    console.error('/start error:', err.message);
  }
});

bot.onText(/\/menu/, async (msg) => {
  try {
    await startHandler.handleMenu(bot, msg);
  } catch (err) {
    console.error('/menu error:', err.message);
  }
});

bot.onText(/\/help/, async (msg) => {
  try {
    await startHandler.handleHelp(bot, msg);
  } catch (err) {
    console.error('/help error:', err.message);
  }
});

bot.onText(/\/income/, async (msg) => {
  try {
    if (!checkSetup(bot, msg)) return;
    await txHandler.startIncome(bot, msg.chat.id, msg.from.id);
  } catch (err) {
    console.error('/income error:', err.message);
  }
});

bot.onText(/\/expense/, async (msg) => {
  try {
    if (!checkSetup(bot, msg)) return;
    await txHandler.startExpense(bot, msg.chat.id, msg.from.id);
  } catch (err) {
    console.error('/expense error:', err.message);
  }
});

bot.onText(/\/balance/, async (msg) => {
  try {
    if (!checkSetup(bot, msg)) return;
    await reportHandler.showBalance(bot, msg.chat.id, msg.from.id);
  } catch (err) {
    console.error('/balance error:', err.message);
  }
});

bot.onText(/\/report/, async (msg) => {
  try {
    if (!checkSetup(bot, msg)) return;
    await reportHandler.showReportMenu(bot, msg.chat.id, msg.from.id);
  } catch (err) {
    console.error('/report error:', err.message);
  }
});

bot.onText(/\/bills/, async (msg) => {
  try {
    if (!checkSetup(bot, msg)) return;
    await reportHandler.showBillsStatus(bot, msg.chat.id, msg.from.id);
  } catch (err) {
    console.error('/bills error:', err.message);
  }
});

bot.onText(/\/ai/, async (msg) => {
  try {
    if (!checkSetup(bot, msg)) return;
    await reportHandler.startAiChat(bot, msg.chat.id, msg.from.id);
  } catch (err) {
    console.error('/ai error:', err.message);
  }
});

bot.onText(/\/settings/, async (msg) => {
  try {
    if (!checkSetup(bot, msg)) return;
    const user = userStore.getUser(msg.from.id);
    session.setState(msg.from.id, STATES.SETTINGS_MENU);
    await bot.sendMessage(msg.chat.id, L(user.lang).settingsTitle, {
      parse_mode: 'Markdown',
      reply_markup: settingsKeyboard(user.lang),
    });
  } catch (err) {
    console.error('/settings error:', err.message);
  }
});

bot.onText(/\/budget/, async (msg) => {
  console.log(`📨 [${new Date().toLocaleTimeString('id-ID')}] /budget dari @${msg.from.username || msg.from.first_name} (${msg.from.id})`);
  try {
    if (!checkSetup(bot, msg)) return;
    await budgetHandler.showBudgetMenu(bot, msg.chat.id, msg.from.id);
  } catch (err) {
    console.error('/budget error:', err.message);
  }
});

// =============================================
// MESSAGE HANDLER (text input untuk conversation flow)
// =============================================

bot.on('message', async (msg) => {
  if (!msg.text || msg.text.startsWith('/')) return;

  const userId = msg.from.id;
  const chatId = msg.chat.id;
  const state = session.getState(userId);

  // Log semua pesan masuk untuk monitoring
  console.log(`📨 [${new Date().toLocaleTimeString('id-ID')}] Pesan dari @${msg.from.username || msg.from.first_name} (${userId}): "${msg.text.substring(0, 60)}" [state: ${state}]`);

  try {
    switch (state) {
      // --- Onboarding ---
      case STATES.ONBOARD_SHEET:
        await startHandler.handleSpreadsheetId(bot, msg);
        break;

      // --- Setup Income ---
      case STATES.SETUP_INCOME_ADDING:
        await setupHandler.handleIncomeAddText(bot, msg, false);
        break;

      // --- Setup Account ---
      case STATES.SETUP_ACCT_BALANCE:
        await setupHandler.handleAccountBalance(bot, msg, false);
        break;

      case STATES.SETUP_ACCT_CUSTOM_NAME:
        await setupHandler.handleAccountCustomName(bot, msg, false);
        break;

      // --- Setup Spending ---
      case STATES.SETUP_SPENDING_ADDING:
        await setupHandler.handleSpendingAddText(bot, msg, false);
        break;

      // --- Setup Bills ---
      case STATES.SETUP_BILL_NAME:
        await setupHandler.handleBillName(bot, msg);
        break;

      case STATES.SETUP_BILL_AMOUNT:
        await setupHandler.handleBillAmount(bot, msg);
        break;

      case STATES.SETUP_BILL_DUE:
        await setupHandler.handleBillDue(bot, msg);
        break;

      // --- Income Transaction ---
      case STATES.INCOME_AMOUNT:
        await txHandler.handleIncomeAmount(bot, msg);
        break;

      case STATES.INCOME_NAME:
        await txHandler.handleIncomeName(bot, msg);
        break;

      // --- Expense Transaction ---
      case STATES.EXPENSE_AMOUNT:
        await txHandler.handleExpenseAmount(bot, msg);
        break;

      case STATES.EXPENSE_NAME:
        await txHandler.handleExpenseName(bot, msg);
        break;

      // --- Transfer ---
      case STATES.TRANSFER_AMOUNT:
        await txHandler.handleTransferAmount(bot, msg);
        break;

      case STATES.TRANSFER_NAME:
        await txHandler.handleTransferName(bot, msg);
        break;

      // --- Piutang Baru ---
      case STATES.PIUTANG_NAME:
        await txHandler.handlePiutangName(bot, msg);
        break;

      case STATES.PIUTANG_AMOUNT:
        await txHandler.handlePiutangAmount(bot, msg);
        break;

      case STATES.PIUTANG_TX_NAME:
        await txHandler.handlePiutangTxName(bot, msg);
        break;

      // --- Pelunasan Piutang ---
      case STATES.LUNASPIU_NAME:
        await txHandler.handleLunasPiutangName(bot, msg);
        break;

      case STATES.LUNASPIU_AMOUNT:
        await txHandler.handleLunasPiutangAmount(bot, msg);
        break;

      // --- Utang Baru ---
      case STATES.UTANG_NAME:
        await txHandler.handleUtangName(bot, msg);
        break;

      case STATES.UTANG_AMOUNT:
        await txHandler.handleUtangAmount(bot, msg);
        break;

      case STATES.UTANG_TX_NAME:
        await txHandler.handleUtangTxName(bot, msg);
        break;

      // --- Pelunasan Utang ---
      case STATES.LUNASUTANG_NAME:
        await txHandler.handleLunasUtangName(bot, msg);
        break;

      case STATES.LUNASUTANG_AMOUNT:
        await txHandler.handleLunasUtangAmount(bot, msg);
        break;

      // --- Settings (sama dengan setup tapi isSettings=true) ---
      case STATES.SETTINGS_INCOME_ADDING:
        await setupHandler.handleIncomeAddText(bot, msg, true);
        break;

      case STATES.SETTINGS_ACCT_BALANCE:
        await setupHandler.handleAccountBalance(bot, msg, true);
        break;

      case STATES.SETTINGS_SPENDING_ADDING:
        await setupHandler.handleSpendingAddText(bot, msg, true);
        break;

      case STATES.SETTINGS_BILL_NAME:
        await setupHandler.handleBillName(bot, msg);
        break;

      case STATES.SETTINGS_BILL_AMOUNT:
        await setupHandler.handleBillAmount(bot, msg);
        break;

      case STATES.SETTINGS_BILL_DUE:
        await setupHandler.handleBillDue(bot, msg);
        break;

      // --- Budget ---
      case STATES.BUDGET_AMOUNT:
        await budgetHandler.handleBudgetAmount(bot, msg);
        break;

      // --- AI Chat ---
      case STATES.AI_CHAT:
        await reportHandler.handleAiMessage(bot, msg);
        break;

      // --- IDLE (auto AI parsing) ---
      case STATES.IDLE:
      default: {
        const user = userStore.getUser(userId);
        if (!user || !user.setupComplete) break;

        // Di IDLE, coba parse sebagai transaksi natural language
        const IDLE_KEYWORDS = /[0-9]|rb|ribu|jt|juta|beli|bayar|makan|dapat|gaji|terima|income|expense|belanja/i;
        if (IDLE_KEYWORDS.test(msg.text)) {
          // Aktifkan AI chat SEMENTARA, proses pesan, lalu kembali ke IDLE
          session.setState(userId, STATES.AI_CHAT);
          await reportHandler.handleAiMessage(bot, msg);
          // Setelah handleAiMessage selesai: jika bukan transaksi (response langsung),
          // kembalikan ke IDLE agar tombol keyboard tidak terus aktif
          const currentState = session.getState(userId);
          if (currentState === STATES.AI_CHAT) {
            // AI tidak set state baru (bukan AI_CONFIRM_TRANSACTION), balik ke IDLE
            session.setState(userId, STATES.IDLE);
          }
        }
        break;
      }

    }
  } catch (err) {
    console.error(`Message handler error (state: ${state}):`, err.message);
    const user = userStore.getUser(userId);
    const t = L(user ? user.lang : 'id');
    try {
      await bot.sendMessage(chatId, t.processingError, { parse_mode: 'Markdown' });
    } catch {}
  }
});

// =============================================
// CALLBACK QUERY HANDLER
// =============================================

bot.on('callback_query', async (callbackQuery) => {
  const userId = callbackQuery.from.id;
  const chatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data;

  const user = userStore.getUser(userId);
  const lang = user ? user.lang : 'id';
  const t = L(lang);

  try {
    // ========================
    // LANGUAGE SELECTION
    // ========================
    if (data.startsWith('lang:')) {
      const selectedLang = data.split(':')[1];
      await startHandler.handleLanguageSelect(bot, callbackQuery, selectedLang);
      return;
    }

    // ========================
    // MAIN MENU
    // ========================
    if (data === 'menu:main') {
      session.clearSession(userId);
      await bot.answerCallbackQuery(callbackQuery.id);
      await bot.editMessageText(t.mainMenu, {
        chat_id: chatId,
        message_id: callbackQuery.message.message_id,
        parse_mode: 'Markdown',
        reply_markup: mainMenuKeyboard(lang),
      }).catch(() => bot.sendMessage(chatId, t.mainMenu, {
        parse_mode: 'Markdown',
        reply_markup: mainMenuKeyboard(lang),
      }));
      return;
    }

    if (data === 'menu:transfer') {
      await bot.answerCallbackQuery(callbackQuery.id);
      await txHandler.startTransfer(bot, chatId, userId);
      return;
    }

    if (data === 'menu:other') {
      await bot.answerCallbackQuery(callbackQuery.id);
      const t2 = L(lang);
      await bot.sendMessage(chatId, t2.cashflowTitle, {
        parse_mode: 'Markdown',
        reply_markup: otherTransactionKeyboard(lang),
      });
      return;
    }

    if (data === 'menu:pay_bills') {
      await bot.answerCallbackQuery(callbackQuery.id);
      await txHandler.startBillPayment(bot, chatId, userId);
      return;
    }

    if (data === 'menu:piutang_baru') {
      await bot.answerCallbackQuery(callbackQuery.id);
      await txHandler.startPiutangBaru(bot, chatId, userId);
      return;
    }

    if (data === 'menu:lunas_piutang') {
      await bot.answerCallbackQuery(callbackQuery.id);
      await txHandler.startLunasPiutang(bot, chatId, userId);
      return;
    }

    if (data === 'menu:utang_baru') {
      await bot.answerCallbackQuery(callbackQuery.id);
      await txHandler.startUtangBaru(bot, chatId, userId);
      return;
    }

    if (data === 'menu:lunas_utang') {
      await bot.answerCallbackQuery(callbackQuery.id);
      await txHandler.startLunasUtang(bot, chatId, userId);
      return;
    }

    if (data === 'menu:income') {
      await bot.answerCallbackQuery(callbackQuery.id);
      await txHandler.startIncome(bot, chatId, userId);
      return;
    }

    if (data === 'menu:expense') {
      await bot.answerCallbackQuery(callbackQuery.id);
      await txHandler.startExpense(bot, chatId, userId);
      return;
    }

    if (data === 'menu:report') {
      await bot.answerCallbackQuery(callbackQuery.id);
      await reportHandler.showReportMenu(bot, chatId, userId);
      return;
    }

    if (data === 'menu:balance') {
      await bot.answerCallbackQuery(callbackQuery.id);
      await reportHandler.showBalance(bot, chatId, userId);
      return;
    }

    if (data === 'menu:ai') {
      await bot.answerCallbackQuery(callbackQuery.id);
      await reportHandler.startAiChat(bot, chatId, userId);
      return;
    }

    if (data === 'menu:bills') {
      await bot.answerCallbackQuery(callbackQuery.id);
      await reportHandler.showBillsStatus(bot, chatId, userId);
      return;
    }

    if (data === 'menu:settings') {
      await bot.answerCallbackQuery(callbackQuery.id);
      session.setState(userId, STATES.SETTINGS_MENU);
      await bot.sendMessage(chatId, t.settingsTitle, {
        parse_mode: 'Markdown',
        reply_markup: settingsKeyboard(lang),
      });
      return;
    }

    // ========================
    // REPORT CALLBACKS
    // ========================
    if (data.startsWith('report:')) {
      const action = data.split(':')[1];
      await bot.answerCallbackQuery(callbackQuery.id);
      switch (action) {
        case 'monthly': await reportHandler.showMonthlyReport(bot, chatId, userId); break;
        case 'category': await reportHandler.showCategoryReport(bot, chatId, userId); break;
        case 'balance': await reportHandler.showBalance(bot, chatId, userId); break;
        case 'bills': await reportHandler.showBillsStatus(bot, chatId, userId); break;
        case 'insight': await reportHandler.showAiInsight(bot, chatId, userId); break;
      }
      return;
    }

    // ========================
    // SETUP - INCOME
    // ========================
    if (data.startsWith('setup_income:')) {
      const parts = data.split(':');
      const action = parts[1];
      const param = parts.slice(2).join(':');

      if (action === 'toggle') {
        await setupHandler.handleIncomeToggle(bot, callbackQuery, param, false);
      } else if (action === 'remove') {
        await setupHandler.handleIncomeToggle(bot, callbackQuery, param, false);
      } else if (action === 'add') {
        session.setState(userId, STATES.SETUP_INCOME_ADDING);
        await setupHandler.handleIncomeAddPrompt(bot, callbackQuery);
      } else if (action === 'done') {
        await setupHandler.handleIncomeDone(bot, callbackQuery, false);
      }
      return;
    }

    // ========================
    // SETUP - ACCOUNTS
    // ========================
    if (data.startsWith('setup_acct:')) {
      const parts = data.split(':');
      const action = parts[1];
      const param = parts.slice(2).join(':');

      if (action === 'toggle') {
        await setupHandler.handleAccountToggle(bot, callbackQuery, param, false);
      } else if (action === 'remove') {
        await setupHandler.handleAccountToggle(bot, callbackQuery, param, false);
      } else if (action === 'add_custom') {
        await setupHandler.handleAccountCustomPrompt(bot, callbackQuery, false);
      } else if (action === 'done') {
        await setupHandler.handleAccountsDone(bot, callbackQuery, false);
      }
      return;
    }

    // ========================
    // SETUP - SPENDING
    // ========================
    if (data.startsWith('setup_spending:')) {
      const parts = data.split(':');
      const action = parts[1];
      const param = parts.slice(2).join(':');

      if (action === 'toggle') {
        await setupHandler.handleSpendingToggle(bot, callbackQuery, param, false);
      } else if (action === 'remove') {
        await setupHandler.handleSpendingToggle(bot, callbackQuery, param, false);
      } else if (action === 'add') {
        await setupHandler.handleSpendingAddPrompt(bot, callbackQuery);
      } else if (action === 'done') {
        await setupHandler.handleSpendingDone(bot, callbackQuery, false);
      }
      return;
    }

    // ========================
    // SETUP - BILLS
    // ========================
    if (data.startsWith('setup_bill:')) {
      const parts = data.split(':');
      const action = parts[1];
      const param = parts.slice(2).join(':');

      if (action === 'add') {
        await setupHandler.handleBillAddPrompt(bot, callbackQuery);
      } else if (action === 'remove') {
        await setupHandler.handleBillRemove(bot, callbackQuery, param);
      } else if (action === 'done') {
        const state = session.getState(userId);
        const isSettings = state === STATES.SETTINGS_BILLS_MENU;
        await setupHandler.handleBillsDone(bot, callbackQuery, isSettings);
      }
      return;
    }

    // ========================
    // BILL ACCOUNT SELECTION (during setup)
    // ========================
    if (data.startsWith('bill_acct:')) {
      const accountName = data.split(':').slice(1).join(':');
      await setupHandler.handleBillAccount(bot, callbackQuery, accountName);
      return;
    }

    // ========================
    // INCOME TRANSACTION
    // ========================
    if (data.startsWith('income_src:')) {
      const sourceName = data.split(':').slice(1).join(':');
      await txHandler.handleIncomeSource(bot, callbackQuery, sourceName);
      return;
    }

    if (data.startsWith('income_acct:')) {
      const accountName = data.split(':').slice(1).join(':');
      await txHandler.handleIncomeAccount(bot, callbackQuery, accountName);
      return;
    }

    if (data === 'income:confirm') {
      await txHandler.handleIncomeConfirm(bot, callbackQuery);
      return;
    }

    // ========================
    // EXPENSE TRANSACTION
    // ========================
    if (data.startsWith('expense_cat:')) {
      const categoryName = data.split(':').slice(1).join(':');
      await txHandler.handleExpenseCategory(bot, callbackQuery, categoryName);
      return;
    }

    if (data.startsWith('expense_acct:')) {
      const accountName = data.split(':').slice(1).join(':');
      await txHandler.handleExpenseAccount(bot, callbackQuery, accountName);
      return;
    }

    if (data === 'expense:confirm') {
      await txHandler.handleExpenseConfirm(bot, callbackQuery);
      return;
    }

    // ========================
    // TRANSFER CALLBACKS
    // ========================
    if (data.startsWith('transfer_from:')) {
      const accountName = data.split(':').slice(1).join(':');
      await txHandler.handleTransferFrom(bot, callbackQuery, accountName);
      return;
    }

    if (data.startsWith('transfer_to:')) {
      const accountName = data.split(':').slice(1).join(':');
      await txHandler.handleTransferTo(bot, callbackQuery, accountName);
      return;
    }

    if (data === 'transfer:confirm') {
      await txHandler.handleTransferConfirm(bot, callbackQuery);
      return;
    }

    // ========================
    // BILLS PAYMENT CALLBACKS
    // ========================
    if (data.startsWith('bill_pay_select:')) {
      const billName = data.split(':').slice(1).join(':');
      await txHandler.handleBillSelect(bot, callbackQuery, billName);
      return;
    }

    if (data.startsWith('bill_pay_acct:')) {
      const accountName = data.split(':').slice(1).join(':');
      await txHandler.handleBillPayAccount(bot, callbackQuery, accountName);
      return;
    }

    if (data === 'bill:confirm') {
      await txHandler.handleBillConfirm(bot, callbackQuery);
      return;
    }

    // ========================
    // PIUTANG BARU CALLBACKS
    // ========================
    if (data.startsWith('piutang_dari:')) {
      const accountName = data.split(':').slice(1).join(':');
      await txHandler.handlePiutangDari(bot, callbackQuery, accountName);
      return;
    }

    if (data === 'piutang:confirm') {
      await txHandler.handlePiutangConfirm(bot, callbackQuery);
      return;
    }

    // ========================
    // PELUNASAN PIUTANG
    // ========================
    if (data.startsWith('lunaspiu_ke:')) {
      const accountName = data.split(':').slice(1).join(':');
      await txHandler.handleLunasPiutangKe(bot, callbackQuery, accountName);
      return;
    }

    if (data === 'lunaspiu:confirm') {
      await txHandler.handleLunasPiutangConfirm(bot, callbackQuery);
      return;
    }

    // ========================
    // UTANG BARU CALLBACKS
    // ========================
    if (data.startsWith('utang_ke:')) {
      const accountName = data.split(':').slice(1).join(':');
      await txHandler.handleUtangKe(bot, callbackQuery, accountName);
      return;
    }

    if (data === 'utang:confirm') {
      await txHandler.handleUtangConfirm(bot, callbackQuery);
      return;
    }

    // ========================
    // PELUNASAN UTANG
    // ========================
    if (data.startsWith('lunasutang_dari:')) {
      const accountName = data.split(':').slice(1).join(':');
      await txHandler.handleLunasUtangDari(bot, callbackQuery, accountName);
      return;
    }

    if (data === 'lunasutang:confirm') {
      await txHandler.handleLunasUtangConfirm(bot, callbackQuery);
      return;
    }

    // ========================
    // AI TRANSACTION CONFIRM
    // ========================
    if (data === 'ai:confirm') {
      await txHandler.saveAiTransaction(bot, callbackQuery);
      return;
    }

    if (data === 'ai:cancel') {
      session.setState(userId, STATES.AI_CHAT);
      await bot.answerCallbackQuery(callbackQuery.id, { text: t.cancelled });
      await bot.editMessageText(t.cancelled, {
        chat_id: chatId,
        message_id: callbackQuery.message.message_id,
        parse_mode: 'Markdown',
      });
      return;
    }

    if (data === 'ai:edit') {
      // Edit manual — mulai flow income/expense
      await bot.answerCallbackQuery(callbackQuery.id);
      const txData = session.getData(userId).aiTransaction;
      if (txData && txData.type === 'income') {
        await txHandler.startIncome(bot, chatId, userId);
      } else {
        await txHandler.startExpense(bot, chatId, userId);
      }
      return;
    }

    // ========================
    // BILLS PAY TOGGLE
    // ========================
    if (data.startsWith('bill:pay:')) {
      const billName = data.split(':').slice(2).join(':');
      await reportHandler.handleBillPayToggle(bot, callbackQuery, billName, true);
      return;
    }

    if (data.startsWith('bill:unpay:')) {
      const billName = data.split(':').slice(2).join(':');
      await reportHandler.handleBillPayToggle(bot, callbackQuery, billName, false);
      return;
    }

    // ========================
    // SETTINGS
    // ========================
    if (data.startsWith('settings:')) {
      const action = data.split(':')[1];
      await bot.answerCallbackQuery(callbackQuery.id);

      switch (action) {
        case 'language':
          session.setState(userId, STATES.ONBOARD_LANG);
          await bot.sendMessage(chatId, L('id').selectLanguage, {
            parse_mode: 'Markdown',
            reply_markup: languageKeyboard(),
          });
          break;

        case 'income':
          session.setState(userId, STATES.SETTINGS_INCOME_MENU);
          await bot.sendMessage(chatId, t.setupIncomeTitle, {
            parse_mode: 'Markdown',
            reply_markup: require('./handlers/menu').incomeSourcesKeyboard(
              user.incomeSources || [],
              require('./config/defaults').incomeSources,
              lang
            ),
          });
          break;

        case 'accounts':
          session.setState(userId, STATES.SETTINGS_ACCT_MENU);
          await setupHandler.showAccountsSetup(bot, chatId, userId, lang);
          break;

        case 'spending':
          session.setState(userId, STATES.SETTINGS_SPENDING_MENU);
          await setupHandler.showSpendingSetup(bot, chatId, userId, lang);
          break;

        case 'bills':
          session.setState(userId, STATES.SETTINGS_BILLS_MENU);
          await setupHandler.showBillsSetup(bot, chatId, userId, lang);
          break;

        case 'spreadsheet':
          session.setState(userId, STATES.ONBOARD_SHEET);
          const email = sheets.getServiceAccountEmail();
          await bot.sendMessage(chatId, t.askSpreadsheetId.replace('{email}', email), {
            parse_mode: 'Markdown',
          });
          break;
      }
      return;
    }

    // ========================
    // SETTINGS - INCOME (saat di settings mode)
    // ========================
    if (data.startsWith('settings_income:')) {
      const parts = data.split(':');
      const action = parts[1];
      const param = parts.slice(2).join(':');

      if (action === 'toggle' || action === 'remove') {
        await setupHandler.handleIncomeToggle(bot, callbackQuery, param, true);
      } else if (action === 'add') {
        session.setState(userId, STATES.SETTINGS_INCOME_ADDING);
        await setupHandler.handleIncomeAddPrompt(bot, callbackQuery);
      } else if (action === 'done') {
        await setupHandler.handleIncomeDone(bot, callbackQuery, true);
      }
      return;
    }

    // ========================
    // BUDGET
    // ========================
    if (data === 'menu:budget' || data === 'budget:menu') {
      await bot.answerCallbackQuery(callbackQuery.id);
      await budgetHandler.showBudgetMenu(bot, chatId, userId);
      return;
    }

    if (data.startsWith('budget:set:')) {
      const categoryName = data.split(':').slice(2).join(':');
      await budgetHandler.handleBudgetCategorySelect(bot, callbackQuery, categoryName);
      return;
    }

    if (data.startsWith('budget:clear:')) {
      const categoryName = data.split(':').slice(2).join(':');
      await budgetHandler.handleBudgetClear(bot, callbackQuery, categoryName);
      return;
    }

    // ========================
    // CANCEL
    // ========================
    if (data === 'cancel') {
      session.clearSession(userId);
      await bot.answerCallbackQuery(callbackQuery.id, { text: t.cancelled });
      await bot.sendMessage(chatId, t.mainMenu, {
        parse_mode: 'Markdown',
        reply_markup: mainMenuKeyboard(lang),
      });
      return;
    }

    // Default: acknowledge
    await bot.answerCallbackQuery(callbackQuery.id);

  } catch (err) {
    const errMsg = err.message || '';

    // ❑ "message is not modified" — terjadi ketika tombol di-tap ganda atau state sama.
    //   Ini BUKAN error kritis, cukup abaikan (state tetap benar).
    if (errMsg.includes('message is not modified')) {
      try { await bot.answerCallbackQuery(callbackQuery.id); } catch {}
      return;
    }

    // ❑ "query is too old" — callback expired (> 48 jam), abaikan
    if (errMsg.includes('query is too old') || errMsg.includes('QUERY_ID_INVALID')) {
      return;
    }

    console.error(`Callback handler error (${data}):`, errMsg);
    try {
      await bot.answerCallbackQuery(callbackQuery.id, { text: '❌ Error, coba lagi' });
    } catch {}
  }
});

// =============================================
// POLLING ERROR HANDLER
// =============================================

bot.on('polling_error', (err) => {
  const msg = err.message || '';
  // ECONNRESET / ETIMEDOUT = gangguan jaringan sementara, bot akan reconnect otomatis
  if (msg.includes('ECONNRESET') || msg.includes('ETIMEDOUT') || msg.includes('EFATAL')) {
    console.warn('⚠️  Network blip (polling), reconnecting...', msg.split(':')[0]);
    return;
  }
  console.error('Polling error:', msg);
});

bot.on('error', (err) => {
  const msg = err.message || '';
  if (msg.includes('ECONNRESET') || msg.includes('ETIMEDOUT')) {
    console.warn('⚠️  Bot network error (transient):', msg.split(':')[0]);
    return;
  }
  console.error('Bot error:', msg);
});

// =============================================
// CRON JOB 1: BILL REMINDER — jam 9 pagi
// Kirim reminder tagihan yang mendekati jatuh tempo
// =============================================

cron.schedule('0 9 * * *', async () => {
  console.log('⏰ [Cron] Bill reminder check...');
  const userIds = userStore.getAllUserIds();

  for (const userId of userIds) {
    try {
      const user = userStore.getUser(userId);
      if (!user || !user.setupComplete || !user.bills) continue;

      const today = new Date();
      const todayDate = today.getDate();
      const t = L(user.lang);

      for (const bill of user.bills) {
        if (!bill.active || bill.paidThisMonth) continue;

        // Kirim reminder 3 hari sebelum & pada hari jatuh tempo
        const daysUntilDue = bill.dueDay - todayDate;
        if (daysUntilDue === 3 || daysUntilDue === 1 || daysUntilDue === 0) {
          const urgency = daysUntilDue === 0
            ? (user.lang === 'id' ? '🔴 *HARI INI!*' : '🔴 *TODAY!*')
            : daysUntilDue === 1
              ? (user.lang === 'id' ? '🟡 Besok' : '🟡 Tomorrow')
              : (user.lang === 'id' ? `🟢 ${daysUntilDue} hari lagi` : `🟢 In ${daysUntilDue} days`);

          const text = user.lang === 'id'
            ? `🔔 *Pengingat Tagihan!*\n\n📅 *${bill.name}* — ${urgency}\n💰 Nominal: *Rp ${Math.round(bill.amount).toLocaleString('id-ID')}*\n\nJangan lupa bayar! ✅`
            : `🔔 *Bill Reminder!*\n\n📅 *${bill.name}* — ${urgency}\n💰 Amount: *Rp ${Math.round(bill.amount).toLocaleString('id-ID')}*\n\nDon't forget to pay! ✅`;

          await bot.sendMessage(userId, text, {
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [[{
                text: user.lang === 'id' ? '✅ Bayar Tagihan' : '✅ Pay Bill',
                callback_data: 'menu:pay_bills',
              }]],
            },
          });
        }
      }
    } catch (err) {
      console.error(`Bill reminder error for user ${userId}:`, err.message);
    }
  }
}, {
  timezone: process.env.TIMEZONE || 'Asia/Jakarta',
});

// =============================================
// CRON JOB 2: DAILY MORNING REMINDER — jam 9 pagi
// Ingatkan user untuk mencatat transaksi hari ini
// =============================================

cron.schedule('5 9 * * *', async () => {
  console.log('☀️ [Cron] Daily morning reminder...');
  const userIds = userStore.getAllUserIds();
  const { mainMenuKeyboard: mkb } = require('./handlers/menu');

  for (const userId of userIds) {
    try {
      const user = userStore.getUser(userId);
      if (!user || !user.setupComplete) continue;

      const t = L(user.lang);
      const firstName = user.name ? user.name.split(' ')[0] : 'Kak';

      await bot.sendMessage(userId, t.reminderDaily(firstName), {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              { text: user.lang === 'id' ? '💸 Catat Pengeluaran' : '💸 Record Expense', callback_data: 'menu:expense' },
              { text: user.lang === 'id' ? '💰 Catat Pemasukan' : '💰 Record Income', callback_data: 'menu:income' },
            ],
            [
              { text: user.lang === 'id' ? '↔️ Transfer' : '↔️ Transfer', callback_data: 'menu:transfer' },
              { text: user.lang === 'id' ? '📋 Lainnya' : '📋 Other', callback_data: 'menu:other' },
            ],
          ],
        },
      });
    } catch (err) {
      console.error(`Daily reminder error for user ${userId}:`, err.message);
    }
  }
}, {
  timezone: process.env.TIMEZONE || 'Asia/Jakarta',
});

// =============================================
// CRON JOB 3: DAILY SUMMARY — jam 22:00 (10 malam)
// Kirim ringkasan pemasukan & pengeluaran hari ini
// =============================================

cron.schedule('0 22 * * *', async () => {
  console.log('🌙 [Cron] Daily summary...');
  const userIds = userStore.getAllUserIds();
  const sheets = require('./services/sheets');

  for (const userId of userIds) {
    try {
      const user = userStore.getUser(userId);
      if (!user || !user.setupComplete || !user.spreadsheetId) continue;

      const t = L(user.lang);
      const firstName = user.name ? user.name.split(' ')[0] : 'Kak';

      // Format tanggal hari ini
      const now = new Date();
      const dd = String(now.getDate()).padStart(2, '0');
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const yyyy = now.getFullYear();
      const months = user.lang === 'id'
        ? ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des']
        : ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const dateStr = `${dd} ${months[now.getMonth()]} ${yyyy}`;

      // Baca transaksi dari sheet bulan ini
      const allTx = await sheets.getTransactions(user.spreadsheetId);

      // Filter hanya hari ini
      // Format tanggal di sheet: "28 May 26" (DD Mon YY)
      const shortMonths = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const todayPrefix = `${dd} ${shortMonths[now.getMonth()]} ${String(yyyy).slice(-2)}`;

      const todayTx = allTx.filter(tx => tx.date && tx.date.startsWith(todayPrefix));

      if (todayTx.length === 0) {
        // Tidak ada transaksi hari ini
        await bot.sendMessage(userId, t.dailySummaryEmpty(firstName, dateStr), {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[
              { text: user.lang === 'id' ? '📝 Catat Sekarang' : '📝 Record Now', callback_data: 'menu:expense' },
            ]],
          },
        });
        continue;
      }

      // Hitung total
      let totalIncome = 0;
      let totalExpense = 0;
      const txLines = [];

      const INCOME_TYPES = ['Income', 'Dari Asset', 'Pelunasan Piutang', 'Utang Baru'];
      const EXPENSE_TYPES = ['Spending', 'Bills', 'Piutang Baru', 'Pelunasan Utang', 'Sinking Fund', 'Financial Goals'];

      todayTx.forEach(tx => {
        const amt = parseFloat(tx.amount) || 0;
        if (INCOME_TYPES.includes(tx.cashflow)) {
          totalIncome += amt;
        } else if (EXPENSE_TYPES.includes(tx.cashflow)) {
          totalExpense += amt;
        }

        // Buat line transaksi
        const icon = INCOME_TYPES.includes(tx.cashflow) ? '💰'
          : tx.cashflow === 'Transfer' ? '↔️'
          : '💸';
        const nameLabel = tx.name || tx.category || tx.cashflow;
        const amtLabel = `Rp ${Math.round(amt).toLocaleString('id-ID')}`;
        txLines.push(`${icon} ${nameLabel} — ${amtLabel}`);
      });

      const net = totalIncome - totalExpense;
      const txList = txLines.slice(0, 10).join('\n') // max 10 baris
        + (txLines.length > 10 ? `\n_...dan ${txLines.length - 10} transaksi lainnya_` : '');

      const summaryText = t.dailySummary(
        firstName,
        dateStr,
        totalIncome,
        totalExpense,
        net,
        txList
      );

      await bot.sendMessage(userId, summaryText, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{
              text: user.lang === 'id' ? '📊 Lihat Laporan Lengkap' : '📊 Full Report',
              callback_data: 'menu:report',
            }],
            [{
              text: user.lang === 'id' ? '📝 Tambah Transaksi' : '📝 Add Transaction',
              callback_data: 'menu:expense',
            }],
          ],
        },
      });

    } catch (err) {
      console.error(`Daily summary error for user ${userId}:`, err.message);
    }
  }
}, {
  timezone: process.env.TIMEZONE || 'Asia/Jakarta',
});

// =============================================
// CRON JOB 4: RESET BILLS — awal bulan jam 00:01
// Reset status tagihan & buat sheet bulan baru
// =============================================

cron.schedule('1 0 1 * *', async () => {
  console.log('📅 [Cron] New month — resetting bills & creating new sheet...');
  const userIds = userStore.getAllUserIds();
  const sheets = require('./services/sheets');

  for (const userId of userIds) {
    try {
      // Reset status tagihan
      userStore.resetBillsForNewMonth(userId);

      const user = userStore.getUser(userId);
      if (!user || !user.setupComplete || !user.spreadsheetId) continue;

      // Buat sheet bulan baru
      const { sheetName, isNew } = await sheets.getOrCreateMonthlySheet(user.spreadsheetId, user);

      if (isNew) {
        const t = L(user.lang);
        const msg = user.lang === 'id'
          ? `🎉 *Selamat Datang di Bulan Baru!*\n\n📊 Sheet baru *${sheetName}* sudah otomatis dibuat di spreadsheet kamu.\n\nYuk mulai catat keuangan bulan ini! 💪`
          : `🎉 *Welcome to a New Month!*\n\n📊 New sheet *${sheetName}* has been automatically created in your spreadsheet.\n\nLet's start tracking this month's finances! 💪`;

        await bot.sendMessage(userId, msg, {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[{
              text: user.lang === 'id' ? '🏠 Ke Menu Utama' : '🏠 Main Menu',
              callback_data: 'menu:main',
            }]],
          },
        });
        console.log(`  ✅ New sheet created for user ${userId}: ${sheetName}`);
      }
    } catch (err) {
      console.error(`Monthly reset error for user ${userId}:`, err.message);
    }
  }
}, {
  timezone: process.env.TIMEZONE || 'Asia/Jakarta',
});


// =============================================
// HELPER FUNCTIONS
// =============================================

/**
 * Cek apakah user sudah setup, kirim pesan jika belum
 */
function checkSetup(bot, msg) {
  const user = userStore.getUser(msg.from.id);
  if (!user || !user.setupComplete) {
    const t = L(user ? user.lang : 'id');
    bot.sendMessage(msg.chat.id, t.notSetup, { parse_mode: 'Markdown' }).catch(() => {});
    return false;
  }
  return true;
}

// =============================================
// STARTUP LOG
// =============================================

bot.getMe().then((me) => {
  console.log(`✅ Bot @${me.username} berjalan!`);
  console.log(`📊 Google Credentials: ${process.env.GOOGLE_CREDENTIALS_PATH}`);
  console.log(`🤖 Gemini AI: ${process.env.GEMINI_API_KEY ? 'Configured' : '⚠️ NOT SET'}`);
  console.log(`⏰ Timezone: ${process.env.TIMEZONE || 'Asia/Jakarta'}`);
  console.log('─'.repeat(50));
  console.log('MoneyFlowID Bot siap menerima pesan!');
  console.log('─'.repeat(50));
  console.log('👨‍💻 Dibuat oleh  : Ikhsanh');
  console.log('📱 Telegram      : @ikhsanh');
  console.log('🐙 GitHub        : https://github.com/ikhsanh');
  console.log('─'.repeat(50));
}).catch((err) => {
  console.error('❌ Gagal terhubung ke Telegram:', err.message);
  process.exit(1);
});
