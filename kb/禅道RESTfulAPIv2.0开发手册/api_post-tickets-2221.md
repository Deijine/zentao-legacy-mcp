# 创建工单

POST/tickets

##  创建工单 

### 请求URL
https://xxx.com/api.php/v2/tickets

### 请求头
|  名称  类型  必填  描述
|  token  string  是  访问凭证Token

### 请求体
|  名称  类型  必填  描述
|  product  int  是  所属产品 
|  module  int  否  所属模块 
|  title  string  是  标题 
|  type  string  否  类型(code 程序报错 | data 数据错误 | stuck 流程卡断 | security 安全问题 | affair 事务) 
|  desc  string  否  描述 
|  assignedTo  string  否  指派给 
|  deadline  date  否  截止日期 
|  openedBuild  array  否  影响版本

### 请求示例

```
{
    "product": 1,
    "module": 1,
    "title": "电容压力监测灵敏度不够",
    "type": "code",
    "desc": "监测灵敏度不够",
    "assignedTo": "admin",
    "deadline": "2026-01-10",
    "openedBuild": [
        "trunk"
    ]
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
