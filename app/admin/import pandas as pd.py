import pandas as pd
from datetime import datetime, timedelta

def create_cash_flow_excel():
    # 1. ตั้งค่าวันที่ (สมมติเริ่มวันอังคารที่ใกล้ที่สุด)
    start_date = datetime(2024, 5, 7)  # วันอังคาร
    days = ["Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday", "Monday"]

    data = []
    accumulated_balance = 0

    # รายการสำหรับวันอังคาร (Day 1) - มี Income และ Fixed Expenses
    current_date = start_date.strftime('%Y-%m-%d')
    day_name = days[0]

    # -- Income --
    income = 1500
    accumulated_balance += income
    data.append([current_date, day_name, "Weekly Allowance", "Income", income, 0, income, accumulated_balance, "Initial Budget"])

    # -- Fixed Expenses (หักทันทีวันอังคาร) --
    fixed_items = [
        ("Installment Reserve", 145, "Saving for 579/mo"),
        ("Fuel Cost", 100, "Transport"),
        ("Egg Tray", 100, "Food Stock"),
        ("Emergency Fund", 100, "Safety Net")
    ]

    for detail, amount, note in fixed_items:
        accumulated_balance -= amount
        data.append([current_date, day_name, detail, "Fixed", 0, amount, -amount, accumulated_balance, note])

    # -- Daily Expenses สำหรับทั้ง 7 วัน --
    for i in range(7):
        current_date = (start_date + timedelta(days=i)).strftime('%Y-%m-%d')
        day_name = days[i]

        daily_items = [
            ("Lunch", 100, "Daily meal"),
            ("Dinner", 40, "Daily meal")
        ]

        day_net = 0
        for detail, amount, note in daily_items:
            accumulated_balance -= amount
            day_net -= amount
            data.append([current_date, day_name, detail, "Daily", 0, amount, day_net, accumulated_balance, note])

        # เพิ่ม Note เรื่องเงินทอนสะสม
        data[-1][-1] = f"{note} (Target: Retained 10 THB)"

    # 2. สร้าง DataFrame
    columns = [
        'Date', 'Day', 'Transaction Details', 'Category',
        'In (+)', 'Out (-)', 'Daily Net', 'Accumulated Weekly Balance', 'Notes'
    ]
    df = pd.DataFrame(data, columns=columns)

    # 3. บันทึกเป็น Excel
    file_name = "cash_flow_weekly.xlsx"
    df.to_excel(file_name, index=False)
    print(f"✅ สร้างไฟล์ {file_name} เรียบร้อยแล้ว!")

if __name__ == "__main__":
    create_cash_flow_excel()