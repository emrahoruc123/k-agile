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
import { LogOut, Check, Plus, Trash2 } from 'lucide-react';

// --- SÜTUN BİLEŞENİ (Droppable) ---
const Column = ({ id, children, title, onAddCard }) => {
  const { setNodeRef } = useSortable({ id }); // Sütunu dnd-kit'e tanıtır

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

// --- KART BİLEŞENİ (Sortable) ---
const SortableCard = ({ id, card, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  
  const style = { 
    transform: CSS.Transform.toString(transform), 
    transition, 
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : 1
  };

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
      <div className="flex mb-3">
        <span className="px-2 py-0.5 bg-slate-900 text-white rounded text-[8px] font-black uppercase">{card.tag}</span>
      </div>
      <h3 className="font-bold text-slate-800 text-sm leading-snug pr-6">{card.title}</h3>
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
    'card-1': { id: 'card-1', title: 'Yeni görev ekleyebilir ve taşıyabilirsiniz!', tag: 'SİSTEM', assignee: 'Gemini' }
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const addCard = (colId) => {
    const title = prompt("Görev başlığı nedir?");
    if (!title) return;
    const newId = `card-${Date.now()}`;
    setCards({ ...cards, [newId]: { id: newId, title, tag: 'GÖREV', assignee: user } });
    setColumns({ ...columns, [colId]: [...columns[colId], newId] });
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

    // Aktif kartın hangi sütunda olduğunu bul
    const sourceCol = Object.keys(columns).find(key => columns[key].includes(activeId));
    // Üzerine gelinen yerin bir sütun mu yoksa başka bir kart mı olduğunu bul
    const destCol = Object.keys(columns).find(key => key === overId || columns[key].includes(overId));

    if (!sourceCol || !destCol) return;

    if (sourceCol === destCol) {
      setColumns({
        ...columns,
        [sourceCol]: arrayMove(columns[sourceCol], columns[sourceCol].indexOf(activeId), columns[sourceCol].indexOf(overId))
      });
    } else {
      setColumns({
        ...columns,
        [sourceCol]: columns[sourceCol].filter(id => id !== activeId),
        [destCol]: [...columns[destCol], activeId]
      });
    }
  };

  if (!user) {
    return (
      <div className="h-screen bg-slate-100 flex items-center justify-center p-6">
        <button onClick={() => {setUser('Kullanıcı'); localStorage.setItem('kUser', 'Kullanıcı');}} className="bg-rose-600 text-white px-10 py-4 rounded-2xl font-bold">Giriş Yap</button>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#fcfcfd] flex flex-col overflow-hidden font-sans">
      <header className="bg-white px-10 py-4 flex justify-between items-center border-b border-rose-100">
        <div className="flex items-center gap-2 italic font-black text-xl">K-<span className="text-rose-600">AGILE</span></div>
        <button onClick={() => {localStorage.clear(); window.location.reload();}}><LogOut size={20} className="text-slate-400"/></button>
      </header>

      <main className="flex-1 p-10 flex gap-8 overflow-x-auto items-start">
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
