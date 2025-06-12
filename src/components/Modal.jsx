import React from 'react';
// import './Modal.css'; // Removed: all CSS is in index.css

// Custom Modal Component
const Modal = ({ message, onClose }) => {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <p className="modal-message">{message}</p>
        <button
          onClick={onClose}
          className="modal-button"
        >
          OK
        </button>
      </div>
    </div>
  );
};

export default Modal;
