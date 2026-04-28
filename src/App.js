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
import { LogOut, Plus, Trash2 } from 'lucide-react';

// --- SÜTUN BİLEŞENİ ---
const Column = ({ id, children, title, onAddCard }) => {
  const { setNodeRef } = useSortable({ id });

  return (
    <div ref={setNodeRef} className="w-[320px] shrink-0 bg-white/50 backdrop-blur-sm rounded-[2.5rem] border border-white shadow-sm flex flex-col p-4 max-h-full">
      <div className="flex items-center justify-between mb-6 px-4 pt-2">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 rounded-full bg-rose-600"></div>
          <h2 className="font-black text-slate-500 text-[10px] tracking-[0.2em] uppercase">{title}</h2>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto min-h-[100px]">
        {children}
      </div>
      <button 
        onClick={() => onAddCard(id)}
        className="mt-4 flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-[10px] font-black uppercase hover:border-rose-300 hover:text-rose-600 transition-all"
      >
        <Plus size={14} /> Görev Ekle
      </button>
    </div>
  );
};

// --- KART BİLEŞENİ ---
const SortableCard = ({ id, card, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  
  const style = { 
    transform: CSS.Transform.toString(transform), 
    transition, 
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : 1,
    position: 'relative'
  };

  return (
    <div
      ref={setNodeRef} style={style} {...attributes} {...listeners}
      className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm mb-4 group hover:border-rose-300 transition-all"
    >
      <div className="flex justify-between items-start mb-3">
        <span className="px-2 py-0.5 bg-slate-900 text-white rounded text-[8px] font-black uppercase">{card.tag}</span>
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(id); }}
          className="text-slate-300 hover:text-rose-600 transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>
      <h3 className="font-bold text-slate-800 text-sm leading-snug pr-4">{card.title}</h3>
      <div className="flex justify-end mt-3 pt-3 border-t border-slate-50">
        <div className="w-6 h-6 rounded-lg bg-rose-50 flex items-center justify-center text-[10px] font-bold text-rose-600">
          {card.assignee.charAt(0).toUpperCase()}
        </div>
      </div>
    </div>
  );
};

// --- ANA UYGULAMA ---
export default function App() {
  const [user, setUser] = useState(localStorage.getItem('kUser') || '');
  const [columns, setColumns] = useState({
    'YAPILACAK': ['card-1'],
    'İŞLEMDE': [],
    'TAMAMLANDI': []
  });
  const [cards, setCards] = useState({
    'card-1': { id: 'card-1', title: 'Hoş geldiniz! Görevlerinizi buradan yönetebilirsiniz.', tag: 'SİSTEM', assignee: 'K-Agile' }
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const addCard = (colId) => {
    const title = prompt("Görev başlığı nedir?");
    if (!title) return;
    const newId = `card-${Date.now()}`;
    setCards(prev => ({ ...prev, [newId]: { id: newId, title, tag: 'GÖREV', assignee: user || 'Misafir' } }));
    setColumns(prev => ({ ...prev, [colId]: [...prev[colId], newId] }));
  };

  const deleteCard = (cardId) => {
    const newCols = { ...columns };
    Object.keys(newCols).forEach(col => {
      newCols[col] = newCols[col].filter(id => id !== cardId);
    });
    setColumns(newCols);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    const sourceCol = Object.keys(columns).find(key => columns[key].includes(activeId));
    const destCol = Object.keys(columns).find(key => key === overId || columns[key].includes(overId));

    if (!sourceCol || !destCol) return;

    if (sourceCol === destCol) {
      setColumns(prev => ({
        ...prev,
        [sourceCol]: arrayMove(prev[sourceCol], prev[sourceCol].indexOf(activeId), prev[sourceCol].indexOf(overId))
      }));
    } else {
      setColumns(prev => ({
        ...prev,
        [sourceCol]: prev[sourceCol].filter(id => id !== activeId),
        [destCol]: [...prev[destCol], activeId]
      }));
    }
  };

  if (!user) {
    return (
      <div className="h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
         <h1 className="text-4xl font-black mb-8 italic text-slate-900 tracking-tighter">K-<span className="text-rose-600">Agile</span></h1>
         <button 
           onClick={() => {setUser('Kullanıcı'); localStorage.setItem('kUser', 'Kullanıcı');}} 
           className="bg-rose-600 text-white px-12 py-4 rounded-3xl font-bold shadow-lg hover:bg-rose-700 transition-all"
         >
           Sisteme Başla
         </button>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#fcfcfd] flex flex-col overflow-hidden font-sans">
      <header className="bg-white/80 backdrop-blur-md px-10 py-4 flex justify-between items-center border-b border-rose-100">
        <div className="text-xl font-black italic tracking-tighter">K-<span className="text-rose-600">AGILE</span></div>
        <button onClick={() => {localStorage.clear(); window.location.reload();}} className="p-2 hover:bg-rose-50 rounded-xl transition-colors">
          <LogOut size={20} className="text-slate-400 hover:text-rose-600"/>
        </button>
      </header>

      <main className="flex-1 p-10 flex gap-8 overflow-x-auto items-start bg-[radial-gradient(#e11d4803_1px,transparent_1px)] [background-size:20px_20px]">
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
          {Object.keys(columns).map(colId => (
            <Column key={colId} id={colId} title={colId} onAddCard={addCard}>
              <SortableContext items={columns[colId]} strategy={verticalListSortingStrategy}>
                {columns[colId].map(cardId => (
                  <SortableCard key={cardId} id={cardId} card={cards[cardId]} onDelete={deleteCard} />
                ))}
              </SortableContext>
            </Column>
          ))}
        </DndContext>
      </main>
    </div>
  );
}
