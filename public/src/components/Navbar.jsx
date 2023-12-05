import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from "../assets/logo.svg";

const Navbar = () => {
  const [emergencies, setEmergencies] = useState([]);
  const [unattendedEmergencies, setUnattendedEmergencies] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEmergencies = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/emergency/all');
        const data = await response.json();
        setEmergencies(data);

        const unattendedCount = data.filter((emergency) => emergency.status === 'unattended').length;
        setUnattendedEmergencies(unattendedCount);
      } catch (error) {
        console.error('Error fetching emergencies:', error);
      }
    };

    fetchEmergencies();
  }, []);

  return (
    <nav className="flex justify-between items-center px-4 py-2 bg-white shadow">
      <div className="flex items-center">
        <div className="mr-4">
          <img src={Logo} alt="logo" className="w-12 h-12" />
        </div>
        <ul className="flex space-x-4">
        <li><Link href="#" to="" className="text-gray-700 font-bold">Mlambe Emergency</Link></li>
          <li><Link href="#" className="text-gray-700">Dashboard</Link></li>
          
          
        </ul>
      </div>
      <div className="flex items-center">
        <div className="mr-4">
          <img src="avatar.png" alt="avatar" className="w-8 h-8 rounded-full" />
        </div>
        <div className="relative">
          <i className="fas fa-bell text-2xl cursor-pointer"></i>
          <span className="absolute top-0 right-0 bg-red-500 text-white px-2 py-1 rounded-full text-xs">
          {unattendedEmergencies}
          </span>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
