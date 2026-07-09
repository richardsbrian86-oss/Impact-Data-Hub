import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetProgramOutcomes, useListPrograms } from "@workspace/api-client-react";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Pencil, Plus } from "lucide-react";
import { useState } from "react";
import { ProgramFormDialog } from "../forms/program-form";
import { Progress } from "@/components/ui/progress";
import type { Program } from "@workspace/api-client-react";

export function ProgramOutcomes({ isDark }: { isDark: boolean }) {
  const outcomesQuery = useGetProgramOutcomes();
  const programsQuery = useListPrograms();
  const [formOpen, setFormOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);

  const loading = outcomesQuery.isLoading || outcomesQuery.isFetching || programsQuery.isLoading || programsQuery.isFetching;
  const outcomes = outcomesQuery.data || [];
  const fullPrograms = programsQuery.data || [];

  const handleEdit = (id: number) => {
    const prog = fullPrograms.find(p => p.id === id);
    if (prog) {
      setSelectedProgram(prog);
      setFormOpen(true);
    }
  };

  const handleAdd = () => {
    setSelectedProgram(null);
    setFormOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight">Program Outcomes</h2>
        <Button onClick={handleAdd} size="sm" className="h-8 gap-1">
          <Plus className="w-4 h-4" />
          Add Program
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <>
            <Skeleton className="h-[250px] w-full" />
            <Skeleton className="h-[250px] w-full" />
          </>
        ) : outcomes.length > 0 ? (
          outcomes.map((prog) => (
            <Card key={prog.id} className="relative overflow-hidden group">
              <CardHeader className="px-5 pt-5 pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg font-bold">{prog.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-0.5">{prog.category} &bull; <span className="capitalize">{prog.status}</span></p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-muted-foreground hover:text-foreground -mr-2"
                    onClick={() => handleEdit(prog.id)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="px-5 pb-5 space-y-5">
                <div>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium text-foreground">People Served</span>
                    <span className="text-muted-foreground">
                      {prog.peopleServedActual.toLocaleString()} / {prog.peopleServedTarget.toLocaleString()}
                    </span>
                  </div>
                  <Progress value={prog.peopleServedPct} className="h-2" />
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium text-foreground">Outcomes Achieved</span>
                    <span className="text-muted-foreground">
                      {prog.outcomesActual.toLocaleString()} / {prog.outcomesTarget.toLocaleString()}
                    </span>
                  </div>
                  <Progress value={prog.outcomesPct} className="h-2" />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/50">
                  <div>
                    <p className="text-xs text-muted-foreground">Annual Budget</p>
                    <p className="font-semibold">{formatCurrency(prog.annualBudget)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Cost per Outcome</p>
                    <p className="font-semibold">{prog.costPerOutcome ? formatCurrency(prog.costPerOutcome) : "N/A"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full h-[200px] flex items-center justify-center text-muted-foreground border border-dashed border-border rounded-lg bg-card/50">
            No active programs to display.
          </div>
        )}
      </div>

      <ProgramFormDialog open={formOpen} onOpenChange={setFormOpen} programToEdit={selectedProgram} />
    </div>
  );
}
