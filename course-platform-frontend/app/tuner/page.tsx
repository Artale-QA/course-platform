'use client';

import { useEffect, useRef, useState } from 'react';

// Ноты хроматической гаммы
const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Стандартный строй гитары (частота в Гц)
const GUITAR_STRINGS = [
  { note: 'E2', freq: 82.41 },
  { note: 'A2', freq: 110.00 },
  { note: 'D3', freq: 146.83 },
  { note: 'G3', freq: 196.00 },
  { note: 'B3', freq: 246.94 },
  { note: 'E4', freq: 329.63 },
];

const A4_FREQ = 440;
const C0_FREQ = A4_FREQ * Math.pow(2, -4.75); // 16.3516 Гц

// Получить номер полутона от C0
const getSemitoneNumber = (freq: number): number => 12 * Math.log2(freq / C0_FREQ);

// Получить имя ноты с октавой
const getNoteName = (freq: number): string => {
  if (freq <= 0 || !isFinite(freq)) return '—';
  const semitone = getSemitoneNumber(freq);
  const rounded = Math.round(semitone);
  const octave = Math.floor(rounded / 12);
  const noteIndex = ((rounded % 12) + 12) % 12;
  return `${NOTES[noteIndex]}${octave}`;
};

// Отклонение в центах
const getCents = (freq: number): number => {
  if (freq <= 0 || !isFinite(freq)) return 0;
  const semitone = getSemitoneNumber(freq);
  return (semitone - Math.round(semitone)) * 100;
};

// Найти ближайшую гитарную струну
const findClosestString = (freq: number) => {
  if (freq <= 0) return null;
  let minDiff = Infinity;
  let closest = null;
  for (const s of GUITAR_STRINGS) {
    const diff = Math.abs(freq - s.freq);
    if (diff < minDiff) {
      minDiff = diff;
      closest = s;
    }
  }
  return closest;
};

// Улучшенная автокорреляция с нормализацией и интерполяцией
const detectPitch = (buffer: Float32Array, sampleRate: number): number => {
  const bufferSize = buffer.length;
  
  // Проверка уровня сигнала (RMS)
  let rmsSum = 0;
  for (let i = 0; i < bufferSize; i++) rmsSum += buffer[i] * buffer[i];
  const rms = Math.sqrt(rmsSum / bufferSize);
  if (rms < 0.005) return -1;

  // Автокорреляция с нормализацией
  const correlations = new Float32Array(bufferSize);
  let maxCorrValue = 0;
  let maxCorrLag = -1;
  
  // Диапазон поиска: 40 Гц – 1000 Гц
  const minLagValue = Math.floor(sampleRate / 1000);
  const maxLagValue = Math.floor(sampleRate / 40);
  
  for (let lag = minLagValue; lag < maxLagValue; lag++) {
    let sum = 0;
    for (let i = 0; i < bufferSize - lag; i++) {
      sum += buffer[i] * buffer[i + lag];
    }
    // Нормализация
    let sum1 = 0;
    let sum2 = 0;
    for (let i = 0; i < bufferSize - lag; i++) {
      sum1 += buffer[i] * buffer[i];
      sum2 += buffer[i + lag] * buffer[i + lag];
    }
    const norm = Math.sqrt((sum1 * sum2) || 1);
    const corr = sum / norm;
    correlations[lag] = corr;
    if (corr > maxCorrValue) {
      maxCorrValue = corr;
      maxCorrLag = lag;
    }
  }
  
  // Порог корреляции
  if (maxCorrValue < 0.5) return -1;
  
  // Параболическая интерполяция для повышения точности
  const y1 = correlations[maxCorrLag - 1] || 0;
  const y2 = correlations[maxCorrLag];
  const y3 = correlations[maxCorrLag + 1] || 0;
  const delta = (y1 - y3) / (2 * (y1 - 2 * y2 + y3) + 1e-10);
  const betterLag = maxCorrLag + delta;
  
  const freq = sampleRate / betterLag;
  if (freq < 40 || freq > 1000) return -1;
  return freq;
};

export default function GuitarTuner() {
  const [isListening, setIsListening] = useState(false);
  const [permission, setPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [freq, setFreq] = useState<number>(0);
  const [note, setNote] = useState<string>('—');
  const [cents, setCents] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0);
  const [closestString, setClosestString] = useState<typeof GUITAR_STRINGS[0] | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const historyRef = useRef<number[]>([]);

  // Медианный фильтр для сглаживания
  const smooth = (newFreq: number): number => {
    const history = historyRef.current;
    history.push(newFreq);
    if (history.length > 5) history.shift();
    const sorted = [...history].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)];
  };

  const processAudio = () => {
    if (!analyserRef.current || !audioContextRef.current) return;
    
    const analyser = analyserRef.current;
    const buffer = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(buffer);
    
    // Громкость
    let rmsCalc = 0;
    for (let i = 0; i < buffer.length; i++) rmsCalc += buffer[i] * buffer[i];
    rmsCalc = Math.sqrt(rmsCalc / buffer.length);
    setVolume(Math.min(1, rmsCalc * 5));
    
    const detected = detectPitch(buffer, audioContextRef.current.sampleRate);
    
    if (detected > 0) {
      const smoothed = smooth(detected);
      const rounded = Math.round(smoothed * 10) / 10;
      setFreq(rounded);
      setNote(getNoteName(rounded));
      setCents(getCents(rounded));
      setClosestString(findClosestString(rounded));
    } else {
      if (freq !== 0) {
        setFreq(0);
        setNote('—');
        setCents(0);
        setClosestString(null);
        historyRef.current = [];
      }
    }
    
    rafRef.current = requestAnimationFrame(processAudio);
  };

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }
      });
      streamRef.current = stream;
      setPermission('granted');
      
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      sourceRef.current = source;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 4096;
      analyser.smoothingTimeConstant = 0;
      analyserRef.current = analyser;
      source.connect(analyser);
      
      await ctx.resume();
      setIsListening(true);
      processAudio();
    } catch (err) {
      console.error(err);
      setPermission('denied');
    }
  };

  const stop = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (sourceRef.current) sourceRef.current.disconnect();
    if (audioContextRef.current) audioContextRef.current.close();
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    setIsListening(false);
    setFreq(0);
    setNote('—');
    setCents(0);
    setVolume(0);
    setClosestString(null);
    historyRef.current = [];
  };

  useEffect(() => stop, []);

  const status = (() => {
    const abs = Math.abs(cents);
    if (abs <= 3) return { color: '#10b981', emoji: '✅', text: 'Идеально' };
    if (abs <= 10) return { color: '#f59e0b', emoji: '👍', text: 'Хорошо' };
    return cents < 0 
      ? { color: '#ef4444', emoji: '🔻', text: 'Низко (подтяни)' }
      : { color: '#ef4444', emoji: '🔺', text: 'Высоко (ослабь)' };
  })();

  return (
    <div className="tuner">
      <div className="card">
        <h1>🎸 Гитарный тюнер</h1>
        <p className="sub">Алгоритм: автокорреляция + параболическая интерполяция</p>

        {permission === 'prompt' && !isListening && (
          <div className="prompt">
            <div>🎤</div>
            <p>Разрешите доступ к микрофону</p>
            <button onClick={start} className="btn start">Начать настройку</button>
          </div>
        )}

        {permission === 'denied' && (
          <div className="error">
            <div>❌</div>
            <p>Доступ к микрофону запрещён</p>
            <small>Проверьте настройки браузера</small>
          </div>
        )}

        {isListening && (
          <div className="active">
            {/* Индикатор громкости */}
            <div className="volume">
              <div className="volume-bar" style={{ width: `${volume * 100}%` }} />
            </div>

            {/* Гитарные струны */}
            <div className="strings">
              {GUITAR_STRINGS.map((s) => (
                <div
                  key={s.note}
                  className={`string ${closestString?.note === s.note ? 'active' : ''}`}
                  style={{ borderColor: closestString?.note === s.note ? status.color : '#e5e7eb' }}
                >
                  <span>{s.note}</span>
                  <span>{s.freq.toFixed(1)} Гц</span>
                </div>
              ))}
            </div>

            {/* Нота и частота */}
            <div className="note-display">
              <div className="note">{note}</div>
              <div className="freq">{freq > 0 ? `${freq.toFixed(1)} Гц` : '— Гц'}</div>
            </div>

            {/* Шкала центов */}
            <div className="cents-scale">
              <div className="labels">
                <span>-50</span><span>-25</span><span>0</span><span>+25</span><span>+50</span>
              </div>
              <div className="track">
                <div className="gradient" />
                <div className="indicator" style={{ left: `${(cents + 50) / 100 * 100}%`, background: status.color }}>
                  <div className="dot" />
                </div>
              </div>
            </div>

            {/* Статус */}
            <div className="status" style={{ color: status.color }}>
              <span>{status.emoji}</span> {status.text}
            </div>

            {/* Доп. информация */}
            <div className="math">
              <code>f = {freq > 0 ? freq.toFixed(1) : '?'} Гц → {cents > 0 ? '+' : ''}{cents.toFixed(0)}¢</code>
            </div>

            <button onClick={stop} className="btn stop">⏹ Остановить</button>
            <div className="tip">💡 Играйте одну струну. Струна подсветится.</div>
          </div>
        )}
      </div>

      <style jsx>{`
        .tuner {
          min-height: 100vh;
          background: linear-gradient(145deg, #1e1e2f 0%, #2a2a40 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
        }
        .card {
          max-width: 600px;
          width: 100%;
          background: rgba(255,255,255,0.05);
          backdrop-filter: blur(10px);
          border-radius: 2rem;
          padding: 2rem;
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
          border: 1px solid rgba(255,255,255,0.1);
          color: #f0f0f0;
        }
        h1 {
          text-align: center;
          margin-bottom: 0.5rem;
          font-weight: 700;
        }
        .sub {
          text-align: center;
          opacity: 0.7;
          font-size: 0.85rem;
          margin-bottom: 2rem;
        }
        .prompt, .error {
          text-align: center;
          padding: 2rem;
        }
        .btn {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 3rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          margin-top: 1rem;
        }
        .start {
          background: #6366f1;
          color: white;
        }
        .start:hover { background: #4f46e5; transform: scale(1.02); }
        .stop {
          background: #ef4444;
          color: white;
          width: 100%;
        }
        .stop:hover { background: #dc2626; }
        .volume {
          height: 6px;
          background: #3f3f5e;
          border-radius: 3px;
          margin-bottom: 1.5rem;
        }
        .volume-bar {
          height: 100%;
          background: #6366f1;
          border-radius: 3px;
          width: 0%;
          transition: width 0.05s;
        }
        .strings {
          display: flex;
          justify-content: space-between;
          margin-bottom: 2rem;
        }
        .string {
          flex: 1;
          text-align: center;
          padding: 0.5rem 0;
          border-bottom: 3px solid #3f3f5e;
          font-weight: 600;
          transition: border 0.1s;
        }
        .string.active {
          border-bottom-width: 4px;
        }
        .string span {
          display: block;
          font-size: 0.8rem;
        }
        .note-display {
          text-align: center;
          margin-bottom: 1.5rem;
        }
        .note {
          font-size: 5rem;
          font-weight: 800;
          font-family: monospace;
          text-shadow: 0 0 20px rgba(99,102,241,0.5);
        }
        .freq {
          opacity: 0.7;
          font-family: monospace;
        }
        .cents-scale {
          margin: 1.5rem 0;
        }
        .labels {
          display: flex;
          justify-content: space-between;
          font-size: 0.7rem;
          opacity: 0.6;
          padding: 0 0.5rem;
        }
        .track {
          position: relative;
          height: 40px;
          background: #2a2a40;
          border-radius: 20px;
          overflow: hidden;
          margin-top: 0.25rem;
        }
        .gradient {
          position: absolute;
          inset: 0;
          background: linear-gradient(to right, #ef4444, #f59e0b, #10b981, #f59e0b, #ef4444);
        }
        .indicator {
        position: absolute;
        top: 50%;
        transform: translate(-50%, -50%);
        width: 36px;
        height: 36px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 10px rgba(0,0,0,0.5);
        transition: left 0.5s cubic-bezier(0.4, 0, 0.2, 1);  // ← ПЛАВНАЯ АНИМАЦИЯ
        }
        .dot {
          width: 16px;
          height: 16px;
          background: white;
          border-radius: 50%;
        }
        .status {
          text-align: center;
          font-size: 1.25rem;
          font-weight: 600;
          margin: 1rem 0;
        }
        .math {
          background: #1e1e2f;
          border-radius: 2rem;
          padding: 0.75rem;
          text-align: center;
          font-family: monospace;
          margin: 1rem 0;
        }
        .tip {
          margin-top: 1rem;
          font-size: 0.8rem;
          opacity: 0.7;
          text-align: center;
        }
      `}</style>
    </div>
  );
}