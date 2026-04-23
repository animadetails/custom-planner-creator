import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { generateAgendaPDF } from "@/lib/agenda-pdf";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { BookOpen, Download, Loader2 } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Agenda PDF — Crea tu agenda media carta" },
      {
        name: "description",
        content:
          "Genera una agenda en PDF tamaño media carta con portada, contraportada y una página por día con líneas para escribir.",
      },
    ],
  }),
});

const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

function Index() {
  const currentYear = new Date().getFullYear();
  const years = useMemo(
    () => Array.from({ length: 8 }, (_, i) => currentYear + i - 1),
    [currentYear],
  );

  const [title, setTitle] = useState("Mi Agenda");
  const [subtitle, setSubtitle] = useState("Planeación & Notas");
  const [authorName, setAuthorName] = useState("");
  const [startMonth, setStartMonth] = useState(3); // April
  const [startYear, setStartYear] = useState(currentYear);
  const [endMonth, setEndMonth] = useState(3);
  const [endYear, setEndYear] = useState(currentYear + 1);
  const [includeWeekends, setIncludeWeekends] = useState(true);
  const [loading, setLoading] = useState(false);

  const totalMonths = useMemo(() => {
    const diff = (endYear - startYear) * 12 + (endMonth - startMonth) + 1;
    return Math.max(0, diff);
  }, [startMonth, startYear, endMonth, endYear]);

  const handleGenerate = async () => {
    if (totalMonths <= 0) {
      toast.error("El rango de fechas no es válido");
      return;
    }
    setLoading(true);
    try {
      const blob = await generateAgendaPDF({
        title,
        subtitle,
        authorName,
        startMonth: new Date(startYear, startMonth, 1),
        endMonth: new Date(endYear, endMonth, 1),
        includeWeekends,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title.replace(/\s+/g, "_") || "agenda"}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Agenda generada correctamente");
    } catch (e) {
      console.error(e);
      toast.error("Ocurrió un error al generar el PDF");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster />
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            <span className="font-serif text-lg tracking-tight">Agenda Studio</span>
          </div>
          <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Media carta · 5.5 × 8.5 in
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12">
        <section className="mb-12 max-w-2xl">
          <p className="mb-3 text-xs uppercase tracking-[0.25em] text-muted-foreground">
            Generador de agenda en PDF
          </p>
          <h1 className="font-serif text-4xl leading-tight tracking-tight md:text-5xl">
            Diseña tu agenda personal y descárgala lista para imprimir.
          </h1>
          <p className="mt-4 text-muted-foreground">
            Elige el rango de meses, personaliza la portada y obtén un PDF con una
            página por día y líneas para escribir.
          </p>
        </section>

        <div className="grid gap-8 md:grid-cols-[1.1fr_1fr]">
          <Card className="border-border/80">
            <CardContent className="space-y-6 p-6">
              <div className="space-y-2">
                <Label htmlFor="title">Título de la agenda</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Mi Agenda"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subtitle">Subtítulo</Label>
                <Input
                  id="subtitle"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="Planeación & Notas"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="author">Nombre (opcional)</Label>
                <Input
                  id="author"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="Tu nombre"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Mes inicial</Label>
                  <Select
                    value={String(startMonth)}
                    onValueChange={(v) => setStartMonth(Number(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((m, i) => (
                        <SelectItem key={m} value={String(i)}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Año inicial</Label>
                  <Select
                    value={String(startYear)}
                    onValueChange={(v) => setStartYear(Number(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((y) => (
                        <SelectItem key={y} value={String(y)}>
                          {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Mes final</Label>
                  <Select
                    value={String(endMonth)}
                    onValueChange={(v) => setEndMonth(Number(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((m, i) => (
                        <SelectItem key={m} value={String(i)}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Año final</Label>
                  <Select
                    value={String(endYear)}
                    onValueChange={(v) => setEndYear(Number(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((y) => (
                        <SelectItem key={y} value={String(y)}>
                          {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-md border border-border p-3">
                <div>
                  <Label htmlFor="weekends" className="text-sm">
                    Incluir fines de semana
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Desactívalo para una agenda solo de lunes a viernes.
                  </p>
                </div>
                <Switch
                  id="weekends"
                  checked={includeWeekends}
                  onCheckedChange={setIncludeWeekends}
                />
              </div>

              <Button
                onClick={handleGenerate}
                disabled={loading || totalMonths <= 0}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generando…
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" /> Generar y descargar PDF
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card className="border-border/80 bg-card">
              <CardContent className="p-6">
                <p className="mb-4 text-xs uppercase tracking-[0.25em] text-muted-foreground">
                  Resumen
                </p>
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between border-b border-border pb-2">
                    <dt className="text-muted-foreground">Rango</dt>
                    <dd className="font-medium">
                      {MONTHS[startMonth]} {startYear} — {MONTHS[endMonth]} {endYear}
                    </dd>
                  </div>
                  <div className="flex justify-between border-b border-border pb-2">
                    <dt className="text-muted-foreground">Meses</dt>
                    <dd className="font-medium">{totalMonths}</dd>
                  </div>
                  <div className="flex justify-between border-b border-border pb-2">
                    <dt className="text-muted-foreground">Días por semana</dt>
                    <dd className="font-medium">{includeWeekends ? 7 : 5}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Tamaño página</dt>
                    <dd className="font-medium">5.5 × 8.5 in</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            <div className="aspect-[5.5/8.5] w-full overflow-hidden rounded-md border border-border bg-card p-6 shadow-sm">
              <div className="flex h-full flex-col items-center justify-between border border-foreground/80 p-4">
                <span className="font-serif text-xs italic">— Agenda —</span>
                <div className="text-center">
                  <h3 className="font-serif text-2xl font-bold leading-tight">
                    {title || "Mi Agenda"}
                  </h3>
                  {subtitle && (
                    <p className="mt-2 font-serif text-sm">{subtitle}</p>
                  )}
                </div>
                <div className="text-center">
                  <p className="font-serif text-[10px] italic uppercase tracking-[0.2em]">
                    {MONTHS[startMonth]} {startYear} — {MONTHS[endMonth]} {endYear}
                  </p>
                  {authorName && (
                    <p className="mt-1 font-serif text-xs">{authorName}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-5xl px-6 py-6 text-xs text-muted-foreground">
          Agenda Studio · Genera tu PDF lista para imprimir
        </div>
      </footer>
    </div>
  );
}
