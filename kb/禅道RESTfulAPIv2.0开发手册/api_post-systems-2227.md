# 创建应用

POST/systems

##  创建应用 

### 请求URL
https://xxx.com/api.php/v2/systems

### 请求头
|  名称  类型  必填  描述
|  token  string  是  访问凭证Token

### 请求体
|  名称  类型  必填  描述
|  productID  int  是  所属产品 
|  integrated  int  是  是否集成应用(0 否| 1 是) 
|  children  array  是  集成应用需要包含其他应用，非集成应用传空数组[] 
|  name  string  是  应用名称 
|  desc  string  否  描述

### 请求示例

```
{
    "productID": 1,
    "integrated": 0,
    "children": [],
    "name": "smart",
    "desc": "smart"
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
