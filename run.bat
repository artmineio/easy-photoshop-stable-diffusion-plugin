@echo off

pushd local_server

set PYTHON="%~dp0%venv\Scripts\Python.exe"

if not exist venv\ (
  %PYTHON% -m venv .\venv
)

%PYTHON% -m pip install -r requirements.txt

start /b %PYTHON% -m uvicorn main:app --reload --port 8088
start /b yarn --cwd .. watch

popd
