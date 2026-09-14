# 添加单个项目可选信息

|  方法说明 
请求此方法，获取正常状态产品列表信息，用于添加项目时为其绑定产品，从而用于项目与产品需求关联。还可获取权限分组列表，用于项目绑定访问控制权限。
|  使用示例  

```
public function getProjectCreateParams()
{
    include_once('../vendor/zentao/zentao.php');
    $zentao      = new \zentao();
    $extraFields = array('title', 'projects', 'groups', 'allProducts');
    $result      = $zentao->getProjectCreateParams(array(), $extraFields);    // 自定义返回字段
    return $result;
}
```

|  请求方式  GET 
|  方法名称  
getProjectCreateParams 
|  请求参数  
|  参数名称  参数类型  是否必填  参数描述 
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
        "title": "添加项目",
        //已添加的项目列表
        "projects": {
            "1": "禅道系统 PHP-SDK 开发",
            "2": "淘宝项目开发",
            "3": "天猫项目开发",
            "_empty_": ""
        },
        //权限分组列表
        "groups": {
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
        //可关联产品列表
        "allProducts": {
            "0": "",
            "1": "禅道项目管理系统-PHP-SDK",
            "2": "产品二",
            "4": "产品四",
            "5": "产品五",
            "6": "产品六",
            "9": "产品100"
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
