'use client';

import React, { useState, useMemo } from 'react';
import { Chord } from 'tonal';

// Стандартный строй гитары от 6-й струны к 1-й (снизу вверх)
const STRINGS = [
  { name: 'E', octave: 2, midiBase: 40 }, // E2 (6-я)
  { name: 'A', octave: 2, midiBase: 45 }, // A2 (5-я)
  { name: 'D', octave: 3, midiBase: 50 }, // D3 (4-я)
  { name: 'G', octave: 3, midiBase: 55 }, // G3 (3-я)
  { name: 'B', octave: 3, midiBase: 59 }, // B3 (2-я)
  { name: 'E', octave: 4, midiBase: 64 }, // E4 (1-я)
].reverse(); // Переворачиваем, чтобы 6-я была внизу, 1-я вверху

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FRETS_COUNT = 24; // от 0 (открытая) до 24



// Получить ноту по MIDI номеру
const midiToNote = (midi: number): string => {
  const noteIndex = midi % 12;
  const octave = Math.floor(midi / 12) - 1;
  return `${NOTES[noteIndex]}${octave}`;
};


// Получить название ноты без октавы
const midiToNoteName = (midi: number): string => {
  return NOTES[midi % 12];
};

// Определить аккорд с помощью Tonal
const identifyChord = (midiNotes: number[]): { name: string; fullName: string; bassNote?: string } => {
  if (midiNotes.length < 2) return { name: '—', fullName: '—' };
  
  const uniqueNotes = [...new Set(midiNotes)].sort((a, b) => a - b);
  const noteNames = uniqueNotes.map(midi => midiToNoteName(midi));
  const noteNamesWithOctave = uniqueNotes.map(midi => midiToNote(midi));
  
  // Определяем басовую ноту (самая низкая)
  const bassMidi = uniqueNotes[0];
  const bassNoteName = midiToNoteName(bassMidi);
  
  // Пробуем определить аккорд через Tonal
  const detected = Chord.detect(noteNames);
  
  if (detected.length > 0) {
    // Фильтруем и выбираем лучший вариант
    const rootNote = noteNames[0];
    
    // Ищем аккорд с правильным основным тоном
    const rootMatch = detected.find(chord => chord.startsWith(rootNote));
    const chordName = rootMatch || detected[0];
    
    let fullName = chordName;
    
    return { 
      name: chordName, 
      fullName,
      bassNote: bassNoteName 
    };
  }
  
  // Если не определился, возвращаем ноту основного тона
  const rootNote = noteNames[0];
  return { 
    name: rootNote, 
    fullName: rootNote,
    bassNote: bassNoteName 
  };
};

export default function ChordBuilderExtended() {
  // Храним выбранный лад для каждой струны (-1 = не выбрано)
  const [selectedFrets, setSelectedFrets] = useState<number[]>(
    STRINGS.map(() => -1)
  );

  // Переключение лада на струне (только один лад на струну)
  const toggleFret = (stringIndex: number, fret: number) => {
    setSelectedFrets(prev => {
      const newState = [...prev];
      // Если кликнули на уже выбранный лад - убираем его
      if (newState[stringIndex] === fret) {
        newState[stringIndex] = -1;
      } else {
        // Иначе устанавливаем новый лад
        newState[stringIndex] = fret;
      }
      return newState;
    });
  };

  // Сброс всех позиций
  const resetFrets = () => {
    setSelectedFrets(STRINGS.map(() => -1));
  };

  // Установка стандартного аккорда (для демонстрации)
  const setChord = (chordName: string) => {
    // Получаем ноты аккорда
    const chordNotes = Chord.get(chordName).notes;
    if (chordNotes.length === 0) return;
    
    const newFrets = STRINGS.map(() => -1);
    
    // Простой алгоритм для поиска аппликатуры
    chordNotes.forEach((noteName, idx) => {
      if (idx >= STRINGS.length) return;
      
      const targetMidi = NOTES.indexOf(noteName) + 60; // примерно 4 октава
      
      STRINGS.forEach((string, sIdx) => {
        for (let fret = 0; fret <= FRETS_COUNT; fret++) {
          const midi = string.midiBase + fret;
          if (midi % 12 === targetMidi % 12 && newFrets[sIdx] === -1) {
            newFrets[sIdx] = fret;
            break;
          }
        }
      });
    });
    
    setSelectedFrets(newFrets);
  };

const { currentNotes, chordInfo, activeMidiNotes } = useMemo(() => {
  const midiNotes: number[] = [];
  
  STRINGS.forEach((string, sIdx) => {
    const fret = selectedFrets[sIdx];
    if (fret >= 0) {
      const midi = string.midiBase + fret;
      midiNotes.push(midi);
    }
  });
  
  const chord = identifyChord(midiNotes);
  const notesList = midiNotes.map(midiToNote).join(', ');
  
  return { 
    currentNotes: notesList, 
    chordInfo: chord, 
    activeMidiNotes: midiNotes 
  };
}, [selectedFrets]);

  // Создаем массив ладов для отображения (0..24)
  const frets = Array.from({ length: FRETS_COUNT + 1 }, (_, i) => i);
  
  // Популярные аккорды для быстрой установки
  const popularChords = ['C', 'Am', 'G', 'Em', 'D', 'Dm', 'F', 'E', 'A'];

  return (
    <div className="chord-builder">
      <h1>🎸 Конструктор аккордов (24 лада)</h1>
      
      <div className="chord-header">
        <div className="chord-name">{chordInfo.fullName}</div>
        <div className="chord-notes">{currentNotes || 'Выберите ноты'}</div>
      </div>

      {/* Быстрые аккорды */}
      <div className="quick-chords">
        {popularChords.map(chord => (
          <button 
            key={chord} 
            className="quick-chord-btn"
            onClick={() => setChord(chord)}
          >
            {chord}
          </button>
        ))}
      </div>

      <div className="guitar-neck-container">
        <div className="guitar-neck">
          {/* Маркеры ладов */}
          <div className="fret-markers">
            {[3, 5, 7, 9, 12, 15, 17, 19, 21, 24].map(fret => (
              <div 
                key={fret} 
                className="fret-marker"
                style={{ 
                  gridColumn: fret + 2,
                  backgroundColor: fret === 12 ? 'white' : '#a0a0b0'
                }}
              />
            ))}
          </div>

          {/* Заголовки ладов */}
          <div className="fret-numbers">
            <div className="string-label"></div>
            {frets.map(fret => (
              <div key={fret} className="fret-number">
                {fret === 0 ? '○' : fret}
              </div>
            ))}
          </div>

          {/* Струны (сверху 1-я, снизу 6-я) */}
          {STRINGS.map((string, sIdx) => (
            <div key={sIdx} className="string-row">
              <div className="string-name">
                {string.name}
                <span className="octave">{string.octave}</span>
              </div>
              {frets.map(fret => {
                const isSelected = selectedFrets[sIdx] === fret;
                const note = fret >= 0 ? midiToNote(string.midiBase + fret) : '';
                
                return (
                  <div
                    key={fret}
                    className={`fret-cell ${isSelected ? 'active' : ''}`}
                    onClick={() => toggleFret(sIdx, fret)}
                    title={note}
                  >
                    {isSelected && <div className="fret-dot" />}
                    {fret === 0 && !isSelected && <span className="open-string">○</span>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="controls">
        <button onClick={resetFrets} className="reset-btn">
          🗑️ Сбросить все
        </button>
        <div className="stats">
          Выбрано струн: {selectedFrets.filter(f => f >= 0).length} / 6
        </div>
        <div className="hint">
          Кликайте по ладам — только один на струну
        </div>
      </div>
      <style jsx>{`
        .chord-builder {
          max-width: 100%;
          margin: 2rem auto;
          padding: 1.5rem;
          background: #1e1e2f;
          border-radius: 24px;
          color: #f0f0f0;
          font-family: system-ui, sans-serif;
        }
        h1 {
          text-align: center;
          margin-bottom: 1.5rem;
          font-weight: 600;
        }
        .chord-header {
          background: #2a2a40;
          padding: 1.5rem;
          border-radius: 16px;
          margin-bottom: 1.5rem;
          text-align: center;
        }
        .chord-name {
          font-size: 3.5rem;
          font-weight: 800;
          color: #a78bfa;
          line-height: 1.2;
        }
        .bass-note {
          font-size: 1.2rem;
          color: #8b5cf6;
          margin-top: 0.25rem;
        }
        .chord-notes {
          font-size: 1rem;
          opacity: 0.8;
          font-family: monospace;
          margin-top: 0.5rem;
        }
        .quick-chords {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
          margin-bottom: 1.5rem;
          justify-content: center;
        }
        .quick-chord-btn {
          background: #3f3f5e;
          color: white;
          border: none;
          border-radius: 20px;
          padding: 0.5rem 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .quick-chord-btn:hover {
          background: #8b5cf6;
        }
        .guitar-neck-container {
          overflow-x: auto;
          padding-bottom: 1rem;
          margin-bottom: 1.5rem;
        }
        .guitar-neck {
          background: #2a2a40;
          border-radius: 16px;
          padding: 1rem;
          min-width: max-content;
          position: relative;
        }
        .fret-markers {
          position: absolute;
          top: 40px;
          left: 70px;
          right: 0;
          bottom: 0;
          display: grid;
          grid-template-columns: repeat(${FRETS_COUNT + 1}, 48px);
          pointer-events: none;
        }
        .fret-marker {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          margin: 0 auto;
          opacity: 0.3;
        }
        .fret-numbers {
          display: grid;
          grid-template-columns: 70px repeat(${FRETS_COUNT + 1}, 48px);
          margin-bottom: 8px;
        }
        .string-label {
          text-align: right;
          padding-right: 12px;
          font-weight: 600;
          color: #a0a0b0;
        }
        .fret-number {
          text-align: center;
          font-weight: 600;
          color: #a0a0b0;
        }
        .string-row {
          display: grid;
          grid-template-columns: 70px repeat(${FRETS_COUNT + 1}, 48px);
          align-items: center;
          margin-bottom: 8px;
        }
        .string-name {
          text-align: right;
          padding-right: 12px;
          font-weight: 700;
          font-size: 1.2rem;
          color: #c4b5fd;
        }
        .octave {
          font-size: 0.8rem;
          opacity: 0.7;
          margin-left: 2px;
        }
        .fret-cell {
          width: 44px;
          height: 44px;
          background: #3f3f5e;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.1s ease;
          border: 2px solid transparent;
          margin: 0 2px;
          position: relative;
        }
        .fret-cell:hover {
          background: #5a5a7a;
        }
        .fret-cell.active {
          background: #8b5cf6;
          border-color: #c4b5fd;
        }
        .fret-dot {
          width: 60%;
          height: 60%;
          background: white;
          border-radius: 50%;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        .open-string {
          opacity: 0.3;
          font-size: 1.2rem;
        }
        .controls {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .reset-btn {
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 40px;
          padding: 0.75rem 1.5rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }
        .reset-btn:hover {
          background: #dc2626;
        }
        .stats {
          font-size: 0.9rem;
          opacity: 0.8;
        }
        .hint {
          font-size: 0.9rem;
          opacity: 0.7;
        }
      `}</style>
    </div>
  );
}