import { useState, useEffect } from 'react';
import api from '../../services/api';

const ReviewConfig = () => {
  const [config, setConfig] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ subject_id: '', semester_id: '', start_date: '', end_date: '' });
  const [periods, setPeriods] = useState([]);

  useEffect(() => {
    api.get('/reviews/config').then(r => {
      setConfig(r.data);
      setPeriods(r.data.periods || []);
    }).catch(console.error);
    api.get('/subjects/').then(r => setSubjects(r.data));
    api.get('/semesters/').then(r => setSemesters(r.data));
  }, []);

  const handleToggleGlobal = async (enabled) => {
    const updated = { ...config, enabled };
    await api.put('/reviews/config', updated);
    setConfig(updated);
  };

  const handleAddPeriod = async () => {
    const subj = subjects.find(s => s.id === form.subject_id);
    const sem = semesters.find(s => s.id === form.semester_id);
    const newPeriod = {
      subject_id: form.subject_id,
      semester_id: form.semester_id,
      subject_name: subj?.name || '',
      semester_name: sem ? `${sem.name} (${sem.year})` : '',
      start_date: form.start_date,
      end_date: form.end_date,
      status: 'open',
    };
    const updatedPeriods = [...periods, newPeriod];
    await api.put('/reviews/config', { ...config, periods: updatedPeriods });
    setPeriods(updatedPeriods);
    setShowModal(false);
    setForm({ subject_id: '', semester_id: '', start_date: '', end_date: '' });
  };

  const handleClosePeriod = async (idx) => {
    const updated = [...periods];
    updated[idx].status = 'closed';
    await api.put('/reviews/config', { ...config, periods: updated });
    setPeriods(updated);
  };

  const handleDeletePeriod = async (idx) => {
    if (!confirm('Xác nhận xóa?')) return;
    const updated = periods.filter((_, i) => i !== idx);
    await api.put('/reviews/config', { ...config, periods: updated });
    setPeriods(updated);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Phúc khảo</h1>
          <p>Cấu hình thời gian mở phúc khảo theo môn học & học kỳ</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>Mở đợt phúc khảo</button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr><th>Môn học</th><th>Học kỳ</th><th>Thời gian</th><th>Trạng thái</th><th></th></tr>
          </thead>
          <tbody>
            {periods.map((p, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 600 }}>{p.subject_name}</td>
                <td>{p.semester_name}</td>
                <td>{p.start_date} - {p.end_date}</td>
                <td>
                  <span className={`badge ${p.status === 'open' ? 'badge-success' : 'badge-danger'}`}>
                    {p.status === 'open' ? 'Đang mở' : 'Đã đóng'}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button className="btn btn-sm btn-primary mr-2" onClick={() => {/* edit */}}>✎ Sửa</button>
                  {p.status === 'open' && <button className="btn btn-sm btn-danger" onClick={() => handleClosePeriod(i)}>⊘ Đóng</button>}
                </td>
              </tr>
            ))}
            {periods.length === 0 && (
              <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--slate-400)', padding: '32px' }}>Chưa có đợt phúc khảo nào.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Mở đợt phúc khảo</h3></div>
            <div className="modal-body">
              <div className="form-group">
                <label>Môn học</label>
                <select className="form-control" value={form.subject_id} onChange={e => setForm({...form, subject_id: e.target.value})}>
                  <option value="">-- Chọn --</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Học kỳ</label>
                <select className="form-control" value={form.semester_id} onChange={e => setForm({...form, semester_id: e.target.value})}>
                  <option value="">-- Chọn --</option>
                  {semesters.map(s => <option key={s.id} value={s.id}>{s.name} ({s.year})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Ngày bắt đầu</label>
                <input type="datetime-local" className="form-control" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Ngày kết thúc</label>
                <input type="datetime-local" className="form-control" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Hủy</button>
              <button className="btn btn-primary" onClick={handleAddPeriod}>💾 Mở phúc khảo</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewConfig;
