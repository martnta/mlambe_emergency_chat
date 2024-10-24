import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import SetAvatar from "./components/SetAvatar";
import Chat from "./pages/Chat";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminPage from "./pages/Admin";
import Update from "./components/Update"
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/update" element={<Update/>}/>
        <Route path="/setAvatar" element={<SetAvatar />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/" element={<Chat/>}/>
        
      </Routes>
    </BrowserRouter>
  );
}
