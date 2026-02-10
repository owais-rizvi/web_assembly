import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { Calculator, Shield, CheckCircle2, Upload, Circle, FileSpreadsheet } from 'lucide-react';
import "./App.css";

export default function App() {
  const [wasmModule, setWasmModule] = useState(null);
  
  // File States
  const [payrollFiles, setPayrollFiles] = useState(null);
  const [riskFiles, setRiskFiles] = useState(null);
  const [complianceFiles, setComplianceFiles] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(null); 

  useEffect(() => {
    const loadWasm = async () => {
      if (typeof window !== "undefined" && window.createModule) {
        const module = await window.createModule();
        setWasmModule(module);
        console.log("✅ WASM Module Loaded");
      }
    };
    const script = document.createElement("script");
    script.src = "/excel_processor.js";
    script.onload = loadWasm;
    document.head.appendChild(script);
    return () => { if (document.head.contains(script)) document.head.removeChild(script); };
  }, []);

  // Helper: Read Excel Files (Fixed with Error Handling)
  const readFiles = async (fileList) => {
    const fileData = {};
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const data = await new Promise((resolve, reject) => { // <--- Added reject
        const reader = new FileReader();
        
        // 1. Success Handler
        reader.onload = (e) => {
          try {
            const wb = XLSX.read(e.target.result, { type: "binary" });
            resolve(XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]));
          } catch (error) {
            reject("Error parsing Excel: " + error.message);
          }
        };

        // 2. Error Handler (THIS WAS MISSING)
        reader.onerror = (error) => {
            console.error("File reading failed:", error);
            reject("Failed to read file. Is it open in Excel?");
        };

        reader.readAsBinaryString(file);
      });
      
      const name = file.name.toLowerCase();
      if (name.includes("employee")) fileData.employee = { data, filename: file.name };
      else if (name.includes("attendance")) fileData.attendance = { data, filename: file.name };
      else if (name.includes("salary")) fileData.salary = { data, filename: file.name };
      else if (name.includes("transaction")) fileData.transactions = { data, filename: file.name };
      else if (name.includes("master")) fileData.master = { data, filename: file.name };
      else if (name.includes("user_access")) fileData.userAccess = { data, filename: file.name };
      else if (name.includes("access_matrix")) fileData.accessMatrix = { data, filename: file.name };
      else if (name.includes("exception")) fileData.exceptions = { data, filename: file.name };
    }
    return fileData;
  };

  const downloadExcel = (data, filename) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, filename);
  };

  // --- HANDLERS ---
  const handlePayrollProcessing = async () => {
    if (!payrollFiles || payrollFiles.length < 3) return alert("Please upload all 3 payroll files.");
    setProcessing('payroll');
    try {
      const files = await readFiles(payrollFiles);
      const result = wasmModule.processPayroll(files.employee, files.attendance, files.salary);
      const data = result.map(r => ({
           Employee_ID: r.Employee_ID, Name: r.Name,
           Basic_Salary: r.Basic_Salary, Allowance: r.Allowance,
           Days_Present: r.Days_Present, Gross_Salary: r.Gross_Salary,
           Final_Salary: r.Final_Salary
      }));
      downloadExcel(data, "Final_Payroll_Report.xlsx");
    } catch (e) { console.error(e); alert("Error processing payroll"); }
    setProcessing(null);
  };

  const handleRiskAnalysis = async () => {
    if (!riskFiles || riskFiles.length < 2) return alert("Please upload both risk files.");
    setProcessing('risk');
    try {
      const files = await readFiles(riskFiles);
      const result = wasmModule.analyzeRisk(files.transactions, files.master);
      const cleanData = [];
      const riskSummary = [];
      for(let i=0; i<result.cleanData.length; i++) cleanData.push(result.cleanData[i]);
      for(let i=0; i<result.riskSummary.length; i++) riskSummary.push(result.riskSummary[i]);
      downloadExcel(cleanData, "Cleaned_Transactions.xlsx");
      downloadExcel(riskSummary, "Risk_Summary_Report.xlsx");
    } catch (e) { console.error(e); alert("Error analyzing risk"); }
    setProcessing(null);
  };

  const handleComplianceAutomation = async () => {
    if (!complianceFiles || complianceFiles.length < 3) return alert("Please upload all 3 compliance files.");
    setProcessing('compliance');
    try {
      const files = await readFiles(complianceFiles);
      const result = wasmModule.checkCompliance(files.userAccess, files.accessMatrix, files.exceptions);
      const violations = [];
      const summary = [];
      for(let i=0; i<result.violations.length; i++) violations.push(result.violations[i]);
      for(let i=0; i<result.summary.length; i++) summary.push(result.summary[i]);
      downloadExcel(violations, "Violation_Report.xlsx");
      downloadExcel(summary, "Compliance_Summary.xlsx");
    } catch (e) { console.error(e); alert("Error checking compliance"); }
    setProcessing(null);
  };

  const DotMatrix = () => (
    <div className="dot-matrix">
      {Array.from({ length: 200 }).map((_, i) => <Circle key={i} className="dot" />)}
    </div>
  );

  return (
    <div className="app">
      <DotMatrix />
      
      <div className="header">
        <div className="badge">
          <div className="badge-dot"></div>
          <span>Enterprise Solutions</span>
        </div>
        <h1>GridCore.</h1>
        <p className="subtitle">High-performance C++ WebAssembly Modules</p>
      </div>

      <div className="buttons">
        
        {/* --- PAYROLL CARD --- */}
        <div className="button-section payroll-card">
          <div className="icon-wrapper">
            <Calculator className="icon" />
          </div>
          <h2>Payroll Processing</h2>
          <p className="description">
            Automates salary calculation by merging employee data, attendance records, and salary structures. 
            Automatically applies deductions for low attendance.
          </p>
          
          <div className="file-inputs">
            <label className={payrollFiles ? "active" : ""}>
              <div className="label-content">
                <span className="file-count">{payrollFiles ? `${payrollFiles.length} files selected` : "Upload Data"}</span>
                <span className="file-sub">Click to browse</span>
              </div>
              <Upload className="upload-icon" />
              <input type="file" multiple onChange={(e) => setPayrollFiles(e.target.files)} className="hidden" />
            </label>
            <div className="examples">
              <FileSpreadsheet className="ex-icon" />
              <span>Expected: Employee.xlsx, Salary.xlsx, Attendance.xlsx</span>
            </div>
          </div>
          
          <button onClick={handlePayrollProcessing} disabled={!payrollFiles || processing}>
            {processing === 'payroll' ? "Processing..." : "Run Payroll"}
          </button>
        </div>

        {/* --- RISK CARD --- */}
        <div className="button-section risk-card">
          <div className="icon-wrapper">
            <Shield className="icon" />
          </div>
          <h2>Risk Analysis</h2>
          <p className="description">
             Detects fraud by analyzing transaction patterns. Flags high-value transfers (&gt;100k), 
             identifies missing customer IDs, and removes duplicate entries.
          </p>
          
          <div className="file-inputs">
            <label className={riskFiles ? "active" : ""}>
               <div className="label-content">
                <span className="file-count">{riskFiles ? `${riskFiles.length} files selected` : "Upload Data"}</span>
                <span className="file-sub">Click to browse</span>
              </div>
              <Upload className="upload-icon" />
              <input type="file" multiple onChange={(e) => setRiskFiles(e.target.files)} className="hidden" />
            </label>
             <div className="examples">
              <FileSpreadsheet className="ex-icon" />
              <span>Expected: Transactions.xlsx, Master_Data.xlsx</span>
            </div>
          </div>
          
          <button onClick={handleRiskAnalysis} disabled={!riskFiles || processing}>
            {processing === 'risk' ? "Analyzing..." : "Analyze Risk"}
          </button>
        </div>

        {/* --- COMPLIANCE CARD --- */}
        <div className="button-section compliance-card">
          <div className="icon-wrapper">
            <CheckCircle2 className="icon" />
          </div>
          <h2>Compliance Check</h2>
          <p className="description">
             Audits user permissions against an Access Matrix. Detects unauthorized roles and excess privileges
             while accounting for special exceptions.
          </p>
          
          <div className="file-inputs">
            <label className={complianceFiles ? "active" : ""}>
               <div className="label-content">
                <span className="file-count">{complianceFiles ? `${complianceFiles.length} files selected` : "Upload Data"}</span>
                <span className="file-sub">Click to browse</span>
              </div>
              <Upload className="upload-icon" />
              <input type="file" multiple onChange={(e) => setComplianceFiles(e.target.files)} className="hidden" />
            </label>
             <div className="examples">
              <FileSpreadsheet className="ex-icon" />
              <span>Expected: User_Access.xlsx, Matrix.xlsx, Exceptions.xlsx</span>
            </div>
          </div>
          
          <button onClick={handleComplianceAutomation} disabled={!complianceFiles || processing}>
            {processing === 'compliance' ? "Verifying..." : "Verify Compliance"}
          </button>
        </div>

      </div>
    </div>
  );
}