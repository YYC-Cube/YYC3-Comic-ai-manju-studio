# manju-api（M0 空壳镜像）
# 注：requirements.txt 冻结基线为 Python 3.14.5 本机验收；镜像采用 3.13-slim
#     （numpy 2.5.3 / pillow 12.3.0 均有 3.13 轮子），差异已在 M0 日志留证。
FROM python:3.13-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 25200
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "25200"]
