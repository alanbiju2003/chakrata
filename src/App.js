/* global __initial_auth_token */
import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc, addDoc, setDoc, updateDoc, deleteDoc, onSnapshot, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { getAnalytics } from "firebase/analytics";

// lucide-react is used for icons.
import { PlusCircle, Users, Wallet, CreditCard, PieChart, ChevronLeft, ReceiptText, LogIn, LogOut } from 'lucide-react';

// Context for Firebase and Auth
const FirebaseContext = createContext(null);

// Define the admin UID
const ADMIN_UID = "rpGFCp7Rn3TMG3iKhyVjxmbzuA92"; // UID for kuttu@gmail.com

function App() {
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [currentPage, setCurrentPage] = useState('tripList');
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [isTripCaptain, setIsTripCaptain] = useState(false); // State for admin status
  const [showLoginModal, setShowLoginModal] = useState(false); // State for login modal

  const firebaseConfig = {
    apiKey: "AIzaSyDplvW6M5NyZ4gvpTKJcWylzr8ZDvu3pII",
    authDomain: "chakrata-ed63e.firebaseapp.com",
    databaseURL: "https://chakrata-ed63e-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "chakrata-ed63e",
    storageBucket: "chakrata-ed63e.firebaseolestorage.app",
    messagingSenderId: "867844986027",
    appId: "1:867844986027:web:776a492b431712ae8f93ee",
    measurementId: "G-WLPDM75TZ8"
  };

  const appIdForFirestore = firebaseConfig.projectId || 'default-trip-fund-app';

  useEffect(() => {
    let appInstance;
    let authInstance;
    let dbInstance;
    let analyticsInstance;

    try {
      appInstance = initializeApp(firebaseConfig);
      authInstance = getAuth(appInstance);
      dbInstance = getFirestore(appInstance);
      analyticsInstance = getAnalytics(appInstance);

      setAuth(authInstance);
      setDb(dbInstance);

      const unsubscribe = onAuthStateChanged(authInstance, async (user) => {
        if (user) {
          setUserId(user.uid);
          // Check if the logged-in user is the trip captain
          setIsTripCaptain(user.uid === ADMIN_UID);
        } else {
          // Sign in anonymously for public view
          try {
            await signInAnonymously(authInstance);
            setIsTripCaptain(false);
          } catch (error) {
            console.error("Error signing in anonymously:", error);
            setModalMessage(`Authentication error: ${error.message}. Please refresh the page.`);
            setShowModal(true);
          }
        }
        setIsAuthReady(true);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error("Firebase initialization failed:", error);
      setModalMessage(`Failed to initialize application: ${error.message}.`);
      setShowModal(true);
    }
  }, [JSON.stringify(firebaseConfig)]);

  const showCustomModal = (message) => {
    setModalMessage(message);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalMessage('');
  };

  // Login function for trip captain
  const handleCaptainLogin = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      if (userCredential.user.uid === ADMIN_UID) {
        setIsTripCaptain(true);
        setModalMessage("Logged in as Trip Captain successfully!");
        setShowLoginModal(false);
      } else {
        await signOut(auth);
        setModalMessage("Only the designated Trip Captain can log in. You have been logged out.");
        setIsTripCaptain(false);
        await signInAnonymously(auth);
      }
      setShowModal(true);
    } catch (error) {
      console.error("Error logging in:", error);
      setModalMessage(`Login failed: ${error.message}`);
      setShowModal(true);
      setIsTripCaptain(false);
    }
  };

  // Logout function for trip captain
  const handleCaptainLogout = async () => {
    try {
      await signOut(auth);
      await signInAnonymously(auth);
      setModalMessage("Logged out successfully. You are now viewing as a public user.");
      setShowModal(true);
      setIsTripCaptain(false);
    } catch (error) {
      console.error("Error logging out:", error);
      setModalMessage(`Logout failed: ${error.message}`);
      setShowModal(true);
    }
  };

  if (!isAuthReady) {
    return (
      <div className="loading-container">
        <div className="loading-card">
          <p className="loading-text">Loading application...</p>
        </div>
      </div>
    );
  }

  return (
    <FirebaseContext.Provider value={{ db, auth, userId, showCustomModal, isTripCaptain }}>
      <div className="app-container">
        <div className="relative w-full flex items-center justify-center p-4">
          <img
            className="absolute top-4 left-4 h-16 w-16 rounded-full shadow-md"
            onError={(e) => { e.target.onerror = null; e.target.src = ''; }}
          />
          <h1 className="app-title">
            {/* AB MEMORIES */}
          </h1>
          {/* Captain Login/Logout Button */}
          <div style={{ position: 'absolute', top: '15px', right: '15px' }}>
            {!isTripCaptain ? (
              <button
                onClick={() => setShowLoginModal(true)}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                <LogIn size={18} /> Captain Login
              </button>
            ) : (
              <button
                onClick={handleCaptainLogout}
                className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                <LogOut size={18} /> Logout Captain
              </button>
            )}
          </div>
        </div>

        {showModal && (
          <Modal message={modalMessage} onClose={closeModal} />
        )}

        {showLoginModal && (
          <AdminLogin onLogin={handleCaptainLogin} onClose={() => setShowLoginModal(false)} />
        )}

        <div className="main-content-card">
          {currentPage === 'tripList' && (
            <TripList
              appId={appIdForFirestore}
              setCurrentPage={setCurrentPage}
              setSelectedTrip={setSelectedTrip}
            />
          )}
          {currentPage === 'tripDetail' && selectedTrip && (
            <TripDetail
              appId={appIdForFirestore}
              trip={selectedTrip}
              setCurrentPage={setCurrentPage}
            />
          )}
        </div>
      </div>
    </FirebaseContext.Provider>
  );
}

// AdminLogin Component
const AdminLogin = ({ onLogin, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onLogin(email, password);
  };

  return (
    <div className="modal-overlay">
      <div className="login-card modal-content">
        <h2 className="login-title"><LogIn size={24} /> Trip Captain Login</h2>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="@gmail.com"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="Your password"
              required
            />
          </div>
          <div className="login-form-actions">
            <button type="submit" className="btn btn-primary login-button">
              Login
            </button>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

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

// TripList Component
function TripList({ appId, setCurrentPage, setSelectedTrip }) {
  const { db, userId, showCustomModal, isTripCaptain } = useContext(FirebaseContext);
  const [trips, setTrips] = useState([]);
  const [newTripName, setNewTripName] = useState('');
  const [newTripDesc, setNewTripDesc] = useState('');
  const [isAddingTrip, setIsAddingTrip] = useState(false);

  useEffect(() => {
    if (!db || !userId) return;

    const q = query(
      collection(db, `artifacts/${appId}/public/data/trips`),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tripsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTrips(tripsData);
    }, (error) => {
      console.error("Error fetching trips:", error);
      showCustomModal(`Failed to load trips: ${error.message}`);
    });

    return () => unsubscribe();
  }, [db, userId, appId, showCustomModal]);

  const handleCreateTrip = async (e) => {
    e.preventDefault();
    if (!newTripName.trim()) {
      showCustomModal("Trip name cannot be empty.");
      return;
    }
    if (!db || !userId) {
      showCustomModal("Database or User ID not available.");
      return;
    }
    if (!isTripCaptain) {
      showCustomModal("You do not have permission to create trips.");
      return;
    }

    setIsAddingTrip(true);
    try {
      const docRef = await addDoc(collection(db, `artifacts/${appId}/public/data/trips`), {
        name: newTripName.trim(),
        description: newTripDesc.trim(),
        ownerId: userId,
        createdAt: serverTimestamp(),
      });
      setNewTripName('');
      setNewTripDesc('');
      showCustomModal(`Trip "${newTripName}" created successfully!`);
    } catch (e) {
      console.error("Error adding document: ", e);
      showCustomModal(`Failed to create trip: ${e.message}`);
    } finally {
      setIsAddingTrip(false);
    }
  };

  const handleSelectTrip = (trip) => {
    setSelectedTrip(trip);
    setCurrentPage('tripDetail');
  };

  return (
    <div className="trip-list-container">
      <h2 className="trip-list-title">Your Trips</h2>

      <div className="create-trip-section card">
        <h3 className="create-trip-heading">
          <PlusCircle className="icon" size={24} /> Create a New Trip
        </h3>
        <form onSubmit={handleCreateTrip} className="create-trip-form">
          <div className="form-group">
            <label htmlFor="tripName">Trip Name</label>
            <input
              type="text"
              id="tripName"
              value={newTripName}
              onChange={(e) => setNewTripName(e.target.value)}
              className="input-field"
              placeholder="e.g., CHlo bhai trip PE"
              required
              disabled={!isTripCaptain}
            />
          </div>
          <div className="form-group">
            <label htmlFor="tripDesc">Description (Optional)</label>
            <textarea
              id="tripDesc"
              value={newTripDesc}
              onChange={(e) => setNewTripDesc(e.target.value)}
              rows="3"
              className="input-field"
              placeholder="e.g.,KOndli , MAyur Vihar phase 3 , kHoda"
              disabled={!isTripCaptain}
            ></textarea>
          </div>
          <button
            type="submit"
            disabled={isAddingTrip || !isTripCaptain}
            className="btn btn-primary trip-form-button"
          >
            {isAddingTrip ? 'Creating...' : (
              <>
                <PlusCircle className="icon" size={20} /> Create Trip
              </>
            )}
          </button>
        </form>
      </div>

      {trips.length === 0 ? (
        <p className="no-trips-message">No trips found. {isTripCaptain ? 'Create one to get started!' : 'Contact the trip captain to create a trip.'}</p>
      ) : (
        <ul className="trip-list-grid">
          {trips.map((trip, index) => (
            <li
              key={trip.id}
              onClick={() => handleSelectTrip(trip)}
              className="trip-card"
            >
              <h4 className="trip-card-name">{index + 1}. {trip.name}</h4>
              <p className="trip-card-description">{trip.description || 'No description provided.'}</p>
              <p className="trip-card-owner">
                Created by: ALAN BIJU
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// TripDetail Component
function TripDetail({ appId, trip, setCurrentPage }) {
  const [activeTab, setActiveTab] = useState('summary');
  const { db, userId, showCustomModal, isTripCaptain } = useContext(FirebaseContext);
  const [members, setMembers] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [settlements, setSettlements] = useState([]);

  // Determine if the current user is the captain
  const isCaptain = isTripCaptain || (userId && trip.ownerId === userId);

  useEffect(() => {
    if (!db || !trip?.id) return;

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

    const unsubscribeSettlements = onSnapshot(
      collection(db, `artifacts/${appId}/public/data/trips/${trip.id}/settlements`),
      (snapshot) => {
        const settlementsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setSettlements(settlementsData);
      }, (error) => {
        console.error("Error fetching settlements:", error);
        showCustomModal(`Failed to load settlements: ${error.message}`);
      }
    );

    return () => {
      unsubscribeMembers();
      unsubscribeIncomes();
      unsubscribeExpenses();
      unsubscribeSettlements();
    };
  }, [db, trip.id, appId, isCaptain, showCustomModal]);

  return (
    <div>
      <div className="trip-detail-header">
        <button
          onClick={() => setCurrentPage('tripList')}
          className="back-button"
        >
          <ChevronLeft className="icon" size={20} /> Back to Trips
        </button>
        <h2 className="trip-detail-title">{trip.name}</h2>
      </div>
      <p className="trip-detail-description">{trip.description || 'No description for this trip.'}</p>

      <div className="tab-navigation">
        <button
          className={`tab-button ${activeTab === 'summary' ? 'active' : ''}`}
          onClick={() => setActiveTab('summary')}
        >
          <PieChart className="icon" size={18} /> Summary
        </button>
        <button
          className={`tab-button ${activeTab === 'members' ? 'active' : ''}`}
          onClick={() => setActiveTab('members')}
        >
          <Users className="icon" size={18} /> Members
        </button>
        <button
          className={`tab-button ${activeTab === 'income' ? 'active' : ''}`}
          onClick={() => setActiveTab('income')}
        >
          <Wallet className="icon" size={18} /> Income
        </button>
        <button
          className={`tab-button ${activeTab === 'expenses' ? 'active' : ''}`}
          onClick={() => setActiveTab('expenses')}
        >
          <CreditCard className="icon" size={18} /> Expenses
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'summary' && (
          <SummaryAndStatements
            appId={appId}
            tripId={trip.id}
            members={members}
            incomes={incomes}
            expenses={expenses}
            settlements={settlements}
            isCaptain={isCaptain}
          />
        )}
        {activeTab === 'members' && (
          <MemberManagement appId={appId} tripId={trip.id} members={members} isCaptain={isCaptain} />
        )}
        {activeTab === 'income' && (
          <IncomeManagement appId={appId} tripId={trip.id} members={members} incomes={incomes} isCaptain={isCaptain} />
        )}
        {activeTab === 'expenses' && (
          <ExpenseManagement appId={appId} tripId={trip.id} members={members} expenses={expenses} isCaptain={isCaptain} />
        )}
      </div>
    </div>
  );
}

// MemberManagement Component
function MemberManagement({ appId, tripId, members, isCaptain }) {
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
    if (!isCaptain) {
      showCustomModal("You do not have permission to add members.");
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
    <div className="member-management-container card">
      <h3 className="member-management-heading">
        <Users className="icon" size={22} /> Manage Members
      </h3>

      {!isCaptain && (
        <p className="no-members-message" style={{ marginBottom: '20px', color: '#e74c3c', fontWeight: '500' }}>
          Only the trip captain can add or remove members.
        </p>
      )}

      <form onSubmit={handleAddMember} className="add-member-form">
        <div className="form-group">
          <label htmlFor="memberName">Member Name</label>
          <input
            type="text"
            id="memberName"
            value={newMemberName}
            onChange={(e) => setNewMemberName(e.target.value)}
            className="input-field"
            placeholder="e.g., ALAN BIJU"
            required
            disabled={!isCaptain}
          />
        </div>
        <button
          type="submit"
          disabled={isAddingMember || !isCaptain}
          className="btn btn-primary add-member-button"
        >
          {isAddingMember ? 'Adding...' : 'Add Member'}
        </button>
      </form>

      {members.length === 0 ? (
        <p className="no-members-message">No members added yet.</p>
      ) : (
        <div className="table-wrapper">
          <table className="data-table member-table">
            <thead>
              <tr>
                <th>S. No.</th>
                <th>Member Name</th>
                <th>Added On</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member, index) => (
                <tr key={member.id}>
                  <td>{index + 1}</td>
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

// IncomeManagement Component
function IncomeManagement({ appId, tripId, members, incomes, isCaptain }) {
  const { db, showCustomModal } = useContext(FirebaseContext);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
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
    if (!isCaptain) {
      showCustomModal("You do not have permission to add income.");
      return;
    }

    setIsAddingIncome(true);
    try {
      await addDoc(collection(db, `artifacts/${appId}/public/data/trips/${tripId}/incomes`), {
        memberId: selectedMemberId,
        amount: incomeAmount,
        description: description.trim(),
        paymentMethod: paymentMethod,
        date: date,
        createdAt: serverTimestamp(),
      });
      setSelectedMemberId('');
      setAmount('');
      setDescription('');
      setPaymentMethod('');
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
    <div className="income-management-container card">
      <h3 className="income-management-heading">
        <Wallet className="icon" size={22} /> Manage Income
      </h3>

      {!isCaptain && (
        <p className="no-members-message" style={{ marginBottom: '20px', color: '#e74c3c', fontWeight: '500' }}>
          Only the trip captain can add or modify income.
        </p>
      )}

      <form onSubmit={handleAddIncome} className="add-income-form">
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="incomeMember">Member</label>
            <select
              id="incomeMember"
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="input-field"
              required
              disabled={!isCaptain}
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
              disabled={!isCaptain}
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
              placeholder="e.g.,Description"
              required
              disabled={!isCaptain}
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
              disabled={!isCaptain}
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
              disabled={!isCaptain}
            />
          </div>
        </div>
        <div className="form-actions">
          <button
            type="submit"
            disabled={isAddingIncome || !isCaptain || members.length === 0}
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
        <div className="table-wrapper">
          <table className="data-table income-table">
            <thead>
              <tr>
                <th>S. No.</th>
                <th>Member</th>
                <th>Amount</th>
                <th>Description</th>
                <th>Method</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {incomes.map((income, index) => (
                <tr key={income.id}>
                  <td>{index + 1}</td>
                  <td>{getMemberName(income.memberId)}</td>
                  <td className="balance-positive">₹{income.amount.toFixed(2)}</td>
                  <td>{income.description}</td>
                  <td>{income.paymentMethod || 'N/A'}</td>
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

// ExpenseManagement Component
function ExpenseManagement({ appId, tripId, members, expenses, isCaptain }) {
  const { db, showCustomModal } = useContext(FirebaseContext);
  const [paidByMemberId, setPaidByMemberId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [includedMemberIds, setIncludedMemberIds] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isAddingExpense, setIsAddingExpense] = useState(false);

  useEffect(() => {
    if (members.length > 0 && includedMemberIds.length === 0) {
      setIncludedMemberIds(members.map(m => m.id));
    } else if (members.length === 0) {
      setIncludedMemberIds([]);
    }
  }, [members, includedMemberIds.length]);

  const handleToggleInclude = (memberId) => {
    if (!isCaptain) {
      showCustomModal("You do not have permission to modify included members.");
      return;
    }
    setIncludedMemberIds(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!paidByMemberId || !amount || !description || !paymentMethod || includedMemberIds.length === 0 || !date) {
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
    if (!isCaptain) {
      showCustomModal("You do not have permission to add expenses.");
      return;
    }

    setIsAddingExpense(true);
    try {
      await addDoc(collection(db, `artifacts/${appId}/public/data/trips/${tripId}/expenses`), {
        paidByMemberId: paidByMemberId,
        amount: expenseAmount,
        description: description.trim(),
        paymentMethod: paymentMethod,
        includedMemberIds: includedMemberIds,
        date: date,
        createdAt: serverTimestamp(),
      });
      setPaidByMemberId('');
      setAmount('');
      setDescription('');
      setPaymentMethod('');
      setIncludedMemberIds(members.map(m => m.id));
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
    <div className="expense-management-container card">
      <h3 className="expense-management-heading">
        <CreditCard className="icon" size={22} /> Manage Expenses
      </h3>

      {!isCaptain && (
        <p className="no-members-message" style={{ marginBottom: '20px', color: '#e74c3c', fontWeight: '500' }}>
          Only the trip captain can add or modify expenses.
        </p>
      )}

      <form onSubmit={handleAddExpense} className="add-expense-form">
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="expensePaidBy">Paid By</label>
            <select
              id="expensePaidBy"
              value={paidByMemberId}
              onChange={(e) => setPaidByMemberId(e.target.value)}
              className="input-field"
              required
              disabled={!isCaptain}
            >
              <option value="">Select member who paid</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>{member.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="expenseAmount">Amount</label>
            <input
              type="number"
              id="expenseAmount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input-field"
              placeholder="e.g., 120.50"
              step="0.01"
              required
              disabled={!isCaptain}
            />
          </div>
          <div className="form-group">
            <label htmlFor="expenseDescription">Description</label>
            <input
              type="text"
              id="expenseDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field"
              placeholder="e.g., Dinner at restaurant"
              required
              disabled={!isCaptain}
            />
          </div>
          <div className="form-group">
            <label htmlFor="expensePaymentMethod">Payment Method</label>
            <select
              id="expensePaymentMethod"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="input-field"
              required
              disabled={!isCaptain}
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
            <label htmlFor="expenseDate">Date</label>
            <input
              type="date"
              id="expenseDate"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input-field"
              required
              disabled={!isCaptain}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-group-label">Included Members</label>
          {members.length === 0 ? (
            <p className="no-members-message">Please add members first to select who was included.</p>
          ) : (
            <div className="expense-included-members">
              {members.map((member) => (
                <label key={member.id} className="expense-included-member-label">
                  <input
                    type="checkbox"
                    value={member.id}
                    checked={includedMemberIds.includes(member.id)}
                    onChange={() => handleToggleInclude(member.id)}
                    disabled={!isCaptain}
                  />
                  <span>{member.name}</span>
                </label>
              ))}
            </div>
          )}
        </div>
        <div className="form-actions">
          <button
            type="submit"
            disabled={isAddingExpense || !isCaptain || members.length === 0 || includedMemberIds.length === 0}
            className="btn btn-danger add-expense-button"
          >
            {isAddingExpense ? 'Adding...' : 'Add Expense'}
          </button>
        </div>
      </form>

      {expenses.length === 0 ? (
        <p className="no-expenses-message">No expenses recorded yet.</p>
      ) : (
        <div className="table-wrapper">
          <table className="data-table expense-table">
            <thead>
              <tr>
                <th>S. No.</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Paid By</th>
                <th>Included</th>
                <th>Method</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense, index) => (
                <tr key={expense.id}>
                  <td>{index + 1}</td>
                  <td>{expense.description}</td>
                  <td className="balance-negative">-₹{expense.amount.toFixed(2)}</td>
                  <td>{getMemberName(expense.paidByMemberId)}</td>
                  <td>{expense.includedMemberIds.map(id => getMemberName(id)).join(', ')}</td>
                  <td>{expense.paymentMethod || 'N/A'}</td>
                  <td>{new Date(expense.date).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// SummaryAndStatements Component
function SummaryAndStatements({ appId, tripId, members, incomes, expenses, settlements, isCaptain }) {
  const getMemberName = useCallback((id) => {
    return members.find(m => m.id === id)?.name || 'Unknown Member';
  }, [members]);

  const { db, showCustomModal } = useContext(FirebaseContext);
  const [balances, setBalances] = useState([]);
  const [settlementSuggestions, setSettlementSuggestions] = useState([]);
  const [allTransactions, setAllTransactions] = useState([]);

  useEffect(() => {
    if (members.length === 0) {
      setBalances([]);
      setSettlementSuggestions([]);
      setAllTransactions([]);
      return;
    }

    const combinedTransactions = [
      ...incomes.map(item => ({
        ...item,
        type: 'income',
        displayAmount: `+₹${item.amount.toFixed(2)}`,
        payerOrReceiverId: item.memberId,
        involvedMembers: [item.memberId],
        sortTimestamp: item.createdAt?.toDate().getTime() || new Date(item.date).getTime(),
      })),
      ...expenses.map(item => ({
        ...item,
        type: 'expense',
        displayAmount: `-₹${item.amount.toFixed(2)}`,
        payerOrReceiverId: item.paidByMemberId,
        involvedMembers: item.includedMemberIds,
        sortTimestamp: item.createdAt?.toDate().getTime() || new Date(item.date).getTime(),
      })),
      ...settlements.map(item => ({
        ...item,
        type: 'settlement',
        description: `Settlement: ${getMemberName(item.fromId)} paid ${getMemberName(item.toId)}`,
        displayAmount: `-₹${item.amount.toFixed(2)} (Paid)`,
        payerOrReceiverId: item.fromId,
        involvedMembers: [item.fromId, item.toId],
        sortTimestamp: item.createdAt?.toDate().getTime() || new Date(item.date).getTime(),
      }))
    ].sort((a, b) => a.sortTimestamp - b.sortTimestamp);

    setAllTransactions(combinedTransactions);

    const calculateBalances = () => {
      const memberBalances = members.reduce((acc, member) => ({
        ...acc,
        [member.id]: {
          name: member.name,
          totalExplicitIncome: 0,
          totalPaidExpenses: 0,
          totalOwedShare: 0,
          netBalance: 0,
          totalContributions: 0,
          settlementPaid: 0,
          settlementReceived: 0,
        },
      }), {});

      incomes.forEach(income => {
        if (memberBalances[income.memberId]) {
          memberBalances[income.memberId].totalExplicitIncome += income.amount;
        }
      });

      expenses.forEach(expense => {
        const paidBy = expense.paidByMemberId;
        const amount = expense.amount;
        const includedMembers = expense.includedMemberIds;

        if (memberBalances[paidBy]) {
          memberBalances[paidBy].totalPaidExpenses += amount;
        }

        const sharePerPerson = includedMembers.length > 0 ? amount / includedMembers.length : 0;
        includedMembers.forEach(includedId => {
          if (memberBalances[includedId]) {
            memberBalances[includedId].totalOwedShare += sharePerPerson;
          }
        });
      });

      settlements.forEach(settlement => {
        const fromId = settlement.fromId;
        const toId = settlement.toId;
        const amount = settlement.amount;

        if (memberBalances[fromId]) {
          memberBalances[fromId].settlementPaid += amount;
        }
        if (memberBalances[toId]) {
          memberBalances[toId].settlementReceived += amount;
        }
      });

      const calculatedBalances = members.map(member => {
        const balance = memberBalances[member.id];
        balance.totalContributions = balance.totalExplicitIncome + balance.totalPaidExpenses;
        let preSettlementNet = balance.totalContributions - balance.totalOwedShare;
        balance.netBalance = preSettlementNet - balance.settlementReceived + balance.settlementPaid;
        return balance;
      });

      setBalances(calculatedBalances);
      calculateSettlementSuggestions(calculatedBalances);
    };

    const calculateSettlementSuggestions = (currentBalances) => {
      let netAmounts = currentBalances.map(member => ({
        id: members.find(m => m.name === member.name)?.id || member.id,
        name: member.name,
        amount: member.netBalance,
      })).filter(m => Math.abs(m.amount) > 0.01);

      let payers = netAmounts.filter(m => m.amount > 0).sort((a, b) => b.amount - a.amount);
      let receivers = netAmounts.filter(m => m.amount < 0).sort((a, b) => a.amount - b.amount);

      const suggestions = [];

      let i = 0;
      let j = 0;

      while (i < payers.length && j < receivers.length) {
        let payer = payers[i];
        let receiver = receivers[j];

        const amountToSettle = Math.min(payer.amount, Math.abs(receiver.amount));

        suggestions.push({
          from: receiver.name,
          fromId: receiver.id,
          to: payer.name,
          toId: payer.id,
          amount: amountToSettle.toFixed(2),
        });

        payer.amount -= amountToSettle;
        receiver.amount += amountToSettle;

        if (Math.abs(payer.amount) < 0.01) {
          i++;
        }
        if (Math.abs(receiver.amount) < 0.01) {
          j++;
        }
      }
      setSettlementSuggestions(suggestions);
    };

    calculateBalances();
  }, [members, incomes, expenses, settlements, getMemberName]);

  const handleMarkSettlementAsPaid = async (fromMemberId, toMemberId, amount, fromMemberName, toMemberName) => {
    if (!db || !isCaptain) {
      showCustomModal("Only the trip captain can mark settlements as paid.");
      return;
    }
    const settlementAmount = parseFloat(amount);
    if (isNaN(settlementAmount) || settlementAmount <= 0) {
      showCustomModal("Invalid settlement amount.");
      return;
    }

    try {
      await addDoc(collection(db, `artifacts/${appId}/public/data/trips/${tripId}/settlements`), {
        fromId: fromMemberId,
        toId: toMemberId,
        amount: settlementAmount,
        date: new Date().toISOString().split('T')[0],
        createdAt: serverTimestamp(),
        description: `Settlement from ${fromMemberName} to ${toMemberName}`,
      });
      showCustomModal(`Successfully recorded settlement from ${fromMemberName} to ${toMemberName}.`);
    } catch (e) {
      console.error("Error marking settlement as paid: ", e);
      showCustomModal(`Failed to mark settlement as paid: ${e.message}`);
    }
  };

  return (
    <div className="summary-container card">
      <h3 className="summary-heading">
        <ReceiptText className="icon" size={22} /> Trip Summary & Balances
      </h3>

      {members.length === 0 ? (
        <p className="no-summary-message">No members added yet. Add members, income, and expenses to see the summary.</p>
      ) : (
        <>
          <h4 className="summary-section-title">All Transactions</h4>
          {allTransactions.length === 0 ? (
            <p className="no-summary-message">No transactions recorded yet.</p>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>S. No.</th>
                    <th>Type</th>
                    <th>Description</th>
                    <th>Member(s)</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {allTransactions.map((transaction, index) => (
                    <tr key={transaction.id || index}>
                      <td>{index + 1}</td>
                      <td>
                        <span className={transaction.type === 'income' ? 'balance-positive' : (transaction.type === 'expense' ? 'balance-negative' : 'balance-neutral')}>
                          {transaction.type === 'income' ? 'Income' : (transaction.type === 'expense' ? 'Expense' : 'Settlement')}
                        </span>
                      </td>
                      <td>{transaction.description}</td>
                      <td>
                        {transaction.type === 'income'
                          ? getMemberName(transaction.payerOrReceiverId)
                          : transaction.type === 'expense'
                            ? `${getMemberName(transaction.payerOrReceiverId)} paid for ${transaction.involvedMembers.map(getMemberName).join(', ')}`
                            : `${getMemberName(transaction.fromId)} pays ${getMemberName(transaction.toId)}`
                        }
                      </td>
                      <td className={transaction.type === 'income' ? 'balance-positive' : 'balance-negative'}>
                        {transaction.type === 'settlement' ? `-₹${transaction.amount}` : transaction.displayAmount}
                      </td>
                      <td>{transaction.paymentMethod || 'N/A'}</td>
                      <td>{new Date(transaction.date).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <h4 className="summary-section-title">Individual Balances</h4>
          <div className="table-wrapper">
            <table className="data-table balance-table">
              <thead>
                <tr>
                  <th>S. No.</th>
                  <th>Member</th>
                  <th>Total Contributions</th>
                  <th>Their Share of Expenses</th>
                  <th>Net Balance</th>
                </tr>
              </thead>
              <tbody>
                {balances.map((balance, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>{balance.name}</td>
                    <td className="balance-positive">₹{balance.totalContributions.toFixed(2)}</td>
                    <td className="balance-negative">₹{balance.totalOwedShare.toFixed(2)}</td>
                    <td className={balance.netBalance >= 0 ? 'balance-positive' : 'balance-negative'}>
                      ₹{balance.netBalance.toFixed(2)} {balance.netBalance >= 0 ? '(Owed to them)' : '(Owes)'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h4 className="summary-section-title">Settlement Suggestions (Splitwise)</h4>
          {settlementSuggestions.length === 0 ? (
            <p className="no-summary-message">Everyone is settled!</p>
          ) : (
            <div className="table-wrapper">
              <table className="data-table settlement-table">
                <thead>
                  <tr>
                    <th>S. No.</th>
                    <th>Owes</th>
                    <th>Pays</th>
                    <th>Amount</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {settlementSuggestions.map((sug, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>{sug.from}</td>
                      <td>{sug.to}</td>
                      <td className="balance-negative">₹{sug.amount}</td>
                      <td>
                        <button
                          onClick={() => handleMarkSettlementAsPaid(
                            sug.fromId,
                            sug.toId,
                            parseFloat(sug.amount),
                            sug.from,
                            sug.to
                          )}
                          className="btn btn-success btn-small"
                          disabled={!isCaptain}
                        >
                          Mark as Settled
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default App;