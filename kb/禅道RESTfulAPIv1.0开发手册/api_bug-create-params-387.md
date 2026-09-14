# 添加单个Bug可选信息

|  方法说明 
请求此方法，用于为指定的产品添加 Bug 之前，获取添加 Bug 时可能需要用到的一些相关信息。
|  使用示例

```
public function getBugCreateParams()
{
    include_once('../vendor/zentao/zentao.php');
    $zentao      = new \zentao();
    $params      = array('productID' => 1);    // 请求参数
    $extraFields = array('title', 'productID', 'productName', 'projects', 'moduleOptionMenu', 'users', 'stories', 'builds');    // 自定义返回字段
    $result      = $zentao->getBugCreateParams($params, $extraFields);
    return $result;
}
```

|  请求方式
 GET 
|  方法名称
 getBugCreateParams 
|  请求参数

|  参数名称
 参数类型
 是否必填
 参数描述

|  productID
 int  必填参数 所属产品 ID

|  响应结果
 success  error 
|  

```
{
    "status": 1,
    "msg": "success",
    "result": {
        //当前禅道项目导航位置
        "title": "禅道项目管理系统-PHP-SDK-提Bug",
        //当前产品ID
        "productID": 1, 
        //当前产品名称
        "productName": "禅道项目管理系统-PHP-SDK",
        //当前产品下的项目列表
        "projects": {
            "1": "禅道系统 PHP-SDK 开发",
            "_empty_": ""
        },
        //当前产品的模块列表
        "moduleOptionMenu": [
            "/",
            "/设计",
            "/开发",
            "/变更",
            "/测试"
        ],
        //可指派用户列表
        "users": {
            "_empty_": "",
            "lisi": "L:李四",
            "wangwu": "W:王五",
            "zhapliu": "Z:赵六",
            "admin": "A:admin",
            "niuqi": "N:牛七",
            "zhangsan": "Z:张三"
        },
        //当前产品需求列表
        "stories": {
            "1": "1:确认禅道PHP-SDK需求，创建PHP-SDK文件 (优先级:1,预计工时:4)",
            "2": "2:开发禅道SDK功能接口 (优先级:1,预计工时:24)",
            "_empty_": ""
        },
        //当前产品影响版本列表
        "builds": {
            "trunk": "主干"
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
