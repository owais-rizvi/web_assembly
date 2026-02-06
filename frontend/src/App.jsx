import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import "./App.css";

function App() {
  const [wasmModule, setWasmModule] = useState(null);
  const [files, setFiles] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadWasm = async () => {
      try {
        if (typeof window !== "undefined" && window.ExcelProcessor) {
          const module = await window.ExcelProcessor();
          setWasmModule(module);
        }
      } catch (error) {
        console.error("Failed to load WASM module:", error);
      }
    };

    // Load WASM script
    const script = document.createElement("script");
    script.src = "/excel_processor.js";
    script.onload = loadWasm;
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  const handleFileUpload = (event, key) => {
    const file = event.target.files[0];
    if (file) {
      console.log(`Uploading ${key}:`, file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const workbook = XLSX.read(e.target.result, { type: "binary" });
          const sheetName = workbook.SheetNames[0];
          const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
          console.log(`${key} data:`, data);
          setFiles((prev) => ({
            ...prev,
            [key]: { data, filename: file.name },
          }));
        } catch (error) {
          console.error(`Error reading ${key}:`, error);
          alert(`Error reading ${file.name}: ${error.message}`);
        }
      };
      reader.onerror = (error) => {
        console.error(`FileReader error for ${key}:`, error);
        alert(`Failed to read ${file.name}`);
      };
      reader.readAsBinaryString(file);
    }
  };

  const downloadExcel = (data, filename) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, filename);
  };

  const processPayroll = () => {
    if (!wasmModule || !files.employee || !files.attendance || !files.salary) {
      alert("Please upload all 3 files");
      return;
    }
    setLoading(true);
    try {
      const result = wasmModule.processPayroll(
        files.employee,
        files.attendance,
        files.salary,
      );
      const data = [];
      console.log("result:", result);
      console.log("type:", typeof result);
      console.log("isArray:", Array.isArray(result));
      for (let i = 0; i < result.length; i++) {
        data.push({
          Employee_ID: result[i].Employee_ID,
          Name: result[i].Name,
          Basic_Salary: result[i].Basic_Salary,
          Allowance: result[i].Allowance,
          Days_Present: result[i].Days_Present,
          Gross_Salary: result[i].Gross_Salary,
          Final_Salary: result[i].Final_Salary,
        });
      }
      downloadExcel(data, "Final_Payroll_Report.xlsx");
      setResult({ type: "payroll", data });
    } catch (error) {
      console.error("Payroll processing failed:", error);
    }
    setLoading(false);
  };

  const analyzeRisk = () => {
    if (!wasmModule || !files.transactions || !files.master) {
      alert("Please upload both files");
      return;
    }
    setLoading(true);
    try {
      const result = wasmModule.analyzeRisk(files.transactions, files.master);
      const cleanData = [];
      const riskSummary = [];

      for (let i = 0; i < result.cleanData.size(); i++) {
        cleanData.push({
          Transaction_ID: result.cleanData.get(i).Transaction_ID,
          Customer_ID: result.cleanData.get(i).Customer_ID,
          Amount: result.cleanData.get(i).Amount,
          Risk_Level: result.cleanData.get(i).Risk_Level,
        });
      }

      for (let i = 0; i < result.riskSummary.size(); i++) {
        riskSummary.push({
          Risk_Type: result.riskSummary.get(i).Risk_Type,
          Count: result.riskSummary.get(i).Count,
        });
      }

      downloadExcel(cleanData, "Cleaned_Transactions.xlsx");
      downloadExcel(riskSummary, "Risk_Summary_Report.xlsx");
      setResult({ type: "risk", cleanData, riskSummary });
    } catch (error) {
      console.error("Risk analysis failed:", error);
    }
    setLoading(false);
  };

  const checkCompliance = () => {
    if (
      !wasmModule ||
      !files.userAccess ||
      !files.accessMatrix ||
      !files.exceptions
    ) {
      alert("Please upload all 3 files");
      return;
    }
    setLoading(true);
    try {
      const result = wasmModule.checkCompliance(
        files.userAccess,
        files.accessMatrix,
        files.exceptions,
      );
      const violations = [];
      const summary = [];

      for (let i = 0; i < result.violations.size(); i++) {
        violations.push({
          User_ID: result.violations.get(i).User_ID,
          Role: result.violations.get(i).Role,
          Access_Type: result.violations.get(i).Access_Type,
          Status: result.violations.get(i).Status,
        });
      }

      for (let i = 0; i < result.summary.size(); i++) {
        summary.push({
          Status: result.summary.get(i).Status,
          Count: result.summary.get(i).Count,
        });
      }

      downloadExcel(violations, "Violation_Report.xlsx");
      downloadExcel(summary, "Compliance_Summary.xlsx");
      setResult({ type: "compliance", violations, summary });
    } catch (error) {
      console.error("Compliance check failed:", error);
    }
    setLoading(false);
  };

  return (
    <div className="app">
      <h1>Excel Processing System</h1>

      <div className="buttons">
        <div className="button-section">
          <h2>🔵 Button A - Payroll Processing</h2>
          <div className="file-inputs">
            <div>
              <input
                type="file"
                accept=".xlsx"
                onChange={(e) => handleFileUpload(e, "employee")}
              />
              <label>Employee_Master.xlsx {files.employee && "✓"}</label>
            </div>
            <div>
              <input
                type="file"
                accept=".xlsx"
                onChange={(e) => handleFileUpload(e, "attendance")}
              />
              <label>Attendance.xlsx {files.attendance && "✓"}</label>
            </div>
            <div>
              <input
                type="file"
                accept=".xlsx"
                onChange={(e) => handleFileUpload(e, "salary")}
              />
              <label>Salary_Structure.xlsx {files.salary && "✓"}</label>
            </div>
          </div>
          <button onClick={processPayroll} disabled={loading}>
            Process Payroll
          </button>
        </div>

        <div className="button-section">
          <h2>🟠 Button B - Data Quality & Risk Analysis</h2>
          <div className="file-inputs">
            <input
              type="file"
              accept=".xlsx"
              onChange={(e) => handleFileUpload(e, "transactions")}
            />
            <label>Transactions.xlsx</label>
            <input
              type="file"
              accept=".xlsx"
              onChange={(e) => handleFileUpload(e, "master")}
            />
            <label>Master_Data.xlsx</label>
          </div>
          <button onClick={analyzeRisk} disabled={loading}>
            Analyze Risk
          </button>
        </div>

        <div className="button-section">
          <h2>🔴 Button C - Compliance Automation</h2>
          <div className="file-inputs">
            <input
              type="file"
              accept=".xlsx"
              onChange={(e) => handleFileUpload(e, "userAccess")}
            />
            <label>User_Access.xlsx</label>
            <input
              type="file"
              accept=".xlsx"
              onChange={(e) => handleFileUpload(e, "accessMatrix")}
            />
            <label>Access_Matrix.xlsx</label>
            <input
              type="file"
              accept=".xlsx"
              onChange={(e) => handleFileUpload(e, "exceptions")}
            />
            <label>Exception_List.xlsx</label>
          </div>
          <button onClick={checkCompliance} disabled={loading}>
            Check Compliance
          </button>
        </div>
      </div>

      {loading && <div className="loading">Processing...</div>}

      {result && (
        <div className="result">
          <h3>Processing Complete</h3>
          <p>Files have been downloaded automatically.</p>
        </div>
      )}
    </div>
  );
}

export default App;
