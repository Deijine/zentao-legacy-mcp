# 变更需求

PUT/stories/:storyID/change

##  变更需求 

### 请求URL
https://xxx.com/api.php/v2/stories/:storyID/change

### 请求头
|  名称  类型  必填  描述
|  token  string  是  访问凭证Token

### 请求体
|  名称  类型  必填  描述
|  title  string  否  需求名称 
|  reviewer  array  是  评审人员 
|  spec  string  否  需求描述 
|  verify  string  否  验收标准

### 请求示例

```
{
    "title": "智能照明的定时",
    "reviewer": [
        "admin"
    ],
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
