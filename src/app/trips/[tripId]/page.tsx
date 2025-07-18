"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { TripDashboard } from '@/components/TripDashboard';
import type { Trip } from '@/lib/types';

export default function TripPage() {
  const router = useRouter();
  const params = useParams();
  const tripId = params.tripId as string;
  
  const [trip, setTrip] = useState<Trip | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (typeof window !== 'undefined' && tripId) {
      try {
        const storedTrips = localStorage.getItem("settleasy-trips");
        if (storedTrips) {
          const trips: Trip[] = JSON.parse(storedTrips);
          const currentTrip = trips.find(t => t.id === tripId);
          if (currentTrip) {
            setTrip(currentTrip);
          } else {
            router.push('/'); 
          }
        }
      } catch (error) {
        console.error("Failed to parse trips from localStorage", error);
        router.push('/');
      }
    }
  }, [tripId, router]);

  const handleUpdateTrip = (updatedTrip: Trip) => {
    setTrip(updatedTrip);
    if (typeof window !== 'undefined') {
      try {
        const storedTrips = localStorage.getItem("settleasy-trips");
        if (storedTrips) {
            const trips: Trip[] = JSON.parse(storedTrips);
            const tripIndex = trips.findIndex(t => t.id === updatedTrip.id);
            if (tripIndex !== -1) {
                trips[tripIndex] = updatedTrip;
                localStorage.setItem("settleasy-trips", JSON.stringify(trips));
            }
        }
      } catch (error) {
        console.error("Failed to update trip in localStorage", error);
      }
    }
  };

  if (!isClient || !trip) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading trip data...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <TripDashboard
        trip={trip}
        onUpdateTrip={handleUpdateTrip}
      />
    </div>
  );
}
