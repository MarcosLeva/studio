"use client";

import { useApp } from "../store";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ScanResult } from "@/lib/types";

export default function ScannedResultsPage() {
  const { results } = useApp();

  const groupedResults = results.reduce((acc, result) => {
    (acc[result.category] = acc[result.category] || []).push(result);
    return acc;
  }, {} as Record<string, ScanResult[]>);

  const defaultAccordionValue = Object.keys(groupedResults)[0] || "";

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Resultados Escaneados</h1>
        <p className="text-muted-foreground">
          Revisa el análisis de tus catálogos escaneados previamente.
        </p>
      </div>
      
      {Object.keys(groupedResults).length > 0 ? (
        <Accordion type="single" collapsible defaultValue={defaultAccordionValue} className="w-full space-y-4">
          {Object.entries(groupedResults).map(([category, categoryResults]) => (
            <AccordionItem value={category} key={category} className="border-b-0">
               <Card>
                <AccordionTrigger className="p-6 text-xl font-headline hover:no-underline">
                  <div className="flex items-center gap-4">
                    {category}
                    <Badge variant="secondary">{categoryResults.length} escaneos</Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="p-0">
                    <div className="px-6 pb-6 space-y-4">
                        {categoryResults.map(result => (
                             <Card key={result.id} className="bg-background/50">
                                <CardHeader>
                                    <CardTitle>{result.catalogName}</CardTitle>
                                    <CardDescription>Escaneado el: {result.dateScanned}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{result.analysis}</p>
                                </CardContent>
                             </Card>
                        ))}
                    </div>
                </AccordionContent>
               </Card>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
         <Card className="flex flex-col items-center justify-center py-20">
            <CardHeader>
                <CardTitle className="text-2xl">Aún no hay resultados</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">
                    Realiza un análisis desde el panel de control para ver los resultados aquí.
                </p>
            </CardContent>
         </Card>
      )}
    </div>
  );
}
