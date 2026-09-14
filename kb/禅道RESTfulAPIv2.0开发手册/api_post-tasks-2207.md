# 创建任务

POST/tasks

##  创建任务 

### 请求URL
https://xxx.com/api.php/v2/tasks

### 请求头
|  名称  类型  必填  描述
|  token  string  是  访问凭证Token

### 请求体
|  名称  类型  必填  描述
|  name  string  是  任务名称 
|  executionID  int  是  所属执行 
|  type  string  否  任务类型 
|  assignedTo  string  否  指派给 
|  estStarted  date  否  预计开始 
|  deadline  date  否  截止日期 
|  pri  int  否  优先级 
|  estimate  number  否  预计工时 
|  module  int  否  所属模块 
|  story  int  否  相关需求 
|  desc  string  否  任务描述

### 请求示例

```
{
    "name": "开发电容压力监测模块",
    "executionID": 3,
    "type": "devel",
    "assignedTo": "admin",
    "estStarted": "2025-12-25",
    "deadline": "2025-12-30",
    "pri": 1,
    "estimate": 1,
    "module": 1,
    "story": 1
}
```

### 请求响应
|  名称  类型  描述
|  status  string  状态(success 成功 | fail 失败) 
|  id  int  ID

### 响应示例

```
{
    "status": "success",
    "id": 1
}
```
