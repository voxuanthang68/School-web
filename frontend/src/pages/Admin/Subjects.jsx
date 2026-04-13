import { useState, useEffect } from 'react';
import api from '../../services/api';

const Subjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [search, setSearch] = useState('');
  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ code: '', name: '', credits: 3, department: '', status: 'active' });

  useEffect(() => { fetchData(); }, []);
  const fetchData = async () => { const r = await api.get('/subjects/'); setSubjects(r.data); };

  const filtered = subjects.filter(s =>
    s.code.toLowerCase().includes(search.toLowerCase()) || s.name.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const handleSave = async () => {
    try {
      if (editItem) { await api.put(`/subjects/${editItem.id}`, form); }
      else { await api.post('/subjects/', form); }
      setShowModal(false); setEditItem(null); setForm({ code: '', name: '', credits: 3, department: '', status: 'active' }); fetchData();
    } catch (err) { alert(err.response?.data?.detail || 'Lỗi'); }
  };

  const handleEdit = (s) => { setEditItem(s); setForm({ code: s.code, name: s.name, credits: s.credits, department: s.department, status: s.status }); setShowModal(true); };
  const handleDelete = async (id) => { if (!confirm('Xác nhận xóa?')) return; await api.delete(`/subjects/${id}`); fetchData(); };

  return (
    <div>
      <div className="page-header">
        <div><h1>Danh mục môn học</h1><p>Quản lý thông tin các môn học</p></div>
        <button className="btn btn-primary" onClick={() => { setEditItem(null); setForm({ code: '', name: '', credits: 3, department: '', status: 'active' }); setShowModal(true); }}>+ Thêm môn</button>
      </div>

      <div className="table-container">
        <div className="table-toolbar">
          <div className="table-toolbar-left">Hiển thị <select value={perPage} onChange={e => { setPerPage(+e.target.value); setPage(1); }}><option>10</option><option>25</option></select> dòng</div>
          <div className="table-search">Tìm kiếm: <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} /></div>
        </div>
        <table>
          <thead><tr><th>Mã môn</th><th>Tên môn</th><th>Tín chỉ</th><th>Khoa</th><th>Trạng thái</th><th></th></tr></thead>
          <tbody>
            {paginated.map(s => (
              <tr key={s.id}>
                <td>{s.code}</td><td>{s.name}</td><td>{s.credits}</td><td>{s.department}</td>
                <td><span className={`badge ${s.status === 'active' ? 'badge-success' : 'badge-slate'}`}>{s.status}</span></td>
                <td style={{ textAlign: 'right' }}>
                  <button className="btn btn-sm btn-primary mr-2" onClick={() => handleEdit(s)}>✎ Sửa</button>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(s.id)}>🗑 Xoá</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="table-pagination">
          <span>Showing {(page-1)*perPage+1} to {Math.min(page*perPage, filtered.length)} of {filtered.length} entries</span>
          <div className="table-pagination-buttons">
            <button onClick={() => setPage(Math.max(1, page-1))}>«</button>
            {Array.from({length: totalPages}, (_, i) => i+1).map(p => <button key={p} className={p===page?'active':''} onClick={() => setPage(p)}>{p}</button>)}
            <button onClick={() => setPage(Math.min(totalPages, page+1))}>»</button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>{editItem ? 'Sửa môn học' : 'Thêm môn học'}</h3></div>
            <div className="modal-body">
              <div className="form-group"><label>Mã môn</label><input className="form-control" value={form.code} onChange={e => setForm({...form, code: e.target.value})} /></div>
              <div className="form-group"><label>Tên môn</label><input className="form-control" value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
              <div className="form-group"><label>Tín chỉ</label><input type="number" className="form-control" value={form.credits} onChange={e => setForm({...form, credits: +e.target.value})} /></div>
              <div className="form-group"><label>Khoa</label><input className="form-control" value={form.department} onChange={e => setForm({...form, department: e.target.value})} /></div>
              <div className="form-group"><label>Trạng thái</label><select className="form-control" value={form.status} onChange={e => setForm({...form, status: e.target.value})}><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
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

export default Subjects;
