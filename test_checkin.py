import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
import requests, pymysql

BASE = 'http://localhost:5000'

def db():
    return pymysql.connect(host='localhost', user='root', password='123456',
                           database='dental_clinic', charset='utf8mb4')

# Login admin
r = requests.post(f'{BASE}/api/auth/login', json={'username':'testadmin_x1','password':'Admin@123'})
token = r.json().get('token') or r.json().get('accessToken') or ''
H = {'Authorization': f'Bearer {token}'}

conn = db()
cur = conn.cursor()
cur.execute('SELECT p.id, p.fullName FROM patient p WHERE p.isActive=1 LIMIT 1')
patient = cur.fetchone()
cur.execute('SELECT u.id, u.username FROM `user` u JOIN userrole ur ON u.id=ur.userId JOIN role ro ON ro.id=ur.roleId WHERE ro.name="RECEPTIONIST" AND u.isActive=1 LIMIT 1')
recept = cur.fetchone()
cur.execute('SELECT u.id FROM `user` u JOIN userrole ur ON u.id=ur.userId JOIN role ro ON ro.id=ur.roleId WHERE ro.name="DOCTOR" AND u.isActive=1 LIMIT 1')
doctor = cur.fetchone()
conn.close()

print(f'Patient: id={patient[0]}, name={patient[1]}')
print(f'Receptionist: id={recept[0]}, username={recept[1]}')
print(f'Doctor: id={doctor[0]}')

# Reset receptionist password
requests.post(f'{BASE}/api/auth/users/{recept[0]}/reset-password',
              json={'newPassword': 'Test@12345'}, headers=H)
rt = requests.post(f'{BASE}/api/auth/login', json={'username': recept[1], 'password': 'Test@12345'})
rtoken = rt.json().get('token') or rt.json().get('accessToken') or ''
HR = {'Authorization': f'Bearer {rtoken}'} if rtoken else H
print(f'Receptionist login: HTTP {rt.status_code}')

# Gọi check-in
payload = {
    'patientId':   patient[0],
    'doctorId':    doctor[0],
    'visitReason': 'TREATMENT',
}
resp = requests.post(f'{BASE}/api/reception/checkin', json=payload, headers=HR)
print(f'\nCheck-in → HTTP {resp.status_code}')
print(f'Response: {resp.text[:300]}')

if resp.status_code == 409:
    print('\n(Bệnh nhân đã có lượt hôm nay - 409 Conflict là bình thường)')
elif resp.status_code == 201:
    d = resp.json()
    print(f'\n✓ Check-in thành công! code={d.get("code")}, scheduleId={d.get("scheduleId")}, status={d.get("status")}')
