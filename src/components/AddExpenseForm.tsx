"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { v4 as uuidv4 } from 'uuid';
import { useState, useEffect, useCallback } from "react";
import { Calendar as CalendarIcon, Wand2 } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import type { Member, Expense } from "@/lib/types";
import { suggestExpenseTitles } from "@/ai/flows/suggest-expense-titles";
import { cn } from "@/lib/utils";


const formSchema = z.object({
  title: z.string().min(2, "Title is too short."),
  amount: z.coerce.number().positive("Amount must be positive."),
  paidBy: z.string().min(1, "You must select who paid."),
  date: z.date().optional(),
  splitType: z.enum(["equally", "custom"]),
  splitBetween: z.array(z.string()).min(1, "Expense must be split with at least one member."),
  customSplits: z.record(z.coerce.number()).optional(),
  receiptImage: z.any().optional(),
  settled: z.boolean().default(false),
}).refine(data => {
  if (data.splitType === 'custom') {
    const totalCustom = Object.values(data.customSplits ?? {}).reduce((sum, val) => sum + (val || 0), 0);
    // Use a small tolerance for floating point comparisons
    return Math.abs(totalCustom - data.amount) < 0.01;
  }
  return true;
}, {
  message: "Custom split amounts must add up to the total expense amount.",
  path: ["customSplits"],
});

type AddExpenseFormProps = {
  members: Member[];
  onExpenseAdded: (newExpense: Expense) => void;
  onExpenseUpdated: (updatedExpense: Expense) => void;
  expenseToEdit?: Expense | null;
  recentTitles: string[];
  currency: string;
};

export function AddExpenseForm({ members, onExpenseAdded, onExpenseUpdated, expenseToEdit, recentTitles, currency }: AddExpenseFormProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const isEditMode = !!expenseToEdit;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      amount: 0,
      date: undefined,
      splitType: "equally",
      splitBetween: members.map(m => m.id),
      customSplits: {},
      receiptImage: undefined,
      settled: false,
    },
  });

  useEffect(() => {
    if (expenseToEdit) {
      form.reset({
        title: expenseToEdit.title,
        amount: expenseToEdit.amount,
        paidBy: expenseToEdit.paidBy,
        date: expenseToEdit.date ? new Date(expenseToEdit.date) : new Date(),
        splitType: expenseToEdit.splitType,
        splitBetween: expenseToEdit.splitBetween.map(s => s.memberId),
        settled: expenseToEdit.settled,
        // customSplits not handled in this version
        receiptImage: undefined,
      });
    } else {
        form.reset({
            title: "",
            amount: 0,
            paidBy: undefined,
            date: new Date(),
            splitType: "equally",
            splitBetween: members.map(m => m.id),
            customSplits: {},
            receiptImage: undefined,
            settled: false,
        });
    }
  }, [expenseToEdit, form, members]);

  const watchedTitle = useWatch({ control: form.control, name: 'title' });
  const watchedAmount = useWatch({ control: form.control, name: 'amount' });

  const fetchSuggestions = useCallback(async () => {
    if (!watchedTitle || !watchedAmount || watchedAmount <= 0) {
      setSuggestions([]);
      return;
    }
    setIsSuggesting(true);
    try {
      const result = await suggestExpenseTitles({
        userInput: watchedTitle,
        transactionAmount: watchedAmount,
        recentTitles: recentTitles,
      });
      setSuggestions(result.suggestions);
    } catch (error) {
      console.error("Failed to get suggestions:", error);
      setSuggestions([]);
    } finally {
      setIsSuggesting(false);
    }
  }, [watchedTitle, watchedAmount, recentTitles]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchSuggestions();
    }, 500);
    return () => clearTimeout(debounce);
  }, [fetchSuggestions]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    let receiptImageUrl: string | undefined;

    if (values.receiptImage && values.receiptImage.length > 0) {
        const file = values.receiptImage[0];
        receiptImageUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                resolve(reader.result as string);
            };
            reader.readAsDataURL(file);
        });
    }

    if (isEditMode) {
        const updatedExpense: Expense = {
            ...expenseToEdit,
            title: values.title,
            amount: values.amount,
            paidBy: values.paidBy,
            date: (values.date ?? new Date()).toISOString(),
            splitType: values.splitType,
            splitBetween: values.splitBetween.map(memberId => ({
                memberId,
                share: values.splitType === 'custom' ? values.customSplits?.[memberId] : undefined,
            })),
            receiptImageUrl: receiptImageUrl || expenseToEdit.receiptImageUrl || "",
            settled: values.settled,
        };
        onExpenseUpdated(updatedExpense);
    } else {
        const newExpense: Expense = {
          id: uuidv4(),
          title: values.title,
          amount: values.amount,
          paidBy: values.paidBy,
          splitType: values.splitType,
          splitBetween: values.splitBetween.map(memberId => ({
            memberId,
            share: values.splitType === 'custom' ? values.customSplits?.[memberId] : undefined,
          })),
          date: (values.date ?? new Date()).toISOString(),
          receiptImageUrl: receiptImageUrl || "",
          settled: values.settled,
        };
        onExpenseAdded(newExpense);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Lunch, Petrol" {...field} />
              </FormControl>
               {isSuggesting && <p className="text-sm text-muted-foreground animate-pulse">Getting suggestions...</p>}
               {suggestions.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {suggestions.map((s) => (
                    <Button
                      key={s}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => form.setValue("title", s, { shouldValidate: true })}
                      className="bg-accent/20 hover:bg-accent/40 border-accent/50"
                    >
                      <Wand2 className="w-3 h-3 mr-2" />
                      {s}
                    </Button>
                  ))}
                </div>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount ({currency})</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="0.00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                  <FormItem className="flex flex-col sm:col-span-2">
                      <FormLabel>Date</FormLabel>
                      <Popover>
                          <PopoverTrigger asChild>
                              <Button
                                  variant={"outline"}
                                  className={cn(
                                      "justify-start text-left font-normal w-full",
                                      !field.value && "text-muted-foreground"
                                  )}
                              >
                                  <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                                  <span className="truncate">
                                    {field.value ? format(field.value, "PPP") : "Pick a date"}
                                  </span>
                              </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                              <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  initialFocus
                              />
                          </PopoverContent>
                      </Popover>
                      <FormMessage />
                  </FormItem>
              )}
          />
        </div>
        
        <FormField
            control={form.control}
            name="paidBy"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Paid by</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select who paid" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {members.map(member => (
                      <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />


        <FormField
          control={form.control}
          name="splitBetween"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel className="text-base">Split between</FormLabel>
                <FormDescription>
                  Select the members to split this expense with.
                </FormDescription>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {members.map((item) => (
                  <FormField
                    key={item.id}
                    control={form.control}
                    name="splitBetween"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={item.id}
                          className="flex flex-row items-start space-x-3 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(item.id)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...(field.value || []), item.id])
                                  : field.onChange(
                                      field.value?.filter(
                                        (value) => value !== item.id
                                      )
                                    )
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">
                            {item.name}
                          </FormLabel>
                        </FormItem>
                      )
                    }}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
            control={form.control}
            name="receiptImage"
            render={({ field }) => (
            <FormItem>
                <FormLabel>Receipt (Optional)</FormLabel>
                <FormControl>
                    <Input
                        type="file"
                        accept="image/*"
                        onBlur={field.onBlur}
                        name={field.name}
                        onChange={(e) => field.onChange(e.target.files)}
                        ref={field.ref}
                    />
                </FormControl>
                 <FormDescription>
                    Upload a picture of the bill or receipt.
                </FormDescription>
                <FormMessage />
            </FormItem>
            )}
        />


        <Button type="submit" className="w-full">
          {isEditMode ? "Update Expense" : "Add Expense"}
        </Button>
      </form>
    </Form>
  );
}
