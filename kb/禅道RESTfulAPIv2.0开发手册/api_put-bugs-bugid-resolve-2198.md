# 解决Bug

PUT/bugs/:bugID/resolve

##  解决Bug 

### 请求URL
https://xxx.com/api.php/v2/bugs/:bugID/resolve

### 请求头
|  名称  类型  必填  描述
|  token  string  是  访问凭证Token

### 请求体
|  名称  类型  必填  描述
|  resolution  string  是  fixed 已解决 | notrepro 无法重现 | bydesign 设计如此 | duplicate 重复Bug | external 外部原因| postponed 延期处理 | willnotfix 不予解决 | tostory 转为需求 
|  resolvedDate  string  否  解决日期，默认今天 
|  resolvedBuild  string  否  解决版本, trunk为主干 
|  assignedTo  string  否  指派给 
|  comment  string  否  备注

### 请求示例

```
{
    "resolution": "fixed",
    "resolvedDate": "2025-12-12",
    "resolvedBuild": "trunk",
    "assignedTo": "admin"
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
