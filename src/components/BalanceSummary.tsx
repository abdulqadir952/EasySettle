
"use client";

import type { Trip } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowRight, Download } from 'lucide-react';
import { Button } from './ui/button';
import { exportTripToExcel } from '@/lib/excel-export';


type BalanceSummaryProps = {
  trip: Trip;
};

const calculateBalances = (trip: Trip) => {
    if (trip.members.length === 0) {
        return { settlements: [], totalPaid: {} };
    }

    const balances: { [memberId: string]: number } = {};
    trip.members.forEach(m => balances[m.id] = 0);
    
    const totalPaid: { [memberId: string]: number } = {};
    trip.members.forEach(m => totalPaid[m.id] = 0);

    // Calculate total paid by each member (includes all expenses)
    trip.expenses.forEach(expense => {
        totalPaid[expense.paidBy] = (totalPaid[expense.paidBy] || 0) + expense.amount;
    });

    // Calculate balances for settlement (only unsettled expenses)
    const unsettledExpenses = trip.expenses.filter(e => !e.settled);

    unsettledExpenses.forEach(expense => {
        // Add to the balance of the person who paid
        balances[expense.paidBy] += expense.amount;

        const totalSplits = expense.splitBetween.length;
        if (totalSplits === 0) return;

        if (expense.splitType === 'equally') {
            const share = expense.amount / totalSplits;
            expense.splitBetween.forEach(split => {
                balances[split.memberId] -= share;
            });
        } 
        // Note: Custom split logic would go here if implemented
    });

    const owers = Object.entries(balances)
        .filter(([, balance]) => balance < -0.01) // Use tolerance
        .map(([memberId, amount]) => ({ memberId, amount }));

    const oweds = Object.entries(balances)
        .filter(([, balance]) => balance > 0.01) // Use tolerance
        .map(([memberId, amount]) => ({ memberId, amount }));
        
    const settlements: { from: string, to: string, amount: number }[] = [];

    while (owers.length > 0 && oweds.length > 0) {
        const ower = owers[0];
        const owed = oweds[0];
        const amountToSettle = Math.min(Math.abs(ower.amount), owed.amount);

        if (amountToSettle > 0.01) {
            settlements.push({
                from: ower.memberId,
                to: owed.memberId,
                amount: amountToSettle,
            });
        }

        ower.amount += amountToSettle;
        owed.amount -= amountToSettle;

        if (Math.abs(ower.amount) < 0.01) {
            owers.shift();
        }
        if (Math.abs(owed.amount) < 0.01) {
            oweds.shift();
        }
    }
    
    return { settlements, totalPaid };
};


export function BalanceSummary({ trip }: BalanceSummaryProps) {
    const { settlements, totalPaid } = calculateBalances(trip);
    const getMemberName = (id: string) => trip.members.find(m => m.id === id)?.name || 'Unknown Member';

    if (trip.members.length === 0) {
        return <p className="text-muted-foreground text-center py-8">Add members to see a summary.</p>;
    }

    if (trip.expenses.length === 0) {
        return <p className="text-muted-foreground text-center py-8">No expenses to summarize yet.</p>;
    }
    
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Who Paid What</CardTitle>
                    <CardDescription>Total amount paid by each member towards all expenses (including settled).</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Member</TableHead>
                                <TableHead className="text-right">Amount Paid</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {trip.members.map(member => (
                                <TableRow key={member.id}>
                                    <TableCell>{member.name}</TableCell>
                                    <TableCell className="text-right font-medium">{formatCurrency(totalPaid[member.id] || 0, trip.currency)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Settlements</CardTitle>
                            <CardDescription>The simplest way to settle all remaining debts.</CardDescription>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => exportTripToExcel(trip)} disabled={trip.expenses.length === 0}>
                            <Download className="mr-2 h-4 w-4" />
                            Export
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {settlements.length > 0 ? (
                        <ul className="space-y-3">
                            {settlements.map((s, index) => (
                                <li key={index} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg text-sm sm:text-base">
                                    <span className="font-medium text-left flex-1 truncate">{getMemberName(s.from)}</span>
                                    <div className="flex items-center gap-2 mx-2">
                                        <span className="text-muted-foreground text-xs">owes</span>
                                        <span className="font-bold text-primary whitespace-nowrap">{formatCurrency(s.amount, trip.currency)}</span>
                                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <span className="font-medium text-right flex-1 truncate">{getMemberName(s.to)}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-muted-foreground text-center py-8">
                            Everyone is settled up!
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
