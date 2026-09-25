// Вставте сюди URL, який скопіювали з Apps Script
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzkq18IwE9IkCn9laXcvydXr4odXpibTG1iMAb7EHzNC7fgpEbDMV8Qw3x7oNEFRc3O/exec';
const STORAGE_KEY = 'work_time_shifts'; // Назва вашого ключа в localStorage

// Отримати всі зміни з localStorage
export const getLocalShifts = () => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

// Зберегти нову зміну (спочатку локально, потім спроба в Google)
export const addShift = async (shiftData) => {
  const shifts = getLocalShifts();
  
  const newShift = {
    id: Date.now(),
    date: shiftData.date || new Date().toISOString().split('T')[0],
    startTime: shiftData.startTime,
    endTime: shiftData.endTime,
    duration: shiftData.duration,
    note: shiftData.note || '',
    synced: false // Прапорець синхронізації
  };

  // 1. Одразу зберігаємо в localStorage (Офлайн-First)
  const updatedShifts = [newShift, ...shifts];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedShifts));

  // 2. Якщо є інтернет — пробуємо відправити у таблицю
  if (navigator.onLine) {
    await sendShiftToGoogle(newShift);
  }

  return updatedShifts;
};

// Відправка одного запису в Google Таблицю
const sendShiftToGoogle = async (shift) => {
  try {
    await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors', // Важливо для Google Apps Script
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(shift)
    });

    // Позначаємо як синхронізоване
    markAsSynced(shift.id);
  } catch (error) {
    console.error('Не вдалося відправити в Google Таблицю:', error);
  }
};

// Позначити зміну як synced: true у localStorage
const markAsSynced = (id) => {
  const shifts = getLocalShifts().map(item => 
    item.id === id ? { ...item, synced: true } : item
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(shifts));
};

// Синхронізація всіх невідправлених записів (для фонової роботи)
export const syncPendingShifts = async () => {
  if (!navigator.onLine) return;

  const shifts = getLocalShifts();
  const pending = shifts.filter(item => !item.synced);

  for (const shift of pending) {
    await sendShiftToGoogle(shift);
  }
};
