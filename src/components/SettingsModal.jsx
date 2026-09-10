import React, { useEffect } from 'react';
import { Settings, X, Check } from 'lucide-react';

export default function SettingsModal({ settings = {}, setSettings, roles = [], onClose }) {

  // Закриття модального вікна при натисканні Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Зміна погодинної ставки
  const handleRateChange = (roleId, value) => {
    const parsedValue = value === '' ? '' : parseFloat(value.replace(',', '.'));
    
    const newSettings = {
      ...settings,
      rates: { 
        ...(settings.rates || {}), 
        [roleId]: isNaN(parsedValue) ? '' : parsedValue 
      }
    };

    setSettings(newSettings);
    localStorage.setItem('app_settings', JSON.stringify(newSettings));
  };

  // Вибір основної посади за кліком на всю картку
  const handleMainRoleSelect = (roleId) => {
    const newSettings = { ...settings, mainRoleId: roleId };
    setSettings(newSettings);
    localStorage.setItem('app_settings', JSON.stringify(newSettings));
  };

  // Закриття при кліку на оверлей
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && onClose) {
      onClose();
    }
  };

  return (
    <div 
      onClick={handleOverlayClick}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0, 0, 0, 0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: '16px'
      }}
    >
      <div style={{
        background: '#18181b', border: '1px solid #3f3f46', borderRadius: '16px',
        padding: '20px', width: '100%', maxWidth: '380px', color: '#fff', boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
      }}>
        
        {/* Заголовок */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ margin: 0, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px', color: '#f4f4f5' }}>
            <Settings size={18} color="#38bdf8" /> Налаштування ставок та посад
          </h3>
          <button 
            type="button" 
            onClick={onClose} 
            style={{ background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Підказка */}
        <div style={{ background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '8px 12px', borderRadius: '8px', fontSize: '11px', color: '#7dd3fc', marginBottom: '14px' }}>
          📌 Оберіть <b>Основну посаду</b> натисканням на картку та вкажіть погодинні ставки.
        </div>

        {/* Список посад */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {roles.map(r => {
            const isMain = settings.mainRoleId === r.id;
            const currentRate = settings.rates?.[r.id] ?? '';

            return (
              <div 
                key={r.id} 
                onClick={() => handleMainRoleSelect(r.id)}
                className={`role-card ${r.id} ${isMain ? (r.activeClass || '') : ''}`}
                style={{ 
                  padding: '10px 12px', 
                  borderRadius: '10px', 
                  display: 'flex', 
                  justify: 'space-between', 
                  alignItems: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  border: isMain ? '1px solid var(--primary-color, #38bdf8)' : '1px solid #27272a',
                  background: isMain ? 'rgba(56, 189, 248, 0.05)' : '#18181b'
                }}
              >
                {/* Ліва частина: Іконка + Назва */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {r.icon}
                  <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
                    {r.title}
                  </span>
                  {isMain && (
                    <span style={{ fontSize: '10px', background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                      Основна
                    </span>
                  )}
                </div>

                {/* Права частина: Поле введення ставки з центруванням */}
                <div 
                  style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <input 
                    type="text"
                    inputMode="decimal"
                    value={currentRate} 
                    onChange={(e) => handleRateChange(r.id, e.target.value)}
                    placeholder="0"
                    style={{ 
                      width: '65px', 
                      background: '#18181b', 
                      border: '1px solid #3f3f46', 
                      color: '#22c55e', 
                      borderRadius: '6px', 
                      padding: '5px', 
                      textAlign: 'center', 
                      fontWeight: 'bold', 
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  />
                  <span style={{ fontSize: '11px', color: '#aaa' }}>₴/г</span>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Кнопка Зберегти (Відцентровано) */}
        <button 
          type="button" 
          onClick={onClose}
          style={{ 
            width: '100%', 
            marginTop: '16px', 
            padding: '10px', 
            background: '#22c55e', 
            color: '#fff', 
            border: 'none', 
            borderRadius: '10px', 
            fontWeight: 'bold', 
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            textAlign: 'center',
            gap: '6px' 
          }}
        >
          <Check size={18} /> Зберегти
        </button>
      </div>
    </div>
  );
}
