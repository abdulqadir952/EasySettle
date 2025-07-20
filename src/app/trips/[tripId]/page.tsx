
"use client";

import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { TripDashboard } from '@/components/TripDashboard';
import { useTrips } from '@/hooks/useTrips';
import type { Trip } from '@/lib/types';


function TripPageContent() {
  const router = useRouter();
  const params = useParams();
  const tripId = params.tripId as string;
  const { trips, updateTrip, loading } = useTrips();
  
  const [trip, setTrip] = useState<Trip | null>(null);

  useEffect(() => {
    if (!loading && trips.length > 0) {
      const currentTrip = trips.find(t => t.id === tripId);
      if (currentTrip) {
        setTrip(currentTrip);
      } else {
        router.push('/');
      }
    }
  }, [tripId, trips, loading, router]);


  if (loading || !trip) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading trip data...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <TripDashboard
        trip={trip}
        onUpdateTrip={updateTrip}
      />
    </div>
  );
}


export default function TripPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
            <TripPageContent />
        </Suspense>
    )
}
