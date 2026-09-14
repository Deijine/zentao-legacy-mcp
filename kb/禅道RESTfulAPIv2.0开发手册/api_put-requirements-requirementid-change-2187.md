# 变更用户需求

PUT/requirements/:requirementID/change

##  变更用户需求 

### 请求URL
https://xxx.com/api.php/v2/requirements/:requirementID/change

### 请求头
|  名称  类型  必填  描述
|  token  string  是  访问凭证Token

### 请求体
|  名称  类型  必填  描述
|  title  string  否  需求名称 
|  spec  string  否  需求描述 
|  verify  string  否  验收标准

### 请求示例

```
{
    "title": "智能头枕的颈椎保护",
    "spec": "描述",
    "verify": "验收标准"
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
