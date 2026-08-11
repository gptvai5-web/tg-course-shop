import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Courses from "./pages/Courses";
import ComboDetail from "./pages/ComboDetail";
import ComboCourses from "./pages/ComboCourses";
import CourseDetail from "./pages/CourseDetail";
import AboutUs from "./pages/AboutUs";
import ContactUs from "./pages/ContactUs";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import AdminDashboard from "./pages/AdminDashboard";
import AdminFeatured from "./pages/AdminFeatured";
import AdminCategories from "./pages/AdminCategories";
import AdminInstructors from "./pages/AdminInstructors";
import AdminCoupons from "./pages/AdminCoupons";
import AdminCourseContent from "./pages/AdminCourseContent";
import AdminComboCourses from "./pages/AdminComboCourses";
import AdminCycles from "./pages/AdminCycles";
import AdminContactMessages from "./pages/AdminContactMessages";
import AdminUserManagement from "./pages/AdminUserManagement";
import AdminSettings from "./pages/AdminSettings";
import AdminSales from "./pages/AdminSales";
import AdminOfferTimer from "./pages/AdminOfferTimer";
import TeacherDashboard from "./pages/TeacherDashboard";
import TeacherManageCourses from "./pages/TeacherManageCourses";
import TeacherStudents from "./pages/TeacherStudents";
import ManualEnroll from "./pages/ManualEnroll";
import TeacherCourseUpdates from "./pages/TeacherCourseUpdates";
import TeacherComments from "./pages/TeacherComments";
import TeacherMaterials from "./pages/TeacherMaterials";
import AdminCourseLevels from "./pages/AdminCourseLevels";
import AdminCourseDisplay from "./pages/AdminCourseDisplay";
import StudentDashboard from "./pages/StudentDashboard";
import Learn from "./pages/Learn";
import CourseSubjects from "./pages/CourseSubjects";
import SubjectChapters from "./pages/SubjectChapters";
import ChapterVideos from "./pages/ChapterVideos";
import NotFound from "./pages/NotFound";
import PaymentStatus from "./pages/PaymentStatus";
import DocumentViewer from "./pages/DocumentViewer";

const queryClient = new QueryClient();

const ScrollToTop = () => {
  const { pathname } = useLocation();
  React.useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/courses/:id" element={<CourseDetail />} />
            <Route path="/combo/:id" element={<ComboDetail />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/contact" element={<ContactUs />} />
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/signup" element={<Navigate to="/login" replace />} />
            <Route path="/payment-status" element={<PaymentStatus />} />
            {/* Student */}
            <Route path="/student" element={<ProtectedRoute><StudentDashboard /></ProtectedRoute>} />
            <Route path="/learn" element={<ProtectedRoute><Learn /></ProtectedRoute>} />
            <Route path="/course/:id/content" element={<ProtectedRoute><CourseSubjects /></ProtectedRoute>} />
            <Route path="/combo/:comboId/courses" element={<ProtectedRoute><ComboCourses /></ProtectedRoute>} />
            <Route path="/course/:id/subject/:subjectId" element={<ProtectedRoute><SubjectChapters /></ProtectedRoute>} />
            <Route path="/course/:id/cycle/:subjectId" element={<ProtectedRoute><SubjectChapters /></ProtectedRoute>} />
            <Route path="/course/:id/subject/:subjectId/chapter/:chapterId" element={<ProtectedRoute><ChapterVideos /></ProtectedRoute>} />
            <Route path="/course/:id/cycle/:subjectId/chapter/:chapterId" element={<ProtectedRoute><ChapterVideos /></ProtectedRoute>} />
            <Route path="/view-document" element={<ProtectedRoute><DocumentViewer /></ProtectedRoute>} />
            {/* Teacher */}
            <Route path="/teacher" element={<ProtectedRoute><TeacherDashboard /></ProtectedRoute>} />
            <Route path="/teacher/courses" element={<ProtectedRoute><TeacherManageCourses /></ProtectedRoute>} />
            <Route path="/teacher/content" element={<ProtectedRoute><AdminCourseContent /></ProtectedRoute>} />
            <Route path="/teacher/updates" element={<ProtectedRoute><TeacherCourseUpdates /></ProtectedRoute>} />
            
            <Route path="/teacher/categories" element={<ProtectedRoute><AdminCategories /></ProtectedRoute>} />
            <Route path="/teacher/students" element={<ProtectedRoute><TeacherStudents /></ProtectedRoute>} />
            <Route path="/teacher/enroll" element={<ProtectedRoute><ManualEnroll /></ProtectedRoute>} />
            <Route path="/teacher/comments" element={<ProtectedRoute><TeacherComments /></ProtectedRoute>} />
            <Route path="/teacher/levels" element={<ProtectedRoute><AdminCourseLevels /></ProtectedRoute>} />
            {/* Admin */}
            <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/featured" element={<ProtectedRoute><AdminFeatured /></ProtectedRoute>} />
            <Route path="/admin/categories" element={<ProtectedRoute><AdminCategories /></ProtectedRoute>} />
            <Route path="/admin/instructors" element={<ProtectedRoute><AdminInstructors /></ProtectedRoute>} />
            <Route path="/admin/coupons" element={<ProtectedRoute><AdminCoupons /></ProtectedRoute>} />
            <Route path="/admin/content" element={<ProtectedRoute><AdminCourseContent /></ProtectedRoute>} />
            <Route path="/admin/combos" element={<ProtectedRoute><AdminComboCourses /></ProtectedRoute>} />
            <Route path="/admin/cycles" element={<ProtectedRoute><AdminCycles /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute><AdminUserManagement /></ProtectedRoute>} />
            <Route path="/admin/contact" element={<ProtectedRoute><AdminContactMessages /></ProtectedRoute>} />
            <Route path="/admin/offers" element={<ProtectedRoute><AdminOfferTimer /></ProtectedRoute>} />
            <Route path="/admin/settings" element={<ProtectedRoute><AdminSettings /></ProtectedRoute>} />
            <Route path="/admin/display" element={<ProtectedRoute><AdminCourseDisplay /></ProtectedRoute>} />
            <Route path="/admin/sales" element={<ProtectedRoute><AdminSales /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
