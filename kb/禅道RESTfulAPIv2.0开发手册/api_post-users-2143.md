# 创建用户

POST/users

##  创建用户 

### 请求URL
https://xxx.com/api.php/v2/users

### 请求头
|  名称  类型  必填  描述
|  token  string  是  访问凭证Token

### 请求体
|  名称  类型  必填  描述
|  account  string  是  登录名 
|  realname  string  是  姓名 
|  password  string  是  密码

### 请求示例

```
{
    "account": "productmanager",
    "realname": "产品经理",
    "password": "123Qwe!@#"
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
    "id": 2
}
```
