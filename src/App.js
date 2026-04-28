import React, { useState, useEffect } from 'react';
import {
  DndContext, closestCorners, KeyboardSensor, PointerSensor,
  useSensor, useSensors, DragOverlay, pointerWithin, getFirstCollision, useDroppable
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates,
  verticalListSortingStrategy, useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { LogOut, Plus, Trash2, Clock, CheckCircle2, Edit3, Save, Ban, ArrowRight, History, Lock, User, LayoutPanelLeft, Layout, ChevronDown } from 'lucide-react';

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

// --- SÜTUN BİLEŞENİ ---
const DroppableColumn = ({ id, items, title, children, onDeleteColumn, isSystemColumn }) => {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div ref={setNodeRef} className="w-[340px] shrink-0 bg-slate-200/40 rounded-[2.5rem] flex flex-col p-4 h-full border border-slate-200/50">
      <div className="flex justify-between items-center mb-6 px-4">
        <h2 className="font-black text-slate-500 text-[11px] tracking-[0.2em] uppercase flex items-center gap-2">
          {title} <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-[9px]">{items.length}</span>
        </h2>
        {!isSystemColumn && (
          <button onClick={() => onDeleteColumn(id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"><Trash2 size={14} /></button>
        )}
      </div>
      <SortableContext id={id} items={items} strategy={verticalListSortingStrategy}>
        <div className="flex-1 overflow-y-auto min-h-[150px] px-1">{children}</div>
      </SortableContext>
    </div>
  );
};

// --- ANA UYGULAMA ---
export default function App() {
  const systemColumns = ['YAPILACAK', 'İŞLEMDE', 'TAMAMLANDI'];
  
  // State Tanımları
  const [user, setUser] = useState(localStorage.getItem('kUser') || '');
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  
  // Board verilerini yükle
  const [boards, setBoards] = useState(() => {
    const saved = localStorage.getItem('kBoardsData');
    return saved ? JSON.parse(saved) : { 
      'Genel Pano': { 
        columns: { 'YAPILACAK': ['c1'], 'İŞLEMDE': [], 'TAMAMLANDI': [] },
        cards: { 'c1': { id: 'c1', title: 'Hoş Geldiniz! İlk görevinizi ekleyin.', tag: 'BİLGİ', assignee: 'Sistem', deadline: '2026-12-31', logs: [] } }
      }
    };
  });
  const [activeBoard, setActiveBoard] = useState(Object.keys(boards)[0]);
  
  const [showModal, setShowModal] = useState(false);
  const [activeCol, setActiveCol] = useState(null);
  const [editingCard, setEditingCard] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [formData, setFormData] = useState({ title: '', tag: 'GÖREV', assignee: '', deadline: '' });

  // Kayıt işlemi
  useEffect(() => {
    if (user) {
      localStorage.setItem('kBoardsData', JSON.stringify(boards));
    }
  }, [boards, user]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  // Board İşlemleri
  const handleCreateBoard = () => {
    const name = prompt("Yeni Pano Adı:");
    if (name && !boards[name]) {
      setBoards(prev => ({
        ...prev,
        [name]: { columns: { 'YAPILACAK': [], 'İŞLEMDE': [], 'TAMAMLANDI': [] }, cards: {} }
      }));
      setActiveBoard(name);
    } else if (boards[name]) { alert("Bu pano zaten mevcut!"); }
  };

  const handleDeleteBoard = () => {
    if (Object.keys(boards).length <= 1) return alert("Son kalan panoyu silemezsiniz.");
    if (window.confirm(`${activeBoard} panosunu ve içindeki TÜM görevleri silmek istediğinize emin misiniz?`)) {
      const remainingBoards = { ...boards };
      delete remainingBoards[activeBoard];
      setBoards(remainingBoards);
      setActiveBoard(Object.keys(remainingBoards)[0]);
    }
  };

  // Sütun İşlemleri
  const handleAddColumn = () => {
    const colName = prompt("Yeni Sütun Adı:");
    if (colName) {
      const upper = colName.trim().toUpperCase();
      if (boards[activeBoard].columns[upper]) return alert("Sütun mevcut!");
      setBoards(prev => ({
        ...prev,
        [activeBoard]: {
          ...prev[activeBoard],
          columns: { ...prev[activeBoard].columns, [upper]: [] }
        }
      }));
    }
  };

  const handleDeleteColumn = (colId) => {
    if (boards[activeBoard].columns[colId].length > 0) return alert("İçinde görev olan sütun silinemez!");
    setBoards(prev => {
      const newCols = { ...prev[activeBoard].columns };
      delete newCols[colId];
      return { ...prev, [activeBoard]: { ...prev[activeBoard], columns: newCols } };
    });
  };

  // Drag & Drop Mantığı
  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over) return;
    const sourceCol = Object.keys(boards[activeBoard].columns).find(key => boards[activeBoard].columns[key].includes(active.id));
    const destCol = (over.id in boards[activeBoard].columns) ? over.id : Object.keys(boards[activeBoard].columns).find(key => boards[activeBoard].columns[key].includes(over.id));
    
    if (!sourceCol || !destCol || sourceCol === destCol) return;

    setBoards(prev => {
      const currentBoard = prev[activeBoard];
      const newCols = { ...currentBoard.columns };
      newCols[sourceCol] = newCols[sourceCol].filter(id => id !== active.id);
      newCols[destCol] = [...newCols[destCol], active.id];
      
      const newCards = { ...currentBoard.cards };
      const newLog = { text: `${sourceCol} ➔ ${destCol}`, time: new Date().toLocaleTimeString().slice(0,5) };
      newCards[active.id] = { ...newCards[active.id], logs: [newLog, ...(newCards[active.id].logs || [])] };

      return { ...prev, [activeBoard]: { ...currentBoard, columns: newCols, cards: newCards } };
    });
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const colId = Object.keys(boards[activeBoard].columns).find(key => boards[activeBoard].columns[key].includes(active.id));
      if (colId) {
        setBoards(prev => {
          const currentBoard = prev[activeBoard];
          const newColItems = arrayMove(currentBoard.columns[colId], currentBoard.columns[colId].indexOf(active.id), currentBoard.columns[colId].indexOf(over.id));
          return { ...prev, [activeBoard]: { ...currentBoard, columns: { ...currentBoard.columns, [colId]: newColItems } } };
        });
      }
    }
    setActiveId(null);
  };

  const handleSaveCard = () => {
    if (!formData.title) return;
    const now = new Date().toLocaleTimeString().slice(0,5);
    setBoards(prev => {
      const currentBoard = prev[activeBoard];
      const newCards = { ...currentBoard.cards };
      const newCols = { ...currentBoard.columns };
      
      if (editingCard) {
        newCards[editingCard.id] = { ...formData, id: editingCard.id, logs: [{text: "Düzenlendi", time: now}, ...(editingCard.logs || [])] };
      } else {
        const newId = `card-${Date.now()}`;
        newCards[newId] = { ...formData, id: newId, logs: [{text: "Oluşturuldu", time: now}] };
        newCols[activeCol] = [...newCols[activeCol], newId];
      }
      return { ...prev, [activeBoard]: { ...currentBoard, columns: newCols, cards: newCards } };
    });
    setShowModal(false);
  };

  if (!user) {
    return (
      <div className="h-screen bg-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
        <form onSubmit={(e) => { e.preventDefault(); if(loginData.username==='admin' && loginData.password==='1234'){ setUser('admin'); localStorage.setItem('kUser','admin'); }}} className="bg-white/10 backdrop-blur-2xl border border-white/20 p-12 rounded-[3.5rem] w-full max-w-md shadow-2xl relative z-10">
          <div className="flex flex-col items-center mb-10"><div className="w-16 h-16 bg-rose-600 rounded-2xl flex items-center justify-center mb-4"><CheckCircle2 className="text-white" size={32} /></div><h1 className="text-white text-3xl font-black italic">K-<span className="text-rose-500">AGILE</span></h1></div>
          <div className="space-y-4">
            <input type="text" placeholder="Kullanıcı Adı" className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-white outline-none focus:border-rose-500" onChange={e => setLoginData({...loginData, username: e.target.value})} />
            <input type="password" placeholder="Şifre" className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-white outline-none focus:border-rose-500" onChange={e => setLoginData({...loginData, password: e.target.value})} />
            <button type="submit" className="w-full bg-rose-600 text-white py-5 rounded-2xl font-black tracking-widest uppercase text-sm">Giriş Yap</button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#f8f9fb] flex flex-col overflow-hidden font-sans text-slate-900">
      <header className="bg-white px-10 py-5 flex justify-between items-center border-b border-slate-100 shadow-sm z-50">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2 text-2xl font-black italic tracking-tighter"><CheckCircle2 className="text-rose-600" size={28} /> K-AGILE</div>
          
          {/* Board Selector */}
          <div className="flex items-center gap-3 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm text-[11px] font-black text-slate-600 uppercase tracking-widest">
              <Layout size={14} className="text-rose-500" />
              <select value={activeBoard} onChange={(e) => setActiveBoard(e.target.value)} className="bg-transparent outline-none cursor-pointer">
                {Object.keys(boards).map(name => <option key={name} value={name}>{name}</option>)}
              </select>
            </div>
            <button onClick={handleCreateBoard} className="p-2 hover:bg-rose-500 hover:text-white text-slate-400 rounded-xl transition-all" title="Yeni Pano"><Plus size={18}/></button>
            <button onClick={handleDeleteBoard} className="p-2 hover:bg-rose-50 text-rose-500 rounded-xl transition-all" title="Panoyu Sil"><Trash2 size={18}/></button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={handleAddColumn} className="flex items-center gap-2 bg-slate-900 text-white px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 transition-all shadow-lg"><LayoutPanelLeft size={16}/> Sütun Ekle</button>
          <div className="w-[1px] h-8 bg-slate-100 mx-2"></div>
          <button onClick={() => {localStorage.clear(); window.location.reload();}} className="p-2 text-slate-400 hover:text-rose-600 transition-colors"><LogOut size={22}/></button>
        </div>
      </header>

      <main className="flex-1 p-10 flex gap-8 overflow-x-auto items-start">
        <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragStart={(e) => setActiveId(e.active.id)} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
          {Object.keys(boards[activeBoard].columns).map(colId => (
            <DroppableColumn 
              key={colId} id={colId} title={colId} 
              items={boards[activeBoard].columns[colId]} 
              onDeleteColumn={handleDeleteColumn}
              isSystemColumn={systemColumns.includes(colId)}
            >
              {boards[activeBoard].columns[colId].map(id => (
                <SortableCard 
                  key={id} id={id} card={boards[activeBoard].cards[id]} 
                  onDelete={(cardId) => {
                    setBoards(prev => {
                      const current = prev[activeBoard];
                      const newCols = { ...current.columns };
                      Object.keys(newCols).forEach(k => newCols[k] = newCols[k].filter(i => i !== cardId));
                      const newCards = { ...current.cards };
                      delete newCards[cardId];
                      return { ...prev, [activeBoard]: { ...current, columns: newCols, cards: newCards } };
                    });
                  }} 
                  onEdit={(card) => { setActiveCol(colId); setEditingCard(card); setFormData({title: card.title, tag: card.tag, assignee: card.assignee, deadline: card.deadline}); setShowModal(true); }} 
                />
              ))}
              <button onClick={() => { setActiveCol(colId); setEditingCard(null); setFormData({title: '', tag: 'GÖREV', assignee: '', deadline: ''}); setShowModal(true); }} className="mt-4 py-4 w-full bg-white hover:bg-rose-600 hover:text-white text-rose-600 rounded-[1.5rem] text-[11px] font-black uppercase transition-all shadow-sm flex items-center justify-center gap-2"><Plus size={16}/> Görev Ekle</button>
            </DroppableColumn>
          ))}
          <DragOverlay>{activeId ? <div className="bg-white p-5 rounded-[2rem] border-2 border-rose-400 shadow-2xl opacity-90 w-[300px]"><h3 className="font-bold text-slate-800 text-sm">{boards[activeBoard].cards[activeId]?.title}</h3></div> : null}</DragOverlay>
        </DndContext>
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[1000] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-3xl rounded-[3.5rem] p-12 shadow-2xl flex flex-col max-h-[85vh]">
            <h2 className="text-3xl font-black italic mb-10 flex items-center gap-3 text-slate-800 uppercase tracking-tighter">{editingCard ? 'DÜZENLE' : 'YENİ GÖREV'}</h2>
            <div className="flex gap-12">
              <div className="flex-1 space-y-6">
                <div><label className="text-[10px] font-black text-slate-400 ml-4 mb-2 block uppercase">Görev Tanımı</label><input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full p-5 bg-slate-50 rounded-[1.5rem] outline-none focus:ring-2 ring-rose-500/20" /></div>
                <div className="grid grid-cols-2 gap-6">
                  <div><label className="text-[10px] font-black text-slate-400 ml-4 mb-2 block uppercase">Kategori</label><select value={formData.tag} onChange={e => setFormData({...formData, tag: e.target.value})} className="w-full p-5 bg-slate-50 rounded-[1.5rem] outline-none font-bold text-slate-600"><option value="GÖREV">GÖREV</option><option value="UI/UX">UI/UX</option><option value="DEV">DEV</option><option value="TEST">TEST</option></select></div>
                  <div><label className="text-[10px] font-black text-slate-400 ml-4 mb-2 block uppercase">Sorumlu</label><input type="text" value={formData.assignee} onChange={e => setFormData({...formData, assignee: e.target.value})} className="w-full p-5 bg-slate-50 rounded-[1.5rem] outline-none focus:ring-2 ring-rose-500/20" /></div>
                </div>
                <div><label className="text-[10px] font-black text-slate-400 ml-4 mb-2 block uppercase">Teslim Tarihi</label><input type="date" value={formData.deadline} onChange={e => setFormData({...formData, deadline: e.target.value})} className="w-full p-5 bg-slate-50 rounded-[1.5rem] outline-none" /></div>
                <div className="flex gap-4 pt-6"><button onClick={handleSaveCard} className="flex-[2] bg-rose-600 text-white font-black py-5 rounded-[1.5rem] shadow-xl hover:bg-rose-700 transition-all flex items-center justify-center gap-3"><Save size={20}/> KAYDET</button><button onClick={() => setShowModal(false)} className="flex-1 bg-slate-100 text-slate-500 font-black py-5 rounded-[1.5rem] hover:bg-slate-200 transition-all flex items-center justify-center gap-3"><Ban size={20}/> İPTAL</button></div>
              </div>
              {editingCard && (
                <div className="w-72 border-l border-slate-100 pl-10 flex flex-col">
                  <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2"><History size={16} className="text-rose-500"/> Geçmiş</h3>
                  <div className="flex-1 overflow-y-auto space-y-4 pr-4">
                    {(editingCard.logs || []).map((log, i) => (
                      <div key={i} className="text-[11px] border-l-2 border-rose-300 pl-4 py-1 relative"><div className="absolute -left-[5px] top-2 w-2 h-2 rounded-full bg-rose-400"></div><p className="font-bold text-slate-700">{log.text}</p><span className="text-slate-400 text-[9px]">{log.time}</span></div>
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
