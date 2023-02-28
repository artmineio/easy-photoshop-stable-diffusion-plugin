#!/bin/bash

pushd local_server

if [ ! -d "venv" ]; then
  python -m venv ./venv
fi

source ./venv/bin/activate
python -m pip install -r requirements.txt

(trap 'kill 0' SIGINT; uvicorn main:app --reload --port 8088 & yarn --cwd .. watch)

popd
