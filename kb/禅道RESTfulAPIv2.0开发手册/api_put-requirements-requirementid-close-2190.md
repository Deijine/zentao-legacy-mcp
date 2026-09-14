# 关闭用户需求

PUT/requirements/:requirementID/close

##  关闭用户需求 

### 请求URL
https://xxx.com/api.php/v2/requirements/:requirementID/close

### 请求头
|  名称  类型  必填  描述
|  token  string  是  访问凭证Token

### 请求体
|  名称  类型  必填  描述
|  closedReason  string  是  关闭原因(done 已完成 | subdivided 已拆分 | duplicate 重复 | postponed 延期 | willnotdo 不做 | cancel 已取消 | bydesign 设计如此) 
|  comment  string  否  备注

### 请求示例

```
{
    "closedReason": "done"
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
