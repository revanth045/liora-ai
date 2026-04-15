
import React, { useState, useEffect, useRef } from 'react';
import { Icon } from '../../../components/Icon';
import {
  db_listStaff, db_addStaffMember, db_updateStaffMember, db_deleteStaffMember,
  db_listShifts, db_addShift, db_updateShift, db_deleteShift,
  db_listAttendance, db_upsertAttendance, db_seedAttendance,
  type DemoStaffMember, type DemoShift, type StaffRole, type StaffStatus, type ShiftDay,
  type DemoRestaurant, type DemoAttendanceRecord, type AttendanceStatus,
} from '../../demoDb';

// --- Constants ----------------------------------------------------------------
const ROLES: StaffRole[] = [
  'Head Chef', 'Sous Chef', 'Line Cook', 'Prep Cook', 'Pastry Chef',
  'Server', 'Bartender', 'Host/Hostess', 'Busser', 'Food Runner',
  'Manager', 'Cashier', 'Dishwasher', 'Barista', 'Other',
];

const DAYS: ShiftDay[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Returns "YYYY-MM-DD" for the Monday of the week containing `date`
function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

function addWeeks(weekStart: string, delta: number): string {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + delta * 7);
  return d.toISOString().slice(0, 10);
}

function formatWeekLabel(weekStart: string): string {
  const d = new Date(weekStart);
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 6);
  const fmt = (dt: Date) => dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${fmt(d)} � ${fmt(end)}, ${end.getFullYear()}`;
}

function getDayDate(weekStart: string, dayIndex: number): string {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + dayIndex);
  return d.getDate().toString();
}

function shiftHours(s: DemoShift): string {
  const [sh, sm] = s.startTime.split(':').map(Number);
  const [eh, em] = s.endTime.split(':').map(Number);
  const mins = (eh * 60 + em) - (sh * 60 + sm);
  if (mins <= 0) return '';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

// Consistent colour per staff member (by index in list)
const SHIFT_COLORS = [
  'bg-blue-50 text-blue-800 border-l-blue-500',
  'bg-green-50 text-green-800 border-l-green-500',
  'bg-purple-50 text-purple-800 border-l-purple-500',
  'bg-amber-50 text-amber-800 border-l-amber-500',
  'bg-rose-50 text-rose-800 border-l-rose-500',
  'bg-cyan-50 text-cyan-800 border-l-cyan-500',
  'bg-orange-50 text-orange-800 border-l-orange-500',
  'bg-indigo-50 text-indigo-800 border-l-indigo-500',
];

// --- Input helpers ------------------------------------------------------------
const inputCls = 'w-full px-4 py-2.5 rounded-xl border border-cream-200 bg-cream-50 text-stone-800 text-sm focus:outline-none focus:border-forest-900/30 focus:bg-white transition-colors';
const FieldWrap = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest">{label}</label>
    {children}
  </div>
);

// --- Staff Form Type -----------------------------------------------------------
type StaffForm = {
  name: string; role: StaffRole; phone: string;
  email: string; hourlyRate: string; status: StaffStatus; notes: string;
};
const EMPTY_STAFF: StaffForm = {
  name: '', role: 'Server', phone: '', email: '', hourlyRate: '', status: 'active', notes: '',
};

// --- Staff Modal --------------------------------------------------------------
function StaffModal({ title, form, onChange, onSave, onClose, saving }: {
  title: string; form: StaffForm; onChange: (f: StaffForm) => void;
  onSave: () => void; onClose: () => void; saving: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);
  const set = (k: keyof StaffForm, v: string) => onChange({ ...form, [k]: v });
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-cream-200">
          <h2 className="font-lora text-lg font-bold text-stone-800">{title}</h2>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700 p-1 rounded-lg hover:bg-cream-50 transition-colors">
            <Icon name="close" size={20} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <FieldWrap label="Full Name *">
            <input ref={ref} value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Jane Smith" className={inputCls} />
          </FieldWrap>
          <div className="grid grid-cols-2 gap-4">
            <FieldWrap label="Role *">
              <select value={form.role} onChange={e => set('role', e.target.value as StaffRole)} className={inputCls}>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </FieldWrap>
            <FieldWrap label="Status">
              <select value={form.status} onChange={e => set('status', e.target.value as StaffStatus)} className={inputCls}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </FieldWrap>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FieldWrap label="Phone (optional)">
              <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+1 555 000 0000" className={inputCls} />
            </FieldWrap>
            <FieldWrap label="Hourly Rate $ (optional)">
              <input type="number" min="0" step="0.5" value={form.hourlyRate} onChange={e => set('hourlyRate', e.target.value)} placeholder="e.g. 18.00" className={inputCls} />
            </FieldWrap>
          </div>
          <FieldWrap label="Email (optional)">
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="jane@example.com" className={inputCls} />
          </FieldWrap>
          <FieldWrap label="Notes (optional)">
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} placeholder="Any notes�" className={`${inputCls} resize-none`} />
          </FieldWrap>
        </div>
        <div className="flex gap-3 p-5 pt-0">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-cream-200 text-stone-600 text-sm font-semibold hover:bg-cream-50 transition-colors">Cancel</button>
          <button onClick={onSave} disabled={saving}
            className="flex-1 px-4 py-2.5 rounded-xl bg-forest-900 text-white text-sm font-bold hover:bg-forest-900/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
            {saving ? <><Icon name="autorenew" size={16} /> Saving�</> : <><Icon name="check" size={16} /> Save</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Shift Modal --------------------------------------------------------------
type ShiftForm = { staffId: string; day: ShiftDay; startTime: string; endTime: string; notes: string; };
const EMPTY_SHIFT: ShiftForm = { staffId: '', day: 'Mon', startTime: '09:00', endTime: '17:00', notes: '' };

function ShiftModal({ form, onChange, staff, onSave, onClose, saving, editId }: {
  form: ShiftForm; onChange: (f: ShiftForm) => void;
  staff: DemoStaffMember[]; onSave: () => void; onClose: () => void;
  saving: boolean; editId: string | null;
}) {
  const set = (k: keyof ShiftForm, v: string) => onChange({ ...form, [k]: v });
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-cream-200">
          <h2 className="font-lora text-lg font-bold text-stone-800">{editId ? 'Edit Shift' : 'Add Shift'}</h2>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700 p-1 rounded-lg hover:bg-cream-50 transition-colors">
            <Icon name="close" size={20} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <FieldWrap label="Staff Member *">
            <select value={form.staffId} onChange={e => set('staffId', e.target.value)} className={inputCls}>
              <option value="">� Select staff member �</option>
              {staff.filter(s => s.status === 'active').map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
              ))}
            </select>
          </FieldWrap>
          <FieldWrap label="Day *">
            <select value={form.day} onChange={e => set('day', e.target.value as ShiftDay)} className={inputCls}>
              {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </FieldWrap>
          <div className="grid grid-cols-2 gap-4">
            <FieldWrap label="Start Time *">
              <input type="time" value={form.startTime} onChange={e => set('startTime', e.target.value)} className={inputCls} />
            </FieldWrap>
            <FieldWrap label="End Time *">
              <input type="time" value={form.endTime} onChange={e => set('endTime', e.target.value)} className={inputCls} />
            </FieldWrap>
          </div>
          <FieldWrap label="Notes (optional)">
            <input value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Any shift notes�" className={inputCls} />
          </FieldWrap>
        </div>
        <div className="flex gap-3 p-5 pt-0">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-cream-200 text-stone-600 text-sm font-semibold hover:bg-cream-50">Cancel</button>
          <button onClick={onSave} disabled={saving}
            className="flex-1 px-4 py-2.5 rounded-xl bg-forest-900 text-white text-sm font-bold hover:bg-forest-900/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
            {saving ? 'Saving�' : <><Icon name="check" size={16} /> Save Shift</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Delete Confirm ------------------------------------------------------------
function DeleteConfirm({ label, onConfirm, onClose }: { label: string; onConfirm: () => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto">
          <Icon name="delete" size={28} className="text-red-500" />
        </div>
        <h3 className="font-lora text-lg font-bold text-stone-800">Remove?</h3>
        <p className="text-sm text-stone-400">
          "<span className="font-semibold text-stone-700">{label}</span>" will be permanently deleted.
        </p>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-cream-200 text-stone-600 text-sm font-semibold hover:bg-cream-50">Cancel</button>
          <button onClick={onConfirm} className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-colors">Delete</button>
        </div>
      </div>
    </div>
  );
}

// --- Main Component ------------------------------------------------------------
export default function RestoStaff({ restaurant }: { restaurant: DemoRestaurant }) {
  const [view, setView] = useState<'roster' | 'schedule' | 'attendance'>('roster');
  const [staff, setStaff] = useState<DemoStaffMember[]>([]);
  const [shifts, setShifts] = useState<DemoShift[]>([]);
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<StaffRole | 'all'>('all');

  // Staff modal
  const [staffModal, setStaffModal] = useState(false);
  const [editStaff, setEditStaff] = useState<DemoStaffMember | null>(null);
  const [staffForm, setStaffForm] = useState<StaffForm>(EMPTY_STAFF);
  const [staffSaving, setStaffSaving] = useState(false);
  const [deleteStaff, setDeleteStaff] = useState<DemoStaffMember | null>(null);

  // Shift modal
  const [shiftModal, setShiftModal] = useState(false);
  const [editShift, setEditShift] = useState<DemoShift | null>(null);
  const [shiftForm, setShiftForm] = useState<ShiftForm>(EMPTY_SHIFT);
  const [shiftSaving, setShiftSaving] = useState(false);
  const [deleteShift, setDeleteShiftTarget] = useState<DemoShift | null>(null);

  // --- Attendance state -------------------------------------------------------
  const [attendanceDate, setAttendanceDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [attendance, setAttendance] = useState<DemoAttendanceRecord[]>([]);


  const loadStaff = () => {
    const members = db_listStaff(restaurant.id);
    setStaff(members);
    if (members.length > 0) db_seedAttendance(restaurant.id, members.map(m => m.id));
    setAttendance(db_listAttendance(restaurant.id));
  };
  const loadShifts = () => setShifts(db_listShifts(restaurant.id, weekStart));
  const loadAttendance = () => setAttendance(db_listAttendance(restaurant.id));

  useEffect(() => { loadStaff(); }, [restaurant.id]);
  useEffect(() => { loadShifts(); }, [restaurant.id, weekStart]);
  useEffect(() => { loadAttendance(); }, [restaurant.id, attendanceDate]);

  // --- Roster filters ---------------------------------------------------------
  const visibleStaff = staff.filter(s => {
    if (roleFilter !== 'all' && s.role !== roleFilter) return false;
    if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.role.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
  const activeCount = staff.filter(s => s.status === 'active').length;

  // Total scheduled hours this week
  const totalWeekHours = shifts.reduce((sum, s) => {
    const [sh, sm] = s.startTime.split(':').map(Number);
    const [eh, em] = s.endTime.split(':').map(Number);
    const mins = (eh * 60 + em) - (sh * 60 + sm);
    return sum + (mins > 0 ? mins / 60 : 0);
  }, 0);

  // --- Staff CRUD -------------------------------------------------------------
  const openAddStaff = () => { setEditStaff(null); setStaffForm(EMPTY_STAFF); setStaffModal(true); };
  const openEditStaff = (m: DemoStaffMember) => {
    setEditStaff(m);
    setStaffForm({ name: m.name, role: m.role, phone: m.phone ?? '', email: m.email ?? '', hourlyRate: m.hourlyRate != null ? String(m.hourlyRate) : '', status: m.status, notes: m.notes ?? '' });
    setStaffModal(true);
  };
  const handleSaveStaff = () => {
    if (!staffForm.name.trim()) return;
    setStaffSaving(true);
    const rate = staffForm.hourlyRate !== '' ? parseFloat(staffForm.hourlyRate) : undefined;
    if (editStaff) {
      db_updateStaffMember({ ...editStaff, name: staffForm.name.trim(), role: staffForm.role, phone: staffForm.phone.trim() || undefined, email: staffForm.email.trim() || undefined, hourlyRate: rate, status: staffForm.status, notes: staffForm.notes.trim() || undefined });
    } else {
      db_addStaffMember({ restaurantId: restaurant.id, name: staffForm.name.trim(), role: staffForm.role, phone: staffForm.phone.trim() || undefined, email: staffForm.email.trim() || undefined, hourlyRate: rate, status: staffForm.status, notes: staffForm.notes.trim() || undefined });
    }
    setStaffSaving(false);
    setStaffModal(false);
    loadStaff();
  };
  const handleDeleteStaff = () => {
    if (!deleteStaff) return;
    db_deleteStaffMember(deleteStaff.id);
    setDeleteStaff(null);
    loadStaff();
    loadShifts();
  };

  // --- Shift CRUD -------------------------------------------------------------
  const openAddShift = (day?: ShiftDay, staffId?: string) => {
    setEditShift(null);
    setShiftForm({ ...EMPTY_SHIFT, day: day ?? 'Mon', staffId: staffId ?? '' });
    setShiftModal(true);
  };
  const openEditShift = (s: DemoShift) => {
    setEditShift(s);
    setShiftForm({ staffId: s.staffId, day: s.day, startTime: s.startTime, endTime: s.endTime, notes: s.notes ?? '' });
    setShiftModal(true);
  };
  const handleSaveShift = () => {
    if (!shiftForm.staffId) return;
    setShiftSaving(true);
    if (editShift) {
      db_updateShift({ ...editShift, staffId: shiftForm.staffId, day: shiftForm.day, startTime: shiftForm.startTime, endTime: shiftForm.endTime, notes: shiftForm.notes.trim() || undefined });
    } else {
      db_addShift({ restaurantId: restaurant.id, weekStart, staffId: shiftForm.staffId, day: shiftForm.day, startTime: shiftForm.startTime, endTime: shiftForm.endTime, notes: shiftForm.notes.trim() || undefined });
    }
    setShiftSaving(false);
    setShiftModal(false);
    loadShifts();
  };
  const handleDeleteShift = () => {
    if (!deleteShift) return;
    db_deleteShift(deleteShift.id);
    setDeleteShiftTarget(null);
    loadShifts();
  };

  // Staff colour map
  const staffColorMap = Object.fromEntries(
    staff.map((s, i) => [s.id, SHIFT_COLORS[i % SHIFT_COLORS.length]])
  );

  // --- Render ------------------------------------------------------------------
  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-page-slide pb-20">

      {/* Modals */}
      {staffModal && <StaffModal title={editStaff ? 'Edit Staff Member' : 'Add Staff Member'} form={staffForm} onChange={setStaffForm} onSave={handleSaveStaff} onClose={() => setStaffModal(false)} saving={staffSaving} />}
      {deleteStaff && <DeleteConfirm label={deleteStaff.name} onConfirm={handleDeleteStaff} onClose={() => setDeleteStaff(null)} />}
      {shiftModal && <ShiftModal form={shiftForm} onChange={setShiftForm} staff={staff} onSave={handleSaveShift} onClose={() => setShiftModal(false)} saving={shiftSaving} editId={editShift?.id ?? null} />}
      {deleteShift && <DeleteConfirm label={`${staff.find(s => s.id === deleteShift.staffId)?.name ?? 'Shift'} � ${deleteShift.day} ${deleteShift.startTime}�${deleteShift.endTime}`} onConfirm={handleDeleteShift} onClose={() => setDeleteShiftTarget(null)} />}

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-cream-200 shadow-sm">
          <div className="text-[10px] text-stone-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5"><Icon name="group" size={12} /> Total Staff</div>
          <div className="text-2xl font-lora font-bold text-stone-800">{staff.length}</div>
          <div className="text-xs text-stone-400 mt-0.5">{activeCount} active</div>
        </div>
        <div className="p-5 bg-white rounded-2xl border border-cream-200 shadow-sm">
          <div className="text-[10px] text-stone-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5"><Icon name="calendar_month" size={12} /> Shifts This Week</div>
          <div className="text-2xl font-lora font-bold text-stone-800">{shifts.length}</div>
          <div className="text-xs text-stone-400 mt-0.5">{totalWeekHours.toFixed(1)} hrs scheduled</div>
        </div>
        <div className="p-5 bg-white rounded-2xl border border-cream-200 shadow-sm">
          <div className="text-[10px] text-stone-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5"><Icon name="attach_money" size={12} /> Est. Labour Cost</div>
          <div className="text-2xl font-lora font-bold text-stone-800">
            {(() => {
              let cost = 0;
              shifts.forEach(sh => {
                const member = staff.find(s => s.id === sh.staffId);
                if (!member?.hourlyRate) return;
                const [sh0, sm0] = sh.startTime.split(':').map(Number);
                const [eh, em] = sh.endTime.split(':').map(Number);
                const hrs = ((eh * 60 + em) - (sh0 * 60 + sm0)) / 60;
                if (hrs > 0) cost += hrs * member.hourlyRate;
              });
              return cost > 0 ? `$${cost.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : '�';
            })()}
          </div>
          <div className="text-xs text-stone-400 mt-0.5">for this week</div>
        </div>
        <button onClick={openAddStaff}
          className="p-5 bg-forest-900 rounded-2xl shadow-sm text-white flex items-center gap-3 hover:bg-forest-900/90 transition-colors active:scale-95 group">
          <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
            <Icon name="person_add" size={20} />
          </div>
          <div className="text-left">
            <div className="text-xs font-bold leading-tight">Add Staff</div>
            <div className="text-[10px] text-white/60 leading-tight">Add team member</div>
          </div>
        </button>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-cream-200 overflow-hidden">
        {/* Sub-Nav */}
        <div className="p-4 border-b border-cream-200 bg-cream-100/50 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex bg-white p-1 rounded-xl border border-cream-200 shadow-sm">
            {[{ id: 'roster', label: 'Team Roster', icon: 'group' }, { id: 'schedule', label: 'Weekly Schedule', icon: 'calendar_month' }, { id: 'attendance', label: 'Attendance', icon: 'event_available' }].map(t => (
              <button key={t.id} onClick={() => setView(t.id as any)}
                className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${view === t.id ? 'bg-forest-900 text-white shadow-md' : 'text-stone-400 hover:text-stone-700'}`}>
                <Icon name={t.icon} size={14} /> {t.label}
              </button>
            ))}
          </div>
          {view === 'roster' && (
            <div className="flex gap-2 w-full sm:w-auto">
              <select value={roleFilter} onChange={e => setRoleFilter(e.target.value as StaffRole | 'all')}
                className="px-3 py-2 bg-white border border-cream-200 rounded-xl text-xs text-stone-600 outline-none shadow-sm flex-shrink-0">
                <option value="all">All Roles</option>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <div className="relative flex-1">
                <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or role�"
                  className="w-full pl-8 pr-4 py-2 bg-white border border-cream-200 rounded-xl text-xs outline-none shadow-sm" />
                <Icon name="search" size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
              </div>
            </div>
          )}
          {view === 'schedule' && (
            <button onClick={() => openAddShift()}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-cream-200 rounded-xl text-xs font-bold text-stone-700 hover:bg-cream-50 transition-colors shadow-sm">
              <Icon name="add" size={14} /> Add Shift
            </button>
          )}
        </div>

        {/* --- ROSTER VIEW ------------------------------------------------------ */}
        {view === 'roster' && (
          <div className="overflow-x-auto">
            <div className="min-w-[680px]">
              {/* Header */}
              <div className="grid grid-cols-12 gap-3 px-5 py-3 bg-cream-100/80 text-[10px] font-bold text-stone-400 uppercase tracking-widest border-b border-cream-200">
                <div className="col-span-4">Name</div>
                <div className="col-span-3">Role</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2">Pay Rate</div>
                <div className="col-span-1 text-right">Act.</div>
              </div>
              <div className="divide-y divide-cream-200/70">
                {visibleStaff.length === 0 ? (
                  <div className="py-16 text-center">
                    <Icon name="group" size={40} className="text-stone-300 mx-auto mb-3" />
                    <p className="text-stone-400 text-sm font-medium">
                      {staff.length === 0 ? 'No staff members yet.' : 'No results for your search.'}
                    </p>
                    {staff.length === 0 && (
                      <button onClick={openAddStaff} className="mt-3 text-forest-900 text-xs font-bold hover:underline flex items-center gap-1 mx-auto">
                        <Icon name="add" size={14} /> Add your first team member
                      </button>
                    )}
                  </div>
                ) : visibleStaff.map(member => (
                  <div key={member.id} className="grid grid-cols-12 gap-3 px-5 py-3.5 items-center hover:bg-cream-50/30 transition-colors group">
                    <div className="col-span-4 flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${member.status === 'active' ? 'bg-forest-900/10 text-forest-900' : 'bg-stone-100 text-stone-400'}`}>
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-stone-800 text-sm leading-tight truncate">{member.name}</div>
                        {member.phone && <div className="text-[10px] text-stone-400 leading-tight">{member.phone}</div>}
                      </div>
                    </div>
                    <div className="col-span-3 text-xs font-medium text-stone-500">{member.role}</div>
                    <div className="col-span-2">
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase border ${member.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-stone-50 text-stone-400 border-stone-200'}`}>
                        {member.status}
                      </span>
                    </div>
                    <div className="col-span-2 text-xs font-mono text-stone-700">
                      {member.hourlyRate != null ? `$${member.hourlyRate.toFixed(2)}/hr` : <span className="text-stone-300">�</span>}
                    </div>
                    <div className="col-span-1 flex items-center justify-end gap-0.5">
                      <button onClick={() => openEditStaff(member)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-forest-900 hover:bg-forest-900/5 transition-colors opacity-0 group-hover:opacity-100">
                        <Icon name="edit" size={14} />
                      </button>
                      <button onClick={() => setDeleteStaff(member)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100">
                        <Icon name="delete" size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {staff.length > 0 && (
              <div className="px-5 py-3 bg-cream-100/50 border-t border-cream-200 flex justify-between items-center">
                <span className="text-xs text-stone-400">{visibleStaff.length} of {staff.length} members</span>
                <button onClick={openAddStaff} className="flex items-center gap-1.5 text-forest-900 text-xs font-bold hover:underline">
                  <Icon name="add" size={13} /> Add Member
                </button>
              </div>
            )}
          </div>
        )}

        {/* --- SCHEDULE VIEW ---------------------------------------------------- */}
        {view === 'schedule' && (
          <div className="p-5 space-y-5 animate-fade-in">
            {/* Week nav */}
            <div className="flex items-center justify-between">
              <button onClick={() => setWeekStart(addWeeks(weekStart, -1))}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-cream-200 text-xs font-bold text-stone-600 hover:bg-cream-50 transition-colors">
                <Icon name="chevron_left" size={16} /> Prev
              </button>
              <div className="text-center">
                <div className="font-lora text-base font-bold text-stone-800">{formatWeekLabel(weekStart)}</div>
                <button onClick={() => setWeekStart(getWeekStart(new Date()))}
                  className="text-[10px] text-forest-900 font-bold hover:underline mt-0.5">
                  Jump to current week
                </button>
              </div>
              <button onClick={() => setWeekStart(addWeeks(weekStart, 1))}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-cream-200 text-xs font-bold text-stone-600 hover:bg-cream-50 transition-colors">
                Next <Icon name="chevron_right" size={16} />
              </button>
            </div>

            {/* Empty state for no staff */}
            {staff.filter(s => s.status === 'active').length === 0 ? (
              <div className="py-16 text-center text-stone-400">
                <Icon name="calendar_month" size={40} className="text-stone-300 mx-auto mb-3" />
                <p className="text-sm font-medium">Add active staff members first to schedule shifts.</p>
                <button onClick={openAddStaff} className="mt-3 text-forest-900 text-xs font-bold hover:underline flex items-center gap-1 mx-auto">
                  <Icon name="add" size={14} /> Add Staff Member
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div className="min-w-[750px]">
                  {/* Day Headers */}
                  <div className="grid grid-cols-8 gap-2 mb-2">
                    <div className="col-span-1" /> {/* staff name col */}
                    {DAYS.map((day, i) => {
                      const isToday = getDayDate(weekStart, i) === new Date().getDate().toString() && weekStart === getWeekStart(new Date());
                      return (
                        <div key={day} className={`col-span-1 text-center py-2.5 rounded-xl text-xs font-bold ${isToday ? 'bg-forest-900 text-white' : 'bg-cream-100/60 text-stone-500'}`}>
                          <div className="uppercase tracking-wider text-[10px]">{day}</div>
                          <div className={`text-base font-lora font-bold ${isToday ? 'text-white' : 'text-stone-800'}`}>{getDayDate(weekStart, i)}</div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Staff Rows */}
                  {staff.filter(s => s.status === 'active').map(member => {
                    const colorCls = staffColorMap[member.id] ?? SHIFT_COLORS[0];
                    return (
                      <div key={member.id} className="grid grid-cols-8 gap-2 mb-2 items-start">
                        {/* Name cell */}
                        <div className="col-span-1 py-2 pr-2 flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 rounded-full bg-forest-900/10 text-forest-900 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                            {member.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-stone-700 truncate">{member.name.split(' ')[0]}</div>
                            <div className="text-[9px] text-stone-400 truncate">{member.role}</div>
                          </div>
                        </div>
                        {/* Day cells */}
                        {DAYS.map(day => {
                          const dayShifts = shifts.filter(s => s.staffId === member.id && s.day === day);
                          return (
                            <div key={day} className="col-span-1 min-h-[60px] rounded-xl border border-cream-200/60 bg-cream-50/30 p-1.5 space-y-1 group/cell hover:border-cream-300 transition-colors">
                              {dayShifts.map(sh => (
                                <div key={sh.id} className={`px-2 py-1.5 rounded-lg text-[10px] font-bold border-l-2 leading-tight ${colorCls} relative group/shift`}>
                                  <div>{sh.startTime}�{sh.endTime}</div>
                                  <div className="text-[9px] opacity-70">{shiftHours(sh)}</div>
                                  {sh.notes && <div className="text-[9px] italic opacity-60 mt-0.5 truncate">{sh.notes}</div>}
                                  {/* Shift action buttons */}
                                  <div className="absolute top-0.5 right-0.5 hidden group-hover/shift:flex gap-0.5">
                                    <button onClick={() => openEditShift(sh)}
                                      className="w-4 h-4 rounded bg-white/80 flex items-center justify-center text-stone-600 hover:text-forest-900 transition-colors shadow-sm">
                                      <Icon name="edit" size={9} />
                                    </button>
                                    <button onClick={() => setDeleteShiftTarget(sh)}
                                      className="w-4 h-4 rounded bg-white/80 flex items-center justify-center text-stone-600 hover:text-red-600 transition-colors shadow-sm">
                                      <Icon name="delete" size={9} />
                                    </button>
                                  </div>
                                </div>
                              ))}
                              {/* Add shift to this cell */}
                              <button onClick={() => openAddShift(day, member.id)}
                                className="w-full py-1 rounded-lg border border-dashed border-stone-200 text-[9px] text-stone-400 font-bold hover:bg-white hover:text-stone-700 hover:border-stone-300 transition-all opacity-0 group-hover/cell:opacity-100">
                                + shift
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}

                  {/* Weekly totals row */}
                  <div className="grid grid-cols-8 gap-2 mt-3 pt-3 border-t border-cream-200">
                    <div className="col-span-1 text-[10px] font-bold text-stone-400 uppercase tracking-wider py-1">Totals</div>
                    {DAYS.map(day => {
                      const dayHrs = shifts
                        .filter(s => s.day === day)
                        .reduce((sum, s) => {
                          const [sh, sm] = s.startTime.split(':').map(Number);
                          const [eh, em] = s.endTime.split(':').map(Number);
                          const m = (eh * 60 + em) - (sh * 60 + sm);
                          return sum + (m > 0 ? m / 60 : 0);
                        }, 0);
                      return (
                        <div key={day} className="col-span-1 py-1.5 rounded-lg bg-cream-100/60 text-center text-[10px] font-bold text-stone-600">
                          {dayHrs > 0 ? `${dayHrs.toFixed(1)}h` : <span className="text-stone-300">�</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {view === 'attendance' && (
          <div className="space-y-6">
            {/* Date selector + summary */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <label className="text-xs font-bold text-stone-500 uppercase tracking-widest">Date</label>
                <input
                  type="date"
                  value={attendanceDate}
                  onChange={e => setAttendanceDate(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-cream-200 bg-cream-50 text-sm font-medium text-stone-800 focus:outline-none focus:border-forest-900/30"
                />
              </div>
              <div className="flex gap-3 flex-wrap">
                {(['present','late','half_day','absent'] as AttendanceStatus[]).map(s => {
                  const count = attendance.filter(a => a.date === attendanceDate && a.status === s).length;
                  const cfg: Record<AttendanceStatus, {label:string; bg:string; text:string}> = {
                    present:  { label: 'Present',  bg: 'bg-green-50 border-green-200', text: 'text-green-700' },
                    late:     { label: 'Late',     bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700' },
                    half_day: { label: 'Half Day', bg: 'bg-blue-50 border-blue-200',   text: 'text-blue-700' },
                    absent:   { label: 'Absent',   bg: 'bg-red-50 border-red-200',     text: 'text-red-700' },
                  };
                  return (
                    <div key={s} className={`px-4 py-2 rounded-xl border ${cfg[s].bg} ${cfg[s].text} flex items-center gap-2`}>
                      <span className="text-lg font-bold">{count}</span>
                      <span className="text-xs font-bold">{cfg[s].label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Attendance table */}
            {staff.filter(m => m.status === 'active').length === 0 ? (
              <div className="text-center py-16 text-stone-400">
                <Icon name="event_available" size={40} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">Add active staff members to track attendance.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-cream-200 shadow-sm overflow-hidden">
                <div className="grid grid-cols-12 gap-2 px-5 py-3 bg-cream-50/80 border-b border-cream-200 text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                  <div className="col-span-3">Name</div>
                  <div className="col-span-2">Role</div>
                  <div className="col-span-2">Clock In</div>
                  <div className="col-span-2">Clock Out</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-1">Hours</div>
                </div>
                {staff.filter(m => m.status === 'active').map(member => {
                  const rec = attendance.find(a => a.staffId === member.id && a.date === attendanceDate);
                  const status: AttendanceStatus = rec?.status ?? 'absent';
                  const statusCfg: Record<AttendanceStatus, {label:string; cls:string}> = {
                    present:  { label: 'Present',  cls: 'bg-green-100 text-green-700' },
                    late:     { label: 'Late',     cls: 'bg-amber-100 text-amber-700' },
                    half_day: { label: 'Half Day', cls: 'bg-blue-100 text-blue-700' },
                    absent:   { label: 'Absent',   cls: 'bg-red-100 text-red-600' },
                  };
                  const saveRec = (patch: Partial<DemoAttendanceRecord>) => {
                    const updated = db_upsertAttendance({
                      id: rec?.id,
                      staffId: member.id,
                      restaurantId: restaurant.id,
                      date: attendanceDate,
                      clockIn: rec?.clockIn ?? '',
                      clockOut: rec?.clockOut ?? '',
                      status: rec?.status ?? 'present',
                      notes: rec?.notes ?? '',
                      ...patch,
                    });
                    setAttendance(prev => [...prev.filter(a => !(a.staffId === member.id && a.date === attendanceDate)), updated]);
                  };
                  const workedHours = () => {
                    if (!rec?.clockIn || !rec?.clockOut) return 'â ”';
                    const [ih, im] = rec.clockIn.split(':').map(Number);
                    const [oh, om] = rec.clockOut.split(':').map(Number);
                    const mins = (oh * 60 + om) - (ih * 60 + im);
                    if (mins <= 0) return 'â ”';
                    const h = Math.floor(mins / 60);
                    const m = mins % 60;
                    return m > 0 ? `${h}h ${m}m` : `${h}h`;
                  };
                  return (
                    <div key={member.id} className="grid grid-cols-12 gap-2 px-5 py-4 border-b border-cream-100 last:border-0 items-center hover:bg-cream-50/50 transition-colors">
                      <div className="col-span-3 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-cream-100 flex items-center justify-center text-xs font-bold text-stone-600 flex-shrink-0">
                          {member.name.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-sm font-bold text-stone-800 truncate">{member.name}</span>
                      </div>
                      <div className="col-span-2 text-xs text-stone-500 font-medium truncate">{member.role}</div>
                      <div className="col-span-2">
                        <input
                          type="time"
                          value={rec?.clockIn ?? ''}
                          onChange={e => saveRec({ clockIn: e.target.value, status: 'present' })}
                          className="w-full px-2 py-1.5 rounded-lg border border-cream-200 bg-cream-50 text-xs font-medium text-stone-700 focus:outline-none focus:border-forest-900/30"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="time"
                          value={rec?.clockOut ?? ''}
                          onChange={e => saveRec({ clockOut: e.target.value })}
                          className="w-full px-2 py-1.5 rounded-lg border border-cream-200 bg-cream-50 text-xs font-medium text-stone-700 focus:outline-none focus:border-forest-900/30"
                        />
                      </div>
                      <div className="col-span-2">
                        <select
                          value={status}
                          onChange={e => saveRec({ status: e.target.value as AttendanceStatus })}
                          className={`text-xs font-bold px-2 py-1.5 rounded-lg border-0 focus:outline-none cursor-pointer w-full ${statusCfg[status].cls}`}
                        >
                          {(['present','late','half_day','absent'] as AttendanceStatus[]).map(s => (
                            <option key={s} value={s}>{statusCfg[s].label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-1 text-xs text-stone-500 font-bold text-right">
                        {workedHours()}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 7-day attendance history */}
            {staff.filter(m => m.status === 'active').length > 0 && (
              <div className="bg-white rounded-2xl border border-cream-200 shadow-sm p-5">
                <h3 className="text-sm font-bold text-stone-700 mb-4">7-Day Attendance Summary</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                        <th className="text-left pb-3 pr-4 min-w-[120px]">Staff Member</th>
                        {Array.from({length:7},(_,i)=>{
                          const d = new Date();
                          d.setDate(d.getDate() - 6 + i);
                          return (
                            <th key={i} className="text-center pb-3 px-2 w-14">
                              <div>{d.toLocaleDateString('en-US',{weekday:'short'})}</div>
                              <div className="font-medium normal-case text-stone-500">{d.getDate()}</div>
                            </th>
                          );
                        })}
                        <th className="text-center pb-3 px-2">Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {staff.filter(m => m.status === 'active').map(member => {
                        const statusEmoji: Record<AttendanceStatus, string> = {
                          present: 'ð  ¢', late: 'ð  ¡', half_day: 'ð  µ', absent: 'ð  ´',
                        };
                        const days = Array.from({length:7},(_,i)=>{
                          const d = new Date();
                          d.setDate(d.getDate() - 6 + i);
                          return d.toISOString().slice(0,10);
                        });
                        const presentCount = days.filter(date => {
                          const rec = attendance.find(a => a.staffId === member.id && a.date === date);
                          return rec && rec.status !== 'absent';
                        }).length;
                        return (
                          <tr key={member.id} className="border-t border-cream-100">
                            <td className="py-3 pr-4 font-bold text-stone-700">{member.name}</td>
                            {days.map(date => {
                              const rec = attendance.find(a => a.staffId === member.id && a.date === date);
                              return <td key={date} className="text-center py-3 px-2 text-base">{rec ? statusEmoji[rec.status] : '⬜'}</td>;
                            })}
                            <td className="text-center py-3 px-2">
                              <span className={`text-xs font-bold px-2 py-1 rounded-lg ${presentCount >= 6 ? 'bg-green-100 text-green-700' : presentCount >= 4 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600'}`}>
                                {Math.round(presentCount/7*100)}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <div className="flex gap-4 mt-4 text-[10px] text-stone-400 font-medium">
                    <span>ð  ¢ Present</span><span>ð  ¡ Late</span><span>ð  µ Half Day</span><span>ð  ´ Absent</span><span>⬜ No Record</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
