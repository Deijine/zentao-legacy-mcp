# 获取Bug列表

|  方法说明 
请求此方法，可以获取不同产品下的 Bug 列表，Bug 列表可以根据不同状态进行筛选。
|  使用示例

```
public function getBugList()
{
    include_once('../vendor/zentao/zentao.php');
    $zentao      = new \zentao();
    $params      = array('productID' => 1, 'branch' => 0, 'browseType' => 'unresolved');    // 请求参数
    $extraFields = array('title', 'products', 'productID', 'productName', 'product', 'moduleName', 'modules', 'browseType', 'bugs');    // 自定义返回字段
    $result      = $zentao->getBugList($params, $extraFields);
    return $result;
}
```

|  请求方式
 GET 
|  方法名称

getBugList 
|  请求参数

|  参数名称
 参数类型
 是否必填
 参数描述

|  productID
 int  必填参数 产品ID

|  branch
 int  必填参数 分支ID【默认为0】

|  browseType
 string
 选填参数  选填参数|Bug状态【all所有|unclosed未关闭|openedbyme由我创建|assigntome指派给我|resolvedbyme由我解决|toclosed待关闭|unresolved未解决|unconfirmed未确认|longlifebugs久未处理|postponedbugs被延期|overduebugs过期BUG|needconfirm需求变动】

|  响应结果
 success  error 
|  

```
{
    "status": 1,
    "msg": "success",
    "result": {
        //当前禅道项目导航位置
        "title": "禅道项目管理系统-PHP-SDK-Bug",
        //已有产品名称列表
        "products": {
            "1": "禅道项目管理系统-PHP-SDK",
            "2": "产品二",
            "3": "产品三",
            "4": "产品四",
            "5": "产品五",
            "6": "产品六",
            "9": "产品100"
        },
        //当前产品ID
        "productID": 1,
        //当前产品名称
        "productName": "禅道项目管理系统-PHP-SDK",
        //当前产品详情
        "product": {
            "id": "1",
            "name": "禅道项目管理系统-PHP-SDK",
            "code": "001",
            "line": "0",
            "type": "normal",
            "status": "normal",
            "subStatus": "",
            "desc": "开发禅道PHP开发语言的SDK，以方便开发人员能快速来创建和使用禅道系统所提供的服务，同时减少开发者的学习成本和时间。",
            "PO": "admin",
            "QD": "admin",
            "RD": "admin",
            "acl": "open",
            "whitelist": "",
            "createdBy": "admin",
            "createdDate": "2019-11-11 12:22:29",
            "createdVersion": "11.6.4",
            "order": "5",
            "deleted": "0"
        },
        //当前产品模块
        "moduleName": "所有模块",
        //当前产品模块列表
        "modules": [
            "/",
            "/设计",
            "/开发",
            "/变更",
            "/测试"
        ],
        //当前 BUG 状态
        "browseType": "unclosed",
        //当前状态下的 BUG 列表
        "bugs": [
            {
                "id": "7",//BUG ID
                "product": "1",//所属产品ID
                "branch": "0",//所属分支ID
                "module": "2",//所属模块ID
                "project": "1",//所属项目ID
                "plan": "0",//j所属计划ID
                "story": "0",
                "storyVersion": "1",
                "task": "0",
                "toTask": "0",
                "toStory": "0",
                "title": "添加bug测试三",//BUG 标题
                "keywords": "修改bug",//BUG 关键词
                "severity": "2",//严重程度
                "pri": "1",//优先程度
                "type": "codeerror",//BUG 类型
                "os": "windows",//操作系统
                "browser": "ie11",//浏览器
                "hardware": "",
                "found": "",
                "steps": "重现步骤描述添加bug测试三",//重现步骤描述
                "status": "active",//BUG 状态【active激活|resolved已解决|closed已关闭】
                "subStatus": "",
                "color": "#2dbdb2",//BUG颜色
                "confirmed": "0",//是否确认
                "activatedCount": "0",
                "activatedDate": "0000-00-00 00:00:00",
                "mailto": "zhangsan",
                "openedBy": "admin",
                "openedDate": "2019-11-21 16:45:58",
                "openedBuild": "主干",
                "assignedTo": "zhangsan",
                "assignedDate": "2019-11-21 16:45:58",
                "deadline": "2019-11-21",
                "resolvedBy": "",
                "resolution": "",
                "resolvedBuild": "",
                "resolvedDate": "0000-00-00 00:00:00",
                "closedBy": "",
                "closedDate": "0000-00-00 00:00:00",
                "duplicateBug": "0",
                "linkBug": "",
                "case": "0",
                "caseVersion": "1",
                "result": "0",
                "testtask": "0",
                "lastEditedBy": "",
                "lastEditedDate": "0000-00-00 00:00:00",
                "deleted": "0",
                "delay": 1,
                "needconfirm": false
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
