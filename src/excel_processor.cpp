#include <emscripten/bind.h>
#include <emscripten/val.h>
#include <vector>
#include <string>
#include <map>
#include <algorithm>

using namespace emscripten;

// Button A: Payroll Processing
val processPayroll(val employee_data, val attendance_data, val salary_data) {
    std::map<std::string, val> emp_map;
    
    val emp_array = employee_data["data"];
    val att_array = attendance_data["data"];
    val sal_array = salary_data["data"];
    
    // Merge employee data
    for (int i = 0; i < emp_array["length"].as<int>(); i++) {
        val row = emp_array[i];
        std::string id = row["Employee_ID"].as<std::string>();
        emp_map[id] = val::object();
        emp_map[id].set("Employee_ID", id);
        emp_map[id].set("Name", row["Name"]);
    }
    
    // Add salary structure
    for (int i = 0; i < sal_array["length"].as<int>(); i++) {
        val row = sal_array[i];
        std::string id = row["Employee_ID"].as<std::string>();
        if (emp_map.find(id) != emp_map.end()) {
            emp_map[id].set("Basic_Salary", row["Basic_Salary"]);
            emp_map[id].set("Allowance", row["Allowance"]);
        }
    }
    
    // Add attendance and calculate
    for (int i = 0; i < att_array["length"].as<int>(); i++) {
        val row = att_array[i];
        std::string id = row["Employee_ID"].as<std::string>();
        if (emp_map.find(id) != emp_map.end()) {
            int days = row["Days_Present"].as<int>();
            double basic = emp_map[id]["Basic_Salary"].as<double>();
            double allowance = emp_map[id]["Allowance"].as<double>();
            double gross = basic + allowance;
            double final_sal = days < 20 ? gross * 0.9 : gross;
            
            emp_map[id].set("Days_Present", days);
            emp_map[id].set("Gross_Salary", gross);
            emp_map[id].set("Final_Salary", final_sal);
        }
    }
    
    val result = val::array();
    int idx = 0;
    for (auto& pair : emp_map) {
        result.set(idx++, pair.second);
    }
    return result;
}

// Button B: Data Quality & Risk Analysis
val analyzeRisk(val transactions, val master_data) {
    val trans_array = transactions["data"];
    val clean_data = val::array();
    val risk_summary = val::array();
    
    int high_risk = 0, medium_risk = 0, low_risk = 0;
    int clean_idx = 0;
    
    for (int i = 0; i < trans_array["length"].as<int>(); i++) {
        val row = trans_array[i];
        
        if (row["Transaction_ID"].isUndefined() || row["Amount"].isUndefined()) continue;
        double amount = row["Amount"].as<double>();
        if (amount < 0) continue;
        
        val clean_row = val::object();
        clean_row.set("Transaction_ID", row["Transaction_ID"]);
        clean_row.set("Amount", amount);
        
        std::string risk_level;
        if (amount > 100000) {
            risk_level = "High Risk";
            high_risk++;
        } else if (row["Customer_ID"].isUndefined()) {
            risk_level = "Medium Risk";
            medium_risk++;
            clean_row.set("Customer_ID", "");
        } else {
            risk_level = "Low Risk";
            low_risk++;
            clean_row.set("Customer_ID", row["Customer_ID"]);
        }
        
        clean_row.set("Risk_Level", risk_level);
        clean_data.set(clean_idx++, clean_row);
    }
    
    val high_row = val::object();
    high_row.set("Risk_Type", "High Risk");
    high_row.set("Count", high_risk);
    risk_summary.set(0, high_row);
    
    val med_row = val::object();
    med_row.set("Risk_Type", "Medium Risk");
    med_row.set("Count", medium_risk);
    risk_summary.set(1, med_row);
    
    val result = val::object();
    result.set("cleanData", clean_data);
    result.set("riskSummary", risk_summary);
    return result;
}

// Button C: Compliance Automation
val checkCompliance(val user_access, val access_matrix, val exceptions) {
    std::map<std::string, std::vector<std::string>> allowed_access;
    std::map<std::string, bool> exception_list;
    
    val matrix_array = access_matrix["data"];
    for (int i = 0; i < matrix_array["length"].as<int>(); i++) {
        val row = matrix_array[i];
        std::string role = row["Role"].as<std::string>();
        std::string access = row["Access_Type"].as<std::string>();
        allowed_access[role].push_back(access);
    }
    
    val exc_array = exceptions["data"];
    for (int i = 0; i < exc_array["length"].as<int>(); i++) {
        val row = exc_array[i];
        std::string key = row["User_ID"].as<std::string>() + "_" + row["Access_Type"].as<std::string>();
        exception_list[key] = true;
    }
    
    val violations = val::array();
    int compliant = 0, non_compliant = 0;
    int viol_idx = 0;
    
    val access_array = user_access["data"];
    for (int i = 0; i < access_array["length"].as<int>(); i++) {
        val row = access_array[i];
        std::string user_id = row["User_ID"].as<std::string>();
        std::string role = row["Role"].as<std::string>();
        std::string access_type = row["Access_Type"].as<std::string>();
        
        std::string exc_key = user_id + "_" + access_type;
        if (exception_list.find(exc_key) != exception_list.end()) {
            compliant++;
            continue;
        }
        
        auto& allowed = allowed_access[role];
        bool found = std::find(allowed.begin(), allowed.end(), access_type) != allowed.end();
        
        if (found) {
            compliant++;
        } else {
            non_compliant++;
            val viol_row = val::object();
            viol_row.set("User_ID", user_id);
            viol_row.set("Role", role);
            viol_row.set("Access_Type", access_type);
            viol_row.set("Status", "Non-Compliant");
            violations.set(viol_idx++, viol_row);
        }
    }
    
    val summary = val::array();
    val comp_row = val::object();
    comp_row.set("Status", "Compliant");
    comp_row.set("Count", compliant);
    summary.set(0, comp_row);
    
    val non_comp_row = val::object();
    non_comp_row.set("Status", "Non-Compliant");
    non_comp_row.set("Count", non_compliant);
    summary.set(1, non_comp_row);
    
    val result = val::object();
    result.set("violations", violations);
    result.set("summary", summary);
    return result;
}

EMSCRIPTEN_BINDINGS(excel_processor) {
    function("processPayroll", &processPayroll);
    function("analyzeRisk", &analyzeRisk);
    function("checkCompliance", &checkCompliance);
}