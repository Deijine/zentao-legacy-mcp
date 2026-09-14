# 启动任务

PUT/tasks/:taskID/start

##  启动任务 

### 请求URL
https://xxx.com/api.php/v2/tasks/:taskID/start

### 请求头
|  名称  类型  必填  描述
|  token  string  是  访问凭证Token

### 请求体
|  名称  类型  必填  描述
|  assignedTo  string  否  任务名称 
|  realStarted  string  是  实际开始 
|  consumed  number  否  总计消耗 
|  left  number  否  预计剩余 
|  comment  string  否  备注

### 请求示例

```
{
    "assignedTo": "admin",
    "realStarted": "2025-12-26",
    "consumed": 1,
    "left": 1
}
```

### 请求响应
|  名称  类型  描述
|  status  string  状态(success 成功 | fail 失败)

### 响应示例

```
{
    "status": "success"
}
```
