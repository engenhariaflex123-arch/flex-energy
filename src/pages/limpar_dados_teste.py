import requests

url = "https://influxdb-production-8d37.up.railway.app/api/v2/delete"
params = {"org": "default", "bucket": "default"}
headers = {
    "Authorization": "Token yv-7PLXnIlfRsZaHmPyxb3RHooTjHayZ_sR7WJTfG3-U1XnEVt6C-VEGMHlPwHNaNmO7bzrYguDm6VS_D-yqnQ==",
    "Content-Type": "application/json",
}
body = {
    "start": "2026-07-01T00:00:00Z",
    "stop": "2026-07-16T16:02:00Z",
    "predicate": '_measurement="energia" and cliente_id="flex-energy-jos-loureiro-c09967"',
}
resp = requests.post(url, params=params, headers=headers, json=body)
print(resp.status_code)
print(resp.text)