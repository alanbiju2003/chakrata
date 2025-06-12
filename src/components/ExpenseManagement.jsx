import React, { useState, useEffect, useContext } from 'react';
import { collection, addDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { CreditCard } from 'lucide-react';
import { FirebaseContext } from '../App'; // Import the context

// ExpenseManagement Component
function ExpenseManagement({ appId, tripId, members, expenses }) {
  const { db, showCustomModal } = useContext(FirebaseContext);
  const [paidByMemberId, setPaidByMemberId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [includedMemberIds, setIncludedMemberIds] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isAddingExpense, setIsAddingExpense] = useState(false);

  useEffect(() => {
    // When members change, reset includedMemberIds
    if (members.length > 0 && includedMemberIds.length === 0) {
      setIncludedMemberIds(members.map(m => m.id)); // Default to all members included
    } else if (members.length === 0) {
      setIncludedMemberIds([]);
    }
  }, [members, includedMemberIds.length]);

  const handleToggleInclude = (memberId) => {
    setIncludedMemberIds(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!paidByMemberId || !amount || !description || includedMemberIds.length === 0 || !date) {
      showCustomModal("All fields are required, and at least one member must be included.");
      return;
    }
    const expenseAmount = parseFloat(amount);
    if (isNaN(expenseAmount) || expenseAmount <= 0) {
      showCustomModal("Amount must be a positive number.");
      return;
    }
    if (!db) {
      showCustomModal("Database not available.");
      return;
    }

    setIsAddingExpense(true);
    try {
      await addDoc(collection(db, `artifacts/${appId}/public/data/trips/${tripId}/expenses`), {
        paidByMemberId: paidByMemberId,
        amount: expenseAmount,
        description: description.trim(),
        includedMemberIds: includedMemberIds, // Store array of IDs
        date: date,
        createdAt: serverTimestamp(),
      });
      setPaidByMemberId('');
      setAmount('');
      setDescription('');
      setIncludedMemberIds(members.map(m => m.id)); // Reset to all
      setDate(new Date().toISOString().split('T')[0]);
      showCustomModal(`Expense added successfully!`);
    } catch (e) {
      console.error("Error adding expense: ", e);
      showCustomModal(`Failed to add expense: ${e.message}`);
    } finally {
      setIsAddingExpense(false);
    }
  };

  const getMemberName = (id) => members.find(m => m.id === id)?.name || 'Unknown Member';

  return (
    <div className="p-4 bg-white rounded-lg shadow-md border border-gray-200">
      <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
        <CreditCard className="mr-2 text-red-600" size={22} /> Manage Expenses
      </h3>

      <form onSubmit={handleAddExpense} className="mb-6 space-y-4">
        <div>
          <label htmlFor="expensePaidBy" className="block text-sm font-medium text-gray-700">Paid By</label>
          <select
            id="expensePaidBy"
            value={paidByMemberId}
            onChange={(e) => setPaidByMemberId(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
          >
            <option value="">Select member who paid</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>{member.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="expenseAmount" className="block text-sm font-medium text-gray-700">Amount</label>
          <input
            type="number"
            id="expenseAmount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="e.g., 120.50"
            step="0.01"
            required
          />
        </div>
        <div>
          <label htmlFor="expenseDescription" className="block text-sm font-medium text-gray-700">Description</label>
          <input
            type="text"
            id="expenseDescription"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="e.g., Dinner at restaurant"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Included Members</label>
          {members.length === 0 ? (
            <p className="text-red-500 text-sm">Please add members first to select who was included.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {members.map((member) => (
                <label key={member.id} className="inline-flex items-center">
                  <input
                    type="checkbox"
                    value={member.id}
                    checked={includedMemberIds.includes(member.id)}
                    onChange={() => handleToggleInclude(member.id)}
                    className="form-checkbox h-4 w-4 text-indigo-600 rounded"
                  />
                  <span className="ml-2 text-gray-700">{member.name}</span>
                </label>
              ))}
            </div>
          )}
        </div>
        <div>
          <label htmlFor="expenseDate" className="block text-sm font-medium text-gray-700">Date</label>
          <input
            type="date"
            id="expenseDate"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
          />
        </div>
        <button
          type="submit"
          disabled={isAddingExpense || members.length === 0 || includedMemberIds.length === 0}
          className="w-full sm:w-auto px-6 py-2 bg-red-600 text-white font-semibold rounded-md shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isAddingExpense ? 'Adding...' : 'Add Expense'}
        </button>
      </form>

      {expenses.length === 0 ? (
        <p className="text-center text-gray-600">No expenses recorded yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Paid By
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Included
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {expenses.map((expense) => (
                <tr key={expense.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {expense.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-semibold">
                    -${expense.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getMemberName(expense.paidByMemberId)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {expense.includedMemberIds.map(id => getMemberName(id)).join(', ')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(expense.date).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ExpenseManagement;
