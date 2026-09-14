# 获取用户列表

GET/users

##  获取用户列表 

### 请求URL
https://xxx.com/api.php/v2/users

### 请求头
|  名称  类型  必填  描述
|  token  string  是  访问凭证Token

### 请求参数
|  名称  必填  描述
|  browseType  否  内部用户 inside | 内部用户 outside 
|  orderBy  否  排序(id_asc | realname_asc 姓名 | account_asc 用户名)，倒序使用id_desc, realname_desc, account_desc 
|  recPerPage  否  每页数量，不超过1000 
|  pageID  否  页码，从第1页开始

### 请求响应
|  名称  类型  描述
|  status  string  状态(success 成功 | fail 失败) 
|  users  array  用户 
|     ∟  id  string  用户编号 
|     ∟  company  string  所属公司 
|     ∟  type  string  用户类型 
|     ∟  dept  string  部门 
|     ∟  account  string  用户名 
|     ∟  role  string  职位 
|     ∟  realname  string  姓名 
|     ∟  superior  string  
|     ∟  pinyin  string  
|     ∟  nickname  string  昵称 
|     ∟  commiter  string  源代码帐号 
|     ∟  avatar  string  用户头像 
|     ∟  birthday  string  生日 
|     ∟  gender  string  性别 
|     ∟  email  string  邮箱 
|     ∟  skype  string  Skype 
|     ∟  qq  string  QQ 
|     ∟  mobile  string  手机 
|     ∟  phone  string  电话 
|     ∟  weixin  string  微信 
|     ∟  dingding  string  钉钉 
|     ∟  slack  string  Slack 
|     ∟  whatsapp  string  WhatsApp 
|     ∟  address  string  通讯地址 
|     ∟  zipcode  string  邮编 
|     ∟  nature  string  性格特征 
|     ∟  analysis  string  影响分析 
|     ∟  strategy  string  应对策略 
|     ∟  join  string  入职日期 
|     ∟  visits  string  访问次数 
|     ∟  visions  string  界面类型 
|     ∟  ip  string  最后IP 
|     ∟  last  string  最后登录 
|     ∟  fails  string  失败次数 
|     ∟  locked  string  锁住日期 
|     ∟  feedback  string  
|     ∟  ranzhi  string  ZDOO帐号 
|     ∟  ldap  string  
|     ∟  score  string  积分 
|     ∟  scoreLevel  string  积分等级 
|     ∟  resetToken  string  
|     ∟  resetExpired  string  
|     ∟  clientStatus  string  登录状态 
|     ∟  clientLang  string  客户端语言 
|     ∟  deleted  string  (已删除)

### 响应示例

```
{
    "status": "success",
    "users": [
        {
            "id": "1",
            "company": "0",
            "type": "inside",
            "dept": "0",
            "account": "admin",
            "role": "",
            "realname": "admin",
            "superior": "",
            "pinyin": "",
            "nickname": "",
            "commiter": "",
            "avatar": "",
            "birthday": "",
            "gender": "f",
            "email": "",
            "skype": "",
            "qq": "",
            "mobile": "",
            "phone": "",
            "weixin": "",
            "dingding": "",
            "slack": "",
            "whatsapp": "",
            "address": "",
            "zipcode": "",
            "nature": "",
            "analysis": "",
            "strategy": "",
            "join": "",
            "visits": "2",
            "visions": "or,rnd,lite",
            "ip": "10.0.7.242",
            "last": "2026-03-25 09:11:18",
            "fails": "0",
            "locked": "",
            "feedback": "0",
            "ranzhi": "",
            "ldap": "",
            "score": "0",
            "scoreLevel": "0",
            "resetToken": "",
            "resetExpired": "0",
            "clientStatus": "offline",
            "clientLang": "zh-cn",
            "deleted": "0"
        },
        {
            "id": "2",
            "company": "0",
            "type": "inside",
            "dept": "0",
            "account": "productmanager",
            "role": "",
            "realname": "技术经理",
            "superior": "",
            "pinyin": "",
            "nickname": "",
            "commiter": "",
            "avatar": "",
            "birthday": "",
            "gender": "m",
            "email": "test@test.com",
            "skype": "",
            "qq": "",
            "mobile": "13812345678",
            "phone": "",
            "weixin": "15512345678",
            "dingding": "",
            "slack": "",
            "whatsapp": "",
            "address": "",
            "zipcode": "",
            "nature": "",
            "analysis": "",
            "strategy": "",
            "join": "2025-01-01",
            "visits": "0",
            "visions": "rnd",
            "ip": "",
            "last": "",
            "fails": "0",
            "locked": "",
            "feedback": "0",
            "ranzhi": "",
            "ldap": "",
            "score": "0",
            "scoreLevel": "0",
            "resetToken": "",
            "resetExpired": "0",
            "clientStatus": "offline",
            "clientLang": "zh-cn",
            "deleted": "0"
        }
    ]
}
```
