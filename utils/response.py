# helper chuẩn hoá response

from rest_framework.response import Response

def success(data, status=200):
    return Response({"data": data}, status=status)

def error(code: str, message: str, status: int):
    return Response({"error": {"code": code, "message": message}}, status=status)