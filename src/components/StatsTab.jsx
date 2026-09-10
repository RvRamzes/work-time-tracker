import React, { useState, useEffect, useRef } from 'react';

export default function StatsTab({ sessions = [] }) {
  // 1. Вкладиші: 'monthly' (Місячний звіт) або 'analytics' (Аналітика)
  const [viewMode, setViewMode] = useState('monthly');

  // Стейт дати
  const [currentDate, setCurrentDate] = useState(new Date());

  // Стейт випадаючого календаря для швидкого вибору місяця
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [pickerYear, setPickerYear] = useState(currentDate.getFullYear());

  // Стейт акордеона Біржі
  const [isBirzhaOpen, setIsBirzhaOpen] = useState(false);

  // Реф для закриття календаря при кліку зовні
  const pickerRef = useRef(null);

  // Ключі для збереження авансу та зарплати під кожен місяць окремо
  const monthKey = `${currentDate.getFullYear()}_${currentDate.getMonth()}`;

  // Початкові значення — порожні строки
  const [avans, setAvans] = useState('');
  const [zarplata, setZarplata] = useState('');

  // Синхронізація авансу та зарплати при зміні вибраного місяця
  useEffect(() => {
    const savedAvans = localStorage.getItem(`stat_avans_${monthKey}`);
    const savedZarplata = localStorage.getItem(`stat_zarplata_${monthKey}`);

    setAvans(savedAvans !== null ? savedAvans : '');
    setZarplata(savedZarplata !== null ? savedZarplata : '');
  }, [monthKey]);

  // Закриття календаря при кліку поза ним
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setShowMonthPicker(false);
      }
    };
    if (showMonthPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMonthPicker]);

  const ROLE_MAP = {
    vto: { title: '🛠️ Магістр обліку (Основна)', rate: 165 },
    sales: { title: '🛍️ Капітан Залу', rate: 220 },
    loader: { title: '💪 Логіст', rate: 220.91 }
  };

  const monthNames = [
    'Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
    'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'
  ];

  // Форматування чисел з пробілом тисяч та комою для дробової частини
  const formatNumber = (num, decimals = 2) => {
    const n = parseFloat(num);
    if (isNaN(n)) return '0,00';
    return n.toLocaleString('uk-UA', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleSelectMonth = (monthIndex) => {
    setCurrentDate(new Date(pickerYear, monthIndex, 1));
    setShowMonthPicker(false);
  };

  const handleAvansChange = (e) => {
    const val = e.target.value;
    setAvans(val);
    localStorage.setItem(`stat_avans_${monthKey}`, val);
  };

  const handleZarplataChange = (e) => {
    const val = e.target.value;
    setZarplata(val);
    localStorage.setItem(`stat_zarplata_${monthKey}`, val);
  };

  // Розрахунок сесій за вибраний місяць
  const getFilteredSessions = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    return sessions.filter(s => {
      const rawDate = s.endTime || s.startTime;
      if (!rawDate) return false;
      const sessionDate = new Date(rawDate);
      if (isNaN(sessionDate.getTime())) return false;
      return sessionDate.getFullYear() === year && sessionDate.getMonth() === month;
    });
  };

  const calculateEarnings = () => {
    const filteredSessions = getFilteredSessions();
    let totalMinutes = 0;
    let mainHours = 0;
    const exchangeRoles = {};

    filteredSessions.forEach(s => {
      const duration = Number(s.duration) || 0;
      totalMinutes += duration;

      const hours = duration / 60;
      if (s.type === 'regular' || !s.type) {
        mainHours += hours;
      } else if (s.type === 'exchange') {
        const roleKey = s.role || 'sales';
        if (!exchangeRoles[roleKey]) {
          exchangeRoles[roleKey] = 0;
        }
        exchangeRoles[roleKey] += hours;
      }
    });

    const totalHoursNum = totalMinutes / 60;
    const hoursPart = Math.floor(totalMinutes / 60);
    const minsPart = Math.round(totalMinutes % 60);

    const planHours = 176;
    const progressPercent = Math.min(100, Math.round((totalHoursNum / planHours) * 100));
    const remainMins = Math.max(0, (planHours * 60) - totalMinutes);
    const remainHoursPart = Math.floor(remainMins / 60);
    const remainMinsPart = Math.round(remainMins % 60);

    const mainTotal = mainHours * ROLE_MAP.vto.rate;
    let exchangeTotal = 0;

    const exchangeDetails = Object.keys(exchangeRoles).map(roleKey => {
      const hours = exchangeRoles[roleKey];
      const roleInfo = ROLE_MAP[roleKey] || { title: roleKey, rate: 220 };
      const sum = hours * roleInfo.rate;
      exchangeTotal += sum;
      return {
        key: roleKey,
        title: roleInfo.title,
        rate: roleInfo.rate,
        hours: hours.toFixed(1),
        sumFormatted: formatNumber(sum, 2)
      };
    });

    const grandTotal = mainTotal + exchangeTotal;
    const parsedAvans = parseFloat(String(avans).replace(',', '.')) || 0;
    const parsedZarplata = parseFloat(String(zarplata).replace(',', '.')) || 0;
    const totalReceived = parsedAvans + parsedZarplata;
    const balance = grandTotal - totalReceived;

    return {
      formattedTotalTime: `${hoursPart} год ${minsPart} хв`,
      progressPercent,
      planHours,
      remainTimeText: `${remainHoursPart}г ${remainMinsPart}хв`,
      mainHours: mainHours.toFixed(1),
      mainTotalFormatted: formatNumber(mainTotal, 2),
      exchangeTotalFormatted: formatNumber(exchangeTotal, 2),
      exchangeDetails,
      grandTotalFormatted: formatNumber(grandTotal, 2),
      totalReceivedFormatted: formatNumber(totalReceived, 2),
      balanceRaw: balance,
      balanceFormatted: formatNumber(Math.abs(balance), 2)
    };
  };

  const data = calculateEarnings();

  // Статистика за N днів для вкладки "Аналітика"
  const getStats = (days) => {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const filtered = sessions.filter(s => {
      const rawDate = s.endTime || s.startTime;
      if (!rawDate) return false;
      const t = new Date(rawDate).getTime();
      return !isNaN(t) && t > cutoff;
    });

    let reg = 0, exc = 0;
    filtered.forEach(s => {
      const dur = Number(s.duration) || 0;
      if (s.type === 'regular' || !s.type) {
        reg += dur;
      } else {
        exc += dur;
      }
    });

    return {
      regular: (reg / 60).toFixed(1),
      exchange: (exc / 60).toFixed(1),
      total: ((reg + exc) / 60).toFixed(1),
      count: filtered.length
    };
  };

  const analyticsBlocks = [
    { label: '📆 Звіт за останні 7 днів', data: getStats(7), color: 'var(--primary-color, #3b82f6)' },
    { label: '📅 Звіт за останні 30 днів', data: getStats(30), color: 'var(--exchange-color, #ffb400)' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', position: 'relative' }}>
      
      {/* 🔘 КНОПКИ ПЕРЕМИКАННЯ: МІСЯЧНИЙ ЗВІТ / АНАЛІТИКА */}
      <div style={{
        display: 'flex',
        background: 'var(--bg-card, #1e1e1e)',
        borderRadius: '12px',
        padding: '3px',
        border: '1px solid var(--border-color, #2d2d2d)'
      }}>
        <button
          type="button"
          onClick={() => setViewMode('monthly')}
          style={{
            flex: 1,
            padding: '8px 0',
            fontSize: '13px',
            fontWeight: 'bold',
            borderRadius: '9px',
            border: 'none',
            background: viewMode === 'monthly' ? 'var(--primary-color, #3b82f6)' : 'transparent',
            color: viewMode === 'monthly' ? '#fff' : 'var(--text-muted, #888)',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          📊 Місячний звіт
        </button>
        <button
          type="button"
          onClick={() => setViewMode('analytics')}
          style={{
            flex: 1,
            padding: '8px 0',
            fontSize: '13px',
            fontWeight: 'bold',
            borderRadius: '9px',
            border: 'none',
            background: viewMode === 'analytics' ? 'var(--primary-color, #3b82f6)' : 'transparent',
            color: viewMode === 'analytics' ? '#fff' : 'var(--text-muted, #888)',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          📈 Аналітика (7/30 дн)
        </button>
      </div>

      {/* РЕЖИМ 1: МІСЯЧНИЙ ЗВІТ */}
      {viewMode === 'monthly' && (
        <>
          {/* ФІЛЬТР МІСЯЦЯ ТА КНОПКА ВИБОРУ МІСЯЦЯ */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', position: 'relative' }}>
            <div style={{
              flex: 1,
              background: 'var(--bg-card, #1e1e1e)',
              border: '1px solid var(--border-color, #2d2d2d)',
              borderRadius: '10px',
              padding: '6px 12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span 
                onClick={handlePrevMonth}
                style={{ color: 'var(--primary-color, #60a5fa)', fontWeight: 'bold', cursor: 'pointer', padding: '0 8px', fontSize: '16px' }}
              >
                ◂
              </span>
              <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-main, #fff)' }}>
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </span>
              <span 
                onClick={handleNextMonth}
                style={{ color: 'var(--primary-color, #60a5fa)', fontWeight: 'bold', cursor: 'pointer', padding: '0 8px', fontSize: '16px' }}
              >
                ▸
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                setPickerYear(currentDate.getFullYear());
                setShowMonthPicker(!showMonthPicker);
              }}
              style={{
                background: showMonthPicker ? 'var(--primary-color, #3b82f6)' : 'var(--bg-card, #1e1e1e)',
                border: showMonthPicker ? '1px solid var(--primary-color, #60a5fa)' : '1px solid var(--border-color, #2d2d2d)',
                borderRadius: '10px',
                padding: '8px 14px',
                fontSize: '12px',
                fontWeight: '600',
                color: showMonthPicker ? '#fff' : 'var(--text-muted, #888)',
                cursor: 'pointer'
              }}
            >
              📅 Місяць
            </button>
          </div>

          {/* ВИПАДАЮЧИЙ КАЛЕНДАР (PICKER) */}
          {showMonthPicker && (
            <div 
              ref={pickerRef}
              style={{
                background: 'var(--bg-card, #18181b)',
                border: '1px solid var(--border-color, #3f3f46)',
                borderRadius: '12px',
                padding: '12px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                position: 'absolute',
                top: '90px',
                right: '0',
                left: '0',
                zIndex: 10
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color, #27272a)', paddingBottom: '8px' }}>
                <span 
                  onClick={() => setPickerYear(prev => prev - 1)}
                  style={{ cursor: 'pointer', color: 'var(--primary-color, #60a5fa)', fontWeight: 'bold', padding: '0 6px' }}
                >
                  ◂
                </span>
                <span style={{ fontWeight: 'bold', color: 'var(--text-main, #fff)', fontSize: '14px' }}>{pickerYear} рік</span>
                <span 
                  onClick={() => setPickerYear(prev => prev + 1)}
                  style={{ cursor: 'pointer', color: 'var(--primary-color, #60a5fa)', fontWeight: 'bold', padding: '0 6px' }}
                >
                  ▸
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                {monthNames.map((m, idx) => {
                  const isSelected = currentDate.getFullYear() === pickerYear && currentDate.getMonth() === idx;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => handleSelectMonth(idx)}
                      style={{
                        background: isSelected ? 'var(--primary-color, #3b82f6)' : 'var(--bg-input, #27272a)',
                        color: isSelected ? '#fff' : 'var(--text-main, #d4d4d8)',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '8px 4px',
                        fontSize: '11px',
                        fontWeight: isSelected ? 'bold' : 'normal',
                        cursor: 'pointer'
                      }}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 1. РОБОЧІ ГОДИНИ */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted, #94a3b8)', fontWeight: 700, textTransform: 'uppercase' }}>
                ⏱️ Робочі години
              </span>
              <span style={{ fontSize: '10px', color: '#22c55e', fontWeight: 700 }}>
                {data.progressPercent}% виконання
              </span>
            </div>

            <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-main, #ffffff)', marginBottom: '8px' }}>
              {data.formattedTotalTime}
            </div>

            <div style={{ background: 'var(--bg-input, #2a2a2a)', height: '5px', borderRadius: '3px', overflow: 'hidden', margin: '4px 0' }}>
              <div style={{ background: 'var(--primary-color, #3b82f6)', height: '100%', width: `${data.progressPercent}%` }}></div>
            </div>

            <div style={{ fontSize: '9px', color: 'var(--text-muted, #71717a)', display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
              <span>План: {data.planHours} год</span>
              <span>Залишилось: {data.remainTimeText}</span>
            </div>
          </div>

          {/* 2. НАРАХОВАНИЙ ЗАРОБІТОК */}
          <div className="card" style={{ borderColor: 'rgba(34, 197, 94, 0.3)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted, #94a3b8)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
              💰 Нарахований Заробіток
            </div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#22c55e', marginBottom: '10px' }}>
              {data.grandTotalFormatted} ₴
            </div>

            {/* Основна зміна */}
            <div style={{
              background: 'var(--bg-input, #161616)',
              border: '1px solid var(--border-color, #262626)',
              borderRadius: '9px',
              padding: '8px 10px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
              boxSizing: 'border-box'
            }}>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-main, #e2e8f0)' }}>
                  {ROLE_MAP.vto.title}
                </div>
                <div style={{ fontSize: '9px', color: 'var(--text-muted, #71717a)', marginTop: '2px' }}>
                  {data.mainHours} год × {ROLE_MAP.vto.rate} ₴/год
                </div>
              </div>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#22c55e', whiteSpace: 'nowrap', marginLeft: 'auto' }}>
                {data.mainTotalFormatted} ₴
              </div>
            </div>

            {/* Зміни Біржі */}
            <div 
              onClick={() => setIsBirzhaOpen(!isBirzhaOpen)}
              style={{
                background: 'transparent',
                border: '1px solid var(--exchange-color, #eab308)',
                borderRadius: '10px',
                padding: '8px 10px',
                marginTop: '8px',
                cursor: 'pointer',
                width: '100%',
                boxSizing: 'border-box'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--exchange-color, #eab308)' }}>
                    ⚡ Зміни Біржі
                  </span>
                  <span style={{ fontSize: '10px', color: 'var(--exchange-color, #eab308)' }}>
                    {isBirzhaOpen ? '▲' : '▼'}
                  </span>
                </div>
                <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--exchange-color, #eab308)', whiteSpace: 'nowrap', marginLeft: 'auto' }}>
                  {data.exchangeTotalFormatted} ₴
                </div>
              </div>

              {isBirzhaOpen && (
                <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px dashed rgba(234, 179, 8, 0.25)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {data.exchangeDetails.length > 0 ? (
                    data.exchangeDetails.map((item) => (
                      <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--exchange-color, #fde68a)' }}>
                            {item.title}
                          </div>
                          <div style={{ fontSize: '9px', color: 'var(--text-muted, #a1a1aa)', marginTop: '1px' }}>
                            {item.hours} год × {item.rate} ₴/год
                          </div>
                        </div>
                        <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--exchange-color, #eab308)', whiteSpace: 'nowrap', marginLeft: 'auto' }}>
                          {item.sumFormatted} ₴
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ fontSize: '10px', color: 'var(--text-muted, #888)', textAlign: 'center', padding: '4px 0' }}>
                      За вибраний місяць змін біржі немає
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 3. ФАКТИЧНІ ВИПЛАТИ ТА БАЛАНС */}
          <div className="card" style={{ borderColor: 'rgba(96, 165, 250, 0.3)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted, #94a3b8)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>
              💳 Фактичні виплати та баланс
            </div>

            {/* Аванс */}
            <div style={{
              background: 'var(--bg-input, #161616)',
              border: '1px solid var(--border-color, #262626)',
              borderRadius: '9px',
              padding: '7px 10px',
              marginBottom: '6px',
              display: 'flex',
              justify: 'space-between',
              alignItems: 'center',
              width: '100%',
              boxSizing: 'border-box'
            }}>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-main, #e2e8f0)' }}>🗓️ Аванс (06 числа)</div>
                <div style={{ fontSize: '9px', color: 'var(--text-muted, #71717a)' }}>Отримано на карту</div>
              </div>
              <input 
                type="number" 
                value={avans} 
                placeholder="0 (введіть суму)"
                onChange={handleAvansChange}
                style={{
                  background: 'var(--bg-card, #121212)',
                  border: '1px solid var(--border-color, #333)',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  fontSize: '11px',
                  fontWeight: '700',
                  color: 'var(--primary-color, #38bdf8)',
                  textAlign: 'right',
                  width: '105px',
                  outline: 'none',
                  marginLeft: 'auto'
                }}
              />
            </div>

            {/* Зарплата */}
            <div style={{
              background: 'var(--bg-input, #161616)',
              border: '1px solid var(--border-color, #262626)',
              borderRadius: '9px',
              padding: '7px 10px',
              marginBottom: '8px',
              display: 'flex',
              justify: 'space-between',
              alignItems: 'center',
              width: '100%',
              boxSizing: 'border-box'
            }}>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-main, #e2e8f0)' }}>🗓️ Зарплата (21 числа)</div>
                <div style={{ fontSize: '9px', color: 'var(--text-muted, #71717a)' }}>Отримано на карту</div>
              </div>
              <input 
                type="number" 
                value={zarplata} 
                placeholder="0 (введіть суму)"
                onChange={handleZarplataChange}
                style={{
                  background: 'var(--bg-card, #121212)',
                  border: '1px solid var(--border-color, #333)',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  fontSize: '11px',
                  fontWeight: '700',
                  color: 'var(--primary-color, #38bdf8)',
                  textAlign: 'right',
                  width: '105px',
                  outline: 'none',
                  marginLeft: 'auto'
                }}
              />
            </div>

            {/* Динамічний блок підсумку залежно від стану виплат */}
            {(() => {
              const diff = data.balanceRaw; // Нараховано мінус Отримано

              // 1. Повний розрахунок (різниця 0)
              if (Math.abs(diff) < 0.01) {
                return (
                  <div style={{
                    background: 'rgba(34, 197, 94, 0.08)',
                    border: '1px solid rgba(34, 197, 94, 0.25)',
                    borderRadius: '9px',
                    padding: '8px 10px',
                    display: 'flex',
                    justify: 'space-between',
                    alignItems: 'center',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted, #888)' }}>
                        Всього отримано: <b style={{ color: 'var(--text-main, #fff)' }}>{data.totalReceivedFormatted} ₴</b>
                      </div>
                      <div style={{ fontSize: '11px', fontWeight: 800, color: '#22c55e', marginTop: '2px' }}>
                        ✅ Розраховано повністю
                      </div>
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#22c55e', whiteSpace: 'nowrap', marginLeft: 'auto' }}>
                      0,00 ₴
                    </div>
                  </div>
                );
              }

              // 2. Ще недоотримано (Нараховано більше, ніж отримано)
              if (diff > 0) {
                return (
                  <div style={{
                    background: 'rgba(249, 115, 22, 0.08)',
                    border: '1px solid rgba(249, 115, 22, 0.25)',
                    borderRadius: '9px',
                    padding: '8px 10px',
                    display: 'flex',
                    justify: 'space-between',
                    alignItems: 'center',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted, #888)' }}>
                        Всього отримано: <b style={{ color: 'var(--text-main, #fff)' }}>{data.totalReceivedFormatted} ₴</b>
                      </div>
                      <div style={{ fontSize: '11px', fontWeight: 800, color: '#f97316', marginTop: '2px' }}>
                        ⏳ Залишок до виплати:
                      </div>
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#f97316', whiteSpace: 'nowrap', marginLeft: 'auto' }}>
                      - {data.balanceFormatted} ₴
                    </div>
                  </div>
                );
              }

              // 3. Переплата (Отримано більше, ніж нараховано)
              return (
                <div style={{
                  background: 'rgba(59, 130, 246, 0.08)',
                  border: '1px solid rgba(59, 130, 246, 0.25)',
                  borderRadius: '9px',
                  padding: '8px 10px',
                  display: 'flex',
                  justify: 'space-between',
                  alignItems: 'center',
                  width: '100%',
                  boxSizing: 'border-box'
                }}>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted, #888)' }}>
                      Всього отримано: <b style={{ color: 'var(--text-main, #fff)' }}>{data.totalReceivedFormatted} ₴</b>
                    </div>
                    <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--primary-color, #60a5fa)', marginTop: '2px' }}>
                      ⚠️ Переплата:
                    </div>
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--primary-color, #60a5fa)', whiteSpace: 'nowrap', marginLeft: 'auto' }}>
                    + {data.balanceFormatted} ₴
                  </div>
                </div>
              );
            })()}
          </div>
        </>
      )}

      {/* РЕЖИМ 2: АНАЛІТИКА (7 ТА 30 ДНІВ) */}
      {viewMode === 'analytics' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {analyticsBlocks.map((block, idx) => (
            <div key={idx} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <h4 style={{ color: block.color, fontWeight: 'bold', fontSize: '14px', margin: 0 }}>{block.label}</h4>
                <span style={{ fontSize: '12px', color: 'var(--text-muted, #888)' }}>Змін: {block.data.count}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted, #aaa)' }}>🏢 Основна посада:</span>
                  <strong>{block.data.regular} год</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted, #aaa)' }}>⚡ Зміни Біржі:</span>
                  <strong>{block.data.exchange} год</strong>
                </div>
                <hr style={{ border: '0', borderTop: '1px solid var(--border-color, #333)', margin: '6px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: 'bold', color: '#22c55e' }}>
                  <span>📈 Загалом відпрацьовано:</span>
                  <span>{block.data.total} год</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
