import pandas as pd

print("⏳ Generating files for all 3 buttons...")

# ==========================================
# 🔵 BUTTON A: PAYROLL (3 Files)
# ==========================================

# 1. Employee_Master.xlsx
emp_data = {
    "Employee_ID": ["E001", "E002", "E003", "E004"],
    "Name": ["John Doe", "Jane Smith", "Mike Ross", "Rachel Zane"],
    "Department": ["IT", "HR", "Legal", "Legal"]
}
pd.DataFrame(emp_data).to_excel("Employee_Master.xlsx", index=False)

# 2. Salary_Structure.xlsx
sal_data = {
    "Employee_ID": ["E001", "E002", "E003", "E004"],
    "Basic_Salary": [50000, 60000, 45000, 70000],
    "Allowance": [10000, 12000, 5000, 15000]
}
pd.DataFrame(sal_data).to_excel("Salary_Structure.xlsx", index=False)

# 3. Attendance.xlsx
# E002 has 18 days (< 20). Logic: 10% deduction.
att_data = {
    "Employee_ID": ["E001", "E002", "E003", "E004"],
    "Days_Present": [25, 18, 22, 20]
}
pd.DataFrame(att_data).to_excel("Attendance.xlsx", index=False)
print("✅ Button A Files Created")


# ... (Previous code for Button A) ...

# ==========================================
# 🟠 BUTTON B: RISK ANALYSIS - FINAL VERSION
# ==========================================

# 4. Transactions.xlsx
# TRAPS:
# T002: High Risk (>100k)
# T003: Medium Risk (Missing ID)
# T006: Medium Risk (ID "C999" exists but NOT in Master) <--- NEW TEST CASE
trans_data = {
    "Transaction_ID": ["T001", "T002", "T003", "T005", "T001", "T006"],
    "Amount": [
        5000,     # Normal
        150000,   # High Risk
        200,      # Medium (No ID)
        -5000,    # Delete (Negative)
        5000,     # Delete (Duplicate)
        500       # Medium (Fake Customer)
    ], 
    "Customer_ID": [
        "C100",   # Valid
        "C101",   # Valid
        None,     # Missing
        "C102",   # Valid (but row deleted)
        "C100",   # Valid (but row deleted)
        "C999"    # INVALID (Not in Master)
    ] 
}
pd.DataFrame(trans_data).to_excel("Transactions.xlsx", index=False)

# 5. Master_Data.xlsx (No changes needed, C999 is naturally missing)
master_data = {
    "Customer_ID": ["C100", "C101", "C102"],
    "Name": ["Alice Corp", "Bob Ltd", "Charlie Inc"]
}
pd.DataFrame(master_data).to_excel("Master_Data.xlsx", index=False)
print("✅ Button B Files Created (Includes C999 Trap)")

# ... (Rest of code) ...

# ==========================================
# 🔴 BUTTON C: COMPLIANCE AUTOMATION - FINAL
# ==========================================

# 6. User_Access.xlsx (The "Reality")
# This is what users are ACTUALLY doing right now.
user_access_data = {
    "User_ID": ["U001", "U002", "U003", "U004", "U005"],
    "Role":    ["Manager", "Intern", "Intern", "Intern", "Hacker"],
    "Access_Type": [
        "Read_Data",   # U001: Allowed (Manager can Read)
        "Write_Data",  # U002: VIOLATION (Interns can't Write)
        "Delete_Data", # U003: EXCEPTION (Interns can't Delete, but U003 has a pass)
        "Read_Data",   # U004: Allowed (Interns can Read)
        "Full_Access"  # U005: VIOLATION (Role 'Hacker' doesn't exist in Matrix)
    ]
}
pd.DataFrame(user_access_data).to_excel("User_Access.xlsx", index=False)

# 7. Access_Matrix.xlsx (The "Law")
# This defines what is legally allowed.
# Notice: Interns are ONLY allowed 'Read_Data'.
access_matrix_data = {
    "Role": ["Manager", "Manager", "Intern"],
    "Access_Type": ["Read_Data", "Write_Data", "Read_Data"]
}
pd.DataFrame(access_matrix_data).to_excel("Access_Matrix.xlsx", index=False)

# 8. Exception_List.xlsx (The "Get Out of Jail Free" Card)
# Even though Interns can't Delete_Data, U003 is allowed to do it.
exception_data = {
    "User_ID": ["U003"], 
    "Access_Type": ["Delete_Data"] 
}
pd.DataFrame(exception_data).to_excel("Exception_List.xlsx", index=False)

print("✅ Button C Files Created with 4 Scenarios:")
print("   - U001: Compliant")
print("   - U002: Non-Compliant (Excess Access)")
print("   - U003: Compliant (Exception Rule Applied)")
print("   - U005: Non-Compliant (Unauthorized Role)")
print("\n🎉 All files ready for testing!")