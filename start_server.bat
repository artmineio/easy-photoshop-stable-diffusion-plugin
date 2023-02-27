pushd local_server

uvicorn main:app --reload --port 8088

popd
