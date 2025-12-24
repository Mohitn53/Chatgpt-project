import { Routes, Route } from "react-router-dom";
import Login from "../pages/auth/Login"
import Home from "../pages/Home";
import ProtectedRoute from "./ProtectedRoutes";
import Register from "../pages/auth/Register";
import ChatLayout from '../pages/chat/ChatLayout'

const MainRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register/>}/>

      {/* Protected Routes */}
      <Route
      path="/"
      element={
        <ProtectedRoute>
          <ChatLayout />
        </ProtectedRoute>
      }
    />
    </Routes>
  );
};

export default MainRoutes;
