import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useCreateDonor, useUpdateDonor, getGetDonorTrendsQueryKey, getListDonorsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import type { Donor } from "@workspace/api-client-react";

const formSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().optional(),
  tier: z.enum(["major", "mid_level", "grassroots"]),
  totalGiven: z.coerce.number().min(0),
  lastGiftAmount: z.coerce.number().optional(),
  lastGiftDate: z.string().optional(),
  firstGiftDate: z.string().optional(),
  isRecurring: z.boolean(),
  notes: z.string().optional(),
});

export function DonorFormSheet({
  open,
  onOpenChange,
  donorToEdit
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  donorToEdit?: Donor | null;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createMutation = useCreateDonor();
  const updateMutation = useUpdateDonor();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      tier: "grassroots",
      totalGiven: 0,
      isRecurring: false,
      notes: "",
    },
  });

  useEffect(() => {
    if (donorToEdit) {
      form.reset({
        firstName: donorToEdit.firstName,
        lastName: donorToEdit.lastName,
        email: donorToEdit.email,
        phone: donorToEdit.phone || "",
        tier: donorToEdit.tier,
        totalGiven: donorToEdit.totalGiven,
        lastGiftAmount: donorToEdit.lastGiftAmount,
        lastGiftDate: donorToEdit.lastGiftDate,
        firstGiftDate: donorToEdit.firstGiftDate,
        isRecurring: donorToEdit.isRecurring,
        notes: donorToEdit.notes || "",
      });
    } else {
      form.reset({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        tier: "grassroots",
        totalGiven: 0,
        isRecurring: false,
        notes: "",
      });
    }
  }, [donorToEdit, form]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (donorToEdit) {
      updateMutation.mutate(
        { id: donorToEdit.id, data: values },
        {
          onSuccess: () => {
            toast({ title: "Donor updated successfully" });
            queryClient.invalidateQueries({ queryKey: getGetDonorTrendsQueryKey() });
            queryClient.invalidateQueries({ queryKey: getListDonorsQueryKey() });
            onOpenChange(false);
          },
          onError: () => toast({ title: "Failed to update donor", variant: "destructive" }),
        }
      );
    } else {
      createMutation.mutate(
        { data: values },
        {
          onSuccess: () => {
            toast({ title: "Donor added successfully" });
            queryClient.invalidateQueries({ queryKey: getGetDonorTrendsQueryKey() });
            queryClient.invalidateQueries({ queryKey: getListDonorsQueryKey() });
            onOpenChange(false);
            form.reset();
          },
          onError: () => toast({ title: "Failed to add donor", variant: "destructive" }),
        }
      );
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto w-[400px] sm:w-[540px]">
        <SheetHeader className="mb-6">
          <SheetTitle>{donorToEdit ? "Edit Donor" : "Add Donor"}</SheetTitle>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="firstName" render={({ field }) => (
                <FormItem><FormLabel>First Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="lastName" render={({ field }) => (
                <FormItem><FormLabel>Last Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>

            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
            )} />

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="tier" render={({ field }) => (
                <FormItem>
                  <FormLabel>Tier</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select tier" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="grassroots">Grassroots</SelectItem>
                      <SelectItem value="mid_level">Mid-level</SelectItem>
                      <SelectItem value="major">Major</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="totalGiven" render={({ field }) => (
              <FormItem><FormLabel>Total Given</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
            )} />

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="lastGiftAmount" render={({ field }) => (
                <FormItem><FormLabel>Last Gift Amount</FormLabel><FormControl><Input type="number" step="0.01" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="lastGiftDate" render={({ field }) => (
                <FormItem><FormLabel>Last Gift Date</FormLabel><FormControl><Input type="date" {...field} value={field.value ? field.value.split("T")[0] : ""} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>

            <FormField control={form.control} name="isRecurring" render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Recurring Donor</FormLabel>
                </div>
              </FormItem>
            )} />

            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem><FormLabel>Notes</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
            )} />

            <div className="flex justify-end pt-6 pb-12">
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : "Save Donor"}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
