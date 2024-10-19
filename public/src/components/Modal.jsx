import React, { useState } from 'react';
import PropTypes from 'prop-types';

const Modal = ({ isOpen, onClose, onUpdateStatus, emergency }) => {
  const [newStatus, setNewStatus] = useState('');

  const handleUpdateStatus = () => {
    onUpdateStatus(newStatus);
  };

  return (
    <div className={`modal ${isOpen ? 'is-active' : ''}`}>
      <div className="modal-background" onClick={onClose}></div>
      <div className="modal-content">
        <div className="box">
          <h3 className="title is-3">Update Emergency Status</h3>
          <p>
            <strong>Type:</strong> {emergency.type}
          </p>
          <p>
            <strong>Name:</strong> {emergency.name}
          </p>
          <p>
            <strong>Email:</strong> {emergency.email}
          </p>
          <p>
            <strong>Description:</strong> {emergency.description}
          </p>
          <p>
            <strong>Location:</strong> {emergency.location}
          </p>
          <div className="field">
            <label className="label">New Status</label>
            <div className="control">
              <input
                className="input"
                type="text"
                placeholder="Enter new status"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
              />
            </div>
          </div>
          <div className="field is-grouped">
            <div className="control">
              <button className="button is-success" onClick={handleUpdateStatus}>
                Update Status
              </button>
            </div>
            <div className="control">
              <button className="button" onClick={onClose}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
      <button className="modal-close is-large" aria-label="close" onClick={onClose}></button>
    </div>
  );
};

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onUpdateStatus: PropTypes.func.isRequired,
  emergency: PropTypes.object.isRequired,
};

export default Modal;
