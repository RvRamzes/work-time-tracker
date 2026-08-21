import React, { useState } from 'react';
import { Calendar, List, ChevronLeft, ChevronRight, Edit, Trash2, X, Check } from 'lucide-react';

export default function HistoryTab({ 
  sessions, 
  deleteSession, 
  updateSession, 
  editingSession, 
  setEditingSession, 
  formatTime, 
  formatDate, 
  formatDuration 
}) {
  const [viewMode, setViewMode] = useState('calendar');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState(new Date().toDateString());

  const [editFields, setEditFields] = useState(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const startDayOffset = firstDay === 0 ? 6 : firstDay - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthNames = ["Січень", "Лютий", "Березень", "Квітень", "Травень", "Червень", "Липень", "Серпень", "Вересень", "Жовтень", "Листопад", "Грудень"];
  const daysOfWeek = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"];

  const cells = [];
  for (let i = 0; i < startDayOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  const selectedSessions = sessions.filter(s => new Date(s.startTime).toDateString() === selectedDateStr);

  const handleStartEdit = (session) => {
    setEditingSession(session);
    const toDatetimeLocal = (iso) => {
      if (!iso) return '';
      const d = new Date(iso);
      const pad = (n) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    setEditFields({
      ...session,
      role: session.role || 'sales',
      type: session.type || 'regular',
      startTimeLocal: toDatetimeLocal(session.startTime),
      endTimeLocal: toDatetimeLocal(session.endTime)
    });
  };

  const handleSaveEdit = () => {
    if (!editFields) return;
    
    updateSession({
      ...editingSession,
      type: editFields.type,
      role: editFields.role,
      startTime: new Date(editFields.startTimeLocal).toISOString(),
      endTime: new Date(editFields.endTimeLocal).toISOString(),
      lunch: Number(editFields.lunch),
      comment: editFields.comment
    });

    setEditingSession(null);
    setEditFields(null);
  };

  return (
    <div>
      {/* ПЕРЕМИКАЧ ВИДУ */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '18px', margin: 0 }}>Архів записів</h3>
        <div style={{ display: 'flex', background: '#222', borderRadius: '8px', padding: '2px', border: '1px solid #333' }}>
          <button onClick={() => setViewMode('calendar')} style={{ background: viewMode === 'calendar' ? '#333' : 'none', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}><Calendar size={14} /> Календар</button>
          <button onClick={() => setViewMode('list')} style={{ background: viewMode === 'list' ? '#333' : 'none', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}><List size={14} /> Списком</button>
        </div>
      </div>

      {viewMode === 'calendar' ? (
        <div>
          <div className="card" style={{ padding: '14px', marginBottom: '16px' }}>
            <div className="calendar-header">
              <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} style={{ background: '#2a2a2a', border: 'none', color: '#fff', padding: '6px', borderRadius: '6px', cursor: 'pointer' }}><ChevronLeft size={18} /></button>
              <span style={{ fontWeight: 'bold' }}>{monthNames[month]} {year}</span>
              <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} style={{ background: '#2a2a2a', border: 'none', color: '#fff', padding: '6px', borderRadius: '6px', cursor: 'pointer' }}><ChevronRight size={18} /></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', fontWeight: 'bold', fontSize: '12px', color: '#666', marginBottom: '8px' }}>
              {daysOfWeek.map(d => <div key={d}>{d}</div>)}
            </div>
            <div className="calendar-grid">
              {cells.map((date, idx) => {
                if (!date) return <div key={`empty-${idx}`}></div>;
                const isSelected = date.toDateString() === selectedDateStr;
                
                const daySessions = sessions.filter(s => new Date(s.startTime).toDateString() === date.toDateString());
                const hasData = daySessions.length > 0;
                
                const hasExchange = daySessions.some(s => s.type === 'exchange');
                const hasRegular = daySessions.some(s => s.type === 'regular');

                let dataTypeClass = '';
                if (hasExchange && hasRegular) {
                  dataTypeClass = 'has-data-mixed'; 
                } else if (hasExchange) {
                  dataTypeClass = 'has-data-exchange'; 
                } else if (hasRegular) {
                  dataTypeClass = 'has-data-regular'; 
                }

                const totalHours = daySessions.reduce((sum, s) => {
                  const formatted = formatDuration(s.duration);
                  const match = formatted.match(/(\d+)\s*год/);
                  const hours = match ? parseInt(match[1], 10) : 0;
                  
                  const minMatch = formatted.match(/(\d+)\s*хв/);
                  const minutes = minMatch ? parseInt(minMatch[1], 10) : 0;
                  const fraction = minutes / 60;

                  return sum + hours + fraction;
                }, 0);

                const displayHours = totalHours > 0 ? (totalHours % 1 === 0 ? totalHours : totalHours.toFixed(1)) : 0;

                return (
                  <button 
                    key={date.getTime()} 
                    onClick={() => setSelectedDateStr(date.toDateString())} 
                    className={`calendar-day-btn ${isSelected ? 'selected' : ''} ${dataTypeClass}`}
                    style={{ position: 'relative', paddingBottom: '14px' }}
                  >
                    <span style={{ display: 'block', marginTop: '2px', fontSize: '13px' }}>{date.getDate()}</span>
                    
                    {hasData && !isSelected && displayHours > 0 && (
                      <span 
                        className="hours-badge" 
                        style={{ 
                          position: 'absolute',
                          bottom: '3px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          fontSize: '11px',
                          fontWeight: '700',
                          color: hasExchange && hasRegular ? '#fff' : (hasExchange ? '#ffb400' : '#46a758'),
                          lineHeight: 1,
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {displayHours}г
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <h4 style={{ fontSize: '14px', color: '#aaa', marginBottom: '10px' }}>Записи за {new Date(selectedDateStr).toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit' })}:</h4>
          {selectedSessions.length === 0 ? (
            <p style={{ color: '#555', textAlign: 'center', padding: '20px 0', fontSize: '14px' }}>У цей день записів немає.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {selectedSessions.map(s => <SessionCard key={s.id} s={s} onEdit={handleStartEdit} onDelete={deleteSession} formatTime={formatTime} formatDate={formatDate} formatDuration={formatDuration} />)}
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {sessions.length === 0 ? <p style={{ color: '#555', textAlign: 'center', padding: '20px' }}>База порожня.</p> : sessions.map(s => <SessionCard key={s.id} s={s} onEdit={handleStartEdit} onDelete={deleteSession} formatTime={formatTime} formatDate={formatDate} formatDuration={formatDuration} />)}
        </div>
      )}

      {/* МОДАЛЬНЕ ВІКНО РЕДАГУВАННЯ */}
      {editingSession && editFields && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: '16px'
        }}>
          <div className="card" style={{
            width: '100%',
            maxWidth: '400px',
            padding: '20px',
            background: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h4 style={{ margin: 0, fontSize: '16px' }}>🛠️ Редагувати зміну</h4>
              <button onClick={() => { setEditingSession(null); setEditFields(null); }} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {/* Окрема кнопка-перемикач для Біржі */}
            <div style={{ marginBottom: '14px' }}>
              <button 
                type="button"
                onClick={() => setEditFields({ 
                  ...editFields, 
                  type: editFields.type === 'exchange' ? 'regular' : 'exchange' 
                })}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid',
                  cursor: 'pointer',
                  background: editFields.type === 'exchange' ? 'rgba(255, 180, 0, 0.15)' : '#222',
                  borderColor: editFields.type === 'exchange' ? '#ffb400' : '#333',
                  color: editFields.type === 'exchange' ? '#ffb400' : '#888',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease'
                }}
              >
                ⚡ {editFields.type === 'exchange' ? 'Зміна Біржі (Активно)' : 'Позначити як Біржу'}
              </button>
            </div>

            {/* Вибір ролі */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '6px' }}>Роль у зміні</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                <button 
                  type="button"
                  onClick={() => setEditFields({ ...editFields, role: 'sales' })}
                  style={{
                    padding: '8px 4px',
                    fontSize: '11px',
                    borderRadius: '6px',
                    border: '1px solid',
                    cursor: 'pointer',
                    background: editFields.role === 'sales' ? 'rgba(34, 197, 94, 0.2)' : '#222',
                    borderColor: editFields.role === 'sales' ? '#22c55e' : '#333',
                    color: editFields.role === 'sales' ? '#22c55e' : '#888',
                    fontWeight: 'bold'
                  }}
                >🛍️ Капітан</button>
                <button 
                  type="button"
                  onClick={() => setEditFields({ ...editFields, role: 'vto' })}
                  style={{
                    padding: '8px 4px',
                    fontSize: '11px',
                    borderRadius: '6px',
                    border: '1px solid',
                    cursor: 'pointer',
                    background: editFields.role === 'vto' ? 'rgba(129, 140, 248, 0.2)' : '#222',
                    borderColor: editFields.role === 'vto' ? '#818cf8' : '#333',
                    color: editFields.role === 'vto' ? '#818cf8' : '#888',
                    fontWeight: 'bold'
                  }}
                >🛠️ Магістр</button>
                <button 
                  type="button"
                  onClick={() => setEditFields({ ...editFields, role: 'loader' })}
                  style={{
                    padding: '8px 4px',
                    fontSize: '11px',
                    borderRadius: '6px',
                    border: '1px solid',
                    cursor: 'pointer',
                    background: editFields.role === 'loader' ? 'rgba(251, 146, 60, 0.2)' : '#222',
                    borderColor: editFields.role === 'loader' ? '#fb923c' : '#333',
                    color: editFields.role === 'loader' ? '#fb923c' : '#888',
                    fontWeight: 'bold'
                  }}
                >💪 Логіст</button>
              </div>
            </div>

            {/* Час початку */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '4px' }}>Початок роботи</label>
              <input 
                type="datetime-local" 
                value={editFields.startTimeLocal}
                onChange={(e) => setEditFields({ ...editFields, startTimeLocal: e.target.value })}
                className="input-field"
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </div>

            {/* Час кінця */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '4px' }}>Кінець роботи</label>
              <input 
                type="datetime-local" 
                value={editFields.endTimeLocal}
                onChange={(e) => setEditFields({ ...editFields, endTimeLocal: e.target.value })}
                className="input-field"
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </div>

            {/* Перерва */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '6px' }}>Перерва на обід: {editFields.lunch} хв</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button type="button" onClick={() => setEditFields({ ...editFields, lunch: 0 })} style={{ padding: '8px', background: editFields.lunch === 0 ? '#333' : '#222', border: '1px solid #444', color: '#fff', borderRadius: '6px', cursor: 'pointer' }}>Без обіду (0 хв)</button>
                <button type="button" onClick={() => setEditFields({ ...editFields, lunch: 30 })} style={{ padding: '8px', background: editFields.lunch === 30 ? '#333' : '#222', border: '1px solid #444', color: '#fff', borderRadius: '6px', cursor: 'pointer' }}>30 хвилин</button>
              </div>
            </div>

            {/* Коментар */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '4px' }}>Коментар до зміни</label>
              <input 
                type="text" 
                value={editFields.comment}
                onChange={(e) => setEditFields({ ...editFields, comment: e.target.value })}
                placeholder="Що було зроблено..."
                className="input-field"
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </div>

            {/* Кнопки збереження */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                type="button"
                onClick={() => { setEditingSession(null); setEditFields(null); }}
                style={{ flex: 1, padding: '12px', background: '#222', border: '1px solid #333', color: '#999', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
              >Скасувати</button>
              <button 
                type="button"
                onClick={handleSaveEdit}
                style={{ flex: 1, padding: '12px', background: '#646cff', border: 'none', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
              ><Check size={16} /> Зберегти</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Компонент окремої картки збереженої зміни
function SessionCard({ s, onEdit, onDelete, formatTime, formatDate, formatDuration }) {
  const getRoleBadge = (role) => {
    switch (role) {
      case 'vto':
        return { name: '🛠️ Магістр обліку', color: '#818cf8', bg: 'rgba(129, 140, 248, 0.15)' };
      case 'loader':
        return { name: '💪 Логіст', color: '#fb923c', bg: 'rgba(251, 146, 60, 0.15)' };
      case 'sales': default:
        return { name: '🛍️ Капітан Залу', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.15)' };
    }
  };

  const roleInfo = getRoleBadge(s.role);
  const isExchange = s.type === 'exchange';

  return (
    <div style={{ 
      background: '#222', 
      padding: '16px', 
      borderRadius: '10px', 
      border: isExchange ? '1px solid #eab308' : '1px solid #333', 
      boxShadow: isExchange ? '0 0 10px rgba(234, 179, 8, 0.15)' : 'none',
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center' 
    }}>
      <div style={{ flex: 1, marginRight: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 'bold' }}>{formatDate(s.startTime)}</span>
          
          {/* Бейдж ролі */}
          <span style={{ 
            fontSize: '11px', 
            padding: '2px 8px', 
            background: roleInfo.bg, 
            borderRadius: '4px', 
            color: roleInfo.color,
            fontWeight: 'bold' 
          }}>
            {roleInfo.name}
          </span>

          {/* Плашка Біржі */}
          {isExchange && (
            <span style={{ 
              fontSize: '11px', 
              padding: '2px 8px', 
              background: '#eab308', 
              borderRadius: '4px', 
              color: '#000',
              fontWeight: 'bold',
              boxShadow: '0 0 6px rgba(234, 179, 8, 0.4)'
            }}>
              ⚡ Біржа
            </span>
          )}
        </div>

        <div style={{ fontSize: '13px', color: '#aaa', display: 'flex', gap: '12px', marginBottom: '4px' }}>
          <span>🕒 {formatTime(s.startTime)} - {formatTime(s.endTime)}</span>
          <span>☕ Обід: {s.lunch} хв</span>
        </div>

        <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#46a758' }}>
          Тривалість зміни: {formatDuration(s.duration)}
        </div>

        {s.comment && (
          <div style={{ fontSize: '13px', color: '#777', fontStyle: 'italic', marginTop: '6px', background: '#1a1a1a', padding: '6px', borderRadius: '4px' }}>
            💬 {s.comment}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button onClick={() => onEdit(s)} style={{ background: '#2a2a2a', border: '1px solid #444', color: '#aaa', cursor: 'pointer', padding: '8px', borderRadius: '6px' }}>
          <Edit size={16} />
        </button>
        <button onClick={() => onDelete(s.id)} style={{ background: 'rgba(229,72,77,0.1)', border: '1px solid rgba(229,72,77,0.2)', color: '#e5484d', cursor: 'pointer', padding: '8px', borderRadius: '6px' }}>
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}