# 修改用户信息

PUT/users/:userID

##  修改用户信息 

### 请求URL
https://xxx.com/api.php/v2/users/:userID

### 请求头
|  名称  类型  必填  描述
|  token  string  是  访问凭证Token

### 请求体
|  名称  类型  必填  描述
|  realname  string  否  真实姓名 
|  dept  int  否  部门 
|  join  date  否  入职日期 
|  group  array  否  权限分组 
|  email  string  否  邮箱 
|  visions  array  否  界面类型(研发综合界面 rnd | 运营管理界面 lite) 
|  mobile  string  否  手机 
|  weixin  string  否  微信 
|  password  string  否  密码

### 请求示例

```
{
    "realname": "技术经理",
    "dept": "0",
    "join": "2025-01-01",
    "group": [
        1
    ],
    "email": "test@test.com",
    "visions": [
        "rnd"
    ],
    "mobile": "13812345678",
    "weixin": "15512345678",
    "password": "P@ssw0rd"
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
