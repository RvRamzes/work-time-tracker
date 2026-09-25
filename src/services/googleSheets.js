// Вставте сюди скопійований URL з Google Apps Script
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzkq18IwE9IkCn9laXcvydXr4odXpibTG1iMAb7EHzNC7fgpEbDMV8Qw3x7oNEFRc3O/exec';
const STORAGE_KEY = 'work_time_shifts';

// 1. Отримати локальні дані
export const getLocalShifts = () => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

// 2. Позначити запис як synced: true
const markAsSynced = (id) => {
  const shifts = getLocalShifts().map(item => 
    item.id === id ? { ...item, synced: true } : item
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(shifts));
};

// 3. Відправити один запис у Google Таблицю
export const sendShiftToGoogle = async (shift) => {
  if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL === 'ВАШ_URL_З_APPS_SCRIPT') {
    return;
  }

  try {
    await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(shift)
    });

    markAsSynced(shift.id);
  } catch (error) {
    console.error('Помилка відправки в Google Таблицю:', error);
  }
};

// 4. Додати нову зміну (сумісність з іншими версіями)
export const addShift = async (shiftData) => {
  const shifts = getLocalShifts();
  
  const newShift = {
    id: Date.now(),
    ...shiftData,
    synced: false
  };

  const updatedShifts = [newShift, ...shifts];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedShifts));

  if (navigator.onLine) {
    await sendShiftToGoogle(newShift);
  }

  return updatedShifts;
};

// 5. Фонова синхронізація невідправлених записів
export const syncPendingShifts = async () => {
  if (!navigator.onLine) return;

  const shifts = getLocalShifts();
  const pending = shifts.filter(item => !item.synced);

  for (const shift of pending) {
    await sendShiftToGoogle(shift);
  }
};

// 6. Отримати дані з Google Таблиці (GET)
export const fetchShiftsFromGoogle = async () => {
  if (!navigator.onLine || !GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL === 'ВАШ_URL_З_APPS_SCRIPT') {
    return getLocalShifts();
  }

  try {
    const response = await fetch(GOOGLE_SCRIPT_URL);
    const result = await response.json();

    if (result.status === 'success' && Array.isArray(result.shifts)) {
      const googleShifts = result.shifts;
      const localShifts = getLocalShifts();

      const pendingLocal = localShifts.filter(local => !local.synced);
      
      const combinedMap = new Map();
      googleShifts.forEach(shift => combinedMap.set(String(shift.id), shift));
      pendingLocal.forEach(shift => combinedMap.set(String(shift.id), shift));

      const mergedShifts = Array.from(combinedMap.values()).sort((a, b) => b.id - a.id);

      localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedShifts));
      return mergedShifts;
    }
  } catch (error) {
    console.error('Помилка при зчитуванні з Google Таблиць:', error);
  }

  return getLocalShifts();
};
