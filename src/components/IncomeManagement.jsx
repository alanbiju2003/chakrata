import React, { useState, useEffect, useContext } from 'react';
import { collection, addDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { Wallet } from 'lucide-react';
import { FirebaseContext } from '../App.js'; // Corrected: Changed from App.jsx to App.js

// IncomeManagement Component
function IncomeManagement({ appId, tripId, members, incomes, isCaptain }) { // Added isCaptain prop
  const { db, showCustomModal } = useContext(FirebaseContext);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(''); // New state for payment method
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isAddingIncome, setIsAddingIncome] = useState(false);

  const handleAddIncome = async (e) => {
    e.preventDefault();
    if (!selectedMemberId || !amount || !description || !paymentMethod || !date) {
      showCustomModal("All fields are required for income.");
      return;
    }
    const incomeAmount = parseFloat(amount);
    if (isNaN(incomeAmount) || incomeAmount <= 0) {
      showCustomModal("Amount must be a positive number.");
      return;
    }
    if (!db) {
      showCustomModal("Database not available.");
      return;
    }

    setIsAddingIncome(true);
    try {
      await addDoc(collection(db, `artifacts/${appId}/public/data/trips/${tripId}/incomes`), {
        memberId: selectedMemberId,
        amount: incomeAmount,
        description: description.trim(),
        paymentMethod: paymentMethod, // Save payment method
        date: date,
        createdAt: serverTimestamp(),
      });
      setSelectedMemberId('');
      setAmount('');
      setDescription('');
      setPaymentMethod(''); // Reset payment method
      setDate(new Date().toISOString().split('T')[0]);
      showCustomModal(`Income added successfully!`);
    } catch (e) {
      console.error("Error adding income: ", e);
      showCustomModal(`Failed to add income: ${e.message}`);
    } finally {
      setIsAddingIncome(false);
    }
  };

  const getMemberName = (id) => members.find(m => m.id === id)?.name || 'Unknown Member';

  return (
    <div className="income-management-container card"> {/* Reusing global card style */}
      <h3 className="income-management-heading">
        <Wallet size={22} /> Manage Income
      </h3>

      {!isCaptain && (
        <p className="no-members-message" style={{ marginBottom: '20px', color: '#e74c3c', fontWeight: '500' }}>
          Only the trip captain can add or modify income.
        </p>
      )}

      <form onSubmit={handleAddIncome} className="add-income-form">
        <div className="form-grid"> {/* Grid for form fields */}
          <div className="form-group">
            <label htmlFor="incomeMember">Member</label>
            <select
              id="incomeMember"
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="input-field"
              required
              disabled={!isCaptain} /* Disabled if not captain */
            >
              <option value="">Select a member</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>{member.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="incomeAmount">Amount</label>
            <input
              type="number"
              id="incomeAmount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input-field"
              placeholder="e.g., 500.00"
              step="0.01"
              required
              disabled={!isCaptain} /* Disabled if not captain */
            />
          </div>
          <div className="form-group">
            <label htmlFor="incomeDescription">Description</label>
            <input
              type="text"
              id="incomeDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field"
              placeholder="e.g., Initial contribution"
              required
              disabled={!isCaptain} /* Disabled if not captain */
            />
          </div>
          <div className="form-group">
            <label htmlFor="incomePaymentMethod">Payment Method</label>
            <select
              id="incomePaymentMethod"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="input-field"
              required
              disabled={!isCaptain} /* Disabled if not captain */
            >
              <option value="">Select method</option>
              <option value="Cash">Cash</option>
              <option value="UPI">UPI</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Card">Card</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="incomeDate">Date</label>
            <input
              type="date"
              id="incomeDate"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input-field"
              required
              disabled={!isCaptain} /* Disabled if not captain */
            />
          </div>
        </div> {/* End form-grid */}
        <div className="form-actions"> {/* Button alignment */}
          <button
            type="submit"
            disabled={isAddingIncome || !isCaptain || members.length === 0} /* Disabled if not captain or no members */
            className="btn btn-success add-income-button"
          >
            {isAddingIncome ? 'Adding...' : 'Add Income'}
          </button>
        </div>
        {members.length === 0 && <p className="no-members-message">Please add members first to record income.</p>}
      </form>

      {incomes.length === 0 ? (
        <p className="no-income-message">No income recorded yet.</p>
      ) : (
        <div className="table-wrapper"> {/* Table container for responsive overflow and consistent borders */}
          <table className="data-table income-table"> {/* Reusing global data-table style */}
            <thead>
              <tr>
                <th>Member</th>
                <th>Amount</th>
                <th>Description</th>
                <th>Method</th> {/* New column for payment method */}
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {incomes.map((income) => (
                <tr key={income.id}>
                  <td>{getMemberName(income.memberId)}</td>
                  <td className="balance-positive">${income.amount.toFixed(2)}</td>
                  <td>{income.description}</td>
                  <td>{income.paymentMethod || 'N/A'}</td> {/* Display payment method */}
                  <td>{new Date(income.date).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default IncomeManagement;
