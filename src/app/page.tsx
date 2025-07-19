
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle, Landmark, Trash2, Pencil, LogOut } from "lucide-react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signInWithPopup, signOut } from "firebase/auth";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { CreateTripForm } from "@/components/CreateTripForm";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";

import type { Trip } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { auth, googleProvider } from "@/lib/firebase";
import { useTrips } from "@/hooks/useTrips";

const editTripSchema = z.object({
  name: z.string().min(2, {
    message: "Trip name must be at least 2 characters.",
  }),
  description: z.string().optional(),
});


export default function Home() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [tripToEdit, setTripToEdit] = useState<Trip | null>(null);
  const [tripToDelete, setTripToDelete] = useState<Trip | null>(null);
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const { trips, loading, addTrip, updateTrip, deleteTrip } = useTrips();

  const editForm = useForm<z.infer<typeof editTripSchema>>({
    resolver: zodResolver(editTripSchema),
  });

  useEffect(() => {
    if (tripToEdit) {
      editForm.reset({
        name: tripToEdit.name,
        description: tripToEdit.description || "",
      });
    }
  }, [tripToEdit, editForm]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Error during sign-in:", error);
      toast({ variant: 'destructive', title: "Login Failed", description: "Could not sign in with Google." });
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };


  const handleTripCreated = async (newTripData: Omit<Trip, 'id' | 'ownerId'>) => {
    const newTrip = await addTrip(newTripData);
    if (newTrip) {
      setIsCreateDialogOpen(false);
      router.push(`/trips/${newTrip.id}`);
    }
  };

  const handleTripUpdated = async (values: z.infer<typeof editTripSchema>) => {
    if (!tripToEdit) return;
    await updateTrip(tripToEdit.id, { name: values.name, description: values.description });
    setIsEditDialogOpen(false);
    setTripToEdit(null);
    toast({ title: "Success", description: "Trip details have been updated." });
  }

  const handleDeleteTrip = async (tripId: string) => {
    await deleteTrip(tripId);
    setTripToDelete(null);
  };

  const totalExpenses = (trip: Trip) => trip.expenses.reduce((sum, exp) => sum + exp.amount, 0);
  
  if (!user) {
    return (
       <div className="flex flex-col items-center justify-center min-h-screen bg-background">
          <Card className="max-w-sm w-full p-6 text-center">
            <CardHeader>
              <div className="flex justify-center items-center mb-4">
                <Landmark className="h-12 w-12 text-primary" />
              </div>
              <CardTitle className="text-3xl">Welcome to Settleasy</CardTitle>
              <CardDescription>
                Track and settle shared expenses for your trips with ease. Sign in to get started.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleLogin} className="w-full">
                <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 23.4 172.9 61.9l-76.2 64.5C308.6 102.3 282.7 92 248.4 92c-88.8 0-160.1 72.1-160.1 162.2s71.3 162.2 160.1 162.2c101.8 0 138-70.5 143.3-106.6H248.4v-81.8h239.6c2.5 12.7 3.9 26.1 3.9 40.8z"></path></svg>
                Sign in with Google
              </Button>
            </CardContent>
          </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Landmark className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold tracking-tight">Settleasy</h1>
            </div>
            <div className="flex items-center gap-2">
                <ThemeToggle />
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                    <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    New Trip
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                    <DialogTitle>Create a new trip</DialogTitle>
                    <DialogDescription>
                        Tell us about your next adventure.
                    </DialogDescription>
                    </DialogHeader>
                    <CreateTripForm onTripCreated={handleTripCreated} />
                </DialogContent>
                </Dialog>
                <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
                  <LogOut className="h-5 w-5" />
                </Button>
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1 container mx-auto p-4 sm:p-6 lg:p-8">
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Trip</DialogTitle>
              <DialogDescription>Update the name and description for your trip.</DialogDescription>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(handleTripUpdated)} className="space-y-4 py-4">
                <FormField
                  control={editForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Trip Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Goa Getaway" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="A short description of your trip" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full">Update Trip</Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!tripToDelete} onOpenChange={() => setTripToDelete(null)}>
          <AlertDialogContent onClick={(e) => e.stopPropagation()}>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the trip "{tripToDelete?.name}" and all its data. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => tripToDelete && handleDeleteTrip(tripToDelete.id)}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader>
                            <Skeleton className="h-6 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-10 w-full" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        ) : trips.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {trips.map((trip) => (
              <Card
                key={trip.id}
                className="hover:shadow-lg transition-shadow duration-300 cursor-pointer flex flex-col"
                onClick={() => router.push(`/trips/${trip.id}`)}
              >
                <CardHeader className="flex-grow">
                   <div className="flex justify-between items-start">
                      <div className="flex-1 pr-4">
                        <CardTitle className="flex items-center gap-2">
                           {trip.name}
                        </CardTitle>
                        {trip.description && (
                            <CardDescription className="mt-2 text-sm text-muted-foreground line-clamp-2">
                                {trip.description}
                            </CardDescription>
                        )}
                      </div>
                      <div className="flex items-center">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            onClick={(e) => {
                                e.stopPropagation();
                                setTripToEdit(trip);
                                setIsEditDialogOpen(true);
                            }}
                        >
                            <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            onClick={(e) => {
                                e.stopPropagation();
                                setTripToDelete(trip);
                            }}
                        >
                            <Trash2 className="h-4 w-4 text-destructive/70 hover:text-destructive" />
                        </Button>
                      </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-baseline">
                    <p className="text-lg font-bold text-primary">
                        {formatCurrency(totalExpenses(trip), trip.currency)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                        {trip.members.length} member{trip.members.length !== 1 && 's'}
                    </p>
                  </div>

                  {(trip.startDate || trip.endDate) && (
                    <p className="text-xs text-muted-foreground mt-3 pt-3 border-t">
                        {trip.startDate && format(new Date(trip.startDate), "MMM d, yyyy")}
                        {(trip.startDate && trip.endDate) && ' - '}
                        {trip.endDate && format(new Date(trip.endDate), "MMM d, yyyy")}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm mt-16">
            <div className="flex flex-col items-center gap-2 text-center p-8">
              <h2 className="text-2xl font-bold tracking-tight">
                You have no trips
              </h2>
              <p className="text-muted-foreground max-w-sm">
                Get started by creating a new trip to track your group expenses.
              </p>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                   <Button className="mt-4">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create New Trip
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create a new trip</DialogTitle>
                    <DialogDescription>
                       Tell us about your next adventure.
                    </DialogDescription>
                  </DialogHeader>
                  <CreateTripForm onTripCreated={handleTripCreated} />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
