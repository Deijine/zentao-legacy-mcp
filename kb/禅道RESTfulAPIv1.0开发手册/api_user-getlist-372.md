# 获取用户列表

|  方法说明 
请求此方法，可以根据不同的部门获取该部门下的用户列表信息。
|  使用示例

```
public function getUserList()
{
    include_once('../vendor/zentao/zentao.php');
    $zentao      = new \zentao();
    $params      = array('deptID' => 1);    // 请求参数
    $extraFields = array('title', 'users');    // 自定义返回字段
    $result      = $zentao->getUserList($params, $extraFields);
    return $result;
}
```

|  请求方式  GET 
|  方法名称  
getUserList 
|  请求参数  
|  参数名称  参数类型  是否必填  参数描述 
|  
deptID  int  选填参数  
某部门ID
|  响应结果
 success  error 
|  

```
{
    "status": 1,
    "msg": "success",
    "result": {
        //当前禅道项目导航位置
        "title": "组织视图首页-部门结构",
        //某个部门所属用户详情列表【不传参则列出所有用户详情列表】
        "users": [
            {
                "id": "16",//用户ID
                "dept": "48",//部门ID
                "account": "Jack6",//用户账号
                "role": "dev",//用户权限
                "realname": "jack6",//真实姓名
                "nickname": "",//用户昵称
                "commiter": "http://jack2019.com",
                "avatar": "",
                "birthday": "0000-00-00",//生日日期
                "gender": "m",//性别【m男/f女】
                "email": "jack2019@gmail.com",//邮箱地址
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
                "join": "2019-11-11",//入职日期
                "visits": "0",
                "ip": "",
                "last": "0",
                "fails": "0",
                "locked": "0000-00-00 00:00:00",
                "ranzhi": "",
                "score": "0",
                "scoreLevel": "0",
                "deleted": "0",
                "clientStatus": "offline",
                "clientLang": "zh-cn"
            }
        ]
    }
}
```

```
{
    "status": 0,
    "msg": "error",
    "result": []
}
```
