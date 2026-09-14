# 创建产品计划

POST/productplans

##  创建产品计划 

### 请求URL
https://xxx.com/api.php/v2/productplans

### 请求头
|  名称  类型  必填  描述
|  token  string  是  访问凭证Token

### 请求体
|  名称  类型  必填  描述
|  productID  int  是  产品ID 
|  title  string  是  计划名称 
|  parent  int  否  父计划ID 
|  begin  date  否  开始日期 
|  end  date  否  结束日期 
|  branchID  int  否  分支ID 
|  desc  string  否  计划描述

### 请求示例

```
{
    "productID": 1,
    "title": "V1.0计划",
    "parent": 0,
    "begin": "2026-01-01",
    "end": "2026-01-31",
    "branchID": 1,
    "desc": "初版计划"
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
