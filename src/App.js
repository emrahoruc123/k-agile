import React, { useState } from 'react';
import {
  DndContext, closestCorners, KeyboardSensor, PointerSensor, 
  useSensor, useSensors, pointerWithin, rectIntersection,
  getFirstCollision
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, 
  verticalListSortingStrategy, useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { LogOut, Plus, Trash2, Clock, X, CheckCircle2, Edit3 } from 'lucide-react';

// --- KART BİLEŞENİ ---
const SortableCard = ({ id, card, onDelete, onEdit }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.3 : 1, zIndex: isDragging ? 100 : 1 };

  return (
    <div
      ref={setNodeRef} style={style} {...attributes} {...listeners}
      onClick={() => onEdit(card)}
      className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm mb-4 group hover:border-rose-300 transition-all relative cursor-pointer"
    >
      <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Edit3 size={14} className="text-slate-300 hover:text-blue-500" />
        <button onClick={(e) => { e.stopPropagation(); onDelete(id); }}>
          <Trash2 size={14} className="text-slate-300 hover:text-rose-600" />
        </button>
      </div>
      <div className="flex justify-between items-start mb-3">
        <span className="px-2 py-0.5 bg-slate-900 text-white rounded text-[8px] font-black uppercase tracking-widest">{card.tag}</span>
        {card.deadline && <span className="text-[9px] font-bold text-rose-600 italic px-4">📅 {card.deadline}</span>}
      </div>
      <h3 className="font-bold text-slate-800 text-sm leading-snug pr-6">{card.title}</h3>
      <div className="flex justify-end mt-3 pt-3 border-t border-slate-50">
        <div className="w-6 h-6 rounded-lg bg-rose-50 flex items-center justify-center text-[10px] font-bold text-rose-600 border border-rose-100 uppercase">
          {(card.assignee || 'K').charAt(0)}
        </div>
      </div>
    </div>
  );
};

// --- ANA UYGULAMA ---
export default function App() {
  const [user, setUser] = useState(localStorage.getItem('kUser') || '');
  const [columns, setColumns] = useState({ 'YAPILACAK': ['c1'], 'İŞLEMDE': [], 'TAMAMLANDI': [] });
  const [cards, setCards] = useState({ 'c1': { id: 'c1', title: 'Hoş geldiniz! Kartlara tıklayarak güncelleyebilirsiniz.', tag: 'SİSTEM', assignee: 'K-Agile', deadline: '2026-12-31' } });
  const [history, setHistory] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [activeCol, setActiveCol] = useState(null);
  const [editingCard, setEditingCard] = useState(null);

  const [formData, setFormData] = useState({ title: '', tag: 'GÖREV', assignee: '', deadline: '' });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const addLog = (msg) => {
    const log = { id: Date.now(), text: msg, time: new Date().toLocaleTimeString() };
    setHistory(prev => [log, ...prev].slice(0, 10));
  };

  const handleOpenModal = (colId, card = null) => {
    setActiveCol(colId);
    if (card) {
      setEditingCard(card);
      setFormData({ title: card.title, tag: card.tag, assignee: card.assignee, deadline: card.deadline });
    } else {
      setEditingCard(null);
      setFormData({ title: '', tag: 'GÖREV', assignee: user, deadline: '' });
    }
    setShowModal(true);
  };

  const handleSave = () => {
    if (!formData.title) return;
    if (editingCard) {
      setCards(prev => ({ ...prev, [editingCard.id]: { ...formData, id: editingCard.id } }));
      addLog(`"${formData.title}" güncellendi.`);
    } else {
      const newId = `card-${Date.now()}`;
      setCards(prev => ({ ...prev, [newId]: { ...formData, id: newId } }));
      setColumns(prev => ({ ...prev, [activeCol]: [...prev[activeCol], newId] }));
      addLog(`"${formData.title}" eklendi.`);
    }
    setShowModal(false);
  };

  const customCollisionDetection = (args) => {
    const closestCornersCollisions = closestCorners(args);
    const pointerCollisions = pointerWithin(args);
    const collisions = pointerCollisions.length > 0 ? pointerCollisions : closestCornersCollisions;
    const overId = getFirstCollision(collisions, 'id');
    
    if (overId != null) {
      if (overId in columns) return collisions;
      const columnId = Object.keys(columns).find((key) => columns[key].includes(overId));
      if (columnId) return [{ id: columnId }];
    }
    return rectIntersection(args);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;
    const activeId = active.id;
    const overId = over.id;
    const sourceCol = Object.keys(columns).find(key => columns[key].includes(activeId));
    const destCol = (overId in columns) ? overId : Object.keys(columns).find(key => columns[key].includes(overId));

    if (sourceCol && destCol) {
      if (sourceCol === destCol) {
        setColumns(prev => ({ ...prev, [sourceCol]: arrayMove(prev[sourceCol], prev[sourceCol].indexOf(activeId), prev[sourceCol].indexOf(overId)) }));
      } else {
        setColumns(prev => ({ ...prev, [sourceCol]: prev[sourceCol].filter(id => id !== activeId), [destCol]: [...prev[destCol], activeId] }));
        addLog(`Görev ${destCol} sütununa taşındı.`);
      }
    }
  };

  if (!user) {
    return (
      <div className="h-screen bg-slate-100 flex items-center justify-center p-6">
        <button onClick={() => {setUser('Kullanıcı'); localStorage.setItem('kUser', 'Kullanıcı');}} className="bg-rose-600 text-white px-12 py-4 rounded-3xl font-bold">Giriş Yap</button>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#fcfcfd] flex flex-col overflow-hidden font-sans">
      <header className="bg-white/80 backdrop-blur-md px-10 py-4 flex justify-between items-center border-b border-rose-100 shrink-0">
        <div className="flex items-center gap-2 text-xl font-black italic tracking-tighter text-slate-900">
          <CheckCircle2 className="text-rose-600" size={24} /> K-<span className="text-rose-600">AGILE</span>
        </div>
        <div className="flex gap-4">
          <button onClick={() => setShowHistory(!showHistory)} className="p-2 text-slate-400 hover:text-rose-600 transition-colors"><Clock size={20}/></button>
          <button onClick={() => {localStorage.clear(); window.location.reload();}} className="p-2 text-slate-400 hover:text-rose-600 transition-colors"><LogOut size={20}/></button>
        </div>
      </header>

      <main className="flex-1 p-10 flex gap-8 overflow-x-auto items-start">
        <DndContext sensors={sensors} collisionDetection={customCollisionDetection} onDragEnd={handleDragEnd}>
          {Object.keys(columns).map(colId => (
            <div key={colId} className="w-[320px] shrink-0 bg-white/50 backdrop-blur-sm rounded-[2.5rem] border border-white shadow-sm flex flex-col p-4 max-h-full overflow-hidden">
              <div className="flex items-center justify-between mb-6 px-4 pt-2">
                <div className="flex items-center gap-2"><div className="w-1 h-4 rounded-full bg-rose-600"></div><h2 className="font-black text-slate-500 text-[10px] tracking-widest uppercase">{colId}</h2></div>
                <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">{columns[colId].length}</span>
              </div>
              <div className="flex-1 overflow-y-auto min-h-[150px]">
                <SortableContext items={columns[colId]} strategy={verticalListSortingStrategy}>
                  {columns[colId].map(id => (
                    <SortableCard 
                      key={id} id={id} card={cards[id]} 
                      onDelete={(cardId) => setColumns(prev => {
                        const nc = {...prev}; Object.keys(nc).forEach(k => nc[k] = nc[k].filter(i => i !== cardId)); 
                        addLog('Bir görev silindi.'); return nc;
                      })}
                      onEdit={(card) => handleOpenModal(colId, card)}
                    />
                  ))}
                </SortableContext>
              </div>
              <button onClick={() => handleOpenModal(colId)} className="mt-4 flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-[10px] font-black uppercase hover:border-rose-300 hover:text-rose-600 transition-all"><Plus size={14} /> Yeni Görev</button>
            </div>
          ))}
        </DndContext>
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[1000] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-8 shadow-2xl border border-white relative">
            <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 text-slate-400 hover:text-rose-600 transition-colors"><X size={20}/></button>
            <h2 className="text-2xl font-black italic mb-6">{editingCard ? 'Görevi' : 'Yeni'} <span className="text-rose-600">{editingCard ? 'Güncelle' : 'Görev'}</span></h2>
            <div className="space-y-4">
              <input type="text" placeholder="Görev Başlığı" value={formData.title} className="w-full p-4 bg-slate-50 rounded-2xl outline-none border border-transparent focus:border-rose-200" onChange={e => setFormData({...formData, title: e.target.value})}/>
              <div className="grid grid-cols-2 gap-4">
                <select value={formData.tag} className="p-4 bg-slate-50 rounded-2xl outline-none" onChange={e => setFormData({...formData, tag: e.target.value})}>
                  <option value="GÖREV">GÖREV</option><option value="UI/UX">UI/UX</option><option value="DEV">DEV</option><option value="TEST">TEST</option>
                </select>
                <input type="text" placeholder="Sorumlu" value={formData.assignee} className="p-4 bg-slate-50 rounded-2xl outline-none" onChange={e => setFormData({...formData, assignee: e.target.value})}/>
              </div>
              <input type="date" value={formData.deadline} className="w-full p-4 bg-slate-50 rounded-2xl outline-none" onChange={e => setFormData({...formData, deadline: e.target.value})}/>
              <button onClick={handleSave} className="w-full bg-rose-600 text-white font-bold py-4 rounded-2xl shadow-lg hover:opacity-90 transition-all">{editingCard ? 'Güncellemeyi Kaydet' : 'Görevi Kaydet'}</button>
            </div>
          </div>
        </div>
      )}

      {showHistory && (
        <div className="fixed top-24 right-10 w-72 bg-white/95 backdrop-blur-md rounded-[2rem] border border-rose-100 shadow-2xl p-6 z-[500] animate-in slide-in-from-right duration-300">
          <h3 className="font-black text-[10px] tracking-widest uppercase text-slate-400 mb-4 flex items-center gap-2">Son İşlemler</h3>
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {history.map(log => (
              <div key={log.id} className="text-[10px] border-l-2 border-rose-400 pl-3 py-1 bg-rose-50/30 rounded-r-lg">
                <p className="font-bold text-slate-800 leading-tight">{log.text}</p>
                <span className="text-slate-400 font-medium">{log.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
