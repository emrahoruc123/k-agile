import React, { useState, useEffect } from 'react';
import {
  DndContext, KeyboardSensor, PointerSensor,
  useSensor, useSensors, DragOverlay, pointerWithin, useDroppable
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates,
  verticalListSortingStrategy, useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { LogOut, Plus, Trash2, Clock, CheckCircle2, Edit3, LayoutPanelLeft, Layout, Target, AlertCircle, Sun, Moon } from 'lucide-react';

// --- KART BİLEŞENİ ---
const SortableCard = ({ id, card, onDelete, onEdit, isDark }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  
  const getDeadlineStatus = () => {
    if (!card.deadline) return 'normal';
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const deadlineDate = new Date(card.deadline); deadlineDate.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return 'critical';
    if (diffDays <= 3) return 'warning';
    return 'normal';
  };

  const status = getDeadlineStatus();
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.3 : 1, zIndex: 100 };

  return (
    <div
      ref={setNodeRef} style={style} {...attributes} {...listeners}
      className={`p-4 md:p-5 rounded-[1.5rem] md:rounded-[2rem] border shadow-sm mb-4 transition-all relative group cursor-grab active:cursor-grabbing
        ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}
        ${status === 'critical' ? 'border-rose-500 shadow-rose-900/20 ring-2 ring-rose-500/20' : ''}
        ${status === 'warning' ? 'border-amber-500 shadow-amber-900/10' : ''}
        hover:border-rose-400`}
    >
      <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
        <button onClick={(e) => { e.stopPropagation(); onEdit(card); }} className={`p-2 rounded-lg border transition-colors ${isDark ? 'bg-slate-700 border-slate-600 text-slate-400 hover:text-blue-400' : 'bg-slate-50 border-slate-100 text-slate-400 hover:text-blue-600'}`}><Edit3 size={14} /></button>
        <button onClick={(e) => { e.stopPropagation(); onDelete(id); }} className={`p-2 rounded-lg border transition-colors ${isDark ? 'bg-slate-700 border-slate-600 text-slate-400 hover:text-rose-400' : 'bg-slate-50 border-slate-100 text-slate-400 hover:text-rose-600'}`}><Trash2 size={14} /></button>
      </div>
      <div className="flex justify-between items-start mb-3 pr-20">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${isDark ? 'bg-rose-600 text-white' : 'bg-slate-900 text-white'}`}>{card.tag}</span>
          {status === 'critical' && <AlertCircle size={14} className="text-rose-500 animate-pulse" />}
        </div>
      </div>
      <h3 className={`font-bold text-sm leading-snug pr-4 mb-3 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{card.title}</h3>
      <div className={`flex justify-between items-center pt-3 border-t ${isDark ? 'border-slate-700' : 'border-slate-50'}`}>
        <div className="flex items-center gap-1.5">
          <Clock size={12} className={status === 'critical' ? 'text-rose-500' : 'text-slate-400'} />
          <span className={`text-[9px] font-bold uppercase ${status === 'critical' ? 'text-rose-500' : 'text-slate-500'}`}>{card.deadline || 'Süresiz'}</span>
        </div>
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black border shadow-sm ${isDark ? 'bg-slate-700 text-slate-300 border-slate-600' : 'bg-slate-100 text-slate-600 border-white'}`}>{(card.assignee || 'K').charAt(0)}</div>
      </div>
    </div>
  );
};

// --- SÜTUN BİLEŞENİ ---
const DroppableColumn = ({ id, items, title, children, onDeleteColumn, isSystemColumn, isDark }) => {
  const { setNodeRef } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={`w-full md:w-[340px] shrink-0 rounded-[2rem] flex flex-col p-4 mb-6 md:mb-0 border transition-colors ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-200/40 border-slate-200/50'}`}>
      <div className="flex justify-between items-center mb-4 px-2">
        <h2 className={`font-black text-[10px] md:text-[11px] tracking-[0.2em] uppercase flex items-center gap-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          {title} <span className={`px-2 py-0.5 rounded-full ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-600'}`}>{items.length}</span>
        </h2>
        {!isSystemColumn && <button onClick={() => onDeleteColumn(id)} className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"><Trash2 size={16} /></button>}
      </div>
      <SortableContext id={id} items={items} strategy={verticalListSortingStrategy}>
        <div className="flex-1 min-h-[100px]">{children}</div>
      </SortableContext>
    </div>
  );
};

// --- ANA UYGULAMA ---
export default function App() {
  const systemColumns = ['YAPILACAK', 'İŞLEMDE', 'TAMAMLANDI'];
  const [user, setUser] = useState(localStorage.getItem('kUser') || '');
  const [isDark, setIsDark] = useState(localStorage.getItem('kTheme') === 'dark');
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [boards, setBoards] = useState(() => {
    const saved = localStorage.getItem('kBoardsData');
    return saved ? JSON.parse(saved) : { 
      'Genel Pano': { columns: { 'YAPILACAK': ['c1'], 'İŞLEMDE': [], 'TAMAMLANDI': [] }, cards: { 'c1': { id: 'c1', title: 'Hoş Geldiniz!', tag: 'BİLGİ', assignee: 'Sistem', deadline: '2026-12-31', logs: [] } } }
    };
  });
  
  const [activeBoard, setActiveBoard] = useState(Object.keys(boards)[0]);
  const [showModal, setShowModal] = useState(false);
  const [activeCol, setActiveCol] = useState(null);
  const [editingCard, setEditingCard] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [formData, setFormData] = useState({ title: '', tag: 'GÖREV', assignee: '', deadline: '' });

  useEffect(() => {
    if (user) localStorage.setItem('kBoardsData', JSON.stringify(boards));
    localStorage.setItem('kTheme', isDark ? 'dark' : 'light');
  }, [boards, user, isDark]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const progress = (() => {
    const b = boards[activeBoard];
    const total = Object.values(b.columns).reduce((a, c) => a + c.length, 0);
    return total === 0 ? 0 : Math.round(((b.columns['TAMAMLANDI']?.length || 0) / total) * 100);
  })();

  const handleSaveCard = () => {
    if (!formData.title) return;
    const now = new Date().toLocaleTimeString().slice(0,5);
    setBoards(prev => {
      const b = prev[activeBoard];
      const nCrds = { ...b.cards }; const nCols = { ...b.columns };
      if (editingCard) { nCrds[editingCard.id] = { ...formData, id: editingCard.id, logs: [{text: "Güncellendi", time: now}, ...(editingCard.logs || [])] }; }
      else { const id = `c-${Date.now()}`; nCrds[id] = { ...formData, id, logs: [{text: "Açıldı", time: now}] }; nCols[activeCol] = [...nCols[activeCol], id]; }
      return { ...prev, [activeBoard]: { ...b, cards: nCrds, columns: nCols } };
    });
    setShowModal(false);
  };

  if (!user) {
    return (
      <div className={`h-screen flex items-center justify-center p-4 transition-colors ${isDark ? 'bg-slate-950' : 'bg-slate-900'}`}>
        <form onSubmit={(e) => { e.preventDefault(); if(loginData.username==='admin'&&loginData.password==='1234'){setUser('admin'); localStorage.setItem('kUser','admin');}}} className="bg-white/10 backdrop-blur-xl p-8 md:p-12 rounded-[2.5rem] w-full max-w-sm border border-white/20">
          <div className="flex flex-col items-center mb-8"><CheckCircle2 className="text-rose-500 mb-4" size={48} /><h1 className="text-white text-2xl font-black italic">K-AGILE</h1></div>
          <input type="text" placeholder="Admin" className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-white mb-4 outline-none" onChange={e => setLoginData({...loginData, username: e.target.value})} />
          <input type="password" placeholder="1234" className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-white mb-6 outline-none" onChange={e => setLoginData({...loginData, password: e.target.value})} />
          <button className="w-full bg-rose-600 text-white py-4 rounded-xl font-bold uppercase tracking-widest shadow-lg shadow-rose-600/30">Giriş</button>
        </form>
      </div>
    );
  }

  return (
    <div className={`h-screen flex flex-col font-sans transition-colors overflow-hidden ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-[#f8f9fb] text-slate-900'}`}>
      <header className={`px-4 md:px-10 pt-4 pb-1 md:py-4 flex flex-col md:flex-row justify-between items-center gap-4 border-b shadow-sm z-50 transition-colors ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
        <div className="flex items-center justify-between w-full md:w-auto gap-4">
          <div className="flex items-center gap-1 text-xl font-black italic"><CheckCircle2 className="text-rose-600" size={24} /> K-AGILE</div>
          <button onClick={() => setIsDark(!isDark)} className={`p-2 rounded-xl transition-all ${isDark ? 'bg-slate-800 text-amber-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>{isDark ? <Sun size={20}/> : <Moon size={20}/>}</button>
          <button onClick={() => {localStorage.clear(); window.location.reload();}} className="md:hidden p-2 text-slate-400"><LogOut size={20}/></button>
        </div>
        <div className="hidden md:flex items-center gap-4 flex-1 max-w-md px-10">
           <div className={`flex-1 h-2.5 rounded-full overflow-hidden border transition-colors ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
              <div className="bg-rose-500 h-full transition-all duration-500 shadow-[0_0_10px_rgba(244,63,94,0.3)]" style={{ width: `${progress}%` }}></div>
           </div>
           <span className="text-sm font-black text-rose-600">%{progress}</span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          <div className={`flex items-center gap-2 p-1 rounded-xl border shrink-0 transition-colors ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
            <Layout size={14} className="ml-2 text-rose-500" />
            <select value={activeBoard} onChange={(e) => setActiveBoard(e.target.value)} className="bg-transparent text-[10px] font-bold p-2 outline-none">
              {Object.keys(boards).map(n => <option key={n} value={n} className={isDark ? 'bg-slate-800' : 'bg-white'}>{n}</option>)}
            </select>
            <button onClick={() => { const name = prompt("Pano Adı:"); if(name) setBoards(p => ({...p, [name]: {columns:{'YAPILACAK':[],'İŞLEMDE':[],'TAMAMLANDI':[]}, cards:{}}})); }} className="p-2 hover:text-rose-600"><Plus size={16}/></button>
          </div>
          <button onClick={() => { const col = prompt("Sütun Adı:"); if(col) setBoards(p => ({...p, [activeBoard]: {...p[activeBoard], columns:{...p[activeBoard].columns, [col.toUpperCase()]:[]}}})); }} className={`p-2.5 rounded-xl transition-colors ${isDark ? 'bg-slate-100 text-slate-900' : 'bg-slate-900 text-white'}`}><LayoutPanelLeft size={18}/></button>
          <button onClick={() => {localStorage.clear(); window.location.reload();}} className="hidden md:block p-2 text-slate-400 hover:text-rose-600 transition-colors"><LogOut size={22}/></button>
        </div>
      </header>
      <div className="md:hidden w-full bg-slate-100 h-1"><div className="bg-rose-500 h-full transition-all duration-500" style={{ width: `${progress}%` }}></div></div>
      <main className="flex-1 p-4 md:p-10 flex flex-col md:flex-row gap-6 overflow-y-auto md:overflow-x-auto items-start">
        <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragStart={(e) => setActiveId(e.active.id)} onDragOver={(e) => {
          const {active, over} = e; if(!over) return;
          const b = boards[activeBoard]; const sCol = Object.keys(b.columns).find(k => b.columns[k].includes(active.id));
          const dCol = (over.id in b.columns) ? over.id : Object.keys(b.columns).find(k => b.columns[k].includes(over.id));
          if(!sCol || !dCol || sCol === dCol) return;
          setBoards(prev => {
            const cur = prev[activeBoard]; const nc = {...cur.columns}; nc[sCol] = nc[sCol].filter(id => id !== active.id); nc[dCol] = [...nc[dCol], active.id];
            const nCrds = {...cur.cards}; nCrds[active.id].logs = [{text: `${sCol} ➔ ${dCol}`, time: new Date().toLocaleTimeString().slice(0,5)}, ...(nCrds[active.id].logs || [])];
            return {...prev, [activeBoard]: {...cur, columns: nc, cards: nCrds}};
          });
        }} onDragEnd={(e) => {
          const {active, over} = e; if(over && active.id !== over.id) {
            const colId = Object.keys(boards[activeBoard].columns).find(k => boards[activeBoard].columns[k].includes(active.id));
            if(colId) setBoards(p => { const b = p[activeBoard]; const nci = arrayMove(b.columns[colId], b.columns[colId].indexOf(active.id), b.columns[colId].indexOf(over.id)); return {...p, [activeBoard]: {...b, columns:{...b.columns, [colId]:nci}}}; });
          } setActiveId(null);
        }}>
          {Object.keys(boards[activeBoard].columns).map(colId => (
            <DroppableColumn key={colId} id={colId} title={colId} items={boards[activeBoard].columns[colId]} isDark={isDark} isSystemColumn={systemColumns.includes(colId)} onDeleteColumn={(id) => { if(boards[activeBoard].columns[id].length > 0) return alert("Sütun dolu!"); setBoards(p => { const b=p[activeBoard]; const nc={...b.columns}; delete nc[id]; return {...p, [activeBoard]:{...b, columns:nc}}; }); }}>
              {boards[activeBoard].columns[colId].map(id => (
                <SortableCard key={id} id={id} card={boards[activeBoard].cards[id]} isDark={isDark} onDelete={(cid) => setBoards(p => { const b=p[activeBoard]; const nc={...b.columns}; Object.keys(nc).forEach(k => nc[k]=nc[k].filter(i=>i!==cid)); const nCrds={...b.cards}; delete nCrds[cid]; return {...p, [activeBoard]:{...b, columns:nc, cards:nCrds}}; })} onEdit={(c) => { setActiveCol(colId); setEditingCard(c); setFormData({title: c.title, tag: c.tag, assignee: c.assignee, deadline: c.deadline}); setShowModal(true); }} />
              ))}
              <button onClick={() => { setActiveCol(colId); setEditingCard(null); setFormData({title:'', tag:'GÖREV', assignee:'', deadline:''}); setShowModal(true); }} className={`w-full py-4 rounded-2xl text-[10px] font-bold uppercase shadow-sm border border-dashed transition-all ${isDark ? 'bg-slate-800/50 text-rose-400 border-slate-700 hover:bg-slate-800' : 'bg-white text-rose-600 border-rose-200 hover:bg-rose-50'}`}>+ Görev Ekle</button>
            </DroppableColumn>
          ))}
          <DragOverlay>{activeId && boards[activeBoard].cards[activeId] ? <div className={`p-4 rounded-2xl border-2 border-rose-400 shadow-xl w-[280px] ${isDark ? 'bg-slate-800 text-white' : 'bg-white text-slate-800'}`}><h3 className="font-bold text-xs">{boards[activeBoard].cards[activeId].title}</h3></div> : null}</DragOverlay>
        </DndContext>
      </main>
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1000] flex items-end md:items-center justify-center p-0 md:p-6">
          <div className={`w-full max-w-2xl rounded-t-[2rem] md:rounded-[2.5rem] p-6 md:p-10 shadow-2xl transition-colors ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
            <h2 className="text-xl font-black mb-6 uppercase tracking-tighter">{editingCard ? 'Düzenle' : 'Yeni Görev'}</h2>
            <div className="space-y-4">
              <input type="text" placeholder="Görev Başlığı" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className={`w-full p-4 rounded-xl outline-none border ${isDark ? 'bg-slate-800 border-slate-700 text-white focus:border-rose-500' : 'bg-slate-50 border-slate-100 focus:border-rose-300'}`} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select value={formData.tag} onChange={e => setFormData({...formData, tag: e.target.value})} className={`w-full p-4 rounded-xl outline-none font-bold ${isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-50 text-slate-600 border-slate-100'}`}><option value="GÖREV">GÖREV</option><option value="UI/UX">UI/UX</option><option value="DEV">DEV</option><option value="BİLGİ">BİLGİ</option></select>
                <input type="text" placeholder="Sorumlu" value={formData.assignee} onChange={e => setFormData({...formData, assignee: e.target.value})} className={`w-full p-4 rounded-xl outline-none border ${isDark ? 'bg-slate-800 border-slate-700 text-white focus:border-rose-500' : 'bg-slate-50 border-slate-100 focus:border-rose-300'}`} />
              </div>
              <input type="date" value={formData.deadline} onChange={e => setFormData({...formData, deadline: e.target.value})} className={`w-full p-4 rounded-xl outline-none border ${isDark ? 'bg-slate-800 border-slate-700 text-white focus:border-rose-500' : 'bg-slate-50 border-slate-100 focus:border-rose-300'}`} />
              {editingCard && <div className={`mt-4 p-4 rounded-xl max-h-40 overflow-y-auto border ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}><p className="text-[10px] font-black text-slate-400 uppercase mb-2 italic">İşlem Geçmişi</p>{editingCard.logs?.map((l, i) => (<div key={i} className="text-[10px] border-l-2 border-rose-500 pl-2 mb-2"><span className={`font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{l.text}</span> - <span className="text-slate-500">{l.time}</span></div>))}</div>}
              <div className="flex gap-3 pt-4"><button onClick={handleSaveCard} className="flex-1 bg-rose-600 text-white py-4 rounded-xl font-bold uppercase tracking-widest shadow-lg shadow-rose-600/20 hover:bg-rose-700">Kaydet</button><button onClick={() => setShowModal(false)} className={`flex-1 py-4 rounded-xl font-bold uppercase tracking-widest transition-colors ${isDark ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>Kapat</button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
