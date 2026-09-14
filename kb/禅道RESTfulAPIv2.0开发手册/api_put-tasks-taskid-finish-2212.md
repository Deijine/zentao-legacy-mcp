# 完成任务

PUT/tasks/:taskID/finish

##  完成任务 

### 请求URL
https://xxx.com/api.php/v2/tasks/:taskID/finish

### 请求头
|  名称  类型  必填  描述
|  token  string  是  访问凭证Token

### 请求体
|  名称  类型  必填  描述
|  currentConsumed  number  是  本次消耗 
|  assignedTo  string  否  任务名称 
|  consumed  number  否  总计消耗 
|  realStarted  date  是  实际开始 
|  finishedDate  date  是  实际完成 
|  comment  string  否  备注

### 请求示例

```
{
    "currentConsumed": 1,
    "assignedTo": "admin",
    "consumed": 1,
    "realStarted": "2025-12-25",
    "finishedDate": "2025-12-30"
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
