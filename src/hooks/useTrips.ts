
"use client";

import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Trip } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from './use-toast';

export function useTrips() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [trips, setTrips] = useState<Trip[]>([]);
    const [loading, setLoading] = useState(true);

    const tripsCollectionRef = collection(db, "trips");

    const fetchTrips = useCallback(async () => {
        if (!user) {
            setTrips([]);
            setLoading(false);
            return;
        };
        setLoading(true);
        try {
            const q = query(tripsCollectionRef, where("ownerId", "==", user.uid));
            const querySnapshot = await getDocs(q);
            const tripsData = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Trip[];
            setTrips(tripsData);
        } catch (error) {
            console.error("Error fetching trips: ", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch your trips.' });
        } finally {
            setLoading(false);
        }
    }, [user, toast]);

    useEffect(() => {
        fetchTrips();
    }, [fetchTrips]);

    const addTrip = async (newTripData: Omit<Trip, 'id' | 'ownerId'>) => {
        if (!user) return;
        try {
            const docRef = await addDoc(tripsCollectionRef, { ...newTripData, ownerId: user.uid });
            const newTrip = { ...newTripData, ownerId: user.uid, id: docRef.id };
            setTrips(prev => [...prev, newTrip]);
            return newTrip;
        } catch (error) {
            console.error("Error adding trip: ", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not create the trip.' });
            return null;
        }
    };
    
    const updateTrip = async (tripId: string, updatedData: Partial<Trip>) => {
        const tripDocRef = doc(db, "trips", tripId);
        try {
            await updateDoc(tripDocRef, updatedData);
            setTrips(prev => prev.map(t => t.id === tripId ? { ...t, ...updatedData } : t));
        } catch (error) {
            console.error("Error updating trip: ", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not update the trip.' });
        }
    };

    const deleteTrip = async (tripId: string) => {
        const tripDocRef = doc(db, "trips", tripId);
        try {
            await deleteDoc(tripDocRef);
            setTrips(prev => prev.filter(t => t.id !== tripId));
        } catch (error) {
            console.error("Error deleting trip: ", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not delete the trip.' });
        }
    };

    return { trips, loading, addTrip, updateTrip, deleteTrip, refetchTrips: fetchTrips };
}
