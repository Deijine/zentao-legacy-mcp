# 创建项目集

POST/programs

##  创建项目集 

### 请求URL
https://xxx.com/api.php/v2/programs

### 请求头
|  名称  类型  必填  描述
|  token  string  是  访问凭证Token

### 请求体
|  名称  类型  必填  描述
|  name  string  是  项目集名称 
|  begin  date  是  计划开始日期 
|  end  date  是  计划完成日期 
|  PM  string  否  计划完成日期 
|  desc  string  否  项目集描述

### 请求示例

```
{
    "name": "智能睡眠",
    "begin": "2025-01-01",
    "end": "2026-12-01",
    "PM": "productManager",
    "desc": "智能家居项目集"
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
