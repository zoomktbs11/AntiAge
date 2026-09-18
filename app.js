let tg = null;

function initTelegram() {
    try {
        if (window.Telegram && window.Telegram.WebApp) {
            tg = window.Telegram.WebApp;
            tg.expand();
            tg.ready();
        }
    } catch (e) {
        console.error('Ошибка инициализации Telegram WebApp:', e);
    }
}

function haptic(type) {
    if (tg && tg.HapticFeedback) {
        if (type === 'success') {
            tg.HapticFeedback.notificationOccurred('success');
        } else {
            tg.HapticFeedback.impactOccurred('light');
        }
    }
}

function showTelegramAlert(msg) {
    if (tg && typeof tg.showAlert === 'function') {
        tg.showAlert(msg);
    } else {
        alert(msg);
    }
}

function openPage(pageId) {
    const page = document.getElementById(pageId + 'Page');
    if (page) {
        page.classList.add('slide-in');
        page.scrollTop = 0;
        document.body.style.overflow = 'hidden';
        haptic('success');
    }
}

function closePage(pageId) {
    const page = document.getElementById(pageId + 'Page');
    if (page) {
        page.classList.remove('slide-in');
        document.body.style.overflow = '';
        haptic('success');
    }
}

function navigateToTab(tabId) {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-page') === tabId) {
            item.classList.add('active');
        }
    });

    const overlayPages = ['services', 'founder', 'booking', 'doctors', 'more', 'massage', 'cosmetology', 'gynecology'];
    overlayPages.forEach(p => {
        const pg = document.getElementById(p + 'Page');
        if (pg) pg.classList.remove('slide-in');
    });

    document.body.style.overflow = '';

    if (tabId === 'home') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
        openPage(tabId);
        if (tabId === 'booking') initDateStrip();
    }
    haptic('success');
}

function filterServices() {
    const input = document.getElementById('searchInput');
    if (!input) return;
    const q = input.value.toLowerCase();
    document.querySelectorAll('#servicesList .service-item').forEach(item => {
        const text = (item.getAttribute('data-name') || '') + ' ' + item.textContent.toLowerCase();
        item.style.display = text.includes(q) ? 'flex' : 'none';
    });
}

function formatPhone(v) {
    let n = v.replace(/\D/g, '');
    if (n.length > 0 && (n[0] === '8' || n[0] === '7')) n = n.substring(1);
    n = n.substring(0, 10);
    let f = '+7';
    if (n.length > 0) f += ' (' + n.substring(0, 3);
    if (n.length >= 3) f += ') ' + n.substring(3, 6);
    if (n.length >= 6) f += '-' + n.substring(6, 8);
    if (n.length >= 8) f += '-' + n.substring(8, 10);
    return f;
}

function showDirectionDetails(type) {
    const data = {
        gynecology: 'Гинекология:\n• Консультация специалиста\n• Аппаратное интимное омоложение\n• УЗ-диагностика',
        neurology: 'Невролог:\n• Комплексная диагностика\n• Превентивная терапия головных болей'
    };
    if (data[type]) showTelegramAlert(data[type]);
}

function orderCertificate() {
    navigateToTab('booking');
}

function animateNumbers() {
    document.querySelectorAll('.stat-number').forEach(counter => {
        const target = parseInt(counter.getAttribute('data-target'), 10);
        let start = 0;
        const step = target / 40;
        const timer = setInterval(() => {
            start += step;
            if (start >= target) {
                counter.textContent = '+' + target.toLocaleString('ru-RU');
                clearInterval(timer);
            } else {
                counter.textContent = '+' + Math.floor(start).toLocaleString('ru-RU');
            }
        }, 30);
    });
}

/* ===== ЛОГИКА ОНЛАЙН-ЗАПИСИ ===== */
let selectedDate = null;
let selectedTime = null;
const daysOfWeek = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
const monthsGenitive = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

function initDateStrip() {
    const strip = document.getElementById('dateStrip');
    if (!strip) return;
    strip.innerHTML = '';
    const today = new Date();

    for (let i = 0; i < 8; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        const dayNum = d.getDate();
        const dayName = daysOfWeek[d.getDay()];
        const item = document.createElement('div');
        item.className = 'date-item' + (i === 0 ? ' active' : '');
        item.innerHTML = `<div class="date-num">${dayNum}</div><div class="date-day">${dayName}</div>`;
        item.onclick = () => selectDate(d, item);
        strip.appendChild(item);
        if (i === 0) selectDate(d, item);
    }
    generateTimeSlots();
}

function selectDate(dateObj, element) {
    selectedDate = dateObj;
    document.querySelectorAll('.date-item').forEach(el => el.classList.remove('active'));
    element.classList.add('active');

    const monthName = monthsGenitive[dateObj.getMonth()];
    const dayName = daysOfWeek[dateObj.getDay()];
    const label = document.getElementById('timeLabel');
    if (label) {
        label.textContent = `Время · ${dateObj.getDate()} ${monthName}, ${dayName}`;
    }

    generateTimeSlots();
    updateSubmitButton();
    haptic('light');
}

function generateTimeSlots() {
    const grid = document.getElementById('timeGrid');
    if (!grid) return;
    grid.innerHTML = '';

    const times = [
        '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
        '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
        '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
        '17:00', '17:30', '18:00', '18:30', '19:00', '19:30'
    ];
    const bookedIndices = [12, 13, 14, 16, 17, 18, 20, 21, 22];

    times.forEach((time, index) => {
        const slot = document.createElement('div');
        const isBooked = bookedIndices.includes(index);
        slot.className = 'time-slot' + (isBooked ? ' booked' : '');
        slot.textContent = time;
        if (!isBooked) slot.onclick = () => selectTime(time, slot);
        grid.appendChild(slot);
    });
}

function selectTime(time, element) {
    selectedTime = time;
    document.querySelectorAll('.time-slot').forEach(el => el.classList.remove('active'));
    element.classList.add('active');
    updateSubmitButton();
    haptic('light');
}

function updateSubmitButton() {
    const btn = document.getElementById('submitBookingBtn');
    const text = document.getElementById('submitBtnText');
    if (!btn || !text) return;

    if (selectedDate && selectedTime) {
        const monthName = monthsGenitive[selectedDate.getMonth()];
        text.textContent = `Записаться на ${selectedDate.getDate()} ${monthName}, ${selectedTime}`;
        btn.classList.remove('disabled');
    } else {
        text.textContent = 'Записаться';
        btn.classList.add('disabled');
    }
}

function submitBooking() {
    if (!selectedDate || !selectedTime) return;

    const nameInput = document.getElementById('bookName');
    const phoneInput = document.getElementById('bookPhone');
    const commentInput = document.getElementById('bookComment');

    const name = nameInput.value.trim();
    const phone = phoneInput.value.trim();

    if (!name) {
        showTelegramAlert('Пожалуйста, укажите ваше имя');
        return;
    }
    if (!phone || phone.length < 10) {
        showTelegramAlert('Пожалуйста, укажите корректный номер телефона');
        return;
    }

    const monthName = monthsGenitive[selectedDate.getMonth()];
    showTelegramAlert(`✅ Заявка принята!\n\n${selectedDate.getDate()} ${monthName} в ${selectedTime}\n\nМы свяжемся с вами в течение 15 минут.`);

    nameInput.value = '';
    phoneInput.value = '';
    if (commentInput) commentInput.value = '';

    document.querySelectorAll('.time-slot').forEach(el => el.classList.remove('active'));
    selectedTime = null;
    updateSubmitButton();
    haptic('success');
}

document.addEventListener('DOMContentLoaded', () => {
    initTelegram();

    const phoneEl = document.getElementById('bookPhone');
    if (phoneEl) {
        phoneEl.addEventListener('input', function() {
            this.value = formatPhone(this.value);
        });
    }

    setTimeout(() => {
        const loader = document.getElementById('loading');
        if (loader) loader.classList.add('hidden');
        animateNumbers();
    }, 600);
});