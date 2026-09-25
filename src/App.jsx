import React, { useState, useEffect } from 'react';
import { Clock, Calendar, BarChart2 } from 'lucide-react';

// Імпортуємо вкладки
import MainTab from './components/MainTab';
import HistoryTab from './components/HistoryTab';
import StatsTab from './components/StatsTab';

// Імпортуємо сервіс для роботи з Google Таблицями та localStorage
import { 
  getLocalShifts, 
  sendShiftToGoogle, 
  syncPendingShifts, 
  fetchShiftsFromGoogle 
} from './services/googleSheets';

export default function App() {
  // --- СТАН ТА БАЗА ДАНИХ ---
  const [sessions, setSessions] = useState(() => getLocalShifts());
  
  const [activeSession, setActiveSession] = useState(() => {
    const saved = localStorage.getItem('active_session');
    return saved ? JSON.parse(saved) : null;
  });

  const [currentTab, setCurrentTab] = useState('main'); 
  const [shiftType, setShiftType] = useState('regular'); 
  const [selectedRole, setSelectedRole] = useState('sales');

  const [lunchMinutes, setLunchMinutes] = useState(0);
  const [comment, setComment] = useState('');
  const [elapsedTime, setElapsedTime] = useState('00:00:00');

  const [notification, setNotification] = useState('');
  const [editingSession, setEditingSession] = useState(null);

  // --- СИНХРОНІЗАЦІЯ ПРИ СТАРТІ ТА ВІДНОВЛЕННІ МЕРЕЖІ ---
  useEffect(() => {
    async function initData() {
      // 1. Спроба підтягнути невідправлені локальні дані
      await syncPendingShifts();
      
      // 2. Спроба отримати свіжі дані з Google Таблиці
      const freshShifts = await fetchShiftsFromGoogle();
      setSessions(freshShifts);
    }

    initData();

    // Слухач появи інтернету
    const handleOnline = async () => {
      await syncPendingShifts();
      setSessions(getLocalShifts());
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  // --- СИНХРОНІЗАЦІЯ З LOCALSTORAGE ---
  useEffect(() => {
    localStorage.setItem('work_time_shifts', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem('active_session', JSON.stringify(activeSession));
  }, [activeSession]);

  // --- ЖИВИЙ ТАЙМЕР ---
  useEffect(() => {
    let interval = null;
    if (activeSession) {
      interval = setInterval(() => {
        const start = new Date(activeSession.startTime);
        const now = new Date();
        const diffMs = now - start;
        const hours = Math.floor(diffMs / 3600000).toString().padStart(2, '0');
        const minutes = Math.floor((diffMs % 3600000) / 60000).toString().padStart(2, '0');
        const seconds = Math.floor((diffMs % 60000) / 1000).toString().padStart(2, '0');
        setElapsedTime(`${hours}:${minutes}:${seconds}`);
      }, 1000);
    } else {
      setElapsedTime('00:00:00');
    }
    return () => clearInterval(interval);
  }, [activeSession]);

  // --- ФУНКЦІЇ ЛОГІКИ ---
  const startWork = (roleToStart) => {
    if (activeSession) return alert('У вас вже є активна зміна!');
    
    const role = roleToStart || selectedRole;
    
    const newSession = { 
      id: Date.now(), 
      startTime: new Date().toISOString(), 
      type: shiftType, // 'regular' або 'exchange'
      role: role 
    };

    setActiveSession(newSession);
  };

  const endWork = async () => {
    if (!activeSession) return;
    const now = new Date();
    const start = new Date(activeSession.startTime);
    const totalMinutes = Math.floor((now - start) / 60000);
    const cleanDuration = Math.max(0, totalMinutes - lunchMinutes);

    const completedSession = {
      ...activeSession,
      endTime: now.toISOString(),
      lunch: lunchMinutes,
      duration: cleanDuration,
      comment: comment.trim(),
      synced: false // За замовчуванням ще не синхронізовано
    };

    // 1. Одразу зберігаємо локально
    const updatedSessions = [completedSession, ...sessions];
    setSessions(updatedSessions);

    setActiveSession(null);
    setLunchMinutes(0);
    setComment('');
    
    setNotification('✅ Зміну збережено локально!');

    // 2. Асинхронно відправляємо в Google Таблицю
    if (navigator.onLine) {
      await sendShiftToGoogle(completedSession);
      // Оновлюємо стан після успішної синхронізації (synced стане true)
      setSessions(getLocalShifts());
      setNotification('✅ Зміну успішно збережено в Google Таблицю!');
    }

    setTimeout(() => {
      setNotification('');
    }, 2500);
  };

  const deleteSession = (id) => {
    if (confirm('Видалити цей запис?')) {
      const filtered = sessions.filter(s => s.id !== id);
      setSessions(filtered);
    }
  };

  const updateSession = async (updatedSession) => {
    const start = new Date(updatedSession.startTime);
    const end = new Date(updatedSession.endTime);
    const totalMinutes = Math.floor((end - start) / 60000);
    const cleanDuration = Math.max(0, totalMinutes - Number(updatedSession.lunch));

    const updated = {
      ...updatedSession,
      lunch: Number(updatedSession.lunch),
      duration: cleanDuration,
      comment: updatedSession.comment.trim(),
      synced: false // Позначаємо як невідправлені оновлення
    };

    const newSessions = sessions.map(s => s.id === updated.id ? updated : s);
    setSessions(newSessions);
    
    if (navigator.onLine) {
      await sendShiftToGoogle(updated);
      setSessions(getLocalShifts());
    }

    setNotification('💾 Зміну успішно оновлено!');
    setTimeout(() => {
      setNotification('');
    }, 2000);
  };

  const formatTime = (iso) => iso ? new Date(iso).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' }) : '--:--';
  const formatDate = (iso) => new Date(iso).toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const formatDuration = (mins) => `${Math.floor(mins / 60)} год ${mins % 60} хв`;

  return (
    <div className="app-container">
      {/* КРАСИВЕ СПОВІЩЕННЯ СВЕРХУ ЕКРАНА */}
      {notification && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'var(--start-green)',
          color: '#fff',
          padding: '12px 24px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          zIndex: 1010,
          fontWeight: 'bold',
          fontSize: '14px',
          textAlign: 'center',
          whiteSpace: 'nowrap'
        }}>
          {notification}
        </div>
      )}

      <header className="app-header">
        <h1 className="app-title"><Clock size={22} /> WorkTime</h1>
      </header>

      {/* РЕНДЕР ВКЛАДОК ПО БЛОКАМ */}
      {currentTab === 'main' && (
        <MainTab 
          activeSession={activeSession} 
          shiftType={shiftType} 
          setShiftType={setShiftType} 
          selectedRole={selectedRole}
          setSelectedRole={setSelectedRole}
          startWork={startWork} 
          elapsedTime={elapsedTime} 
          formatTime={formatTime} 
          lunchMinutes={lunchMinutes} 
          setLunchMinutes={setLunchMinutes} 
          comment={comment} 
          setComment={setComment} 
          endWork={endWork} 
        />
      )}

      {currentTab === 'history' && (
        <HistoryTab 
          sessions={sessions} 
          deleteSession={deleteSession} 
          updateSession={updateSession}
          editingSession={editingSession}
          setEditingSession={setEditingSession}
          formatTime={formatTime} 
          formatDate={formatDate} 
          formatDuration={formatDuration} 
        />
      )}

      {currentTab === 'stats' && 
        <StatsTab sessions={sessions} />}

      {/* НИЖНЄ МЕНЮ НАВІГАЦІЇ */}
      <nav className="nav-bar">
        <button 
          onClick={() => setCurrentTab('main')} 
          className="nav-btn" 
          style={{ color: currentTab === 'main' ? 'var(--primary-color)' : '#666' }}
        >
          <Clock size={20} /> Головна
        </button>
        <button 
          onClick={() => setCurrentTab('history')} 
          className="nav-btn" 
          style={{ color: currentTab === 'history' ? 'var(--primary-color)' : '#666' }}
        >
          <Calendar size={20} /> Історія
        </button>
        <button 
          onClick={() => setCurrentTab('stats')} 
          className="nav-btn" 
          style={{ color: currentTab === 'stats' ? 'var(--primary-color)' : '#666' }}
        >
          <BarChart2 size={20} /> Статистика
        </button>
      </nav>
    </div>
  );
}
