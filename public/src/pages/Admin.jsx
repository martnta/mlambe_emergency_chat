import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';

const AdminPage = () => {
  const [attendedEmergencies, setAttendedEmergencies] = useState(0);
  const [unattendedEmergencies, setUnattendedEmergencies] = useState(0);
  const [emergencies, setEmergencies] = useState([]);

  const [currentUser, setCurrentUser] = useState(undefined);
  const navigate = useNavigate();

  useEffect(async () => {
    if (!localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)) {
      navigate('/login');
    } else {
      setCurrentUser(await JSON.parse(localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)));
    }
  }, [navigate]);

  //fetching data from database server 
  useEffect(() => {
    const fetchEmergencies = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/emergency/getemg/');
        const data = await response.json();
        setEmergencies(data);

        const attendedCount = data.filter((emergency) => emergency.status === 'attended').length;
        setAttendedEmergencies(attendedCount);

        const unattendedCount = data.filter((emergency) => emergency.status === 'unattended').length;
        setUnattendedEmergencies(unattendedCount);
      } catch (error) {
        console.error('Error fetching emergencies:', error);
      }
    };

    fetchEmergencies();
  }, []);

  const filterEmergenciesByDate = (emergencies, selectedDate) => {
    return emergencies.filter((emergency) => {
      const emergencyDate = new Date(emergency.createdAt);
      return (
        emergencyDate.getDate() === selectedDate.getDate() &&
        emergencyDate.getMonth() === selectedDate.getMonth() &&
        emergencyDate.getFullYear() === selectedDate.getFullYear()
      );
    });
  };

  //filtering by day
  const handleDailyFilter = () => {
    const today = new Date();
    const filteredEmergencies = filterEmergenciesByDate(emergencies, today);
    setEmergencies(filteredEmergencies);
  };
//weekly
  const handleWeeklyFilter = () => {
    const today = new Date();
    const weekDay = today.getDay();
    const mondayDate = new Date(today.getTime() - weekDay * 86400000);
    const filteredEmergencies = filterEmergenciesByDate(emergencies, mondayDate);
    setEmergencies(filteredEmergencies);
  };
  //monthtly
  const handleMonthlyFilter = () => {
    const today = new Date();
    const month = today.getMonth();
    const year = today.getFullYear();
    const firstDayOfMonth = new Date(year, month, 1);
    const filteredEmergencies = filterEmergenciesByDate(emergencies, firstDayOfMonth);
    setEmergencies(filteredEmergencies);
  };

  return (
    <>
      <Navbar />
      {/** Sidebar */}
      <div className="flex h-screen">
        <Sidebar />

        <div className="w-4/5 p-8 overflow-y-auto"> {/* Added overflow-y-auto */}
     
          <div className="flex justify-evenly space-x-4 mb-4">
            <div className="bg-yellow-200 p-4 rounded shadow-md w-1/2">
              <h2 className="text-xl mb-2">Attended Emergencies</h2>
              <p className="text-2xl text-green-400 font-bold">{attendedEmergencies}</p>
            </div>
            <div className="bg-white p-4 rounded shadow-md w-1/2">
              <h2 className="text-xl mb-2">Unattended Emergencies</h2>
              <p className="text-2xl text-red-600 font-bold">{unattendedEmergencies}</p>
            </div>
          </div>
          <h2 className="text-2xl mb-4">Recent Emergencies</h2>
          <div className="mb-4 space-x-4">
            <button
              className="py-2 px-4 bg-indigo-700 text-white rounded hover:bg-blue-700 transition"
              onClick={handleDailyFilter}
            >
              Daily
            </button>
            <button
              className="py-2 px-4 bg-indigo-700 text-white rounded hover:bg-blue-700 transition"
              onClick={handleWeeklyFilter}
            >
              Weekly
            </button>
            <button
              className="py-2 px-4 bg-indigo-700 text-white rounded hover:bg-blue-700 transition"
              onClick={handleMonthlyFilter}
            >
              Monthly
            </button>
          </div>
          <table className="w-full bg-white border-collapse border rounded">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2">Type of emergency</th>
                <th className="border p-2">Name</th>
                <th className="border p-2">Email</th>
                <th className="border p-2">Status</th>
                <th className="border p-2">CreatedAt</th>
              </tr>
            </thead>
            <tbody>
              {emergencies.slice(0, 5).map((emergency) => (
                <tr key={emergency._id} className="hover:bg-gray-50">
                  <td className="border p-2">{emergency.type}</td>
                  <td className="border p-2">{emergency.name}</td>
                  <td className="border p-2">{emergency.email}</td>
                  <td className="border p-2">{emergency.status}</td>
                  <td className="border p-2">{new Date(emergency.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {/** Footer */}
         <Footer/>
        </div>
      </div>
    </>
  );
};

export default AdminPage;
