from fastapi import HTTPException


def bad_request(error_message):
    return HTTPException(status_code=400, detail=error_message)


def server_error(error_message):
    return HTTPException(status_code=500, detail=error_message)
