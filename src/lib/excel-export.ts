import * as XLSX from 'xlsx';
import type { Trip } from './types';
import { format } from 'date-fns';

const calculateBalances = (trip: Trip) => {
    if (trip.members.length === 0) {
        return { settlements: [], totalPaid: {} };
    }

    const balances: { [memberId: string]: number } = {};
    trip.members.forEach(m => balances[m.id] = 0);
    
    const totalPaid: { [memberId: string]: number } = {};
    trip.members.forEach(m => totalPaid[m.id] = 0);

    trip.expenses.forEach(expense => {
        balances[expense.paidBy] += expense.amount;
        totalPaid[expense.paidBy] = (totalPaid[expense.paidBy] || 0) + expense.amount;

        const totalSplits = expense.splitBetween.length;
        if (totalSplits === 0) return;

        if (expense.splitType === 'equally') {
            const share = expense.amount / totalSplits;
            expense.splitBetween.forEach(split => {
                balances[split.memberId] -= share;
            });
        } 
    });

    const owers = Object.entries(balances)
        .filter(([, balance]) => balance < -0.01)
        .map(([memberId, amount]) => ({ memberId, amount }));

    const oweds = Object.entries(balances)
        .filter(([, balance]) => balance > 0.01)
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


export const exportTripToExcel = (trip: Trip) => {
    const getMemberName = (id: string) => trip.members.find(m => m.id === id)?.name || 'Unknown Member';
    const { settlements, totalPaid } = calculateBalances(trip);

    const currencyFormat = `"${trip.currency}" #,##0.00`;

    // Define a professional blue header style
    const headerStyle = {
      fill: { fgColor: { rgb: "FF5B9BD5" } }, // A pleasant, professional blue
      font: { color: { rgb: "FFFFFFFF" }, bold: true },
      alignment: { horizontal: "center", vertical: "center" }
    };
    
    // Helper to apply the style to the header row of a worksheet
    const applyHeaderStyle = (worksheet: XLSX.WorkSheet) => {
        if (!worksheet['!ref']) return;
        const range = XLSX.utils.decode_range(worksheet['!ref']);
        for (let C = range.s.c; C <= range.e.c; ++C) {
            const address = XLSX.utils.encode_cell({ r: 0, c: C });
            if (worksheet[address]) {
                worksheet[address].s = headerStyle;
            }
        }
    };


    // 1. Worksheet: Payments Summary
    const paymentsSummaryData = trip.members.map(member => ({
        'Member': member.name,
        'Total Paid': totalPaid[member.id] || 0,
    }));
    const paymentsSheet = XLSX.utils.json_to_sheet(paymentsSummaryData);
    paymentsSheet['!cols'] = [{ wch: 25 }, { wch: 15 }];
    paymentsSummaryData.forEach((_, index) => {
        const cellRef = `B${index + 2}`;
        if (paymentsSheet[cellRef]) {
            paymentsSheet[cellRef].t = 'n';
            paymentsSheet[cellRef].z = currencyFormat;
        }
    });
    applyHeaderStyle(paymentsSheet);

    // 2. Worksheet: Individual Expenses
    const expensesData = trip.expenses.map(expense => ({
        'Date': format(new Date(expense.date), 'yyyy-MM-dd'),
        'Title': expense.title,
        'Paid By': getMemberName(expense.paidBy),
        'Amount': expense.amount,
        'Split Between': expense.splitBetween.map(s => getMemberName(s.memberId)).join(', '),
    }));
    const expensesSheet = XLSX.utils.json_to_sheet(expensesData);
    expensesSheet['!cols'] = [{ wch: 12 }, { wch: 30 }, { wch: 20 }, { wch: 15 }, { wch: 40 }];
    expensesData.forEach((_, index) => {
        const cellRef = `D${index + 2}`;
         if (expensesSheet[cellRef]) {
            expensesSheet[cellRef].t = 'n';
            expensesSheet[cellRef].z = currencyFormat;
        }
    });
    applyHeaderStyle(expensesSheet);

    // 3. Worksheet: Settlement Plan
    const settlementData = settlements.length > 0
        ? settlements.map(s => ({
            'Who Owes': getMemberName(s.from),
            'Amount': s.amount,
            'Who Gets Paid': getMemberName(s.to),
        }))
        : [{ 'Who Owes': 'Everyone is settled up!', 'Amount': '', 'Who Gets Paid': '' }];
    
    const settlementSheet = XLSX.utils.json_to_sheet(settlementData);
    settlementSheet['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 25 }];
    if (settlements.length > 0) {
        settlementData.forEach((_, index) => {
             const cellRef = `B${index + 2}`;
             if (settlementSheet[cellRef]) {
                settlementSheet[cellRef].t = 'n';
                settlementSheet[cellRef].z = currencyFormat;
            }
        });
    }
    applyHeaderStyle(settlementSheet);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, paymentsSheet, 'Payments Summary');
    XLSX.utils.book_append_sheet(wb, expensesSheet, 'All Expenses');
    XLSX.utils.book_append_sheet(wb, settlementSheet, 'Settlement Plan');

    XLSX.writeFile(wb, `${trip.name.replace(/ /g, '_')}_summary.xlsx`);
};
