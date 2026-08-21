import React from 'react';
import { Settings, X, Check } from 'lucide-react';

export default function SettingsModal({ settings, setSettings, roles, onClose }) {
  const handleRateChange = (roleId, value) => {
    const newSettings = {
      ...settings,
      rates: { ...settings.rates, [roleId]: parseFloat(value) || 0 }
    };
    setSettings(newSettings);
    localStorage.setItem('app_settings', JSON.stringify(newSettings));
  };

  const handleMainRoleChange = (roleId) => {
    const newSettings = { ...settings, mainRoleId: roleId };
    setSettings(newSettings);
    localStorage.setItem('app_settings', JSON.stringify(newSettings));
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '16px'
    }}>
      <div style={{
        background: '#18181b', border: '1px solid #3f3f46', borderRadius: '16px',
        padding: '20px', width: '100%', maxWidth: '380px', color: '#fff', boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ margin: 0, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px', color: '#f4f4f5' }}>
            <Settings size={18} color="#38bdf8" /> Налаштування ставок та посад
          </h3>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '8px 12px', borderRadius: '8px', fontSize: '11px', color: '#7dd3fc', marginBottom: '14px' }}>
          📌 <b>Основна посада</b> запускається у звичайному режимі за замовчуванням (план 176 год).
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {roles.map(r => {
            const isMain = settings.mainRoleId === r.id;
            return (
              <div 
                key={r.id} 
                style={{ 
                  background: isMain ? 'rgba(59, 130, 246, 0.12)' : '#27272a', 
                  border: isMain ? '1px solid #3b82f6' : '1px solid #3f3f46',
                  padding: '10px 12px', borderRadius: '10px', display: 'flex', 
                  justifyContent: 'space-between', // <-- Ось цей рядок розтягує елементи по краях
                  alignItems: 'center'
                }}
              >
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', color: isMain ? '#60a5fa' : '#f4f4f5' }}>
                  <input 
                    type="radio" 
                    name="mainRole" 
                    checked={isMain} 
                    onChange={() => handleMainRoleChange(r.id)} 
                    style={{ accentColor: '#3b82f6', width: '15px', height: '15px' }}
                  />
                  <span>{r.title}</span>
                  {isMain && <span style={{ fontSize: '10px', background: '#2563eb', color: '#fff', padding: '1px 5px', borderRadius: '4px' }}>Основна</span>}
                </label>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input 
                    type="number" 
                    value={settings.rates[r.id]} 
                    onChange={(e) => handleRateChange(r.id, e.target.value)}
                    style={{ width: '65px', background: '#18181b', border: '1px solid #3f3f46', color: '#22c55e', borderRadius: '6px', padding: '5px', textAlign: 'right', fontWeight: 'bold', fontSize: '13px' }}
                  />
                  <span style={{ fontSize: '11px', color: '#888' }}>₴/г</span>
                </div>
              </div>
            );
          })}
        </div>
        
        <button 
          type="button" 
          onClick={onClose}
          style={{ width: '100%', marginTop: '16px', padding: '10px', background: '#22c55e', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
        >
          <Check size={18} /> Зберегти
        </button>
      </div>
    </div>
  );
}