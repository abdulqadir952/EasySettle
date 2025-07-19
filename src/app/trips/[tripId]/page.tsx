
"use client";

import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { TripDashboard } from '@/components/TripDashboard';
import type { Trip } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';


function TripPageContent() {
  const router = useRouter();
  const params = useParams();
  const tripId = params.tripId as string;
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
        // If user is not logged in, we shouldn't be here.
        // But maybe they are on a share link and got here by mistake.
        setLoading(false);
        return;
    }
    if (tripId) {
        const fetchTrip = async () => {
            setLoading(true);
            const tripDocRef = doc(db, 'trips', tripId);
            try {
                const tripSnap = await getDoc(tripDocRef);
                if (tripSnap.exists() && tripSnap.data().ownerId === user.uid) {
                    setTrip({ id: tripSnap.id, ...tripSnap.data() } as Trip);
                } else {
                    toast({variant: 'destructive', title: 'Error', description: 'Trip not found or you do not have permission to view it.'});
                    router.push('/');
                }
            } catch (error) {
                console.error("Error fetching trip:", error);
                toast({variant: 'destructive', title: 'Error', description: 'Could not fetch trip data.'});
                router.push('/');
            } finally {
                setLoading(false);
            }
        };
        fetchTrip();
    }
  }, [tripId, user, router, toast]);

  const handleUpdateTrip = async (updatedData: Partial<Trip>) => {
    if (!trip) return;
    const tripDocRef = doc(db, 'trips', trip.id);
    try {
        await updateDoc(tripDocRef, updatedData);
        setTrip(prev => prev ? { ...prev, ...updatedData } : null);
    } catch(error) {
        console.error("Failed to update trip in Firestore", error);
        toast({variant: 'destructive', title: 'Error', description: 'Failed to save changes.'});
    }
  };

  if (loading || !trip) {
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


export default function TripPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
            <TripPageContent />
        </Suspense>
    )
}
