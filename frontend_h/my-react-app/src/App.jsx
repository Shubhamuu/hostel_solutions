import './App.css'
import Register from './pages/auth/register.jsx'
import Landing from './pages/landing/landing.jsx'
import { Navigate, Outlet, Route, Routes } from 'react-router'
import Rooms from './components/common/rooms.jsx'
import Login from './pages/auth/login.jsx'
import StudentDashboard from './pages/student/studentDasboard.jsx'
import Fee from './pages/student/fee.jsx'
import PayFee from './pages/student/khaltipayment.jsx'
import BookRoom from './pages/student/bookRoom.jsx'
//import KhaltiSuccess from './pages/student/khalti_verify.jsx'
import PaymentSuccess from './pages/student/payment_success.jsx'
import AdminDashboard from './pages/admin/adminDashboard.jsx'
import RoomDetails from './pages/admin/rooms.jsx'
import UserDetails from './pages/admin/students.jsx'
import FeeDetails from './pages/admin/fees.jsx'
import MenuManager from './pages/admin/menu.jsx'
import SuperAdminDashboard from './pages/superadmin/dashboard.jsx'
import AddHostelImages from './pages/admin/addHostelimage.jsx'
import ForgotPassword from './pages/auth/forgetpassword.jsx'
import AdminReapplyVerification from './pages/admin/reapply.jsx'
import ProtectedRoute from './components/common/ProtectedRoute.jsx';
import MyBooking from './pages/student/bookingdetails.jsx';
import MyRoom from './pages/student/rooms.jsx';
import BookingDetails from './pages/admin/bookingDetails.jsx';
import HostelDetails from './components/common/hostels.jsx';
import Search from './pages/search.jsx';
import RoomDetailsById from './pages/landing/roomsById.jsx';
import HostelDetail from "./pages/admin/hostelDetails.jsx";

function App() {




  return <>
    <Routes >
      <Route path='/' element={<Landing />} />
      <Route path='/register' element={<Register />} />
      <Route path='/rooms/:hostelId' element={<Rooms />} />
      <Route path='/login' element={<Login />} />
      <Route path='/forgot-Password' element={<ForgotPassword />} />
      <Route path='/hostels' element={<HostelDetails />} />
      <Route path='/room-details/:roomId' element={<RoomDetailsById/>}/>
      <Route path='/search' element={<Search />} />
      <Route element={<ProtectedRoute allowedRoles={['SUPERADMIN']} />}>
        <Route path='/superadmin' element={<Outlet />} >
          <Route path='dashboard' element={<SuperAdminDashboard />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
        <Route path='/admin' element={<Outlet />}>
          <Route path='dashboard' element={<AdminDashboard />} />
          <Route path='reapply' element={<AdminReapplyVerification />} />
          <Route path="rooms" element={<RoomDetails />} />
          <Route path="students" element={<UserDetails />} />
          <Route path="fee" element={<FeeDetails />} />
          <Route path="menu" element={<MenuManager />} />
          <Route path="hostel-images" element={<AddHostelImages />} />
          <Route path="bookingDetails" element={<BookingDetails />} />
          <Route path="hostelDetail" element = {<HostelDetail />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['STUDENT']} />}>
        <Route path='/student/dashboard' element={<StudentDashboard />} />
        <Route path='/fee' element={<Fee />} />
        <Route path="/khaltipayment/:feeId" element={<PayFee />} />
        <Route path="/book-room/:roomId" element={<BookRoom />} />
        <Route path="/payment/success" element={<PaymentSuccess />} />
        <Route path="/mybooking" element={<MyBooking />} />
        <Route path="/myroom" element={<MyRoom />} />
      </Route>
    </Routes >
  </>
};

export default App
