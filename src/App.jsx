import React, { useState, useEffect } from 'react';
import { Clock, Calendar, BarChart2 } from 'lucide-react';

// Імпортуємо наші нові блоки
import MainTab from './components/MainTab';
import HistoryTab from './components/HistoryTab';
import StatsTab from './components/StatsTab';

export default function App() {
  // --- БАЗА ДАНИХ ТА СТАН ---
  const [sessions, setSessions] = useState(() => {
    const saved = localStorage.getItem('work_sessions');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [activeSession, setActiveSession] = useState(() => {
    const saved = localStorage.getItem('active_session');
    return saved ? JSON.parse(saved) : null;
  });

  const [currentTab, setCurrentTab] = useState('main'); 
  const [shiftType, setShiftType] = useState('regular'); 
  
  // Додаємо стан для вибору ролі (за замовчуванням 'sales' - Капітан Залу)
  const [selectedRole, setSelectedRole] = useState('sales');

  const [lunchMinutes, setLunchMinutes] = useState(0);
  const [comment, setComment] = useState('');
  const [elapsedTime, setElapsedTime] = useState('00:00:00');

  const [notification, setNotification] = useState('');
  
  // Стейт для збереження сесії, яка зараз редагується в модальному вікні
  const [editingSession, setEditingSession] = useState(null);

  useEffect(() => {
    localStorage.setItem('work_sessions', JSON.stringify(sessions));
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
  // Модернізуємо startWork, щоб вона записувала і тип, і обрану роль
const startWork = (roleToStart) => {
    if (activeSession) return alert('У вас вже є активна зміна!');
    
    const role = roleToStart || selectedRole;
    
    // Створюємо нову активну сесію
    const newSession = { 
      id: Date.now(), 
      startTime: new Date().toISOString(), 
      type: shiftType, // 'regular' або 'exchange'
      role: role 
    };

    setActiveSession(newSession);
  };

  const endWork = () => {
    if (!activeSession) return;
    const now = new Date();
    const start = new Date(activeSession.startTime);
    const totalMinutes = Math.floor((now - start) / 60000);
    const cleanDuration = Math.max(0, totalMinutes - lunchMinutes);

    setSessions([{
      ...activeSession,
      endTime: now.toISOString(),
      lunch: lunchMinutes,
      duration: cleanDuration,
      comment: comment.trim()
    }, ...sessions]);

    setActiveSession(null);
    setLunchMinutes(0);
    setComment('');
    
    setNotification('✅ Зміну успішно збережено в архів!');
    
    setTimeout(() => {
      setNotification('');
    }, 2000);
  };

  const deleteSession = (id) => {
    if (confirm('Видалити цей запис?')) setSessions(sessions.filter(s => s.id !== id));
  };

  // Нова функція для збереження відредагованої зміни
  const updateSession = (updatedSession) => {
    const start = new Date(updatedSession.startTime);
    const end = new Date(updatedSession.endTime);
    const totalMinutes = Math.floor((end - start) / 60000);
    const cleanDuration = Math.max(0, totalMinutes - Number(updatedSession.lunch));

    const updated = {
      ...updatedSession,
      lunch: Number(updatedSession.lunch),
      duration: cleanDuration,
      comment: updatedSession.comment.trim()
    };

    setSessions(sessions.map(s => s.id === updated.id ? updated : s));
    
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
          background: '#46a758',
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
        <button onClick={() => setCurrentTab('main')} className="nav-btn" style={{ color: currentTab === 'main' ? '#646cff' : '#666' }}><Clock size={20} /> Головна</button>
        <button onClick={() => setCurrentTab('history')} className="nav-btn" style={{ color: currentTab === 'history' ? '#646cff' : '#666' }}><Calendar size={20} /> Історія</button>
        <button onClick={() => setCurrentTab('stats')} className="nav-btn" style={{ color: currentTab === 'stats' ? '#646cff' : '#666' }}><BarChart2 size={20} /> Статистика</button>
      </nav>
    </div>
  );
}