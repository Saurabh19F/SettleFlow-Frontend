import { useEffect, useState } from "react";
import { CheckCircle2, CloudDownload, CloudUpload, FileDown, Loader2 } from "lucide-react";
import { tallyApi } from "../../api/services";
import PageHeader from "../../components/PageHeader";
import GlassCard from "../../components/GlassCard";

export default function TallySyncPage() {
  const [status, setStatus] = useState("Idle");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeSync, setActiveSync] = useState(null);
  const [importSummary, setImportSummary] = useState(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await tallyApi.status();
        const current = response?.data?.data;
        setStatus(current?.status || "Unknown");
        setMessage(current?.message || "");
      } catch (error) {
        setStatus("Disconnected");
        setMessage(error?.response?.data?.message || error?.message || "Unable to fetch Tally status.");
      }
    };
    fetchStatus();
  }, []);

  const runSync = async (direction) => {
    if (loading) {
      return;
    }
    setLoading(true);
    setActiveSync(direction);
    setMessage("");
    setStatus("Syncing");
    try {
      const response = direction === "import" ? await tallyApi.importInvoices() : await tallyApi.exportPayments();
      const syncData = response?.data?.data;
      const syncMessage = response?.data?.message || "Sync completed";
      if (direction === "import" && syncData && typeof syncData === "object") {
        setImportSummary(syncData);
      } else {
        setImportSummary(null);
      }
      const heartbeat = await tallyApi.status();
      const heartbeatData = heartbeat?.data?.data;
      setStatus(heartbeatData?.status || "Connected");
      setMessage(syncMessage);
    } catch (error) {
      setStatus("Failed");
      setImportSummary(null);
      setMessage(error?.response?.data?.message || error?.message || "Sync failed.");
    } finally {
      setLoading(false);
      setActiveSync(null);
    }
  };

  const downloadBlob = async (type) => {
    try {
      const response = type === "json" ? await tallyApi.exportLedgerJson() : await tallyApi.exportVouchersCsv();
      const mime = type === "json" ? "application/json" : "text/csv";
      const file = type === "json" ? "tally-ledger-export.json" : "tally-vouchers-export.csv";
      const blobUrl = window.URL.createObjectURL(new Blob([response.data], { type: mime }));
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = file;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
      setMessage(`${file} downloaded.`);
    } catch (error) {
      setMessage(error?.response?.data?.message || error?.message || "Download failed.");
    }
  };

  return (
    <div>
      <PageHeader title="TallyPrime Sync" description="XML sync on localhost:9000 with ledger/voucher export readiness." />
      <div className="grid gap-4 lg:grid-cols-2">
        <GlassCard title="Import Invoices" subtitle="Pull invoices from Tally">
          <button
            type="button"
            disabled={loading}
            onClick={() => runSync("import")}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 px-4 py-2 text-white disabled:opacity-60"
          >
            {loading && activeSync === "import" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CloudDownload className="h-4 w-4" />} Import from Tally
          </button>
        </GlassCard>

        <GlassCard title="Export Payments" subtitle="Push payment vouchers to Tally">
          <button
            type="button"
            disabled={loading}
            onClick={() => runSync("export")}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 px-4 py-2 text-white disabled:opacity-60"
          >
            {loading && activeSync === "export" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CloudUpload className="h-4 w-4" />} Export to Tally
          </button>
        </GlassCard>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <GlassCard title="Tally Export Files" subtitle="Download structured data for import tooling">
          <div className="space-y-2">
            <button
              onClick={() => downloadBlob("json")}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-indigo-500/40 bg-indigo-500/10 px-4 py-2 text-indigo-500"
            >
              <FileDown className="h-4 w-4" /> Export Ledger JSON
            </button>
            <button
              onClick={() => downloadBlob("csv")}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-cyan-500"
            >
              <FileDown className="h-4 w-4" /> Export Voucher CSV
            </button>
          </div>
        </GlassCard>

        <GlassCard title="Sync Status">
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span className="text-slate-700 dark:text-slate-200">Current: {status}</span>
          </div>
          {message && <p className="mt-3 text-sm text-slate-500 dark:text-slate-300">{message}</p>}
          {importSummary && (
            <div className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <p>Imported: <span className="font-semibold">{importSummary.importedCount ?? 0}</span></p>
              <p>Updated: <span className="font-semibold">{importSummary.updatedCount ?? 0}</span></p>
              <p>Skipped: <span className="font-semibold">{importSummary.skippedCount ?? 0}</span></p>
              <p>Source Report: <span className="font-semibold">{importSummary.sourceReportUsed || "Unknown"}</span></p>
              <p>Types Seen: <span className="font-semibold">{(importSummary.typesSeen || []).join(", ") || "None"}</span></p>
              {Object.keys(importSummary.skippedByReason || {}).length > 0 && (
                <div>
                  <p className="font-semibold">Skipped Reasons</p>
                  <ul className="mt-1 list-disc pl-5">
                    {Object.entries(importSummary.skippedByReason).map(([reason, count]) => (
                      <li key={reason}>{reason}: {count}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
