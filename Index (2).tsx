import { useState, useMemo, useCallback } from "react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import FileUpload from "@/components/dashboard/FileUpload";
import KPICards from "@/components/dashboard/KPICards";
import ChartSection from "@/components/dashboard/ChartSection";
import InsightsPanel from "@/components/dashboard/InsightsPanel";
import AlertsPanel from "@/components/dashboard/AlertsPanel";
import FiltersBar from "@/components/dashboard/FiltersBar";
import { DataRow, mockData, parseCSV, computeKPIs, generateInsights, detectAlerts } from "@/lib/mockData";
import { toast } from "sonner";

const Index = () => {
  const [rawData, setRawData] = useState<DataRow[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"manager" | "analyst">("manager");
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState("all");
  const [generated, setGenerated] = useState(false);

  const handleFileUpload = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseCSV(text);
      setRawData(parsed);
      setFileName(file.name);
      setGenerated(false);
      toast.success(`Loaded ${parsed.length} rows from ${file.name}`);
    };
    reader.readAsText(file);
  }, []);

  const handleUseMock = useCallback(() => {
    setRawData(mockData);
    setFileName("sample_data.csv");
    setGenerated(false);
    toast.success("Sample dataset loaded");
  }, []);

  const handleClear = useCallback(() => {
    setRawData([]);
    setFileName(null);
    setGenerated(false);
    setSelectedRegion("all");
    setSelectedProduct("all");
  }, []);

  const filteredData = useMemo(() => {
    let d = rawData;
    if (selectedRegion !== "all") d = d.filter(r => r.region === selectedRegion);
    if (selectedProduct !== "all") d = d.filter(r => r.product === selectedProduct);
    return d;
  }, [rawData, selectedRegion, selectedProduct]);

  const regions = useMemo(() => [...new Set(rawData.map(d => d.region).filter(Boolean))], [rawData]);
  const products = useMemo(() => [...new Set(rawData.map(d => d.product).filter(Boolean))], [rawData]);
  const kpis = useMemo(() => computeKPIs(filteredData), [filteredData]);
  const insights = useMemo(() => generateInsights(filteredData), [filteredData]);
  const alerts = useMemo(() => detectAlerts(filteredData), [filteredData]);

  const handleGenerate = () => {
    if (!rawData.length) {
      toast.error("Please upload a dataset first");
      return;
    }
    setGenerated(true);
    toast.success("Dashboard generated with AI insights!");
  };

  const showDashboard = generated && filteredData.length > 0;

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      <DashboardHeader viewMode={viewMode} onViewChange={setViewMode} />

      <div className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1">
            <FileUpload
              fileName={fileName}
              dataPreview={rawData}
              onFileUpload={handleFileUpload}
              onClear={handleClear}
              onUseMock={handleUseMock}
            />
          </div>
          <div className="lg:col-span-2">
            <FiltersBar
              regions={regions}
              products={products}
              selectedRegion={selectedRegion}
              selectedProduct={selectedProduct}
              onRegionChange={setSelectedRegion}
              onProductChange={setSelectedProduct}
              onGenerate={handleGenerate}
            />
          </div>
        </div>

        {showDashboard && (
          <div className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
            <KPICards {...kpis} />

            <ChartSection data={filteredData} />

            <div className={`grid gap-4 ${viewMode === "analyst" ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"}`}>
              <InsightsPanel insights={insights} />
              {viewMode === "analyst" && <AlertsPanel alerts={alerts} />}
            </div>

            {viewMode === "manager" && alerts.length > 0 && (
              <AlertsPanel alerts={alerts.slice(0, 2)} />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
