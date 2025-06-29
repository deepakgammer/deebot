const { Telegraf, session } = require('telegraf');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const bot = new Telegraf('8114426780:AAHSaw2TTR2tDDZD_WXrYcRMA-ig05jENtg');

const UPI_ID = '6374727774@superyes';
const BOT_NAME = 'DeeStudio';
const LOGO_URL = 'https://i.postimg.cc/KzD7NBt0/Dee-Studio-Logo.jpg';

bot.use(session());

bot.start((ctx) => {
    ctx.session = null;
    ctx.reply(`🎉 Welcome to ${BOT_NAME} Payment Bot!\n\n💬 To begin, send me the amount.\nExample: 499 or 1500.75`);
});

bot.on('text', async (ctx) => {
    const msg = ctx.message.text.trim();

    if (ctx.session?.awaitingPurpose && ctx.session.amount) {
        const purpose = msg;
    const amount = ctx.session.amount;
    ctx.session = null;

    const qrData = `upi://pay?pa=${UPI_ID}&pn=${BOT_NAME}&am=${amount}&cu=INR`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`;

    await ctx.sendPhoto(
        { url: qrUrl },
        {
            caption: `📲 Scan to pay ₹${amount} to ${BOT_NAME}\nUPI ID: ${UPI_ID}`,
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: `🧾 View Summary`,
                            callback_data: `summary_${amount}_${encodeURIComponent(purpose)}`
                        }
                    ]
                ]
            }
        }
    );
    return;
}

    if (!/^\d+(\.\d{1,2})?$/.test(msg)) {
        return ctx.reply('❗ Please enter a valid amount (e.g., 250 or 199.99)');
}

ctx.session = { amount: msg, awaitingPurpose: true };
ctx.reply(`✍️ Please enter the purpose for ₹${msg}\n(e.g., Logo design, hosting, app build etc)`);
});

bot.on('callback_query', async (ctx) => {
    const data = ctx.callbackQuery.data;
    if (data.startsWith('summary_')) {
        const [, amount, rawPurpose] = data.split('_');
        const purpose = decodeURIComponent(rawPurpose);
        await ctx.answerCbQuery();

        const clientName = ctx.from.username || ctx.from.first_name;
        const fileName = `bill_${ctx.from.id}_${Date.now()}.pdf`;
        const filePath = path.join(__dirname, fileName);
        const invoiceNumber = `DS-${Math.floor(1000 + Math.random() * 9000)}`;
        const today = new Date().toLocaleDateString();

        const doc = new PDFDocument({ size: 'A4' });
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        doc.rect(0, 0, 600, 100).fill('#4A90E2');
        doc.fillColor('white').fontSize(24).text('DeeStudio', { align: 'center', lineGap: 5 });
        doc.fontSize(12).text('Make your Idea Live !', { align: 'center' });

        doc.fillColor('#E6F0FA').rect(40, 120, 520, 400).fill();
        doc.fillColor('#4A90E2').fontSize(16).text('🧾 Payment Receipt', 60, 130);

        doc.fillColor('black').fontSize(12);
        let y = 165;
        const spacing = 25;

        const details = {
            "Invoice No.": invoiceNumber,
            "Date": today,
            "Client": clientName,
            "Amount Paid": `₹${amount}`,
            "Purpose": purpose,
            "Paid via UPI ID": UPI_ID
        };

        for (const [label, value] of Object.entries(details)) {
            doc.font('Helvetica-Bold').text(`${label}:`, 70, y);
        doc.font('Helvetica').text(value, 200, y);
        y += spacing;
    }

    doc.font('Helvetica-Bold').text("From:", 70, y + 10);
    doc.font('Helvetica').text("No:118, Sv Nagar,\nPerumalpattu,\nThiruvallur, 602024", 70, y + 30);

    doc.strokeColor('#4A90E2').moveTo(60, 550).lineTo(540, 550).stroke();
    doc.font('Helvetica-Oblique').fontSize(10).fillColor('gray').text('Thank you for your payment! - Team DeeStudio', 60, 560, { align: 'center' });

    doc.end();

    stream.on('finish', async () => {
        await ctx.replyWithPhoto(LOGO_URL, {
            caption: `🧾 *Payment Summary*\n👤 Client: @${clientName}\n💰 Amount: ₹${amount}\n📌 Purpose: ${purpose}`,
            parse_mode: 'Markdown'
        });

        await ctx.replyWithDocument({ source: filePath, filename: 'DeeStudio_Bill.pdf' });
        fs.unlinkSync(filePath);
    });
}
});

bot.launch().then(() => {
    console.log('🚀 DeeStudio Payment Bot is running...');
});
