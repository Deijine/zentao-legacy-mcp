# 获得添加用户所用的参数列表

|  方法说明

添加用户时如果需要为新用户分配部门、职位、权限，请求该方法即可返回相关可用数据。
|  使用示例

```
public function getUserCreateParams()
{
    include_once('../vendor/zentao/zentao.php');
    $zentao      = new \zentao();
    $extraFields = array('title', 'depts', 'groupList', 'roleGroup');    // 返回自定义字段
    $result      = $zentao->getUserCreateParams(array(), $extraFields);
    return $result;
}
```

|  请求方式
 GET 
|  方法名称

getUserCreateParams 
|  请求参数

|  参数名称
 参数类型
 是否必填
 参数描述

|  无需传参  

 

|  响应结果
 success  error 
|  

```
{
    "status": 1,
    "msg": "success",
    "result": {
        //当前禅道项目导航位置
        "title": "组织视图-添加用户",
        //所属部门列表【添加部门传递key|用户所属部门】
        "depts": {
            "0": "/",
            "1": "/经理",
            "2": "/开发",
            "3": "/测试",
            "4": "/市场",
            "8": "/客户",
            "11": "/经理/产品经理",
            "12": "/经理/项目经理"
        },
        //权限分组列表【添加权限传递key|所属权限分组】
        "groupList": {
            "1": "管理员",
            "2": "研发",
            "3": "测试",
            "4": "项目经理",
            "5": "产品经理",
            "6": "研发主管",
            "7": "产品主管",
            "8": "测试主管",
            "9": "高层管理",
            "10": "其他",
            "11": "guest",
            "12": "受限用户"
        },
        //职位分组列表【职位对应权限分组|所属职位】
        "roleGroup": {
            "admin": "1",
            "dev": "2",
            "qa": "3",
            "pm": "4",
            "po": "5",
            "td": "6",
            "pd": "7",
            "qd": "8",
            "top": "9",
            "others": "10",
            "guest": "11",
            "limited": "12"
        }
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
