import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

// Admin Pages
import Accounts from './pages/Admin/Accounts';
import Subjects from './pages/Admin/Subjects';
import Semesters from './pages/Admin/Semesters';
import Students from './pages/Admin/Students';
import Teachers from './pages/Admin/Teachers';
import Assignments from './pages/Admin/Assignments';
import GradeTypes from './pages/Admin/GradeTypes';
import LetterGrades from './pages/Admin/LetterGrades';
import Enrollments from './pages/Admin/Enrollments';
import AdminClasses from './pages/Admin/Classes';
import GradeApproval from './pages/Admin/GradeApproval';
import AdminReviews from './pages/Admin/Reviews';
import ReviewConfig from './pages/Admin/ReviewConfig';
import Reports from './pages/Admin/Reports';

// Teacher Pages
import TeacherClasses from './pages/Teacher/Classes';
import GradeEntry from './pages/Teacher/GradeEntry';
import GradeEntryFilter from './pages/Teacher/GradeEntryFilter';
import TeacherGrades from './pages/Teacher/Grades';
import TeacherViewGrades from './pages/Teacher/ViewGrades';
import TeacherReviews from './pages/Teacher/Reviews';

// Student Pages
import StudentGrades from './pages/Student/Grades';
import ClassRegister from './pages/Student/ClassRegister';
import StudentReviews from './pages/Student/Reviews';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />

            {/* Admin Routes */}
            <Route path="admin/accounts" element={<ProtectedRoute roles={['admin']}><Accounts /></ProtectedRoute>} />
            <Route path="admin/subjects" element={<ProtectedRoute roles={['admin']}><Subjects /></ProtectedRoute>} />
            <Route path="admin/semesters" element={<ProtectedRoute roles={['admin']}><Semesters /></ProtectedRoute>} />
            <Route path="admin/students" element={<ProtectedRoute roles={['admin']}><Students /></ProtectedRoute>} />
            <Route path="admin/teachers" element={<ProtectedRoute roles={['admin']}><Teachers /></ProtectedRoute>} />
            <Route path="admin/assignments" element={<ProtectedRoute roles={['admin']}><Assignments /></ProtectedRoute>} />
            <Route path="admin/grade-types" element={<ProtectedRoute roles={['admin']}><GradeTypes /></ProtectedRoute>} />
            <Route path="admin/letter-grades" element={<ProtectedRoute roles={['admin']}><LetterGrades /></ProtectedRoute>} />
            <Route path="admin/enrollments" element={<ProtectedRoute roles={['admin']}><Enrollments /></ProtectedRoute>} />
            <Route path="admin/classes" element={<ProtectedRoute roles={['admin']}><AdminClasses /></ProtectedRoute>} />
            <Route path="admin/grades" element={<ProtectedRoute roles={['admin']}><GradeApproval /></ProtectedRoute>} />
            <Route path="admin/reviews" element={<ProtectedRoute roles={['admin']}><AdminReviews /></ProtectedRoute>} />
            <Route path="admin/review-config" element={<ProtectedRoute roles={['admin']}><ReviewConfig /></ProtectedRoute>} />
            <Route path="admin/reports" element={<ProtectedRoute roles={['admin']}><Reports /></ProtectedRoute>} />

            {/* Teacher Routes */}
            <Route path="teacher/classes" element={<ProtectedRoute roles={['teacher']}><TeacherClasses /></ProtectedRoute>} />
            <Route path="teacher/grade-entry" element={<ProtectedRoute roles={['teacher']}><GradeEntryFilter /></ProtectedRoute>} />
            <Route path="teacher/view-grades" element={<ProtectedRoute roles={['teacher']}><TeacherViewGrades /></ProtectedRoute>} />
            <Route path="teacher/classes/:classId/grade-entry" element={<ProtectedRoute roles={['teacher', 'admin']}><GradeEntry /></ProtectedRoute>} />
            <Route path="teacher/classes/:classId/grades" element={<ProtectedRoute roles={['teacher', 'admin']}><TeacherGrades /></ProtectedRoute>} />
            <Route path="teacher/reviews" element={<ProtectedRoute roles={['teacher']}><TeacherReviews /></ProtectedRoute>} />

            {/* Student Routes */}
            <Route path="student/grades" element={<ProtectedRoute roles={['student']}><StudentGrades /></ProtectedRoute>} />
            <Route path="student/classes" element={<ProtectedRoute roles={['student']}><ClassRegister /></ProtectedRoute>} />
            <Route path="student/reviews" element={<ProtectedRoute roles={['student']}><StudentReviews /></ProtectedRoute>} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
