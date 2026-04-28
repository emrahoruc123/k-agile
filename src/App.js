import React, { useState } from 'react';
import {
  DndContext, closestCorners, KeyboardSensor, PointerSensor, 
  useSensor, useSensors, DragOverlay, pointerWithin, getFirstCollision
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, 
  verticalListSortingStrategy, useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { LogOut, Plus, Trash2, Clock, CheckCircle2, Edit3, Save, Ban, ArrowRight, History } from 'lucide-react';

// --- KART BİLEŞENİ ---
const SortableCard = ({ id, card, onDelete, onEdit }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.3 : 1, zIndex: isDragging ? 100 : 1 };

  return (
    <div
      ref={setNodeRef} style={style} {...attributes} {...listeners}
      className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm mb-4 hover:border-rose-300 transition-all relative group cursor-grab active:cursor-grabbing"
    >
      <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
        <button onClick={(e) => { e.stopPropagation(); onEdit(card); }} className="p-1.5 bg-slate-50 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg transition-colors border border-slate-100" title="Düzenle"><Edit3 size={14} /></button>
        <button onClick={(e) => { e.stopPropagation(); onEdit(card); }} className="p-1.5 bg-slate-50 hover:bg-amber-50 text-slate-400 hover:text-amber-600 rounded-lg transition-colors border border-slate-100" title="Geçmiş"><History size={14} /></button>
        <button onClick={(e) => { e.stopPropagation(); onDelete(id); }} className="p-1.5 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors border border-slate-100" title="Sil"><Trash2 size={14} /></button>
      </div>
      <div className="flex justify-between items-start mb-3 pr-24"><span className="px-2 py-0.5 bg-slate-900 text-white rounded text-[8px] font-black uppercase tracking-widest">{card.tag}</span></div>
      <h3 className="font-bold text-slate-800 text-sm leading-snug pr-4 mb-3">{card.title}</h3>
      <div className="flex justify-between items-center pt-3 border-t border-slate-50">
        <div className="flex items-center gap-1.5"><Clock size={12} className="text-rose-500" /><span className="text-[9px] font-bold text-rose-600 uppercase tracking-tighter">{card.deadline || 'Süresiz'}</span></div>
        <div className="flex items-center gap-2">
            <span className="text-[9px] font-bold text-slate-400 uppercase italic">{card.logs?.length || 0} İşlem</span>
            <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-600 border border-white shadow-sm">{(card.assignee || 'K').charAt(0)}</div>
        </div>
      </div>
    </div>
  );
};

// --- ANA UYGULAMA ---
export default function App() {
  const [user, setUser] = useState(localStorage.getItem('kUser') || '');
  const [columns, setColumns] = useState({ 'YAPILACAK': ['c1'], 'İŞLEMDE': ['c2'], 'TAMAMLANDI': ['c3'] });
  const [cards, setCards] = useState({ 
    'c1': { id: 'c1', title: 'Örnek Görev: Tasarımı İncele', tag: 'UI/UX', assignee: 'Can', deadline: '2026-05-01', logs: [{text: "Sistem oluşturdu", time: "10:00"}] },
    'c2': { id: 'c2', title: 'Örnek Görev: API Entegrasyonu', tag: 'DEV', assignee: 'Ece', deadline: '2026-05-05', logs: [{text: "Sistem oluşturdu", time: "10:05"}] },
    'c3': { id: 'c3', title: 'Örnek Görev: Testleri Tamamla', tag: 'TEST', assignee: 'Mert', deadline: '2026-04-30', logs: [{text: "Sistem oluşturdu", time: "10:10"}] }
  });
  const [showModal, setShowModal] = useState(false);
  const [activeCol, setActiveCol] = useState(null);
  const [editingCard, setEditingCard] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [formData, setFormData] = useState({ title: '', tag: 'GÖREV', assignee: '', deadline: '' });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

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

  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over) return;
    const sourceCol = Object.keys(columns).find(key => columns[key].includes(active.id));
    const destCol = (over.id in columns) ? over.id : Object.keys(columns).find(key => columns[key].includes(over.id));
    if (!sourceCol || !destCol || sourceCol === destCol) return;
    setColumns(prev => ({ ...prev, [sourceCol]: prev[sourceCol].filter(id => id !== active.id), [destCol]: [...prev[destCol], active.id] }));
    setCards(prev => {
        const card = prev[active.id];
        const newLog = { text: `${sourceCol} ➔ ${destCol}`, time: new Date().toLocaleTimeString().slice(0,5) };
        return { ...prev, [active.id]: { ...card, logs: [newLog, ...(card.logs || [])] } };
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
      setFormData({ title: '', tag: 'GÖREV', assignee: '', deadline: '' });
    }
    setShowModal(true);
  };

  const handleSave = () => {
    if (!formData.title) return;
    const now = new Date().toLocaleTimeString().slice(0,5);
    if (editingCard) {
      setCards(prev => ({ ...prev, [editingCard.id]: { ...formData, id: editingCard.id, logs: [{text: "Düzenlendi", time: now}, ...(editingCard.logs || [])] } }));
    } else {
      const newId = `card-${Date.now()}`;
      setCards(prev => ({ ...prev, [newId]: { ...formData, id: newId, logs: [{text: "Oluşturuldu", time: now}] } }));
      setColumns(prev => ({ ...prev, [activeCol]: [...prev[activeCol], newId] }));
    }
    setShowModal(false);
  };

  if (!user) return <div className="h-screen bg-slate-50 flex items-center justify-center"><button onClick={() => {setUser('Admin'); localStorage.setItem('kUser', 'Admin');}} className="bg-rose-600 text-white px-10 py-4 rounded-full font-bold shadow-2xl">Sistemi Başlat</button></div>;

  return (
    <div className="h-screen bg-[#f8f9fb] flex flex-col overflow-hidden font-sans text-slate-900">
      <header className="bg-white px-10 py-5 flex justify-between items-center border-b border-slate-100 shadow-sm z-50">
        <div className="flex items-center gap-2 text-2xl font-black italic tracking-tighter"><CheckCircle2 className="text-rose-600" size={28} /> K-<span className="text-rose-600">AGILE</span></div>
        <button onClick={() => {localStorage.clear(); window.location.reload();}} className="p-2 text-slate-400 hover:text-rose-600 transition-colors"><LogOut size={22}/></button>
      </header>

      <main className="flex-1 p-10 flex gap-8 overflow-x-auto items-start">
        <DndContext sensors={sensors} collisionDetection={collisionDetectionStrategy} onDragStart={(e) => setActiveId(e.active.id)} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
          {Object.keys(columns).map(colId => (
            <div key={colId} className="w-[340px] shrink-0 bg-slate-200/40 rounded-[2.5rem] flex flex-col p-4 h-full border border-slate-200/50">
              <h2 className="font-black text-slate-500 text-[11px] tracking-[0.2em] uppercase mb-6 px-4 flex justify-between items-center">{colId} <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-[9px]">{columns[colId].length}</span></h2>
              <SortableContext id={colId} items={columns[colId]} strategy={verticalListSortingStrategy}>
                <div className="flex-1 overflow-y-auto min-h-[400px] px-1">
                   {columns[colId].map(id => (<SortableCard key={id} id={id} card={cards[id]} onDelete={(cardId) => setColumns(prev => { const nc = {...prev}; Object.keys(nc).forEach(k => nc[k] = nc[k].filter(i => i !== cardId)); return nc; })} onEdit={(card) => handleOpenModal(colId, card)} />))}
                </div>
              </SortableContext>
              <button onClick={() => handleOpenModal(colId)} className="mt-4 py-4 bg-white hover:bg-rose-600 hover:text-white text-rose-600 rounded-[1.5rem] text-[11px] font-black uppercase transition-all shadow-sm flex items-center justify-center gap-2"><Plus size={16}/> Yeni Görev Ekle</button>
            </div>
          ))}
          <DragOverlay>{activeId ? <div className="bg-white p-5 rounded-[2rem] border-2 border-rose-400 shadow-2xl opacity-90 w-[300px]"><h3 className="font-bold text-slate-800 text-sm">{cards[activeId].title}</h3></div> : null}</DragOverlay>
        </DndContext>
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[1000] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-3xl rounded-[3.5rem] p-12 shadow-2xl flex flex-col max-h-[85vh] border border-white/20">
            <h2 className="text-3xl font-black italic mb-10 flex items-center gap-3">{editingCard ? <Edit3 className="text-rose-600" /> : <Plus className="text-rose-600" />}{editingCard ? 'GÖREVİ DÜZENLE' : 'YENİ GÖREV'}</h2>
            <div className="flex gap-12 overflow-hidden">
                <div className="flex-1 space-y-6">
                    <div><label className="text-[10px] font-black text-slate-400 ml-4 mb-2 block uppercase tracking-widest">Görev Tanımı</label><input type="text" placeholder="Örn: Tasarımı İncele..." value={formData.title} className="w-full p-5 bg-slate-50 rounded-[1.5rem] outline-none focus:ring-2 ring-rose-500/20 text-slate-700 font-medium" onChange={e => setFormData({...formData, title: e.target.value})}/></div>
                    <div className="grid grid-cols-2 gap-6">
                        <div><label className="text-[10px] font-black text-slate-400 ml-4 mb-2 block uppercase tracking-widest">Kategori</label><select value={formData.tag} className="w-full p-5 bg-slate-50 rounded-[1.5rem] outline-none font-bold text-slate-600" onChange={e => setFormData({...formData, tag: e.target.value})}><option value="GÖREV">GENEL GÖREV</option><option value="UI/UX">UI/UX TASARIM</option><option value="DEV">YAZILIM GELİŞTİRME</option><option value="TEST">QA / TEST</option></select></div>
                        <div><label className="text-[10px] font-black text-slate-400 ml-4 mb-2 block uppercase tracking-widest">Sorumlu</label><input type="text" placeholder="İsim giriniz..." value={formData.assignee} className="w-full p-5 bg-slate-50 rounded-[1.5rem] outline-none focus:ring-2 ring-rose-500/20 text-slate-700 font-medium" onChange={e => setFormData({...formData, assignee: e.target.value})}/></div>
                    </div>
                    <div><label className="text-[10px] font-black text-slate-400 ml-4 mb-2 block uppercase tracking-widest">Teslim Tarihi</label><input type="date" value={formData.deadline} className="w-full p-5 bg-slate-50 rounded-[1.5rem] outline-none text-slate-600 font-bold" onChange={e => setFormData({...formData, deadline: e.target.value})}/></div>
                    <div className="flex gap-4 pt-6"><button onClick={handleSave} className="flex-[2] bg-rose-600 text-white font-black py-5 rounded-[1.5rem] shadow-xl hover:bg-rose-700 transition-all flex items-center justify-center gap-3 tracking-widest"><Save size={20}/> KAYDET</button><button onClick={() => setShowModal(false)} className="flex-1 bg-slate-100 text-slate-500 font-black py-5 rounded-[1.5rem] hover:bg-slate-200 transition-all flex items-center justify-center gap-3 tracking-widest"><Ban size={20}/> İPTAL</button></div>
                </div>
                {editingCard && (
                    <div className="w-72 border-l border-slate-100 pl-10 flex flex-col">
                        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2"><History size={16} className="text-rose-500"/> İşlem Kaydı</h3>
                        <div className="flex-1 overflow-y-auto space-y-4 pr-4 scrollbar-hide">
                            {(editingCard.logs || []).map((log, i) => (
                                <div key={i} className="text-[11px] border-l-2 border-rose-300 pl-4 py-1 relative"><div className="absolute -left-[5px] top-2 w-2 h-2 rounded-full bg-rose-400"></div><p className="font-bold text-slate-700 leading-tight flex items-center gap-2 uppercase tracking-tighter">{log.text.includes('➔') ? <span className="flex items-center gap-1 text-[10px]"><ArrowRight size={12} className="text-rose-500" /> {log.text}</span> : log.text}</p><span className="text-slate-400 font-bold text-[9px]">{log.time}</span></div>
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
