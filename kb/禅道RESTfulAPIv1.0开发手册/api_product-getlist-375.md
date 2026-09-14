# 获取产品列表

|  方法说明 请求此方法，可以获取所有未关闭的产品详情信息和所有产品名称。

|  使用示例

```
public function getProductList()
{
    include_once('../vendor/zentao/zentao.php');
    $zentao      = new \zentao();
    $extraFields = array('title', 'products', 'productStats');    // 自定义返回字段
    $result      = $zentao->getProductList(array(), $extraFields);
    return $result;
}
```

|  请求方式
 GET 
|  方法名称
 getProductList

|  请求参数
 此接口无需传参 
|  响应结果
 success  

```
{
    "status": 1,
    "msg": "success",
    "result": {
        //当前禅道项目导航位置
        "title": "全部产品",
        //所有产品列表名称
        "products": {
            "1": "禅道项目管理系统",
            "2": "产品二",
            "3": "产品三",
            "4": "产品四",
            "5": "产品五",
            "6": "产品六"
        },
        //未关闭产品列表详情
        "productStats": [
            {
                "id": "6",//产品ID
                "name": "产品六",//产品名称
                "code": "cp6",//产品代号
                "line": "0",//产品线
                "type": "branch",//产品类型【normal正常|branch多分支|platform多平台】
                "status": "normal",//产品状态
                "subStatus": "",
                "desc": "产品六产品六产品六产品六产品六产品六产品六产品六",//产品描述
                "PO": "lisi",//产品负责人
                "QD": "zhapliu",//测试负责人
                "RD": "zhapliu",//发布负责人
                "acl": "open",//访问控制【open默认|private私有|custom白名单】
                "whitelist": "",//访问白名单列表
                "createdBy": "admin",//创建者账号
                "createdDate": "2019-11-19 18:41:02",//创建者时间
                "createdVersion": "11.6.4",//禅道当前版本
                "order": "30",//排序
                "deleted": "0",//是否删除【0否1是】
                "stories": {
                    "0": "",
                    "1": "draft",
                    "2": "active",
                    "3": "closed",
                    "4": "changed",
                    "_empty_": 0,
                    "draft": 0,//草稿需求
                    "active": 0,//激活需求
                    "closed": 0,//已关闭需求
                    "changed": 0//已变更需求
                },
                "plans": 0,//计划数
                "releases": 0,//发布数
                "bugs": 0,//Bug数
                "unResolved": 0,//未解决Bug
                "assignToNull": 0//未指派Bug
            }
        ]
    }
}
```

|  error  

```
{
    "status": 0,
    "msg": "error",
    "result": []
}
```
