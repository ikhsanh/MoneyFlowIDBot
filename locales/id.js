/**
 * Lokalisasi Bahasa Indonesia
 * MoneyFlowID Bot
 */

module.exports = {
  lang: 'id',

  // ================================
  // WELCOME & ONBOARDING
  // ================================
  welcome: (name) => `
🌟 *Selamat Datang di MoneyFlowID, ${name}!*

Bot pencatatan keuangan pribadi yang cerdas, terintegrasi dengan:
• 🤖 *Gemini AI* — untuk analisis & transaksi natural
• 📊 *Google Spreadsheet* — untuk laporan rapi & grafik
• 💳 Multi-akun & multi-kategori

Mari kita mulai setup akun kamu! 🚀

👨‍💻 *Author:* @ikhsanh
🐙 *GitHub:* github.com/ikhsanh
`,

  selectLanguage: `
🌐 *Pilih Bahasa / Select Language*

Pilih bahasa yang ingin kamu gunakan:
`,

  langSelected: '✅ Bahasa Indonesia dipilih!',

  // ================================
  // SPREADSHEET SETUP
  // ================================
  askSpreadsheetId: `
📊 *Langkah 1: Google Spreadsheet*

Masukkan *Spreadsheet ID* Google Sheets kamu.

📌 Cara mendapatkan Spreadsheet ID:
1. Buka Google Spreadsheet kamu
2. Lihat URL: \`https://docs.google.com/spreadsheets/d/\`*\`[INI SPREADSHEET ID]\`*\`/edit\`
3. Salin bagian yang di-bold

✉️ Kirimkan Spreadsheet ID-nya sekarang:
`,

  invalidSpreadsheetId: `
❌ *Spreadsheet ID tidak valid atau tidak dapat diakses.*

Pastikan:
• ID sudah benar
• Spreadsheet sudah di-share ke akun service: \`{email}\`
• Akses: *Editor*

Coba lagi dengan ID yang benar:
`,

  spreadsheetConnected: (title) => `
✅ *Spreadsheet berhasil terhubung!*
📊 Spreadsheet: *${title}*

Mempersiapkan sheet & format... sebentar ya 🔄
`,

  sheetInitialized: `
✅ *Sheet berhasil dibuat!*

Sheet yang dibuat:
• 📋 Transaksi
• 💳 Akun
• 💰 Sumber Income
• 🛍️ Kategori Pengeluaran
• 📅 Tagihan
• 📊 Ringkasan Bulanan
• 🎯 Dashboard + Chart

Sekarang mari setup keuangan kamu! 👇
`,

  // ================================
  // SETUP - INCOME SOURCES
  // ================================
  setupIncomeTitle: `
💼 *Setup Sumber Pendapatan*

Berikut daftar sumber pendapatan default.
Centang yang sesuai, atau tambah baru:
`,

  setupIncomeAdding: '✍️ Ketik nama sumber pendapatan baru:',
  setupIncomeAdded: (name) => `✅ *${name}* ditambahkan!`,
  setupIncomeRemoved: (name) => `🗑️ *${name}* dihapus.`,
  setupIncomeDone: (count) => `✅ *${count} sumber pendapatan* tersimpan!`,
  setupIncomeEmpty: '⚠️ Tambahkan minimal 1 sumber pendapatan.',
  currentIncomeSources: (list) => `📋 *Sumber Pendapatan Kamu:*\n${list}`,

  // ================================
  // SETUP - ACCOUNTS
  // ================================
  setupAccountTitle: `
💳 *Setup Akun & Dompet*

Pilih akun yang kamu miliki.
Klik untuk menambah atau hapus:
`,

  setupAccountSelectBalance: (name) => `
💰 Berapa saldo *${name}* saat ini?
Ketik nominalnya (contoh: 1500000):
`,

  setupAccountAdded: (name, balance) => `✅ *${name}* ditambahkan dengan saldo Rp ${formatNumber(balance)}`,
  setupAccountRemoved: (name) => `🗑️ Akun *${name}* dihapus.`,
  setupAccountDone: (count) => `✅ *${count} akun* tersimpan!`,
  setupAccountEmpty: '⚠️ Tambahkan minimal 1 akun.',
  setupAccountCustomName: '✍️ Ketik nama akun baru:',

  // ================================
  // SETUP - SPENDING CATEGORIES
  // ================================
  setupSpendingTitle: `
🛍️ *Setup Kategori Pengeluaran*

Pilih kategori yang sesuai dengan kebiasaan kamu:
`,

  setupSpendingAdding: '✍️ Ketik nama kategori pengeluaran baru:',
  setupSpendingAdded: (name) => `✅ *${name}* ditambahkan!`,
  setupSpendingRemoved: (name) => `🗑️ *${name}* dihapus.`,
  setupSpendingDone: (count) => `✅ *${count} kategori pengeluaran* tersimpan!`,
  setupSpendingEmpty: '⚠️ Tambahkan minimal 1 kategori.',

  // ================================
  // SETUP - BILLS
  // ================================
  setupBillsTitle: `
📅 *Setup Tagihan Bulanan*

Tagihan bulanan rutin seperti Netflix, WiFi, dll.
Tambahkan tagihan kamu:
`,

  setupBillName: '✍️ Nama tagihan? (contoh: Netflix, WiFi, Listrik):',
  setupBillAmount: (name) => `💰 Berapa nominal tagihan *${name}* per bulan?\nKetik nominalnya (contoh: 54000):`,
  setupBillDue: (name) => `📅 Tanggal jatuh tempo *${name}* setiap bulan?\nKetik tanggalnya (1-31):`,
  setupBillAccount: (name) => `💳 Tagihan *${name}* dibayar dari akun mana?`,
  setupBillAdded: (name, amount, due) => `✅ Tagihan *${name}* (Rp ${formatNumber(amount)}, tgl ${due}) ditambahkan!`,
  setupBillRemoved: (name) => `🗑️ Tagihan *${name}* dihapus.`,
  setupBillDone: (count) => `✅ *${count} tagihan* tersimpan!`,
  setupBillsSkip: '➡️ Langkah tagihan dilewati.',

  // ================================
  // SETUP COMPLETE
  // ================================
  setupComplete: `
🎉 *Setup Selesai! Selamat Datang di MoneyFlowID!*

Semua konfigurasi sudah tersimpan.
Kamu siap mencatat keuangan! 💪

Gunakan menu di bawah untuk memulai:
`,

  // ================================
  // MAIN MENU
  // ================================
  mainMenu: '🏠 *Menu Utama MoneyFlowID*\n\nPilih menu:',
  menuIncome: '💰 Pemasukan',
  menuExpense: '💸 Pengeluaran',
  menuTransfer: '↔️ Transfer',
  menuOther: '📋 Lainnya',
  menuReport: '📊 Laporan',
  menuBalance: '💳 Saldo',
  menuAI: '🤖 AI Chat',
  menuSettings: '⚙️ Pengaturan',
  menuBills: '📅 Tagihan',

  cashflowTitle: '📋 *Transaksi Lainnya*\n\nPilih jenis transaksi:',

  // ================================
  // RECORD INCOME
  // ================================
  incomeTitle: '💰 *Catat Pemasukan*\n\nPilih sumber pendapatan:',
  incomeSelectSource: '📌 Pilih sumber pendapatan:',
  incomeEnterAmount: (source) => `💰 Dari *${source}*\n\nBerapa nominal pemasukannya?\n_(contoh: 5000000 atau 5jt)_`,
  incomeSelectAccount: (source, amount) => `💰 *${source}* — Rp ${formatNumber(amount)}\n\nMasuk ke akun mana?`,
  enterTxName: '📝 *Nama Transaksi*\n\nKetik nama/keterangan transaksi:\n_(ketik "-" untuk pakai nama default)_',
  incomeConfirm: (source, amount, account, name) => `
📋 *Konfirmasi Pemasukan*

💼 Sumber: *${source}*
📝 Nama: *${name}*
💰 Nominal: *Rp ${formatNumber(amount)}*
🏦 Ke akun: *${account}*

Simpan?`,
  incomeSaved: (amount, account) => `✅ *Pemasukan Rp ${formatNumber(amount)} tersimpan!*\nAkun *${account}* diperbarui 📊`,

  // ================================
  // RECORD EXPENSE
  // ================================
  expenseTitle: '💸 *Catat Pengeluaran*\n\nPilih kategori:',
  expenseSelectCategory: '📌 Pilih kategori pengeluaran:',
  expenseEnterAmount: (category) => `💸 Kategori: *${category}*\n\nBerapa nominalnya?\n_(contoh: 25000 atau 25rb)_`,
  expenseSelectAccount: (category, amount) => `💸 *${category}* — Rp ${formatNumber(amount)}\n\nDibayar dari akun mana?`,
  expenseConfirm: (category, amount, account, name) => `
📋 *Konfirmasi Pengeluaran*

🛒 Kategori: *${category}*
📝 Nama: *${name}*
💸 Nominal: *Rp ${formatNumber(amount)}*
🏦 Dari akun: *${account}*

Simpan?`,
  expenseSaved: (amount, account) => `✅ *Pengeluaran Rp ${formatNumber(amount)} tersimpan!*\nSaldo *${account}* diperbarui 📊`,

  // ================================
  // TRANSFER
  // ================================
  transferEnterAmount: '↔️ *Transfer Antar Akun*\n\nBerapa nominal yang akan ditransfer?\n_(contoh: 100000 atau 100rb)_',
  transferFromAccount: '💳 Transfer *dari* akun mana?',
  transferToAccount: '🏦 Transfer *ke* akun mana?',
  transferConfirm: (amount, from, to, name) => `
📋 *Konfirmasi Transfer*

📝 Nama: *${name}*
💸 Nominal: *Rp ${formatNumber(amount)}*
💳 Dari: *${from}*
🏦 Ke: *${to}*

Simpan?`,
  transferSaved: (amount, from, to) => `✅ *Transfer Rp ${formatNumber(amount)} berhasil!*\n${from} → ${to}`,

  // ================================
  // BILLS PAYMENT
  // ================================
  billSelectTitle: '📅 *Bayar Tagihan*\n\nTagihan mana yang ingin dibayar?',
  billSelectAccount: (name, amount) => `📅 Bayar *${name}* (Rp ${formatNumber(amount)})\n\nDibayar dari akun mana?`,
  billConfirm: (name, amount, account) => `
📋 *Konfirmasi Bayar Tagihan*

📅 Tagihan: *${name}*
💸 Nominal: *Rp ${formatNumber(amount)}*
🏦 Dari akun: *${account}*

Simpan?`,
  billPaid: (name) => `✅ Tagihan *${name}* berhasil dibayar! Status diperbarui di spreadsheet.`,

  // ================================
  // PIUTANG BARU
  // ================================
  piutangEnterName: '💼 *Piutang Baru (Beri Pinjaman)*\n\nNama orang/pihak yang kamu beri pinjaman:',
  piutangEnterAmount: (name) => `💼 Piutang ke *${name}*\n\nBerapa nominalnya?`,
  piutangSelectDari: '💳 Dibayar dari akun mana?',
  piutangConfirm: (name, amount, dari, txName) => `
📋 *Konfirmasi Piutang Baru*

💼 Piutang ke: *${name}*
📝 Keterangan: *${txName}*
💸 Nominal: *Rp ${formatNumber(amount)}*
🏦 Dari akun: *${dari}*

Simpan?`,
  piutangSaved: (name, amount) => `✅ *Piutang Rp ${formatNumber(amount)} ke ${name} tercatat!*`,

  // ================================
  // PELUNASAN PIUTANG
  // ================================
  lunasPiutangEnterName: '✅ *Lunas Piutang*\n\nNama orang/pihak yang mengembalikan pinjaman:',
  lunasPiutangEnterAmount: '💰 Berapa nominal yang dikembalikan?',
  lunasPiutangSelectKe: '🏦 Diterima di akun mana?',
  lunasPiutangConfirm: (name, amount, ke) => `
📋 *Konfirmasi Pelunasan Piutang*

✅ Piutang dari: *${name}*
💰 Nominal: *Rp ${formatNumber(amount)}*
🏦 Ke akun: *${ke}*

Simpan?`,
  lunasPiutangSaved: (name, amount) => `✅ *Pelunasan piutang Rp ${formatNumber(amount)} dari ${name} tercatat!*`,

  // ================================
  // UTANG BARU
  // ================================
  utangEnterName: '💳 *Utang Baru (Pinjam dari Orang)*\n\nNama orang/pihak yang kamu pinjam:',
  utangEnterAmount: (name) => `💳 Utang dari *${name}*\n\nBerapa nominalnya?`,
  utangSelectKe: '🏦 Diterima di akun mana?',
  utangConfirm: (name, amount, ke, txName) => `
📋 *Konfirmasi Utang Baru*

💳 Utang dari: *${name}*
📝 Keterangan: *${txName}*
💰 Nominal: *Rp ${formatNumber(amount)}*
🏦 Ke akun: *${ke}*

Simpan?`,
  utangSaved: (name, amount) => `✅ *Utang Rp ${formatNumber(amount)} dari ${name} tercatat!*`,

  // ================================
  // PELUNASAN UTANG
  // ================================
  lunasUtangEnterName: '✅ *Bayar Utang*\n\nNama orang/pihak yang kamu bayar utangnya:',
  lunasUtangEnterAmount: '💸 Berapa nominal yang kamu bayar?',
  lunasUtangSelectDari: '💳 Dibayar dari akun mana?',
  lunasUtangConfirm: (name, amount, dari) => `
📋 *Konfirmasi Bayar Utang*

✅ Bayar utang ke: *${name}*
💸 Nominal: *Rp ${formatNumber(amount)}*
🏦 Dari akun: *${dari}*

Simpan?`,
  lunasUtangSaved: (name, amount) => `✅ *Pembayaran utang Rp ${formatNumber(amount)} ke ${name} tercatat!*`,

  // ================================
  // REPORT
  // ================================
  reportTitle: '📊 *Laporan Keuangan*\n\nPilih jenis laporan:',
  reportMonthly: '📅 Laporan Bulanan',
  reportByCategory: '🗂️ Per Kategori',
  reportBalance: '💳 Saldo Akun',
  reportBills: '📋 Status Tagihan',
  reportInsight: '🤖 Insight AI',

  monthlyReport: (month, year, income, expense, savings, savingsRate) => `
📊 *Laporan Bulan ${month} ${year}*
${'─'.repeat(30)}
💰 Total Pemasukan: *Rp ${formatNumber(income)}*
💸 Total Pengeluaran: *Rp ${formatNumber(expense)}*
💾 Tabungan: *Rp ${formatNumber(savings)}*
📈 Savings Rate: *${savingsRate}%*
${'─'.repeat(30)}
`,

  categoryReport: (data) => {
    let text = `🗂️ *Pengeluaran per Kategori (Bulan Ini)*\n${'─'.repeat(30)}\n`;
    data.forEach((item) => {
      text += `${item.emoji || '📦'} ${item.category}: *Rp ${formatNumber(item.total)}*\n`;
    });
    return text;
  },

  balanceReport: (accounts) => {
    let text = `💳 *Saldo Akun*\n${'─'.repeat(30)}\n`;
    let total = 0;
    accounts.forEach((acc) => {
      text += `${acc.emoji || '🏦'} ${acc.name}: *Rp ${formatNumber(acc.balance)}*\n`;
      total += acc.balance;
    });
    text += `${'─'.repeat(30)}\n💰 *Total: Rp ${formatNumber(total)}*`;
    return text;
  },

  billsReport: (bills) => {
    let text = `📅 *Status Tagihan Bulan Ini*\n${'─'.repeat(30)}\n`;
    bills.forEach((bill) => {
      const icon = bill.paid ? '✅' : bill.overdue ? '🔴' : '⏰';
      text += `${icon} ${bill.name}: *Rp ${formatNumber(bill.amount)}* (tgl ${bill.dueDay})\n`;
    });
    return text;
  },

  // ================================
  // AI CHAT
  // ================================
  aiChatTitle: `
🤖 *MoneyFlow AI Assistant*

Kamu bisa:
• Ketik transaksi natural: _"beli makan 25rb dari Gopay"_
• Tanya insight: _"gimana keuangan saya bulan ini?"_
• Minta saran: _"bagaimana cara hemat lebih banyak?"_

Ketik /menu untuk kembali ke menu.
`,

  aiProcessing: '🤔 *AI sedang memproses...*',
  aiTransactionDetected: (data) => `
🤖 *AI mendeteksi transaksi:*

${data.type === 'income' ? '💰' : '💸'} *${data.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}*
📌 ${data.type === 'income' ? 'Sumber' : 'Kategori'}: *${data.category}*
💵 Nominal: *Rp ${formatNumber(data.amount)}*
🏦 Akun: *${data.account}*
📝 Catatan: ${data.note || '-'}

Apakah ini benar?`,

  aiError: '❌ AI tidak dapat memproses pesan ini. Coba lagi ya!',

  // ================================
  // SETTINGS
  // ================================
  settingsTitle: '⚙️ *Pengaturan*\n\nPilih yang ingin diubah:',
  settingsLanguage: '🌐 Ubah Bahasa',
  settingsIncome: '💼 Kelola Sumber Income',
  settingsAccounts: '💳 Kelola Akun',
  settingsSpending: '🛍️ Kelola Kategori Pengeluaran',
  settingsBills: '📅 Kelola Tagihan',
  settingsSpreadsheet: '📊 Ganti Spreadsheet',
  settingsBack: '◀️ Kembali ke Menu',

  // ================================
  // ERRORS & MISC
  // ================================
  notSetup: `
⚠️ *Kamu belum melakukan setup!*

Ketik /start untuk memulai setup keuangan kamu.
`,

  invalidAmount: '❌ Nominal tidak valid. Masukkan angka tanpa titik/koma (contoh: 25000):',
  invalidDate: '❌ Tanggal tidak valid. Masukkan angka 1-31:',
  btnConfirm: '✅ Simpan',
  btnCancel: '❌ Batalkan',
  btnDone: '✅ Selesai',
  btnAdd: '➕ Tambah Baru',
  btnSkip: '⏭️ Lewati',
  btnBack: '◀️ Kembali',
  btnNext: '▶️ Lanjut',
  btnYes: '✅ Ya',
  btnNo: '❌ Tidak',
  cancelled: '❌ Dibatalkan.',
  processingError: '❌ Terjadi kesalahan. Silakan coba lagi atau ketik /menu.',
  noTransactions: '📭 Belum ada transaksi bulan ini.',
  noAccounts: '⚠️ Belum ada akun yang ditambahkan.',
  insufficientBalance: (account, balance) => `⚠️ Saldo *${account}* tidak cukup! Saldo: Rp ${formatNumber(balance)}`,
  
  reminderBill: (name, amount, dueDay) => `
🔔 *Pengingat Tagihan!*

📅 Tagihan *${name}* akan jatuh tempo tanggal *${dueDay}*
💰 Nominal: *Rp ${formatNumber(amount)}*

Jangan lupa bayar! ✅
`,

  billPaidConfirm: (name, amount) => `
📋 *Konfirmasi Pembayaran Tagihan*

📅 Tagihan: *${name}*
💸 Nominal: *Rp ${formatNumber(amount)}*

Tandai sebagai sudah dibayar?`,
  billPaid: (name) => `✅ Tagihan *${name}* ditandai sudah dibayar!`,

  // setup steps progress
  setupProgress: (step, total) => `📍 Langkah ${step} dari ${total}`,

  // ================================
  // DAILY REMINDERS
  // ================================
  reminderDaily: (name) => `
☀️ *Selamat pagi, ${name}!*

📝 Jangan lupa catat transaksi hari ini ya!
Ketuk tombol di bawah untuk mulai mencatat:
`,

  dailySummaryEmpty: (name, dateStr) => `
🌙 *Ringkasan Harian — ${dateStr}*

Hai *${name}*! Belum ada transaksi yang tercatat hari ini.

Catat sekarang sebelum lupa! 📝
`,

  dailySummary: (name, dateStr, income, expense, net, txList) => `
🌙 *Ringkasan Harian — ${dateStr}*

Hai *${name}*! Berikut ringkasan keuangan hari ini:

💰 *Pemasukan:* Rp ${formatNumber(income)}
💸 *Pengeluaran:* Rp ${formatNumber(expense)}
${net >= 0 ? '✅' : '⚠️'} *Selisih:* ${net >= 0 ? '+' : ''}Rp ${formatNumber(net)}

📋 *Transaksi Hari Ini:*
${txList}

Semangat mengelola keuangan! 💪
`,
};

function formatNumber(num) {
  if (!num && num !== 0) return '0';
  return Math.round(num).toLocaleString('id-ID');
}
