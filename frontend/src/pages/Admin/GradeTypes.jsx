import { useState, useEffect } from 'react';
import api from '../../services/api';

const GradeTypes = () => {
  const [configs, setConfigs] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(null); // { configId, itemIndex, name, weight }
  const [form, setForm] = useState({ subject_id: '', name: '', weight: 0 });

  useEffect(() => {
    fetchData();
    api.get('/subjects/').then(r => setSubjects(r.data));
  }, []);

  const fetchData = async () => { const r = await api.get('/grade-types/'); setConfigs(r.data); };

  const handleAdd = async () => {
    try {
      await api.post('/grade-types/', form);
      setShowModal(false); setForm({ subject_id: '', name: '', weight: 0 }); fetchData();
    } catch (err) { alert(err.response?.data?.detail || 'Lỗi'); }
  };

  const handleUpdateItem = async () => {
    try {
      await api.put(`/grade-types/${editMode.configId}/item/${editMode.itemIndex}`, { name: editMode.name, weight: editMode.weight });
      setEditMode(null); fetchData();
    } catch (err) { alert(err.response?.data?.detail || 'Lỗi'); }
  };

  const handleDeleteItem = async (configId, itemIndex) => {
    if (!confirm('Xác nhận xóa?')) return;
    await api.delete(`/grade-types/${configId}/item/${itemIndex}`);
    fetchData();
  };

  // Group configs that already have subject info
  const configuredSubjectIds = configs.map(c => c.subject_id);
  const unconfiguredSubjects = subjects.filter(s => !configuredSubjectIds.includes(s.id));

  return (
    <div>
      <div className="page-header">
        <div><h1>Cấu hình đầu điểm theo môn</h1><p>Thiết lập trọng số cho từng môn học</p></div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Thêm cấu hình</button>
      </div>

      <div className="table-container" style={{ padding: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr 150px auto', gap: '0', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', color: 'var(--slate-500)', padding: '0 0 12px', borderBottom: '1px solid var(--slate-200)', marginBottom: '16px' }}>
          <div>Môn học</div><div>Đầu điểm</div><div>Trọng số (%)</div><div></div>
        </div>

        {configs.map(config => (
          <div key={config.id} className="grade-config-card">
            <div className="grade-config-subject">{config.subject_name || 'N/A'}</div>
            <div className="grade-config-items">
              {(config.items || []).map((item, idx) => (
                <div key={idx} className="grade-config-item">
                  {editMode?.configId === config.id && editMode?.itemIndex === idx ? (
                    <>
                      <input className="form-control" style={{ width: '150px' }} value={editMode.name} onChange={e => setEditMode({...editMode, name: e.target.value})} />
                      <input type="number" className="form-control" style={{ width: '100px' }} value={editMode.weight} onChange={e => setEditMode({...editMode, weight: +e.target.value})} />
                      <button className="btn btn-sm btn-success" onClick={handleUpdateItem}>✓</button>
                      <button className="btn btn-sm btn-outline" onClick={() => setEditMode(null)}>✗</button>
                    </>
                  ) : (
                    <>
                      <span className="badge badge-primary">{item.name}</span>
                      <span style={{ fontSize: '13px', color: 'var(--slate-500)' }}>Trọng số: {item.weight.toFixed(2)}%</span>
                      <button className="btn btn-sm btn-primary" onClick={() => setEditMode({ configId: config.id, itemIndex: idx, name: item.name, weight: item.weight })}>✎ Sửa</button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDeleteItem(config.id, idx)}>🗑 Xoá</button>
                    </>
                  )}
                </div>
              ))}
            </div>
            <button className="btn btn-sm btn-outline mt-2" onClick={() => { setForm({ subject_id: config.subject_id, name: '', weight: 0 }); setShowModal(true); }}>+ Thêm đầu điểm</button>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Thêm cấu hình</h3></div>
            <div className="modal-body">
              <div className="form-group">
                <label>Môn học</label>
                <select className="form-control" value={form.subject_id} onChange={e => setForm({...form, subject_id: e.target.value})}>
                  <option value="">-- Chọn --</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="form-group"><label>Đầu điểm</label><input className="form-control" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="VD: Cuối kỳ" /></div>
              <div className="form-group"><label>Trọng số (%)</label><input type="number" className="form-control" value={form.weight} onChange={e => setForm({...form, weight: +e.target.value})} /></div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Hủy</button>
              <button className="btn btn-primary" onClick={handleAdd}>💾 Lưu</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GradeTypes;
