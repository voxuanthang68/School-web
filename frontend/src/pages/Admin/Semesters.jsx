import { useState, useEffect } from 'react';
import api from '../../services/api';

const Semesters = () => {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: '', year: 2024, status: 'open' });

  useEffect(() => { fetchData(); }, []);
  const fetchData = async () => { const r = await api.get('/semesters/'); setItems(r.data); };

  const filtered = items.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || String(s.year).includes(search));
  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const handleSave = async () => {
    try {
      if (editItem) { await api.put(`/semesters/${editItem.id}`, form); }
      else { await api.post('/semesters/', form); }
      setShowModal(false); setEditItem(null); setForm({ name: '', year: 2024, status: 'open' }); fetchData();
    } catch (err) { alert(err.response?.data?.detail || 'Lỗi'); }
  };

  const handleEdit = (s) => { setEditItem(s); setForm({ name: s.name, year: s.year, status: s.status }); setShowModal(true); };
  const handleDelete = async (id) => { if (!confirm('Xác nhận xóa?')) return; await api.delete(`/semesters/${id}`); fetchData(); };

  return (
    <div>
      <div className="page-header">
        <div><h1>Học kỳ</h1><p>Quản lý các học kỳ mở</p></div>
        <button className="btn btn-primary" onClick={() => { setEditItem(null); setForm({ name: '', year: new Date().getFullYear(), status: 'open' }); setShowModal(true); }}>+ Thêm học kỳ</button>
      </div>

      <div className="table-container">
        <div className="table-toolbar">
          <div className="table-toolbar-left">Hiển thị <select value={perPage} onChange={e => { setPerPage(+e.target.value); setPage(1); }}><option>10</option><option>25</option></select> dòng</div>
          <div className="table-search">Tìm kiếm: <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} /></div>
        </div>
        <table>
          <thead><tr><th>Tên</th><th>Năm</th><th>Trạng thái</th><th></th></tr></thead>
          <tbody>
            {paginated.map(s => (
              <tr key={s.id}>
                <td>{s.name}</td><td>{s.year}</td>
                <td><span className={`badge ${s.status === 'open' ? 'badge-success' : 'badge-danger'}`}>{s.status}</span></td>
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
            {Array.from({length: totalPages}, (_, i) => i+1).map(p => <button key={p} className={p===page?'active':''} onClick={() => setPage(p)}>{p}</button>)}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>{editItem ? 'Sửa học kỳ' : 'Thêm học kỳ'}</h3></div>
            <div className="modal-body">
              <div className="form-group"><label>Tên</label><input className="form-control" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="VD: HK1" /></div>
              <div className="form-group"><label>Năm</label><input type="number" className="form-control" value={form.year} onChange={e => setForm({...form, year: +e.target.value})} /></div>
              <div className="form-group"><label>Trạng thái</label><select className="form-control" value={form.status} onChange={e => setForm({...form, status: e.target.value})}><option value="open">Open</option><option value="locked">Locked</option></select></div>
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

export default Semesters;
