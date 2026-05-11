 1 import pandas as pd
    2 from datetime import datetime, timedelta
    3
    4 def create_cash_flow_excel():
    5     # 1. ตั้งค่าวันที่ (สมมติเริ่มวันอังคารที่ใกล้ที่สุด)
    6     start_date = datetime(2024, 5, 7)  # วันอังคาร
    7     days = ["Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday", "Monday"]
    8     
    9     data = []
   10     accumulated_balance = 0
   11
   12     # รายการสำหรับวันอังคาร (Day 1) - มี Income และ Fixed Expenses
   13     current_date = start_date.strftime('%Y-%m-%d')
   14     day_name = days[0]
   15
   16     # -- Income --
   17     income = 1500
   18     accumulated_balance += income
   19     data.append([current_date, day_name, "Weekly Allowance", "Income", income, 0, income,
      accumulated_balance, "Initial Budget"])
   20
   21     # -- Fixed Expenses (หักทันทีวันอังคาร) --
   22     fixed_items = [
   23         ("Installment Reserve", 145, "Saving for 579/mo"),
   24         ("Fuel Cost", 100, "Transport"),
   25         ("Egg Tray", 100, "Food Stock"),
   26         ("Emergency Fund", 100, "Safety Net")
   27     ]
   28     
   29     for detail, amount, note in fixed_items:
   30         accumulated_balance -= amount
   31         data.append([current_date, day_name, detail, "Fixed", 0, amount, -amount,
      accumulated_balance, note])
   32
   33     # -- Daily Expenses สำหรับทั้ง 7 วัน --
   34     for i in range(7):
   35         current_date = (start_date + timedelta(days=i)).strftime('%Y-%m-%d')
   36         day_name = days[i]
   37         
   38         daily_items = [
   39             ("Lunch", 100, "Daily meal"),
   40             ("Dinner", 40, "Daily meal")
   41         ]
   42         
   43         day_net = 0
   44         for detail, amount, note in daily_items:
   45             accumulated_balance -= amount
   46             day_net -= amount
   47             data.append([current_date, day_name, detail, "Daily", 0, amount, day_net,
      accumulated_balance, note])
   48         
   49         # เพิ่ม Note เรื่องเงินทอนสะสม
   50         data[-1][-1] = f"{note} (Target: Retained 10 THB)"
   51
   52     # 2. สร้าง DataFrame
   53     columns = [
   54         'Date', 'Day', 'Transaction Details', 'Category', 
   55         'In (+)', 'Out (-)', 'Daily Net', 'Accumulated Weekly Balance', 'Notes'
   56     ]
   57     df = pd.DataFrame(data, columns=columns)
   58
   59     # 3. บันทึกเป็น Excel
   60     file_name = "cash_flow_weekly.xlsx"
   61     df.to_excel(file_name, index=False)
   62     print(f"✅ สร้างไฟล์ {file_name} เรียบร้อยแล้ว!")
   63
   64 if __name__ == "__main__":
   65     create_cash_flow_excel()
