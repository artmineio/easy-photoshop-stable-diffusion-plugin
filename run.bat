@echo off

set PYTHON="%~dp0%venv\Scripts\Python.exe"

if not exist venv\ (
  echo Setting up Python environment...
  python -m venv .\venv
)

echo %PYTHON%
%PYTHON% -m pip install -r local_server\requirements.txt

set NODE_OPTIONS=--openssl-legacy-provider

start /b "" %PYTHON% -m uvicorn --app-dir=local_server main:app --reload --port 8088
start /b "" npm install --silent && yarn build && yarn watch
