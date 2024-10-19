// Import necessary modules and components
import React, { useState, useEffect } from "react";
import { FaCheck } from "react-icons/fa";
import Sidebar from "./Sidebar";
import Navigation from "./Navbar";
import Modal from "./Modal"; // Import your Modal component

const UnattendedEmergencies = () => {
  const [emergencies, setEmergencies] = useState([]);

  const [selectedEmergency, setSelectedEmergency] = useState(null); // Track the selected emergency for the modal

  useEffect(() => {
    // Fetch all emergencies
    fetch("http://localhost:5000/api/emergency/getemg/")
      .then((response) => response.json())
      .then((data) => {
        // Filter emergencies by status 'unattended'
        const unattendedEmergencies = data.filter(
          (emergency) => emergency.status === "unattended"
        );
        setEmergencies(unattendedEmergencies);
      })
      .catch((error) => console.error(error));
  }, []);

  const handleUpdateStatus = async (id, status) => {
    try {
      // Set the selected emergency for the modal
      setSelectedEmergency(
        emergencies.find((emergency) => emergency._id === id)
      );

      // Send a request to update the status
      const response = await fetch(
        `http://localhost:5000/api/emergency/updateemg/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        }
      );

      if (response.ok) {
        // Update the status locally
        const updatedEmergencies = emergencies.map((emergency) =>
          emergency._id === id ? { ...emergency, status } : emergency
        );
        setEmergencies(updatedEmergencies);
        closeModal(); // Close the modal after updating the status
      } else {
        console.error("Error updating emergency status");
      }
    } catch (error) {
      console.error("Error updating emergency status:", error);
    }
  };

  const closeModal = () => {
    setSelectedEmergency(null);
  };

  const updateStatusInModal = (newStatus) => {
    // ... (code to update the status in the modal)
    closeModal(); // Close the modal after updating the status
  };

  return (
    <>
      <Navigation />
      {/* Sidebar */}
      <div className="flex h-screen">
        <Sidebar />
        <div className="w-4/5 p-8 overflow-y-auto">
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-200">
            <div className="container mx-auto my-10 p-4">
              <h1 className="text-3xl font-bold mb-4">
                Unattended Emergencies
              </h1>
              <div className="overflow-auto bg-white rounded-md shadow-md">
                <table className="w-full table-fixed divide-y divide-gray-200">
                  <thead>
                    <tr className="bg-gray-100 text-gray-600 text-left">
                      <th className="p-2 font-medium">Type</th>
                      <th className="p-2 font-medium">Name</th>
                      <th className="p-2 font-medium">Email</th>

                      <th className="p-2 font-medium">Status</th>
                      <th className="p-2 font-medium flex justify-end">
                        <span className="mr-2">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {emergencies.map((emergency) => (
                      // ... (previous code)

                      <tr key={emergency._id} className="hover:bg-gray-50">
                        <td className="p-2">{emergency.type}</td>
                        <td className="p-2">{emergency.name}</td>
                        <td className="p-2">{emergency.email}</td>

                        <td className="p-2">
                          <span
                            className={`font-bold text-${
                              emergency.status === "attended"
                                ? "green-500"
                                : "red-500"
                            }`}
                          >
                            {emergency.status}
                          </span>
                        </td>
                        <td className="p-2 flex justify-end">
                          <button
                            className="flex items-center px-3 py-2 rounded-md shadow-md bg-indigo-500 text-white mr-2 hover:bg-indigo-600 transition-colors"
                            onClick={() =>
                              handleUpdateStatus(emergency._id, "attended")
                            }
                          >
                            <FaCheck /> Mark Attended
                          </button>
                        </td>
                      </tr>

                      // ... (rest of the code)
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Render the modal with selected emergency */}
              {selectedEmergency && (
                <Modal
                  isOpen={true} // Set to true to open the modal
                  onClose={closeModal}
                  onUpdateStatus={updateStatusInModal}
                  emergency={selectedEmergency}
                />
              )}
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default UnattendedEmergencies;
