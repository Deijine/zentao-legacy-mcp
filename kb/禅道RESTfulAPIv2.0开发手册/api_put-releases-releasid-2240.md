# 修改发布

PUT/releases/:releasID

##  修改发布 

### 请求URL
https://xxx.com/api.php/v2/releases/:releasID

### 请求头
|  名称  类型  必填  描述
|  token  string  是  访问凭证Token

### 请求体
|  名称  类型  必填  描述
|  system  int  是  所属应用 
|  name  string  是  应用版本号 
|  build  array  是  包含构建 
|  status  string  否  状态(wait 未开始 | normal 已发布 | fail 发布失败 | terminate 停止维护) 
|  date  date  是  计划发布日期 
|  desc  string  否  描述

### 请求示例

```
{
    "system": 1,
    "name": "v1.0",
    "build": [
        1
    ],
    "status": "wait",
    "date": "2026-02-10",
    "desc": "release 1.0"
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
