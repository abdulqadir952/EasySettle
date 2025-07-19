
"use client";

import { useState } from "react";
import Link from "next/link";
import { v4 as uuidv4 } from 'uuid';
import {
  ArrowLeft, Users, Receipt, Scale, PlusCircle, Landmark, UserPlus, Trash2, Calendar, Phone, FileScan, Pencil, Eye, LineChart
} from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Trip, Member, Expense } from "@/lib/types";
import { formatCurrency, cn } from "@/lib/utils";
import { AddExpenseForm } from "./AddExpenseForm";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { BalanceSummary } from "./BalanceSummary";
import { VisualizeExpenses } from "./VisualizeExpenses";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";


type TripDashboardProps = {
  trip: Trip;
  onUpdateTrip: (tripId: string, updatedData: Partial<Trip>) => void;
};

export function TripDashboard({ trip, onUpdateTrip }: TripDashboardProps) {
  // Dialog states
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);
  const [viewingReceipt, setViewingReceipt] = useState<string | null>(null);
  const [viewingExpense, setViewingExpense] = useState<Expense | null>(null);


  // Entity states for editing/deleting
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [memberToEdit, setMemberToEdit] = useState<Member | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
  
  // Form states for adding/editing members
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberPhone, setNewMemberPhone] = useState("");
  
  const { toast } = useToast();
  const totalExpenses = trip.expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const getMemberName = (id: string) => trip.members.find(m => m.id === id)?.name || 'Unknown Member';
  

  // Expense Handlers
  const handleAddExpense = (newExpense: Expense) => {
    const updatedExpenses = [...trip.expenses, newExpense].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    onUpdateTrip(trip.id, { expenses: updatedExpenses });
    setIsExpenseDialogOpen(false);
  };

  const handleUpdateExpense = (updatedExpense: Expense) => {
    const updatedExpenses = trip.expenses.map(e => e.id === updatedExpense.id ? updatedExpense : e).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    onUpdateTrip(trip.id, { expenses: updatedExpenses });
    setIsExpenseDialogOpen(false);
    setExpenseToEdit(null);
  };
  
  const handleDeleteExpense = () => {
    if (!expenseToDelete) return;
    const updatedExpenses = trip.expenses.filter(e => e.id !== expenseToDelete.id);
    onUpdateTrip(trip.id, { expenses: updatedExpenses });
    setExpenseToDelete(null);
  };

  const handleToggleSettle = (expenseId: string, settled: boolean) => {
    const updatedExpenses = trip.expenses.map(e => e.id === expenseId ? { ...e, settled } : e);
    onUpdateTrip(trip.id, { expenses: updatedExpenses });
  };

  const openAddExpenseDialog = () => {
    setExpenseToEdit(null);
    setIsExpenseDialogOpen(true);
  };

  const openEditExpenseDialog = (expense: Expense) => {
    setExpenseToEdit(expense);
    setIsExpenseDialogOpen(true);
  };

  // Member Handlers
  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMemberName.trim()) {
        const newMember: Member = { id: uuidv4(), name: newMemberName.trim(), phone: newMemberPhone.trim() };
        const updatedMembers = [...trip.members, newMember];
        onUpdateTrip(trip.id, { members: updatedMembers });
        setIsAddMemberDialogOpen(false);
        setNewMemberName("");
        setNewMemberPhone("");
    }
  };

  const handleUpdateMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (memberToEdit && newMemberName.trim()) {
        const updatedMember: Member = { ...memberToEdit, name: newMemberName.trim(), phone: newMemberPhone.trim() };
        const updatedMembers = trip.members.map(m => m.id === memberToEdit.id ? updatedMember : m);
        onUpdateTrip(trip.id, { members: updatedMembers });
        setMemberToEdit(null);
    }
  };

  const handleDeleteMember = () => {
    if (!memberToDelete) return;
    const isMemberInvolved = trip.expenses.some(exp => 
        exp.paidBy === memberToDelete.id || exp.splitBetween.some(s => s.memberId === memberToDelete.id)
    );

    if (isMemberInvolved) {
        toast({ variant: "destructive", title: "Cannot Delete Member", description: "This member is part of an existing expense and cannot be removed." });
        setMemberToDelete(null);
        return;
    }
    const updatedMembers = trip.members.filter(m => m.id !== memberToDelete.id);
    onUpdateTrip(trip.id, { members: updatedMembers });
    setMemberToDelete(null);
  };

  const openEditMemberDialog = (member: Member) => {
    setMemberToEdit(member);
    setNewMemberName(member.name);
    setNewMemberPhone(member.phone || "");
  };
  
  return (
    <>
      {/* Dialogs and Alerts */}
      <Dialog open={!!viewingReceipt} onOpenChange={() => setViewingReceipt(null)}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] sm:max-w-3xl overflow-hidden">
          <DialogHeader>
            <DialogTitle>Receipt</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center p-2 sm:p-4 overflow-auto max-h-[calc(95vh-8rem)]">
            <img 
              src={viewingReceipt!} 
              alt="Receipt" 
              className="max-w-full h-auto rounded-md object-contain" 
            />
          </div>
        </DialogContent>
      </Dialog>
      
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

      <Dialog open={isExpenseDialogOpen} onOpenChange={(isOpen) => { if(!isOpen) setExpenseToEdit(null); setIsExpenseDialogOpen(isOpen); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{expenseToEdit ? 'Edit Expense' : 'Add a new expense'}</DialogTitle>
            <DialogDescription>{expenseToEdit ? 'Update the details of your expense.' : 'Record a new expense for your trip.'}</DialogDescription>
          </DialogHeader>
          <AddExpenseForm members={trip.members} onExpenseAdded={handleAddExpense} onExpenseUpdated={handleUpdateExpense} expenseToEdit={expenseToEdit} recentTitles={trip.expenses.slice(-5).map(e => e.title)} currency={trip.currency}/>
        </DialogContent>
      </Dialog>

       <AlertDialog open={!!expenseToDelete} onOpenChange={() => setExpenseToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete the expense "{expenseToDelete?.title}".</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDeleteExpense}>Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!memberToEdit} onOpenChange={(isOpen) => { if(!isOpen) setMemberToEdit(null); }}>
          <DialogContent className="sm:max-w-[425px]">
              <DialogHeader><DialogTitle>Edit Member</DialogTitle></DialogHeader>
              <form onSubmit={handleUpdateMember} className="space-y-4 py-4">
                  <Input value={newMemberName} onChange={(e) => setNewMemberName(e.target.value)} placeholder="Member's name" required />
                  <Input value={newMemberPhone} onChange={(e) => setNewMemberPhone(e.target.value)} placeholder="Phone number (optional)" type="tel" />
                  <Button type="submit" className="w-full">Update Member</Button>
              </form>
          </DialogContent>
      </Dialog>
      
      <AlertDialog open={!!memberToDelete} onOpenChange={() => setMemberToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <DialogTitle>Delete {memberToDelete?.name}?</DialogTitle>
                <AlertDialogDescription>Are you sure you want to remove this member? This cannot be undone if they are not involved in any expenses.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDeleteMember}>Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Button variant="ghost" asChild><Link href="/"><ArrowLeft className="mr-2 h-4 w-4" />Back to Trips</Link></Button>
            <div className="flex items-center space-x-3"><Landmark className="h-6 w-6 text-primary" /><h1 className="text-xl font-bold tracking-tight"></h1></div>
            <Button onClick={openAddExpenseDialog} disabled={trip.members.length === 0}><PlusCircle className="mr-2 h-2 w-2" />Add Expense</Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
          <Card className="mb-8">
            <CardHeader>
                <div>
                    <CardTitle>{trip.name}</CardTitle>
                    {trip.description && <CardDescription>{trip.description}</CardDescription>}
                </div>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-3 gap-4">
                <div className="flex items-center space-x-3"><Calendar className="w-5 h-5 text-muted-foreground"/><p className="text-sm">{(trip.startDate && trip.endDate) ? `${format(new Date(trip.startDate), "PPP")} - ${format(new Date(trip.endDate), "PPP")}` : 'No dates set'}</p></div>
                <div className="flex items-center space-x-3"><Users className="w-5 h-5 text-muted-foreground"/><p className="text-sm">{trip.members.length} Members</p></div>
                <div className="flex items-center space-x-3"><Receipt className="w-5 h-5 text-muted-foreground"/><p className="text-sm font-semibold text-primary">{formatCurrency(totalExpenses, trip.currency)} Total Expenses</p></div>
            </CardContent>
          </Card>

          <Tabs defaultValue="expenses">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="expenses"><Receipt className="mr-2 h-4 w-4" />Expenses</TabsTrigger>
              <TabsTrigger value="summary"><Scale className="mr-2 h-4 w-4" />Summary</TabsTrigger>
               <TabsTrigger value="visualize"><LineChart className="mr-2 h-4 w-4" />Visualize</TabsTrigger>
              <TabsTrigger value="members"><Users className="mr-2 h-4 w-4" />Members</TabsTrigger>
            </TabsList>
            <TabsContent value="expenses" className="mt-6">
              <Card>
                <CardHeader><CardTitle>All Expenses</CardTitle><CardDescription>A complete log of all recorded expenses for this trip.</CardDescription></CardHeader>
                <CardContent>
                  {trip.expenses.length > 0 ? (
                    <ul className="space-y-4">
                      {trip.expenses.map(expense => (
                        <li key={expense.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-secondary/50 rounded-lg gap-4">
                          <div className="flex-1">
                              <p className={cn("font-semibold", expense.settled && "line-through")}>{expense.title}</p>
                              <p className="text-sm text-muted-foreground">Paid by {getMemberName(expense.paidBy)}</p>
                          </div>
                          <div className="flex items-center flex-wrap justify-end gap-x-2 gap-y-4">
                            <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setViewingExpense(expense)}><Eye className="h-4 w-4 text-muted-foreground" /></Button>
                                {expense.receiptImageUrl && (<Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setViewingReceipt(expense.receiptImageUrl!)}><FileScan className="h-4 w-4 text-muted-foreground" /></Button>)}
                                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => openEditExpenseDialog(expense)}><Pencil className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-destructive/70 hover:text-destructive" onClick={() => setExpenseToDelete(expense)}><Trash2 className="h-4 w-4" /></Button>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id={`settle-${expense.id}`}
                                    checked={expense.settled}
                                    onCheckedChange={(checked) => handleToggleSettle(expense.id, checked)}
                                />
                                <Label htmlFor={`settle-${expense.id}`} className="text-sm font-medium">Settled</Label>
                            </div>
                            <div className="text-right w-28 shrink-0">
                                <p className={cn("font-bold text-lg text-primary truncate", expense.settled && "line-through")}>{formatCurrency(expense.amount, trip.currency)}</p>
                                <p className="text-xs text-muted-foreground">{format(new Date(expense.date), "PPP")}</p>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : ( <p className="text-muted-foreground text-center py-8">No expenses added yet.</p> )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="summary" className="mt-6">
                <BalanceSummary trip={trip} />
            </TabsContent>
             <TabsContent value="visualize" className="mt-6">
                <VisualizeExpenses trip={trip} />
            </TabsContent>
            <TabsContent value="members" className="mt-6">
               <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div><CardTitle>Trip Members</CardTitle><CardDescription>Everyone who is a part of this trip.</CardDescription></div>
                    <Dialog open={isAddMemberDialogOpen} onOpenChange={setIsAddMemberDialogOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" className="h-8 px-3 text-xs sm:h-9 sm:px-4 sm:text-sm" onClick={() => { setNewMemberName(''); setNewMemberPhone(''); }}>
                                <UserPlus className="h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" />
                                <span className="hidden sm:inline ml-1">Add Member</span>
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader><DialogTitle>Add New Member</DialogTitle></DialogHeader>
                            <form onSubmit={handleAddMember} className="space-y-4 py-4">
                                <Input value={newMemberName} onChange={(e) => setNewMemberName(e.target.value)} placeholder="Member's name" required />
                                <Input value={newMemberPhone} onChange={(e) => setNewMemberPhone(e.target.value)} placeholder="Phone number (optional)" type="tel" />
                                <Button type="submit" className="w-full">Add Member</Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                <CardContent>
                   {trip.members.length > 0 ? (
                    <ul className="space-y-3">
                        {trip.members.map(member => (
                        <li key={member.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                            <div>
                                <p className="font-medium">{member.name}</p>
                                {member.phone && <p className="text-sm text-muted-foreground flex items-center gap-2"><Phone className="w-3 h-3"/>{member.phone}</p>}
                            </div>
                             <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditMemberDialog(member)}><Pencil className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/70 hover:text-destructive" onClick={() => setMemberToDelete(member)}><Trash2 className="h-4 w-4" /></Button>
                            </div>
                        </li>
                        ))}
                    </ul>
                   ) : ( <p className="text-muted-foreground text-center py-8">No members added yet.</p> )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </>
  );
}
