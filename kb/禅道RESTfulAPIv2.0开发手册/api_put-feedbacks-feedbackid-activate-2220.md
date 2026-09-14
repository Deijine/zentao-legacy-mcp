# 激活反馈

PUT/feedbacks/:feedbackID/activate

##  激活反馈 

### 请求URL
https://xxx.com/api.php/v2/feedbacks/:feedbackID/activate

### 请求头
|  名称  类型  必填  描述
|  token  string  是  访问凭证Token

### 请求体
|  名称  类型  必填  描述
|  assignedTo  string  否  指派给 
|  comment  string  否  备注

### 请求示例

```
{
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
