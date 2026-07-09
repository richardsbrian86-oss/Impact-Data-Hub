import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateOrgProfile, getGetOrgProfileQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import type { OrgProfile } from "@workspace/api-client-react";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  mission: z.string().min(1, "Mission is required"),
  founded: z.coerce.number().min(1800).max(new Date().getFullYear()),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  website: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  annualBudget: z.coerce.number().min(0),
  fiscalYearStart: z.string().min(1, "Fiscal year start is required"),
  programPct: z.coerce.number().min(0).max(100),
  adminPct: z.coerce.number().min(0).max(100),
  fundraisingPct: z.coerce.number().min(0).max(100),
}).refine(
  (data) => data.programPct + data.adminPct + data.fundraisingPct === 100,
  {
    message: "Program + Admin + Fundraising must sum to exactly 100%",
    path: ["fundraisingPct"],
  }
);

export function OrgProfileFormDialog({
  open,
  onOpenChange,
  profile
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile?: OrgProfile | null;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const updateMutation = useUpdateOrgProfile();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      mission: "",
      founded: new Date().getFullYear(),
      city: "",
      state: "",
      website: "",
      annualBudget: 0,
      fiscalYearStart: "",
      programPct: 78,
      adminPct: 14,
      fundraisingPct: 8,
    },
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        name: profile.name,
        mission: profile.mission,
        founded: profile.founded,
        city: profile.city,
        state: profile.state,
        website: profile.website || "",
        annualBudget: profile.annualBudget,
        fiscalYearStart: profile.fiscalYearStart,
        programPct: profile.programPct,
        adminPct: profile.adminPct,
        fundraisingPct: profile.fundraisingPct,
      });
    }
  }, [profile, form]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    updateMutation.mutate(
      { data: values },
      {
        onSuccess: () => {
          toast({ title: "Organization profile updated successfully" });
          queryClient.invalidateQueries({ queryKey: getGetOrgProfileQueryKey() });
          onOpenChange(false);
        },
        onError: () => toast({ title: "Failed to update profile", variant: "destructive" }),
      }
    );
  };

  const watchedPcts = form.watch(["programPct", "adminPct", "fundraisingPct"]);
  const pctSum = (Number(watchedPcts[0]) || 0) + (Number(watchedPcts[1]) || 0) + (Number(watchedPcts[2]) || 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Organization Settings</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem><FormLabel>Organization Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            
            <FormField control={form.control} name="mission" render={({ field }) => (
              <FormItem><FormLabel>Mission Statement</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
            )} />

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="founded" render={({ field }) => (
                <FormItem><FormLabel>Year Founded</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="website" render={({ field }) => (
                <FormItem><FormLabel>Website</FormLabel><FormControl><Input type="url" placeholder="https://" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="city" render={({ field }) => (
                <FormItem><FormLabel>City</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="state" render={({ field }) => (
                <FormItem><FormLabel>State</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="annualBudget" render={({ field }) => (
                <FormItem><FormLabel>Annual Budget</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="fiscalYearStart" render={({ field }) => (
                <FormItem><FormLabel>Fiscal Year Start (MM-DD)</FormLabel><FormControl><Input placeholder="07-01" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>

            <div className="border border-border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Budget Allocation Split</p>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${pctSum === 100 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
                  Total: {pctSum}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Must sum to exactly 100%. Used for budget allocation and cost trend charts.</p>
              <div className="grid grid-cols-3 gap-3">
                <FormField control={form.control} name="programPct" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Program %</FormLabel>
                    <FormControl><Input type="number" min={0} max={100} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="adminPct" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Admin %</FormLabel>
                    <FormControl><Input type="number" min={0} max={100} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="fundraisingPct" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fundraising %</FormLabel>
                    <FormControl><Input type="number" min={0} max={100} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Saving..." : "Save Profile"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
