# 添加单个产品可选信息

|  方法说明 
请求此方法，可以获取添加产品时所需要一些数据，例如产品线数据列表、产品负责人数据列表等数据，添加产品时，可以为其绑定这些信息。
|  使用示例

```
public function getProductCreateParams()
{
    include_once('../vendor/zentao/zentao.php');
    $zentao      = new \zentao();
    $extraFields = array('title', 'products', 'lines', 'poUsers', 'qdUsers', 'rdUsers', 'groups');    //自定义返回字段
    $result      = $zentao->getProductCreateParams(array(), $extraFields);
    return $result;
}
```

|  请求方式
 GET 
|  方法名称

getProductCreateParams 
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
        "title": "添加产品",
        //已添加的产品列表
        "products": {
            "1": "禅道项目管理系统-PHP-SDK",
            "2": "产品二",
            "3": "产品三",
            "4": "产品四",
            "5": "产品五",
            "6": "产品六"
        },
        //产品线列表
        "lines": {
            "0": "",
            "5": "产品线一",
            "6": "产品线二",
            "7": "产品线三"
        },
        //产品负责人列表
        "poUsers": {
            "_empty_": "",
            "zhangsan": "Z:张三",
            "admin": "A:admin",
            "lisi": "L:李四",
            "niuqi": "N:牛七",
            "wangwu": "W:王五",
            "zhapliu": "Z:赵六"
        },
        //测试负责人列表
        "qdUsers": {
            "_empty_": "",
            "zhapliu": "Z:赵六",
            "admin": "A:admin",
            "lisi": "L:李四",
            "niuqi": "N:牛七",
            "wangwu": "W:王五",
            "zhangsan": "Z:张三"
        },
        //发布负责人列表
        "rdUsers": {
            "_empty_": "",
            "wangwu": "W:王五",
            "zhapliu": "Z:赵六",
            "lisi": "L:李四",
            "admin": "A:admin",
            "niuqi": "N:牛七",
            "zhangsan": "Z:张三"
        },
        //分组白名单列表
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
