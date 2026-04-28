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
import { LogOut, Plus, Check } from 'lucide-react';

const SortableCard = ({ id, card }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.3 : 1 };

  return (
    <div
      ref={setNodeRef} style={style} {...attributes} {...listeners}
      className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm mb-4 cursor-grab active:cursor-grabbing hover:border-rose-300 transition-all"
    >
      <div className="flex justify-between items-start mb-3">
        <span className="px-2 py-0.5 bg-slate-900 text-white rounded text-[8px] font-black uppercase">{card.tag || 'GENEL'}</span>
      </div>
      <h3 className="font-bold text-slate-800 text-sm leading-snug">{card.title}</h3>
      <div className="flex justify-end mt-3 pt-3 border-t border-slate-50">
        <div className="w-6 h-6 rounded-lg bg-rose-50 flex items-center justify-center text-[10px] font-bold text-rose-600">
          {(card.assignee || '?').charAt(0).toUpperCase()}
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState(localStorage.getItem('kUser') || '');
  const [columns, setColumns] = useState({
    'YAPILACAK': ['1', '2'],
    'İŞLEMDE': [],
    'TAMAMLANDI': []
  });
  const [cards] = useState({
    '1': { id: '1', title: 'Modern dnd-kit entegrasyonu tamamlandı.', tag: 'SİSTEM', assignee: 'Gemini' },
    '2': { id: '2', title: 'Vercel canlı yayın testi yapılacak.', tag: 'TEST', assignee: 'User' }
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    const sourceCol = Object.keys(columns).find(key => columns[key].includes(activeId));
    const destCol = Object.keys(columns).find(key => key === overId || columns[key].includes(overId));

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
        <div className="bg-white p-12 rounded-[3rem] shadow-xl w-full max-w-md text-center">
          <h1 className="text-3xl font-black mb-8 italic text-slate-900">K-<span className="text-rose-600">Agile</span></h1>
          <button onClick={() => {setUser('Misafir'); localStorage.setItem('kUser', 'Misafir');}} className="w-full bg-rose-600 text-white font-bold py-4 rounded-2xl">Sisteme Giriş</button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#fcfcfd] flex flex-col overflow-hidden">
      <header className="bg-white px-10 py-4 flex justify-between items-center border-b border-rose-100">
        <div className="flex items-center gap-2">
          <div className="bg-rose-600 p-1.5 rounded-lg text-white"><Check size={18} strokeWidth={3}/></div>
          <h1 className="text-xl font-black italic">K-<span className="text-rose-600">AGILE</span></h1>
        </div>
        <button onClick={() => {localStorage.clear(); window.location.reload();}} className="text-slate-400 hover:text-rose-600"><LogOut size={20}/></button>
      </header>

      <main className="flex-1 p-10 flex gap-8 overflow-x-auto items-start">
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
          {Object.keys(columns).map(colId => (
            <div key={colId} className="w-[320px] shrink-0 bg-slate-50/50 rounded-[2.5rem] border border-slate-100 flex flex-col p-4">
              <h2 className="font-black text-slate-400 text-[10px] tracking-widest uppercase mb-6 px-4">{colId}</h2>
              <SortableContext items={columns[colId]} strategy={verticalListSortingStrategy}>
                {columns[colId].map(id => (
                  <SortableCard key={id} id={id} card={cards[id]} />
                ))}
              </SortableContext>
            </div>
          ))}
        </DndContext>
      </main>
    </div>
  );
}
