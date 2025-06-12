import React, { useState, useEffect, useContext } from 'react';
import { collection, addDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { Users } from 'lucide-react';
import { FirebaseContext } from '../App'; // Changed from '../App.js' to '../App'
// import './MemberManagement.css'; // Removed: all CSS is in index.css

// MemberManagement Component
function MemberManagement({ appId, tripId, members }) {
  const { db, showCustomModal } = useContext(FirebaseContext);
  const [newMemberName, setNewMemberName] = useState('');
  const [isAddingMember, setIsAddingMember] = useState(false);

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!newMemberName.trim()) {
      showCustomModal("Member name cannot be empty.");
      return;
    }
    if (!db) {
      showCustomModal("Database not available.");
      return;
    }
    setIsAddingMember(true);
    try {
      await addDoc(collection(db, `artifacts/${appId}/public/data/trips/${tripId}/members`), {
        name: newMemberName.trim(),
        addedAt: serverTimestamp(),
      });
      setNewMemberName('');
      showCustomModal(`Member "${newMemberName}" added.`);
    } catch (e) {
      console.error("Error adding member: ", e);
      showCustomModal(`Failed to add member: ${e.message}`);
    } finally {
      setIsAddingMember(false);
    }
  };

  return (
    <div className="member-management-container card"> {/* Using global card style */}
      <h3 className="member-management-heading">
        <Users size={22} /> Manage Members
      </h3>

      <form onSubmit={handleAddMember} className="add-member-form">
        <div className="form-group"> {/* Using global form-group style */}
          <label htmlFor="memberName">Member Name</label>
          <input
            type="text"
            id="memberName"
            value={newMemberName}
            onChange={(e) => setNewMemberName(e.target.value)}
            className="input-field" // Using global input style
            placeholder="e.g., John Doe"
            required
          />
        </div>
        <button
          type="submit"
          disabled={isAddingMember}
          className="btn btn-primary add-member-button" // Using global button style
        >
          {isAddingMember ? 'Adding...' : 'Add Member'}
        </button>
      </form>

      {members.length === 0 ? (
        <p className="no-members-message">No members added yet.</p>
      ) : (
        <div className="table-wrapper"> {/* A wrapper for overflow on small screens */}
          <table className="data-table member-table"> {/* Using global data-table style */}
            <thead>
              <tr>
                <th>Member Name</th>
                <th>Added On</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id}>
                  <td>{member.name}</td>
                  <td>{member.addedAt?.toDate().toLocaleDateString() || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default MemberManagement;
