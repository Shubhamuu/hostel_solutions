import { useEffect, useState } from 'react';
import { apiprivate } from '../../services/api';
import { Edit2, Save, X, Utensils, Loader2 } from 'lucide-react'; // Suggested icons
import AdminNavbar from "../../components/common/adminNavbar";
export default function MenuManager() {
  const [menuData, setMenuData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editingDay, setEditingDay] = useState(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    breakfast: '',
    lunch: '',
    dinner: '',
  });

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    try {
      setLoading(true);
      const res = await apiprivate.get('/menu/viewMenu');
      setMenuData(res.data?.[0] || null);
    } catch (err) {
      console.error('Failed to load menu', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDayEdit = (day) => {
    setEditingDay(day.day);
    setForm({
      breakfast: day.breakfast,
      lunch: day.lunch,
      dinner: day.dinner,
    });
  };

  const submitDayUpdate = async () => {
    if (!menuData?.weekStart) return;
    try {
      setSaving(true);
      await apiprivate.patch('/menu/updateMenuDay', {
        weekStart: menuData.weekStart,
        day: editingDay,
        ...form,
      });
      setEditingDay(null);
      await fetchMenu();
    } catch (err) {
      alert('Failed to update. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 space-y-4">
      <Loader2 className="animate-spin text-blue-600" size={40} />
      <p className="text-gray-500 font-medium">Loading your weekly menu...</p>
    </div>
  );

  if (!menuData) return <div className="text-center p-10 border split-dashed rounded-lg">No menu found.</div>;

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-8">
       <AdminNavbar />
      <header className="flex justify-between items-end border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Menu Manager</h1>
          <p className="text-sm text-gray-500">Managing week: <span className="font-mono text-blue-600">{menuData.weekStart}</span></p>
        </div>
        <div className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">
          Live Status
        </div>
      </header>

      <div className="grid gap-4">
        {menuData.menu?.map((day) => {
          const isEditing = editingDay === day.day;

          return (
            <div 
              key={day._id} 
              className={`transition-all duration-200 border rounded-xl shadow-sm ${isEditing ? 'ring-2 ring-blue-500 border-transparent bg-blue-50/30' : 'bg-white hover:border-gray-300'}`}
            >
              <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-bold text-gray-700 flex items-center gap-2">
                    <span className="w-2 h-6 bg-blue-600 rounded-full" />
                    {day.day}
                  </h3>
                  
                  {!isEditing ? (
                    <button
                      onClick={() => handleDayEdit(day)}
                      className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <Edit2 size={16} /> Edit
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        disabled={saving}
                        onClick={submitDayUpdate}
                        className="flex items-center gap-1 text-sm bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 disabled:opacity-50"
                      >
                        <Save size={16} /> {saving ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={() => setEditingDay(null)}
                        className="text-sm bg-gray-200 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                {isEditing ? (
                  /* INLINE EDIT FORM */
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-1">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase">Breakfast</label>
                      <input
                        className="w-full mt-1 border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        value={form.breakfast}
                        onChange={(e) => setForm({ ...form, breakfast: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase">Lunch</label>
                      <input
                        className="w-full mt-1 border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        value={form.lunch}
                        onChange={(e) => setForm({ ...form, lunch: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase">Dinner</label>
                      <input
                        className="w-full mt-1 border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        value={form.dinner}
                        onChange={(e) => setForm({ ...form, dinner: e.target.value })}
                      />
                    </div>
                  </div>
                ) : (
                  /* VIEW STATE */
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-3 p-2 rounded-md bg-orange-50/50">
                      <span className="text-xl">🍳</span>
                      <div>
                        <p className="text-[10px] text-orange-600 font-bold uppercase tracking-wider">Breakfast</p>
                        <p className="text-gray-700 font-medium">{day.breakfast || 'Not set'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-2 rounded-md bg-green-50/50">
                      <span className="text-xl">🍛</span>
                      <div>
                        <p className="text-[10px] text-green-600 font-bold uppercase tracking-wider">Lunch</p>
                        <p className="text-gray-700 font-medium">{day.lunch || 'Not set'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-2 rounded-md bg-indigo-50/50">
                      <span className="text-xl">🍽️</span>
                      <div>
                        <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider">Dinner</p>
                        <p className="text-gray-700 font-medium">{day.dinner || 'Not set'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <footer className="pt-6">
        <button
          disabled={saving}
          onClick={fetchMenu} // Or keep your updateEntireMenu logic here
          className="w-full bg-slate-800 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-slate-900 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <Utensils size={20} />
          Refresh Menu Data
        </button>
      </footer>
    </div>
  );
}