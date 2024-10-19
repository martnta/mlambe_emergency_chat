// Sidebar.js
import React from 'react';
import { Link } from 'react-router-dom';
import { BsFillHouseDoorFill, BsExclamationTriangle, BsChatDots, BsGearFill } from 'react-icons/bs';

const Sidebar = () => {
  return (
    <div className="w-1/5 bg-green-500 justify-evenly mb-6 p-4 space-y-2 text-white shadow-md">
      <ul>
        {/** Dashboard */}
        <li className="py-2 flex items-center justify-center rounded-sm hover:bg-white hover:text-green-500 transition">
          <BsFillHouseDoorFill className="mr-2" />
          <Link to="/admin">Dashboard</Link>
        </li>

        {/** Emergencies */}
        <li className="py-2 flex items-center justify-center rounded-sm hover:bg-white hover:text-green-500 transition">
          <BsExclamationTriangle className="mr-2" />
          <Link to="/update">Emergencies</Link>
        </li>

        {/** Chat */}
        <li className="py-2 flex items-center justify-center rounded-sm hover:bg-white hover:text-green-500 transition">
          <BsChatDots className="mr-2" />
          <Link to="/">Chat</Link>
        </li>

        {/** Settings */}
        <li className="py-2 flex items-center justify-center rounded-sm hover:bg-white hover:text-green-500 transition">
          <BsGearFill className="mr-2" />
          <Link to="#">Settings</Link>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
