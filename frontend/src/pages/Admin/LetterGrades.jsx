import { useState, useEffect } from 'react';
import api from '../../services/api';

const LetterGrades = () => {
  const [config, setConfig] = useState(null);
  const [scale, setScale] = useState([]);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [form, setForm] = useState({ letter: '', min_score: 0, max_score: 0, gpa_4: 0 });

  useEffect(() => { fetchData(); }, []);
  const fetchData = async () => {
    const r = await api.get('/letter-grades/');
    setConfig(r.data);
    setScale(r.data.scale || []);
  };

  const filtered = scale.filter(s =>
    s.letter.toLowerCase().includes(search.toLowerCase()) ||
    String(s.min_score).includes(search) ||
    String(s.gpa_4).includes(search)
  );
  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const handleEdit = (idx) => {
    const item = scale[idx];
    setEditIndex(idx);
    setForm({ letter: item.letter, min_score: item.min_score, max_score: item.max_score, gpa_4: item.gpa_4 });
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditIndex(null);
    setForm({ letter: '', min_score: 0, max_score: 0, gpa_4: 0 });
    setShowModal(true);
  };

  const handleSaveItem = async () => {
    setSaving(true);
    const updated = [...scale];
    const item = { letter: form.letter, min_score: parseFloat(form.min_score), max_score: parseFloat(form.max_score), gpa_4: parseFloat(form.gpa_4) };
    if (editIndex !== null) {
      updated[editIndex] = item;
    } else {
      updated.push(item);
    }
    // Sort by min_score ascending
    updated.sort((a, b) => a.min_score - b.min_score);
    try {
      await api.put('/letter-grades/', { scale: updated });
      setScale(updated);
      setShowModal(false);
    } catch (err) { alert('Lỗi: ' + (err.response?.data?.detail || '')); }
    setSaving(false);
  };

  const handleDelete = async (idx) => {
    if (!confirm('Xác nhận xóa?')) return;
    const updated = scale.filter((_, i) => i !== idx);
    await api.put('/letter-grades/', { scale: updated });
    setScale(updated);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Thang điểm chữ</h1>
          <p>Quy đổi điểm số sang thang chữ và thang 4</p>
        </div>
        <button className="btn btn-primary" onClick={handleAdd}>+ Thêm dòng</button>
      </div>

      <div className="table-container">
        <div className="table-toolbar">
          <div className="table-toolbar-left">
            Hiển thị <select value={perPage} onChange={e => { setPerPage(+e.target.value); setPage(1); }}>
              <option>10</option><option>25</option>
            </select> dòng
          </div>
          <div className="table-search">Tìm kiếm: <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} /></div>
        </div>

        <table>
          <thead>
            <tr><th>Điểm tối thiểu</th><th>Điểm tối đa</th><th>Thang 4</th><th>Chữ</th><th></th></tr>
          </thead>
          <tbody>
            {paginated.map((row, i) => {
              const realIdx = scale.findIndex(s => s.letter === row.letter && s.min_score === row.min_score);
              return (
                <tr key={i}>
                  <td>{row.min_score.toFixed(2)}</td>
                  <td>{row.max_score.toFixed(2)}</td>
                  <td>{row.gpa_4.toFixed(1)}</td>
                  <td style={{ fontWeight: 600 }}>{row.letter}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn btn-sm btn-primary mr-2" onClick={() => handleEdit(realIdx)}>✎ Sửa</button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(realIdx)}>🗑 Xoá</button>
                  </td>
                </tr>
              );
            })}
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
            <div className="modal-header"><h3>{editIndex !== null ? 'Sửa thang điểm' : 'Thêm thang điểm'}</h3></div>
            <div className="modal-body">
              <div className="form-group"><label>Điểm chữ</label><input className="form-control" value={form.letter} onChange={e => setForm({...form, letter: e.target.value})} placeholder="VD: A, B+, C..." /></div>
              <div className="form-group"><label>Điểm tối thiểu</label><input type="number" step="0.01" className="form-control" value={form.min_score} onChange={e => setForm({...form, min_score: e.target.value})} /></div>
              <div className="form-group"><label>Điểm tối đa</label><input type="number" step="0.01" className="form-control" value={form.max_score} onChange={e => setForm({...form, max_score: e.target.value})} /></div>
              <div className="form-group"><label>GPA (Thang 4)</label><input type="number" step="0.1" className="form-control" value={form.gpa_4} onChange={e => setForm({...form, gpa_4: e.target.value})} /></div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Hủy</button>
              <button className="btn btn-primary" onClick={handleSaveItem} disabled={saving}>{saving ? 'Đang lưu...' : '💾 Lưu'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LetterGrades;
