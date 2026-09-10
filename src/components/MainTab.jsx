import React, { useState } from 'react';
import { Play, Square, ShoppingBag, Wrench, Armchair, Settings } from 'lucide-react';
import SettingsModal from './SettingsModal';

export const DEFAULT_SETTINGS = {
  mainRoleId: 'vto',
  rates: {
    vto: 165,
    sales: 220,
    loader: 220.91
  }
};

export default function MainTab({ 
  activeSession, 
  shiftType, 
  setShiftType, 
  startWork, 
  elapsedTime, 
  formatTime, 
  lunchMinutes, 
  setLunchMinutes, 
  comment, 
  setComment, 
  endWork,
  selectedRole,
  setSelectedRole
}) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Стейт налаштувань
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('app_settings');
      if (!saved) return DEFAULT_SETTINGS;
      const parsed = JSON.parse(saved);
      return (parsed.rates && parsed.rates.vto) ? parsed : DEFAULT_SETTINGS;
    } catch (e) {
      return DEFAULT_SETTINGS;
    }
  });

  const isExchange = shiftType === 'exchange';

  const toggleExchange = () => {
    const nextType = isExchange ? 'regular' : 'exchange';
    setShiftType(nextType);
    if (nextType === 'regular') {
      setSelectedRole(settings.mainRoleId || 'vto');
    }
  };

  const roles = [
    { id: 'vto', title: 'Магістр обліку', icon: <Wrench size={20} />, activeClass: 'role-vto-active' },
    { id: 'sales', title: 'Капітан Залу', icon: <ShoppingBag size={20} />, activeClass: 'role-sales-active' },
    { id: 'loader', title: 'Логіст', icon: <Armchair size={20} />, activeClass: 'role-loader-active' }
  ];

  const getRoleTitle = (roleId) => {
    switch (roleId) {
      case 'vto': return '🛠️ Магістр обліку';
      case 'sales': return '🛍️ Капітан Залу';
      case 'loader': return '💪 Логіст';
      default: return '🛠️ Магістр обліку';
    }
  };

  const mainRoleObj = roles.find(r => r.id === settings.mainRoleId) || roles[0];

  return (
    <div className={`card ${activeSession ? (activeSession.type === 'exchange' ? 'card-exchange-glow' : 'card-active') : (isExchange ? 'card-exchange-glow' : '')}`}>
      
      {/* 1. ЕКРАН ОЧІКУВАННЯ СТАРТУ */}
      {!activeSession ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '20px', position: 'relative' }}>
            <button 
              type="button"
              onClick={toggleExchange} 
              className={`btn-toggle-single ${isExchange ? 'active-exchange' : ''}`}
              style={{ padding: '6px 16px', fontSize: '13px', width: 'auto' }}
            >
              ⚡ Режим Біржі
            </button>

            <button 
              type="button" 
              onClick={() => setIsSettingsOpen(true)}
              style={{
                position: 'absolute', right: '0',
                background: '#27272a', border: '1px solid #3f3f46', color: '#a1a1aa',
                padding: '7px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center'
              }}
              title="Налаштування ставок та основної посади"
            >
              <Settings size={18} />
            </button>
          </div>

          {!isExchange ? (
            /* ЗВИЧАЙНИЙ РЕЖИМ */
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px' }}>Основна посада (план 176 год):</div>
              <div className={`role-card ${mainRoleObj.id} ${mainRoleObj.activeClass}`} style={{ cursor: 'default', padding: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontWeight: 'bold', fontSize: '16px' }}>
                  {mainRoleObj.icon}
                  <span>{mainRoleObj.title} ({settings.rates[mainRoleObj.id]} ₴/год)</span>
                </div>
              </div>
            </div>
          ) : (
            /* РЕЖИМ БІРЖІ */
            <div className="roles-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              <div style={{ fontSize: '12px', color: 'var(--exchange-color)', fontWeight: 'bold', textAlign: 'center' }}>
                Оберіть посаду для зміни за Біржею:
              </div>
              {roles.map((role) => {
                const isSelected = selectedRole === role.id;
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setSelectedRole(role.id)}
                    className={`role-card ${role.id} ${isSelected ? role.activeClass : ''}`}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {role.icon}
                        <span style={{ fontWeight: '600', fontSize: '15px' }}>{role.title}</span>
                      </div>
                      <span style={{ fontSize: '12px', opacity: 0.8, fontWeight: 'bold' }}>{settings.rates[role.id]} ₴/год</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <button 
            type="button"
            onClick={() => startWork(isExchange ? selectedRole : settings.mainRoleId)} 
            className={`btn-main ${isExchange ? 'btn-start-exchange' : 'btn-start'}`}
          >
            <Play size={18} fill="#fff" /> Старт зміни
          </button>
        </>
      ) : (

        /* 2. ЕКРАН АКТИВНОЇ ЗМІНИ */
        <>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div style={{ 
              color: 'var(--start-green)', 
              fontWeight: 'bold', 
              fontSize: '14px', 
              background: 'rgba(70,167,88,0.1)', 
              padding: '4px 12px', 
              borderRadius: '20px', 
              marginBottom: '12px', 
              display: 'inline-block' 
            }}>
              🟢 ЗМІНА В ПРОЦЕСІ
            </div>
            <div style={{ fontSize: '38px', fontFamily: 'monospace', fontWeight: 'bold', margin: '10px 0' }}>{elapsedTime}</div>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
              <span style={{ color: '#aaa', fontSize: '14px' }}>
                Старт: <strong>{formatTime(activeSession.startTime)}</strong> ({getRoleTitle(activeSession.role)})
              </span>
              {activeSession.type === 'exchange' && (
                <span style={{ 
                  background: 'var(--exchange-color)', 
                  color: '#000', 
                  fontSize: '12px', 
                  fontWeight: 'bold', 
                  padding: '2px 8px', 
                  borderRadius: '6px', 
                  boxShadow: '0 0 8px rgba(234,179,8,0.4)' 
                }}>
                  ⚡ Біржа
                </span>
              )}
            </div>
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <label className="label">☕ Перерва (обід):</label>
            <div className="btn-group">
              <button type="button" onClick={() => setLunchMinutes(0)} className={`btn-toggle ${lunchMinutes === 0 ? 'active' : ''}`}>🙅‍♂️ Без обіду</button>
              <button type="button" onClick={() => setLunchMinutes(30)} className={`btn-toggle ${lunchMinutes === 30 ? 'active' : ''}`}>⏳ 30 хв</button>
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label className="label">💬 Коментар:</label>
            <input type="text" placeholder="Що було зроблено..." value={comment} onChange={(e) => setComment(e.target.value)} className="input-field" />
          </div>

          <button type="button" onClick={endWork} className="btn-main btn-stop">
            <Square size={18} fill="#fff" /> Зупинити та зберегти
          </button>
        </>
      )}

      {/* Модальне вікно налаштувань */}
      {isSettingsOpen && (
        <SettingsModal 
          settings={settings} 
          setSettings={setSettings} 
          roles={roles} 
          onClose={() => setIsSettingsOpen(false)} 
        />
      )}
    </div>
  );
}
