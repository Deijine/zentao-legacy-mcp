# 添加单个用户

|  方法说明

请求此方法，用于新增一个新用户。新用户添加可以设定所属部门、职位、权限等信息。选填参数可以先不填。
|  使用示例

```
public function addUser()
{
    include_once('../vendor/zentao/zentao.php');
    $zentao = new zentao();
    $params = array(
        'dept'      => 1,
        'account'   => 'Jack10',
        'password1' => '123456',
        'password2' => '123456',
        'realname'  => 'Jack10',
        'join'      => '2019-11-11',
        'role'      => 'dev',
        'group'     => 2,
        'email'     => 'jack2019@gmail.com',
        'commiter'  => 'http://jack2019.com',
        'gender'    => 'm'
    );    // 请求参数
    $result = $zentao->addUser($params);
    return $result;
}
```

|  请求方式
 POST 
|  方法名称
 addUser 
|  请求参数

|  参数名称
 参数类型
 是否必填
 参数描述

|  dept
 int  选填参数  所属部门【部门ID】

|  account
 string  必填参数  用户名

|  password1
 string  必填参数  密码

|  password2
 string
 必填参数
 重复密码

|  realname
 string  必填参数  真实姓名

|  join
 string  选填参数
 入职日期【格式：2019-11-19】

|  role  string  选填参数  职位【权限标识，例如：'dev','qd'】

|  group  int  选填参数  权限分组【分组ID】

|  email  string  选填参数  邮箱

|  commiter
 string  选填参数  源代码账号

|  gender  string  选填参数  性别【m:男|f:女】

|  响应结果
 success  error 
|  { "status": 1, "msg": "success", "result": "保存成功" }
 { "status": 0, "msg": "error", "result": { "account": [ "『用户名』已经有『ly0011』这条记录了。如果您确定该记录已删除，请到后台-数据-回收站还原。" ] } }
