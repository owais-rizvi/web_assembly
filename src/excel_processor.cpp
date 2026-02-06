#include <emscripten/bind.h>
#include <emscripten/val.h>
#include <vector>
#include <string>
#include <map>
#include <set>  // Required for duplication checks
#include <algorithm>

using namespace emscripten;

// ==========================================
// 🔵 BUTTON A: PAYROLL PROCESSING
// ==========================================
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

// ==========================================
// 🟠 BUTTON B: RISK ANALYSIS (FINAL)
// ==========================================
val analyzeRisk(val transactions, val master_data) {
    val trans_array = transactions["data"];
    val master_array = master_data["data"]; 
    
    val clean_data = val::array();
    val risk_summary = val::array();
    
    int high_risk = 0, medium_risk = 0, low_risk = 0;
    int clean_idx = 0;
    
    std::set<std::string> seen_ids; 
    std::set<std::string> valid_customers; 

    // 1. Build the "Allowed List" (VLOOKUP Source)
    for (int i = 0; i < master_array["length"].as<int>(); i++) {
        val row = master_array[i];
        if (!row["Customer_ID"].isUndefined()) {
             std::string m_id = row["Customer_ID"].as<std::string>();
             if (m_id.length() > 0) valid_customers.insert(m_id);
        }
    }

    // 2. Process Transactions
    for (int i = 0; i < trans_array["length"].as<int>(); i++) {
        val row = trans_array[i];
        
        // Skip completely empty rows
        if (row["Transaction_ID"].isUndefined() || row["Amount"].isUndefined()) continue;
        
        std::string t_id = row["Transaction_ID"].as<std::string>();
        double amount = row["Amount"].as<double>();

        // CLEANING RULES:
        if (amount < 0) continue;          // Delete Negative
        if (seen_ids.count(t_id)) continue; // Delete Duplicate
        seen_ids.insert(t_id);

        // CAPTURE ID
        std::string c_id = "MISSING";
        bool has_cust = false;
        bool is_valid_cust = false;

        // Strict Check: Must be Defined AND Not Empty String ""
        if (!row["Customer_ID"].isUndefined()) {
            std::string temp_id = row["Customer_ID"].as<std::string>();
            if (temp_id.length() > 0) {
                has_cust = true;
                c_id = temp_id;
                // VLOOKUP Check
                if (valid_customers.count(c_id)) {
                    is_valid_cust = true;
                }
            }
        }

        val clean_row = val::object();
        clean_row.set("Transaction_ID", t_id);
        clean_row.set("Customer_ID", c_id);
        clean_row.set("Amount", amount);

        // RISK RULES
        std::string risk_level;
        
        if (amount > 100000) {
            risk_level = "High Risk";
            high_risk++;
        } 
        // MEDIUM RISK: Missing ID OR Fake ID (Not in Master)
        else if (!has_cust || !is_valid_cust) {
            risk_level = "Medium Risk";
            medium_risk++;
            
            if (has_cust && !is_valid_cust) {
                clean_row.set("Customer_ID", c_id + " (Unknown)"); 
            }
        } else {
            risk_level = "Low Risk";
            low_risk++;
        }
        
        clean_row.set("Risk_Level", risk_level);
        clean_data.set(clean_idx++, clean_row);
    }
    
    // Summary
    val high_row = val::object(); high_row.set("Risk_Type", "High Risk"); high_row.set("Count", high_risk); risk_summary.set(0, high_row);
    val med_row = val::object(); med_row.set("Risk_Type", "Medium Risk"); med_row.set("Count", medium_risk); risk_summary.set(1, med_row);
    val low_row = val::object(); low_row.set("Risk_Type", "Low Risk"); low_row.set("Count", low_risk); risk_summary.set(2, low_row);

    val result = val::object();
    result.set("cleanData", clean_data);
    result.set("riskSummary", risk_summary);
    return result;
}

// ==========================================
// 🔴 BUTTON C: COMPLIANCE AUTOMATION (FINAL)
// ==========================================
val checkCompliance(val user_access, val access_matrix, val exceptions) {
    // 1. Load the "Law" (Access Matrix)
    std::map<std::string, std::set<std::string>> allowed_access;
    val matrix_array = access_matrix["data"];
    for (int i = 0; i < matrix_array["length"].as<int>(); i++) {
        val row = matrix_array[i];
        if (!row["Role"].isUndefined() && !row["Access_Type"].isUndefined()) {
             allowed_access[row["Role"].as<std::string>()].insert(row["Access_Type"].as<std::string>());
        }
    }
    
    // 2. Load Exceptions
    std::set<std::string> exception_set;
    val exc_array = exceptions["data"];
    for (int i = 0; i < exc_array["length"].as<int>(); i++) {
        val row = exc_array[i];
        // Key = "User_Access" (e.g., "U003_Delete_Data")
        if (!row["User_ID"].isUndefined() && !row["Access_Type"].isUndefined()) {
            std::string key = row["User_ID"].as<std::string>() + "_" + row["Access_Type"].as<std::string>();
            exception_set.insert(key);
        }
    }
    
    // 3. Check Reality (User Access)
    val violations = val::array();
    int compliant = 0, non_compliant = 0;
    int viol_idx = 0;
    
    val access_array = user_access["data"];
    for (int i = 0; i < access_array["length"].as<int>(); i++) {
        val row = access_array[i];
        if (row["User_ID"].isUndefined()) continue;

        std::string user_id = row["User_ID"].as<std::string>();
        std::string role = row["Role"].as<std::string>();
        std::string access = row["Access_Type"].as<std::string>();
        
        // CHECK 1: Is this an Exception?
        std::string exc_key = user_id + "_" + access;
        if (exception_set.count(exc_key)) {
            compliant++; // Allowed by Exception
            continue;
        }
        
        // CHECK 2: Is the Role valid?
        if (allowed_access.find(role) == allowed_access.end()) {
            non_compliant++;
            val v = val::object();
            v.set("User_ID", user_id);
            v.set("Role", role);
            v.set("Access_Type", access);
            v.set("Status", "Unauthorized Role");
            violations.set(viol_idx++, v);
            continue;
        }

        // CHECK 3: Is the Access allowed for this Role?
        if (allowed_access[role].count(access)) {
            compliant++;
        } else {
            non_compliant++;
            val v = val::object();
            v.set("User_ID", user_id);
            v.set("Role", role);
            v.set("Access_Type", access);
            v.set("Status", "Excess Access");
            violations.set(viol_idx++, v);
        }
    }
    
    // Summary
    val summary = val::array();
    val r1 = val::object(); r1.set("Status", "Compliant"); r1.set("Count", compliant); summary.set(0, r1);
    val r2 = val::object(); r2.set("Status", "Non-Compliant"); r2.set("Count", non_compliant); summary.set(1, r2);
    
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