const express = require('express');
const http = require('http');
const socketio = require('socket.io');

const app = express();
// Render bu portni avtomatik ravishda belgilaydi
const PORT = process.env.PORT || 5000; 

const server = http.createServer(app);

// >>> YUKSALISH UCHUN O'ZGARISH (RENDER/PRODUCTION) <<<
// React ilovasi joylashgan domen (masalan, https://suhbat-app.netlify.app)
// Bu o'zgaruvchini Render muhiti sozlamalarida kiritishingiz kerak.
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000"; 

// Socket.io ni sozlash. CORS endi CLIENT_URL ni ishlatadi.
const io = socketio(server, {
  cors: {
    // Agar CLIENT_URL o'rnatilgan bo'lsa, faqat shu manzilga ruxsat beriladi.
    origin: CLIENT_URL, 
    methods: ["GET", "POST"]
  }
});

// Foydalanuvchi ulanganida
io.on('connection', (socket) => {
    
    // 1. Yangi foydalanuvchiga uning unikal ID sini yuborish
    socket.emit('meningIDim', socket.id);
    console.log(`[ULANDI] Yangi foydalanuvchi ulandi: ${socket.id}. Mijoz URL: ${CLIENT_URL}`);

    // 2. Chaqiruvni boshlash (SDP Offer signalini boshqa foydalanuvchiga uzatish)
    // Bu xonani yaratish va boshqa ishtirokchiga kirish uchun ham ishlatiladi
    socket.on("qo'ng'iroqniChaqirish", (data) => {
        const { chaqiriluvchiID, signalData, chaqiruvchiID } = data;

        console.log(`[CHAQIRUV] ${chaqiruvchiID} ID li foydalanuvchi ${chaqiriluvchiID} ni chaqirmoqda.`);

        // Chaqiruv signalini faqat kerakli xonaga yuborish
        io.to(chaqiriluvchiID).emit("qo'ng'iroqQabulQilindi", { 
            signal: signalData, 
            chaqiruvchiID: chaqiruvchiID,
        });
    });

    // 3. Qo'ng'iroqqa javob berish (SDP Answer signalini chaqiruvchiga uzatish)
    socket.on("qo'ng'iroqqaJavob", (data) => {
        const { signal, kimga } = data;
        
        console.log(`[JAVOB] Qo'ng'iroqqa ${kimga} ga javob yuborilmoqda.`);

        // Javob signalini chaqiruvchi ID ga qaytarish
        io.to(kimga).emit("javobQabulQilindi", signal);
    });

    // 4. Foydalanuvchi uzilganda
    socket.on('disconnect', () => {
        console.log(`[UZILDI] Foydalanuvchi uzildi: ${socket.id}`);
        // Bu xabarni boshqa ishtirokchilarga yuborish
        socket.broadcast.emit('qo\'ng\'iroqTugadi'); 
    });
});

// Serverni ishga tushirish
server.listen(PORT, () => console.log(`*** Suhbat serveri ${PORT}-portda ishlamoqda. ***`));
