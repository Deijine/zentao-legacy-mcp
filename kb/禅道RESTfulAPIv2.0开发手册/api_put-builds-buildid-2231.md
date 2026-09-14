# 修改版本

PUT/builds/:buildID

##  修改版本 

### 请求URL
https://xxx.com/api.php/v2/builds/:buildID

### 请求头
|  名称  类型  必填  描述
|  token  string  是  访问凭证Token

### 请求体
|  名称  类型  必填  描述
|  execution  int  是  所属执行/迭代 
|  product  int  是  所属产品 
|  name  string  是  构建名称 
|  system  int  是  所属应用 
|  builder  string  是  构建者 
|  date  date  是  打包日期 
|  scmPath  string  否  源代码地址 
|  filePath  string  否  下载地址 
|  desc  string  否  描述

### 请求示例

```
{
    "execution": 3,
    "product": 1,
    "name": "版本v1.0",
    "system": 1,
    "builder": "admin",
    "date": "2026-01-01",
    "scmPath": "http:\/\/test.com\/git",
    "filePath": "http:\/\/test.com\/download",
    "desc": "test"
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
