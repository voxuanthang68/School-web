import { useState, useEffect } from 'react';
import api from '../../services/api';

const Students = () => {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', user_code: '', class_name: '', cohort: '', department: '', gender: '', password: '' });

  useEffect(() => { fetchData(); }, []);
  const fetchData = async () => { const r = await api.get('/users/by-role/student'); setItems(r.data); };

  const filtered = items.filter(s =>
    (s.name||'').toLowerCase().includes(search.toLowerCase()) ||
    (s.user_code||'').toLowerCase().includes(search.toLowerCase()) ||
    (s.email||'').toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const handleSave = async () => {
    try {
      if (editItem) { await api.put(`/users/${editItem.id}`, form); }
      else { await api.post('/users/create', { ...form, role: 'student', password: form.password || '123456' }); }
      setShowModal(false); setEditItem(null); fetchData();
    } catch (err) { alert(err.response?.data?.detail || 'Lỗi'); }
  };

  const handleEdit = (s) => {
    setEditItem(s);
    setForm({ name: s.name, email: s.email, user_code: s.user_code||'', class_name: s.class_name||'', cohort: s.cohort||'', department: s.department||'', gender: s.gender||'' });
    setShowModal(true);
  };

  const handleDelete = async (id) => { if (!confirm('Xác nhận xóa?')) return; await api.delete(`/users/${id}`); fetchData(); };

  return (
    <div>
      <div className="page-header">
        <div><h1>Sinh viên</h1><p>Danh sách sinh viên hiện có</p></div>
        <button className="btn btn-primary" onClick={() => { setEditItem(null); setForm({ name: '', email: '', user_code: '', class_name: '', cohort: '', department: '', gender: '', password: '' }); setShowModal(true); }}>+ Thêm sinh viên</button>
      </div>

      <div className="table-container">
        <div className="table-toolbar">
          <div className="table-toolbar-left">Hiển thị <select value={perPage} onChange={e => { setPerPage(+e.target.value); setPage(1); }}><option>10</option><option>25</option><option>50</option></select> dòng</div>
          <div className="table-search">Tìm kiếm: <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} /></div>
        </div>
        <table>
          <thead><tr><th>Mã SV</th><th>Họ tên</th><th>Email</th><th>Lớp</th><th>Khoá</th><th></th></tr></thead>
          <tbody>
            {paginated.map(s => (
              <tr key={s.id}>
                <td>{s.user_code}</td><td>{s.name}</td><td>{s.email}</td><td>{s.class_name}</td><td>{s.cohort}</td>
                <td style={{ textAlign: 'right' }}>
                  <button className="btn btn-sm btn-primary mr-2" onClick={() => handleEdit(s)}>✎ Sửa</button>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(s.id)}>🗑 Xoá</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="table-pagination">
          <span>Showing {Math.min((page-1)*perPage+1, filtered.length)} to {Math.min(page*perPage, filtered.length)} of {filtered.length} entries</span>
          <div className="table-pagination-buttons">
            <button onClick={() => setPage(Math.max(1,page-1))}>«</button>
            {Array.from({length: totalPages}, (_,i)=>i+1).map(p => <button key={p} className={p===page?'active':''} onClick={()=>setPage(p)}>{p}</button>)}
            <button onClick={() => setPage(Math.min(totalPages,page+1))}>»</button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>{editItem ? 'Sửa sinh viên' : 'Thêm sinh viên'}</h3></div>
            <div className="modal-body">
              <div className="form-group"><label>Mã SV</label><input className="form-control" value={form.user_code} onChange={e => setForm({...form, user_code: e.target.value})} /></div>
              <div className="form-group"><label>Họ tên</label><input className="form-control" value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
              <div className="form-group"><label>Email</label><input className="form-control" value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
              <div className="form-group"><label>Lớp</label><input className="form-control" value={form.class_name} onChange={e => setForm({...form, class_name: e.target.value})} /></div>
              <div className="form-group"><label>Khoá</label><input className="form-control" value={form.cohort} onChange={e => setForm({...form, cohort: e.target.value})} /></div>
              <div className="form-group"><label>Khoa</label><input className="form-control" value={form.department} onChange={e => setForm({...form, department: e.target.value})} /></div>
              {!editItem && <div className="form-group"><label>Mật khẩu</label><input type="password" className="form-control" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="Mặc định: 123456" /></div>}
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Hủy</button>
              <button className="btn btn-primary" onClick={handleSave}>💾 Lưu</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Students;
