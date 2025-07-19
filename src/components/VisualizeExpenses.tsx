
"use client";

import * as React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { format } from 'date-fns';

import type { Trip } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


type VisualizeExpensesProps = {
  trip: Trip;
};

type ChartType = 'contributionByMember' | 'spendingOverTime' | 'expensesByCategory';

const chartColors = [
    'hsl(var(--primary))',
    'hsl(var(--accent))',
    'hsl(240, 60%, 65%)',
    'hsl(180, 60%, 65%)',
    'hsl(300, 60%, 65%)',
    'hsl(var(--secondary))',
];

export function VisualizeExpenses({ trip }: VisualizeExpensesProps) {
  const [chartType, setChartType] = React.useState<ChartType>('contributionByMember');

  const getMemberName = (id: string) => trip.members.find(m => m.id === id)?.name || 'Unknown Member';

  const contributionByMemberData = React.useMemo(() => {
    const memberTotals: { [memberId: string]: number } = {};
    trip.members.forEach(m => memberTotals[m.id] = 0);

    trip.expenses.forEach(expense => {
      memberTotals[expense.paidBy] = (memberTotals[expense.paidBy] || 0) + expense.amount;
    });

    return trip.members.map(member => ({
        name: member.name,
        value: memberTotals[member.id] || 0,
    })).filter(item => item.value > 0);
  }, [trip]);

  const spendingOverTimeData = React.useMemo(() => {
    const dailyTotals: { [date: string]: number } = {};

    trip.expenses.forEach(expense => {
      const date = format(new Date(expense.date), 'yyyy-MM-dd');
      dailyTotals[date] = (dailyTotals[date] || 0) + expense.amount;
    });

    return Object.entries(dailyTotals)
      .map(([date, total]) => ({ date, total }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [trip]);

  const expensesByCategoryData = React.useMemo(() => {
    const categoryTotals: { [category: string]: number } = {};

    trip.expenses.forEach(expense => {
        // Simple categorization by title
        const category = expense.title;
        categoryTotals[category] = (categoryTotals[category] || 0) + expense.amount;
    });

    return Object.entries(categoryTotals)
      .map(([name, value]) => ({ name, value }))
      .sort((a,b) => b.value - a.value);
  }, [trip]);


  const renderChart = () => {
    if (trip.expenses.length === 0) {
      return <p className="text-muted-foreground text-center py-8">No expenses to visualize yet.</p>;
    }

    switch (chartType) {
      case 'contributionByMember':
        return (
          <>
            <CardHeader>
                <CardTitle>Contribution by Member</CardTitle>
                <CardDescription>A pie chart showing the total amount paid by each member.</CardDescription>
            </CardHeader>
            <CardContent>
              {contributionByMemberData.length > 0 ? (
                <ChartContainer config={{}} className="mx-auto aspect-square h-[300px]">
                  <PieChart>
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent
                          formatter={(value, name) => `${name}: ${formatCurrency(value as number, trip.currency)}`}
                          nameKey="name"
                          hideLabel 
                      />}
                    />
                    <Pie data={contributionByMemberData} dataKey="value" nameKey="name" innerRadius={60} strokeWidth={5} labelLine={false} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                      {contributionByMemberData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                      ))}
                    </Pie>
                    <Legend/>
                  </PieChart>
                </ChartContainer>
              ) : (
                <p className="text-muted-foreground text-center py-8">No spending to visualize yet.</p>
              )}
            </CardContent>
          </>
        );
      
      case 'expensesByCategory':
        return (
            <>
                <CardHeader>
                    <CardTitle>Expenses by Category</CardTitle>
                    <CardDescription>A pie chart showing the total amount spent in each category (based on expense title).</CardDescription>
                </CardHeader>
                <CardContent>
                {expensesByCategoryData.length > 0 ? (
                    <ChartContainer config={{}} className="mx-auto aspect-square h-[300px]">
                    <PieChart>
                        <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent
                            formatter={(value, name) => `${name}: ${formatCurrency(value as number, trip.currency)}`}
                            nameKey="name"
                            hideLabel 
                        />}
                        />
                        <Pie data={expensesByCategoryData} dataKey="value" nameKey="name" innerRadius={60} strokeWidth={5} labelLine={false} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                        {expensesByCategoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                        ))}
                        </Pie>
                        <Legend/>
                    </PieChart>
                    </ChartContainer>
                ) : (
                    <p className="text-muted-foreground text-center py-8">No spending to visualize yet.</p>
                )}
                </CardContent>
            </>
        );

      case 'spendingOverTime':
        return (
            <>
                <CardHeader>
                    <CardTitle>Spending Over Time</CardTitle>
                    <CardDescription>A bar chart showing total expenses per day.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={{}} className="h-[300px] w-full">
                        <BarChart data={spendingOverTimeData} margin={{ top: 20, right: 20, bottom: 5, left: 20 }}>
                            <XAxis
                                dataKey="date"
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                tickFormatter={(value) => format(new Date(value), "MMM d")}
                            />
                             <YAxis
                                tickFormatter={(value) => formatCurrency(value as number, trip.currency).replace(/\.00$/, '')}
                            />
                            <ChartTooltip
                                cursor={false}
                                content={<ChartTooltipContent
                                    formatter={(value) => formatCurrency(value as number, trip.currency)}
                                    labelFormatter={(label) => format(new Date(label), "PPP")}
                                />}
                            />
                            <Bar dataKey="total" fill={chartColors[0]} radius={4} />
                        </BarChart>
                    </ChartContainer>
                </CardContent>
            </>
        );
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
                <CardTitle>Expense Visualizations</CardTitle>
                <CardDescription>Analyze your trip's spending with different charts.</CardDescription>
            </div>
            <Select onValueChange={(value: ChartType) => setChartType(value)} defaultValue={chartType}>
              <SelectTrigger className="w-full sm:w-[240px]">
                <SelectValue placeholder="Select a chart type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="contributionByMember">Contribution by Member</SelectItem>
                <SelectItem value="spendingOverTime">Spending Over Time</SelectItem>
                <SelectItem value="expensesByCategory">Expenses by Category</SelectItem>
              </SelectContent>
            </Select>
        </div>
      </CardHeader>
      <CardContent>
         {renderChart()}
      </CardContent>
    </Card>
  );
}
