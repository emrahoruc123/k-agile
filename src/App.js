import React, { useState } from 'react';
import {
  DndContext, closestCorners, KeyboardSensor, PointerSensor, 
  useSensor, useSensors
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, 
  verticalListSortingStrategy, useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { LogOut, Plus, Trash2, Clock, X, CheckCircle2 } from 'lucide-react';

// --- KART BİLEŞENİ ---
const SortableCard = ({ id, card, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.3 : 1, zIndex: isDragging ? 100 : 1 };

  return (
    <div
      ref={setNodeRef} style={style} {...attributes} {...listeners}
      className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm mb-4 group hover:border-rose-300 transition-all relative"
    >
      <button 
        onClick={(e) => { e.stopPropagation(); onDelete(id); }}
        className="absolute top-4 right-4 text-slate-300 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Trash2 size={14} />
      </button>
      <div className="flex justify-between items-start mb-3">
        <span className="px-2 py-0.5 bg-slate-900 text-white rounded text-[8px] font-black uppercase tracking-widest">{card.tag}</span>
        {card.deadline && <span className="text-[9px] font-bold text-rose-600 italic">📅 {card.deadline}</span>}
      </div>
      <h3 className="font-bold text-slate-800 text-sm leading-snug pr-6">{card.title}</h3>
      <div className="flex justify-end mt-3 pt-3 border-t border-slate-50">
        <div className="w-6 h-6 rounded-lg bg-rose-50 flex items-center justify-center text-[10px] font-bold text-rose-600 border border-rose-100">
          {(card.assignee || 'K').charAt(0).toUpperCase()}
        </div>
      </div>
    </div>
  );
};

// --- ANA UYGULAMA ---
export default function App() {
  const [user, setUser] = useState(localStorage.getItem('kUser') || '');
  const [columns, setColumns] = useState({ 'YAPILACAK': ['c1'], 'İŞLEMDE': [], 'TAMAMLANDI': [] });
  const [cards, setCards] = useState({ 'c1': { id: 'c1', title: 'Hoş geldiniz!', tag: 'SİSTEM', assignee: 'K-Agile', deadline: '2026-12-31' } });
  const [history, setHistory] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [activeCol, setActiveCol] = useState(null);

  const [formData, setFormData] = useState({ title: '', tag: 'GÖREV', assignee: '', deadline: '' });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const addLog = (msg) => {
    const log = { id: Date.now(), text: msg, time: new Date().toLocaleTimeString() };
    setHistory(prev => [log, ...prev].slice(0, 10));
  };

  const handleAddCard = () => {
    if (!formData.title) return;
    const newId = `card-${Date.now()}`;
    const cardData = { ...formData, id: newId, assignee: formData.assignee || user };
    setCards(prev => ({ ...prev, [newId]: cardData }));
    setColumns(prev => ({ ...prev, [activeCol]: [...prev[activeCol], newId] }));
    addLog(`"${formData.title}" eklendi.`);
    setShowModal(false);
    setFormData({ title: '', tag: 'GÖREV', assignee: '', deadline: '' });
  };

  const deleteCard = (cardId) => {
    addLog(`Bir görev silindi.`);
    setColumns(prev => {
      const newCols = { ...prev };
      Object.keys(newCols).forEach(c => newCols[c] = newCols[c].filter(id => id !== cardId));
      return newCols;
    });
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;
    const sourceCol = Object.keys(columns).find(key => columns[key].includes(active.id));
    const destCol = Object.keys(columns).find(key => key === over.id || columns[key].includes(over.id));

    if (sourceCol && destCol) {
      if (sourceCol === destCol) {
        setColumns(prev => ({ ...prev, [sourceCol]: arrayMove(prev[sourceCol], prev[sourceCol].indexOf(active.id), prev[sourceCol].indexOf(over.id)) }));
      } else {
        setColumns(prev => ({ ...prev, [sourceCol]: prev[sourceCol].filter(id => id !== active.id), [destCol]: [...prev[destCol], active.id] }));
        addLog(`Görev ${destCol} alanına çekildi.`);
      }
    }
  };

  if (!user) {
    return (
      <div className="h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
         <div className="bg-white p-12 rounded-[3rem] shadow-2xl border border-white max-w-sm w-full">
            <h1 className="text-4xl font-black mb-8 italic text-slate-900 tracking-tighter">K-<span className="text-rose-600">Agile</span></h1>
            <button 
              onClick={() => {setUser('Kullanıcı'); localStorage.setItem('kUser', 'Kullanıcı');}} 
              className="w-full bg-rose-600 text-white py-4 rounded-2xl font-bold shadow-lg hover:bg-rose-700 transition-all"
            >
              Sisteme Giriş
            </button>
         </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#fcfcfd] flex flex-col overflow-hidden font-sans">
      <header className="bg-white/80 backdrop-blur-md px-10 py-4 flex justify-between items-center border-b border-rose-100 shrink-0">
        <div className="flex items-center gap-2 text-xl font-black italic tracking-tighter">
          <CheckCircle2 className="text-rose-600" size={24} /> K-<span className="text-rose-600">AGILE</span>
        </div>
        <div className="flex gap-4">
          <button onClick={() => setShowHistory(!showHistory)} className="p-2 text-slate-400 hover:text-rose-600 transition-colors"><Clock size={20}/></button>
          <button onClick={() => {localStorage.clear(); window.location.reload();}} className="p-2 text-slate-400 hover:text-rose-600 transition-colors"><LogOut size={20}/></button>
        </div>
      </header>

      <main className="flex-1 p-10 flex gap-8 overflow-x-auto items-start">
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
          {Object.keys(columns).map(colId => (
            <div key={colId} className="w-[320px] shrink-0 bg-white/50 backdrop-blur-sm rounded-[2.5rem] border border-white shadow-sm flex flex-col p-4 max-h-full">
              <div className="flex items-center justify-between mb-6 px-4 pt-2">
                <div className="flex items-center gap-2"><div className="w-1 h-4 rounded-full bg-rose-600"></div><h2 className="font-black text-slate-500 text-[10px] tracking-widest uppercase">{colId}</h2></div>
                <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">{columns[colId].length}</span>
              </div>
              <div className="flex-1 overflow-y-auto min-h-[100px]">
                <SortableContext items={columns[colId]} strategy={verticalListSortingStrategy}>
                  {columns[colId].map(id => <SortableCard key={id} id={id} card={cards[id]} onDelete={deleteCard} />)}
                </SortableContext>
              </div>
              <button onClick={() => {setActiveCol(colId); setShowModal(true);}} className="mt-4 flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-[10px] font-black uppercase hover:border-rose-300 hover:text-rose-600 transition-all"><Plus size={14} /> Görev Ekle</button>
            </div>
          ))}
        </DndContext>
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[1000] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-8 shadow-2xl border border-white relative">
            <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 text-slate-400 hover:text-rose-600 transition-colors"><X size={20}/></button>
            <h2 className="text-2xl font-black italic mb-6">Yeni <span className="text-rose-600">Görev</span></h2>
            <div className="space-y-4">
              <input type="text" placeholder="Görev Başlığı" className="w-full p-4 bg-slate-50 rounded-2xl outline-none border border-transparent focus:border-rose-200" onChange={e => setFormData({...formData, title: e.target.value})}/>
              <div className="grid grid-cols-2 gap-4">
                <select className="p-4 bg-slate-50 rounded-2xl outline-none appearance-none" onChange={e => setFormData({...formData, tag: e.target.value})}>
                  <option value="GÖREV">GÖREV</option><option value="UI/UX">UI/UX</option><option value="DEV">DEV</option><option value="TEST">TEST</option>
                </select>
                <input type="text" placeholder="Sorumlu" className="p-4 bg-slate-50 rounded-2xl outline-none" onChange={e => setFormData({...formData, assignee: e.target.value})}/>
              </div>
              <input type="date" className="w-full p-4 bg-slate-50 rounded-2xl outline-none" onChange={e => setFormData({...formData, deadline: e.target.value})}/>
              <button onClick={handleAddCard} className="w-full bg-rose-600 text-white font-bold py-4 rounded-2xl shadow-lg hover:opacity-90 transition-all">Görevi Kaydet</button>
            </div>
          </div>
        </div>
      )}

      {showHistory && (
        <div className="fixed top-24 right-10 w-72 bg-white/95 backdrop-blur-md rounded-[2rem] border border-rose-100 shadow-2xl p-6 z-[500]">
          <h3 className="font-black text-[10px] tracking-widest uppercase text-slate-400 mb-4 flex items-center gap-2 underline decoration-rose-500/20 underline-offset-4">Son İşlemler</h3>
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {history.map(log => (
              <div key={log.id} className="text-[10px] border-l-2 border-rose-400 pl-3 py-1 bg-rose-50/30 rounded-r-lg">
                <p className="font-bold text-slate-800 leading-tight">{log.text}</p>
                <span className="text-slate-400 font-medium">{log.time}</span>
              </div>
            ))}
            {history.length === 0 && <p className="text-[10px] text-slate-400 italic">Henüz bir işlem yapılmadı.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
