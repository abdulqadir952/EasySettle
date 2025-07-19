
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Trip } from '@/lib/types';
import { useToast } from './use-toast';

const TRIPS_STORAGE_KEY = 'settleasy-trips';

export function useTrips() {
    const { toast } = useToast();
    const [trips, setTrips] = useState<Trip[]>([]);
    const [loading, setLoading] = useState(true);

    const getTripsFromStorage = useCallback(() => {
        setLoading(true);
        try {
            const storedTrips = localStorage.getItem(TRIPS_STORAGE_KEY);
            if (storedTrips) {
                setTrips(JSON.parse(storedTrips));
            }
        } catch (error) {
            console.error("Error fetching trips from localStorage: ", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not load your trips from storage.' });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        getTripsFromStorage();
    }, [getTripsFromStorage]);

    const saveTripsToStorage = (updatedTrips: Trip[]) => {
        try {
            localStorage.setItem(TRIPS_STORAGE_KEY, JSON.stringify(updatedTrips));
            setTrips(updatedTrips);
        } catch (error) {
            console.error("Error saving trips to localStorage: ", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not save your trip changes.' });
        }
    };
    
    const addTrip = (newTrip: Trip) => {
        const updatedTrips = [...trips, newTrip];
        saveTripsToStorage(updatedTrips);
        return newTrip;
    };
    
    const updateTrip = (tripId: string, updatedData: Partial<Trip>) => {
        const updatedTrips = trips.map(t => t.id === tripId ? { ...t, ...updatedData } : t)
        saveTripsToStorage(updatedTrips);
    };

    const deleteTrip = (tripId: string) => {
        const updatedTrips = trips.filter(t => t.id !== tripId);
        saveTripsToStorage(updatedTrips);
    };

    return { trips, loading, addTrip, updateTrip, deleteTrip, refetchTrips: getTripsFromStorage };
}
