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
    try {
      const subj = subjects.find(s => s.id === form.subject_id);
      const sem = semesters.find(s => s.id === form.semester_id);
      if (!subj || !sem) {
         alert("Vui lòng chọn môn học và học kỳ đầy đủ");
         return;
      }
      if (!form.start_date || !form.end_date) {
         alert("Vui lòng chọn ngày mở và ngày đóng");
         return;
      }
      
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
      
      // Clean config object before sending (remove 'id')
      const payload = { ...config, periods: updatedPeriods };
      delete payload.id;
      delete payload._id;
      
      await api.put('/reviews/config', payload);
      setPeriods(updatedPeriods);
      setConfig(prev => ({...prev, periods: updatedPeriods}));
      setShowModal(false);
      setForm({ subject_id: '', semester_id: '', start_date: '', end_date: '' });
      alert("Đã mở đợt phúc khảo thành công!");
    } catch (err) {
      console.error("Lỗi API PUT config:", err.response || err);
      const detail = err.response?.data?.detail || err.response?.data || err.message;
      alert("Lỗi: " + JSON.stringify(detail));
    }
  };

  const handleClosePeriod = async (idx) => {
    const updated = [...periods];
    updated[idx].status = 'closed';
    const payload = { ...config, periods: updated };
    delete payload.id;
    await api.put('/reviews/config', payload);
    setPeriods(updated);
    setConfig(prev => ({...prev, periods: updated}));
  };

  const handleDeletePeriod = async (idx) => {
    if (!confirm('Xác nhận xóa?')) return;
    const updated = periods.filter((_, i) => i !== idx);
    const payload = { ...config, periods: updated };
    delete payload.id;
    await api.put('/reviews/config', payload);
    setPeriods(updated);
    setConfig(prev => ({...prev, periods: updated}));
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

      <div className="card" style={{ border: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div className="table-container" style={{ border: 'none', boxShadow: 'none' }}>
          <table>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#fff' }}>
                <th style={{ padding: '16px', color: '#64748b', fontWeight: 600 }}>Môn học</th>
                <th style={{ padding: '16px', color: '#64748b', fontWeight: 600 }}>Học kỳ</th>
                <th style={{ padding: '16px', color: '#64748b', fontWeight: 600 }}>Thời gian</th>
                <th style={{ padding: '16px', color: '#64748b', fontWeight: 600 }}>Trạng thái</th>
                <th></th>
              </tr>
            </thead>
          <tbody>
            {periods.map((p, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 600 }}>{p.subject_name}</td>
                <td>{p.semester_name}</td>
                <td>{p.start_date} - {p.end_date}</td>
                <td>
                  {p.status === 'open' ? (
                    <span style={{ backgroundColor: '#059669', color: '#fff', padding: '4px 12px', borderRadius: '4px', fontSize: '12px', fontWeight: 500 }}>
                      Đang mở
                    </span>
                  ) : (
                    <span style={{ backgroundColor: '#dc2626', color: '#fff', padding: '4px 12px', borderRadius: '4px', fontSize: '12px', fontWeight: 500 }}>
                      Đã đóng
                    </span>
                  )}
                </td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button 
                      onClick={() => {/* edit */}}
                      style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#f0f9ff', color: '#0284c7', border: '1px solid #bae6fd', padding: '4px 12px', borderRadius: '4px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                    >
                      &#9998; Sửa
                    </button>
                    {p.status === 'open' && (
                      <button 
                        onClick={() => handleClosePeriod(i)}
                        style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '4px 12px', borderRadius: '4px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                      >
                        &#10006; Đóng
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {periods.length === 0 && (
              <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--slate-400)', padding: '32px' }}>Chưa có đợt phúc khảo nào.</td></tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '24px', width: '500px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
            <h2 style={{ marginBottom: '24px', fontSize: '18px', fontWeight: 'bold' }}>Mở đợt phúc khảo</h2>
            
            <div className="form-group">
              <label style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px', display: 'block' }}>Môn học</label>
              <select className="form-control" style={{ width: '100%' }} value={form.subject_id} onChange={e => setForm({...form, subject_id: e.target.value})}>
                <option value="">-- Chọn --</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            
            <div className="form-group">
              <label style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px', display: 'block' }}>Học kỳ</label>
              <select className="form-control" style={{ width: '100%' }} value={form.semester_id} onChange={e => setForm({...form, semester_id: e.target.value})}>
                <option value="">-- Chọn --</option>
                {semesters.map(s => <option key={s.id} value={s.id}>{s.name} ({s.year})</option>)}
              </select>
            </div>
            
            <div className="form-group">
              <label style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px', display: 'block' }}>Thời gian mở</label>
              <input type="datetime-local" className="form-control" style={{ width: '100%' }} value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} />
            </div>
            
            <div className="form-group">
              <label style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px', display: 'block' }}>Thời gian đóng</label>
              <input type="datetime-local" className="form-control" style={{ width: '100%' }} value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})} />
            </div>

            <div className="form-group" style={{ marginBottom: '32px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px', display: 'block' }}>Trạng thái</label>
              <select className="form-control" style={{ width: '100%' }}>
                <option value="open">Đang mở</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button 
                onClick={() => setShowModal(false)}
                style={{ backgroundColor: '#e2e8f0', color: '#475569', padding: '8px 24px', borderRadius: '4px', border: 'none', fontWeight: 600, cursor: 'pointer' }}
              >
                Huỷ
              </button>
              <button 
                onClick={handleAddPeriod}
                style={{ backgroundColor: '#4f46e5', color: '#fff', padding: '8px 24px', borderRadius: '4px', border: 'none', fontWeight: 600, cursor: 'pointer' }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewConfig;
