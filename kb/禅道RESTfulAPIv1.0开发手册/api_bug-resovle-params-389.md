# 解决单个Bug可选信息

|  方法说明 
请求此方法，可以获取当前 Bug 详细信息以及确认 Bug 解决时可能用到的信息。
|  使用示例

```
public function getBugResolveParams()
{
    include_once('../vendor/zentao/zentao.php');
    $zentao      = new \zentao();
    $params      = array('bugID' => 14);    // 请求参数
    $extraFields = array('title', 'products', 'bug', 'users', 'builds', 'actions');    // 自定义返回字段
    $result      = $zentao->getBugResolveParams($params, $extraFields);
    return $result;
}
```

|  请求方式
 GET 
|  方法名称

getBugResolveParams 
|  请求参数

|  参数名称
 参数类型
 是否必填
 参数描述

|  bugID
 int  必填参数 Bug ID
|  响应结果
 success  error 
|  

```
{
    "status": 1,
    "msg": "success",
    "result": {
         //当前禅道项目导航位置
        "title": "禅道项目管理系统-PHP-SDK-解决",
        //已存在产品列表
        "products": {
            "1": "禅道项目管理系统-PHP-SDK"
        },
        //BUG详情【相关描述可参考 2.12 获取 BUG 列表】
        "bug": {
            "id": "5",
            "product": "1",
            "branch": "0",
            "module": "2",
            "project": "1",
            "plan": "0",
            "story": "0",
            "storyVersion": "1",
            "task": "0",
            "toTask": "0",
            "toStory": "0",
            "title": "添加bug测试二",
            "keywords": "修改bug",
            "severity": "2",
            "pri": "1",
            "type": "codeerror",
            "os": "windows",
            "browser": "ie11",
            "hardware": "",
            "found": "",
            "steps": "重现步骤描述添加bug测试二",
            "status": "active",
            "subStatus": "",
            "color": "#2dbdb2",
            "confirmed": "1",
            "activatedCount": "0",
            "activatedDate": "",
            "mailto": "lisi",
            "openedBy": "admin",
            "openedDate": "2019-11-21 16:45:13",
            "openedBuild": "trunk",
            "assignedTo": "lisi",
            "assignedDate": "2019-11-22 15:22:21",
            "deadline": "2019-11-21",
            "resolvedBy": "",
            "resolution": "",
            "resolvedBuild": "",
            "resolvedDate": "",
            "closedBy": "",
            "closedDate": "",
            "duplicateBug": "0",
            "linkBug": "",
            "case": "0",
            "caseVersion": "1",
            "result": "0",
            "testtask": "0",
            "lastEditedBy": "admin",
            "lastEditedDate": "2019-11-22 15:22:21",
            "deleted": "0",
            "projectName": "禅道系统 PHP-SDK 开发",
            "storyTitle": null,
            "storyStatus": null,
            "latestStoryVersion": null,
            "taskName": null,
            "planName": null,
            "toCases": [],
            "files": [],
            "delay": 1
        },
        //可用用户列表【用于指派】
        "users": {
            "_empty_": "",
            "admin": "A:admin",
            "lisi": "L:李四",
            "niuqi": "N:牛七",
            "wangwu": "W:王五",
            "zhangsan": "Z:张三",
            "zhapliu": "Z:赵六"
        },
        //当前可用版本【用于解决版本】
        "builds": {
            "_empty_": "",
            "trunk": "主干"
        },
        //当前 BUG 的操作记录
        "actions": {
            "791": {
                "id": "791",
                "objectType": "bug",
                "objectID": "5",
                "product": ",1,",
                "project": "1",
                "actor": "admin",
                "action": "bugconfirmed",
                "date": "2019-11-22 15:22:21",
                "comment": "",
                "extra": "",
                "read": "0",
                "history": [
                    {
                        "id": "216",
                        "action": "791",
                        "field": "confirmed",
                        "old": "0",
                        "new": "1",
                        "diff": ""
                    }
                ]
            }
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
