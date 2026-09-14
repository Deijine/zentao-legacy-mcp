# 获取Token

POST/users/login

##  获取Token 

### 请求URL
https://xxx.com/api.php/v2/users/login

### 请求体
|  名称  类型  必填  描述
|  account  string  是  用户名 
|  password  string  是  密码

### 请求示例

```
{
    "account": "admin",
    "password": "123Qwe!@#"
}
```

### 请求响应
|  名称  类型  描述
|  status  string  状态(success 成功 | fail 失败) 
|  token  string  API凭证 
|  token  string  API凭证

### 响应示例

```
{
    "status": "success",
    "token": "llb8ocefb0kbgklif53j839k6l"
}
```
