import React, { useState } from 'react';
import {
  DndContext, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  DragOverlay,
  pointerWithin,
  getFirstCollision
} from '@dnd-kit/core';
import {
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy, 
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { LogOut, Plus, Trash2, Clock, CheckCircle2, Edit3, Save, Ban, ArrowRight } from 'lucide-react';

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
        <Edit3 size={14} className="text-slate-300" />
        <button onClick={(e) => { e.stopPropagation(); onDelete(id); }}>
          <Trash2 size={14} className="text-slate-300 hover:text-rose-600" />
        </button>
      </div>
      <div className="flex justify-between items-start mb-3 pointer-events-none">
        <span className="px-2 py-0.5 bg-slate-900 text-white rounded text-[8px] font-black uppercase tracking-widest">{card.tag}</span>
        <div className="flex items-center gap-1">
            <Clock size={10} className="text-slate-400" />
            <span className="text-[8px] font-bold text-slate-400 uppercase">{card.logs ? card.logs.length : 0}</span>
        </div>
      </div>
      <h3 className="font-bold text-slate-800 text-sm leading-snug pr-6 pointer-events-none">{card.title}</h3>
      <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-50 pointer-events-none">
        <span className="text-[9px] font-bold text-rose-600 italic">{card.deadline || 'Süresiz'}</span>
        <div className="w-6 h-6 rounded-lg bg-rose-50 flex items-center justify-center text-[10px] font-bold text-rose-600 border border-rose-100 uppercase font-black">
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
  const [cards, setCards] = useState({ 
    'c1': { id: 'c1', title: 'Hoş geldiniz! Boş sütunlara da taşıma yapabilirsiniz.', tag: 'SİSTEM', assignee: 'K-Agile', deadline: '2026-12-31', logs: [{text: "Görev oluşturuldu", time: new Date().toLocaleTimeString()}] } 
  });
  const [showModal, setShowModal] = useState(false);
  const [activeCol, setActiveCol] = useState(null);
  const [editingCard, setEditingCard] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [formData, setFormData] = useState({ title: '', tag: 'GÖREV', assignee: '', deadline: '' });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const collisionDetectionStrategy = (args) => {
    const pointerCollisions = pointerWithin(args);
    const collisions = pointerCollisions.length > 0 ? pointerCollisions : closestCorners(args);
    let overId = getFirstCollision(collisions, 'id');
    if (overId != null) {
      if (overId in columns) return collisions;
      const columnId = Object.keys(columns).find((key) => columns[key].includes(overId));
      if (columnId) overId = columnId;
    }
    return collisions;
  };

  const handleDragStart = (event) => setActiveId(event.active.id);

  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over) return;
    const activeId = active.id;
    const overId = over.id;
    const sourceCol = Object.keys(columns).find(key => columns[key].includes(activeId));
    const destCol = (overId in columns) ? overId : Object.keys(columns).find(key => columns[key].includes(overId));
    
    if (!sourceCol || !destCol || sourceCol === destCol) return;

    setColumns((prev) => ({
      ...prev,
      [sourceCol]: prev[sourceCol].filter((id) => id !== activeId),
      [destCol]: [...prev[destCol], activeId],
    }));

    // Kartın loguna taşıma işlemini ekle
    setCards(prev => {
        const card = prev[activeId];
        const newLog = { text: `${sourceCol} ➔ ${destCol}`, time: new Date().toLocaleTimeString() };
        return {
            ...prev,
            [activeId]: { ...card, logs: [newLog, ...(card.logs || [])] }
        };
    });
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const colId = Object.keys(columns).find(key => columns[key].includes(active.id));
      if (colId) {
        setColumns(prev => ({
          ...prev,
          [colId]: arrayMove(prev[colId], prev[colId].indexOf(active.id), prev[colId].indexOf(over.id))
        }));
      }
    }
    setActiveId(null);
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
    const newLog = { text: editingCard ? "Bilgiler güncellendi" : "Görev oluşturuldu", time: new Date().toLocaleTimeString() };
    if (editingCard) {
      setCards(prev => ({
        ...prev,
        [editingCard.id]: { ...formData, id: editingCard.id, logs: [newLog, ...(editingCard.logs || [])] }
      }));
    } else {
      const newId = `card-${Date.now()}`;
      setCards(prev => ({ ...prev, [newId]: { ...formData, id: newId, logs: [newLog] } }));
      setColumns(prev => ({ ...prev, [activeCol]: [...prev[activeCol], newId] }));
    }
    setShowModal(false);
  };

  if (!user) {
    return (
      <div className="h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
        <button onClick={() => {setUser('Kullanıcı'); localStorage.setItem('kUser', 'Kullanıcı');}} className="bg-rose-600 text-white px-12 py-4 rounded-3xl font-bold shadow-xl">Sisteme Giriş</button>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#fcfcfd] flex flex-col overflow-hidden font-sans text-slate-900">
      <header className="bg-white/80 backdrop-blur-md px-10 py-4 flex justify-between items-center border-b border-rose-100 shrink-0">
        <div className="flex items-center gap-2 text-xl font-black italic tracking-tighter"><CheckCircle2 className="text-rose-600" size={24} /> K-<span className="text-rose-600">AGILE</span></div>
        <button onClick={() => {localStorage.clear(); window.location.reload();}} className="p-2 text-slate-400 hover:text-rose-600 transition-colors"><LogOut size={20}/></button>
      </header>

      <main className="flex-1 p-10 flex gap-8 overflow-x-auto items-start">
        <DndContext 
          sensors={sensors} 
          collisionDetection={collisionDetectionStrategy} 
          onDragStart={handleDragStart} 
          onDragOver={handleDragOver} 
          onDragEnd={handleDragEnd}
        >
          {Object.keys(columns).map(colId => (
            <div key={colId} className="w-[320px] shrink-0 bg-white/40 backdrop-blur-sm rounded-[2.5rem] border border-white shadow-sm flex flex-col p-4 max-h-full">
              <h2 className="font-black text-slate-400 text-[10px] tracking-widest uppercase mb-6 px-4">{colId}</h2>
              
              {/* BOŞ ALAN SORUNUNU ÇÖZEN DROP ALANI */}
              <SortableContext id={colId} items={columns[colId]} strategy={verticalListSortingStrategy}>
                <div className="flex-1 overflow-y-auto min-h-[300px] transition-colors rounded-2xl p-2">
                   {columns[colId].map(id => (
                    <SortableCard 
                        key={id} id={id} card={cards[id]} 
                        onDelete={(cardId) => setColumns(prev => {
                            const nc = {...prev}; Object.keys(nc).forEach(k => nc[k] = nc[k].filter(i => i !== cardId)); return nc;
                        })} 
                        onEdit={(card) => handleOpenModal(colId, card)} 
                    />
                  ))}
                  {columns[colId].length === 0 && (
                    <div className="h-full border-2 border-dashed border-slate-100 rounded-3xl flex items-center justify-center text-[10px] font-bold text-slate-300 uppercase tracking-widest">Sürükle Bırak</div>
                  )}
                </div>
              </SortableContext>

              <button onClick={() => handleOpenModal(colId)} className="mt-4 py-3 bg-white border border-rose-100 text-rose-600 rounded-2xl text-[10px] font-black uppercase hover:bg-rose-50 transition-all flex items-center justify-center gap-2 font-bold"><Plus size={14}/> Yeni Görev</button>
            </div>
          ))}
          <DragOverlay>
            {activeId ? (
              <div className="bg-white p-5 rounded-[2rem] border border-rose-300 shadow-2xl scale-105">
                <h3 className="font-bold text-slate-800 text-sm">{cards[activeId].title}</h3>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] p-10 shadow-2xl border border-white flex flex-col max-h-[90vh]">
            <h2 className="text-2xl font-black italic mb-8">Görev <span className="text-rose-600">Yönetimi</span></h2>
            <div className="flex gap-8 overflow-hidden">
                <div className="flex-1 space-y-4">
                    <input type="text" placeholder="Görev Başlığı" value={formData.title} className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 ring-rose-500/10 transition-all" onChange={e => setFormData({...formData, title: e.target.value})}/>
                    <div className="grid grid-cols-2 gap-4">
                        <select value={formData.tag} className="p-4 bg-slate-50 rounded-2xl outline-none" onChange={e => setFormData({...formData, tag: e.target.value})}>
                            <option value="GÖREV">GÖREV</option><option value="UI/UX">UI/UX</option><option value="DEV">DEV</option>
                        </select>
                        <input type="text" placeholder="Sorumlu" value={formData.assignee} className="p-4 bg-slate-50 rounded-2xl outline-none" onChange={e => setFormData({...formData, assignee: e.target.value})}/>
                    </div>
                    <input type="date" value={formData.deadline} className="w-full p-4 bg-slate-50 rounded-2xl outline-none" onChange={e => setFormData({...formData, deadline: e.target.value})}/>
                    <div className="flex gap-3 pt-4">
                        <button onClick={handleSave} className="flex-1 bg-rose-600 text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-rose-700 transition-all flex items-center justify-center gap-2"><Save size={18}/> Kaydet</button>
                        <button onClick={() => setShowModal(false)} className="flex-1 bg-slate-100 text-slate-500 font-bold py-4 rounded-2xl hover:bg-slate-200 transition-all flex items-center justify-center gap-2"><Ban size={18}/> İptal</button>
                    </div>
                </div>
                {editingCard && (
                    <div className="w-64 border-l border-slate-100 pl-6 flex flex-col">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Clock size={12}/> İşlem Geçmişi</h3>
                        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                            {(editingCard.logs || []).map((log, i) => (
                                <div key={i} className="text-[10px] border-l-2 border-rose-300 pl-2 bg-rose-50/20 py-2 rounded-r-lg">
                                    <p className="font-bold text-slate-700 leading-tight flex items-center gap-1">
                                        {log.text.includes('➔') ? <><ArrowRight size={10} className="text-rose-500" /> {log.text}</> : log.text}
                                    </p>
                                    <span className="text-slate-400 font-medium text-[9px]">{log.time}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
