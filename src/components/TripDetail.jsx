import React, { useState, useEffect, useContext } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { PieChart, Users, Wallet, CreditCard, ChevronLeft } from 'lucide-react';
import { FirebaseContext } from '../App.js'; // Import the context
// import './TripDetail.css'; // Removed: all CSS is in index.css

// Import sub-components for tabs
import MemberManagement from './MemberManagement.jsx';
import IncomeManagement from './IncomeManagement.jsx';
import ExpenseManagement from './ExpenseManagement.jsx';
import SummaryAndStatements from './SummaryAndStatements.jsx';

// TripDetail Component
function TripDetail({ appId, trip, setCurrentPage }) {
  const [activeTab, setActiveTab] = useState('summary'); // 'summary', 'members', 'income', 'expenses'
  const { db, showCustomModal } = useContext(FirebaseContext);
  const [members, setMembers] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const [expenses, setExpenses] = useState([]);

  useEffect(() => {
    if (!db || !trip?.id) return;

    // Listen for members
    const unsubscribeMembers = onSnapshot(
      collection(db, `artifacts/${appId}/public/data/trips/${trip.id}/members`),
      (snapshot) => {
        const membersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMembers(membersData);
      }, (error) => {
        console.error("Error fetching members:", error);
        showCustomModal(`Failed to load members: ${error.message}`);
      }
    );

    // Listen for incomes
    const unsubscribeIncomes = onSnapshot(
      collection(db, `artifacts/${appId}/public/data/trips/${trip.id}/incomes`),
      (snapshot) => {
        const incomesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setIncomes(incomesData);
      }, (error) => {
        console.error("Error fetching incomes:", error);
        showCustomModal(`Failed to load incomes: ${error.message}`);
      }
    );

    // Listen for expenses
    const unsubscribeExpenses = onSnapshot(
      collection(db, `artifacts/${appId}/public/data/trips/${trip.id}/expenses`),
      (snapshot) => {
        const expensesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setExpenses(expensesData);
      }, (error) => {
        console.error("Error fetching expenses:", error);
        showCustomModal(`Failed to load expenses: ${error.message}`);
      }
    );

    return () => {
      unsubscribeMembers();
      unsubscribeIncomes();
      unsubscribeExpenses();
    };
  }, [db, trip.id, appId, showCustomModal]);

  return (
    <div className="trip-detail-container">
      <div className="trip-detail-header">
        <button
          onClick={() => setCurrentPage('tripList')}
          className="back-button"
        >
          <ChevronLeft size={20} /> Back to Trips
        </button>
        <h2 className="trip-detail-title">{trip.name}</h2>
      </div>
      <p className="trip-detail-description">{trip.description || 'No description for this trip.'}</p>

      {/* Tabs */}
      <div className="tab-navigation">
        <button
          className={`tab-button ${activeTab === 'summary' ? 'active' : ''}`}
          onClick={() => setActiveTab('summary')}
        >
          <PieChart size={18} /> Summary
        </button>
        <button
          className={`tab-button ${activeTab === 'members' ? 'active' : ''}`}
          onClick={() => setActiveTab('members')}
        >
          <Users size={18} /> Members
        </button>
        <button
          className={`tab-button ${activeTab === 'income' ? 'active' : ''}`}
          onClick={() => setActiveTab('income')}
        >
          <Wallet size={18} /> Income
        </button>
        <button
          className={`tab-button ${activeTab === 'expenses' ? 'active' : ''}`}
          onClick={() => setActiveTab('expenses')}
        >
          <CreditCard size={18} /> Expenses
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'members' && (
          <MemberManagement appId={appId} tripId={trip.id} members={members} />
        )}
        {activeTab === 'income' && (
          <IncomeManagement appId={appId} tripId={trip.id} members={members} incomes={incomes} />
        )}
        {activeTab === 'expenses' && (
          <ExpenseManagement appId={appId} tripId={trip.id} members={members} expenses={expenses} />
        )}
        {activeTab === 'summary' && (
          <SummaryAndStatements
            appId={appId}
            tripId={trip.id}
            members={members}
            incomes={incomes}
            expenses={expenses}
          />
        )}
      </div>
    </div>
  );
}

export default TripDetail;
