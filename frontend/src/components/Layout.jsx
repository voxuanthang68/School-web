import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Users, BookOpen, Calendar, GraduationCap, UserCheck,
  ClipboardList, Settings, Type, FileSpreadsheet, School, PenLine,
  FileSearch, Cog, BarChart3, LogOut, User
} from 'lucide-react';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const adminLinks = [
    { to: '/', icon: LayoutDashboard, label: 'Tổng quan' },
    { to: '/admin/accounts', icon: Users, label: 'Tài khoản' },
    { to: '/admin/subjects', icon: BookOpen, label: 'Môn học' },
    { to: '/admin/semesters', icon: Calendar, label: 'Học kỳ' },
    { to: '/admin/students', icon: GraduationCap, label: 'Sinh viên' },
    { to: '/admin/teachers', icon: UserCheck, label: 'Giáo viên' },
    { to: '/admin/assignments', icon: ClipboardList, label: 'Phân công giảng dạy' },
    { to: '/admin/grade-types', icon: Settings, label: 'Cấu hình đầu điểm' },
    { to: '/admin/letter-grades', icon: Type, label: 'Thang điểm chữ' },
    { to: '/admin/enrollments', icon: FileSpreadsheet, label: 'Đăng ký môn' },
    { to: '/admin/classes', icon: School, label: 'Lớp học' },
    { to: '/admin/grades', icon: PenLine, label: 'Nhập điểm' },
    { to: '/admin/reviews', icon: FileSearch, label: 'Phúc khảo' },
    { to: '/admin/review-config', icon: Cog, label: 'Cấu hình phúc khảo' },
    { to: '/admin/reports', icon: BarChart3, label: 'Báo cáo' },
  ];

  const teacherLinks = [
    { to: '/', icon: LayoutDashboard, label: 'Tổng quan' },
    { to: '/teacher/classes', icon: School, label: 'Lớp học' },
    { to: '/teacher/grade-entry', icon: PenLine, label: 'Nhập điểm' },
    { to: '/teacher/reviews', icon: FileSearch, label: 'Phúc khảo' },
    { to: '/teacher/view-grades', icon: FileSpreadsheet, label: 'Xem điểm' },
  ];

  const studentLinks = [
    { to: '/', icon: LayoutDashboard, label: 'Tổng quan' },
    { to: '/student/grades', icon: FileSpreadsheet, label: 'Xem điểm' },
    { to: '/student/classes', icon: School, label: 'Đăng ký lớp' },
    { to: '/student/reviews', icon: FileSearch, label: 'Phúc khảo' },
  ];

  const links = user?.role === 'admin' ? adminLinks
    : user?.role === 'teacher' ? teacherLinks
    : studentLinks;

  return (
    <div className="app-container">
      {/* Topbar */}
      <header className="topbar">
        <div className="topbar-greeting">
          Chào, {user?.name}
          <div className="avatar-icon">
            <User size={16} />
          </div>
        </div>
        <div className="topbar-right">
          <button className="btn btn-outline btn-sm" onClick={handleLogout}>
            <LogOut size={14} /> Đăng xuất
          </button>
        </div>
      </header>

      <div className="app-body">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">
              <GraduationCap size={20} />
            </div>
            <div>
              <div className="sidebar-logo-text">Student Grading System</div>
              <div className="sidebar-logo-sub">Quản lý điểm sinh viên</div>
            </div>
          </div>

          <nav className="sidebar-nav">
            {links.map(link => {
              const Icon = link.icon;
              const isActive = location.pathname === link.to ||
                (link.to !== '/' && location.pathname.startsWith(link.to));
              return (
                <Link key={link.to} to={link.to} className={isActive ? 'active' : ''}>
                  <Icon size={18} />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="sidebar-footer">
            <div className="sidebar-footer-avatar">
              <User size={16} />
            </div>
            <div>
              <div className="sidebar-footer-name">{user?.name}</div>
              <div className="sidebar-footer-role">{user?.role === 'admin' ? 'Admin' : user?.role === 'teacher' ? 'Teacher' : 'Student'}</div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="main-content animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
