/*
 * MedNexus_Intelligence — frontend dashboard
 * Copyright © 2026 Ayush Anand. All rights reserved.
 */

"use client";

import { useEffect, useRef, useState } from "react";
import FileUpload from "@/components/FileUpload";
import Loader from "@/components/Loader";
import ProgressBar from "@/components/ProgressBar";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [fileId, setFileId] = useState<string | null>(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const uploadIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const parseApiError = async (response: Response, fallback: string) => {
    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      try {
        const payload = await response.json();
        if (typeof payload?.detail === "string" && payload.detail.trim()) {
          return payload.detail;
        }
        if (Array.isArray(payload?.detail)) {
          return payload.detail
            .map((item: any) => item?.msg || item?.message || String(item))
            .join("; ");
        }
        if (typeof payload?.message === "string" && payload.message.trim()) {
          return payload.message;
        }
      } catch {
        // fall through
      }
    }

    return response.statusText ? `${fallback}: ${response.statusText}` : fallback;
  };

  useEffect(() => {
    return () => {
      if (uploadIntervalRef.current) {
        clearInterval(uploadIntervalRef.current);
      }
    };
  }, []);

  const handleFileSelect = (file: File | null) => {
    if (uploadIntervalRef.current) {
      clearInterval(uploadIntervalRef.current);
      uploadIntervalRef.current = null;
    }

    setSelectedFile(file);
    setUploadProgress(0);
    setIsUploading(false);
    setUploadComplete(false);
    setIsAnalyzing(false);
    setAnalysisComplete(false);
    setFileId(null);
    setPdfPreviewUrl(null);
    setError(null);
  };

  const handleDownload = async () => {
    if (!fileId) {
      setError("No analyzed report found to download.");
      return;
    }

    try {
      setError(null);
      const downloadUrl = `${API_BASE_URL}/api/report/pdf?file_id=${encodeURIComponent(fileId)}&_ts=${Date.now()}`;
      window.location.assign(downloadUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed");
    }
  };

  const startUpload = async () => {
    if (!selectedFile || isUploading || uploadComplete) {
      return;
    }

    setUploadProgress(0);
    setIsUploading(true);
    setUploadComplete(false);
    setAnalysisComplete(false);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch(`${API_BASE_URL}/api/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const message = await parseApiError(response, "Upload failed");
        throw new Error(message);
      }

      const data = await response.json();
      setFileId(data.file_id);
      setUploadProgress(100);
      setIsUploading(false);
      setUploadComplete(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setIsUploading(false);
      setUploadComplete(false);
    }
  };

  const analyzeReport = async () => {
    if (!uploadComplete || isAnalyzing || !fileId) {
      return;
    }

    setIsAnalyzing(true);
    setAnalysisComplete(false);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/process`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ file_id: fileId }),
      });

      if (!response.ok) {
        const message = await parseApiError(response, "Analysis failed");
        throw new Error(message);
      }

      await response.json();

      const previewUrl = `${API_BASE_URL}/api/report/pdf?file_id=${encodeURIComponent(fileId)}&inline=true&_ts=${Date.now()}`;
      setPdfPreviewUrl(previewUrl);
      setIsAnalyzing(false);
      setAnalysisComplete(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
      setIsAnalyzing(false);
    }
  };

  const resetAll = () => {
    if (uploadIntervalRef.current) {
      clearInterval(uploadIntervalRef.current);
      uploadIntervalRef.current = null;
    }

    setSelectedFile(null);
    setUploadProgress(0);
    setIsUploading(false);
    setUploadComplete(false);
    setIsAnalyzing(false);
    setAnalysisComplete(false);
    setFileId(null);
    setPdfPreviewUrl(null);
    setError(null);
  };

  const canAnalyze = uploadComplete && !isAnalyzing;
  const hasActiveState =
    Boolean(selectedFile) ||
    uploadProgress > 0 ||
    uploadComplete ||
    isUploading ||
    isAnalyzing ||
    analysisComplete;

  const workflowSteps = [
    "Upload secure PDF",
    "AI interprets key findings",
    "Download patient-friendly summary",
  ];

  const trustMetrics = [
    { label: "Average review time", value: "< 60 sec" },
    { label: "Structured sections", value: "12+" },
    { label: "Export readiness", value: "PDF" },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden pb-16">
      <div className="pointer-events-none absolute inset-0 -z-30 bg-[radial-gradient(circle_at_18%_12%,rgba(14,165,233,0.22),transparent_36%),radial-gradient(circle_at_82%_8%,rgba(16,185,129,0.2),transparent_34%),linear-gradient(180deg,#f3fbff_0%,#ebf7fb_52%,#f7fbff_100%)]" />
      <div className="ambient-orb pointer-events-none absolute -left-20 top-12 -z-20 h-72 w-72 rounded-full bg-emerald-300/30 blur-3xl" />
      <div className="ambient-orb-delayed pointer-events-none absolute -right-24 top-10 -z-20 h-80 w-80 rounded-full bg-sky-300/35 blur-3xl" />
      <div className="soft-pulse pointer-events-none absolute left-1/2 top-16 -z-20 h-[26rem] w-[26rem] -translate-x-1/2 rounded-full bg-sky-200/20 blur-3xl" />

      <header className="sticky top-0 z-20 border-b border-white/65 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-lg font-bold tracking-wide text-slate-800 sm:text-xl">MedNexus_Intelligence</h1>
            <p className="text-xs text-slate-500 sm:text-sm">Medical Intelligence Dashboard</p>
          </div>
          <div className="rounded-full border border-emerald-300/70 bg-emerald-50 px-4 py-1.5 text-xs font-semibold text-emerald-700 shadow-sm sm:text-sm">
            HIPAA-friendly workflow
          </div>
        </div>
      </header>

      <main className="mx-auto mt-8 flex w-full max-w-7xl flex-col gap-8 px-4 sm:px-6">
        <section className="relative card-enter overflow-hidden rounded-[2rem] border border-sky-100/90 bg-white/82 p-6 shadow-[0_24px_64px_-36px_rgba(14,165,233,0.55)] backdrop-blur sm:p-8 lg:p-10">
          <div className="pointer-events-none absolute bottom-10 left-10 hidden h-24 w-24 rounded-full bg-emerald-100/70 blur-2xl lg:block" />

          <div className="grid gap-8 lg:grid-cols-[1.25fr_1fr] lg:items-center">
            <div className="space-y-5">
              <p className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700 sm:text-sm">
                AI report companion
              </p>

              <div className="space-y-4">
                <h2 className="max-w-2xl text-3xl font-semibold leading-tight text-slate-900 sm:text-4xl lg:text-5xl">
                  Clear medical summaries from complex PDF reports
                </h2>
                <p className="max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                  Upload lab records or clinical reports, let MedNexus_Intelligence identify key risks, and generate a patient-friendly interpretation in seconds.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {trustMetrics.map((metric) => (
                  <div
                    key={metric.label}
                    className="rounded-2xl border border-sky-100 bg-gradient-to-b from-white to-sky-50/55 px-4 py-3 shadow-sm"
                  >
                    <p className="text-lg font-bold text-slate-900">{metric.value}</p>
                    <p className="mt-0.5 text-xs font-medium uppercase tracking-wider text-slate-500">
                      {metric.label}
                    </p>
                  </div>
                ))}
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {workflowSteps.map((step, index) => (
                  <div
                    key={step}
                    className="rounded-2xl border border-slate-200/80 bg-white/72 px-4 py-3 shadow-sm"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Step {index + 1}</p>
                    <p className="mt-1 text-sm font-medium text-slate-800">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="card-enter w-full max-w-xl justify-self-center rounded-3xl border border-sky-100 bg-white/94 p-5 shadow-[0_16px_46px_-30px_rgba(14,165,233,0.55)] sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-800">Upload & Analyze</p>
                  <p className="text-xs text-slate-500">Single file medical report processing</p>
                </div>
              </div>

              <div className="space-y-4">
                <FileUpload
                  selectedFile={selectedFile}
                  onFileSelect={handleFileSelect}
                  disabled={isUploading || isAnalyzing}
                />

                {selectedFile ? (
                  <p className="rounded-xl border border-sky-100 bg-sky-50/80 px-3 py-2 text-sm text-slate-700">
                    Selected file: <span className="font-semibold">{selectedFile.name}</span>
                  </p>
                ) : null}

                {isUploading && uploadProgress > 0 && uploadProgress < 100 ? (
                  <div className="transition-opacity duration-300">
                    <ProgressBar value={uploadProgress} />
                  </div>
                ) : null}

                <div className="flex flex-wrap items-center justify-center gap-3 transition-all duration-300">
                  {!uploadComplete ? (
                    <button
                      type="button"
                      onClick={startUpload}
                      disabled={!selectedFile || isUploading || isAnalyzing}
                      className="cta-shimmer rounded-xl bg-gradient-to-r from-sky-600 to-sky-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-105 disabled:cursor-not-allowed disabled:from-sky-300 disabled:to-sky-300"
                    >
                      {isUploading ? "Uploading..." : "Upload"}
                    </button>
                  ) : null}

                  {uploadComplete ? (
                    <button
                      type="button"
                      onClick={analyzeReport}
                      disabled={!canAnalyze}
                      className="card-enter cta-shimmer rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-105 disabled:cursor-not-allowed disabled:from-emerald-300 disabled:to-emerald-300"
                    >
                      {isAnalyzing ? "Analyzing..." : "Analyze Report"}
                    </button>
                  ) : null}

                  {hasActiveState ? (
                    <button
                      type="button"
                      onClick={resetAll}
                      disabled={isUploading || isAnalyzing}
                      className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Reset
                    </button>
                  ) : null}
                </div>

                {error ? (
                  <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                    {error}
                  </p>
                ) : null}

                {isAnalyzing ? <Loader label="Analyzing report" /> : null}
                {analysisComplete ? (
                  <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                    Analysis complete. Your medical report is now available below.
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        {analysisComplete && fileId ? (
          <section className="card-enter rounded-3xl border border-sky-100 bg-white/85 p-4 shadow-md sm:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-800">Pipeline Template PDF Preview</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-900"
                >
                  Download Pipeline PDF
                </button>
                <button
                  type="button"
                  onClick={resetAll}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Start New Analysis
                </button>
              </div>
            </div>

            <div className="h-[720px] w-full overflow-y-auto rounded-2xl border border-slate-200 bg-slate-100 p-4 sm:p-6">
              {pdfPreviewUrl ? (
                <iframe
                  title="Pipeline Report PDF"
                  src={pdfPreviewUrl}
                  className="mx-auto h-full w-full max-w-[900px] rounded-xl border border-slate-300 bg-white"
                />
              ) : (
                <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700 border border-amber-200">
                  PDF preview is not available yet. Click Analyze Report again.
                </p>
              )}
            </div>
          </section>
        ) : null}
      </main>
      <footer className="border-t border-sky-100 bg-white/80 px-6 py-4 text-center text-xs font-medium text-slate-500 backdrop-blur">
        © 2026 Ayush Anand · MedNexus_Intelligence™ · All rights reserved.
      </footer>
    </div>
  );
}
