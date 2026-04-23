import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const ClassRegister = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const allRes = await api.get('/classes/student-all');
      setClasses(allRes.data);
    } catch (err) { console.error(err); }
  };

  const handleRequest = async (classId) => {
    try {
      await api.post(`/classes/${classId}/request`);
      alert('Đã gửi yêu cầu đăng ký!');
      fetchData();
    } catch (err) { alert(err.response?.data?.detail || 'Lỗi'); }
  };

  const filteredClasses = classes.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.subject_name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const totalPages = Math.ceil(filteredClasses.length / perPage);
  const paginated = filteredClasses.slice((page - 1) * perPage, page * perPage);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Lớp học</h1>
          <p>Xem danh sách lớp học hiện có và gửi yêu cầu đăng ký</p>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Hiển thị</span>
            <select className="form-control" style={{ width: 'auto', display: 'inline-block', padding: '4px 8px', height: '32px' }} value={perPage} onChange={e => { setPerPage(+e.target.value); setPage(1); }}>
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </select>
            <span>dòng</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Tìm kiếm:</span>
            <input 
              type="text" 
              className="form-control" 
              style={{ width: '200px', padding: '4px 8px', height: '32px' }} 
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
            />
          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Tên lớp &uarr;&darr;</th>
                <th>Môn học &uarr;&darr;</th>
                <th>Học kỳ &uarr;&darr;</th>
                <th>Giáo viên &uarr;&darr;</th>
                <th>Đăng ký &uarr;&darr;</th>
                <th>Trạng thái &uarr;&darr;</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(c => {
                return (
                  <tr key={c.id || c.class_id || c.name}>
                    <td style={{ fontWeight: 600 }}>{c.name}</td>
                    <td>{c.subject_name}</td>
                    <td>{c.semester_name} ({c.semester_year})</td>
                    <td>{c.teacher_name}</td>
                    <td>
                      <span style={{ border: '1px solid #e5e7eb', borderRadius: '4px', padding: '2px 6px', fontSize: '11px', display: 'inline-block' }}>
                        <span style={{ color: 'var(--slate-600)' }}>Chờ: {c.pending_count || 0}</span> 
                        <span style={{ color: '#e5e7eb', margin: '0 4px' }}>|</span> 
                        <span style={{ color: 'var(--success)' }}>Duyệt: {c.approved_count || 0}</span>
                      </span>
                    </td>
                    <td><span className="badge badge-primary" style={{ backgroundColor: c.status === 'open' ? '#4f46e5' : '#ef4444', color: '#fff' }}>{c.status === 'open' ? 'Mở' : 'Đóng'}</span></td>
                    <td style={{ textAlign: 'right' }}>
                      {c.enrollment_status === 'approved' ? (
                        <span style={{ border: '1px solid #d1d5db', backgroundColor: '#f3f4f6', color: '#374151', padding: '4px 12px', borderRadius: '4px', fontSize: '12px', fontWeight: 500 }}>
                          Đã đăng ký (approved)
                        </span>
                      ) : c.enrollment_status === 'pending' ? (
                        <span style={{ border: '1px solid #d1d5db', backgroundColor: '#f3f4f6', color: '#374151', padding: '4px 12px', borderRadius: '4px', fontSize: '12px', fontWeight: 500 }}>
                          Chờ duyệt
                        </span>
                      ) : c.enrollment_status === 'rejected' ? (
                        <button className="btn btn-sm btn-outline btn-danger" onClick={() => handleRequest(c.id)} style={{ padding: '4px 12px', fontSize: '12px', borderColor: '#ef4444', color: '#ef4444' }}>
                          Bị từ chối - Đăng ký lại
                        </button>
                      ) : (
                        <button className="btn btn-sm btn-primary" onClick={() => handleRequest(c.id)} style={{ padding: '4px 12px', fontSize: '12px' }}>
                          Đăng ký
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredClasses.length === 0 && (
                <tr><td colSpan="7" className="text-center" style={{ padding: '24px', color: 'var(--slate-400)' }}>Chưa có lớp nào</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', fontSize: '13px', color: 'var(--slate-500)' }}>
          <div>Showing {filteredClasses.length === 0 ? 0 : (page - 1) * perPage + 1} to {Math.min(page * perPage, filteredClasses.length)} of {filteredClasses.length} entries</div>
          <div style={{ display: 'flex', gap: '4px' }}>
            <span onClick={() => setPage(Math.max(1, page - 1))} style={{ padding: '4px 8px', border: '1px solid #e5e7eb', borderRadius: '4px', cursor: 'pointer' }}>&laquo;</span>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <span key={p} onClick={() => setPage(p)} style={{ padding: '4px 12px', backgroundColor: p === page ? '#4f46e5' : '#f3f4f6', color: p === page ? '#fff' : 'inherit', border: '1px solid #e5e7eb', borderRadius: '4px', fontWeight: 600, cursor: 'pointer' }}>{p}</span>
            ))}
            <span onClick={() => setPage(Math.min(totalPages || 1, page + 1))} style={{ padding: '4px 8px', border: '1px solid #e5e7eb', borderRadius: '4px', cursor: 'pointer' }}>&raquo;</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassRegister;
