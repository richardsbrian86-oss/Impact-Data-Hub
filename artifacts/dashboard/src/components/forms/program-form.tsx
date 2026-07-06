import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useCreateProgram, useUpdateProgram, getGetProgramOutcomesQueryKey, getListProgramsQueryKey, getGetDashboardSummaryQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import type { Program } from "@workspace/api-client-react";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  category: z.string().min(1, "Category is required"),
  status: z.enum(["active", "paused", "completed"]),
  annualBudget: z.coerce.number().min(0),
  peopleServedTarget: z.coerce.number().min(0),
  peopleServedActual: z.coerce.number().min(0),
  outcomesTarget: z.coerce.number().min(0),
  outcomesActual: z.coerce.number().min(0),
  costPerOutcome: z.coerce.number().optional(),
});

export function ProgramFormDialog({
  open,
  onOpenChange,
  programToEdit
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  programToEdit?: Program | null;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createMutation = useCreateProgram();
  const updateMutation = useUpdateProgram();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "",
      status: "active",
      annualBudget: 0,
      peopleServedTarget: 0,
      peopleServedActual: 0,
      outcomesTarget: 0,
      outcomesActual: 0,
    },
  });

  useEffect(() => {
    if (programToEdit) {
      form.reset({
        name: programToEdit.name,
        description: programToEdit.description,
        category: programToEdit.category,
        status: programToEdit.status,
        annualBudget: programToEdit.annualBudget,
        peopleServedTarget: programToEdit.peopleServedTarget,
        peopleServedActual: programToEdit.peopleServedActual,
        outcomesTarget: programToEdit.outcomesTarget,
        outcomesActual: programToEdit.outcomesActual,
        costPerOutcome: programToEdit.costPerOutcome,
      });
    } else {
      form.reset({
        name: "",
        description: "",
        category: "",
        status: "active",
        annualBudget: 0,
        peopleServedTarget: 0,
        peopleServedActual: 0,
        outcomesTarget: 0,
        outcomesActual: 0,
      });
    }
  }, [programToEdit, form]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (programToEdit) {
      updateMutation.mutate(
        { id: programToEdit.id, data: values },
        {
          onSuccess: () => {
            toast({ title: "Program updated successfully" });
            queryClient.invalidateQueries({ queryKey: getGetProgramOutcomesQueryKey() });
            queryClient.invalidateQueries({ queryKey: getListProgramsQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
            onOpenChange(false);
          },
          onError: () => toast({ title: "Failed to update program", variant: "destructive" }),
        }
      );
    } else {
      createMutation.mutate(
        { data: values },
        {
          onSuccess: () => {
            toast({ title: "Program added successfully" });
            queryClient.invalidateQueries({ queryKey: getGetProgramOutcomesQueryKey() });
            queryClient.invalidateQueries({ queryKey: getListProgramsQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
            onOpenChange(false);
            form.reset();
          },
          onError: () => toast({ title: "Failed to add program", variant: "destructive" }),
        }
      );
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{programToEdit ? "Edit Program" : "Add Program"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Program Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="category" render={({ field }) => (
                <FormItem><FormLabel>Category</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>

            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
            )} />

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="paused">Paused</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="annualBudget" render={({ field }) => (
                <FormItem><FormLabel>Annual Budget</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-border pt-4 mt-4">
              <FormField control={form.control} name="peopleServedTarget" render={({ field }) => (
                <FormItem><FormLabel>People Served (Target)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="peopleServedActual" render={({ field }) => (
                <FormItem><FormLabel>People Served (Actual)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="outcomesTarget" render={({ field }) => (
                <FormItem><FormLabel>Outcomes (Target)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="outcomesActual" render={({ field }) => (
                <FormItem><FormLabel>Outcomes (Actual)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : "Save Program"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
