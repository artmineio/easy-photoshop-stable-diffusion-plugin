#!/bin/bash

pushd local_server

if [ -d "venv" ]; then
  source ./venv/bin/activate
else
  python -m venv ./venv
  source ./venv/bin/activate
  python -m pip install -r requirements.txt
fi

uvicorn main:app --reload --port 8088

popd
