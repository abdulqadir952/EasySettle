
"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { Trip, Member, Expense } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BalanceSummary } from '@/components/BalanceSummary';
import { Landmark, Users, Receipt, Calendar, Phone, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';


export default function SharePage() {
  const router = useRouter();
  const params = useParams();
  const tripId = params.tripId as string;
  
  const [trip, setTrip] = useState<Trip | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [viewingExpense, setViewingExpense] = useState<Expense | null>(null);

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
            setTrip(null);
          }
        }
      } catch (error) {
        console.error("Failed to parse trips from localStorage", error);
        setTrip(null);
      }
    }
  }, [tripId]);

  const totalExpenses = trip?.expenses.reduce((sum, exp) => sum + exp.amount, 0) || 0;
  const getMemberName = (id: string) => trip?.members.find(m => m.id === id)?.name || 'Unknown Member';

  if (!isClient) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-secondary">
        <p>Loading...</p>
      </div>
    );
  }

  if (!trip) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-secondary p-4 text-center">
            <Card className="max-w-md w-full">
                <CardHeader>
                    <CardTitle className="text-2xl">Trip Not Found</CardTitle>
                    <CardDescription>
                        The trip you are looking for does not exist or the link is invalid.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild>
                        <Link href="/">Go to Homepage</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
  }

  return (
    <>
    <Dialog open={!!viewingExpense} onOpenChange={() => setViewingExpense(null)}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>{viewingExpense?.title}</DialogTitle>
                <DialogDescription>
                    Expense details (read-only)
                </DialogDescription>
            </DialogHeader>
            {viewingExpense && (
                <div className="space-y-4 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Amount:</span>
                        <span className="font-medium">{formatCurrency(viewingExpense.amount, trip.currency)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Date:</span>
                        <span className="font-medium">{format(new Date(viewingExpense.date), "PPP")}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Paid by:</span>
                        <span className="font-medium">{getMemberName(viewingExpense.paidBy)}</span>
                    </div>
                    <div>
                        <span className="text-muted-foreground">Split between:</span>
                        <ul className="list-disc list-inside mt-1">
                            {viewingExpense.splitBetween.map(s => (
                                <li key={s.memberId} className="ml-4">{getMemberName(s.memberId)}</li>
                            ))}
                        </ul>
                    </div>
                     {viewingExpense.receiptImageUrl && (
                        <div>
                           <span className="text-muted-foreground">Receipt:</span>
                           <img src={viewingExpense.receiptImageUrl} alt="Receipt" className="mt-2 rounded-md border max-h-60 w-full object-contain" />
                        </div>
                    )}
                </div>
            )}
        </DialogContent>
      </Dialog>
      <div className="min-h-screen bg-secondary">
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center h-16">
              <div className="flex items-center space-x-3">
                <Landmark className="h-8 w-8 text-primary" />
                <h1 className="text-2xl font-bold tracking-tight">Settleasy</h1>
              </div>
            </div>
          </div>
        </header>
        <main className="container mx-auto p-4 sm:p-6 lg:p-8">
          <Card className="mb-8">
            <CardHeader>
                <CardTitle className="text-2xl sm:text-3xl">{trip.name}</CardTitle>
                {trip.description && <CardDescription className="pt-1">{trip.description}</CardDescription>}
            </CardHeader>
            <CardContent className="grid sm:grid-cols-3 gap-4">
                <div className="flex items-center space-x-3"><Calendar className="w-5 h-5 text-muted-foreground"/><p className="text-sm">{(trip.startDate && trip.endDate) ? `${format(new Date(trip.startDate), "PPP")} - ${format(new Date(trip.endDate), "PPP")}` : 'No dates set'}</p></div>
                <div className="flex items-center space-x-3"><Users className="w-5 h-5 text-muted-foreground"/><p className="text-sm">{trip.members.length} Members</p></div>
                <div className="flex items-center space-x-3"><Receipt className="w-5 h-5 text-muted-foreground"/><p className="text-sm font-semibold text-primary">{formatCurrency(totalExpenses, trip.currency)} Total Expenses</p></div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                  <Card>
                    <CardHeader>
                        <CardTitle>All Expenses</CardTitle>
                        <CardDescription>A read-only log of all recorded expenses.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {trip.expenses.length > 0 ? (
                        <ul className="space-y-4">
                          {trip.expenses.map(expense => (
                            <li key={expense.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-secondary/50 rounded-lg gap-3">
                              <div className="flex-1">
                                  <p className={cn("font-semibold", expense.settled && "line-through")}>{expense.title}</p>
                                  <p className="text-sm text-muted-foreground">Paid by {getMemberName(expense.paidBy)}</p>
                              </div>
                              <div className="flex items-center justify-between gap-4">
                                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setViewingExpense(expense)}>
                                  <Eye className="h-4 w-4 text-muted-foreground" />
                                </Button>
                                <div className="text-right w-24">
                                    <p className={cn("font-bold text-lg text-primary truncate", expense.settled && "line-through")}>{formatCurrency(expense.amount, trip.currency)}</p>
                                    <p className="text-sm text-muted-foreground">{format(new Date(expense.date), "PPP")}</p>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : ( <p className="text-muted-foreground text-center py-8">No expenses added yet.</p> )}
                    </CardContent>
                  </Card>
                  <BalanceSummary trip={trip} />
              </div>
              <div>
                  <Card>
                      <CardHeader>
                          <CardTitle>Trip Members</CardTitle>
                          <CardDescription>Everyone who is a part of this trip.</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {trip.members.length > 0 ? (
                          <ul className="space-y-3">
                              {trip.members.map((member: Member) => (
                              <li key={member.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                                  <div>
                                      <p className="font-medium">{member.name}</p>
                                      {member.phone && <p className="text-sm text-muted-foreground flex items-center gap-2"><Phone className="w-3 h-3"/>{member.phone}</p>}
                                  </div>
                              </li>
                              ))}
                          </ul>
                        ) : ( <p className="text-muted-foreground text-center py-8">No members added yet.</p> )}
                      </CardContent>
                  </Card>
              </div>
          </div>
        </main>
        <footer className="text-center p-4 text-sm text-muted-foreground">
          <p>This is a read-only summary. To make changes, please contact the trip organizer.</p>
        </footer>
      </div>
    </>
  );
}
