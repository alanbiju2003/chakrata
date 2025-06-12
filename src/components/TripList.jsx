import React, { useState, useEffect, useContext } from 'react';
import { collection, addDoc, onSnapshot, serverTimestamp, query } from 'firebase/firestore';
import { PlusCircle } from 'lucide-react';
import { FirebaseContext } from '../App';
// import './TripList.css'; // All CSS is in index.css

// TripList Component
function TripList({ appId, setCurrentPage, setSelectedTrip }) {
  const { db, userId, showCustomModal } = useContext(FirebaseContext);
  const [trips, setTrips] = useState([]);
  const [newTripName, setNewTripName] = useState('');
  const [newTripDesc, setNewTripDesc] = useState('');
  const [isAddingTrip, setIsAddingTrip] = useState(false);

  useEffect(() => {
    if (!db || !userId) {
      console.log("TripList useEffect: DB or userId not available yet. DB:", db, "UserId:", userId);
      return;
    }
    console.log("TripList useEffect: Attempting to fetch trips with userId:", userId); // Added log

    const q = query(
      collection(db, `artifacts/${appId}/public/data/trips`),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tripsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTrips(tripsData);
      console.log("Trips fetched successfully:", tripsData.length, "trips."); // Added log
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
      showCustomModal("Database or User ID not available for creating trip."); // More specific message
      return;
    }

    setIsAddingTrip(true);
    try {
      const docRef = await addDoc(collection(db, `artifacts/${appId}/public/data/trips`), {
        name: newTripName.trim(),
        description: newTripDesc.trim(),
        ownerId: userId, // The creator is the owner/captain
        createdAt: serverTimestamp(),
      });
      setNewTripName('');
      setNewTripDesc('');
      showCustomModal(`Trip "${newTripName}" created successfully!`);
      console.log("Trip created with ID:", docRef.id); // Added log
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
          <PlusCircle size={24} /> Create a New Trip
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
              placeholder="e.g., European Adventure 2025"
              required
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
              placeholder="e.g., Paris, Rome, Berlin with friends"
            ></textarea>
          </div>
          <button
            type="submit"
            disabled={isAddingTrip}
            className="btn btn-primary trip-form-button"
          >
            {isAddingTrip ? 'Creating...' : (
              <>
                <PlusCircle size={20} /> Create Trip
              </>
            )}
          </button>
        </form>
      </div>

      {trips.length === 0 ? (
        <p className="no-trips-message">No trips found. Create one to get started!</p>
      ) : (
        <ul className="trip-list-grid">
          {trips.map((trip) => (
            <li
              key={trip.id}
              onClick={() => handleSelectTrip(trip)}
              className="trip-card"
            >
              <h4 className="trip-card-name">{trip.name}</h4>
              <p className="trip-card-description">{trip.description || 'No description provided.'}</p>
              <p className="trip-card-owner">Captain: {trip.ownerId === userId ? 'You' : trip.ownerId}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default TripList;
