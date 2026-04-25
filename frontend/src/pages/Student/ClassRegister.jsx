import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const ClassRegister = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [myClasses, setMyClasses] = useState([]);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    // Lấy danh sách lớp từ API
    const allRes = await api.get('/classes/');
    console.log("Dữ liệu lớp học:", allRes.data);
    setMyClasses(allRes.data);

  };

  const handleRequest = async (classId) => {
    try {
      await api.post(`/classes/${classId}/request`);
      alert('Đã gửi yêu cầu đăng ký!');
      fetchData();
    } catch (err) { alert(err.response?.data?.detail || 'Lỗi'); }
  };

  return (
    <div>
      <div className="page-header"><div><h1>Đăng ký lớp</h1><p>Xem lớp đã đăng ký và gửi yêu cầu đăng ký mới</p></div></div>

      <h3 style={{ marginBottom: '16px' }}>Lớp của bạn</h3>
      <div className="table-container" style={{ marginBottom: '24px' }}>
        <table>
          <thead><tr><th>Tên lớp</th><th>Môn học</th><th>Học kỳ</th><th>Giáo viên</th><th>Trạng thái</th></tr></thead>
          <tbody>
            {myClasses.map(c => (
              <tr key={c.id}>
                <td style={{ fontWeight: 600 }}>{c.name}</td>
                <td>{c.subject_name}</td>
                <td>{c.semester_name} ({c.semester_year})</td>
                <td>{c.teacher_name}</td>
                <td><span className="badge badge-success">Đã duyệt</span></td>
              </tr>
            ))}
            {myClasses.length === 0 && <tr><td colSpan="5" className="text-center" style={{ padding: '24px', color: 'var(--slate-400)' }}>Chưa có lớp nào</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default ClassRegister;
